import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  Chore,
  ChoreReassignPayload,
  ChoreTogglePayload,
  ChoreUndoPayload,
  FamilyChoresData,
} from '../types/chore-types';
import type { Config } from '../types/config';
import nodeHelper from './node-helper';

// Mock interface that extends the actual node helper with vitest mock compatibility
interface MockedNodeHelper {
  choreData: FamilyChoresData | null;
  config: Config | null;
  sendSocketNotification: ReturnType<typeof vi.fn>;
  createDefaultData(): FamilyChoresData;
  loadChoreData(): void;
  saveChoreData: ReturnType<typeof vi.fn>;
  handleChoreToggle(payload: ChoreTogglePayload): void;
  handleChoreReassign(payload: ChoreReassignPayload): void;
  handleChoreUndo(payload: ChoreUndoPayload): void;
  socketNotificationReceived(
    notificationIdentifier: string,
    payload: Config | ChoreTogglePayload | ChoreReassignPayload | ChoreUndoPayload
  ): void;
}

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
  const helperInstance = nodeHelper as unknown as MockedNodeHelper;

  beforeEach(() => {
    // Mock socket notification
    mockSendSocketNotification = vi.fn();
    helperInstance.sendSocketNotification = mockSendSocketNotification;

    // Mock saveChoreData to avoid file I/O
    mockSaveChoreData = vi.fn();
    helperInstance.saveChoreData = mockSaveChoreData;

    // Set up config
    helperInstance.config = { adminPin: null, dataFile: 'test-data.json' };

    // Create default chore data
    helperInstance.choreData = helperInstance.createDefaultData();
  });

  describe('createDefaultData', () => {
    it('should create default data structure', () => {
      const defaultData = helperInstance.createDefaultData();

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

      helperInstance.handleChoreToggle(payload);

      expect(helperInstance.choreData?.state.completedToday).toContain('1');
      expect(helperInstance.choreData?.state.lastCompleted['1']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(mockSaveChoreData).toHaveBeenCalled();
      expect(mockSendSocketNotification).toHaveBeenCalledWith('CHORE_UPDATE_RESULT', {
        choreId: '1',
        completed: true,
      });
    });

    it('should mark chore as incomplete', () => {
      // First mark as completed
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      helperInstance.choreData.state.completedToday.push('1');

      const payload = { choreId: '1', completed: false };
      helperInstance.handleChoreToggle(payload);

      expect(helperInstance.choreData.state.completedToday).not.toContain('1');
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should move current lastCompleted to previousLastCompleted when marking complete', () => {
      // Set up chore with existing lastCompleted date
      const originalDate = '2023-01-01';
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      helperInstance.choreData.state.lastCompleted['1'] = originalDate;

      // Mark as completed (should move original to previous and set new date)
      const payload = { choreId: '1', completed: true };
      helperInstance.handleChoreToggle(payload);

      expect(helperInstance.choreData.state.completedToday).toContain('1');
      expect(helperInstance.choreData.state.lastCompleted['1']).not.toBe(originalDate);
      expect(helperInstance.choreData.state.lastCompleted['1']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(helperInstance.choreData.state.previousLastCompleted['1']).toBe(originalDate);
    });

    it('should restore lastCompleted from previousLastCompleted when marking incomplete', () => {
      // Set up chore as completed with previous completion history
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      const originalDate = '2023-01-01';
      const today = new Date().toISOString().split('T')[0];
      helperInstance.choreData.state.completedToday.push('1');
      helperInstance.choreData.state.lastCompleted['1'] = today;
      helperInstance.choreData.state.previousLastCompleted['1'] = originalDate;

      // Mark as incomplete (should restore lastCompleted to previous)
      const payload = { choreId: '1', completed: false };
      helperInstance.handleChoreToggle(payload);

      expect(helperInstance.choreData.state.completedToday).not.toContain('1');
      expect(helperInstance.choreData.state.lastCompleted['1']).toBe(originalDate);
      expect(helperInstance.choreData.state.previousLastCompleted['1']).toBe(originalDate);
    });

    it('should early exit when chore is already completed', () => {
      // Set up chore as already completed
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      helperInstance.choreData.state.completedToday.push('1');

      const payload = { choreId: '1', completed: true };
      helperInstance.handleChoreToggle(payload);

      // Should not call saveChoreData due to early exit
      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should early exit when chore is already incomplete', () => {
      // Ensure chore is not completed
      const payload = { choreId: '1', completed: false };
      helperInstance.handleChoreToggle(payload);

      // Should not call saveChoreData due to early exit
      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should return early when chore not found', () => {
      const payload = { choreId: '999', completed: true };
      helperInstance.handleChoreToggle(payload);

      // Should not call saveChoreData due to early exit
      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });
  });

  describe('handleChoreReassign', () => {
    it('should reassign personal chore', () => {
      const payload = { choreId: '3', newPersonId: '2', pin: undefined };

      helperInstance.handleChoreReassign(payload);

      const updatedChore = helperInstance.choreData?.chores.find((c: Chore) => c.id === '3');
      expect(updatedChore?.assignedTo).toBe('2');
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should update rotating chore index', () => {
      const payload = { choreId: '1', newPersonId: '3', pin: undefined };

      helperInstance.handleChoreReassign(payload);

      expect(helperInstance.choreData?.state.rotatingIndex['1']).toBe(2);
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should early exit when personal chore is already assigned to target person', () => {
      const payload = { choreId: '3', newPersonId: '1', pin: undefined }; // Already assigned to '1'

      helperInstance.handleChoreReassign(payload);

      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should early exit when rotating chore is already assigned to target person', () => {
      const payload = { choreId: '1', newPersonId: '1', pin: undefined }; // Already at index 0

      helperInstance.handleChoreReassign(payload);

      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should return early when chore not found', () => {
      const payload = { choreId: '999', newPersonId: '2', pin: undefined };

      helperInstance.handleChoreReassign(payload);

      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });
  });

  describe('handleChoreUndo', () => {
    it('should undo chore completion', () => {
      // Set up completed chore
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      helperInstance.choreData.state.completedToday.push('1');
      helperInstance.choreData.state.lastCompleted['1'] = '2023-01-01';

      const payload = { choreId: '1', pin: undefined };
      helperInstance.handleChoreUndo(payload);

      expect(helperInstance.choreData.state.completedToday).not.toContain('1');
      expect(helperInstance.choreData.state.lastCompleted['1']).toBeUndefined();
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should early exit when chore is already not completed', () => {
      // Don't add chore to completedToday - it's already incomplete
      const payload = { choreId: '2', pin: undefined }; // Different chore that's not completed

      helperInstance.handleChoreUndo(payload);

      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should return early when chore not found', () => {
      const payload = { choreId: '999', pin: undefined };

      helperInstance.handleChoreUndo(payload);

      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });
  });
});
