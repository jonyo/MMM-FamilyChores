import { describe, expect, it } from 'vitest';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  NotCaughtUpDisplay,
} from '../types/chore-types';
import { upgradeData } from './data-upgrade';

describe('upgradeData', () => {
  it('fills missing display option fields with defaults', () => {
    const result = upgradeData({
      chores: [
        {
          id: 'c1',
          name: 'Old chore',
        },
      ],
    });

    const chore = (result as { chores: unknown[] }).chores[0];
    expect(chore).toMatchObject({
      beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
      afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
      notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
    });
  });

  it('preserves existing display option values', () => {
    const result = upgradeData({
      chores: [
        {
          id: 'c1',
          name: 'Upgraded chore',
          beforeStartTimeVisibility: BeforeStartTimeVisibility.SHOW_IF_OVERDUE,
          afterDeadlineVisibility: AfterDeadlineVisibility.MOVE_TO_EARLIER,
          notCaughtUpDisplay: NotCaughtUpDisplay.NORMAL,
        },
      ],
    });

    const chore = (result as { chores: unknown[] }).chores[0];
    expect(chore).toMatchObject({
      beforeStartTimeVisibility: BeforeStartTimeVisibility.SHOW_IF_OVERDUE,
      afterDeadlineVisibility: AfterDeadlineVisibility.MOVE_TO_EARLIER,
      notCaughtUpDisplay: NotCaughtUpDisplay.NORMAL,
    });
  });

  it('normalizes old hide after-deadline value to earlier', () => {
    const result = upgradeData({
      chores: [
        {
          id: 'c1',
          name: 'Old hidden chore',
          afterDeadlineVisibility: 'hide',
        },
      ],
    });

    const chore = (result as { chores: unknown[] }).chores[0];
    expect(chore).toMatchObject({
      afterDeadlineVisibility: AfterDeadlineVisibility.MOVE_TO_EARLIER,
    });
  });

  it('skips invalid chore entries', () => {
    const result = upgradeData({
      chores: [null, 'not a chore', { id: 'c1', name: 'Valid' }],
    });

    const chores = (result as { chores: unknown[] }).chores;
    expect(chores).toHaveLength(3);
    expect(chores[0]).toBeNull();
    expect(chores[1]).toBe('not a chore');
    expect(chores[2]).toMatchObject({
      beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
      afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
      notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
    });
  });

  it('returns an empty object for non-object input', () => {
    expect(upgradeData(null)).toEqual({});
    expect(upgradeData('string')).toEqual({});
    expect(upgradeData(42)).toEqual({});
  });
});
