import * as Log from 'logger';
import { SocketNotifications } from '../constants/socket-notifications';
import type {
  Chore,
  DailyCompletion,
  FamilyChoresData,
  Person,
  Settings,
} from '../types/chore-types';
import { ChoreType, SkipDayVisibility } from '../types/chore-types';
import type {
  CopyChoresRequest,
  CreateChoreRequest,
  CreatePersonRequest,
  RestoreDataRequest,
  UpdateChoreRequest,
  UpdatePersonRequest,
  UpdateSettingsRequest,
} from '../types/request-types';
import type { ApiErrorBody } from '../types/response-types';
import { getLocalDateString } from '../utils/date';
import { generateUUID } from '../utils/uuid';
import {
  validateChore,
  validateDailyCompletion,
  validatePerson,
  validateSettings,
} from './validator';

// Use more flexible types for MagicMirror's Express implementation
interface Request {
  params: Record<string, string>;
  body: unknown;
  query?: unknown;
}

interface Response {
  status(code: number): Response;
  json(data: unknown): Response;
  send(data: unknown): Response;
  sendFile(path: string): void;
  setHeader(name: string, value: string): Response;
}

export interface AdminHandlerContext {
  getChoreData(): FamilyChoresData | null;
  setChoreData(data: FamilyChoresData): void;
  saveChoreData(): void;
  sendNotification(notification: string, payload: unknown): void;
}

/**
 * Validate PIN for protected actions. Returns true if allowed, false if blocked (and sends response).
 * Checks body first, then query params (for DELETE requests without body).
 */
function validatePin(req: Request, res: Response, context: AdminHandlerContext): boolean {
  const choreData = context.getChoreData();
  const adminPin = choreData?.settings?.adminPin;
  if (!adminPin) return true; // No PIN configured, allow

  const body = req.body as { pin?: string } | undefined;
  const query = req.query as { pin?: string } | undefined;
  const providedPin = body?.pin ?? query?.pin;
  if (providedPin !== adminPin) {
    res.status(403).json({ error: 'Invalid PIN' });
    return false;
  }
  return true;
}

export interface AdminHandlers {
  getData: (req: Request, res: Response) => void;
  postPerson: (req: Request, res: Response) => void;
  putPerson: (req: Request, res: Response) => void;
  deletePerson: (req: Request, res: Response) => void;
  postChore: (req: Request, res: Response) => void;
  putChore: (req: Request, res: Response) => void;
  deleteChore: (req: Request, res: Response) => void;
  getBackup: (req: Request, res: Response) => void;
  postRestore: (req: Request, res: Response) => void;
  postCopyChores: (req: Request, res: Response) => void;
  putSettings: (req: Request, res: Response) => void;
  postAdvanceRotations: (req: Request, res: Response) => void;
}

export function createAdminHandlers(context: AdminHandlerContext): AdminHandlers {
  const apiErr = (message: string): ApiErrorBody => ({ error: message });

  return {
    getData: (_req, res) => {
      const choreData = context.getChoreData();
      if (!choreData) {
        res.status(500).json(apiErr('No data available'));
        return;
      }
      // Redact PIN from response — use a boolean sentinel so the UI knows protection is active
      const data = JSON.parse(JSON.stringify(choreData)) as Record<string, unknown>;
      const settings = data.settings as Record<string, unknown> | undefined;
      if (settings?.adminPin) {
        settings.adminPin = true;
      }
      res.json(data);
    },

    postPerson: (req, res) => {
      if (!validatePin(req, res, context)) return;
      try {
        const { name, color } = req.body as CreatePersonRequest;
        const choreData = context.getChoreData();

        if (!choreData) {
          res.status(500).json(apiErr('No data available'));
          return;
        }

        // Construct person object with minimal checks (trim strings)
        const newPerson = {
          id: generateUUID(),
          name: name?.trim() || '',
          color: color?.trim() || '',
        };

        // Validate the constructed person
        const validation = validatePerson(newPerson);
        if (!validation.valid) {
          res.status(400).json(apiErr(validation.error));
          return;
        }

        choreData.people.push(newPerson);
        context.saveChoreData();
        context.sendNotification(SocketNotifications.CHORE_DATA, choreData);

        Log.info(`Person added: ${newPerson.name} (${newPerson.id})`);
        res.json(newPerson);
      } catch (error) {
        Log.error(`Error adding person: ${error}`);
        res.status(500).json(apiErr('Failed to add person'));
      }
    },

    putPerson: (req, res) => {
      if (!validatePin(req, res, context)) return;
      try {
        const { id } = req.params;
        const { name, color } = req.body as UpdatePersonRequest;
        const choreData = context.getChoreData();

        if (!choreData) {
          res.status(500).json(apiErr('No data available'));
          return;
        }

        const person = choreData.people.find((p: { id: string }) => p.id === id);
        if (!person) {
          res.status(404).json(apiErr('Person not found'));
          return;
        }

        // Construct updated person object with minimal checks (trim strings)
        const updatedPerson = {
          id: person.id,
          name: name ? name.trim() : person.name,
          color: color ? color.trim() : person.color,
        };

        // Validate the updated person
        const validation = validatePerson(updatedPerson);
        if (!validation.valid) {
          res.status(400).json(apiErr(validation.error));
          return;
        }

        Object.assign(person, updatedPerson);
        context.saveChoreData();
        context.sendNotification(SocketNotifications.CHORE_DATA, choreData);

        Log.info(`Person updated: ${updatedPerson.name} (${updatedPerson.id})`);
        res.json(person);
      } catch (error) {
        Log.error(`Error updating person: ${error}`);
        res.status(500).json(apiErr('Failed to update person'));
      }
    },

    deletePerson: (req, res) => {
      if (!validatePin(req, res, context)) return;
      try {
        const { id } = req.params;
        const choreData = context.getChoreData();

        if (!choreData) {
          res.status(500).json(apiErr('No data available'));
          return;
        }

        const personIndex = choreData.people.findIndex((p: { id: string }) => p.id === id);
        if (personIndex === -1) {
          res.status(404).json(apiErr('Person not found'));
          return;
        }

        choreData.people.splice(personIndex, 1);

        // Clean up chores assigned to this person
        choreData.chores = choreData.chores.filter((chore: Chore) => {
          if (chore.type === 'personal') {
            return chore.assignedTo !== id;
          } else if (chore.type === 'rotating') {
            // Remove from rotation lists
            chore.rotation = chore.rotation?.filter((personId: string) => personId !== id) || [];
            // Adjust rotating index if needed
            if (chore.rotatingIndex !== undefined && chore.rotatingIndex >= chore.rotation.length) {
              chore.rotatingIndex = Math.max(0, chore.rotation.length - 1);
            }
            return chore.rotation.length > 0;
          }
          return true;
        });

        context.saveChoreData();
        context.sendNotification(SocketNotifications.CHORE_DATA, choreData);

        Log.info(`Person deleted: ${id}`);
        res.json({ success: true });
      } catch (error) {
        Log.error(`Error deleting person: ${error}`);
        res.status(500).json(apiErr('Failed to delete person'));
      }
    },

    postChore: (req, res) => {
      if (!validatePin(req, res, context)) return;
      try {
        const {
          name,
          type,
          assignedTo,
          rotation,
          rotatingIndex,
          deadline,
          skipDays,
          skipDayVisibility,
        } = req.body as CreateChoreRequest;
        const choreData = context.getChoreData();

        if (!choreData) {
          res.status(500).json(apiErr('No data available'));
          return;
        }

        // Construct chore object with minimal checks (trim strings)
        const newChore: Record<string, unknown> = {
          id: generateUUID(),
          name: name?.trim() || '',
          type,
          deadline: deadline?.trim(),
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
          newChore.rotatingIndex = rotatingIndex ?? 0;
        }

        // Validate the constructed chore
        const validation = validateChore(newChore, choreData.people);
        if (!validation.valid) {
          res.status(400).json(apiErr(validation.error));
          return;
        }

        choreData.chores.push(newChore as Chore);

        context.saveChoreData();
        context.sendNotification(SocketNotifications.CHORE_DATA, choreData);

        Log.info(
          `Chore added: ${String(newChore.name)} (${String(newChore.id)}, type=${String(newChore.type)})`
        );
        res.json(newChore);
      } catch (error) {
        Log.error(`Error adding chore: ${error}`);
        res.status(500).json(apiErr('Failed to add chore'));
      }
    },

    putChore: (req, res) => {
      if (!validatePin(req, res, context)) return;
      try {
        const { id } = req.params;
        const {
          name,
          type,
          assignedTo,
          rotation,
          rotatingIndex,
          deadline,
          skipDays,
          skipDayVisibility,
        } = req.body as UpdateChoreRequest;
        const choreData = context.getChoreData();

        if (!choreData) {
          res.status(500).json(apiErr('No data available'));
          return;
        }

        const chore = choreData.chores.find((c: Chore) => c.id === id);
        if (!chore) {
          res.status(404).json(apiErr('Chore not found'));
          return;
        }
        if (type && type !== chore.type) {
          res.status(400).json(apiErr('Cannot change chore type'));
          return;
        }

        // Construct updated chore object with minimal checks (trim strings)
        const updatedChore: Record<string, unknown> = {
          ...chore,
          name: name ? name.trim() : chore.name,
          deadline: deadline ? deadline.trim() : chore.deadline,
          skipDays: skipDays || chore.skipDays,
          skipDayVisibility: skipDayVisibility || chore.skipDayVisibility,
        };

        // Handle type-specific fields
        if (chore.type === ChoreType.PERSONAL) {
          updatedChore.assignedTo = assignedTo || chore.assignedTo;
        } else if (chore.type === ChoreType.ROTATING) {
          updatedChore.rotation = rotation || chore.rotation;
          updatedChore.rotatingIndex =
            rotatingIndex !== undefined ? rotatingIndex : (chore.rotatingIndex ?? 0);
        }

        // Validate the updated chore
        const validation = validateChore(updatedChore, choreData.people);
        if (!validation.valid) {
          res.status(400).json(apiErr(validation.error));
          return;
        }

        Object.assign(chore, updatedChore);

        context.saveChoreData();
        context.sendNotification(SocketNotifications.CHORE_DATA, choreData);

        Log.info(`Chore updated: ${chore.name} (${chore.id})`);
        res.json(chore);
      } catch (error) {
        Log.error(`Error updating chore: ${error}`);
        res.status(500).json(apiErr('Failed to update chore'));
      }
    },

    deleteChore: (req, res) => {
      if (!validatePin(req, res, context)) return;
      try {
        const { id } = req.params;
        const choreData = context.getChoreData();

        if (!choreData) {
          res.status(500).json(apiErr('No data available'));
          return;
        }

        const choreIndex = choreData.chores.findIndex((c: Chore) => c.id === id);
        if (choreIndex === -1) {
          res.status(404).json(apiErr('Chore not found'));
          return;
        }

        choreData.chores.splice(choreIndex, 1);
        context.saveChoreData();
        context.sendNotification(SocketNotifications.CHORE_DATA, choreData);

        Log.info(`Chore deleted: ${id}`);
        res.json({ success: true });
      } catch (error) {
        Log.error(`Error deleting chore: ${error}`);
        res.status(500).json(apiErr('Failed to delete chore'));
      }
    },

    getBackup: (req, res) => {
      if (!validatePin(req, res, context)) return;
      try {
        const choreData = context.getChoreData();
        if (!choreData) {
          res.status(500).json(apiErr('No data available'));
          return;
        }

        const filename = `family-chores-backup-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(JSON.stringify(choreData, null, 2));
        Log.info(`Backup downloaded: ${filename}`);
      } catch (error) {
        Log.error(`Error creating backup: ${error}`);
        res.status(500).json(apiErr('Failed to create backup'));
      }
    },

    postRestore: (req, res) => {
      if (!validatePin(req, res, context)) return;
      try {
        const restoredData = req.body as RestoreDataRequest;

        if (!restoredData?.people || !restoredData.chores) {
          res.status(400).json(apiErr('Invalid data format'));
          return;
        }

        // Basic validation
        if (!Array.isArray(restoredData.people) || !Array.isArray(restoredData.chores)) {
          res.status(400).json(apiErr('Invalid data format'));
          return;
        }

        // Validate all people
        const validPeople: Person[] = [];
        for (const person of restoredData.people) {
          const validation = validatePerson(person);
          if (!validation.valid) {
            res.status(400).json(apiErr(`Invalid person data: ${validation.error}`));
            return;
          }
          validPeople.push(person as Person);
        }

        // Validate all chores
        const validChores: Chore[] = [];
        for (const chore of restoredData.chores) {
          const validation = validateChore(chore, validPeople);
          if (!validation.valid) {
            res.status(400).json(apiErr(`Invalid chore data: ${validation.error}`));
            return;
          }
          validChores.push(chore as Chore);
        }

        // Validate settings if provided
        const rawSettings = restoredData.settings ?? { historyEnabled: true };
        const settingsValidation = validateSettings(rawSettings);
        if (!settingsValidation.valid) {
          res.status(400).json(apiErr(`Invalid settings: ${settingsValidation.error}`));
          return;
        }

        // Validate daily completions and pre-filter old ones
        const retentionDays = 14;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const cutoffDateString = getLocalDateString(cutoffDate);

        const validCompletions: DailyCompletion[] = [];
        if (Array.isArray(restoredData.dailyCompletions)) {
          for (const completion of restoredData.dailyCompletions) {
            const validation = validateDailyCompletion(completion, validChores);
            if (!validation.valid) {
              Log.warn(`Skipping invalid daily completion in restore data: ${validation.error}`);
              continue;
            }
            const completionObj = completion as DailyCompletion;
            if (completionObj.date < cutoffDateString) {
              continue;
            }
            validCompletions.push(completionObj);
          }
        }

        context.setChoreData({
          people: validPeople,
          chores: validChores,
          dailyCompletions: validCompletions,
          lastResetDate: restoredData.lastResetDate ?? getLocalDateString(),
          settings: rawSettings as Settings,
        });
        context.saveChoreData();
        context.sendNotification(SocketNotifications.CHORE_DATA, context.getChoreData());

        Log.info(
          `Data restored: ${validPeople.length} people, ${validChores.length} chores, ${validCompletions.length} completions`
        );
        res.json({ success: true, message: 'Data restored successfully' });
      } catch (error) {
        Log.error(`Error restoring data: ${error}`);
        res.status(500).json(apiErr('Failed to restore data'));
      }
    },

    postCopyChores: (req, res) => {
      if (!validatePin(req, res, context)) return;
      try {
        const { fromPersonId, toPersonId, choreIds } = req.body as CopyChoresRequest;

        if (!fromPersonId || !toPersonId || !choreIds) {
          res.status(400).json(apiErr('fromPersonId, toPersonId, and choreIds are required'));
          return;
        }

        const choreData = context.getChoreData();
        if (!choreData) {
          res.status(500).json(apiErr('No data available'));
          return;
        }

        const newChores: Chore[] = [];

        for (const choreId of choreIds) {
          const chore = choreData.chores.find((c: Chore) => c.id === choreId);

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
            id: generateUUID(),
            name: chore.name,
            type: ChoreType.PERSONAL,
            assignedTo: toPersonId,
            deadline: chore.deadline,
            skipDays: chore.skipDays,
            skipDayVisibility: chore.skipDayVisibility,
            caughtUp: true,
            completedToday: false,
          };

          choreData.chores.push(newChore);
          newChores.push(newChore);
        }

        context.saveChoreData();
        context.sendNotification(SocketNotifications.CHORE_DATA, choreData);

        Log.info(
          `Chores copied: ${newChores.length} chore(s) from ${fromPersonId} to ${toPersonId}`
        );
        res.json(newChores);
      } catch (error) {
        Log.error(`Error copying chores: ${error}`);
        res.status(500).json(apiErr('Failed to copy chores'));
      }
    },

    postAdvanceRotations: (req, res) => {
      if (!validatePin(req, res, context)) return;
      try {
        const choreData = context.getChoreData();

        if (!choreData) {
          res.status(500).json(apiErr('No data available'));
          return;
        }

        if (getLocalDateString() > choreData.lastResetDate) {
          res
            .status(503)
            .json(
              apiErr(
                'Daily midnight reset is in progress. Please try again in a moment. If this persists you may need to restart MagicMirror.'
              )
            );
          return;
        }

        const rotatingChores = choreData.chores.filter((c: Chore) => c.type === ChoreType.ROTATING);

        let advanced = 0;
        for (const chore of rotatingChores) {
          if (chore.type !== ChoreType.ROTATING) continue;
          const rotation = chore.rotation ?? [];
          if (rotation.length < 2) continue;
          chore.rotatingIndex = ((chore.rotatingIndex ?? 0) + 1) % rotation.length;
          chore.completedToday = false;
          chore.caughtUp = true;
          advanced++;
        }

        context.saveChoreData();
        context.sendNotification(SocketNotifications.CHORE_DATA, choreData);

        Log.info(`Rotations advanced: ${advanced} chore(s)`);
        res.json({ success: true, advanced });
      } catch (error) {
        Log.error(`Error advancing rotations: ${error}`);
        res.status(500).json(apiErr('Failed to advance rotations'));
      }
    },

    putSettings: (req, res) => {
      if (!validatePin(req, res, context)) return;
      try {
        const { historyEnabled, adminPin } = req.body as UpdateSettingsRequest;
        const choreData = context.getChoreData();

        if (!choreData) {
          res.status(500).json(apiErr('No data available'));
          return;
        }

        // Initialize settings if not present
        if (!choreData.settings) {
          choreData.settings = {
            historyEnabled: true,
          };
        }

        // Update history enabled if provided
        if (historyEnabled !== undefined) {
          choreData.settings.historyEnabled = historyEnabled;
        }

        // Update admin PIN if explicitly provided (null clears it)
        if (adminPin !== undefined) {
          choreData.settings.adminPin = adminPin || null;
        }

        context.saveChoreData();
        context.sendNotification(SocketNotifications.CHORE_DATA, choreData);

        Log.info(
          `Settings updated: historyEnabled=${choreData.settings.historyEnabled}, adminPin=${choreData.settings.adminPin ? 'set' : 'unset'}`
        );

        // Redact PIN in response
        const responseSettings = { ...choreData.settings };
        if (responseSettings.adminPin) {
          responseSettings.adminPin = true as unknown as string;
        }
        res.json(responseSettings);
      } catch (error) {
        Log.error(`Error updating settings: ${error}`);
        res.status(500).json(apiErr('Failed to update settings'));
      }
    },
  };
}
