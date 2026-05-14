import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type Chore,
  ChoreType,
  type FamilyChoresData,
  type PersonalChore,
  type RotatingChore,
  SkipDayVisibility,
} from '../types/chore-types';
import type { Config } from '../types/config';
import type {
  CaughtUpResetPayload,
  ChoreReassignPayload,
  ChoreTogglePayload,
  NodeHelperIncomingSocketPayload,
} from '../types/socket-payload-types';
import { getLocalDateString, getLocalDayName } from '../utils/date';
import './node-helper';

// Create node helper instance variable in hoisted scope
const { nodeHelperInstance, setNodeHelperInstance } = vi.hoisted(() => {
  let nodeHelperInstance: {
    choreData: FamilyChoresData | null;
    config: Config | null;
    sendSocketNotification: ReturnType<typeof vi.fn>;
    createDefaultData: () => FamilyChoresData;
    loadChoreData: () => void;
    saveChoreData: ReturnType<typeof vi.fn>;
    transitionChoresForNewDay: () => void;
    checkAndPerformDailyReset: () => void;
    handleChoreToggle: (payload: ChoreTogglePayload) => void;
    handleChoreReassign: (payload: ChoreReassignPayload) => void;
    handleCaughtUpReset: (payload: CaughtUpResetPayload) => void;
    setupAdminRoutes: () => void;
    expressApp?: {
      get: (path: string, handler: (req: unknown, res: unknown) => void) => void;
      post: (path: string, handler: (req: unknown, res: unknown) => void) => void;
      put: (path: string, handler: (req: unknown, res: unknown) => void) => void;
      delete: (path: string, handler: (req: unknown, res: unknown) => void) => void;
    };
    socketNotificationReceived: (
      notificationIdentifier: string,
      payload: NodeHelperIncomingSocketPayload
    ) => void;
  };
  const setNodeHelperInstance = (instance: typeof nodeHelperInstance) => {
    nodeHelperInstance = instance;
  };

  return { nodeHelperInstance: () => ({ ...nodeHelperInstance }), setNodeHelperInstance };
});

// Mock node_helper to capture the actual instance
vi.mock('node_helper', () => ({
  create: (localNodeHelper: ReturnType<typeof nodeHelperInstance>) => {
    setNodeHelperInstance(localNodeHelper);
    return localNodeHelper;
  },
}));

// Mock Log global
vi.mock('logger', () => ({
  info: vi.fn(),
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}));

describe('Node Helper Tests', () => {
  let nodeHelper: ReturnType<typeof nodeHelperInstance>;
  let mockSendSocketNotification: ReturnType<typeof vi.fn>;
  let mockSaveChoreData: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    nodeHelper = nodeHelperInstance();
    // Mock socket notification
    mockSendSocketNotification = vi.fn();
    nodeHelper.sendSocketNotification = mockSendSocketNotification;

    // Mock saveChoreData to avoid file I/O
    mockSaveChoreData = vi.fn();
    nodeHelper.saveChoreData = mockSaveChoreData;

    // Set up config
    nodeHelper.config = { adminPin: null, dataFile: 'test-data.json' };

    // Create sample chore data for testing
    nodeHelper.choreData = {
      people: [
        { id: '1', name: 'Person 1', color: '#FF6B6B' },
        { id: '2', name: 'Person 2', color: '#4ECDC4' },
        { id: '3', name: 'Person 3', color: '#45B7D1' },
        { id: '4', name: 'Person 4', color: '#96CEB4' },
        { id: '5', name: 'Person 5', color: '#FFEAA7' },
      ],
      chores: [
        {
          id: '1',
          name: 'Rotating Chore 1',
          type: ChoreType.ROTATING,
          rotation: ['1', '2', '3'],
          rotatingIndex: 0,
          completedToday: false,
          caughtUp: false,
          deadline: undefined,
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
        },
        {
          id: '2',
          name: 'Rotating Chore 2',
          type: ChoreType.ROTATING,
          rotation: ['1', '2', '3'],
          rotatingIndex: 0,
          completedToday: false,
          caughtUp: false,
          deadline: undefined,
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
        },
        {
          id: '3',
          name: 'Personal Chore 1',
          type: ChoreType.PERSONAL,
          assignedTo: '1',
          completedToday: false,
          caughtUp: false,
          deadline: undefined,
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
        },
        {
          id: '4',
          name: 'Personal Chore 2',
          type: ChoreType.PERSONAL,
          assignedTo: '2',
          completedToday: false,
          caughtUp: false,
          deadline: undefined,
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
        },
      ],
      lastResetDate: getLocalDateString(),
    };
  });

  describe('createDefaultData', () => {
    it('should create default data structure', () => {
      const defaultData = nodeHelper.createDefaultData();

      expect(defaultData).toHaveProperty('people');
      expect(defaultData).toHaveProperty('chores');
      expect(defaultData).toHaveProperty('lastResetDate');
      expect(defaultData.people).toHaveLength(0);
      expect(defaultData.chores).toHaveLength(0);
    });
  });

  describe('handleChoreToggle', () => {
    it('should mark chore as completed', () => {
      const payload = { choreId: '1', completed: true };

      nodeHelper.handleChoreToggle(payload);

      const chore = nodeHelper.choreData?.chores.find((c: Chore) => c.id === '1');
      expect(chore?.completedToday).toBe(true);
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
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.completedToday = true;

      const payload = { choreId: '1', completed: false };
      nodeHelper.handleChoreToggle(payload);

      expect(chore.completedToday).toBe(false);
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should not change caughtUp when marking complete', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      // Set up existing caughtUp value
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.caughtUp = false;

      const payload = { choreId: '1', completed: true };
      nodeHelper.handleChoreToggle(payload);

      // caughtUp should remain unchanged
      expect(chore.caughtUp).toBe(false);
    });

    it('should not change caughtUp when marking incomplete', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.completedToday = true;
      // Set up existing caughtUp value
      chore.caughtUp = true;

      const payload = { choreId: '1', completed: false };
      nodeHelper.handleChoreToggle(payload);

      // caughtUp should remain unchanged
      expect(chore.caughtUp).toBe(true);
    });

    it('should early exit when chore is already completed', () => {
      // Set up chore as already completed
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.completedToday = true;

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
      expect((updatedChore as PersonalChore).assignedTo).toBe('2');
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should update rotating chore index', () => {
      const payload = { choreId: '1', newPersonId: '3', pin: undefined };

      nodeHelper.handleChoreReassign(payload);

      const chore = nodeHelper.choreData?.chores.find((c: Chore) => c.id === '1');
      expect((chore as RotatingChore).rotatingIndex).toBe(2);
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

    it('should require PIN when adminPin is configured', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      nodeHelper.config = { adminPin: '1234', dataFile: 'test-data.json' };

      const payload = { choreId: '3', newPersonId: '2', pin: 'wrong' };
      nodeHelper.handleChoreReassign(payload);

      expect(mockSendSocketNotification).toHaveBeenCalledWith('PIN_ERROR', {
        message: 'Invalid PIN',
      });
      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should reassign when PIN matches adminPin', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      nodeHelper.config = { adminPin: '1234', dataFile: 'test-data.json' };

      const payload = { choreId: '3', newPersonId: '2', pin: '1234' };
      nodeHelper.handleChoreReassign(payload);

      const updatedChore = nodeHelper.choreData.chores.find(
        (c: Chore) => c.id === '3'
      ) as PersonalChore;
      expect(updatedChore.assignedTo).toBe('2');
      expect(mockSaveChoreData).toHaveBeenCalled();
    });
  });

  describe('transitionChoresForNewDay', () => {
    it('should clear completedToday on all chores', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      const chore1 = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1');
      const chore2 = nodeHelper.choreData.chores.find((c: Chore) => c.id === '2');
      if (!chore1 || !chore2) return;
      chore1.completedToday = true;
      chore2.completedToday = true;
      // Ensure no skip days so they process as normal days
      chore1.skipDays = [];
      chore2.skipDays = [];

      nodeHelper.transitionChoresForNewDay();

      expect(chore1.completedToday).toBe(false);
      expect(chore2.completedToday).toBe(false);
    });

    it('should set caughtUp to true for completed chores', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      // Mark chore 1 as completed today
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.completedToday = true;

      nodeHelper.transitionChoresForNewDay();

      expect(chore.caughtUp).toBe(true);
    });

    it('should set caughtUp to false for incomplete chores', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      // Chore 1 is NOT completed today (incomplete yesterday)
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.caughtUp = true; // Start with true to verify it changes

      nodeHelper.transitionChoresForNewDay();

      expect(chore.caughtUp).toBe(false);
    });

    it('should skip processing entirely when today is a skip day and visibility is HIDE', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      // Add skip days to chore 1 - today is a skip day
      const todayDayName = getLocalDayName();
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
      if (!chore) return;
      chore.skipDays = [todayDayName];
      chore.skipDayVisibility = SkipDayVisibility.HIDE;
      // Set initial state
      chore.completedToday = true;
      chore.caughtUp = false;
      chore.rotatingIndex = 2;

      nodeHelper.transitionChoresForNewDay();

      // CompletedToday and rotatingIndex should remain unchanged, but caughtUp gets updated
      expect(chore.completedToday).toBe(true);
      expect(chore.caughtUp).toBe(true); // Updated since completedToday was true
      expect(chore.rotatingIndex).toBe(2);
    });

    it('should process normally when yesterday was a skip day', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      // Add skip days to chore 1 - yesterday was a skip day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDayName = getLocalDayName(yesterday);
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
      if (!chore) return;
      chore.skipDays = [yesterdayDayName];
      // Set initial state
      chore.completedToday = true;
      chore.caughtUp = false;
      chore.rotatingIndex = 1;

      nodeHelper.transitionChoresForNewDay();

      // Should process normally since yesterday being skip day has no special treatment
      expect(chore.completedToday).toBe(false);
      expect(chore.caughtUp).toBe(true); // Was completed yesterday
      expect(chore.rotatingIndex).toBe(2); // Should rotate since caughtUp is true
    });

    it('should rotate rotating chores when caughtUp is true', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
      if (!chore) return;
      // Set up chore as completed yesterday and at index 0 (no skip days)
      chore.completedToday = true;
      chore.rotatingIndex = 0;
      // Ensure no skip days so it processes as normal day
      chore.skipDays = [];

      nodeHelper.transitionChoresForNewDay();

      // Should rotate to next person
      expect(chore.completedToday).toBe(false);
      expect(chore.caughtUp).toBe(true);
      expect(chore.rotatingIndex).toBe(1);
    });

    it('should not rotate rotating chores when caughtUp is false', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
      if (!chore) return;
      // Set up chore as not completed yesterday and at index 0
      chore.completedToday = false;
      chore.rotatingIndex = 0;

      nodeHelper.transitionChoresForNewDay();

      // Should not rotate
      expect(chore.completedToday).toBe(false);
      expect(chore.caughtUp).toBe(false);
      expect(chore.rotatingIndex).toBe(0);
    });

    it('should handle rotation wrap-around correctly', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
      if (!chore) return;
      // Set up chore as completed yesterday and at last index (no skip days)
      chore.completedToday = true;
      chore.rotatingIndex = 2; // Last valid index in rotation array ['1', '2', '3']
      chore.skipDays = []; // Ensure no skip days

      nodeHelper.transitionChoresForNewDay();

      // Should wrap around to index 0
      expect(chore.completedToday).toBe(false);
      expect(chore.caughtUp).toBe(true);
      expect(chore.rotatingIndex).toBe(0);
    });

    it('should not rotate personal chores even when caughtUp is true', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '3') as PersonalChore;
      if (!chore) return;
      // Set up personal chore as completed yesterday
      chore.completedToday = true;
      chore.caughtUp = false;
      chore.assignedTo = '1';

      nodeHelper.transitionChoresForNewDay();

      // Should update caughtUp but not affect assignment
      expect(chore.completedToday).toBe(false);
      expect(chore.caughtUp).toBe(true);
      expect(chore.assignedTo).toBe('1');
    });

    it('should handle multiple chores with mixed completion status and rotation', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      // Chore 1 completed yesterday, Chore 2 not completed
      const chore1 = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
      const chore2 = nodeHelper.choreData.chores.find((c: Chore) => c.id === '2') as RotatingChore;
      if (!chore1 || !chore2) return;
      chore1.completedToday = true;
      chore1.rotatingIndex = 0;
      chore2.completedToday = false;
      chore2.rotatingIndex = 1;
      // Ensure no skip days so they process as normal days
      chore1.skipDays = [];
      chore2.skipDays = [];

      nodeHelper.transitionChoresForNewDay();

      expect(chore1.caughtUp).toBe(true);
      expect(chore1.rotatingIndex).toBe(1); // Should rotate
      expect(chore2.caughtUp).toBe(false);
      expect(chore2.rotatingIndex).toBe(1); // Should not rotate
    });

    it('should handle empty chore data gracefully', () => {
      nodeHelper.choreData = null;

      // Should not throw
      expect(() => nodeHelper.transitionChoresForNewDay()).not.toThrow();
    });

    describe('skipDayVisibility behavior', () => {
      it('should not change chore state when skipDayVisibility is HIDE', () => {
        expect(nodeHelper.choreData).not.toBeNull();
        if (!nodeHelper.choreData) return;
        const todayDayName = getLocalDayName();
        const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
        if (!chore) return;
        chore.skipDays = [todayDayName];
        chore.skipDayVisibility = SkipDayVisibility.HIDE;
        chore.completedToday = true;
        chore.caughtUp = false;
        chore.rotatingIndex = 2;

        nodeHelper.transitionChoresForNewDay();

        // CompletedToday and rotatingIndex should remain unchanged, but caughtUp gets updated
        expect(chore.completedToday).toBe(true);
        expect(chore.caughtUp).toBe(true); // Updated since completedToday was true
        expect(chore.rotatingIndex).toBe(2);
      });

      it('should show and process but not rotate when skipDayVisibility is SHOW_IF_OVERDUE and chore is caught up', () => {
        expect(nodeHelper.choreData).not.toBeNull();
        if (!nodeHelper.choreData) return;
        const todayDayName = getLocalDayName();
        const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
        if (!chore) return;
        chore.skipDays = [todayDayName];
        chore.skipDayVisibility = SkipDayVisibility.SHOW_IF_OVERDUE;
        chore.completedToday = true;
        chore.caughtUp = false;
        chore.rotatingIndex = 1;

        nodeHelper.transitionChoresForNewDay();

        // Should only update caughtUp, leave completedToday and rotatingIndex alone
        expect(chore.completedToday).toBe(true); // Should remain unchanged
        expect(chore.caughtUp).toBe(true); // should have been updated
        expect(chore.rotatingIndex).toBe(1); // Should not rotate
      });

      it('should show and process but not rotate when skipDayVisibility is SHOW_IF_OVERDUE and chore is not caught up', () => {
        expect(nodeHelper.choreData).not.toBeNull();
        if (!nodeHelper.choreData) return;
        const todayDayName = getLocalDayName();
        const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
        if (!chore) return;
        chore.skipDays = [todayDayName];
        chore.skipDayVisibility = SkipDayVisibility.SHOW_IF_OVERDUE;
        chore.completedToday = false;
        chore.caughtUp = true;
        chore.rotatingIndex = 1;

        nodeHelper.transitionChoresForNewDay();

        // Should only update caughtUp, leave completedToday and rotatingIndex alone
        expect(chore.completedToday).toBe(false); // Should remain unchanged
        expect(chore.caughtUp).toBe(false);
        expect(chore.rotatingIndex).toBe(1); // Should not rotate
      });

      it('should show and process normally but not rotate when skipDayVisibility is SHOW_ALWAYS', () => {
        expect(nodeHelper.choreData).not.toBeNull();
        if (!nodeHelper.choreData) return;
        const todayDayName = getLocalDayName();
        const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
        if (!chore) return;
        chore.skipDays = [todayDayName];
        chore.skipDayVisibility = SkipDayVisibility.SHOW_ALWAYS;
        chore.completedToday = true;
        chore.caughtUp = false;
        chore.rotatingIndex = 1;

        nodeHelper.transitionChoresForNewDay();

        // Should only update caughtUp, leave completedToday and rotatingIndex alone
        expect(chore.completedToday).toBe(true); // Should remain unchanged (checkmark stays)
        expect(chore.caughtUp).toBe(true);
        expect(chore.rotatingIndex).toBe(1); // Should not rotate on skip day
      });

      it('should default to HIDE when skipDayVisibility is not specified', () => {
        expect(nodeHelper.choreData).not.toBeNull();
        if (!nodeHelper.choreData) return;
        const todayDayName = getLocalDayName();
        const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
        if (!chore) return;
        chore.skipDays = [todayDayName];
        // Don't set skipDayVisibility - should default to HIDE
        chore.completedToday = true;
        chore.caughtUp = false;
        chore.rotatingIndex = 2;

        nodeHelper.transitionChoresForNewDay();

        // Should behave like HIDE - everything unchanged except caughtUp gets updated
        expect(chore.completedToday).toBe(true);
        expect(chore.caughtUp).toBe(true); // Should be updated since completedToday was true
        expect(chore.rotatingIndex).toBe(2);
      });

      it('should handle personal chores with SHOW_IF_OVERDUE on skip days', () => {
        expect(nodeHelper.choreData).not.toBeNull();
        if (!nodeHelper.choreData) return;
        const todayDayName = getLocalDayName();
        const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '3') as PersonalChore;
        if (!chore) return;
        chore.skipDays = [todayDayName];
        chore.skipDayVisibility = SkipDayVisibility.SHOW_IF_OVERDUE;
        chore.completedToday = true;
        chore.caughtUp = false;
        chore.assignedTo = '1';

        nodeHelper.transitionChoresForNewDay();

        // Should only update caughtUp, leave completedToday and assignment alone
        expect(chore.completedToday).toBe(true); // Should remain unchanged
        expect(chore.caughtUp).toBe(true);
        expect(chore.assignedTo).toBe('1');
      });
    });
  });

  describe('handleCaughtUpReset', () => {
    it('should reset caughtUp to true for personal chores assigned to person', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      // Chore 3 is assigned to person '1' (personal chore)
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '3') as PersonalChore;
      if (!chore) return;
      chore.caughtUp = false;

      const payload = { personId: '1', pin: undefined };
      nodeHelper.handleCaughtUpReset(payload);

      expect(chore.caughtUp).toBe(true);
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should reset caughtUp to true for rotating chores where person is current assignee', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      // Chore 1 is rotating with index 0 (person '1' is current)
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
      if (!chore) return;
      chore.caughtUp = false;

      const payload = { personId: '1', pin: undefined };
      nodeHelper.handleCaughtUpReset(payload);

      expect(chore.caughtUp).toBe(true);
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should not affect rotating chores where person is not current assignee', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      // Chore 1 is rotating with index 0 (person '1' is current, not '2')
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
      if (!chore) return;
      chore.caughtUp = false;

      const payload = { personId: '2', pin: undefined };
      nodeHelper.handleCaughtUpReset(payload);

      // Should not change caughtUp for chore 1 since person 2 is not assigned
      expect(chore.caughtUp).toBe(false);
    });

    it('should require PIN when adminPin is configured', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      nodeHelper.config = { adminPin: '1234', dataFile: 'test-data.json' };
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
      if (!chore) return;
      chore.caughtUp = false;

      const payload = { personId: '1', pin: 'wrongpin' };
      nodeHelper.handleCaughtUpReset(payload);

      // Should send PIN error and not save
      expect(mockSendSocketNotification).toHaveBeenCalledWith('PIN_ERROR', {
        message: 'Invalid PIN',
      });
      expect(chore.caughtUp).toBe(false);
      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should succeed with correct PIN when adminPin is configured', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      nodeHelper.config = { adminPin: '1234', dataFile: 'test-data.json' };
      const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
      if (!chore) return;
      chore.caughtUp = false;

      const payload = { personId: '1', pin: '1234' };
      nodeHelper.handleCaughtUpReset(payload);

      expect(chore.caughtUp).toBe(true);
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should handle person with no assigned chores', () => {
      expect(nodeHelper.choreData).not.toBeNull();
      if (!nodeHelper.choreData) return;
      // Person '5' (Evan) has no personal chores in default data
      const payload = { personId: '5', pin: undefined };

      nodeHelper.handleCaughtUpReset(payload);

      // Should still save and notify (just with 0 changes)
      expect(mockSaveChoreData).toHaveBeenCalled();
      expect(mockSendSocketNotification).toHaveBeenCalledWith('CAUGHTUP_RESET_RESULT', {
        personId: '5',
        resetCount: 0,
      });
    });

    it('should handle empty chore data gracefully', () => {
      nodeHelper.choreData = null;
      const payload = { personId: '1', pin: undefined };

      // Should not throw
      expect(() => nodeHelper.handleCaughtUpReset(payload)).not.toThrow();
    });
  });

  describe('checkAndPerformDailyReset', () => {
    let mockConfig: Config;

    // Getter for clean starting data
    const getCleanChoreData = (): FamilyChoresData => ({
      people: [
        { id: '1', name: 'Alice', color: '#FF6B6B' },
        { id: '2', name: 'Bob', color: '#4ECDC4' },
      ],
      chores: [
        {
          id: '1',
          name: 'Rotating Chore',
          type: ChoreType.ROTATING,
          rotation: ['1', '2'],
          rotatingIndex: 0,
          completedToday: true,
          caughtUp: true,
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
        },
        {
          id: '2',
          name: 'Personal Chore',
          type: ChoreType.PERSONAL,
          assignedTo: '1',
          completedToday: true,
          caughtUp: true,
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
        },
      ],
      lastResetDate: '2024-05-11',
    });

    beforeEach(() => {
      vi.useFakeTimers();

      // Force consistent timezone to avoid test failures due to system timezone differences
      const originalDateTimeFormat = Intl.DateTimeFormat;
      vi.spyOn(globalThis.Intl, 'DateTimeFormat').mockImplementation(function (
        this,
        locale,
        options
      ) {
        // Create a real DateTimeFormat with forced timezone using original implementation
        return new originalDateTimeFormat(locale, {
          ...options,
          timeZone: 'America/New_York',
        });
      });

      mockConfig = {
        updateInterval: 60000,
        dataFile: 'data.json',
        adminPin: null,
        dailyResetTime: '03:00',
      };

      // Use proper typing instead of any
      nodeHelper.config = mockConfig;
      nodeHelper.choreData = getCleanChoreData();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should not perform reset when lastResetDate is today', () => {
      // Update lastResetDate to today to test this scenario
      if (!nodeHelper.choreData) {
        throw new Error('choreData is null');
      }
      nodeHelper.choreData.lastResetDate = '2024-05-12';

      // Mock time: 2024-05-12 at 04:00 America/New_York (after reset time)
      // Convert to UTC: America/New_York (UTC-4 in May) = 2024-05-12T08:00:00.000Z
      const mockDate = new Date('2024-05-12T08:00:00.000Z');
      vi.setSystemTime(mockDate);

      nodeHelper.checkAndPerformDailyReset();

      // Should not reset since lastResetDate (2024-05-12) == today (2024-05-12)
      expect(nodeHelper.choreData?.chores[0].completedToday).toBe(true);
      expect(nodeHelper.choreData?.chores[1].completedToday).toBe(true);
      expect(nodeHelper.choreData?.lastResetDate).toBe('2024-05-12');
    });

    it('should perform reset when lastResetDate is before today and time is after reset time', () => {
      // Mock time: 2024-05-12 at 04:00 America/New_York (after reset time)
      // Convert to UTC: America/New_York (UTC-4 in May) = 2024-05-12T08:00:00.000Z
      const mockDate = new Date('2024-05-12T08:00:00.000Z');
      vi.setSystemTime(mockDate);

      nodeHelper.checkAndPerformDailyReset();

      // Check if reset was triggered by checking if completedToday was cleared
      // The exact date depends on timezone, so we check behavior instead
      expect(nodeHelper.choreData?.chores[0].completedToday).toBe(false);
      expect(nodeHelper.choreData?.chores[1].completedToday).toBe(false);
      expect(nodeHelper.choreData?.chores[0].caughtUp).toBe(true); // was completed yesterday
      expect(nodeHelper.choreData?.chores[1].caughtUp).toBe(true); // was completed yesterday
      expect((nodeHelper.choreData?.chores[0] as RotatingChore).rotatingIndex).toBe(1); // rotated
      // Verify that lastResetDate was updated (check it's no longer old value)
      expect(nodeHelper.choreData?.lastResetDate).not.toBe('2024-05-11');
    });

    it('should not perform reset when current time is before reset time', () => {
      // Mock time: 2024-05-12 at 02:00 America/New_York (before reset time)
      // Convert to UTC: America/New_York (UTC-4 in May) = 2024-05-12T06:00:00.000Z
      const mockDate = new Date('2024-05-12T06:00:00.000Z');
      vi.setSystemTime(mockDate);

      nodeHelper.checkAndPerformDailyReset();

      // Should not reset since time is before 03:00
      // Even though lastResetDate is before today, we haven't reached reset time yet today
      expect(nodeHelper.choreData?.chores[0].completedToday).toBe(true);
      expect(nodeHelper.choreData?.chores[1].completedToday).toBe(true);
      expect(nodeHelper.choreData?.lastResetDate).toBe('2024-05-11');
    });

    it('should handle custom reset time correctly', () => {
      // Update config directly on node helper to ensure it persists
      nodeHelper.config = {
        ...mockConfig,
        dailyResetTime: '02:30',
      };

      // Mock time: 2024-05-12 at 03:00 America/New_York (after custom reset time)
      // Convert to UTC: America/New_York (UTC-4 in May) = 2024-05-12T07:00:00.000Z
      const mockDate = new Date('2024-05-12T07:00:00.000Z');
      vi.setSystemTime(mockDate);

      nodeHelper.checkAndPerformDailyReset();

      // Should reset since time is after 02:30
      expect(nodeHelper.choreData?.chores[0].completedToday).toBe(false);
      // Verify that lastResetDate was updated (check it's no longer old value)
      expect(nodeHelper.choreData?.lastResetDate).not.toBe('2024-05-11');
    });

    it('should handle missing lastResetDate', () => {
      if (!nodeHelper.choreData) {
        throw new Error('choreData is null');
      }
      nodeHelper.choreData.lastResetDate = undefined;

      // Mock time: 2024-05-12 at 01:00 America/New_York (before reset time)
      // Convert to UTC: America/New_York (UTC-4 in May) = 2024-05-12T05:00:00.000Z
      const mockDate = new Date('2024-05-12T05:00:00.000Z');
      vi.setSystemTime(mockDate);

      nodeHelper.checkAndPerformDailyReset();

      // Should not reset since time is before 03:00, even though lastResetDate is before today
      expect(nodeHelper.choreData?.chores[0].completedToday).toBe(true);
      expect(nodeHelper.choreData?.chores[1].completedToday).toBe(true);
      expect(nodeHelper.choreData?.lastResetDate).toBeUndefined();
    });

    it('should not reset when time is before reset time on same day', () => {
      // Update lastResetDate to today to test this scenario
      if (!nodeHelper.choreData) {
        throw new Error('choreData is null');
      }
      nodeHelper.choreData.lastResetDate = '2024-05-12';

      // Mock time: 2024-05-12 at 01:00 America/New_York (before reset time)
      // Convert to UTC: America/New_York (UTC-4 in May) = 2024-05-12T05:00:00.000Z
      const mockDate = new Date('2024-05-12T05:00:00.000Z');
      vi.setSystemTime(mockDate);

      nodeHelper.checkAndPerformDailyReset();

      // Should not reset even though it's same day, because time is before reset time
      expect(nodeHelper.choreData?.chores[0].completedToday).toBe(true);
      expect(nodeHelper.choreData?.chores[1].completedToday).toBe(true);
      expect(nodeHelper.choreData?.lastResetDate).toBe('2024-05-12');
    });

    it('should handle date boundary crossing (midnight)', () => {
      // Mock time: 2024-05-13T02:30:00.000Z UTC
      // With America/New_York (UTC-4 in May), this is 2024-05-12 at 22:30 local
      // UTC is on next day (May 13) but local time is previous day (May 12) at 22:30, well after 03:00 reset
      const mockDate = new Date('2024-05-13T02:30:00.000Z');
      vi.setSystemTime(mockDate);

      nodeHelper.checkAndPerformDailyReset();

      // Should reset since lastResetDate (2024-05-11) < today
      expect(nodeHelper.choreData?.chores[0].completedToday).toBe(false);
      // Verify that lastResetDate was updated (check it's no longer old value)
      expect(nodeHelper.choreData?.lastResetDate).not.toBe('2024-05-11');
    });

    it('should not reset when local date matches last reset date even with UTC date difference', () => {
      // Update lastResetDate to match local date to test this scenario
      if (!nodeHelper.choreData) {
        throw new Error('choreData is null');
      }
      nodeHelper.choreData.lastResetDate = '2024-05-12';

      // Mock time: 2024-05-13T02:30:00.000Z UTC
      // With America/New_York (UTC-4 in May), this is 2024-05-12 at 22:30 local
      // UTC is on next day (May 13) but local date (May 12) matches lastResetDate, so should not reset
      const mockDate = new Date('2024-05-13T02:30:00.000Z');
      vi.setSystemTime(mockDate);

      nodeHelper.checkAndPerformDailyReset();

      // Should not reset since local date (2024-05-12) == lastResetDate (2024-05-12)
      // Even though UTC date is different (2024-05-13)
      expect(nodeHelper.choreData?.chores[0].completedToday).toBe(true);
      expect(nodeHelper.choreData?.chores[1].completedToday).toBe(true);
      expect(nodeHelper.choreData?.lastResetDate).toBe('2024-05-12');
    });

    it('should use local date for comparison', () => {
      // Mock time: 2024-11-04 at 04:00 America/New_York
      // In November, America/New_York is UTC-5, so 04:00 local = 09:00 UTC
      const mockDate = new Date('2024-11-04T09:00:00.000Z');
      vi.setSystemTime(mockDate);

      nodeHelper.checkAndPerformDailyReset();

      // Should use local date for comparison, not UTC date
      // The exact date depends on timezone, so check it's not to old value
      expect(nodeHelper.choreData?.lastResetDate).not.toBe('2024-05-11');
    });
  });

  describe('setupAdminRoutes', () => {
    it('registers all expected routes on expressApp', () => {
      const registeredRoutes: string[] = [];
      nodeHelper.expressApp = {
        get: (path: string) => registeredRoutes.push(`GET ${path}`),
        post: (path: string) => registeredRoutes.push(`POST ${path}`),
        put: (path: string) => registeredRoutes.push(`PUT ${path}`),
        delete: (path: string) => registeredRoutes.push(`DELETE ${path}`),
      };
      nodeHelper.setupAdminRoutes();
      expect(registeredRoutes).toContain('GET /MMM-FamilyChores/data');
      expect(registeredRoutes).toContain('POST /MMM-FamilyChores/people');
      expect(registeredRoutes).toContain('PUT /MMM-FamilyChores/people/:id');
      expect(registeredRoutes).toContain('DELETE /MMM-FamilyChores/people/:id');
      expect(registeredRoutes).toContain('POST /MMM-FamilyChores/chores');
      expect(registeredRoutes).toContain('PUT /MMM-FamilyChores/chores/:id');
      expect(registeredRoutes).toContain('DELETE /MMM-FamilyChores/chores/:id');
      expect(registeredRoutes).toContain('GET /MMM-FamilyChores/backup');
      expect(registeredRoutes).toContain('POST /MMM-FamilyChores/restore');
      expect(registeredRoutes).toContain('POST /MMM-FamilyChores/copy-chores');
    });
  });
});
