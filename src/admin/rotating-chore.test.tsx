import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import type { Person, RotatingChore } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  DayOfWeek,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import { RotatingChoreCard } from './rotating-chore';
import { MockAdminProvider } from './test-utils';

describe('RotatingChoreCard', () => {
  const mockPeople: Person[] = [
    { id: 'person-1', name: 'Alice', color: '#ff0000' },
    { id: 'person-2', name: 'Bob', color: '#00ff00' },
    { id: 'person-3', name: 'Charlie', color: '#0000ff' },
  ];

  const mockChore: RotatingChore = {
    id: 'chore-1',
    name: 'Dishes',
    type: ChoreType.ROTATING,
    rotation: ['person-1', 'person-2', 'person-3'],
    rotatingIndex: 0,
    skipDays: [],
    skipDayVisibility: SkipDayVisibility.HIDE,
    beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
    afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
    notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
    caughtUp: false,
    completedToday: false,
  };

  const renderCard = (chore: RotatingChore, people: Person[]) => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(() => (
      <MockAdminProvider>
        <RotatingChoreCard chore={chore} people={people} onEdit={onEdit} onDelete={onDelete} />
      </MockAdminProvider>
    ));
    return { onEdit, onDelete };
  };

  it('renders chore name with rotating badge', async () => {
    renderCard(mockChore, mockPeople);
    await expect.element(page.getByText('Dishes')).toBeVisible();
    await expect.element(page.getByText('Rotating')).toBeVisible();
  });

  it('displays current assignee', async () => {
    renderCard(mockChore, mockPeople);
    await expect.element(page.getByText('Current: Alice')).toBeVisible();
  });

  it('displays rotation list names', async () => {
    const partialRotationChore: RotatingChore = {
      ...mockChore,
      rotation: ['person-1', 'person-2'],
    };
    renderCard(partialRotationChore, mockPeople);
    await expect.element(page.getByText('Rotation: Alice, Bob')).toBeVisible();
  });

  it('displays "Everyone" when rotation includes all people', async () => {
    renderCard(mockChore, mockPeople);
    await expect.element(page.getByText('Rotation: Everyone')).toBeVisible();
  });

  it('displays "Everyone" only when rotation exactly matches all people', async () => {
    const partialRotationChore: RotatingChore = {
      ...mockChore,
      rotation: ['person-1', 'person-2'],
    };
    renderCard(partialRotationChore, mockPeople);
    await expect.element(page.getByText('Rotation: Alice, Bob')).toBeVisible();
    expect(page.getByText('Rotation: Everyone').elements().length).toBe(0);
  });

  it('displays deadline when present', async () => {
    const choreWithDeadline: RotatingChore = {
      ...mockChore,
      deadline: '17:00',
    };
    renderCard(choreWithDeadline, mockPeople);
    await expect.element(page.getByText('Deadline: 17:00')).toBeVisible();
  });

  it('does not display deadline when not present', async () => {
    renderCard(mockChore, mockPeople);
    expect(page.getByText(/Deadline:/).elements().length).toBe(0);
  });

  it('displays skip days', async () => {
    const choreWithSkipDays: RotatingChore = {
      ...mockChore,
      skipDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
    };
    renderCard(choreWithSkipDays, mockPeople);
    await expect.element(page.getByText('Skip days: Monday, Wednesday')).toBeVisible();
  });

  it('displays "None" for skip days when empty', async () => {
    renderCard(mockChore, mockPeople);
    await expect.element(page.getByText('Skip days: None')).toBeVisible();
  });

  it('calls onEdit with chore when edit button is clicked', async () => {
    const { onEdit } = renderCard(mockChore, mockPeople);
    const editButton = page.getByRole('button', { name: 'Edit' });
    await editButton.click();
    expect(onEdit).toHaveBeenCalledWith(mockChore);
  });

  it('calls onDelete with chore ID when delete button is clicked', async () => {
    const { onDelete } = renderCard(mockChore, mockPeople);
    const deleteButton = page.getByRole('button', { name: 'Delete' });
    await deleteButton.click();
    expect(onDelete).toHaveBeenCalledWith('chore-1');
  });

  it('displays "Unassigned" when current person is not found', async () => {
    const choreWithInvalidPerson: RotatingChore = {
      ...mockChore,
      rotation: ['invalid-person-id'],
    };
    renderCard(choreWithInvalidPerson, mockPeople);
    await expect.element(page.getByText('Current: Unassigned')).toBeVisible();
  });

  it('displays "Unknown" for missing people in rotation list', async () => {
    const choreWithMissingPerson: RotatingChore = {
      ...mockChore,
      rotation: ['person-1', 'invalid-person-id'],
    };
    renderCard(choreWithMissingPerson, mockPeople);
    await expect.element(page.getByText(/Alice, Unknown/)).toBeVisible();
  });

  it('handles empty people list', async () => {
    renderCard(mockChore, []);
    await expect.element(page.getByText('Current: Unassigned')).toBeVisible();
    await expect.element(page.getByText('Rotation: Unknown, Unknown, Unknown')).toBeVisible();
  });
});
