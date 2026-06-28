/**
 * Client-Side Only Utilities
 *
 * This file contains utilities that require browser/DOM APIs and can only run in a browser environment.
 * These utilities are excluded from Node.js tests in the vitest configuration.
 */

/**
 * Generate a random pastel color (light, soft colors suitable for dark backgrounds)
 * Returns a hex color string in #RRGGBB format
 */
export const generatePastelColor = (): string => {
  // Generate random RGB values with high lightness (180-255 for pastel effect)
  const r = 180 + Math.floor(Math.random() * 75);
  const g = 180 + Math.floor(Math.random() * 75);
  const b = 180 + Math.floor(Math.random() * 75);

  // Convert to hex
  const toHex = (value: number): string => {
    const hex = value.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Escape HTML special characters to prevent XSS attacks
 * Uses the browser's DOM API to properly escape HTML entities
 *
 * @param raw - The raw string to escape
 * @returns The escaped HTML string
 */
export const escapeHtml = (raw: string): string => {
  const div = document.createElement('div');
  div.textContent = raw;
  return div.innerHTML;
};

/**
 * Detect whether the system locale prefers 12-hour or 24-hour time.
 * Returns true if the system uses 12-hour format.
 */
const systemUses12Hour = (): boolean => {
  const hourCycle = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions()
    .hourCycle;
  return hourCycle === 'h11' || hourCycle === 'h12';
};

/**
 * Format a 24-hour HH:MM time string for display according to the configured time format.
 *
 * @param time - Time string in 24-hour HH:MM format (e.g. "14:30")
 * @param timeFormat - The TimeFormat setting value ("system", "12h", or "24h")
 * @returns Formatted time string for display (e.g. "2:30 PM" or "14:30")
 */
export const formatTime = (time: string, timeFormat: string): string => {
  const use12Hour = timeFormat === '12h' || (timeFormat === 'system' && systemUses12Hour());

  if (!use12Hour) {
    return time;
  }

  const [hourStr, minuteStr] = time.split(':');
  const hour = Number.parseInt(hourStr, 10);
  const ampm = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteStr} ${ampm}`;
};
