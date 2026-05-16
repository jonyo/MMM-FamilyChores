import { describe, expect, it, vi } from 'vitest';
import type { CreatePersonRequest, UpdatePersonRequest } from '../types/request-types';
import { createPerson, deletePerson, updatePerson } from './people';

// Mock fetch
globalThis.fetch = vi.fn();

describe('people API', () => {
  describe('createPerson', () => {
    it('should create a person successfully', async () => {
      const mockPerson = { id: 'p1', name: 'Alice', color: '#FF6B6B' };
      const mockRequest: CreatePersonRequest = { name: 'Alice', color: '#FF6B6B' };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPerson,
      } as Response);

      const result = await createPerson(mockRequest);

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      });
      expect(result).toEqual(mockPerson);
    });

    it('should throw error when API returns error response', async () => {
      const mockRequest: CreatePersonRequest = { name: 'Alice', color: '#FF6B6B' };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Name already exists' }),
      } as Response);

      await expect(createPerson(mockRequest)).rejects.toThrow('Name already exists');
    });

    it('should throw generic error when API returns error without message', async () => {
      const mockRequest: CreatePersonRequest = { name: 'Alice', color: '#FF6B6B' };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(createPerson(mockRequest)).rejects.toThrow('Request failed');
    });

    it('should throw error when network fails', async () => {
      const mockRequest: CreatePersonRequest = { name: 'Alice', color: '#FF6B6B' };

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(createPerson(mockRequest)).rejects.toThrow('Network error');
    });
  });

  describe('updatePerson', () => {
    it('should update a person successfully', async () => {
      const mockPerson = { id: 'p1', name: 'Alice Updated', color: '#FF0000' };
      const mockRequest: UpdatePersonRequest = { name: 'Alice Updated', color: '#FF0000' };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPerson,
      } as Response);

      const result = await updatePerson('p1', mockRequest);

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/people/p1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      });
      expect(result).toEqual(mockPerson);
    });

    it('should throw error when API returns error response', async () => {
      const mockRequest: UpdatePersonRequest = { name: 'Alice Updated', color: '#FF0000' };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Person not found' }),
      } as Response);

      await expect(updatePerson('p1', mockRequest)).rejects.toThrow('Person not found');
    });

    it('should throw error when network fails', async () => {
      const mockRequest: UpdatePersonRequest = { name: 'Alice Updated', color: '#FF0000' };

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(updatePerson('p1', mockRequest)).rejects.toThrow('Network error');
    });
  });

  describe('deletePerson', () => {
    it('should delete a person successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await expect(deletePerson('p1')).resolves.not.toThrow();

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/people/p1', {
        method: 'DELETE',
      });
    });

    it('should throw error when API returns error response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Person not found' }),
      } as Response);

      await expect(deletePerson('p1')).rejects.toThrow('Person not found');
    });

    it('should throw error when network fails', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(deletePerson('p1')).rejects.toThrow('Network error');
    });
  });
});
