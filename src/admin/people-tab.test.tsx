import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import type { Chore, Person } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import { PeopleTab } from './people-tab';
import { MockAdminProvider } from './test-utils';

const mockPeople: Person[] = [
  { id: 'p1', name: 'Alice', color: '#FF6B6B' },
  { id: 'p2', name: 'Bob', color: '#4ECDC4' },
];

const mockChores: Chore[] = [
  {
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
  },
];

describe('PeopleTab', () => {
  it('renders a person card for each person', () => {
    render(() => (
      <MockAdminProvider>
        <PeopleTab
          people={mockPeople}
          chores={mockChores}
          onAddPerson={vi.fn()}
          onEditPerson={vi.fn()}
          onHistory={vi.fn()}
          onDeletePerson={vi.fn()}
          onAddChore={vi.fn()}
          onEditChore={vi.fn()}
          onDeleteChore={vi.fn()}
          onCopyChores={vi.fn()}
          onBulkEdit={vi.fn()}
        />
      </MockAdminProvider>
    ));

    const personCards = page.getByTestId('person-card').elements();
    expect(personCards.length).toBe(2);
  });

  it('calls onAddPerson when Add Person button is clicked', async () => {
    const onAddPerson = vi.fn();

    render(() => (
      <MockAdminProvider>
        <PeopleTab
          people={mockPeople}
          chores={mockChores}
          onAddPerson={onAddPerson}
          onEditPerson={vi.fn()}
          onHistory={vi.fn()}
          onDeletePerson={vi.fn()}
          onAddChore={vi.fn()}
          onEditChore={vi.fn()}
          onDeleteChore={vi.fn()}
          onCopyChores={vi.fn()}
          onBulkEdit={vi.fn()}
        />
      </MockAdminProvider>
    ));

    await page.getByRole('button', { name: 'Add Person' }).click();
    expect(onAddPerson).toHaveBeenCalled();
  });

  it('calls onBulkEdit when Bulk Edit Settings button is clicked', async () => {
    const onBulkEdit = vi.fn();

    render(() => (
      <MockAdminProvider>
        <PeopleTab
          people={mockPeople}
          chores={mockChores}
          onAddPerson={vi.fn()}
          onEditPerson={vi.fn()}
          onHistory={vi.fn()}
          onDeletePerson={vi.fn()}
          onAddChore={vi.fn()}
          onEditChore={vi.fn()}
          onDeleteChore={vi.fn()}
          onCopyChores={vi.fn()}
          onBulkEdit={onBulkEdit}
        />
      </MockAdminProvider>
    ));

    await page.getByRole('button', { name: 'Bulk Edit Settings' }).click();
    expect(onBulkEdit).toHaveBeenCalled();
  });

  it('hides Bulk Edit Settings button when there are no personal chores', () => {
    render(() => (
      <MockAdminProvider>
        <PeopleTab
          people={mockPeople}
          chores={[]}
          onAddPerson={vi.fn()}
          onEditPerson={vi.fn()}
          onHistory={vi.fn()}
          onDeletePerson={vi.fn()}
          onAddChore={vi.fn()}
          onEditChore={vi.fn()}
          onDeleteChore={vi.fn()}
          onCopyChores={vi.fn()}
          onBulkEdit={vi.fn()}
        />
      </MockAdminProvider>
    ));

    expect(page.getByTestId('bulk-edit-people-btn').elements().length).toBe(0);
  });

  it('shows help icon when no people exist', () => {
    render(() => (
      <PeopleTab
        people={[]}
        chores={[]}
        onAddPerson={vi.fn()}
        onEditPerson={vi.fn()}
        onHistory={vi.fn()}
        onDeletePerson={vi.fn()}
        onAddChore={vi.fn()}
        onEditChore={vi.fn()}
        onDeleteChore={vi.fn()}
        onCopyChores={vi.fn()}
        onBulkEdit={vi.fn()}
      />
    ));

    expect(page.getByTestId('person-card').elements().length).toBe(0);
    expect(page.getByTestId('help-icon').elements().length).toBe(1);
  });
});
