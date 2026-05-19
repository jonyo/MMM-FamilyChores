import { render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getHistory } from '../api';
import type { DailyCompletion, Person } from '../types/chore-types';
import { ChoreHistoryModal } from './chore-history-modal';
import { MockAdminProvider, mockPersonalChore } from './test-utils';

// Mock API functions
vi.mock('../api', () => ({
  getHistory: vi.fn(),
}));

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

  it('renders modal with person name', () => {
    const closeModal = vi.fn();
    vi.mocked(getHistory).mockResolvedValueOnce([]);

    const { container } = render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
        }}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    expect(container.querySelector('[data-testid="modal"]')).toBeInTheDocument();
    expect(screen.getByText("Alice's Chore History")).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    const closeModal = vi.fn();
    vi.mocked(getHistory).mockResolvedValueOnce([]);

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
        }}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    const closeModal = vi.fn();
    vi.mocked(getHistory).mockRejectedValueOnce(new Error('Failed to fetch history'));

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
        }}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    expect(screen.getByText('Error: Failed to fetch history')).toBeInTheDocument();
  });

  it.skip('renders history table when data loads successfully', async () => {
    const closeModal = vi.fn();
    vi.mocked(getHistory).mockResolvedValueOnce(mockHistory);

    const { container } = render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
        }}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    expect(container.querySelector('[data-testid="history-table"]')).toBeInTheDocument();
    expect(screen.getByText('Clean room')).toBeInTheDocument();
    expect(screen.getByText('Do dishes')).toBeInTheDocument();
  });

  it.skip('shows completion badges for completed chores', async () => {
    const closeModal = vi.fn();
    vi.mocked(getHistory).mockResolvedValueOnce(mockHistory);

    const { container } = render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
        }}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    const completionBadges = container.querySelectorAll(
      '[data-testid="completion-ontime"], [data-testid="completion-late"]'
    );
    expect(completionBadges.length).toBeGreaterThan(0);
  });

  it.skip('shows on-time completion in green', async () => {
    const closeModal = vi.fn();
    vi.mocked(getHistory).mockResolvedValueOnce(mockHistory);

    const { container } = render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
        }}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    const onTimeBadge = container.querySelector('[data-testid="completion-ontime"]');
    expect(onTimeBadge).toBeInTheDocument();
  });

  it.skip('shows late completion in yellow', async () => {
    const closeModal = vi.fn();
    vi.mocked(getHistory).mockResolvedValueOnce(mockHistory);

    const { container } = render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
        }}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    const lateBadge = container.querySelector('[data-testid="completion-late"]');
    expect(lateBadge).toBeInTheDocument();
  });

  it('calls closeModal when close button is clicked', async () => {
    const closeModal = vi.fn();
    vi.mocked(getHistory).mockResolvedValueOnce(mockHistory);

    const { container } = render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
        }}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    const closeButton = container.querySelector(
      '[data-testid="close-button"]'
    ) as HTMLButtonElement;
    closeButton.click();

    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  it('filters history by person ID', async () => {
    const closeModal = vi.fn();
    vi.mocked(getHistory).mockResolvedValueOnce(mockHistory);

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes' },
          ],
        }}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    expect(getHistory).toHaveBeenCalledWith('p1');
  });

  it.skip('shows only personal chores for the person', async () => {
    const closeModal = vi.fn();
    vi.mocked(getHistory).mockResolvedValueOnce(mockHistory);

    render(() => (
      <MockAdminProvider
        choreDataOverride={{
          chores: [
            { ...mockPersonalChore, id: 'c1', name: 'Clean room', assignedTo: 'p1' },
            { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            { ...mockPersonalChore, id: 'c3', name: 'Other chore', assignedTo: 'p2' },
          ],
        }}
      >
        <ChoreHistoryModal person={mockPerson} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    // Should only show p1's chores
    expect(screen.getByText('Clean room')).toBeInTheDocument();
    expect(screen.getByText('Do dishes')).toBeInTheDocument();
    expect(screen.queryByText('Other chore')).not.toBeInTheDocument();
  });
});
