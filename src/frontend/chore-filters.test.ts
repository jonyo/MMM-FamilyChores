import { describe, expect, it } from 'vitest';
import type { Chore } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import {
  getHiddenLaterChores,
  isChoreOverdue,
  isEarlierChore,
  isHiddenByStartTime,
  shouldShowChore,
} from './chore-filters';

const baseChore: Chore = {
  id: 'c1',
  name: 'Test chore',
  type: ChoreType.PERSONAL,
  assignedTo: 'p1',
  skipDays: [],
  skipDayVisibility: SkipDayVisibility.HIDE,
  beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
  afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
  notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
  caughtUp: true,
  completedToday: false,
};

describe('shouldShowChore', () => {
  it('hides a chore on a skip day when configured to hide', () => {
    const chore: Chore = {
      ...baseChore,
      skipDays: ['monday' as never],
      skipDayVisibility: SkipDayVisibility.HIDE,
    };
    expect(shouldShowChore(chore, 'monday' as never, '10:00')).toBe(false);
  });

  it('shows a completed chore even before its start time', () => {
    const chore: Chore = {
      ...baseChore,
      startTime: '12:00',
      completedToday: true,
    };
    expect(shouldShowChore(chore, 'monday' as never, '10:00')).toBe(true);
  });

  it('hides a chore before its start time when configured to hide', () => {
    const chore: Chore = {
      ...baseChore,
      startTime: '12:00',
      beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
    };
    expect(shouldShowChore(chore, 'monday' as never, '10:00')).toBe(false);
  });

  it('shows a missed chore before its start time when configured to show if overdue', () => {
    const chore: Chore = {
      ...baseChore,
      startTime: '12:00',
      beforeStartTimeVisibility: BeforeStartTimeVisibility.SHOW_IF_OVERDUE,
      caughtUp: false,
    };
    expect(shouldShowChore(chore, 'monday' as never, '10:00')).toBe(true);
  });

  it('hides a caught-up chore before its start time even when configured to show if overdue', () => {
    const chore: Chore = {
      ...baseChore,
      startTime: '12:00',
      beforeStartTimeVisibility: BeforeStartTimeVisibility.SHOW_IF_OVERDUE,
      caughtUp: true,
    };
    expect(shouldShowChore(chore, 'monday' as never, '10:00')).toBe(false);
  });
});

describe('isEarlierChore', () => {
  it('returns false when the chore has no deadline', () => {
    const chore: Chore = { ...baseChore, completedToday: true };
    expect(isEarlierChore(chore, '10:00')).toBe(false);
  });

  it('returns false when the deadline is in the future', () => {
    const chore: Chore = { ...baseChore, deadline: '12:00', completedToday: true };
    expect(isEarlierChore(chore, '10:00')).toBe(false);
  });

  it('returns true when completed and past the deadline', () => {
    const chore: Chore = { ...baseChore, deadline: '09:00', completedToday: true };
    expect(isEarlierChore(chore, '10:00')).toBe(true);
  });

  it('returns true when incomplete and after-deadline is set to earlier', () => {
    const chore: Chore = {
      ...baseChore,
      deadline: '09:00',
      afterDeadlineVisibility: AfterDeadlineVisibility.MOVE_TO_EARLIER,
    };
    expect(isEarlierChore(chore, '10:00')).toBe(true);
  });

  it('returns false when incomplete and after-deadline is set to normal', () => {
    const chore: Chore = {
      ...baseChore,
      deadline: '09:00',
      afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_NORMAL,
    };
    expect(isEarlierChore(chore, '10:00')).toBe(false);
  });

  it('returns false when incomplete and after-deadline is set to overdue', () => {
    const chore: Chore = {
      ...baseChore,
      deadline: '09:00',
      afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
    };
    expect(isEarlierChore(chore, '10:00')).toBe(false);
  });
});

describe('isHiddenByStartTime', () => {
  it('returns false when the chore has no startTime', () => {
    const chore: Chore = {
      ...baseChore,
      beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
    };
    expect(isHiddenByStartTime(chore, 'monday' as never, '10:00')).toBe(false);
  });

  it('returns false when the current time is past the startTime', () => {
    const chore: Chore = {
      ...baseChore,
      startTime: '09:00',
      beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
    };
    expect(isHiddenByStartTime(chore, 'monday' as never, '10:00')).toBe(false);
  });

  it('returns false for a completed chore before its startTime', () => {
    const chore: Chore = {
      ...baseChore,
      startTime: '12:00',
      beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
      completedToday: true,
    };
    expect(isHiddenByStartTime(chore, 'monday' as never, '10:00')).toBe(false);
  });

  it('returns true for a chore hidden before its startTime', () => {
    const chore: Chore = {
      ...baseChore,
      startTime: '12:00',
      beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
    };
    expect(isHiddenByStartTime(chore, 'monday' as never, '10:00')).toBe(true);
  });

  it('returns true for a caught-up chore with SHOW_IF_OVERDUE before its startTime', () => {
    const chore: Chore = {
      ...baseChore,
      startTime: '12:00',
      beforeStartTimeVisibility: BeforeStartTimeVisibility.SHOW_IF_OVERDUE,
      caughtUp: true,
    };
    expect(isHiddenByStartTime(chore, 'monday' as never, '10:00')).toBe(true);
  });

  it('returns false for a not-caught-up chore with SHOW_IF_OVERDUE before its startTime', () => {
    const chore: Chore = {
      ...baseChore,
      startTime: '12:00',
      beforeStartTimeVisibility: BeforeStartTimeVisibility.SHOW_IF_OVERDUE,
      caughtUp: false,
    };
    expect(isHiddenByStartTime(chore, 'monday' as never, '10:00')).toBe(false);
  });

  it('returns false for a chore hidden by skip days', () => {
    const chore: Chore = {
      ...baseChore,
      startTime: '12:00',
      skipDays: ['monday' as never],
      skipDayVisibility: SkipDayVisibility.HIDE,
      beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
    };
    expect(isHiddenByStartTime(chore, 'monday' as never, '10:00')).toBe(false);
  });
});

describe('getHiddenLaterChores', () => {
  const people = [{ id: 'p1', name: 'Alice', color: '#ff0000' }];

  it('returns chores hidden before their startTime for the filtered person', () => {
    const chores: Chore[] = [
      { ...baseChore, id: 'c1', startTime: '12:00', assignedTo: 'p1' },
      { ...baseChore, id: 'c2', startTime: '14:00', assignedTo: 'p1' },
      { ...baseChore, id: 'c3', startTime: '09:00', assignedTo: 'p1' },
    ];
    const result = getHiddenLaterChores(chores, people, 'p1', 'monday' as never, '10:00');
    expect(result.map((chore) => chore.id)).toEqual(['c1', 'c2']);
  });

  it('returns only chores assigned to the filtered person', () => {
    const chores: Chore[] = [
      { ...baseChore, id: 'c1', startTime: '12:00', assignedTo: 'p1' },
      { ...baseChore, id: 'c2', startTime: '12:00', assignedTo: 'p2' },
    ];
    const result = getHiddenLaterChores(chores, people, 'p1', 'monday' as never, '10:00');
    expect(result.map((chore) => chore.id)).toEqual(['c1']);
  });

  it('returns rotating chores assigned to the filtered person', () => {
    const chores: Chore[] = [
      {
        ...baseChore,
        id: 'c1',
        type: ChoreType.ROTATING,
        startTime: '12:00',
        rotation: ['p1', 'p2'],
        rotatingIndex: 0,
      } as Chore,
    ];
    const result = getHiddenLaterChores(chores, people, 'p1', 'monday' as never, '10:00');
    expect(result.map((chore) => chore.id)).toEqual(['c1']);
  });

  it('returns all hidden later chores when no person filter is provided', () => {
    const chores: Chore[] = [
      { ...baseChore, id: 'c1', startTime: '12:00', assignedTo: 'p1' },
      { ...baseChore, id: 'c2', startTime: '12:00', assignedTo: 'p2' },
    ];
    const result = getHiddenLaterChores(chores, people, null, 'monday' as never, '10:00');
    expect(result.map((chore) => chore.id)).toEqual(['c1', 'c2']);
  });
});

describe('isChoreOverdue', () => {
  it('returns false for completed chores', () => {
    const chore: Chore = { ...baseChore, completedToday: true, caughtUp: false };
    expect(isChoreOverdue(chore, '10:00')).toBe(false);
  });

  it('returns true when not caught up and display is set to overdue', () => {
    const chore: Chore = { ...baseChore, caughtUp: false };
    expect(isChoreOverdue(chore, '10:00')).toBe(true);
  });

  it('returns false when not caught up but display is set to normal', () => {
    const chore: Chore = {
      ...baseChore,
      caughtUp: false,
      notCaughtUpDisplay: NotCaughtUpDisplay.NORMAL,
    };
    expect(isChoreOverdue(chore, '10:00')).toBe(false);
  });

  it('returns true when past deadline and after-deadline is set to overdue', () => {
    const chore: Chore = { ...baseChore, deadline: '09:00' };
    expect(isChoreOverdue(chore, '10:00')).toBe(true);
  });

  it('returns false when past deadline and after-deadline is set to normal', () => {
    const chore: Chore = {
      ...baseChore,
      deadline: '09:00',
      afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_NORMAL,
    };
    expect(isChoreOverdue(chore, '10:00')).toBe(false);
  });

  it('returns false when past deadline and after-deadline is set to earlier', () => {
    const chore: Chore = {
      ...baseChore,
      deadline: '09:00',
      afterDeadlineVisibility: AfterDeadlineVisibility.MOVE_TO_EARLIER,
    };
    expect(isChoreOverdue(chore, '10:00')).toBe(false);
  });
});
