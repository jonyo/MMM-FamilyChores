import type { Chore, Person } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  DayOfWeek,
  NotCaughtUpDisplay,
  SkipDayVisibility,
  TimeFormat,
} from '../types/chore-types';
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

  // Validate startTime (optional, but must be HH:MM if present)
  if (choreObj.startTime !== undefined) {
    if (typeof choreObj.startTime !== 'string') {
      return { valid: false, error: 'Chore startTime must be a string' };
    }
    if (!choreObj.startTime.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      return {
        valid: false,
        error: 'Chore startTime must be in 24-hour format (e.g., "08:00" or "21:00")',
      };
    }
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

  // If both startTime and deadline are set, startTime must be before deadline
  if (
    typeof choreObj.startTime === 'string' &&
    typeof choreObj.deadline === 'string' &&
    choreObj.startTime >= choreObj.deadline
  ) {
    return { valid: false, error: 'Chore startTime must be before deadline' };
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

  // Validate beforeStartTimeVisibility (required, must be valid enum value)
  if (
    !choreObj.beforeStartTimeVisibility ||
    typeof choreObj.beforeStartTimeVisibility !== 'string'
  ) {
    return { valid: false, error: 'Chore must have a beforeStartTimeVisibility' };
  }
  if (
    !Object.values(BeforeStartTimeVisibility).includes(
      choreObj.beforeStartTimeVisibility as BeforeStartTimeVisibility
    )
  ) {
    return {
      valid: false,
      error: 'Chore beforeStartTimeVisibility must be "hide" or "show-if-overdue"',
    };
  }

  // Validate afterDeadlineVisibility (required, must be valid enum value)
  if (!choreObj.afterDeadlineVisibility || typeof choreObj.afterDeadlineVisibility !== 'string') {
    return { valid: false, error: 'Chore must have a afterDeadlineVisibility' };
  }
  if (
    !Object.values(AfterDeadlineVisibility).includes(
      choreObj.afterDeadlineVisibility as AfterDeadlineVisibility
    )
  ) {
    return {
      valid: false,
      error: 'Chore afterDeadlineVisibility must be "normal", "overdue", or "earlier"',
    };
  }

  // Validate notCaughtUpDisplay (required, must be valid enum value)
  if (!choreObj.notCaughtUpDisplay || typeof choreObj.notCaughtUpDisplay !== 'string') {
    return { valid: false, error: 'Chore must have a notCaughtUpDisplay' };
  }
  if (
    !Object.values(NotCaughtUpDisplay).includes(choreObj.notCaughtUpDisplay as NotCaughtUpDisplay)
  ) {
    return {
      valid: false,
      error: 'Chore notCaughtUpDisplay must be "normal" or "overdue"',
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

export const validateSettings = (settings: unknown): ValidatedResult => {
  if (!settings || typeof settings !== 'object') {
    return { valid: false, error: 'Settings must be an object' };
  }

  const settingsObj = settings as Record<string, unknown>;

  // Validate historyEnabled (required, must be boolean)
  if (typeof settingsObj.historyEnabled !== 'boolean') {
    return { valid: false, error: 'Settings must have a historyEnabled boolean' };
  }

  // Validate adminPin (optional, must be string or null if present)
  if (settingsObj.adminPin !== undefined && settingsObj.adminPin !== null) {
    if (typeof settingsObj.adminPin !== 'string') {
      return { valid: false, error: 'Settings adminPin must be a string or null' };
    }
  }

  // Validate timeFormat (optional, must be a valid TimeFormat enum value if present)
  if (settingsObj.timeFormat !== undefined) {
    if (!Object.values(TimeFormat).includes(settingsObj.timeFormat as TimeFormat)) {
      return {
        valid: false,
        error: `Settings timeFormat must be one of: ${Object.values(TimeFormat).join(', ')}`,
      };
    }
  }

  return { valid: true };
};

export const validateDailyCompletion = (completion: unknown, chores: Chore[]): ValidatedResult => {
  if (!completion || typeof completion !== 'object') {
    return { valid: false, error: 'Daily completion must be an object' };
  }

  const completionObj = completion as Record<string, unknown>;

  // Validate id (required, must be valid UUID)
  if (!completionObj.id || typeof completionObj.id !== 'string' || !completionObj.id.trim()) {
    return { valid: false, error: 'Daily completion must have a non-empty id' };
  }
  if (!isValidUUID(completionObj.id)) {
    return { valid: false, error: 'Daily completion id must be a valid UUID' };
  }

  // Validate date (required, must be YYYY-MM-DD format)
  if (!completionObj.date || typeof completionObj.date !== 'string') {
    return { valid: false, error: 'Daily completion must have a date string' };
  }
  if (!completionObj.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return {
      valid: false,
      error: 'Daily completion date must be in YYYY-MM-DD format (e.g., "2024-01-15")',
    };
  }

  // Validate personId (required, must be valid UUID)
  if (
    !completionObj.personId ||
    typeof completionObj.personId !== 'string' ||
    !completionObj.personId.trim()
  ) {
    return { valid: false, error: 'Daily completion must have a non-empty personId' };
  }
  if (!isValidUUID(completionObj.personId)) {
    return { valid: false, error: 'Daily completion personId must be a valid UUID' };
  }

  // Validate choreId (required, must be valid UUID and exist in chores)
  if (
    !completionObj.choreId ||
    typeof completionObj.choreId !== 'string' ||
    !completionObj.choreId.trim()
  ) {
    return { valid: false, error: 'Daily completion must have a non-empty choreId' };
  }
  if (!isValidUUID(completionObj.choreId)) {
    return { valid: false, error: 'Daily completion choreId must be a valid UUID' };
  }
  if (!chores.some((chore) => chore.id === completionObj.choreId)) {
    return {
      valid: false,
      error: 'Daily completion choreId references a non-existent chore (may have been deleted)',
    };
  }

  // Validate completed (required, must be boolean)
  if (typeof completionObj.completed !== 'boolean') {
    return { valid: false, error: 'Daily completion must have a completed boolean' };
  }

  // Validate completedAt (optional, must be HH:MM if present)
  if (completionObj.completedAt !== undefined) {
    if (typeof completionObj.completedAt !== 'string') {
      return { valid: false, error: 'Daily completion completedAt must be a string' };
    }
    if (!completionObj.completedAt.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      return {
        valid: false,
        error: 'Daily completion completedAt must be in 24-hour format (e.g., "12:00" or "19:30")',
      };
    }
  }

  // Validate wasLate (required, must be boolean)
  if (typeof completionObj.wasLate !== 'boolean') {
    return { valid: false, error: 'Daily completion must have a wasLate boolean' };
  }

  return { valid: true };
};
