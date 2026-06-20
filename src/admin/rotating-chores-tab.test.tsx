import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import type { Chore, Person, RotatingChore } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import { RotatingChoresTab } from './rotating-chores-tab';

const mockPeople: Person[] = [
  { id: 'p1', name: 'Alice', color: '#FF6B6B' },
  { id: 'p2', name: 'Bob', color: '#4ECDC4' },
];

const mockRotatingChore: RotatingChore = {
  id: 'rc1',
  name: 'Vacuum living room',
  type: ChoreType.ROTATING,
  rotation: ['p1', 'p2'],
  rotatingIndex: 0,
  skipDays: [],
  skipDayVisibility: SkipDayVisibility.HIDE,
  beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
  afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
  notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
  caughtUp: true,
  completedToday: false,
};

const mockChores: Chore[] = [mockRotatingChore];

describe('RotatingChoresTab', () => {
  it('renders rotating chore cards when people exist', () => {
    render(() => (
      <RotatingChoresTab
        people={mockPeople}
        chores={mockChores}
        onAddRotatingChore={vi.fn()}
        onEditRotatingChore={vi.fn()}
        onDeleteChore={vi.fn()}
      />
    ));

    expect(page.getByTestId('rotating-chores-section').elements().length).toBe(1);
    expect(page.getByText('Vacuum living room')).toBeTruthy();
  });

  it('does not render when no people exist', () => {
    render(() => (
      <RotatingChoresTab
        people={[]}
        chores={[]}
        onAddRotatingChore={vi.fn()}
        onEditRotatingChore={vi.fn()}
        onDeleteChore={vi.fn()}
      />
    ));

    expect(page.getByTestId('rotating-chores-section').elements().length).toBe(0);
  });

  it('calls onAddRotatingChore when Add Rotating Chore is clicked', async () => {
    const onAddRotatingChore = vi.fn();

    render(() => (
      <RotatingChoresTab
        people={mockPeople}
        chores={mockChores}
        onAddRotatingChore={onAddRotatingChore}
        onEditRotatingChore={vi.fn()}
        onDeleteChore={vi.fn()}
      />
    ));

    await page.getByRole('button', { name: 'Add Rotating Chore' }).click();
    expect(onAddRotatingChore).toHaveBeenCalled();
  });

  it('calls onEditRotatingChore when an edit button is clicked', async () => {
    const onEditRotatingChore = vi.fn();

    render(() => (
      <RotatingChoresTab
        people={mockPeople}
        chores={mockChores}
        onAddRotatingChore={vi.fn()}
        onEditRotatingChore={onEditRotatingChore}
        onDeleteChore={vi.fn()}
      />
    ));

    await page.getByRole('button', { name: 'Edit' }).click();
    expect(onEditRotatingChore).toHaveBeenCalledWith(mockRotatingChore);
  });

  it('calls onDeleteChore when a delete button is clicked', async () => {
    const onDeleteChore = vi.fn();
    window.confirm = vi.fn(() => true);

    render(() => (
      <RotatingChoresTab
        people={mockPeople}
        chores={mockChores}
        onAddRotatingChore={vi.fn()}
        onEditRotatingChore={vi.fn()}
        onDeleteChore={onDeleteChore}
      />
    ));

    await page.getByRole('button', { name: 'Delete' }).click();
    expect(onDeleteChore).toHaveBeenCalledWith(mockRotatingChore.id);
  });
});
