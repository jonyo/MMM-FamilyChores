import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CaughtUpResetPayload,
  Chore,
  ChoreReassignPayload,
  ChoreTogglePayload,
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
  performDailyReset(): void;
  handleChoreToggle(payload: ChoreTogglePayload): void;
  handleChoreReassign(payload: ChoreReassignPayload): void;
  handleCaughtUpReset(payload: CaughtUpResetPayload): void;
  socketNotificationReceived(
    notificationIdentifier: string,
    payload: Config | ChoreTogglePayload | ChoreReassignPayload | CaughtUpResetPayload
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
      expect(defaultData.state).toHaveProperty('caughtUp');
      expect(defaultData.state).toHaveProperty('completedToday');
    });
  });

  describe('handleChoreToggle', () => {
    it('should mark chore as completed', () => {
      const payload = { choreId: '1', completed: true };

      helperInstance.handleChoreToggle(payload);

      expect(helperInstance.choreData?.state.completedToday).toContain('1');
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

    it('should not change caughtUp when marking complete', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Set up existing caughtUp value
      helperInstance.choreData.state.caughtUp['1'] = false;

      const payload = { choreId: '1', completed: true };
      helperInstance.handleChoreToggle(payload);

      // caughtUp should remain unchanged
      expect(helperInstance.choreData.state.caughtUp['1']).toBe(false);
    });

    it('should not change caughtUp when marking incomplete', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      helperInstance.choreData.state.completedToday.push('1');
      // Set up existing caughtUp value
      helperInstance.choreData.state.caughtUp['1'] = true;

      const payload = { choreId: '1', completed: false };
      helperInstance.handleChoreToggle(payload);

      // caughtUp should remain unchanged
      expect(helperInstance.choreData.state.caughtUp['1']).toBe(true);
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

  describe('performDailyReset', () => {
    it('should clear completedToday array', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      helperInstance.choreData.state.completedToday.push('1', '2');

      helperInstance.performDailyReset();

      expect(helperInstance.choreData.state.completedToday).toHaveLength(0);
    });

    it('should set caughtUp to true for completed chores', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Mark chore 1 as completed today
      helperInstance.choreData.state.completedToday.push('1');

      helperInstance.performDailyReset();

      expect(helperInstance.choreData.state.caughtUp['1']).toBe(true);
    });

    it('should set caughtUp to false for incomplete chores', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Chore 1 is NOT in completedToday (incomplete yesterday)
      helperInstance.choreData.state.caughtUp['1'] = true; // Start with true to verify it changes

      helperInstance.performDailyReset();

      expect(helperInstance.choreData.state.caughtUp['1']).toBe(false);
    });

    it('should preserve caughtUp on skip days', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Add skip days to chore 1 - yesterday was a skip day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDayName = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ][yesterday.getDay()];
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (chore) {
        chore.skipDays = [yesterdayDayName];
      }
      // Set an existing caughtUp value
      helperInstance.choreData.state.caughtUp['1'] = true;

      helperInstance.performDailyReset();

      // caughtUp should remain unchanged because yesterday was a skip day
      expect(helperInstance.choreData.state.caughtUp['1']).toBe(true);
    });

    it('should handle multiple chores with mixed completion status', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Chore 1 completed yesterday, Chore 2 not completed
      helperInstance.choreData.state.completedToday.push('1');

      helperInstance.performDailyReset();

      expect(helperInstance.choreData.state.caughtUp['1']).toBe(true);
      expect(helperInstance.choreData.state.caughtUp['2']).toBe(false);
    });

    it('should handle empty chore data gracefully', () => {
      helperInstance.choreData = null;

      // Should not throw
      expect(() => helperInstance.performDailyReset()).not.toThrow();
    });
  });

  describe('handleCaughtUpReset', () => {
    it('should reset caughtUp to true for personal chores assigned to person', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Chore 3 is assigned to person '1' (personal chore)
      helperInstance.choreData.state.caughtUp['3'] = false;

      const payload = { personId: '1', pin: undefined };
      helperInstance.handleCaughtUpReset(payload);

      expect(helperInstance.choreData.state.caughtUp['3']).toBe(true);
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should reset caughtUp to true for rotating chores where person is current assignee', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Chore 1 is rotating with index 0 (person '1' is current)
      helperInstance.choreData.state.caughtUp['1'] = false;

      const payload = { personId: '1', pin: undefined };
      helperInstance.handleCaughtUpReset(payload);

      expect(helperInstance.choreData.state.caughtUp['1']).toBe(true);
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should not affect rotating chores where person is not current assignee', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Chore 1 is rotating with index 0 (person '1' is current, not '2')
      helperInstance.choreData.state.caughtUp['1'] = false;

      const payload = { personId: '2', pin: undefined };
      helperInstance.handleCaughtUpReset(payload);

      // Should not change caughtUp for chore 1 since person 2 is not assigned
      expect(helperInstance.choreData.state.caughtUp['1']).toBe(false);
    });

    it('should require PIN when adminPin is configured', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      helperInstance.config = { adminPin: '1234', dataFile: 'test-data.json' };
      helperInstance.choreData.state.caughtUp['1'] = false;

      const payload = { personId: '1', pin: 'wrongpin' };
      helperInstance.handleCaughtUpReset(payload);

      // Should send PIN error and not save
      expect(mockSendSocketNotification).toHaveBeenCalledWith('PIN_ERROR', {
        message: 'Invalid PIN',
      });
      expect(helperInstance.choreData.state.caughtUp['1']).toBe(false);
      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should succeed with correct PIN when adminPin is configured', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      helperInstance.config = { adminPin: '1234', dataFile: 'test-data.json' };
      helperInstance.choreData.state.caughtUp['1'] = false;

      const payload = { personId: '1', pin: '1234' };
      helperInstance.handleCaughtUpReset(payload);

      expect(helperInstance.choreData.state.caughtUp['1']).toBe(true);
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should handle person with no assigned chores', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Person '5' (Evan) has no personal chores in default data
      const payload = { personId: '5', pin: undefined };

      helperInstance.handleCaughtUpReset(payload);

      // Should still save and notify (just with 0 changes)
      expect(mockSaveChoreData).toHaveBeenCalled();
      expect(mockSendSocketNotification).toHaveBeenCalledWith('CAUGHTUP_RESET_RESULT', {
        personId: '5',
        resetCount: 0,
      });
    });

    it('should handle empty chore data gracefully', () => {
      helperInstance.choreData = null;
      const payload = { personId: '1', pin: undefined };

      // Should not throw
      expect(() => helperInstance.handleCaughtUpReset(payload)).not.toThrow();
    });
  });
});
