/**
 * Date utility functions for timezone-aware date handling
 */

import type { DayOfWeek } from '../types/chore-types';

/**
 * Gets the local date string in YYYY-MM-DD format
 * Uses Intl.DateTimeFormat for proper timezone and DST handling
 * @param date - Optional date to convert (defaults to current time)
 */
export const getLocalDateString = (date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
};

/**
 * Gets the local time string in HH:MM format
 * Uses Intl.DateTimeFormat for proper timezone and DST handling
 * @param date - Optional date to convert (defaults to current time)
 */
export const getLocalTimeString = (date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(date);
};

/**
 * Gets the local day name in lowercase (sunday, monday, etc.)
 * Uses Intl.DateTimeFormat for proper timezone and DST handling
 * @param date - Optional date to convert (defaults to current time)
 */
export const getLocalDayName = (date = new Date()): DayOfWeek => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
  });

  return formatter.format(date).toLowerCase() as DayOfWeek;
};

/**
 * Gets the local day name in abbreviated format (Sun, Mon, Tue, etc.)
 * Uses Intl.DateTimeFormat for proper timezone and DST handling
 * @param date - Optional date to convert (defaults to current time)
 */
export const getLocalDayNameShort = (date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
  });

  return formatter.format(date);
};

/**
 * Gets the local month name in abbreviated format (Jan, Feb, Mar, etc.)
 * Uses Intl.DateTimeFormat for proper timezone and DST handling
 * @param date - Optional date to convert (defaults to current time)
 */
export const getLocalMonthNameShort = (date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
  });

  return formatter.format(date);
};

/**
 * Gets the local day of month as a number
 * Uses Intl.DateTimeFormat for proper timezone and DST handling
 * @param date - Optional date to convert (defaults to current time)
 */
export const getLocalDayOfMonth = (date = new Date()): number => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
  });

  return parseInt(formatter.format(date), 10);
};

/**
 * Deadline status enum for visual indicators
 */
export enum DeadlineStatus {
  NORMAL = 'normal',
  OVERDUE = 'overdue',
  COMPLETED = 'completed',
}

/**
 * Determines the deadline status for a chore
 * @param deadline - Optional deadline time in "HH:MM" format
 * @param completedToday - Whether the chore is completed today
 * @param caughtUp - Whether the chore is caught up (completed yesterday)
 * @returns DeadlineStatus for CSS class application
 */
export const getDeadlineStatus = (
  deadline?: string,
  completedToday?: boolean,
  caughtUp?: boolean
): DeadlineStatus => {
  // If completed today, always show as completed
  if (completedToday) {
    return DeadlineStatus.COMPLETED;
  }

  if (caughtUp === false) {
    // always show as overdue if not caught up
    return DeadlineStatus.OVERDUE;
  }

  if (!deadline) {
    // No deadline set, show as normal
    return DeadlineStatus.NORMAL;
  }

  // Parse deadline time and compare with current time
  const currentTime = getLocalTimeString();

  // Simple string comparison works for HH:MM format
  // Use >= so that equal times are considered overdue
  if (currentTime >= deadline) {
    return DeadlineStatus.OVERDUE;
  }

  return DeadlineStatus.NORMAL;
};
