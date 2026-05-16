import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import {
  ChoreType,
  DayOfWeek,
  type Person,
  type RotatingChore,
  SkipDayVisibility,
} from '../types/chore-types';
import { RotatingChoreCard } from './rotating-chore';
import '../../public/admin.css';

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
    caughtUp: false,
    completedToday: false,
  };

  it('renders chore name with rotating badge', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(() => (
      <RotatingChoreCard
        chore={mockChore}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    expect(screen.getByText('Dishes')).toBeInTheDocument();
    expect(screen.getByText('Rotating')).toBeInTheDocument();
  });

  it('displays current assignee', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(() => (
      <RotatingChoreCard
        chore={mockChore}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    expect(screen.getByText('Current: Alice')).toBeInTheDocument();
  });

  it('displays rotation list names', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const partialRotationChore: RotatingChore = {
      ...mockChore,
      rotation: ['person-1', 'person-2'],
    };

    render(() => (
      <RotatingChoreCard
        chore={partialRotationChore}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    expect(screen.getByText('Rotation: Alice, Bob')).toBeInTheDocument();
  });

  it('displays "Everyone" when rotation includes all people', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(() => (
      <RotatingChoreCard
        chore={mockChore}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    expect(screen.getByText('Rotation: Everyone')).toBeInTheDocument();
  });

  it('displays "Everyone" only when rotation exactly matches all people', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const partialRotationChore: RotatingChore = {
      ...mockChore,
      rotation: ['person-1', 'person-2'],
    };

    render(() => (
      <RotatingChoreCard
        chore={partialRotationChore}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    expect(screen.getByText('Rotation: Alice, Bob')).toBeInTheDocument();
    expect(screen.queryByText('Rotation: Everyone')).not.toBeInTheDocument();
  });

  it('displays deadline when present', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const choreWithDeadline: RotatingChore = {
      ...mockChore,
      deadline: '5:00 PM',
    };

    render(() => (
      <RotatingChoreCard
        chore={choreWithDeadline}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    expect(screen.getByText('Deadline: 5:00 PM')).toBeInTheDocument();
  });

  it('does not display deadline when not present', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(() => (
      <RotatingChoreCard
        chore={mockChore}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    expect(screen.queryByText(/Deadline:/)).not.toBeInTheDocument();
  });

  it('displays skip days', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const choreWithSkipDays: RotatingChore = {
      ...mockChore,
      skipDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
    };

    render(() => (
      <RotatingChoreCard
        chore={choreWithSkipDays}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    expect(screen.getByText('Skip days: Monday, Wednesday')).toBeInTheDocument();
  });

  it('displays "None" for skip days when empty', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(() => (
      <RotatingChoreCard
        chore={mockChore}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    expect(screen.getByText('Skip days: None')).toBeInTheDocument();
  });

  it('calls onEdit with chore when edit button is clicked', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(() => (
      <RotatingChoreCard
        chore={mockChore}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    const editButton = screen.getByText('Edit');
    await editButton.click();

    expect(onEdit).toHaveBeenCalledWith(mockChore);
  });

  it('calls onDelete with chore ID when delete button is clicked', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(() => (
      <RotatingChoreCard
        chore={mockChore}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    const deleteButton = screen.getByText('Delete');
    await deleteButton.click();

    expect(onDelete).toHaveBeenCalledWith('chore-1');
  });

  it('displays "Unassigned" when current person is not found', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const choreWithInvalidPerson: RotatingChore = {
      ...mockChore,
      rotation: ['invalid-person-id'],
    };

    render(() => (
      <RotatingChoreCard
        chore={choreWithInvalidPerson}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    expect(screen.getByText('Current: Unassigned')).toBeInTheDocument();
  });

  it('displays "Unknown" for missing people in rotation list', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const choreWithMissingPerson: RotatingChore = {
      ...mockChore,
      rotation: ['person-1', 'invalid-person-id'],
    };

    render(() => (
      <RotatingChoreCard
        chore={choreWithMissingPerson}
        people={mockPeople}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ));

    expect(screen.getByText(/Alice, Unknown/)).toBeInTheDocument();
  });

  it('handles empty people list', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(() => (
      <RotatingChoreCard chore={mockChore} people={[]} onEdit={onEdit} onDelete={onDelete} />
    ));

    expect(screen.getByText('Current: Unassigned')).toBeInTheDocument();
    expect(screen.getByText('Rotation: Unknown, Unknown, Unknown')).toBeInTheDocument();
  });
});
