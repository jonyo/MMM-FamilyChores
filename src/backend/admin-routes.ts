import * as Log from 'logger';
import { SocketNotifications } from '../constants/socket-notifications';
import type {
  Chore,
  DailyCompletion,
  FamilyChoresData,
  Person,
  Settings,
} from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  NotCaughtUpDisplay,
  SkipDayVisibility,
  TimeFormat,
} from '../types/chore-types';
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
import { upgradeData } from './data-upgrade';
import type { AdminRequest } from './request-body';
import { getRequestBody, RequestBodyError } from './request-body';
import {
  validateChore,
  validateDailyCompletion,
  validatePerson,
  validateSettings,
} from './validator';

// Use a more flexible type for MagicMirror's Express implementation
type Request = AdminRequest;

interface Response {
  status(code: number): Response;
  json(data: unknown): Response;
  send(data: unknown): Response;
  sendFile(path: string): void;
  setHeader(name: string, value: string): Response;
}

const apiErr = (message: string): ApiErrorBody => ({ error: message });

/**
 * Send the appropriate error response for a caught handler error. `RequestBodyError` (thrown by
 * `getRequestBody` for malformed/oversized JSON) carries its own status code and message;
 * anything else falls back to a generic 500 with the handler's own message.
 */
function sendErrorResponse(res: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof RequestBodyError) {
    res.status(error.statusCode).json(apiErr(error.message));
    return;
  }
  res.status(500).json(apiErr(fallbackMessage));
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
async function validatePin(
  req: Request,
  res: Response,
  context: AdminHandlerContext
): Promise<boolean> {
  const choreData = context.getChoreData();
  const adminPin = choreData?.settings?.adminPin;
  if (!adminPin) return true; // No PIN configured, allow

  // A malformed body here just means no PIN was provided via the body - fall back to the
  // query param rather than failing the request before the handler gets a chance to run.
  const body = (await getRequestBody(req).catch(() => undefined)) as { pin?: string } | undefined;
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
  postPerson: (req: Request, res: Response) => Promise<void>;
  putPerson: (req: Request, res: Response) => Promise<void>;
  deletePerson: (req: Request, res: Response) => Promise<void>;
  postChore: (req: Request, res: Response) => Promise<void>;
  putChore: (req: Request, res: Response) => Promise<void>;
  deleteChore: (req: Request, res: Response) => Promise<void>;
  getBackup: (req: Request, res: Response) => Promise<void>;
  postRestore: (req: Request, res: Response) => Promise<void>;
  postCopyChores: (req: Request, res: Response) => Promise<void>;
  putSettings: (req: Request, res: Response) => Promise<void>;
  postAdvanceRotations: (req: Request, res: Response) => Promise<void>;
  postResetCaughtUp: (req: Request, res: Response) => Promise<void>;
}

export function createAdminHandlers(context: AdminHandlerContext): AdminHandlers {
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

    postPerson: async (req, res) => {
      if (!(await validatePin(req, res, context))) return;
      try {
        const { name, color } = (await getRequestBody(req)) as CreatePersonRequest;
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
        sendErrorResponse(res, error, 'Failed to add person');
      }
    },

    putPerson: async (req, res) => {
      if (!(await validatePin(req, res, context))) return;
      try {
        const { id } = req.params;
        const { name, color } = (await getRequestBody(req)) as UpdatePersonRequest;
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
        sendErrorResponse(res, error, 'Failed to update person');
      }
    },

    deletePerson: async (req, res) => {
      if (!(await validatePin(req, res, context))) return;
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
        sendErrorResponse(res, error, 'Failed to delete person');
      }
    },

    postChore: async (req, res) => {
      if (!(await validatePin(req, res, context))) return;
      try {
        const {
          name,
          type,
          assignedTo,
          rotation,
          rotatingIndex,
          startTime,
          deadline,
          skipDays,
          skipDayVisibility,
          beforeStartTimeVisibility,
          afterDeadlineVisibility,
          notCaughtUpDisplay,
        } = (await getRequestBody(req)) as CreateChoreRequest;
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
          startTime: startTime?.trim(),
          deadline: deadline?.trim(),
          skipDays: skipDays || [],
          skipDayVisibility: skipDayVisibility || SkipDayVisibility.SHOW_IF_OVERDUE,
          beforeStartTimeVisibility: beforeStartTimeVisibility || BeforeStartTimeVisibility.HIDE,
          afterDeadlineVisibility: afterDeadlineVisibility || AfterDeadlineVisibility.SHOW_OVERDUE,
          notCaughtUpDisplay: notCaughtUpDisplay || NotCaughtUpDisplay.OVERDUE,
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
        sendErrorResponse(res, error, 'Failed to add chore');
      }
    },

    putChore: async (req, res) => {
      if (!(await validatePin(req, res, context))) return;
      try {
        const { id } = req.params;
        const body = (await getRequestBody(req)) as UpdateChoreRequest;
        const {
          name,
          type,
          assignedTo,
          rotation,
          rotatingIndex,
          startTime,
          deadline,
          skipDays,
          skipDayVisibility,
          beforeStartTimeVisibility,
          afterDeadlineVisibility,
          notCaughtUpDisplay,
        } = body;
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
        // null means "explicitly clear"; undefined (field absent) means "keep existing value"
        const updatedChore: Record<string, unknown> = {
          ...chore,
          name: name ? name.trim() : chore.name,
          startTime:
            'startTime' in body ? (startTime ? startTime.trim() : undefined) : chore.startTime,
          deadline: 'deadline' in body ? (deadline ? deadline.trim() : undefined) : chore.deadline,
          skipDays: skipDays || chore.skipDays,
          skipDayVisibility: skipDayVisibility || chore.skipDayVisibility,
          beforeStartTimeVisibility: beforeStartTimeVisibility || chore.beforeStartTimeVisibility,
          afterDeadlineVisibility: afterDeadlineVisibility || chore.afterDeadlineVisibility,
          notCaughtUpDisplay: notCaughtUpDisplay || chore.notCaughtUpDisplay,
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
        Log.error(
          `Error updating chore ${req.params?.id}: ${error instanceof Error ? error.stack : error}`
        );
        sendErrorResponse(res, error, 'Failed to update chore');
      }
    },

    deleteChore: async (req, res) => {
      if (!(await validatePin(req, res, context))) return;
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
        sendErrorResponse(res, error, 'Failed to delete chore');
      }
    },

    getBackup: async (req, res) => {
      if (!(await validatePin(req, res, context))) return;
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
        sendErrorResponse(res, error, 'Failed to create backup');
      }
    },

    postRestore: async (req, res) => {
      if (!(await validatePin(req, res, context))) return;
      try {
        const restoredData = (await getRequestBody(req)) as RestoreDataRequest;

        if (!restoredData?.people || !restoredData.chores) {
          res.status(400).json(apiErr('Invalid data format'));
          return;
        }

        // Basic validation
        if (!Array.isArray(restoredData.people) || !Array.isArray(restoredData.chores)) {
          res.status(400).json(apiErr('Invalid data format'));
          return;
        }

        // Upgrade older data formats before validation (additive, idempotent)
        const upgradedData = upgradeData(restoredData as unknown as Record<string, unknown>);
        const restoredChores = Array.isArray(upgradedData.chores) ? upgradedData.chores : [];
        const restoredPeople = Array.isArray(upgradedData.people) ? upgradedData.people : [];
        const restoredCompletions = Array.isArray(upgradedData.dailyCompletions)
          ? upgradedData.dailyCompletions
          : [];

        // Validate all people
        const validPeople: Person[] = [];
        for (const person of restoredPeople) {
          const validation = validatePerson(person);
          if (!validation.valid) {
            res.status(400).json(apiErr(`Invalid person data: ${validation.error}`));
            return;
          }
          validPeople.push(person as Person);
        }

        // Validate all chores
        const validChores: Chore[] = [];
        for (const chore of restoredChores) {
          const validation = validateChore(chore, validPeople);
          if (!validation.valid) {
            res.status(400).json(apiErr(`Invalid chore data: ${validation.error}`));
            return;
          }
          validChores.push(chore as Chore);
        }

        // Validate settings (use defaults if not provided in restore payload)
        const rawSettings = upgradedData.settings ?? {
          historyEnabled: true,
          timeFormat: TimeFormat.SYSTEM,
        };
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
        for (const completion of restoredCompletions) {
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

        context.setChoreData({
          people: validPeople,
          chores: validChores,
          dailyCompletions: validCompletions,
          lastResetDate:
            typeof upgradedData.lastResetDate === 'string'
              ? upgradedData.lastResetDate
              : getLocalDateString(),
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
        sendErrorResponse(res, error, 'Failed to restore data');
      }
    },

    postCopyChores: async (req, res) => {
      if (!(await validatePin(req, res, context))) return;
      try {
        const { fromPersonId, toPersonId, choreIds } = (await getRequestBody(
          req
        )) as CopyChoresRequest;

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
            startTime: chore.startTime,
            deadline: chore.deadline,
            skipDays: chore.skipDays,
            skipDayVisibility: chore.skipDayVisibility,
            beforeStartTimeVisibility: chore.beforeStartTimeVisibility,
            afterDeadlineVisibility: chore.afterDeadlineVisibility,
            notCaughtUpDisplay: chore.notCaughtUpDisplay,
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
        sendErrorResponse(res, error, 'Failed to copy chores');
      }
    },

    postAdvanceRotations: async (req, res) => {
      if (!(await validatePin(req, res, context))) return;
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
        sendErrorResponse(res, error, 'Failed to advance rotations');
      }
    },

    postResetCaughtUp: async (req, res) => {
      if (!(await validatePin(req, res, context))) return;
      try {
        const choreData = context.getChoreData();

        if (!choreData) {
          res.status(500).json(apiErr('No data available'));
          return;
        }

        let reset = 0;
        for (const chore of choreData.chores) {
          if (!chore.caughtUp) {
            chore.caughtUp = true;
            reset++;
          }
        }

        context.saveChoreData();
        context.sendNotification(SocketNotifications.CHORE_DATA, choreData);

        Log.info(`Caught up status reset: ${reset} chore(s) updated`);
        res.json({ success: true, reset });
      } catch (error) {
        Log.error(`Error resetting caught up status: ${error}`);
        sendErrorResponse(res, error, 'Failed to reset caught up status');
      }
    },

    putSettings: async (req, res) => {
      if (!(await validatePin(req, res, context))) return;
      try {
        const { historyEnabled, adminPin, timeFormat } = (await getRequestBody(
          req
        )) as UpdateSettingsRequest;
        const choreData = context.getChoreData();

        if (!choreData) {
          res.status(500).json(apiErr('No data available'));
          return;
        }

        // Initialize settings if not present
        if (!choreData.settings) {
          choreData.settings = {
            historyEnabled: true,
            timeFormat: TimeFormat.SYSTEM,
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

        // Update time format if provided
        if (timeFormat !== undefined) {
          choreData.settings.timeFormat = timeFormat;
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
        sendErrorResponse(res, error, 'Failed to update settings');
      }
    },
  };
}
