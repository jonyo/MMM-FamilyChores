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
import { MockAdminProvider } from './test-utils';

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
  const renderCard = (overrideProps?: Partial<Parameters<typeof PersonCard>[0]>) => {
    const defaultProps = {
      person: mockPerson,
      chores: [mockChore],
      canCopyChores: false,
      onEditPerson: vi.fn(),
      onHistory: vi.fn(),
      onDeletePerson: vi.fn(),
      onAddChore: vi.fn(),
      onEditChore: vi.fn(),
      onDeleteChore: vi.fn(),
      onCopyChores: vi.fn(),
      ...overrideProps,
    };
    render(() => (
      <MockAdminProvider>
        <PersonCard {...defaultProps} />
      </MockAdminProvider>
    ));
    return defaultProps;
  };

  it('renders collapsed with name, color, and personal chore count', async () => {
    renderCard();
    await expect.element(page.getByText('Alice')).toBeVisible();
    await expect.element(page.getByText('1 personal chore')).toBeVisible();
    expect(page.getByRole('button', { name: 'Add Chore' }).elements().length).toBe(0);
  });

  it('expands to show chores and action buttons', async () => {
    renderCard({ canCopyChores: true });
    await page.getByTestId('expand-person-chores').click();
    await expect.element(page.getByText("Alice's Personal Chores")).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Add Chore' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Copy Chores' })).toBeVisible();
    await expect.element(page.getByText('Take out trash')).toBeVisible();
  });

  it('shows empty state when no chores', async () => {
    renderCard({ chores: [] });
    await page.getByTestId('expand-person-chores').click();
    await expect.element(page.getByText('No personal chores yet.')).toBeVisible();
  });

  it('calls onEditPerson and onHistory when action buttons are clicked', async () => {
    window.confirm = vi.fn(() => true);
    const { onEditPerson, onHistory, onDeletePerson } = renderCard({ chores: [] });

    await page.getByRole('button', { name: 'Edit' }).click();
    expect(onEditPerson).toHaveBeenCalledWith(mockPerson);

    await page.getByRole('button', { name: 'History' }).click();
    expect(onHistory).toHaveBeenCalledWith(mockPerson);

    await page.getByRole('button', { name: 'Delete' }).click();
    expect(onDeletePerson).toHaveBeenCalledWith(mockPerson.id);
  });

  it('calls onAddChore and onEditChore when expanded chore buttons are clicked', async () => {
    window.confirm = vi.fn(() => true);
    const { onAddChore, onEditChore, onDeleteChore } = renderCard();

    await page.getByTestId('expand-person-chores').click();

    await page.getByRole('button', { name: 'Add Chore' }).click();
    expect(onAddChore).toHaveBeenCalledWith(mockPerson);

    await page.getByRole('button', { name: 'Edit' }).nth(1).click();
    expect(onEditChore).toHaveBeenCalledWith(mockPerson, mockChore);

    await page.getByRole('button', { name: 'Delete' }).nth(1).click();
    expect(onDeleteChore).toHaveBeenCalledWith(mockChore.id);
  });

  it('hides Copy Chores when there are no other people', async () => {
    renderCard({ canCopyChores: false });
    await page.getByTestId('expand-person-chores').click();
    expect(page.getByRole('button', { name: 'Copy Chores' }).elements().length).toBe(0);
  });
});
