import * as fs from 'node:fs';
import * as path from 'node:path';
import * as Log from 'logger';
import * as NodeHelper from 'node_helper';
import { SocketNotifications } from '../constants/socket-notifications';
import type {
  Chore,
  DailyCompletion,
  FamilyChoresData,
  Person,
  Settings,
} from '../types/chore-types';
import type { Config } from '../types/config';
import type {
  CaughtUpResetPayload,
  CaughtUpResetResultPayload,
  ChoreReassignPayload,
  ChoreReassignResultPayload,
  ChoreTogglePayload,
  ChoreUpdateResultPayload,
  NodeHelperIncomingSocketPayload,
  PinErrorPayload,
} from '../types/socket-payload-types';
import { getLocalDateString, getLocalDayName, getLocalTimeString } from '../utils/date';
import { generateUUID } from '../utils/uuid';
import { createAdminHandlers } from './admin-routes';
import {
  validateChore,
  validateDailyCompletion,
  validatePerson,
  validateSettings,
} from './validator';

interface FamilyChoresNodeHelper extends Partial<NodeHelper.NodeHelperModule> {
  // Module state
  choreData: FamilyChoresData | null;
  config: Config | null;

  // Custom methods
  setupAdminRoutes(): void;
  loadChoreData(): void;
  saveChoreData(): void;
  createDefaultData(): FamilyChoresData;
  checkAndPerformDailyReset(): void;
  transitionChoresForNewDay(): void;
  handleChoreToggle(payload: ChoreTogglePayload): void;
  handleChoreReassign(payload: ChoreReassignPayload): void;
  handleCaughtUpReset(payload: CaughtUpResetPayload): void;
  logIncompleteChore(chore: Chore, date: string): void;
}

const nodeHelper: FamilyChoresNodeHelper = {
  // Module state
  choreData: null as FamilyChoresData | null,
  config: null as Config | null,

  /**
   * MM function: called when the node helper starts
   */
  start(): void {
    Log.info(`Starting node helper for MMM-FamilyChores`);
    this.setupAdminRoutes();
  },

  /**
   * MM function: called when a socket notification arrives from the module
   */
  socketNotificationReceived(
    notificationIdentifier: string,
    payload: NodeHelperIncomingSocketPayload
  ): void {
    Log.debug(`Node helper received: '${notificationIdentifier}'`);

    switch (notificationIdentifier) {
      case SocketNotifications.CONFIG_REQUEST:
        this.config = payload as Config;
        this.loadChoreData();
        break;
      case SocketNotifications.CHORE_TOGGLE:
        this.handleChoreToggle(payload as ChoreTogglePayload);
        break;
      case SocketNotifications.CHORE_REASSIGN:
        this.handleChoreReassign(payload as ChoreReassignPayload);
        break;
      case SocketNotifications.CAUGHTUP_RESET:
        this.handleCaughtUpReset(payload as CaughtUpResetPayload);
        break;
      default:
        Log.warn(`Node helper received unknown notification: '${notificationIdentifier}'`);
    }
  },

  /**
   * Load chore data from file
   */
  loadChoreData(): void {
    if (!this.config) {
      Log.error('Config not set, cannot load chore data');
      return;
    }

    const dataPath = path.resolve(__dirname, this.config.dataFile || 'data.json');

    try {
      if (fs.existsSync(dataPath)) {
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        const rawData = JSON.parse(fileContent) as Record<string, unknown>;

        // Validate and filter people, skipping any with invalid data
        const rawPeople = Array.isArray(rawData.people) ? rawData.people : [];
        const validPeople: Person[] = [];
        for (const person of rawPeople) {
          const result = validatePerson(person);
          if (result.valid) {
            validPeople.push(person as Person);
          } else {
            Log.warn(`Skipping invalid person in data file: ${result.error}`);
          }
        }

        // Validate and filter chores against valid people, skipping any with invalid data
        const rawChores = Array.isArray(rawData.chores) ? rawData.chores : [];
        const validChores: Chore[] = [];
        for (const chore of rawChores) {
          const result = validateChore(chore, validPeople);
          if (result.valid) {
            validChores.push(chore as Chore);
          } else {
            Log.warn(`Skipping invalid chore in data file: ${result.error}`);
          }
        }

        // Validate settings, use defaults if invalid
        const rawSettings = rawData.settings;
        const settingsResult = validateSettings(rawSettings);
        let settings: Settings;
        if (settingsResult.valid) {
          settings = rawSettings as Settings;
        } else {
          Log.warn(`Invalid settings in data file, using defaults: ${settingsResult.error}`);
          settings = { dailyResetTime: '03:00', historyEnabled: true };
        }

        // Validate and filter daily completions against valid chores
        const rawCompletions = Array.isArray(rawData.dailyCompletions)
          ? rawData.dailyCompletions
          : [];
        const validCompletions: DailyCompletion[] = [];
        for (const completion of rawCompletions) {
          const result = validateDailyCompletion(completion, validChores);
          if (result.valid) {
            validCompletions.push(completion as DailyCompletion);
          } else {
            Log.warn(`Skipping invalid daily completion in data file: ${result.error}`);
          }
        }

        this.choreData = {
          people: validPeople,
          chores: validChores,
          dailyCompletions: validCompletions,
          lastResetDate:
            typeof rawData.lastResetDate === 'string' ? rawData.lastResetDate : undefined,
          settings,
        };
        Log.info(`Loaded chore data from ${dataPath}`);
      } else {
        // Create default data structure
        this.choreData = this.createDefaultData();
        this.saveChoreData();
        Log.info(`Created default chore data at ${dataPath}`);
      }

      // Check if daily reset is needed before sending data
      this.checkAndPerformDailyReset();
      this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
    } catch (error) {
      Log.error(`Error loading chore data: ${error}`);
      this.choreData = this.createDefaultData();
      this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
    }
  },

  saveChoreData(): void {
    if (!this.config || !this.choreData) {
      Log.error('Config or chore data not set, cannot save');
      return;
    }

    const dataPath = path.resolve(__dirname, this.config.dataFile || 'data.json');

    try {
      fs.writeFileSync(dataPath, JSON.stringify(this.choreData, null, 2), 'utf8');
      Log.info(`Saved chore data to ${dataPath}`);
    } catch (error) {
      Log.error(`Error saving chore data: ${error}`);
    }
  },

  /**
   * Create default empty data structure
   */
  createDefaultData(): FamilyChoresData {
    return {
      people: [],
      chores: [],
      dailyCompletions: [],
      // Initialize to today to prevent immediate rotation
      lastResetDate: getLocalDateString(),
      settings: {
        dailyResetTime: '03:00',
        historyEnabled: true,
      },
    };
  },

  /**
   * Check if daily reset should be performed and execute if needed
   */
  checkAndPerformDailyReset(): void {
    if (!this.choreData) return;

    // Get current local date and time
    const todayDateString = getLocalDateString();
    const currentTimeString = getLocalTimeString();

    if (this.choreData.lastResetDate && todayDateString <= this.choreData.lastResetDate) {
      // already run today
      return;
    }
    const dailyResetTime = this.choreData.settings?.dailyResetTime || '03:00';

    if (currentTimeString < dailyResetTime) {
      // not time yet - NOTE: if we skipped an entire day, we still wait for the reset time to pass
      return;
    }
    Log.info(
      `Daily reset triggered for ${getLocalDateString()} at ${currentTimeString}, reset time: ${dailyResetTime}`
    );
    this.transitionChoresForNewDay();
    // Cleanup daily completions older than 14 days
    this.cleanupOldDailyCompletions();
    this.choreData.lastResetDate = getLocalDateString();
    this.saveChoreData();
  },
  /**
   * Transitions chore state for a new day.
   *
   * Updates caughtUp status, clears completedToday, and rotates chores as needed.
   * Does NOT guard against multiple executions in the same day.
   *
   * See {@link checkAndPerformDailyReset} for the guard.
   */
  transitionChoresForNewDay() {
    if (!this.choreData) return;

    const todayDayName = getLocalDayName();

    // Compute yesterday's date for logging incomplete chores (the day that's ending)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateString = getLocalDateString(yesterday);
    const yesterdayDayName = getLocalDayName(yesterday);

    // Phase 1: Close out yesterday — log history and set caughtUp
    for (const chore of this.choreData.chores) {
      const skipDays = chore.skipDays ?? [];
      const isYesterdaySkipDay = skipDays.includes(yesterdayDayName);

      // Log incomplete chore to history if yesterday was not a skip day
      if (!isYesterdaySkipDay && !chore.completedToday) {
        this.logIncompleteChore(chore, yesterdayDateString);
      }

      // Transition from yesterday
      chore.caughtUp = chore.completedToday === true;
    }

    // Phase 2: Set up today — handle skip days, reset completedToday, rotate
    for (const chore of this.choreData.chores) {
      const skipDays = chore.skipDays ?? [];
      const isTodaySkipDay = skipDays.includes(todayDayName);

      if (isTodaySkipDay) {
        // skip day - don't reset completedToday or rotate
        continue;
      }

      // reset completedToday for the new day
      chore.completedToday = false;
      // rotate if needed
      if (chore.caughtUp && chore.type === 'rotating') {
        chore.rotatingIndex = ((chore.rotatingIndex ?? 0) + 1) % (chore.rotation ?? []).length;
      }
    }

    Log.info('Daily reset performed - completedToday cleared, caughtUp status updated');
  },

  /**
   * Clean up old daily completion records (older than 14 days)
   */
  cleanupOldDailyCompletions(): void {
    if (!this.choreData?.dailyCompletions || !this.choreData.settings?.historyEnabled) return;

    const retentionDays = 14;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffDateString = getLocalDateString(cutoffDate);

    const initialCount = this.choreData.dailyCompletions.length;
    this.choreData.dailyCompletions = this.choreData.dailyCompletions.filter(
      (dc) => dc.date >= cutoffDateString
    );

    if (this.choreData.dailyCompletions.length < initialCount) {
      Log.info(
        `Cleaned up ${initialCount - this.choreData.dailyCompletions.length} old daily completion records (retention: ${retentionDays} days)`
      );
    }
  },

  // Handle chore toggle
  handleChoreToggle(payload: ChoreTogglePayload): void {
    if (!this.choreData) return;

    const chore = this.choreData.chores.find((c: Chore) => c.id === payload.choreId);
    if (!chore) {
      Log.error(`Chore not found: ${payload.choreId}`);
      return;
    }

    // Early exit: check if state is already as requested
    const isCurrentlyCompleted = chore.completedToday === true;
    if (isCurrentlyCompleted === payload.completed) {
      Log.debug(`Chore ${payload.choreId} is already in desired state, skipping update`);
      return;
    }

    chore.completedToday = payload.completed;
    // Note: we do NOT change caughtUp here - it stays as-is

    // Track daily completion if history is enabled
    if (this.choreData.settings?.historyEnabled) {
      let personId: string | undefined;
      if (chore.type === 'personal') {
        personId = chore.assignedTo;
      } else if (chore.type === 'rotating') {
        personId = chore.rotation[chore.rotatingIndex ?? 0];
      }

      const todayDate = getLocalDateString();
      const todayDayName = getLocalDayName();
      const _isSkipDay = (chore.skipDays ?? []).includes(todayDayName);

      if (payload.completed && personId) {
        // Create daily completion record
        const currentTime = new Date();
        const currentTimeString = getLocalTimeString();
        const wasLate = !!chore.deadline && currentTimeString > chore.deadline;

        const dailyCompletion = {
          id: generateUUID(),
          date: todayDate,
          personId,
          choreId: chore.id,
          completed: true,
          completedAt: getLocalTimeString(currentTime),
          wasLate,
        };

        this.choreData.dailyCompletions.push(dailyCompletion);
      } else if (!payload.completed && personId) {
        // Delete daily completion record for this day/person/chore
        const index = this.choreData.dailyCompletions.findIndex(
          (dc) => dc.date === todayDate && dc.personId === personId && dc.choreId === chore.id
        );
        if (index !== -1) {
          this.choreData.dailyCompletions.splice(index, 1);
        }
      }
    }

    this.saveChoreData();
    const updateResult: ChoreUpdateResultPayload = {
      choreId: payload.choreId,
      completed: payload.completed,
    };
    this.sendSocketNotification?.(SocketNotifications.CHORE_UPDATE_RESULT, updateResult);
    this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
  },

  // Handle chore reassignment
  handleChoreReassign(payload: ChoreReassignPayload): void {
    if (!this.choreData) return;

    if (this.config?.adminPin && payload.pin !== this.config.adminPin) {
      const pinError: PinErrorPayload = { message: 'Invalid PIN' };
      this.sendSocketNotification?.(SocketNotifications.PIN_ERROR, pinError);
      return;
    }

    const chore = this.choreData.chores.find((c: Chore) => c.id === payload.choreId);
    if (!chore) {
      Log.error(`Chore not found: ${payload.choreId}`);
      return;
    }

    // Early exit: check if assignment is already as requested
    let currentAssignment: string | undefined;
    if (chore.type === 'personal') {
      currentAssignment = chore.assignedTo;
    } else if (chore.type === 'rotating' && chore.rotation) {
      const currentIndex = chore.rotatingIndex ?? 0;
      currentAssignment = chore.rotation[currentIndex];
    }

    if (currentAssignment === payload.newPersonId) {
      Log.debug(
        `Chore ${payload.choreId} is already assigned to ${payload.newPersonId}, skipping reassignment`
      );
      return;
    }

    if (chore.type === 'personal') {
      chore.assignedTo = payload.newPersonId;
    } else if (chore.type === 'rotating' && chore.rotation) {
      const currentIndex = chore.rotation.indexOf(payload.newPersonId);
      if (currentIndex !== -1) {
        chore.rotatingIndex = currentIndex;
      }
    }

    this.saveChoreData();
    const reassignResult: ChoreReassignResultPayload = {
      choreId: payload.choreId,
      newPersonId: payload.newPersonId,
    };
    this.sendSocketNotification?.(SocketNotifications.CHORE_REASSIGN_RESULT, reassignResult);
    this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
  },

  // Handle caughtUp reset for a person (admin only - PIN protected)
  handleCaughtUpReset(payload: CaughtUpResetPayload): void {
    if (!this.choreData) return;

    if (this.config?.adminPin && payload.pin !== this.config.adminPin) {
      const pinError: PinErrorPayload = { message: 'Invalid PIN' };
      this.sendSocketNotification?.(SocketNotifications.PIN_ERROR, pinError);
      return;
    }

    // Find all chores assigned to this person and reset their caughtUp status
    let resetCount = 0;
    for (const chore of this.choreData.chores) {
      let isAssignedToPerson = false;
      if (chore.type === 'personal') {
        isAssignedToPerson = chore.assignedTo === payload.personId;
      } else if (chore.type === 'rotating' && chore.rotation) {
        const currentIndex = chore.rotatingIndex ?? 0;
        isAssignedToPerson = chore.rotation[currentIndex] === payload.personId;
      }

      if (isAssignedToPerson) {
        chore.caughtUp = true;
        resetCount++;
      }
    }

    Log.info(`Reset caughtUp status for person ${payload.personId}, affected ${resetCount} chores`);

    this.saveChoreData();
    const caughtUpResult: CaughtUpResetResultPayload = {
      personId: payload.personId,
      resetCount,
    };
    this.sendSocketNotification?.(SocketNotifications.CAUGHTUP_RESET_RESULT, caughtUpResult);
    this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
  },

  /**
   * Logs an incomplete chore to the daily completion history
   */
  logIncompleteChore(chore: Chore, date: string): void {
    if (!this.choreData?.settings?.historyEnabled) return;

    let personId: string;

    if (chore.type === 'personal') {
      personId = chore.assignedTo;
    } else {
      // rotating chore
      const rotation = chore.rotation ?? [];
      const rotatingIndex = chore.rotatingIndex ?? 0;
      personId = rotation[rotatingIndex] ?? '';
    }

    if (!personId) return;

    const completion: DailyCompletion = {
      id: generateUUID(),
      date,
      personId,
      choreId: chore.id,
      completed: false,
      wasLate: false,
    };

    this.choreData.dailyCompletions.push(completion);
  },

  // Setup admin interface routes using official MagicMirror pattern
  setupAdminRoutes(): void {
    const handlers = createAdminHandlers({
      getChoreData: () => this.choreData,
      setChoreData: (data) => {
        this.choreData = data;
      },
      saveChoreData: () => this.saveChoreData(),
      sendNotification: (notification, payload) =>
        this.sendSocketNotification?.(notification, payload),
    });

    this.expressApp?.get('/MMM-FamilyChores/data', handlers.getData);
    this.expressApp?.post('/MMM-FamilyChores/people', handlers.postPerson);
    this.expressApp?.put('/MMM-FamilyChores/people/:id', handlers.putPerson);
    this.expressApp?.delete('/MMM-FamilyChores/people/:id', handlers.deletePerson);
    this.expressApp?.post('/MMM-FamilyChores/chores', handlers.postChore);
    this.expressApp?.put('/MMM-FamilyChores/chores/:id', handlers.putChore);
    this.expressApp?.delete('/MMM-FamilyChores/chores/:id', handlers.deleteChore);
    this.expressApp?.get('/MMM-FamilyChores/backup', handlers.getBackup);
    this.expressApp?.post('/MMM-FamilyChores/restore', handlers.postRestore);
    this.expressApp?.post('/MMM-FamilyChores/copy-chores', handlers.postCopyChores);
    this.expressApp?.put('/MMM-FamilyChores/settings', handlers.putSettings);

    Log.info('Admin routes configured for MMM-FamilyChores');
  },
};

export default NodeHelper.create(nodeHelper);
