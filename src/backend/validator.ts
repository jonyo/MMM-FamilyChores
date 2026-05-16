import type { Chore, Person } from '../types/chore-types';
import { ChoreType, DayOfWeek, SkipDayVisibility } from '../types/chore-types';
import { isValidUUID } from '../utils/uuid';

type ValidatedResult = { valid: true } | { valid: false; error: string };

export const validatePerson = (person: unknown): ValidatedResult => {
  if (!person || typeof person !== 'object') {
    return { valid: false, error: 'Person must be an object' };
  }

  const personObj = person as Record<string, unknown>;

  if (!personObj.id || typeof personObj.id !== 'string' || !personObj.id.trim()) {
    return { valid: false, error: 'Person must have a non-empty id' };
  }
  if (!isValidUUID(personObj.id)) {
    return { valid: false, error: 'Person id must be a valid UUID' };
  }
  if (!personObj.name || typeof personObj.name !== 'string') {
    return { valid: false, error: 'Person must have a name' };
  }
  if (!personObj.name.trim()) {
    return { valid: false, error: 'Person name must be non-empty' };
  }
  if (!personObj.color || typeof personObj.color !== 'string') {
    return { valid: false, error: 'Person color must be a string' };
  }
  if (!personObj.color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)) {
    return {
      valid: false,
      error: 'Person color must be a valid hex color (e.g., #FF5733 or #F53)',
    };
  }

  return { valid: true };
};

export const validateChore = (chore: unknown | Chore, people: Person[]): ValidatedResult => {
  if (!chore || typeof chore !== 'object') {
    return { valid: false, error: 'Chore must be an object' };
  }

  const choreObj = chore as Record<string, unknown>;

  // validate all of the entries on chore...
  if (!choreObj.id || typeof choreObj.id !== 'string' || !choreObj.id.trim()) {
    return { valid: false, error: 'Chore must have a non-empty id' };
  }
  if (!isValidUUID(choreObj.id)) {
    return { valid: false, error: 'Chore id must be a valid UUID' };
  }
  if (!choreObj.name || typeof choreObj.name !== 'string') {
    return { valid: false, error: 'Chore must have a name' };
  }
  if (!choreObj.name.trim()) {
    return { valid: false, error: 'Chore name must be non-empty' };
  }
  if (!choreObj.type || typeof choreObj.type !== 'string') {
    return { valid: false, error: 'Chore must have a type' };
  }
  if (!Object.values(ChoreType).includes(choreObj.type as ChoreType)) {
    return { valid: false, error: 'Chore type must be either "personal" or "rotating"' };
  }

  // Validate deadline (optional, but must be HH:MM if present)
  if (choreObj.deadline !== undefined) {
    if (typeof choreObj.deadline !== 'string') {
      return { valid: false, error: 'Chore deadline must be a string' };
    }
    if (!choreObj.deadline.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      return {
        valid: false,
        error: 'Chore deadline must be in 24-hour format (e.g., "08:00" or "21:00")',
      };
    }
  }

  // Validate skipDays (required, must be array of DayOfWeek enum values)
  if (!choreObj.skipDays || !Array.isArray(choreObj.skipDays)) {
    return { valid: false, error: 'Chore must have a skipDays array' };
  }
  for (const day of choreObj.skipDays) {
    if (typeof day !== 'string' || !Object.values(DayOfWeek).includes(day as DayOfWeek)) {
      return {
        valid: false,
        error: 'Chore skipDays must be valid day names (e.g., "monday", "tuesday")',
      };
    }
  }

  // Validate skipDayVisibility (required, must be SkipDayVisibility enum value)
  if (!choreObj.skipDayVisibility || typeof choreObj.skipDayVisibility !== 'string') {
    return { valid: false, error: 'Chore must have a skipDayVisibility' };
  }
  if (!Object.values(SkipDayVisibility).includes(choreObj.skipDayVisibility as SkipDayVisibility)) {
    return {
      valid: false,
      error: 'Chore skipDayVisibility must be "hide", "show-if-overdue", or "show-always"',
    };
  }

  // Validate caughtUp (required, must be boolean)
  if (typeof choreObj.caughtUp !== 'boolean') {
    return { valid: false, error: 'Chore must have a caughtUp boolean' };
  }

  // Validate completedToday (required, must be boolean)
  if (typeof choreObj.completedToday !== 'boolean') {
    return { valid: false, error: 'Chore must have a completedToday boolean' };
  }

  if (choreObj.type === ChoreType.PERSONAL) {
    return validatePersonalChoreParts(choreObj, people);
  }
  return validateRotatingChoreParts(choreObj, people);
};

const validateRotatingChoreParts = (
  chore: Record<string, unknown>,
  people: Person[]
): ValidatedResult => {
  // validate all of the entries on chore...
  if (chore.type !== ChoreType.ROTATING) {
    return { valid: false, error: 'Chore type must be "rotating"' };
  }

  // validate rotation array
  if (!chore.rotation || !Array.isArray(chore.rotation)) {
    return { valid: false, error: 'Rotating chore must have a rotation array' };
  }
  for (const personId of chore.rotation) {
    if (typeof personId !== 'string' || !personId) {
      return {
        valid: false,
        error: 'Rotating chore rotation must be an array of non-empty strings',
      };
    }
    if (!people.some((person) => person.id === personId)) {
      return {
        valid: false,
        error: 'Rotating chore rotation must be an array of valid person IDs',
      };
    }
  }

  // check that it does not have personal only fields
  if (chore.assignedTo !== undefined) {
    return { valid: false, error: 'Rotating chore must not have an assignedTo field' };
  }

  // Validate rotatingIndex (required for rotating chores)
  if (typeof chore.rotatingIndex !== 'number') {
    return { valid: false, error: 'Rotating chore must have a rotatingIndex number' };
  }
  if (chore.rotatingIndex < 0 || chore.rotatingIndex >= chore.rotation.length) {
    return {
      valid: false,
      error: 'Rotating chore rotatingIndex must be within bounds of rotation array',
    };
  }

  return { valid: true };
};

const validatePersonalChoreParts = (
  chore: Record<string, unknown>,
  people: Person[]
): ValidatedResult => {
  // validate all of the entries on chore...
  if (chore.type !== ChoreType.PERSONAL) {
    return { valid: false, error: 'Chore type must be "personal"' };
  }

  // validate assignedTo
  if (!chore.assignedTo || typeof chore.assignedTo !== 'string') {
    return { valid: false, error: 'Personal chore must have an assignedTo field' };
  }
  if (!people.some((person) => person.id === chore.assignedTo)) {
    return { valid: false, error: 'Personal chore assignedTo - person not found' };
  }

  // check that it does not have rotating only fields
  if (chore.rotation !== undefined) {
    return { valid: false, error: 'Personal chore must not have a rotation array' };
  }
  if (chore.rotatingIndex !== undefined) {
    return { valid: false, error: 'Personal chore must not have a rotatingIndex field' };
  }

  return { valid: true };
};
