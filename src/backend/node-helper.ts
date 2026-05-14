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
import type {
  CopyChoresRequest,
  CreateChoreRequest,
  CreatePersonRequest,
  RestoreDataRequest,
  UpdateChoreRequest,
  UpdatePersonRequest,
} from '../types/request-types';
import { getLocalDateString, getLocalDayName, getLocalTimeString } from '../utils/date';

// Use more flexible types for MagicMirror's Express implementation
interface Request {
  params: Record<string, string>;
  body: unknown;
  query: unknown;
}

interface Response {
  status(code: number): Response;
  json(data: unknown): Response;
  send(data: unknown): Response;
  sendFile(path: string): void;
  setHeader(name: string, value: string): Response;
}

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
  generateUUID(): string;
}

const nodeHelper: FamilyChoresNodeHelper = {
  // Module state
  choreData: null as FamilyChoresData | null,
  config: null as Config | null,

  // MM function: called when the node helper starts
  start(): void {
    Log.info(`Starting node helper for MMM-FamilyChores`);
    this.setupAdminRoutes();
  },

  // MM function: called when a socket notification arrives from the module
  socketNotificationReceived(
    notificationIdentifier: string,
    payload: Config | ChoreTogglePayload | ChoreReassignPayload | CaughtUpResetPayload
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
      this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
    } catch (error) {
      Log.error(`Error loading chore data: ${error}`);
      this.choreData = this.createDefaultData();
      this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
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

  // Create default empty data structure
  createDefaultData(): FamilyChoresData {
    return {
      people: [],
      chores: [],
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
        // Today is a skip day and visibility is HIDE - update caughtUp but skip rotation/completion reset
        chore.caughtUp = chore.completedToday === true;
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
        chore.rotatingIndex = ((chore.rotatingIndex ?? 0) + 1) % (chore.rotation ?? []).length;
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
    this.sendSocketNotification?.(SocketNotifications.CHORE_UPDATE_RESULT, {
      choreId: payload.choreId,
      completed: payload.completed,
    });
    this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
  },

  // Handle chore reassignment
  handleChoreReassign(payload: ChoreReassignPayload): void {
    if (!this.choreData || !this.config) return;

    if (this.config.adminPin && payload.pin !== this.config.adminPin) {
      this.sendSocketNotification?.(SocketNotifications.PIN_ERROR, { message: 'Invalid PIN' });
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
    this.sendSocketNotification?.(SocketNotifications.CHORE_REASSIGN_RESULT, {
      choreId: payload.choreId,
      newPersonId: payload.newPersonId,
    });
    this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
  },

  // Handle caughtUp reset for a person (admin only - PIN protected)
  handleCaughtUpReset(payload: CaughtUpResetPayload): void {
    if (!this.choreData || !this.config) return;

    if (this.config.adminPin && payload.pin !== this.config.adminPin) {
      this.sendSocketNotification?.(SocketNotifications.PIN_ERROR, { message: 'Invalid PIN' });
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
    this.sendSocketNotification?.(SocketNotifications.CAUGHTUP_RESET_RESULT, {
      personId: payload.personId,
      resetCount,
    });
    this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
  },

  // Setup admin interface routes using official MagicMirror pattern
  setupAdminRoutes(): void {
    // API endpoints for admin operations
    const handleGetData = (_req: Request, res: Response) => {
      if (!this.choreData) {
        res.status(500).json({ error: 'No data available' });
        return;
      }
      res.json(this.choreData);
    };

    this.expressApp?.get('/MMM-FamilyChores/data', handleGetData);

    // Add person
    this.expressApp?.post('/MMM-FamilyChores/people', (req: Request, res: Response) => {
      try {
        const { name, color } = req.body as CreatePersonRequest;
        if (!name || !color) {
          res.status(400).json({ error: 'Name and color are required' });
          return;
        }

        if (!this.choreData) {
          res.status(500).json({ error: 'No data available' });
          return;
        }

        // Generate UUID v4 for new person
        const newPerson = {
          id: this.generateUUID(),
          name: name.trim(),
          color: color.trim(),
        };

        this.choreData.people.push(newPerson);
        this.saveChoreData();
        this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);

        res.json(newPerson);
      } catch (error) {
        Log.error(`Error adding person: ${error}`);
        res.status(500).json({ error: 'Failed to add person' });
      }
    });

    // Update person
    this.expressApp?.put('/MMM-FamilyChores/people/:id', (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { name, color } = req.body as UpdatePersonRequest;

        if (!this.choreData) {
          res.status(500).json({ error: 'No data available' });
          return;
        }

        const person = this.choreData.people.find((p: { id: string }) => p.id === id);
        if (!person) {
          res.status(404).json({ error: 'Person not found' });
          return;
        }

        if (name) person.name = name.trim();
        if (color) person.color = color.trim();

        this.saveChoreData();
        this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);

        res.json(person);
      } catch (error) {
        Log.error(`Error updating person: ${error}`);
        res.status(500).json({ error: 'Failed to update person' });
      }
    });

    // Delete person
    this.expressApp?.delete('/MMM-FamilyChores/people/:id', (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (!this.choreData) {
          res.status(500).json({ error: 'No data available' });
          return;
        }

        const personIndex = this.choreData.people.findIndex((p: { id: string }) => p.id === id);
        if (personIndex === -1) {
          res.status(404).json({ error: 'Person not found' });
          return;
        }

        // Remove person
        this.choreData.people.splice(personIndex, 1);

        // Clean up chores assigned to this person
        this.choreData.chores = this.choreData.chores.filter((chore: Chore) => {
          if (chore.type === 'personal') {
            return chore.assignedTo !== id;
          } else if (chore.type === 'rotating') {
            // Remove from rotation lists
            chore.rotation = chore.rotation?.filter((personId: string) => personId !== id) || [];
            // If rotation is empty, remove the chore
            return chore.rotation.length > 0;
          }
          return true;
        });

        this.saveChoreData();
        this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);

        res.json({ success: true });
      } catch (error) {
        Log.error(`Error deleting person: ${error}`);
        res.status(500).json({ error: 'Failed to delete person' });
      }
    });

    // Add chore
    this.expressApp?.post('/MMM-FamilyChores/chores', (req: Request, res: Response) => {
      try {
        const { name, type, assignedTo, rotation, deadline, skipDays, skipDayVisibility } =
          req.body as CreateChoreRequest;

        if (!name || !type) {
          res.status(400).json({ error: 'Name and type are required' });
          return;
        }

        if (type === 'personal' && !assignedTo) {
          res.status(400).json({ error: 'Personal chores require assignedTo' });
          return;
        }

        if (type === 'rotating' && (!rotation || rotation.length === 0)) {
          res.status(400).json({ error: 'Rotating chores require rotation array' });
          return;
        }

        if (!this.choreData) {
          res.status(500).json({ error: 'No data available' });
          return;
        }

        const newChore: Chore = {
          id: this.generateUUID(),
          name: name.trim(),
          type,
          deadline: deadline?.trim() || undefined,
          skipDays: skipDays || [],
          skipDayVisibility: skipDayVisibility || SkipDayVisibility.SHOW_IF_OVERDUE,
          // Default to caught up since this is a new chore
          caughtUp: true,
          completedToday: false,
        };

        if (type === 'personal') {
          newChore.assignedTo = assignedTo;
        } else if (type === 'rotating') {
          newChore.rotation = rotation;
          newChore.rotatingIndex = 0;
        }

        this.choreData.chores.push(newChore);
        this.saveChoreData();
        this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);

        res.json(newChore);
      } catch (error) {
        Log.error(`Error adding chore: ${error}`);
        res.status(500).json({ error: 'Failed to add chore' });
      }
    });

    // Update chore
    this.expressApp?.put('/MMM-FamilyChores/chores/:id', (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { name, type, assignedTo, rotation, deadline, skipDays, skipDayVisibility } =
          req.body as UpdateChoreRequest;

        if (!this.choreData) {
          res.status(500).json({ error: 'No data available' });
          return;
        }

        const chore = this.choreData.chores.find((c: Chore) => c.id === id);
        if (!chore) {
          res.status(404).json({ error: 'Chore not found' });
          return;
        }

        if (name) chore.name = name.trim();
        if (deadline) chore.deadline = deadline.trim();
        if (skipDays) chore.skipDays = skipDays;
        if (skipDayVisibility) chore.skipDayVisibility = skipDayVisibility;

        // Handle type changes carefully
        if (type && type !== chore.type) {
          if (type === 'personal' && assignedTo) {
            chore.type = 'personal';
            chore.assignedTo = assignedTo;
            delete chore.rotation;
            delete chore.rotatingIndex;
          } else if (type === 'rotating' && rotation && rotation.length > 0) {
            chore.type = 'rotating';
            chore.rotation = rotation;
            chore.rotatingIndex = 0;
            delete chore.assignedTo;
          } else {
            res.status(400).json({ error: 'Invalid type change parameters' });
            return;
          }
        } else {
          // Same type, update specific fields
          if (chore.type === 'personal' && assignedTo) {
            chore.assignedTo = assignedTo;
          } else if (chore.type === 'rotating' && rotation) {
            chore.rotation = rotation;
            // Ensure rotatingIndex is valid
            if ((chore.rotatingIndex ?? 0) >= (chore.rotation ?? []).length) {
              chore.rotatingIndex = 0;
            }
          }
        }

        this.saveChoreData();
        this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);

        res.json(chore);
      } catch (error) {
        Log.error(`Error updating chore: ${error}`);
        res.status(500).json({ error: 'Failed to update chore' });
      }
    });

    // Delete chore
    this.expressApp?.delete('/MMM-FamilyChores/chores/:id', (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (!this.choreData) {
          res.status(500).json({ error: 'No data available' });
          return;
        }

        const choreIndex = this.choreData.chores.findIndex((c: Chore) => c.id === id);
        if (choreIndex === -1) {
          res.status(404).json({ error: 'Chore not found' });
          return;
        }

        this.choreData.chores.splice(choreIndex, 1);
        this.saveChoreData();
        this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);

        res.json({ success: true });
      } catch (error) {
        Log.error(`Error deleting chore: ${error}`);
        res.status(500).json({ error: 'Failed to delete chore' });
      }
    });

    // Download data.json (backup)
    this.expressApp?.get('/MMM-FamilyChores/backup', (_req: Request, res: Response) => {
      try {
        if (!this.choreData) {
          res.status(500).json({ error: 'No data available' });
          return;
        }

        const filename = `family-chores-backup-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(JSON.stringify(this.choreData, null, 2));
      } catch (error) {
        Log.error(`Error creating backup: ${error}`);
        res.status(500).json({ error: 'Failed to create backup' });
      }
    });

    // Upload data.json (restore)
    this.expressApp?.post('/MMM-FamilyChores/restore', (req: Request, res: Response) => {
      try {
        const restoredData = req.body as RestoreDataRequest;

        if (!restoredData?.people || !restoredData.chores) {
          res.status(400).json({ error: 'Invalid data format' });
          return;
        }

        // Basic validation
        if (!Array.isArray(restoredData.people) || !Array.isArray(restoredData.chores)) {
          res.status(400).json({ error: 'Invalid data format' });
          return;
        }

        this.choreData = restoredData as FamilyChoresData;
        this.saveChoreData();
        this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);

        res.json({ success: true, message: 'Data restored successfully' });
      } catch (error) {
        Log.error(`Error restoring data: ${error}`);
        res.status(500).json({ error: 'Failed to restore data' });
      }
    });

    // Copy chores from one person to another
    this.expressApp?.post('/MMM-FamilyChores/copy-chores', (req: Request, res: Response) => {
      try {
        const { fromPersonId, toPersonId, choreIds } = req.body as CopyChoresRequest;

        if (!fromPersonId || !toPersonId || !choreIds) {
          res.status(400).json({ error: 'fromPersonId, toPersonId, and choreIds are required' });
          return;
        }

        if (!this.choreData) {
          res.status(500).json({ error: 'No data available' });
          return;
        }

        const newChores: Chore[] = [];

        for (const choreId of choreIds) {
          const chore = this.choreData.chores.find((c: Chore) => c.id === choreId);

          if (!chore) {
            Log.warn(`Chore not found: ${choreId}, skipping`);
            continue;
          }

          // Validate it's a personal chore assigned to fromPersonId
          if (chore.type !== 'personal' || chore.assignedTo !== fromPersonId) {
            Log.warn(
              `Chore ${choreId} is not a personal chore assigned to ${fromPersonId}, skipping`
            );
            continue;
          }

          // Create new chore with new UUID
          const newChore: Chore = {
            id: this.generateUUID(),
            name: chore.name,
            type: chore.type,
            assignedTo: toPersonId,
            deadline: chore.deadline,
            skipDays: chore.skipDays,
            skipDayVisibility: chore.skipDayVisibility,
            caughtUp: true,
            completedToday: false,
          };

          this.choreData.chores.push(newChore);
          newChores.push(newChore);
        }

        this.saveChoreData();
        this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);

        res.json(newChores);
      } catch (error) {
        Log.error(`Error copying chores: ${error}`);
        res.status(500).json({ error: 'Failed to copy chores' });
      }
    });

    Log.info('Admin routes configured for MMM-FamilyChores');
  },

  // Generate UUID v4
  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
};

export default NodeHelper.create(nodeHelper);
