import { describe, expect, it } from 'vitest';
import { isValidId, validateId } from './validation';

describe('validation', () => {
  describe('isValidId', () => {
    it('accepts valid UUID-like IDs', () => {
      expect(isValidId('abc123-def456')).toBe(true);
      expect(isValidId('123-456-789')).toBe(true);
      expect(isValidId('a1b2c3d4')).toBe(true);
      expect(isValidId('test-id-123')).toBe(true);
    });

    it('rejects IDs with uppercase letters', () => {
      expect(isValidId('ABC123')).toBe(false);
      expect(isValidId('Abc-123')).toBe(false);
      expect(isValidId('abc-DEF')).toBe(false);
    });

    it('rejects IDs with special characters', () => {
      expect(isValidId('abc_123')).toBe(false);
      expect(isValidId('abc@123')).toBe(false);
      expect(isValidId('abc/123')).toBe(false);
      expect(isValidId('abc.123')).toBe(false);
      expect(isValidId('abc!123')).toBe(false);
    });

    it('rejects IDs with spaces', () => {
      expect(isValidId('abc 123')).toBe(false);
      expect(isValidId(' abc-123')).toBe(false);
      expect(isValidId('abc-123 ')).toBe(false);
    });

    it('rejects empty strings', () => {
      expect(isValidId('')).toBe(false);
    });

    it('rejects IDs with only hyphens', () => {
      expect(isValidId('---')).toBe(false);
      expect(isValidId('-')).toBe(false);
    });
  });

  describe('validateId', () => {
    it('does not throw for valid IDs', () => {
      expect(() => validateId('abc123-def456')).not.toThrow();
      expect(() => validateId('123-456-789')).not.toThrow();
    });

    it('throws for invalid IDs', () => {
      expect(() => validateId('ABC123')).toThrow('Invalid ID');
      expect(() => validateId('abc_123')).toThrow('Invalid ID');
      expect(() => validateId('')).toThrow('Invalid ID');
    });

    it('throws with descriptive error message', () => {
      expect(() => validateId('ABC123')).toThrow(
        'Invalid ID: ABC123. ID must contain only lowercase letters, numbers, and hyphens.'
      );
    });
  });
});
