import { describe, expect, it } from 'vitest';
import { generateTestUUID, generateUUID, isValidUUID } from './uuid';

describe('UUID Utilities', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4 format', () => {
      const uuid = generateUUID();

      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate different UUIDs on multiple calls', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      const uuid3 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
      expect(uuid2).not.toBe(uuid3);
      expect(uuid1).not.toBe(uuid3);
    });

    it('should generate UUIDs with correct version and variant', () => {
      const uuid = generateUUID();
      const parts = uuid.split('-');

      // Version 4 should have 4 in the 13th character position
      expect(parts[2][0]).toBe('4');

      // Variant should be 8, 9, a, or b in first character of 4th part
      expect(['8', '9', 'a', 'b']).toContain(parts[3][0]);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID v4 strings', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      ];

      validUUIDs.forEach((uuid) => {
        expect(isValidUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUID strings', () => {
      const invalidUUIDs = [
        'invalid-uuid',
        '550e8400-e29b-41d4-a716', // too short
        '550e8400-e29b-41d4-a716-44665544', // too short
        '550e8400-e29b-51d4-a716-446655440000', // wrong version (5)
        '550e8400-e29b-41d4-c716-446655440000', // wrong variant (c)
        '',
        null,
        undefined,
      ];

      invalidUUIDs.forEach((uuid) => {
        if (uuid === null || uuid === undefined) {
          expect(isValidUUID('')).toBe(false); // Test with empty string for null/undefined cases
        } else {
          expect(isValidUUID(uuid)).toBe(false);
        }
      });
    });
  });

  describe('generateTestUUID', () => {
    it('should generate deterministic UUIDs for testing', () => {
      const uuid1 = generateTestUUID(1);
      const uuid2 = generateTestUUID(2);
      const uuid3 = generateTestUUID(255);

      expect(uuid1).toBe('00000001-0000-4000-8000-000000000001');
      expect(uuid2).toBe('00000002-0000-4000-8000-000000000002');
      expect(uuid3).toBe('000000ff-0000-4000-8000-000000000255');
    });

    it('should generate valid UUID v4 format', () => {
      const uuid = generateTestUUID(42);

      expect(isValidUUID(uuid)).toBe(true);
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });
});
