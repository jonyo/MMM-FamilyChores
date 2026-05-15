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
