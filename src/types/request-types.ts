import type { Chore, Person, SkipDayVisibility, UUID } from './chore-types';

/**
 * JSON **request** bodies for the Express admin routes in `setupAdminRoutes`
 * (node_helper). Error **response** bodies use `ApiErrorBody` in `response-types.ts`.
 * Socket payloads use `socket-payload-types.ts`.
 */

/**
 * Request body for creating a new person
 */
export interface CreatePersonRequest {
  name: string;
  color: string;
}

/**
 * Request body for updating a person
 */
export interface UpdatePersonRequest {
  name?: string;
  color?: string;
}

/**
 * Request body for creating a new chore
 */
export interface CreateChoreRequest {
  name: string;
  type: 'personal' | 'rotating';
  assignedTo?: UUID;
  rotation?: UUID[];
  deadline?: string;
  skipDays?: string[];
  skipDayVisibility?: SkipDayVisibility;
}

/**
 * Request body for updating a chore
 */
export interface UpdateChoreRequest extends Partial<CreateChoreRequest> {}

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
  lastResetDate?: string;
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
export interface CopyChoresRequest {
  fromPersonId: UUID;
  toPersonId: UUID;
  choreIds: UUID[];
}
