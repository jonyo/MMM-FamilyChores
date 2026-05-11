import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Chore } from '../types/chore-types';
import nodeHelper from './node-helper';

// Mock node_helper to return the module object passed to create
vi.mock('node_helper', () => ({
  default: {
    create: (moduleObj: unknown) => moduleObj,
  },
}));

// Mock Log global
vi.stubGlobal('Log', {
  info: vi.fn(),
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
});

describe('Node Helper Tests', () => {
  let mockSendSocketNotification: ReturnType<typeof vi.fn>;
  let mockSaveChoreData: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // nodeHelper is already imported and mocked

    // Mock socket notification
    mockSendSocketNotification = vi.fn();
    nodeHelper.sendSocketNotification = mockSendSocketNotification;

    // Mock saveChoreData to avoid file I/O
    mockSaveChoreData = vi.fn();
    nodeHelper.saveChoreData = mockSaveChoreData;

    // Set up config
    nodeHelper.config = { adminPin: null, dataFile: 'test-data.json' };

    // Create default chore data
    nodeHelper.choreData = nodeHelper.createDefaultData();
  });

  describe('createDefaultData', () => {
    it('should create default data structure', () => {
      const defaultData = nodeHelper.createDefaultData();

      expect(defaultData).toHaveProperty('people');
      expect(defaultData).toHaveProperty('chores');
      expect(defaultData).toHaveProperty('state');
      expect(defaultData.people).toHaveLength(5);
      expect(defaultData.chores).toHaveLength(4);
      expect(defaultData.state).toHaveProperty('previousLastCompleted');
    });
  });

  describe('handleChoreToggle', () => {
    it('should mark chore as completed', () => {
      const payload = { choreId: '1', completed: true };

      nodeHelper.handleChoreToggle(payload);

      expect(nodeHelper.choreData?.state.completedToday).toContain('1');
      expect(nodeHelper.choreData?.state.lastCompleted['1']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(mockSaveChoreData).toHaveBeenCalled();
      expect(mockSendSocketNotification).toHaveBeenCalledWith('CHORE_UPDATE_RESULT', {
        choreId: '1',
        completed: true,
      });
    });

    it('should mark chore as incomplete', () => {
      // First mark as completed
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      nodeHelper.choreData.state.completedToday.push('1');

      const payload = { choreId: '1', completed: false };
      nodeHelper.handleChoreToggle(payload);

      expect(nodeHelper.choreData.state.completedToday).not.toContain('1');
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should move current lastCompleted to previousLastCompleted when marking complete', () => {
      // Set up chore with existing lastCompleted date
      const originalDate = '2023-01-01';
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      nodeHelper.choreData.state.lastCompleted['1'] = originalDate;

      // Mark as completed (should move original to previous and set new date)
      const payload = { choreId: '1', completed: true };
      nodeHelper.handleChoreToggle(payload);

      expect(nodeHelper.choreData.state.completedToday).toContain('1');
      expect(nodeHelper.choreData.state.lastCompleted['1']).not.toBe(originalDate);
      expect(nodeHelper.choreData.state.lastCompleted['1']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(nodeHelper.choreData.state.previousLastCompleted['1']).toBe(originalDate);
    });

    it('should restore lastCompleted from previousLastCompleted when marking incomplete', () => {
      // Set up chore as completed with previous completion history
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      const originalDate = '2023-01-01';
      const today = new Date().toISOString().split('T')[0];
      nodeHelper.choreData.state.completedToday.push('1');
      nodeHelper.choreData.state.lastCompleted['1'] = today;
      nodeHelper.choreData.state.previousLastCompleted['1'] = originalDate;

      // Mark as incomplete (should restore lastCompleted to previous)
      const payload = { choreId: '1', completed: false };
      nodeHelper.handleChoreToggle(payload);

      expect(nodeHelper.choreData.state.completedToday).not.toContain('1');
      expect(nodeHelper.choreData.state.lastCompleted['1']).toBe(originalDate);
      expect(nodeHelper.choreData.state.previousLastCompleted['1']).toBe(originalDate);
    });

    it('should early exit when chore is already completed', () => {
      // Set up chore as already completed
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      nodeHelper.choreData.state.completedToday.push('1');

      const payload = { choreId: '1', completed: true };
      nodeHelper.handleChoreToggle(payload);

      // Should not call saveChoreData due to early exit
      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should early exit when chore is already incomplete', () => {
      // Ensure chore is not completed
      const payload = { choreId: '1', completed: false };
      nodeHelper.handleChoreToggle(payload);

      // Should not call saveChoreData due to early exit
      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should return early when chore not found', () => {
      const payload = { choreId: '999', completed: true };
      nodeHelper.handleChoreToggle(payload);

      // Should not call saveChoreData due to early exit
      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });
  });

  describe('handleChoreReassign', () => {
    it('should reassign personal chore', () => {
      const payload = { choreId: '3', newPersonId: '2', pin: undefined };

      nodeHelper.handleChoreReassign(payload);

      const updatedChore = nodeHelper.choreData?.chores.find((c: Chore) => c.id === '3');
      expect(updatedChore?.assignedTo).toBe('2');
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should update rotating chore index', () => {
      const payload = { choreId: '1', newPersonId: '3', pin: undefined };

      nodeHelper.handleChoreReassign(payload);

      expect(nodeHelper.choreData?.state.rotatingIndex['1']).toBe(2);
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should early exit when personal chore is already assigned to target person', () => {
      const payload = { choreId: '3', newPersonId: '1', pin: undefined }; // Already assigned to '1'

      nodeHelper.handleChoreReassign(payload);

      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should early exit when rotating chore is already assigned to target person', () => {
      const payload = { choreId: '1', newPersonId: '1', pin: undefined }; // Already at index 0

      nodeHelper.handleChoreReassign(payload);

      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should return early when chore not found', () => {
      const payload = { choreId: '999', newPersonId: '2', pin: undefined };

      nodeHelper.handleChoreReassign(payload);

      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });
  });

  describe('handleChoreUndo', () => {
    it('should undo chore completion', () => {
      // Set up completed chore
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      nodeHelper.choreData.state.completedToday.push('1');
      nodeHelper.choreData.state.lastCompleted['1'] = '2023-01-01';

      const payload = { choreId: '1', pin: undefined };
      nodeHelper.handleChoreUndo(payload);

      expect(nodeHelper.choreData.state.completedToday).not.toContain('1');
      expect(nodeHelper.choreData.state.lastCompleted['1']).toBeUndefined();
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should early exit when chore is already not completed', () => {
      // Don't add chore to completedToday - it's already incomplete
      const payload = { choreId: '2', pin: undefined }; // Different chore that's not completed

      nodeHelper.handleChoreUndo(payload);

      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should return early when chore not found', () => {
      const payload = { choreId: '999', pin: undefined };

      nodeHelper.handleChoreUndo(payload);

      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });
  });
});
