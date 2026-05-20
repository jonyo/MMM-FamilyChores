import { render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import type { DailyCompletion, Person } from '../types/chore-types';
import { ChoreHistoryModal } from './chore-history-modal';
import { MockAdminProvider, mockPersonalChore } from './test-utils';

describe('ChoreHistoryModal', () => {
  const mockPerson: Person = {
    id: 'p1',
    name: 'Alice',
    color: '#FF6B6B',
  };

  const mockHistory: DailyCompletion[] = [
    {
      id: 'dc1',
      date: '2024-01-13', // 2 days before 2024-01-15
      personId: 'p1',
      choreId: 'c1',
      completed: true,
      completedAt: '12:00',
      wasLate: false,
    },
    {
      id: 'dc2',
      date: '2024-01-10', // 5 days before 2024-01-15
      personId: 'p1',
      choreId: 'c1',
      completed: true,
      completedAt: '19:00',
      wasLate: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders modal with person name', async () => {
    const closeModal = vi.fn();
    const loadDataMock = vi.fn().mockResolvedValue(undefined);

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
        }}
        loadDataMock={loadDataMock}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await expect.element(page.getByTestId('modal')).toBeVisible();
    await expect.element(page.getByText("Alice's Chore History")).toBeVisible();
  });

  it('shows loading state initially', async () => {
    const closeModal = vi.fn();
    const loadDataMock = vi.fn().mockImplementation(() => new Promise<void>(() => {}));

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
        }}
        loadDataMock={loadDataMock}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await expect.element(page.getByText('Loading history...')).toBeVisible();
  });

  it('renders history table when data loads successfully', async () => {
    const closeModal = vi.fn();
    const loadDataMock = vi.fn().mockResolvedValue(undefined);

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room', assignedTo: 'p1' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
          ],
          dailyCompletions: mockHistory,
        }}
        loadDataMock={loadDataMock}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await vi.advanceTimersByTimeAsync(100);

    await expect.element(page.getByTestId('history-table')).toBeVisible();
    await expect.element(page.getByText('Clean room')).toBeVisible();
    await expect.element(page.getByText('Do dishes')).toBeVisible();
  });

  it('shows completion badges for completed chores', async () => {
    const closeModal = vi.fn();
    const loadDataMock = vi.fn().mockResolvedValue(undefined);

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room', assignedTo: 'p1' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
          ],
          dailyCompletions: mockHistory,
        }}
        loadDataMock={loadDataMock}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await vi.advanceTimersByTimeAsync(100);

    const completionBadges = page.getByTestId('completion-ontime').elements();
    const lateBadges = page.getByTestId('completion-late').elements();
    expect(completionBadges.length + lateBadges.length).toBeGreaterThan(0);
  });

  it('shows on-time completion in green', async () => {
    const closeModal = vi.fn();
    const loadDataMock = vi.fn().mockResolvedValue(undefined);

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room', assignedTo: 'p1' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
          ],
          dailyCompletions: mockHistory,
        }}
        loadDataMock={loadDataMock}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await vi.advanceTimersByTimeAsync(100);

    await expect.element(page.getByTestId('completion-ontime')).toBeVisible();
  });

  it('shows late completion in yellow', async () => {
    const closeModal = vi.fn();
    const loadDataMock = vi.fn().mockResolvedValue(undefined);

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room', assignedTo: 'p1' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
          ],
          dailyCompletions: mockHistory,
        }}
        loadDataMock={loadDataMock}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await vi.advanceTimersByTimeAsync(100);

    await expect.element(page.getByTestId('completion-late')).toBeVisible();
  });

  it('calls closeModal when close button is clicked', async () => {
    const closeModal = vi.fn();
    const loadDataMock = vi.fn().mockResolvedValue(undefined);

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
          dailyCompletions: mockHistory,
        }}
        loadDataMock={loadDataMock}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await vi.advanceTimersByTimeAsync(100);

    await page.getByTestId('close-button').click();

    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  it('calls loadData when modal opens', async () => {
    const closeModal = vi.fn();
    const loadDataMock = vi.fn().mockResolvedValue(undefined);

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
        }}
        loadDataMock={loadDataMock}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    expect(loadDataMock).toHaveBeenCalledTimes(1);
  });

  it('shows only personal chores for the person', async () => {
    const closeModal = vi.fn();
    const loadDataMock = vi.fn().mockResolvedValue(undefined);

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room', assignedTo: 'p1' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            { ...mockPersonalChore, id: 'c3', name: 'Other chore', assignedTo: 'p2' },
          ],
        }}
        loadDataMock={loadDataMock}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await vi.advanceTimersByTimeAsync(100);

    // Should only show p1's chores
    await expect.element(page.getByText('Clean room')).toBeVisible();
    await expect.element(page.getByText('Do dishes')).toBeVisible();
    expect(page.getByTestId('history-table').element()?.textContent).not.toContain('Other chore');
  });
});
