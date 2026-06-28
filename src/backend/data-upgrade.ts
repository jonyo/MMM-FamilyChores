/**
 * Data migration helper for loading older versions of data.json.
 *
 * This module runs on the raw parsed JSON **before** validation. It is additive
 * and idempotent: it only fills missing fields with safe defaults and never
 * rewrites or removes existing data.
 */

import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  NotCaughtUpDisplay,
  TimeFormat,
} from '../types/chore-types';

/**
 * Upgrade a raw parsed data.json object to the current expected shape.
 *
 * Missing fields are filled with defaults. Existing values are preserved.
 * This function is idempotent: running it on already-upgraded data is a no-op.
 *
 * @param rawData - The parsed JSON from data.json (type unknown for safety)
 * @returns The upgraded data object, still untyped until validation runs
 */
export const upgradeData = (rawData: unknown): Record<string, unknown> => {
  if (!rawData || typeof rawData !== 'object') {
    return {};
  }

  const data = { ...(rawData as Record<string, unknown>) };

  const rawChores = Array.isArray(data.chores) ? data.chores : [];
  const upgradedChores = rawChores.map((chore) => upgradeChore(chore));

  data.chores = upgradedChores;

  // Upgrade settings: add timeFormat default if missing
  if (data.settings && typeof data.settings === 'object') {
    const settings = data.settings as Record<string, unknown>;
    if (settings.timeFormat === undefined) {
      settings.timeFormat = TimeFormat.SYSTEM;
    }
  }

  return data;
};

/**
 * Upgrade a single raw chore object with default values for missing fields.
 *
 * @param chore - Raw chore object from data.json
 * @returns Upgraded chore object
 */
const upgradeChore = (chore: unknown): unknown => {
  if (!chore || typeof chore !== 'object') {
    return chore;
  }

  const choreObj = { ...(chore as Record<string, unknown>) };

  if (choreObj.beforeStartTimeVisibility === undefined) {
    choreObj.beforeStartTimeVisibility = BeforeStartTimeVisibility.HIDE;
  }

  if (choreObj.afterDeadlineVisibility === undefined) {
    choreObj.afterDeadlineVisibility = AfterDeadlineVisibility.SHOW_OVERDUE;
  }
  // Normalize old 'hide' value to the new 'earlier' behavior
  if (choreObj.afterDeadlineVisibility === 'hide') {
    choreObj.afterDeadlineVisibility = AfterDeadlineVisibility.MOVE_TO_EARLIER;
  }

  if (choreObj.notCaughtUpDisplay === undefined) {
    choreObj.notCaughtUpDisplay = NotCaughtUpDisplay.OVERDUE;
  }

  return choreObj;
};
