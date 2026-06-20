import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import type { Person, PersonalChore } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import { PersonCard } from './person-card';

const mockPerson: Person = {
  id: 'p1',
  name: 'Alice',
  color: '#FF6B6B',
};

const mockChore: PersonalChore = {
  id: 'c1',
  name: 'Take out trash',
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

describe('PersonCard', () => {
  it('renders collapsed with name, color, and personal chore count', async () => {
    render(() => (
      <PersonCard
        person={mockPerson}
        chores={[mockChore]}
        canCopyChores={false}
        onEditPerson={vi.fn()}
        onHistory={vi.fn()}
        onDeletePerson={vi.fn()}
        onAddChore={vi.fn()}
        onEditChore={vi.fn()}
        onDeleteChore={vi.fn()}
        onCopyChores={vi.fn()}
      />
    ));

    await expect.element(page.getByText('Alice')).toBeVisible();
    await expect.element(page.getByText('1 personal chore')).toBeVisible();
    expect(page.getByRole('button', { name: 'Add Chore' }).elements().length).toBe(0);
  });

  it('expands to show chores and action buttons', async () => {
    render(() => (
      <PersonCard
        person={mockPerson}
        chores={[mockChore]}
        canCopyChores={true}
        onEditPerson={vi.fn()}
        onHistory={vi.fn()}
        onDeletePerson={vi.fn()}
        onAddChore={vi.fn()}
        onEditChore={vi.fn()}
        onDeleteChore={vi.fn()}
        onCopyChores={vi.fn()}
      />
    ));

    await page.getByTestId('expand-person-chores').click();

    await expect.element(page.getByText("Alice's Personal Chores")).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Add Chore' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Copy Chores' })).toBeVisible();
    await expect.element(page.getByText('Take out trash')).toBeVisible();
  });

  it('shows empty state when no chores', async () => {
    render(() => (
      <PersonCard
        person={mockPerson}
        chores={[]}
        canCopyChores={false}
        onEditPerson={vi.fn()}
        onHistory={vi.fn()}
        onDeletePerson={vi.fn()}
        onAddChore={vi.fn()}
        onEditChore={vi.fn()}
        onDeleteChore={vi.fn()}
        onCopyChores={vi.fn()}
      />
    ));

    await page.getByTestId('expand-person-chores').click();

    await expect.element(page.getByText('No personal chores yet.')).toBeVisible();
  });

  it('calls onEditPerson and onHistory when action buttons are clicked', async () => {
    const onEditPerson = vi.fn();
    const onHistory = vi.fn();
    const onDeletePerson = vi.fn();
    window.confirm = vi.fn(() => true);

    render(() => (
      <PersonCard
        person={mockPerson}
        chores={[]}
        canCopyChores={false}
        onEditPerson={onEditPerson}
        onHistory={onHistory}
        onDeletePerson={onDeletePerson}
        onAddChore={vi.fn()}
        onEditChore={vi.fn()}
        onDeleteChore={vi.fn()}
        onCopyChores={vi.fn()}
      />
    ));

    await page.getByRole('button', { name: 'Edit' }).click();
    expect(onEditPerson).toHaveBeenCalledWith(mockPerson);

    await page.getByRole('button', { name: 'History' }).click();
    expect(onHistory).toHaveBeenCalledWith(mockPerson);

    await page.getByRole('button', { name: 'Delete' }).click();
    expect(onDeletePerson).toHaveBeenCalledWith(mockPerson.id);
  });

  it('calls onAddChore and onEditChore when expanded chore buttons are clicked', async () => {
    const onAddChore = vi.fn();
    const onEditChore = vi.fn();
    const onDeleteChore = vi.fn();
    window.confirm = vi.fn(() => true);

    render(() => (
      <PersonCard
        person={mockPerson}
        chores={[mockChore]}
        canCopyChores={false}
        onEditPerson={vi.fn()}
        onHistory={vi.fn()}
        onDeletePerson={vi.fn()}
        onAddChore={onAddChore}
        onEditChore={onEditChore}
        onDeleteChore={onDeleteChore}
        onCopyChores={vi.fn()}
      />
    ));

    await page.getByTestId('expand-person-chores').click();

    await page.getByRole('button', { name: 'Add Chore' }).click();
    expect(onAddChore).toHaveBeenCalledWith(mockPerson);

    await page.getByRole('button', { name: 'Edit' }).nth(1).click();
    expect(onEditChore).toHaveBeenCalledWith(mockPerson, mockChore);

    await page.getByRole('button', { name: 'Delete' }).nth(1).click();
    expect(onDeleteChore).toHaveBeenCalledWith(mockChore.id);
  });

  it('hides Copy Chores when there are no other people', async () => {
    render(() => (
      <PersonCard
        person={mockPerson}
        chores={[mockChore]}
        canCopyChores={false}
        onEditPerson={vi.fn()}
        onHistory={vi.fn()}
        onDeletePerson={vi.fn()}
        onAddChore={vi.fn()}
        onEditChore={vi.fn()}
        onDeleteChore={vi.fn()}
        onCopyChores={vi.fn()}
      />
    ));

    await page.getByTestId('expand-person-chores').click();
    expect(page.getByRole('button', { name: 'Copy Chores' }).elements().length).toBe(0);
  });
});
