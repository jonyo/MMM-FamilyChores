import { render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import type { Chore, DayOfWeek, FamilyChoresData, Person } from '../types/chore-types';
import {
  BeforeStartTimeVisibility,
  ChoreType,
  NotCaughtUpDisplay,
  PostDeadlineVisibility,
  SkipDayVisibility,
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
  postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
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
  postDeadlineVisibility: PostDeadlineVisibility.SHOW_OVERDUE,
  notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
  caughtUp: true,
  completedToday: false,
};

const mockChoreData: FamilyChoresData = {
  people: mockPeople,
  chores: [mockPersonalChore, mockRotatingChore],
  lastResetDate: '2024-01-01',
  dailyCompletions: [],
  settings: { historyEnabled: true },
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
