import * as fs from 'node:fs';
import * as path from 'node:path';
import * as Log from 'logger';
import * as NodeHelper from 'node_helper';
import { SocketNotifications } from '../constants/socket-notifications';
import {
  type CaughtUpResetPayload,
  type Chore,
  type ChoreReassignPayload,
  type ChoreTogglePayload,
  type FamilyChoresData,
  SkipDayVisibility,
} from '../types/chore-types';
import type { Config } from '../types/config';
import { getLocalDateString, getLocalDayName, getLocalTimeString } from '../utils/date';

export default NodeHelper.create({
  // Module state
  choreData: null as FamilyChoresData | null,
  config: null as Config | null,

  // MM function: called when the node helper starts
  start(): void {
    Log.info(`Starting node helper for MMM-FamilyChores`);
  },

  // MM function: called when a socket notification arrives from the module
  socketNotificationReceived(
    notificationIdentifier: string,
    payload: Config | ChoreTogglePayload | ChoreReassignPayload | CaughtUpResetPayload
  ): void {
    Log.debug(`Node helper received: '${notificationIdentifier}'`);

    switch (notificationIdentifier) {
      case SocketNotifications.CONFIG_REQUEST:
        this.config = payload;
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

  // Load chore data from file
  loadChoreData(): void {
    if (!this.config) {
      Log.error('Config not set, cannot load chore data');
      return;
    }

    const dataPath = path.resolve(__dirname, this.config.dataFile || 'data.json');

    try {
      if (fs.existsSync(dataPath)) {
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        this.choreData = JSON.parse(fileContent) as FamilyChoresData;
        Log.info(`Loaded chore data from ${dataPath}`);
      } else {
        // Create default data structure
        this.choreData = this.createDefaultData();
        this.saveChoreData();
        Log.info(`Created default chore data at ${dataPath}`);
      }

      // Check if daily reset is needed before sending data
      this.checkAndPerformDailyReset();
      this.sendSocketNotification(SocketNotifications.CHORE_DATA, this.choreData);
    } catch (error) {
      Log.error(`Error loading chore data: ${error}`);
      this.choreData = this.createDefaultData();
      this.sendSocketNotification(SocketNotifications.CHORE_DATA, this.choreData);
    }
  },

  // Save chore data to file
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

  // Create default data structure
  createDefaultData(): FamilyChoresData {
    return {
      people: [
        { id: '1', name: 'Alice', color: '#FF6B6B' },
        { id: '2', name: 'Bob', color: '#4ECDC4' },
        { id: '3', name: 'Charlie', color: '#45B7D1' },
        { id: '4', name: 'Diana', color: '#96CEB4' },
        { id: '5', name: 'Evan', color: '#FFEAA7' },
      ],
      chores: [
        {
          id: '1',
          name: 'Take out trash',
          type: 'rotating',
          rotation: ['1', '2', '3', '4', '5'],
          rotatingIndex: 0,
          // only Saturday
          skipDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
        },
        {
          id: '2',
          name: 'Clean kitchen',
          type: 'rotating',
          rotation: ['1', '2', '3', '4', '5'],
          rotatingIndex: 0,
          skipDays: ['saturday'],
          skipDayVisibility: SkipDayVisibility.HIDE,
        },
        {
          id: '3',
          name: 'Make bed',
          type: 'personal',
          assignedTo: '1',
          skipDays: ['sunday'],
          skipDayVisibility: SkipDayVisibility.SHOW_ALWAYS,
        },
        {
          id: '4',
          name: 'Do homework',
          type: 'personal',
          assignedTo: '3',
          skipDays: ['saturday', 'sunday'],
          skipDayVisibility: SkipDayVisibility.HIDE,
        },
      ],
      // Initialize to today to prevent immediate rotation
      lastResetDate: getLocalDateString(),
    };
  },

  // Check if daily reset should be performed and execute if needed
  checkAndPerformDailyReset(): void {
    if (!this.choreData || !this.config) return;

    // Get current local date and time
    const todayDateString = getLocalDateString();
    const currentTimeString = getLocalTimeString();

    if (this.choreData.lastResetDate && todayDateString <= this.choreData.lastResetDate) {
      // already run today
      return;
    }
    const dailyResetTime = this.config.dailyResetTime || '03:00';

    if (currentTimeString < dailyResetTime) {
      // not time yet - NOTE: if we skipped an entire day, we still wait for the reset time to pass
      return;
    }
    Log.info(
      `Daily reset triggered for ${getLocalDateString()} at ${currentTimeString}, reset time: ${dailyResetTime}`
    );
    this.transitionChoresForNewDay();
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

    for (const chore of this.choreData.chores) {
      const skipDays = chore.skipDays ?? [];
      const isSkipDay = skipDays.includes(todayDayName);
      const skipDayVisibility = chore.skipDayVisibility ?? SkipDayVisibility.HIDE;

      if (isSkipDay && skipDayVisibility === SkipDayVisibility.HIDE) {
        // Today is a skip day and visibility is HIDE - skip this chore entirely, don't change any state
        // - it will resume on the next non-skip day
        continue;
      }
      // for other states, update caughtUp status
      chore.caughtUp = chore.completedToday === true;
      if (isSkipDay) {
        // skip day but possibly visible - don't reset completedToday or rotate
        continue;
      }
      // reset completedToday for the new day
      chore.completedToday = false;
      // rotate if needed
      if (chore.caughtUp && chore.type === 'rotating') {
        chore.rotatingIndex = (chore.rotatingIndex + 1) % chore.rotation.length;
      }
    }

    Log.info('Daily reset performed - completedToday cleared, caughtUp status updated');
  },

  // Handle chore toggle
  handleChoreToggle(payload: ChoreTogglePayload): void {
    if (!this.choreData || !this.config) return;

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

    this.saveChoreData();
    this.sendSocketNotification(SocketNotifications.CHORE_UPDATE_RESULT, {
      choreId: payload.choreId,
      completed: payload.completed,
    });
    this.sendSocketNotification(SocketNotifications.CHORE_DATA, this.choreData);
  },

  // Handle chore reassignment
  handleChoreReassign(payload: ChoreReassignPayload): void {
    if (!this.choreData || !this.config) return;

    if (this.config.adminPin && payload.pin !== this.config.adminPin) {
      this.sendSocketNotification(SocketNotifications.PIN_ERROR, { message: 'Invalid PIN' });
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
    this.sendSocketNotification(SocketNotifications.CHORE_REASSIGN_RESULT, {
      choreId: payload.choreId,
      newPersonId: payload.newPersonId,
    });
    this.sendSocketNotification(SocketNotifications.CHORE_DATA, this.choreData);
  },

  // Handle caughtUp reset for a person (admin only - PIN protected)
  handleCaughtUpReset(payload: CaughtUpResetPayload): void {
    if (!this.choreData || !this.config) return;

    if (this.config.adminPin && payload.pin !== this.config.adminPin) {
      this.sendSocketNotification(SocketNotifications.PIN_ERROR, { message: 'Invalid PIN' });
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
    this.sendSocketNotification(SocketNotifications.CAUGHTUP_RESET_RESULT, {
      personId: payload.personId,
      resetCount,
    });
    this.sendSocketNotification(SocketNotifications.CHORE_DATA, this.choreData);
  },
});
