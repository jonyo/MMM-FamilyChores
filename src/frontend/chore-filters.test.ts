import { describe, expect, it } from 'vitest';
import type { Chore } from '../types/chore-types';
import {
  BeforeStartTimeVisibility,
  ChoreType,
  NotCaughtUpDisplay,
  PostDeadlineVisibility,
  SkipDayVisibility,
} from '../types/chore-types';
import { isChoreOverdue, isEarlierChore, shouldShowChore } from './chore-filters';

const baseChore: Chore = {
  id: 'c1',
  name: 'Test chore',
  type: ChoreType.PERSONAL,
  assignedTo: 'p1',
  skipDays: [],
  skipDayVisibility: SkipDayVisibility.HIDE,
  beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
  postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
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

  it('returns true when incomplete and post-deadline is set to earlier', () => {
    const chore: Chore = {
      ...baseChore,
      deadline: '09:00',
      postDeadlineVisibility: PostDeadlineVisibility.MOVE_TO_EARLIER,
    };
    expect(isEarlierChore(chore, '10:00')).toBe(true);
  });

  it('returns false when incomplete and post-deadline is set to normal', () => {
    const chore: Chore = {
      ...baseChore,
      deadline: '09:00',
      postDeadlineVisibility: PostDeadlineVisibility.SHOW_NORMAL,
    };
    expect(isEarlierChore(chore, '10:00')).toBe(false);
  });

  it('returns false when incomplete and post-deadline is set to overdue', () => {
    const chore: Chore = {
      ...baseChore,
      deadline: '09:00',
      postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
    };
    expect(isEarlierChore(chore, '10:00')).toBe(false);
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

  it('returns true when past deadline and post-deadline is set to overdue', () => {
    const chore: Chore = { ...baseChore, deadline: '09:00' };
    expect(isChoreOverdue(chore, '10:00')).toBe(true);
  });

  it('returns false when past deadline and post-deadline is set to normal', () => {
    const chore: Chore = {
      ...baseChore,
      deadline: '09:00',
      postDeadlineVisibility: PostDeadlineVisibility.SHOW_NORMAL,
    };
    expect(isChoreOverdue(chore, '10:00')).toBe(false);
  });

  it('returns false when past deadline and post-deadline is set to earlier', () => {
    const chore: Chore = {
      ...baseChore,
      deadline: '09:00',
      postDeadlineVisibility: PostDeadlineVisibility.MOVE_TO_EARLIER,
    };
    expect(isChoreOverdue(chore, '10:00')).toBe(false);
  });
});
