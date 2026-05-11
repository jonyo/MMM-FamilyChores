import * as fs from 'node:fs';
import * as path from 'node:path';
import NodeHelper from 'node_helper';
import { SocketNotifications } from '../constants/socket-notifications';
import type {
  CaughtUpResetPayload,
  Chore,
  ChoreReassignPayload,
  ChoreTogglePayload,
  FamilyChoresData,
} from '../types/chore-types';
import type { Config } from '../types/config';

// Day names for skip day checking
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

declare global {
  // Logger is available globally in MagicMirror
  const Log: {
    info: (message: string) => void;
    log: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
    debug: (message: string) => void;
  };
}

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

    const dataPath = path.resolve(__dirname, '..', '..', this.config.dataFile || 'data.json');

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

    const dataPath = path.resolve(__dirname, '..', '..', this.config.dataFile || 'data.json');

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
        { id: '1', name: 'Take out trash', type: 'rotating', rotation: ['1', '2', '3', '4', '5'] },
        { id: '2', name: 'Clean kitchen', type: 'rotating', rotation: ['1', '2', '3', '4', '5'] },
        { id: '3', name: 'Make bed', type: 'personal', assignedTo: '1' },
        { id: '4', name: 'Do homework', type: 'personal', assignedTo: '3' },
      ],
      state: {
        rotatingIndex: { '1': 0, '2': 0 },
        caughtUp: {},
        completedToday: [],
      },
    };
  },

  // Perform daily reset - clears completedToday and updates caughtUp status
  // Should be called when detecting a new day
  performDailyReset(): void {
    if (!this.choreData) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDayName = DAY_NAMES[yesterday.getDay()];

    for (const chore of this.choreData.chores) {
      const skipDays = chore.skipDays ?? [];
      const wasSkipDay = skipDays.includes(yesterdayDayName);

      if (wasSkipDay) {
        // Yesterday was a skip day - don't change caughtUp, preserve existing value
        continue;
      }

      // Check if chore was completed yesterday (i.e., in completedToday before we clear it)
      const wasCompletedYesterday = this.choreData.state.completedToday.includes(chore.id);
      this.choreData.state.caughtUp[chore.id] = wasCompletedYesterday;
    }

    // Clear today's completed list for the new day
    this.choreData.state.completedToday = [];

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
    const isCurrentlyCompleted = this.choreData.state.completedToday.includes(payload.choreId);
    if (isCurrentlyCompleted === payload.completed) {
      Log.debug(`Chore ${payload.choreId} is already in desired state, skipping update`);
      return;
    }

    if (payload.completed) {
      this.choreData.state.completedToday.push(payload.choreId);
    } else {
      this.choreData.state.completedToday = this.choreData.state.completedToday.filter(
        (id: string) => id !== payload.choreId
      );
      // Note: we do NOT change caughtUp here - it stays as-is
    }

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
      const currentIndex = this.choreData.state.rotatingIndex[payload.choreId] || 0;
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
        this.choreData.state.rotatingIndex[payload.choreId] = currentIndex;
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

    // Find all chores assigned to this person
    const personChoreIds = this.choreData.chores
      .filter((chore: Chore) => {
        if (chore.type === 'personal') {
          return chore.assignedTo === payload.personId;
        } else if (chore.type === 'rotating' && chore.rotation) {
          const currentIndex = this.choreData?.state.rotatingIndex[chore.id] ?? 0;
          return chore.rotation[currentIndex] === payload.personId;
        }
        return false;
      })
      .map((chore: Chore) => chore.id);

    // Reset caughtUp to true for all their chores
    for (const choreId of personChoreIds) {
      this.choreData.state.caughtUp[choreId] = true;
    }

    Log.info(
      `Reset caughtUp status for person ${payload.personId}, affected ${personChoreIds.length} chores`
    );

    this.saveChoreData();
    this.sendSocketNotification(SocketNotifications.CAUGHTUP_RESET_RESULT, {
      personId: payload.personId,
      resetCount: personChoreIds.length,
    });
    this.sendSocketNotification(SocketNotifications.CHORE_DATA, this.choreData);
  },
});
