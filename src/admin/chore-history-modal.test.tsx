import { render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyCompletion, FamilyChoresData, Person } from '../types/chore-types';
import { ChoreType, SkipDayVisibility } from '../types/chore-types';
import { ChoreHistoryModal } from './chore-history-modal';

describe('ChoreHistoryModal', () => {
  const mockPerson: Person = {
    id: 'p1',
    name: 'Alice',
    color: '#FF6B6B',
  };

  const mockChoreData: FamilyChoresData = {
    people: [mockPerson],
    chores: [
      {
        id: 'c1',
        name: 'Clean room',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        deadline: '18:00',
        caughtUp: true,
        completedToday: false,
      },
      {
        id: 'c2',
        name: 'Do dishes',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        deadline: '18:00',
        caughtUp: true,
        completedToday: false,
      },
    ],
    dailyCompletions: [],
    lastResetDate: '2024-01-01',
    settings: {
      dailyResetTime: '03:00',
      historyEnabled: true,
    },
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

    const { container } = render(() => (
      <ChoreHistoryModal person={mockPerson} choreData={mockChoreData} closeModal={closeModal} />
    ));

    expect(container.querySelector('[data-testid="modal"]')).toBeInTheDocument();
    expect(screen.getByText("Alice's Chore History")).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    const closeModal = vi.fn();

    render(() => (
      <ChoreHistoryModal person={mockPerson} choreData={mockChoreData} closeModal={closeModal} />
    ));

    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    const closeModal = vi.fn();
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch history' }),
      } as Response)
    );

    render(() => (
      <ChoreHistoryModal person={mockPerson} choreData={mockChoreData} closeModal={closeModal} />
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    expect(screen.getByText('Error: Failed to fetch history')).toBeInTheDocument();
  });

  it('renders history table when data loads successfully', async () => {
    const closeModal = vi.fn();
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      } as Response)
    );

    const { container } = render(() => (
      <ChoreHistoryModal person={mockPerson} choreData={mockChoreData} closeModal={closeModal} />
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    expect(container.querySelector('[data-testid="history-table"]')).toBeInTheDocument();
    expect(screen.getByText('Clean room')).toBeInTheDocument();
    expect(screen.getByText('Do dishes')).toBeInTheDocument();
  });

  it('shows completion badges for completed chores', async () => {
    const closeModal = vi.fn();
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      } as Response)
    );

    const { container } = render(() => (
      <ChoreHistoryModal person={mockPerson} choreData={mockChoreData} closeModal={closeModal} />
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    const completionBadges = container.querySelectorAll(
      '[data-testid="completion-ontime"], [data-testid="completion-late"]'
    );
    expect(completionBadges.length).toBeGreaterThan(0);
  });

  it('shows on-time completion in green', async () => {
    const closeModal = vi.fn();
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      } as Response)
    );

    const { container } = render(() => (
      <ChoreHistoryModal person={mockPerson} choreData={mockChoreData} closeModal={closeModal} />
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    const onTimeBadge = container.querySelector('[data-testid="completion-ontime"]');
    expect(onTimeBadge).toBeInTheDocument();
  });

  it('shows late completion in yellow', async () => {
    const closeModal = vi.fn();
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      } as Response)
    );

    const { container } = render(() => (
      <ChoreHistoryModal person={mockPerson} choreData={mockChoreData} closeModal={closeModal} />
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    const lateBadge = container.querySelector('[data-testid="completion-late"]');
    expect(lateBadge).toBeInTheDocument();
  });

  it('calls closeModal when close button is clicked', async () => {
    const closeModal = vi.fn();
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      } as Response)
    );

    const { container } = render(() => (
      <ChoreHistoryModal person={mockPerson} choreData={mockChoreData} closeModal={closeModal} />
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
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      } as Response)
    );

    render(() => (
      <ChoreHistoryModal person={mockPerson} choreData={mockChoreData} closeModal={closeModal} />
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    expect(globalThis.fetch).toHaveBeenCalledWith('/MMM-FamilyChores/history?personId=p1');
  });

  it('shows only personal chores for the person', async () => {
    const closeModal = vi.fn();
    const choreDataWithOtherPerson: FamilyChoresData = {
      ...mockChoreData,
      chores: [
        ...mockChoreData.chores,
        {
          id: 'c3',
          name: 'Other chore',
          type: ChoreType.PERSONAL,
          assignedTo: 'p2', // Different person
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
          deadline: '18:00',
          caughtUp: true,
          completedToday: false,
        },
      ],
    };

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      } as Response)
    );

    render(() => (
      <ChoreHistoryModal
        person={mockPerson}
        choreData={choreDataWithOtherPerson}
        closeModal={closeModal}
      />
    ));

    // Wait for async operations
    await vi.advanceTimersByTimeAsync(100);

    // Should only show p1's chores
    expect(screen.getByText('Clean room')).toBeInTheDocument();
    expect(screen.getByText('Do dishes')).toBeInTheDocument();
    expect(screen.queryByText('Other chore')).not.toBeInTheDocument();
  });
});
