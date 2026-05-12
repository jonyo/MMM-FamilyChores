import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type CaughtUpResetPayload,
  type Chore,
  type ChoreReassignPayload,
  type ChoreTogglePayload,
  type FamilyChoresData,
  SkipDayVisibility,
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
  create: (moduleObj: unknown) => moduleObj,
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
      expect(defaultData.people).toHaveLength(5);
      expect(defaultData.chores).toHaveLength(4);
    });
  });

  describe('handleChoreToggle', () => {
    it('should mark chore as completed', () => {
      const payload = { choreId: '1', completed: true };

      helperInstance.handleChoreToggle(payload);

      const chore = helperInstance.choreData?.chores.find((c: Chore) => c.id === '1');
      expect(chore?.completedToday).toBe(true);
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
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.completedToday = true;

      const payload = { choreId: '1', completed: false };
      helperInstance.handleChoreToggle(payload);

      expect(chore.completedToday).toBe(false);
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should not change caughtUp when marking complete', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Set up existing caughtUp value
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.caughtUp = false;

      const payload = { choreId: '1', completed: true };
      helperInstance.handleChoreToggle(payload);

      // caughtUp should remain unchanged
      expect(chore.caughtUp).toBe(false);
    });

    it('should not change caughtUp when marking incomplete', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.completedToday = true;
      // Set up existing caughtUp value
      chore.caughtUp = true;

      const payload = { choreId: '1', completed: false };
      helperInstance.handleChoreToggle(payload);

      // caughtUp should remain unchanged
      expect(chore.caughtUp).toBe(true);
    });

    it('should early exit when chore is already completed', () => {
      // Set up chore as already completed
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.completedToday = true;

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

      const chore = helperInstance.choreData?.chores.find((c: Chore) => c.id === '1');
      expect(chore?.rotatingIndex).toBe(2);
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
    it('should clear completedToday on all chores', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      const chore1 = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      const chore2 = helperInstance.choreData.chores.find((c: Chore) => c.id === '2');
      if (!chore1 || !chore2) return;
      chore1.completedToday = true;
      chore2.completedToday = true;
      // Ensure no skip days so they process as normal days
      chore1.skipDays = [];
      chore2.skipDays = [];

      helperInstance.performDailyReset();

      expect(chore1.completedToday).toBe(false);
      expect(chore2.completedToday).toBe(false);
    });

    it('should set caughtUp to true for completed chores', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Mark chore 1 as completed today
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.completedToday = true;

      helperInstance.performDailyReset();

      expect(chore.caughtUp).toBe(true);
    });

    it('should set caughtUp to false for incomplete chores', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Chore 1 is NOT completed today (incomplete yesterday)
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.caughtUp = true; // Start with true to verify it changes

      helperInstance.performDailyReset();

      expect(chore.caughtUp).toBe(false);
    });

    it('should skip processing entirely when today is a skip day and visibility is HIDE', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Add skip days to chore 1 - today is a skip day
      const today = new Date();
      const todayDayName = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ][today.getDay()];
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.skipDays = [todayDayName];
      chore.skipDayVisibility = SkipDayVisibility.HIDE;
      // Set initial state
      chore.completedToday = true;
      chore.caughtUp = false;
      chore.rotatingIndex = 2;

      helperInstance.performDailyReset();

      // Everything should remain unchanged because today is a skip day with HIDE visibility
      expect(chore.completedToday).toBe(true);
      expect(chore.caughtUp).toBe(false);
      expect(chore.rotatingIndex).toBe(2);
    });

    it('should process normally when yesterday was a skip day', () => {
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
      if (!chore) return;
      chore.skipDays = [yesterdayDayName];
      // Set initial state
      chore.completedToday = true;
      chore.caughtUp = false;
      chore.rotatingIndex = 1;

      helperInstance.performDailyReset();

      // Should process normally since yesterday being skip day has no special treatment
      expect(chore.completedToday).toBe(false);
      expect(chore.caughtUp).toBe(true); // Was completed yesterday
      expect(chore.rotatingIndex).toBe(2); // Should rotate since caughtUp is true
    });

    it('should rotate rotating chores when caughtUp is true', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      // Set up chore as completed yesterday and at index 0 (no skip days)
      chore.completedToday = true;
      chore.rotatingIndex = 0;
      // Ensure no skip days so it processes as normal day
      chore.skipDays = [];

      helperInstance.performDailyReset();

      // Should rotate to next person
      expect(chore.completedToday).toBe(false);
      expect(chore.caughtUp).toBe(true);
      expect(chore.rotatingIndex).toBe(1);
    });

    it('should not rotate rotating chores when caughtUp is false', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      // Set up chore as not completed yesterday and at index 0
      chore.completedToday = false;
      chore.rotatingIndex = 0;

      helperInstance.performDailyReset();

      // Should not rotate
      expect(chore.completedToday).toBe(false);
      expect(chore.caughtUp).toBe(false);
      expect(chore.rotatingIndex).toBe(0);
    });

    it('should handle rotation wrap-around correctly', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      // Set up chore as completed yesterday and at last index (no skip days)
      chore.completedToday = true;
      chore.rotatingIndex = 4; // Last index in rotation array
      chore.skipDays = []; // Ensure no skip days

      helperInstance.performDailyReset();

      // Should wrap around to index 0
      expect(chore.completedToday).toBe(false);
      expect(chore.caughtUp).toBe(true);
      expect(chore.rotatingIndex).toBe(0);
    });

    it('should not rotate personal chores even when caughtUp is true', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '3');
      if (!chore) return;
      // Set up personal chore as completed yesterday
      chore.completedToday = true;
      chore.caughtUp = false;
      chore.assignedTo = '1';

      helperInstance.performDailyReset();

      // Should update caughtUp but not affect assignment
      expect(chore.completedToday).toBe(false);
      expect(chore.caughtUp).toBe(true);
      expect(chore.assignedTo).toBe('1');
    });

    it('should handle multiple chores with mixed completion status and rotation', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Chore 1 completed yesterday, Chore 2 not completed
      const chore1 = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      const chore2 = helperInstance.choreData.chores.find((c: Chore) => c.id === '2');
      if (!chore1 || !chore2) return;
      chore1.completedToday = true;
      chore1.rotatingIndex = 0;
      chore2.completedToday = false;
      chore2.rotatingIndex = 1;
      // Ensure no skip days so they process as normal days
      chore1.skipDays = [];
      chore2.skipDays = [];

      helperInstance.performDailyReset();

      expect(chore1.caughtUp).toBe(true);
      expect(chore1.rotatingIndex).toBe(1); // Should rotate
      expect(chore2.caughtUp).toBe(false);
      expect(chore2.rotatingIndex).toBe(1); // Should not rotate
    });

    it('should handle empty chore data gracefully', () => {
      helperInstance.choreData = null;

      // Should not throw
      expect(() => helperInstance.performDailyReset()).not.toThrow();
    });

    describe('skipDayVisibility behavior', () => {
      it('should not change chore state when skipDayVisibility is HIDE', () => {
        expect(helperInstance.choreData).not.toBeNull();
        if (!helperInstance.choreData) return;
        const today = new Date();
        const todayDayName = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ][today.getDay()];
        const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
        if (!chore) return;
        chore.skipDays = [todayDayName];
        chore.skipDayVisibility = SkipDayVisibility.HIDE;
        chore.completedToday = true;
        chore.caughtUp = false;
        chore.rotatingIndex = 2;

        helperInstance.performDailyReset();

        // Everything should remain unchanged
        expect(chore.completedToday).toBe(true);
        expect(chore.caughtUp).toBe(false);
        expect(chore.rotatingIndex).toBe(2);
      });

      it('should show and process but not rotate when skipDayVisibility is SHOW_IF_OVERDUE and chore is caught up', () => {
        expect(helperInstance.choreData).not.toBeNull();
        if (!helperInstance.choreData) return;
        const today = new Date();
        const todayDayName = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ][today.getDay()];
        const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
        if (!chore) return;
        chore.skipDays = [todayDayName];
        chore.skipDayVisibility = SkipDayVisibility.SHOW_IF_OVERDUE;
        chore.completedToday = true;
        chore.caughtUp = false;
        chore.rotatingIndex = 1;

        helperInstance.performDailyReset();

        // Should only update caughtUp, leave completedToday and rotatingIndex alone
        expect(chore.completedToday).toBe(true); // Should remain unchanged
        expect(chore.caughtUp).toBe(true); // should have been updated
        expect(chore.rotatingIndex).toBe(1); // Should not rotate
      });

      it('should show and process but not rotate when skipDayVisibility is SHOW_IF_OVERDUE and chore is not caught up', () => {
        expect(helperInstance.choreData).not.toBeNull();
        if (!helperInstance.choreData) return;
        const today = new Date();
        const todayDayName = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ][today.getDay()];
        const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
        if (!chore) return;
        chore.skipDays = [todayDayName];
        chore.skipDayVisibility = SkipDayVisibility.SHOW_IF_OVERDUE;
        chore.completedToday = false;
        chore.caughtUp = true;
        chore.rotatingIndex = 1;

        helperInstance.performDailyReset();

        // Should only update caughtUp, leave completedToday and rotatingIndex alone
        expect(chore.completedToday).toBe(false); // Should remain unchanged
        expect(chore.caughtUp).toBe(false);
        expect(chore.rotatingIndex).toBe(1); // Should not rotate
      });

      it('should show and process normally but not rotate when skipDayVisibility is SHOW_ALWAYS', () => {
        expect(helperInstance.choreData).not.toBeNull();
        if (!helperInstance.choreData) return;
        const today = new Date();
        const todayDayName = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ][today.getDay()];
        const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
        if (!chore) return;
        chore.skipDays = [todayDayName];
        chore.skipDayVisibility = SkipDayVisibility.SHOW_ALWAYS;
        chore.completedToday = true;
        chore.caughtUp = false;
        chore.rotatingIndex = 1;

        helperInstance.performDailyReset();

        // Should only update caughtUp, leave completedToday and rotatingIndex alone
        expect(chore.completedToday).toBe(true); // Should remain unchanged (checkmark stays)
        expect(chore.caughtUp).toBe(true);
        expect(chore.rotatingIndex).toBe(1); // Should not rotate on skip day
      });

      it('should default to HIDE when skipDayVisibility is not specified', () => {
        expect(helperInstance.choreData).not.toBeNull();
        if (!helperInstance.choreData) return;
        const today = new Date();
        const todayDayName = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ][today.getDay()];
        const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
        if (!chore) return;
        chore.skipDays = [todayDayName];
        // Don't set skipDayVisibility - should default to HIDE
        chore.completedToday = true;
        chore.caughtUp = false;
        chore.rotatingIndex = 2;

        helperInstance.performDailyReset();

        // Should behave like HIDE - everything unchanged except caughtUp gets updated
        expect(chore.completedToday).toBe(true);
        expect(chore.caughtUp).toBe(true); // Should be updated since completedToday was true
        expect(chore.rotatingIndex).toBe(2);
      });

      it('should handle personal chores with SHOW_IF_OVERDUE on skip days', () => {
        expect(helperInstance.choreData).not.toBeNull();
        if (!helperInstance.choreData) return;
        const today = new Date();
        const todayDayName = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ][today.getDay()];
        const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '3');
        if (!chore) return;
        chore.skipDays = [todayDayName];
        chore.skipDayVisibility = SkipDayVisibility.SHOW_IF_OVERDUE;
        chore.completedToday = true;
        chore.caughtUp = false;
        chore.assignedTo = '1';

        helperInstance.performDailyReset();

        // Should only update caughtUp, leave completedToday and assignment alone
        expect(chore.completedToday).toBe(true); // Should remain unchanged
        expect(chore.caughtUp).toBe(true);
        expect(chore.assignedTo).toBe('1');
      });
    });
  });

  describe('handleCaughtUpReset', () => {
    it('should reset caughtUp to true for personal chores assigned to person', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Chore 3 is assigned to person '1' (personal chore)
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '3');
      if (!chore) return;
      chore.caughtUp = false;

      const payload = { personId: '1', pin: undefined };
      helperInstance.handleCaughtUpReset(payload);

      expect(chore.caughtUp).toBe(true);
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should reset caughtUp to true for rotating chores where person is current assignee', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Chore 1 is rotating with index 0 (person '1' is current)
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.caughtUp = false;

      const payload = { personId: '1', pin: undefined };
      helperInstance.handleCaughtUpReset(payload);

      expect(chore.caughtUp).toBe(true);
      expect(mockSaveChoreData).toHaveBeenCalled();
    });

    it('should not affect rotating chores where person is not current assignee', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      // Chore 1 is rotating with index 0 (person '1' is current, not '2')
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.caughtUp = false;

      const payload = { personId: '2', pin: undefined };
      helperInstance.handleCaughtUpReset(payload);

      // Should not change caughtUp for chore 1 since person 2 is not assigned
      expect(chore.caughtUp).toBe(false);
    });

    it('should require PIN when adminPin is configured', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      helperInstance.config = { adminPin: '1234', dataFile: 'test-data.json' };
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.caughtUp = false;

      const payload = { personId: '1', pin: 'wrongpin' };
      helperInstance.handleCaughtUpReset(payload);

      // Should send PIN error and not save
      expect(mockSendSocketNotification).toHaveBeenCalledWith('PIN_ERROR', {
        message: 'Invalid PIN',
      });
      expect(chore.caughtUp).toBe(false);
      expect(mockSaveChoreData).not.toHaveBeenCalled();
    });

    it('should succeed with correct PIN when adminPin is configured', () => {
      expect(helperInstance.choreData).not.toBeNull();
      if (!helperInstance.choreData) return;
      helperInstance.config = { adminPin: '1234', dataFile: 'test-data.json' };
      const chore = helperInstance.choreData.chores.find((c: Chore) => c.id === '1');
      if (!chore) return;
      chore.caughtUp = false;

      const payload = { personId: '1', pin: '1234' };
      helperInstance.handleCaughtUpReset(payload);

      expect(chore.caughtUp).toBe(true);
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
