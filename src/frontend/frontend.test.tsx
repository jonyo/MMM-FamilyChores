import { render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import type { Chore, DayOfWeek, FamilyChoresData, Person } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  NotCaughtUpDisplay,
  SkipDayVisibility,
  TimeFormat,
} from '../types/chore-types';
import type { Config } from '../types/config';
import { App } from './app';
import { ChoreItem } from './chore-item';
import { IncompleteByPerson } from './incomplete-by-person';
import { OverdueByPerson } from './overdue-by-person';
import { PersonalView } from './personal-view';
import { RotatingChoreInline } from './rotating-chore-inline';
import { SummaryView } from './summary-view';

const mockTodaysDayOfWeek = () => 'monday' as DayOfWeek;
const mockCurrentTime = () => '10:00';

const mockPeople: Person[] = [
  { id: 'p1', name: 'Alice', color: '#FF6B6B' },
  { id: 'p2', name: 'Bob', color: '#4ECDC4' },
];

const mockPersonalChore: Chore = {
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

const mockRotatingChore: Chore = {
  id: 'c2',
  name: 'Clean kitchen',
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

const mockChoreData: FamilyChoresData = {
  people: mockPeople,
  chores: [mockPersonalChore, mockRotatingChore],
  lastResetDate: '2024-01-01',
  dailyCompletions: [],
  settings: { historyEnabled: true, timeFormat: TimeFormat.HOUR_24 },
};

describe('Frontend Component Tests', () => {
  describe('ChoreItem', () => {
    it('should render personal chore with assigned person', async () => {
      const onToggle = vi.fn();
      render(() => (
        <ChoreItem
          chore={mockPersonalChore}
          people={mockPeople}
          currentTime={mockCurrentTime()}
          timeFormat={TimeFormat.HOUR_24}
          onToggle={onToggle}
        />
      ));

      await expect.element(page.getByTestId('chore-item')).toBeVisible();
      await expect.element(page.getByText('Take out trash')).toBeVisible();
      await expect.element(page.getByText('Alice')).toBeVisible();
    });

    it('should render rotating chore with current rotation person', async () => {
      const onToggle = vi.fn();
      render(() => (
        <ChoreItem
          chore={mockRotatingChore}
          people={mockPeople}
          currentTime={mockCurrentTime()}
          timeFormat={TimeFormat.HOUR_24}
          onToggle={onToggle}
        />
      ));

      await expect.element(page.getByText('Clean kitchen')).toBeVisible();
      await expect.element(page.getByText('Alice')).toBeVisible();
    });

    it('should call onToggle when checkbox is changed', async () => {
      const onToggle = vi.fn();
      render(() => (
        <ChoreItem
          chore={mockPersonalChore}
          people={mockPeople}
          currentTime={mockCurrentTime()}
          timeFormat={TimeFormat.HOUR_24}
          onToggle={onToggle}
        />
      ));

      const checkbox = page.getByTestId('chore-checkbox');
      await expect.element(checkbox).toBeVisible();
      await checkbox.click();

      expect(onToggle).toHaveBeenCalledWith('c1', true);
    });
  });

  describe('RotatingChoreInline', () => {
    it('should render rotating chore inline', async () => {
      const onToggle = vi.fn();
      render(() => (
        <RotatingChoreInline chore={mockRotatingChore} people={mockPeople} onToggle={onToggle} />
      ));

      await expect.element(page.getByTestId('rotating-inline')).toBeVisible();
      await expect.element(page.getByText('Clean kitchen')).toBeVisible();
      await expect.element(page.getByText('Alice')).toBeVisible();
    });

    it('should call onToggle when inline checkbox is changed', async () => {
      const onToggle = vi.fn();
      render(() => (
        <RotatingChoreInline chore={mockRotatingChore} people={mockPeople} onToggle={onToggle} />
      ));

      const checkbox = page.getByTestId('rotating-checkbox');
      await expect.element(checkbox).toBeVisible();
      await checkbox.click();

      expect(onToggle).toHaveBeenCalledWith('c2', true);
    });
  });

  describe('PersonalView', () => {
    it('should render chores list', async () => {
      const [choreData] = createSignal<FamilyChoresData>(mockChoreData);
      render(() => (
        <PersonalView
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={{ viewMode: 'personal', personFilter: null } as Config}
          onToggle={vi.fn()}
        />
      ));

      await expect.element(page.getByText('Take out trash')).toBeVisible();
      await expect.element(page.getByText('Clean kitchen')).toBeVisible();
    });

    it('should show chore that was hidden on a skip day once the day changes', async () => {
      const skipDayChore: Chore = {
        ...mockPersonalChore,
        id: 'c-skip',
        name: 'Skip day chore',
        skipDays: ['monday' as DayOfWeek],
        skipDayVisibility: SkipDayVisibility.HIDE,
      };
      const [choreData] = createSignal<FamilyChoresData>({
        ...mockChoreData,
        chores: [skipDayChore],
      });
      const [todaysDayOfWeek, setTodaysDayOfWeek] = createSignal<DayOfWeek>('monday' as DayOfWeek);
      render(() => (
        <PersonalView
          choreData={choreData}
          todaysDayOfWeek={todaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={{ viewMode: 'personal', personFilter: null } as Config}
          onToggle={vi.fn()}
        />
      ));

      expect(page.getByText('Skip day chore').elements().length).toBe(0);

      setTodaysDayOfWeek('tuesday' as DayOfWeek);

      await expect.element(page.getByText('Skip day chore')).toBeVisible();
    });

    it('should show chore that was hidden by start time once the time passes', async () => {
      const startTimeChore: Chore = {
        ...mockPersonalChore,
        id: 'c-start-time',
        name: 'Start time chore',
        startTime: '12:00',
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
      };
      const [choreData] = createSignal<FamilyChoresData>({
        ...mockChoreData,
        chores: [startTimeChore],
      });
      const [currentTime, setCurrentTime] = createSignal('10:00');
      render(() => (
        <PersonalView
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={currentTime}
          config={{ viewMode: 'personal', personFilter: null } as Config}
          onToggle={vi.fn()}
        />
      ));

      expect(page.getByText('Start time chore').elements().length).toBe(0);
      await expect.element(page.getByTestId('later-chores-indicator')).toBeVisible();

      setCurrentTime('12:00');

      await expect.element(page.getByText('Start time chore')).toBeVisible();
      expect(page.getByTestId('later-chores-indicator').elements().length).toBe(0);
    });

    it('should show empty state when no chores match', async () => {
      const [choreData] = createSignal<FamilyChoresData>({
        ...mockChoreData,
        chores: [],
      });
      render(() => (
        <PersonalView
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={{ viewMode: 'personal', personFilter: null } as Config}
          onToggle={vi.fn()}
        />
      ));

      await expect.element(page.getByText('No chores match the current filter.')).toBeVisible();
    });

    it('should show a hidden later-chores indicator when start time has not been reached', async () => {
      const laterChore: Chore = {
        ...mockPersonalChore,
        id: 'c-later',
        name: 'Later chore',
        startTime: '12:00',
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
      };
      const [choreData] = createSignal<FamilyChoresData>({
        ...mockChoreData,
        chores: [laterChore],
      });
      render(() => (
        <PersonalView
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={{ viewMode: 'personal', personFilter: null } as Config}
          onToggle={vi.fn()}
        />
      ));

      await expect.element(page.getByTestId('later-chores-indicator')).toBeVisible();
      await expect.element(page.getByText('1 more chore starts later')).toBeVisible();
      expect(page.getByText('No chores match the current filter.').elements().length).toBe(0);
    });

    it('should not show the hidden later-chores indicator when the start time has passed', async () => {
      const laterChore: Chore = {
        ...mockPersonalChore,
        id: 'c-later',
        name: 'Later chore',
        startTime: '09:00',
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
      };
      const [choreData] = createSignal<FamilyChoresData>({
        ...mockChoreData,
        chores: [laterChore],
      });
      render(() => (
        <PersonalView
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={{ viewMode: 'personal', personFilter: null } as Config}
          onToggle={vi.fn()}
        />
      ));

      expect(page.getByTestId('later-chores-indicator').elements().length).toBe(0);
      await expect.element(page.getByText('Later chore')).toBeVisible();
    });

    describe('earlier section debounce', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('does not move an already-frozen chore early when a second chore is toggled', async () => {
        const deadlineChoreOne: Chore = {
          ...mockPersonalChore,
          id: 'c-deadline-1',
          name: 'Deadline chore one',
          deadline: '09:00',
          afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
        };
        const deadlineChoreTwo: Chore = {
          ...mockPersonalChore,
          id: 'c-deadline-2',
          name: 'Deadline chore two',
          deadline: '09:00',
          afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
        };
        const [choreData, setChoreData] = createSignal<FamilyChoresData>({
          ...mockChoreData,
          chores: [deadlineChoreOne, deadlineChoreTwo],
        });

        render(() => (
          <PersonalView
            choreData={choreData}
            todaysDayOfWeek={mockTodaysDayOfWeek}
            currentTime={mockCurrentTime}
            config={{ viewMode: 'personal', personFilter: null } as Config}
            onToggle={(choreId, completed) => {
              setChoreData((prev) => ({
                ...prev,
                chores: prev.chores.map((chore) =>
                  chore.id === choreId ? { ...chore, completedToday: completed } : chore
                ),
              }));
            }}
          />
        ));

        await expect.element(page.getByText('Deadline chore one')).toBeVisible();
        await expect.element(page.getByText('Deadline chore two')).toBeVisible();

        const checkboxes = page.getByTestId('chore-checkbox');
        await checkboxes.nth(0).click();

        // Simulate the first toggle's data already having round-tripped from
        // the backend before the second toggle happens, and let some time
        // pass, but not enough to clear the freeze.
        await vi.advanceTimersByTimeAsync(2000);
        await checkboxes.nth(1).click();

        // Chore one must still be in the main list; it should not jump to the
        // earlier section just because chore two was toggled.
        expect(page.getByText('Earlier chores').elements().length).toBe(0);
        await expect.element(page.getByText('Deadline chore one')).toBeVisible();
        await expect.element(page.getByText('Deadline chore two')).toBeVisible();

        // Once the full debounce window has elapsed, both completed chores
        // move to the earlier section together.
        await vi.advanceTimersByTimeAsync(5000);
        await expect.element(page.getByText('Earlier chores')).toBeVisible();
      });
    });
  });

  describe('IncompleteByPerson', () => {
    it('should group incomplete chores by person with counts', async () => {
      render(() => (
        <IncompleteByPerson incompleteChores={[mockPersonalChore]} people={mockPeople} />
      ));

      await expect.element(page.getByText('Alice')).toBeVisible();
      await expect.element(page.getByText('1')).toBeVisible();
    });

    it('should show celebration emoji when no incomplete chores for a person', async () => {
      render(() => <IncompleteByPerson incompleteChores={[]} people={mockPeople} />);

      expect(page.getByText('🎉').elements().length).toBe(2);
    });

    it('should show a per-person later count when hidden later-start chores exist', async () => {
      const laterChore: Chore = {
        ...mockPersonalChore,
        id: 'c-later',
        name: 'Later chore',
        startTime: '12:00',
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
      };
      render(() => (
        <IncompleteByPerson
          incompleteChores={[mockPersonalChore]}
          people={mockPeople}
          hiddenLaterChores={[laterChore]}
        />
      ));

      await expect.element(page.getByTestId('later-count-note')).toBeVisible();
      await expect.element(page.getByText('+1 later')).toBeVisible();
    });
  });

  describe('OverdueByPerson', () => {
    it('should group overdue chores by person', async () => {
      const overdueChore: Chore = {
        ...mockPersonalChore,
        caughtUp: false,
        completedToday: false,
      };

      render(() => <OverdueByPerson overdueChores={[overdueChore]} people={mockPeople} />);

      await expect.element(page.getByText('Alice')).toBeVisible();
      await expect.element(page.getByTestId('overdue-chore-item')).toBeVisible();
    });
  });

  describe('SummaryView', () => {
    it('should render incomplete section', async () => {
      const [choreData] = createSignal<FamilyChoresData>(mockChoreData);
      render(() => (
        <SummaryView
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={
            {
              viewMode: 'summary',
              personFilter: null,
              summary: {
                showIncomplete: true,
                showRotating: false,
                showOverdue: false,
                incompleteTitle: 'Incomplete',
                rotatingTitle: 'Rotating',
                overdueTitle: 'Overdue',
              },
            } as Config
          }
          onToggle={vi.fn()}
        />
      ));

      await expect.element(page.getByText('Incomplete')).toBeVisible();
      await expect.element(page.getByText('Alice')).toBeVisible();
    });

    it('should render rotating section', async () => {
      const [choreData] = createSignal<FamilyChoresData>(mockChoreData);
      render(() => (
        <SummaryView
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={
            {
              viewMode: 'summary',
              personFilter: null,
              summary: {
                showIncomplete: false,
                showRotating: true,
                showOverdue: false,
                incompleteTitle: 'Incomplete',
                rotatingTitle: 'Rotating',
                overdueTitle: 'Overdue',
              },
            } as Config
          }
          onToggle={vi.fn()}
        />
      ));

      await expect.element(page.getByText('Rotating')).toBeVisible();
      await expect.element(page.getByText('Clean kitchen')).toBeVisible();
    });

    it('should show chore in summary that was hidden on a skip day once the day changes', async () => {
      const skipDayChore: Chore = {
        ...mockPersonalChore,
        id: 'c-skip-summary',
        name: 'Summary skip day chore',
        skipDays: ['monday' as DayOfWeek],
        skipDayVisibility: SkipDayVisibility.HIDE,
        completedToday: false,
      };
      const [choreData] = createSignal<FamilyChoresData>({
        ...mockChoreData,
        chores: [skipDayChore],
      });
      const [todaysDayOfWeek, setTodaysDayOfWeek] = createSignal<DayOfWeek>('monday' as DayOfWeek);
      render(() => (
        <SummaryView
          choreData={choreData}
          todaysDayOfWeek={todaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={
            {
              viewMode: 'summary',
              personFilter: null,
              summary: {
                showIncomplete: true,
                showRotating: false,
                showOverdue: false,
                incompleteTitle: 'Incomplete',
                rotatingTitle: 'Rotating',
                overdueTitle: 'Overdue',
              },
            } as Config
          }
          onToggle={vi.fn()}
        />
      ));

      expect(page.getByText('Incomplete').elements().length).toBe(0);

      setTodaysDayOfWeek('tuesday' as DayOfWeek);

      await expect.element(page.getByText('Incomplete')).toBeVisible();
    });

    it('should show chore in summary that was hidden by start time once the time passes', async () => {
      const startTimeChore: Chore = {
        ...mockPersonalChore,
        id: 'c-start-time-summary',
        name: 'Summary start time chore',
        startTime: '12:00',
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        completedToday: false,
      };
      const [choreData] = createSignal<FamilyChoresData>({
        ...mockChoreData,
        chores: [startTimeChore],
      });
      const [currentTime, setCurrentTime] = createSignal('10:00');
      render(() => (
        <SummaryView
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={currentTime}
          config={
            {
              viewMode: 'summary',
              personFilter: null,
              summary: {
                showIncomplete: true,
                showRotating: false,
                showOverdue: false,
                incompleteTitle: 'Incomplete',
                rotatingTitle: 'Rotating',
                overdueTitle: 'Overdue',
              },
            } as Config
          }
          onToggle={vi.fn()}
        />
      ));

      expect(page.getByText('Incomplete').elements().length).toBe(0);

      setCurrentTime('12:00');

      await expect.element(page.getByText('Incomplete')).toBeVisible();
    });

    it('should show a hidden later-chores note in the incomplete section', async () => {
      const laterChore: Chore = {
        ...mockPersonalChore,
        id: 'c-later-summary',
        name: 'Later summary chore',
        startTime: '12:00',
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
      };
      const [choreData] = createSignal<FamilyChoresData>({
        ...mockChoreData,
        chores: [mockPersonalChore, laterChore],
      });
      render(() => (
        <SummaryView
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={
            {
              viewMode: 'summary',
              personFilter: null,
              summary: {
                showIncomplete: true,
                showRotating: false,
                showOverdue: false,
                incompleteTitle: 'Incomplete',
                rotatingTitle: 'Rotating',
                overdueTitle: 'Overdue',
              },
            } as Config
          }
          onToggle={vi.fn()}
        />
      ));

      await expect.element(page.getByTestId('later-count-note')).toBeVisible();
      await expect.element(page.getByText('+1 later')).toBeVisible();
    });

    it('should not render sections when disabled', async () => {
      const [choreData] = createSignal<FamilyChoresData>(mockChoreData);
      render(() => (
        <SummaryView
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={
            {
              viewMode: 'summary',
              personFilter: null,
              summary: {
                showIncomplete: false,
                showRotating: false,
                showOverdue: false,
                incompleteTitle: 'Incomplete',
                rotatingTitle: 'Rotating',
                overdueTitle: 'Overdue',
              },
            } as Config
          }
          onToggle={vi.fn()}
        />
      ));

      expect(page.getByText('Incomplete').elements().length).toBe(0);
      expect(page.getByText('Rotating').elements().length).toBe(0);
      expect(page.getByText('Overdue').elements().length).toBe(0);
    });
  });

  describe('App', () => {
    it('should show loading state when choreData is null', async () => {
      const [choreData] = createSignal<FamilyChoresData | null>(null);
      render(() => (
        <App
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={{ viewMode: 'personal', personFilter: null } as Config}
          onToggle={vi.fn()}
        />
      ));

      await expect.element(page.getByText('Loading...')).toBeVisible();
    });

    it('should render personal view', async () => {
      const [choreData] = createSignal<FamilyChoresData | null>(mockChoreData);
      render(() => (
        <App
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={{ viewMode: 'personal', personFilter: null } as Config}
          onToggle={vi.fn()}
        />
      ));

      await expect.element(page.getByText('Take out trash')).toBeVisible();
      await expect.element(page.getByText('Clean kitchen')).toBeVisible();
    });

    it('should render summary view', async () => {
      const [choreData] = createSignal<FamilyChoresData | null>(mockChoreData);
      render(() => (
        <App
          choreData={choreData}
          todaysDayOfWeek={mockTodaysDayOfWeek}
          currentTime={mockCurrentTime}
          config={
            {
              viewMode: 'summary',
              personFilter: null,
              summary: {
                showIncomplete: true,
                showRotating: true,
                showOverdue: true,
                incompleteTitle: 'Incomplete',
                rotatingTitle: 'Rotating',
                overdueTitle: 'Overdue',
              },
            } as Config
          }
          onToggle={vi.fn()}
        />
      ));

      await expect.element(page.getByText('Incomplete')).toBeVisible();
      await expect.element(page.getByText('Rotating')).toBeVisible();
    });
  });

  describe('Module Glue', () => {
    it('should register module with MagicMirror', async () => {
      const registerSpy = vi.fn();
      vi.stubGlobal('Module', { register: registerSpy });
      vi.stubGlobal('Log', {
        info: vi.fn(),
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      });

      // Import the module to trigger registration
      await import('./frontend');

      expect(registerSpy).toHaveBeenCalledWith('MMM-FamilyChores', expect.any(Object));
    });
  });
});
