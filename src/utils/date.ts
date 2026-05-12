/**
 * Date utility functions for timezone-aware date handling
 */

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
export const getLocalDayName = (date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
  });

  return formatter.format(date).toLowerCase();
};
