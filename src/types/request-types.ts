import type { SkipDayVisibility, UUID } from './chore-types';

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
 * Request body for restoring data from backup
 */
export interface RestoreDataRequest {
  people: unknown[];
  chores: unknown[];
}

/**
 * Request body for copying chores from one person to another
 */
export interface CopyChoresRequest {
  fromPersonId: UUID;
  toPersonId: UUID;
  choreIds: UUID[];
}
