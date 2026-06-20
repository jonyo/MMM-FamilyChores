import { describe, expect, it, vi } from 'vitest';
import {
  BeforeStartTimeVisibility,
  ChoreType,
  DayOfWeek,
  NotCaughtUpDisplay,
  PostDeadlineVisibility,
  SkipDayVisibility,
} from '../types/chore-types';
import type {
  CopyChoresRequest,
  CreateChoreRequest,
  UpdateChoreRequest,
} from '../types/request-types';
import { copyChores, createChore, deleteChore, updateChore } from './chores';

// Mock fetch
globalThis.fetch = vi.fn();

describe('chores API', () => {
  describe('createChore', () => {
    it('should create a personal chore successfully', async () => {
      const mockChore = {
        id: 'c1',
        name: 'Take out trash',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: true,
        completedToday: false,
      };
      const mockRequest: CreateChoreRequest = {
        name: 'Take out trash',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockChore,
      } as Response);

      const result = await createChore(mockRequest);

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      });
      expect(result).toEqual(mockChore);
    });

    it('should call the correct endpoint with correct method', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      await createChore({
        name: 'Take out trash',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/MMM-FamilyChores/chores',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Take out trash',
            type: ChoreType.PERSONAL,
            assignedTo: 'p1',
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
            postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
            notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
          }),
        })
      );
    });

    it('should create a rotating chore successfully', async () => {
      const mockChore = {
        id: 'c2',
        name: 'Do dishes',
        type: ChoreType.ROTATING,
        rotation: ['p1', 'p2'],
        rotatingIndex: 0,
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: true,
        completedToday: false,
      };
      const mockRequest: CreateChoreRequest = {
        name: 'Do dishes',
        type: ChoreType.ROTATING,
        rotation: ['p1', 'p2'],
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockChore,
      } as Response);

      const result = await createChore(mockRequest);

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      });
      expect(result).toEqual(mockChore);
    });

    it('should include PIN in request body when provided', async () => {
      const mockRequest: CreateChoreRequest = {
        name: 'Take out trash',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        pin: 'secret123',
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'c1' }),
      } as Response);

      await createChore(mockRequest);

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      });
    });

    it('should throw error when API returns error response', async () => {
      const mockRequest: CreateChoreRequest = {
        name: 'Take out trash',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Chore already exists' }),
      } as Response);

      await expect(createChore(mockRequest)).rejects.toThrow('Chore already exists');
    });

    it('should throw generic error when API returns error without message', async () => {
      const mockRequest: CreateChoreRequest = {
        name: 'Take out trash',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(createChore(mockRequest)).rejects.toThrow('Request failed');
    });

    it('should throw error when network fails', async () => {
      const mockRequest: CreateChoreRequest = {
        name: 'Take out trash',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
      };

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(createChore(mockRequest)).rejects.toThrow('Network error');
    });
  });

  describe('updateChore', () => {
    it('should update a personal chore successfully', async () => {
      const mockChore = {
        id: 'c1',
        name: 'Take out trash Updated',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        skipDays: [DayOfWeek.SUNDAY],
        skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
        caughtUp: true,
        completedToday: false,
      };
      const mockRequest: UpdateChoreRequest = {
        name: 'Take out trash Updated',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        skipDays: [DayOfWeek.SUNDAY],
        skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockChore,
      } as Response);

      const result = await updateChore('c1', mockRequest);

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/chores/c1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      });
      expect(result).toEqual(mockChore);
    });

    it('should include PIN in update request when provided', async () => {
      const mockRequest: UpdateChoreRequest = {
        name: 'Updated name',
        pin: 'secret123',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'c1' }),
      } as Response);

      await updateChore('c1', mockRequest);

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/chores/c1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      });
    });

    it('should throw error when API returns error response', async () => {
      const mockRequest: UpdateChoreRequest = { name: 'Updated name' };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Chore not found' }),
      } as Response);

      await expect(updateChore('c1', mockRequest)).rejects.toThrow('Chore not found');
    });

    it('should throw error when network fails', async () => {
      const mockRequest: UpdateChoreRequest = { name: 'Updated name' };

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(updateChore('c1', mockRequest)).rejects.toThrow('Network error');
    });
  });

  describe('deleteChore', () => {
    it('should delete a chore successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await expect(deleteChore('c1')).resolves.not.toThrow();

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/chores/c1', {
        method: 'DELETE',
      });
    });

    it('should delete a chore with PIN query param', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await expect(deleteChore('c1', 'secret123')).resolves.not.toThrow();

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/chores/c1?pin=secret123', {
        method: 'DELETE',
      });
    });

    it('should throw error when API returns error response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Chore not found' }),
      } as Response);

      await expect(deleteChore('c1')).rejects.toThrow('Chore not found');
    });

    it('should throw error when network fails', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(deleteChore('c1')).rejects.toThrow('Network error');
    });
  });

  describe('copyChores', () => {
    it('should copy chores successfully', async () => {
      const mockRequest: CopyChoresRequest = {
        fromPersonId: 'p1',
        toPersonId: 'p2',
        choreIds: ['c1', 'c2'],
      };
      const mockNewChores = [
        {
          id: 'c3',
          name: 'Take out trash',
          type: ChoreType.PERSONAL,
          assignedTo: 'p2',
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
          caughtUp: true,
          completedToday: false,
        },
        {
          id: 'c4',
          name: 'Do dishes',
          type: ChoreType.PERSONAL,
          assignedTo: 'p2',
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
          caughtUp: true,
          completedToday: false,
        },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNewChores,
      } as Response);

      await expect(copyChores(mockRequest)).resolves.not.toThrow();

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/copy-chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      });
    });

    it('should include PIN in copy chores request when provided', async () => {
      const mockRequest: CopyChoresRequest = {
        fromPersonId: 'p1',
        toPersonId: 'p2',
        choreIds: ['c1'],
        pin: 'secret123',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'c2' }],
      } as Response);

      await copyChores(mockRequest);

      expect(fetch).toHaveBeenCalledWith('/MMM-FamilyChores/copy-chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      });
    });

    it('should throw error when API returns error response', async () => {
      const mockRequest: CopyChoresRequest = {
        fromPersonId: 'p1',
        toPersonId: 'p2',
        choreIds: ['c1'],
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Chore not found' }),
      } as Response);

      await expect(copyChores(mockRequest)).rejects.toThrow('Chore not found');
    });

    it('should throw error when network fails', async () => {
      const mockRequest: CopyChoresRequest = {
        fromPersonId: 'p1',
        toPersonId: 'p2',
        choreIds: ['c1'],
      };

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(copyChores(mockRequest)).rejects.toThrow('Network error');
    });
  });
});
