import { describe, expect, it } from 'vitest';
import { generatePastelColor } from './color';

describe('Color Utilities', () => {
  describe('generatePastelColor', () => {
    it('should generate a valid hex color string in #RRGGBB format', () => {
      const color = generatePastelColor();

      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should generate different colors on multiple calls', () => {
      const color1 = generatePastelColor();
      const color2 = generatePastelColor();
      const color3 = generatePastelColor();

      expect(color1).not.toBe(color2);
      expect(color2).not.toBe(color3);
      expect(color1).not.toBe(color3);
    });

    it('should generate pastel colors with high lightness values', () => {
      // Generate multiple colors and verify they're all pastel (high RGB values)
      const colors = Array.from({ length: 100 }, () => generatePastelColor());

      colors.forEach((color) => {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        // Pastel colors have high lightness (RGB values should be 180-255)
        expect(r).toBeGreaterThanOrEqual(180);
        expect(r).toBeLessThanOrEqual(255);
        expect(g).toBeGreaterThanOrEqual(180);
        expect(g).toBeLessThanOrEqual(255);
        expect(b).toBeGreaterThanOrEqual(180);
        expect(b).toBeLessThanOrEqual(255);
      });
    });

    it('should generate colors with valid hex characters', () => {
      const color = generatePastelColor();
      const hexPart = color.slice(1); // Remove #

      // All characters should be valid hex digits
      const validHexChars = /^[0-9a-f]{6}$/i;
      expect(hexPart).toMatch(validHexChars);
    });
  });
});
