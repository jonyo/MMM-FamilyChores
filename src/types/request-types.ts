import type { Chore, ChoreType, DayOfWeek, Person, SkipDayVisibility, UUID } from './chore-types';

/**
 * JSON **request** bodies for the Express admin routes in `setupAdminRoutes`
 * (node_helper). Error **response** bodies use `ApiErrorBody` in `response-types.ts`.
 * Socket payloads use `socket-payload-types.ts`.
 */

/**
 * Base fields for PIN-protected requests
 */
interface PinProtectedRequest {
  /**
   * PIN for validating admin actions. Required when adminPin is configured.
   */
  pin?: string;
}

/**
 * Request body for creating a new person
 */
export interface CreatePersonRequest extends PinProtectedRequest {
  name: string;
  color: string;
}

/**
 * Request body for updating a person
 */
export interface UpdatePersonRequest extends PinProtectedRequest {
  name?: string;
  color?: string;
}

/**
 * Request body for creating a new chore
 */
export interface CreateChoreRequest extends PinProtectedRequest {
  name: string;
  type: ChoreType;
  assignedTo?: UUID;
  rotation?: UUID[];
  rotatingIndex?: number;
  deadline?: string;
  skipDays?: DayOfWeek[];
  skipDayVisibility?: SkipDayVisibility;
}

/**
 * Request body for updating a chore
 */
export interface UpdateChoreRequest extends Partial<CreateChoreRequest> {
  pin?: string;
}

/**
 * Restore upload JSON. Defaults use `unknown` for each row so the **server** can
 * treat the body as untrusted. Typed senders use `RestoreDataBody<Person, Chore>`,
 * {@link RestoreDataSubmission}, or `extends` this interface with narrower element
 * types (or extra metadata fields).
 *
 * This does not validate at runtime: the receiver must still run `validatePerson` /
 * `validateChore` on each entry.
 */
export interface RestoreDataBody<TPerson = unknown, TChore = unknown> {
  people: TPerson[];
  chores: TChore[];
  dailyCompletions?: unknown[];
  lastResetDate?: string;
  settings?: {
    historyEnabled?: boolean;
  };
  pin?: string;
}

/**
 * Untrusted POST `/MMM-FamilyChores/restore` body after deserialization.
 */
export type RestoreDataRequest = RestoreDataBody;

/**
 * Payload built from trusted in-memory data (e.g. `FamilyChoresData`) when the
 * admin or tooling composes JSON locally in TypeScript.
 */
export type RestoreDataSubmission = RestoreDataBody<Person, Chore>;

/**
 * Request body for copying chores from one person to another
 */
export interface CopyChoresRequest extends PinProtectedRequest {
  fromPersonId: UUID;
  toPersonId: UUID;
  choreIds: UUID[];
}

/**
 * Request body for updating global settings
 */
export interface UpdateSettingsRequest extends PinProtectedRequest {
  historyEnabled?: boolean;
  adminPin?: string | null;
}

/**
 * Request body for advancing all rotating chores to the next person in rotation
 */
export type AdvanceRotationsRequest = PinProtectedRequest;

/**
 * Request body for resetting all chores to caught up status
 */
export type ResetCaughtUpRequest = PinProtectedRequest;
