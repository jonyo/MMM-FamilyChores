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
