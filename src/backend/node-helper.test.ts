import * as fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Chore, FamilyChoresData, PersonalChore, RotatingChore } from '../types/chore-types';
import { ChoreType, SkipDayVisibility } from '../types/chore-types';
import type { Config } from '../types/config';
import type {
  CaughtUpResetPayload,
  ChoreReassignPayload,
  ChoreTogglePayload,
  NodeHelperIncomingSocketPayload,
} from '../types/socket-payload-types';
import { getLocalDateString, getLocalDayName } from '../utils/date';
import { generateTestUUID } from '../utils/uuid';
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
    trackDailyCompletion: (chore: Chore, completed: boolean) => void;
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
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

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
      dailyCompletions: [],
      settings: {
        historyEnabled: true,
      },
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

    it('should return early when daily reset is pending', () => {
      if (!nodeHelper.choreData) {
        throw new Error('choreData is null');
      }
      // Set lastResetDate to yesterday so today > lastResetDate
      nodeHelper.choreData.lastResetDate = '2024-01-01';

      const payload = { choreId: '1', completed: true };
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

      it('should log incomplete chores even when today is a skip day', () => {
        expect(nodeHelper.choreData).not.toBeNull();
        if (!nodeHelper.choreData) return;

        // Set up: today is a skip day (yesterday was not)
        const todayDayName = getLocalDayName();

        const chore = nodeHelper.choreData.chores.find((c: Chore) => c.id === '1') as RotatingChore;
        if (!chore) return;
        // Yesterday was NOT a skip day, today IS a skip day
        chore.skipDays = [todayDayName];
        chore.completedToday = false;
        chore.caughtUp = true;

        nodeHelper.transitionChoresForNewDay();

        // Should still log the incomplete chore from yesterday even though today is a skip day
        const incompleteEntry = nodeHelper.choreData.dailyCompletions.find(
          (dc) => dc.choreId === '1' && dc.completed === false
        );
        expect(incompleteEntry).toBeDefined();
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
      dailyCompletions: [],
      lastResetDate: '2024-05-11',
      settings: {
        historyEnabled: true,
      },
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

    it("should log incomplete chores with yesterday's date, not today's date", () => {
      if (!nodeHelper.choreData) {
        throw new Error('choreData is null');
      }
      // Mark one chore as incomplete for the day that's ending
      nodeHelper.choreData.chores[0].completedToday = false;

      // Mock time: 2024-05-12 at 04:00 America/New_York (after reset time)
      // Convert to UTC: America/New_York (UTC-4 in May) = 2024-05-12T08:00:00.000Z
      const mockDate = new Date('2024-05-12T08:00:00.000Z');
      vi.setSystemTime(mockDate);

      nodeHelper.checkAndPerformDailyReset();

      // The incomplete entry should be dated for the previous day (May 11), not the new day (May 12)
      const incompleteEntry = nodeHelper.choreData.dailyCompletions.find(
        (dc) => dc.choreId === '1' && dc.completed === false
      );
      expect(incompleteEntry).toBeDefined();
      expect(incompleteEntry?.date).toBe('2024-05-11');
    });

    it('should perform reset when lastResetDate is before today regardless of time', () => {
      // Mock time: 2024-05-12 at 02:00 America/New_York
      // Convert to UTC: America/New_York (UTC-4 in May) = 2024-05-12T06:00:00.000Z
      const mockDate = new Date('2024-05-12T06:00:00.000Z');
      vi.setSystemTime(mockDate);

      nodeHelper.checkAndPerformDailyReset();

      // Should reset since lastResetDate (2024-05-11) < today (2024-05-12)
      expect(nodeHelper.choreData?.chores[0].completedToday).toBe(false);
      expect(nodeHelper.choreData?.chores[1].completedToday).toBe(false);
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

  describe('loadChoreData', () => {
    const pid1 = generateTestUUID(1);
    const pid2 = generateTestUUID(2);
    const cid1 = generateTestUUID(101);
    const cid2 = generateTestUUID(102);

    const validPerson1 = { id: pid1, name: 'Alice', color: '#FF6B6B' };
    const validPerson2 = { id: pid2, name: 'Bob', color: '#4ECDC4' };
    const validPersonalChore = {
      id: cid1,
      name: 'Dishes',
      type: 'personal',
      assignedTo: pid1,
      deadline: undefined,
      skipDays: [],
      skipDayVisibility: 'hide',
      caughtUp: false,
      completedToday: false,
    };
    const validRotatingChore = {
      id: cid2,
      name: 'Vacuuming',
      type: 'rotating',
      rotation: [pid1, pid2],
      rotatingIndex: 0,
      deadline: undefined,
      skipDays: [],
      skipDayVisibility: 'hide',
      caughtUp: false,
      completedToday: false,
    };

    beforeEach(() => {
      nodeHelper.config = { dataFile: 'data.json', adminPin: null };
      // Stub out checkAndPerformDailyReset so it doesn't overwrite lastResetDate
      nodeHelper.checkAndPerformDailyReset = vi.fn();
      // Default: file exists with valid data
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          people: [validPerson1, validPerson2],
          chores: [validPersonalChore, validRotatingChore],
          lastResetDate: '2024-01-01',
        })
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('loads valid data into choreData', () => {
      nodeHelper.loadChoreData();

      expect(nodeHelper.choreData?.people).toHaveLength(2);
      expect(nodeHelper.choreData?.chores).toHaveLength(2);
      expect(nodeHelper.choreData?.lastResetDate).toBe('2024-01-01');
      expect(nodeHelper.checkAndPerformDailyReset).toHaveBeenCalled();
    });

    it('skips an invalid person and warns', () => {
      const invalidPerson = { id: 'not-a-uuid', name: 'Bad', color: '#FF0000' };
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          people: [validPerson1, invalidPerson],
          chores: [validPersonalChore],
          lastResetDate: '2024-01-01',
        })
      );

      nodeHelper.loadChoreData();

      expect(nodeHelper.choreData?.people).toHaveLength(1);
      expect(nodeHelper.choreData?.people[0].id).toBe(pid1);
    });

    it('skips an invalid chore and warns', () => {
      const invalidChore = { id: cid1, name: '', type: 'personal', assignedTo: pid1 };
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          people: [validPerson1],
          chores: [invalidChore],
          lastResetDate: '2024-01-01',
        })
      );

      nodeHelper.loadChoreData();

      expect(nodeHelper.choreData?.chores).toHaveLength(0);
    });

    it('skips a chore whose assigned person was itself skipped', () => {
      const invalidPerson = { id: 'not-a-uuid', name: 'Bad', color: '#FF0000' };
      const choreForInvalidPerson = {
        ...validPersonalChore,
        id: generateTestUUID(999),
        assignedTo: 'not-a-uuid',
      };
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          people: [validPerson1, invalidPerson],
          chores: [choreForInvalidPerson],
          lastResetDate: '2024-01-01',
        })
      );

      nodeHelper.loadChoreData();

      // invalidPerson was removed, so the chore referencing it should also be skipped
      expect(nodeHelper.choreData?.chores).toHaveLength(0);
    });

    it('handles non-array people gracefully', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({ people: null, chores: [], lastResetDate: '2024-01-01' })
      );

      nodeHelper.loadChoreData();

      expect(nodeHelper.choreData?.people).toHaveLength(0);
      expect(nodeHelper.choreData?.chores).toHaveLength(0);
    });

    it('handles non-array chores gracefully', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({ people: [validPerson1], chores: null, lastResetDate: '2024-01-01' })
      );

      nodeHelper.loadChoreData();

      expect(nodeHelper.choreData?.chores).toHaveLength(0);
    });

    it('sets lastResetDate to today when it is not a valid string', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({ people: [validPerson1], chores: [], lastResetDate: 42 })
      );

      nodeHelper.loadChoreData();

      expect(nodeHelper.choreData?.lastResetDate).toBe(getLocalDateString());
    });

    it('creates default data when file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      nodeHelper.loadChoreData();

      expect(nodeHelper.choreData?.people).toHaveLength(0);
      expect(nodeHelper.choreData?.chores).toHaveLength(0);
      // saveChoreData is mocked in the outer beforeEach; verify it was called to persist defaults
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('falls back to default data on parse error', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('not valid json{{{');

      nodeHelper.loadChoreData();

      expect(nodeHelper.choreData?.people).toHaveLength(0);
      expect(nodeHelper.choreData?.chores).toHaveLength(0);
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

  describe('historyEnabled behavior', () => {
    beforeEach(() => {
      nodeHelper.choreData = {
        lastResetDate: getLocalDateString(),
        people: [
          { id: '1', name: 'Person 1', color: '#FF6B6B' },
          { id: '2', name: 'Person 2', color: '#4ECDC4' },
        ],
        chores: [
          {
            id: 'chore1',
            name: 'Test Chore',
            type: ChoreType.PERSONAL,
            assignedTo: '1',
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: false,
          },
        ],
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
        },
      };
    });

    it('should add daily completion when historyEnabled is true', () => {
      const payload: ChoreTogglePayload = { choreId: 'chore1', completed: true };
      nodeHelper.handleChoreToggle(payload);

      expect(nodeHelper.choreData?.dailyCompletions).toHaveLength(1);
      expect(nodeHelper.choreData?.dailyCompletions[0].choreId).toBe('chore1');
      expect(nodeHelper.choreData?.dailyCompletions[0].completed).toBe(true);
    });

    it('should NOT add daily completion when historyEnabled is false', () => {
      if (!nodeHelper.choreData) return;
      nodeHelper.choreData.settings.historyEnabled = false;

      const payload: ChoreTogglePayload = { choreId: 'chore1', completed: true };
      nodeHelper.handleChoreToggle(payload);

      expect(nodeHelper.choreData?.dailyCompletions).toHaveLength(0);
    });

    it('should remove daily completion when historyEnabled is true', () => {
      if (!nodeHelper.choreData) return;
      // Set chore as completed so toggle will work
      nodeHelper.choreData.chores[0].completedToday = true;
      // First add a completion
      nodeHelper.choreData.dailyCompletions.push({
        id: generateTestUUID(1),
        date: getLocalDateString(),
        personId: '1',
        choreId: 'chore1',
        completed: true,
        completedAt: '09:00',
        wasLate: false,
      });

      const payload: ChoreTogglePayload = { choreId: 'chore1', completed: false };
      nodeHelper.handleChoreToggle(payload);

      expect(nodeHelper.choreData?.dailyCompletions).toHaveLength(0);
    });

    it('should NOT remove daily completion when historyEnabled is false', () => {
      if (!nodeHelper.choreData) return;
      nodeHelper.choreData.settings.historyEnabled = false;
      // Add a completion
      nodeHelper.choreData.dailyCompletions.push({
        id: generateTestUUID(1),
        date: getLocalDateString(),
        personId: '1',
        choreId: 'chore1',
        completed: true,
        completedAt: '09:00',
        wasLate: false,
      });

      const payload: ChoreTogglePayload = { choreId: 'chore1', completed: false };
      nodeHelper.handleChoreToggle(payload);

      // Completion should still be there since history is disabled
      expect(nodeHelper.choreData?.dailyCompletions).toHaveLength(1);
    });
  });

  describe('un-checking isolation', () => {
    beforeEach(() => {
      nodeHelper.choreData = {
        lastResetDate: getLocalDateString(),
        people: [
          { id: '1', name: 'Person 1', color: '#FF6B6B' },
          { id: '2', name: 'Person 2', color: '#4ECDC4' },
        ],
        chores: [
          {
            id: 'chore1',
            name: 'Test Chore 1',
            type: ChoreType.PERSONAL,
            assignedTo: '1',
            completedToday: true,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: false,
          },
          {
            id: 'chore2',
            name: 'Test Chore 2',
            type: ChoreType.PERSONAL,
            assignedTo: '1',
            completedToday: true,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: false,
          },
        ],
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
        },
      };
    });

    it('should only remove the specific chore being unchecked', () => {
      if (!nodeHelper.choreData) return;
      // Add completions for both chores
      nodeHelper.choreData.dailyCompletions.push(
        {
          id: generateTestUUID(1),
          date: getLocalDateString(),
          personId: '1',
          choreId: 'chore1',
          completed: true,
          completedAt: '09:00',
          wasLate: false,
        },
        {
          id: generateTestUUID(2),
          date: getLocalDateString(),
          personId: '1',
          choreId: 'chore2',
          completed: true,
          completedAt: '09:00',
          wasLate: false,
        }
      );

      // Uncheck only chore1
      const payload: ChoreTogglePayload = { choreId: 'chore1', completed: false };
      nodeHelper.handleChoreToggle(payload);

      // Only chore1 should be removed, chore2 should remain
      expect(nodeHelper.choreData?.dailyCompletions).toHaveLength(1);
      expect(nodeHelper.choreData?.dailyCompletions[0].choreId).toBe('chore2');
    });

    it('should not affect completedToday status of other chores', () => {
      if (!nodeHelper.choreData) return;
      // Uncheck only chore1
      const payload: ChoreTogglePayload = { choreId: 'chore1', completed: false };
      nodeHelper.handleChoreToggle(payload);

      // chore1 should be unchecked, chore2 should still be checked
      expect(nodeHelper.choreData?.chores[0].completedToday).toBe(false);
      expect(nodeHelper.choreData?.chores[1].completedToday).toBe(true);
    });
  });

  describe('trackDailyCompletion function', () => {
    beforeEach(() => {
      nodeHelper.choreData = {
        lastResetDate: getLocalDateString(),
        people: [
          { id: '1', name: 'Person 1', color: '#FF6B6B' },
          { id: '2', name: 'Person 2', color: '#4ECDC4' },
        ],
        chores: [
          {
            id: 'chore1',
            name: 'Test Chore',
            type: ChoreType.PERSONAL,
            assignedTo: '1',
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: false,
          },
          {
            id: 'chore2',
            name: 'Rotating Chore',
            type: ChoreType.ROTATING,
            rotation: ['1', '2'],
            rotatingIndex: 0,
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: false,
          },
        ],
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
        },
      };
    });

    it('should add completion for personal chore', () => {
      if (!nodeHelper.choreData) return;
      const chore = nodeHelper.choreData.chores[0];
      nodeHelper.trackDailyCompletion(chore, true);

      expect(nodeHelper.choreData.dailyCompletions).toHaveLength(1);
      expect(nodeHelper.choreData.dailyCompletions[0].choreId).toBe('chore1');
      expect(nodeHelper.choreData.dailyCompletions[0].personId).toBe('1');
      expect(nodeHelper.choreData.dailyCompletions[0].completed).toBe(true);
    });

    it('should add completion for rotating chore', () => {
      if (!nodeHelper.choreData) return;
      const chore = nodeHelper.choreData.chores[1];
      nodeHelper.trackDailyCompletion(chore, true);

      expect(nodeHelper.choreData.dailyCompletions).toHaveLength(1);
      expect(nodeHelper.choreData.dailyCompletions[0].choreId).toBe('chore2');
      expect(nodeHelper.choreData.dailyCompletions[0].personId).toBe('1'); // rotation[0]
      expect(nodeHelper.choreData.dailyCompletions[0].completed).toBe(true);
    });

    it('should remove completion when completed is false', () => {
      if (!nodeHelper.choreData) return;
      const chore = nodeHelper.choreData.chores[0];
      // First add a completion
      nodeHelper.choreData.dailyCompletions.push({
        id: generateTestUUID(1),
        date: getLocalDateString(),
        personId: '1',
        choreId: 'chore1',
        completed: true,
        completedAt: '09:00',
        wasLate: false,
      });

      nodeHelper.trackDailyCompletion(chore, false);

      expect(nodeHelper.choreData.dailyCompletions).toHaveLength(0);
    });

    it('should not add completion when history is disabled', () => {
      if (!nodeHelper.choreData) return;
      nodeHelper.choreData.settings.historyEnabled = false;
      const chore = nodeHelper.choreData.chores[0];

      nodeHelper.trackDailyCompletion(chore, true);

      expect(nodeHelper.choreData.dailyCompletions).toHaveLength(0);
    });
  });
});
