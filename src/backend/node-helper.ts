import * as fs from 'node:fs';
import * as path from 'node:path';
import NodeHelper from 'node_helper';
import { SocketNotifications } from '../constants/socket-notifications';
import type {
  Chore,
  ChoreReassignPayload,
  ChoreTogglePayload,
  ChoreUndoPayload,
  FamilyChoresData,
} from '../types/chore-types';
import type { Config } from '../types/config';

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
    payload: Config | ChoreTogglePayload | ChoreReassignPayload | ChoreUndoPayload
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
      case SocketNotifications.CHORE_UNDO:
        this.handleChoreUndo(payload as ChoreUndoPayload);
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
        lastCompleted: {},
        previousLastCompleted: {},
        completedToday: [],
      },
    };
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
      // Move current lastCompleted to previousLastCompleted before updating
      const currentLastCompleted = this.choreData.state.lastCompleted[payload.choreId];
      if (currentLastCompleted) {
        this.choreData.state.previousLastCompleted[payload.choreId] = currentLastCompleted;
      }

      this.choreData.state.completedToday.push(payload.choreId);
      this.choreData.state.lastCompleted[payload.choreId] = new Date().toISOString().split('T')[0];
    } else {
      this.choreData.state.completedToday = this.choreData.state.completedToday.filter(
        (id: string) => id !== payload.choreId
      );

      // Restore lastCompleted to previousLastCompleted to maintain accurate completion history
      const previousLastCompleted = this.choreData.state.previousLastCompleted[payload.choreId];
      if (previousLastCompleted) {
        this.choreData.state.lastCompleted[payload.choreId] = previousLastCompleted;
      } else {
        // If there's no previous completion, remove the entry entirely
        delete this.choreData.state.lastCompleted[payload.choreId];
      }
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

  // Handle chore undo
  handleChoreUndo(payload: ChoreUndoPayload): void {
    if (!this.choreData || !this.config) return;

    if (this.config.adminPin && payload.pin !== this.config.adminPin) {
      this.sendSocketNotification(SocketNotifications.PIN_ERROR, { message: 'Invalid PIN' });
      return;
    }

    // Early exit: check if chore is already not completed today
    const isCurrentlyCompleted = this.choreData.state.completedToday.includes(payload.choreId);
    if (!isCurrentlyCompleted) {
      Log.debug(`Chore ${payload.choreId} is already not completed today, skipping undo`);
      return;
    }

    this.choreData.state.completedToday = this.choreData.state.completedToday.filter(
      (id: string) => id !== payload.choreId
    );
    delete this.choreData.state.lastCompleted[payload.choreId];

    this.saveChoreData();
    this.sendSocketNotification(SocketNotifications.CHORE_UNDO_RESULT, {
      choreId: payload.choreId,
    });
    this.sendSocketNotification(SocketNotifications.CHORE_DATA, this.choreData);
  },
});
