import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyCompletion } from '../types/chore-types';
import { getHistory } from './history';

describe('getHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches history from the API', async () => {
    const mockHistory: DailyCompletion[] = [
      {
        id: '123',
        date: '2024-01-01',
        personId: 'person-1',
        choreId: 'chore-1',
        completed: true,
        completedAt: '12:00',
        wasLate: false,
        wasSkipDay: false,
        wasMyTurn: false,
      },
    ];

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      } as Response)
    );

    const result = await getHistory();
    expect(result).toEqual(mockHistory);
    expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/history');
  });

  it('fetches history for a specific person', async () => {
    const mockHistory: DailyCompletion[] = [
      {
        id: '123',
        date: '2024-01-01',
        personId: 'person-1',
        choreId: 'chore-1',
        completed: true,
        completedAt: '12:00',
        wasLate: false,
        wasSkipDay: false,
        wasMyTurn: false,
      },
    ];

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      } as Response)
    );

    const result = await getHistory('person-1');
    expect(result).toEqual(mockHistory);
    expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/history?personId=person-1');
  });

  it('throws error when API request fails', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch history' }),
      } as Response)
    );

    await expect(getHistory()).rejects.toThrow('Failed to fetch history');
  });

  it('throws error on network failure', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    await expect(getHistory()).rejects.toThrow('Network error');
  });
});
