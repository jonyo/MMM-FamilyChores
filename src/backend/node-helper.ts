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
import { TimeFormat } from '../types/chore-types';
import type { Config } from '../types/config';
import type {
  ChoreTogglePayload,
  ChoreUpdateResultPayload,
  NodeHelperIncomingSocketPayload,
} from '../types/socket-payload-types';
import { getLocalDateString, getLocalDayName, getLocalTimeString } from '../utils/date';
import { generateUUID } from '../utils/uuid';
import { createAdminHandlers } from './admin-routes';
import { upgradeData } from './data-upgrade';
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
  dailyResetTimer: NodeHelperTimer;

  // Custom methods
  setupAdminRoutes(): void;
  loadChoreData(): void;
  saveChoreData(): void;
  createDefaultData(): FamilyChoresData;
  checkAndPerformDailyReset(): void;
  transitionChoresForNewDay(): void;
  handleChoreToggle(payload: ChoreTogglePayload): void;
  logIncompleteChore(chore: Chore, date: string): void;
  trackDailyCompletion(chore: Chore, completed: boolean): void;
  stop(): void;
}

type NodeHelperTimer = ReturnType<typeof setInterval> | null;

const nodeHelper: FamilyChoresNodeHelper = {
  // Module state
  choreData: null as FamilyChoresData | null,
  config: null as Config | null,

  // Timer handle for daily reset check
  dailyResetTimer: null as NodeHelperTimer,

  /**
   * MM function: called when the node helper starts
   */
  start(): void {
    Log.info(`Starting node helper for MMM-FamilyChores`);
    this.setupAdminRoutes();

    // Check for daily reset every minute
    this.dailyResetTimer = setInterval(() => {
      const previousResetDate = this.choreData?.lastResetDate;
      this.checkAndPerformDailyReset();
      // If reset occurred, notify all frontends with fresh data
      if (this.choreData && this.choreData.lastResetDate !== previousResetDate) {
        this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
      }
    }, 60000);
  },

  /**
   * MM function: called when the node helper stops
   */
  stop(): void {
    if (this.dailyResetTimer) {
      clearInterval(this.dailyResetTimer);
      this.dailyResetTimer = null;
    }
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

    const dataPath = path.resolve(__dirname, 'data.json');

    try {
      if (fs.existsSync(dataPath)) {
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        const rawData = JSON.parse(fileContent) as Record<string, unknown>;

        // Upgrade older data formats before validation (additive, idempotent)
        const upgradedData = upgradeData(rawData);

        // Validate and filter people, skipping any with invalid data
        const rawPeople = Array.isArray(upgradedData.people) ? upgradedData.people : [];
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
        const rawChores = Array.isArray(upgradedData.chores) ? upgradedData.chores : [];
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
        const rawSettings = upgradedData.settings;
        const settingsResult = validateSettings(rawSettings);
        let settings: Settings;
        if (settingsResult.valid) {
          settings = rawSettings as Settings;
        } else {
          Log.warn(`Invalid settings in data file, using defaults: ${settingsResult.error}`);
          settings = { historyEnabled: true, timeFormat: TimeFormat.SYSTEM };
        }

        // Validate and filter daily completions against valid chores
        const rawCompletions = Array.isArray(upgradedData.dailyCompletions)
          ? upgradedData.dailyCompletions
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
            typeof upgradedData.lastResetDate === 'string'
              ? upgradedData.lastResetDate
              : getLocalDateString(),
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

    const dataPath = path.resolve(__dirname, 'data.json');

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
        historyEnabled: true,
        timeFormat: TimeFormat.SYSTEM,
      },
    };
  },

  /**
   * Check if daily reset should be performed and execute if needed
   */
  checkAndPerformDailyReset(): void {
    if (!this.choreData) return;

    const todayDateString = getLocalDateString();

    if (todayDateString <= this.choreData.lastResetDate) {
      // already run today
      return;
    }

    Log.info(`Daily reset triggered for ${todayDateString}`);
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
    Log.info(`CHORE_TOGGLE received: choreId=${payload.choreId}, completed=${payload.completed}`);

    if (!this.choreData) {
      Log.error('choreData is null, cannot handle toggle');
      return;
    }

    const todayDateString = getLocalDateString();
    if (todayDateString > this.choreData.lastResetDate) {
      Log.warn(
        'Cannot toggle chore, daily midnight reset is in progress. If this persists you may need to restart MagicMirror.'
      );
      return;
    }

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

    Log.info(`Setting chore ${payload.choreId} completedToday to ${payload.completed}`);
    chore.completedToday = payload.completed;
    // Note: we do NOT change caughtUp here - it stays as-is in case the chore gets unchecked later

    // Track daily completion if history is enabled
    this.trackDailyCompletion(chore, payload.completed);

    this.saveChoreData();
    const updateResult: ChoreUpdateResultPayload = {
      choreId: payload.choreId,
      completed: payload.completed,
    };
    this.sendSocketNotification?.(SocketNotifications.CHORE_UPDATE_RESULT, updateResult);
    this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
  },

  /**
   * Track daily completion in history if enabled
   */
  trackDailyCompletion(chore: Chore, completed: boolean): void {
    if (!this.choreData?.settings?.historyEnabled) {
      Log.warn(`Skipping daily completion save for chore ${chore.id}, history is disabled`);
      return;
    }

    let personId: string | undefined;
    if (chore.type === 'personal') {
      personId = chore.assignedTo;
    } else if (chore.type === 'rotating') {
      personId = chore.rotation[chore.rotatingIndex ?? 0];
    }

    const todayDate = getLocalDateString();

    if (completed && personId) {
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
      Log.info(
        `Daily completion added for chore ${chore.id}, person ${personId}. Total completions: ${this.choreData.dailyCompletions.length}`
      );
    } else if (!completed && personId) {
      // Delete daily completion record for this day/person/chore
      const index = this.choreData.dailyCompletions.findIndex(
        (dc) => dc.date === todayDate && dc.personId === personId && dc.choreId === chore.id
      );
      if (index !== -1) {
        this.choreData.dailyCompletions.splice(index, 1);
        Log.info(
          `Daily completion removed for chore ${chore.id}, person ${personId}. Total completions: ${this.choreData.dailyCompletions.length}`
        );
      } else {
        Log.warn(
          `No daily completion found to remove for chore ${chore.id}, person ${personId}, date ${todayDate}`
        );
      }
    }
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
    this.expressApp?.post('/MMM-FamilyChores/advance-rotations', handlers.postAdvanceRotations);
    this.expressApp?.post('/MMM-FamilyChores/reset-caught-up', handlers.postResetCaughtUp);

    Log.info('Admin routes configured for MMM-FamilyChores');
  },
};

export default NodeHelper.create(nodeHelper);
