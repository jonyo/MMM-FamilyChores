import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLocalDateString, getLocalDayName, getLocalTimeString } from './date';

describe('Date Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    // Mock timezone to America/New_York for consistent test results
    const originalDateTimeFormat = Intl.DateTimeFormat;
    vi.spyOn(globalThis.Intl, 'DateTimeFormat').mockImplementation(function (
      this,
      locale,
      options
    ) {
      // Force America/New_York timezone for all date formatting
      return new originalDateTimeFormat(locale, {
        ...options,
        timeZone: 'America/New_York',
      });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getLocalDateString', () => {
    it('should return local date string in YYYY-MM-DD format', () => {
      // Mock current time: 2024-05-12T15:30:00.000Z (UTC)
      // In America/New_York (UTC-4 in May), this is 2024-05-12 at 11:30
      const mockDate = new Date('2024-05-12T15:30:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getLocalDateString();
      expect(result).toBe('2024-05-12');
    });

    it('should handle date boundary crossing with timezone offset', () => {
      // Mock current time: 2024-01-01T02:30:00.000Z (UTC)
      // In America/New_York (UTC-5 in January), this is 2023-12-31 at 21:30
      const mockDate = new Date('2024-01-01T02:30:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getLocalDateString();
      expect(result).toBe('2023-12-31');
    });

    it('should handle DST transition correctly', () => {
      // Mock time during DST: 2024-07-15T18:00:00.000Z (UTC)
      // In America/New_York (UTC-4 in July), this is 2024-07-15 at 14:00
      const mockDate = new Date('2024-07-15T18:00:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getLocalDateString();
      expect(result).toBe('2024-07-15');
    });
  });

  describe('getLocalTimeString', () => {
    it('should return local time string in HH:MM format', () => {
      // Mock current time: 2024-05-12T07:00:00.000Z (UTC)
      // In America/New_York (UTC-4 in May), this is 03:00
      const mockDate = new Date('2024-05-12T07:00:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getLocalTimeString();
      expect(result).toBe('03:00');
    });

    it('should handle midnight correctly', () => {
      // Mock current time: 2024-05-12T04:00:00.000Z (UTC)
      // In America/New_York (UTC-4 in May), this is 00:00
      const mockDate = new Date('2024-05-12T04:00:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getLocalTimeString();
      expect(result).toBe('00:00');
    });

    it('should handle single digit minutes correctly', () => {
      // Mock current time: 2024-05-12T07:05:00.000Z (UTC)
      // In America/New_York (UTC-4 in May), this is 03:05
      const mockDate = new Date('2024-05-12T07:05:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getLocalTimeString();
      expect(result).toBe('03:05');
    });
  });

  describe('getLocalDayName', () => {
    it('should return lowercase day name', () => {
      // Mock current time: 2024-05-12T15:30:00.000Z (UTC)
      // In America/New_York (UTC-4 in May), this is Sunday at 11:30
      const mockDate = new Date('2024-05-12T15:30:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getLocalDayName();
      expect(result).toBe('sunday');
    });

    it('should handle date boundary crossing with timezone offset', () => {
      // Mock current time: 2024-01-01T02:30:00.000Z (UTC)
      // In America/New_York (UTC-5 in January), this is Sunday at 21:30 (previous day)
      const mockDate = new Date('2024-01-01T02:30:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getLocalDayName();
      expect(result).toBe('sunday');
    });

    it('should accept optional date parameter', () => {
      // Test with specific date: 2024-07-04T12:00:00.000Z (UTC)
      // In America/New_York (UTC-4 in July), this is Thursday at 08:00
      const testDate = new Date('2024-07-04T12:00:00.000Z');

      const result = getLocalDayName(testDate);
      expect(result).toBe('thursday');
    });

    it('should handle DST transition correctly', () => {
      // Mock time during DST: 2024-07-15T18:00:00.000Z (UTC)
      // In America/New_York (UTC-4 in July), this is Monday at 14:00
      const mockDate = new Date('2024-07-15T18:00:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getLocalDayName();
      expect(result).toBe('monday');
    });
  });
});
