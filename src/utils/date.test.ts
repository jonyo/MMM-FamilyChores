import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DeadlineStatus,
  getDeadlineStatus,
  getLocalDateString,
  getLocalDayName,
  getLocalTimeString,
} from './date';

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

  describe('getDeadlineStatus', () => {
    it('should return completed when chore is completed today', () => {
      // Mock current time: 2024-05-12T15:30:00.000Z (UTC) -> 11:30 in NY
      const mockDate = new Date('2024-05-12T15:30:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getDeadlineStatus('08:00', true);
      expect(result).toBe(DeadlineStatus.COMPLETED);
    });

    it('should return normal when chore has no deadline', () => {
      // Mock current time: 2024-05-12T15:30:00.000Z (UTC) -> 11:30 in NY
      const mockDate = new Date('2024-05-12T15:30:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getDeadlineStatus(undefined, false);
      expect(result).toBe(DeadlineStatus.NORMAL);
    });

    it('should return normal when current time is before deadline', () => {
      // Mock current time: 2024-05-12T15:30:00.000Z (UTC) -> 11:30 in NY
      const mockDate = new Date('2024-05-12T15:30:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getDeadlineStatus('12:00', false);
      expect(result).toBe(DeadlineStatus.NORMAL);
    });

    it('should return overdue when current time is after deadline', () => {
      // Mock current time: 2024-05-12T15:30:00.000Z (UTC) -> 11:30 in NY
      const mockDate = new Date('2024-05-12T15:30:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getDeadlineStatus('10:00', false);
      expect(result).toBe(DeadlineStatus.OVERDUE);
    });

    it('should return overdue when current time equals deadline', () => {
      // Mock current time: 2024-05-12T15:30:00.000Z (UTC) -> 11:30 in NY
      const mockDate = new Date('2024-05-12T15:30:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getDeadlineStatus('11:30', false);
      expect(result).toBe(DeadlineStatus.OVERDUE);
    });

    it('should handle edge cases with midnight deadlines', () => {
      // Mock current time: 2024-05-12T04:00:00.000Z (UTC) -> 00:00 in NY
      const mockDate = new Date('2024-05-12T04:00:00.000Z');
      vi.setSystemTime(mockDate);

      // At exactly midnight, deadline should be overdue
      const result = getDeadlineStatus('00:00', false);
      expect(result).toBe(DeadlineStatus.OVERDUE);
    });

    it('should handle edge cases with 23:59 deadlines', () => {
      // Mock current time: 2024-05-12T15:30:00.000Z (UTC) -> 11:30 in NY
      const mockDate = new Date('2024-05-12T15:30:00.000Z');
      vi.setSystemTime(mockDate);

      // Should be normal since 11:30 < 23:59
      const result = getDeadlineStatus('23:59', false);
      expect(result).toBe(DeadlineStatus.NORMAL);
    });

    it('should prioritize completed status over deadline status', () => {
      // Mock current time: 2024-05-12T15:30:00.000Z (UTC) -> 11:30 in NY
      const mockDate = new Date('2024-05-12T15:30:00.000Z');
      vi.setSystemTime(mockDate);

      // Even though deadline is passed, completed status takes priority
      const result = getDeadlineStatus('08:00', true);
      expect(result).toBe(DeadlineStatus.COMPLETED);
    });
  });
});
