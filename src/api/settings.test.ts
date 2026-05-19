import { describe, expect, it, vi } from 'vitest';
import { downloadBackup, updateSettings } from './settings';

// Mock fetch
globalThis.fetch = vi.fn();

describe('settings API', () => {
  describe('updateSettings', () => {
    it('should update settings successfully', async () => {
      const mockSettings = { historyEnabled: false };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      } as Response);

      const result = await updateSettings({ historyEnabled: false });

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyEnabled: false }),
      });
      expect(result).toEqual(mockSettings);
    });

    it('should update settings with PIN', async () => {
      const mockSettings = { historyEnabled: true };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      } as Response);

      const result = await updateSettings({ historyEnabled: true, pin: '1234' });

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyEnabled: true, pin: '1234' }),
      });
      expect(result).toEqual(mockSettings);
    });

    it('should throw error when API returns error response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid PIN' }),
      } as Response);

      await expect(updateSettings({ pin: 'wrong' })).rejects.toThrow('Invalid PIN');
    });

    it('should throw generic error when API returns error without message', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(updateSettings({})).rejects.toThrow('Request failed');
    });

    it('should throw error when network fails', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(updateSettings({})).rejects.toThrow('Network error');
    });
  });

  describe('downloadBackup', () => {
    it('should download backup without PIN', async () => {
      const mockBlob = new Blob(['{}'], { type: 'application/json' });

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      } as Response);

      const result = await downloadBackup();

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/backup');
      expect(result).toBe(mockBlob);
    });

    it('should download backup with PIN', async () => {
      const mockBlob = new Blob(['{}'], { type: 'application/json' });

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      } as Response);

      const result = await downloadBackup('secret123');

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/backup?pin=secret123');
      expect(result).toBe(mockBlob);
    });

    it('should encode special characters in PIN', async () => {
      const mockBlob = new Blob(['{}'], { type: 'application/json' });

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      } as Response);

      await downloadBackup('pin with spaces & symbols=');

      expect(fetch).toHaveBeenCalledWith(
        '/MMM-FamilyChores/backup?pin=pin%20with%20spaces%20%26%20symbols%3D'
      );
    });

    it('should throw error when API returns error response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid PIN' }),
      } as Response);

      await expect(downloadBackup('wrong')).rejects.toThrow('Invalid PIN');
    });

    it('should throw generic error when API returns error without message', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(downloadBackup()).rejects.toThrow('Request failed with status');
    });

    it('should throw error when network fails', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(downloadBackup()).rejects.toThrow('Network error');
    });
  });
});
