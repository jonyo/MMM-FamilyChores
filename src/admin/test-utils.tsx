import type { Accessor, Component } from 'solid-js';
import { createSignal } from 'solid-js';
import type { FamilyChoresData, Person, PersonalChore, RotatingChore } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  DayOfWeek,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import AdminContext, { type AdminContextValue } from './admin-context';

// Mock data for testing
export const mockPerson: Person = {
  id: 'person-1',
  name: 'Test Person',
  color: '#ff0000',
};

export const mockPerson2: Person = {
  id: 'person-2',
  name: 'Test Person 2',
  color: '#00ff00',
};

export const mockPersonalChore: PersonalChore = {
  id: 'chore-1',
  name: 'Test Chore',
  type: ChoreType.PERSONAL,
  assignedTo: 'person-1',
  deadline: '08:00',
  skipDays: [],
  skipDayVisibility: SkipDayVisibility.HIDE,
  beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
  afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
  notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
  caughtUp: true,
  completedToday: false,
};

export const mockRotatingChore: RotatingChore = {
  id: 'chore-2',
  name: 'Test Rotating Chore',
  type: ChoreType.ROTATING,
  rotation: ['person-1', 'person-2'],
  rotatingIndex: 0,
  deadline: '09:00',
  skipDays: [DayOfWeek.SUNDAY],
  skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
  beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
  afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
  notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
  caughtUp: true,
  completedToday: false,
};

export const mockChoreData: FamilyChoresData = {
  people: [mockPerson, mockPerson2],
  chores: [mockPersonalChore, mockRotatingChore],
  settings: {
    historyEnabled: true,
  },
  lastResetDate: '2026-01-01',
  dailyCompletions: [],
};

// Mock admin context value
export const createMockAdminContextValue = (
  choreDataOverride?: Accessor<Partial<FamilyChoresData> | undefined>,
  pinRequiredValue?: Accessor<boolean>,
  initialCachedPin?: Accessor<string>,
  loadDataMock?: Accessor<(() => Promise<void>) | undefined>
): AdminContextValue => {
  const [cachedPin, setCachedPin] = createSignal(initialCachedPin?.() ?? '');
  const choreData: Accessor<FamilyChoresData> = () => ({
    ...mockChoreData,
    ...choreDataOverride?.(),
  });
  const mockFn = loadDataMock?.();
  const resolvedLoadData = mockFn ?? (async () => {});

  return {
    choreData,
    loadData: resolvedLoadData,
    pinRequired: () => pinRequiredValue?.() ?? false,
    setCachedPin: (pin) => setCachedPin(pin),
    cachedPin,
  };
};

// Mock admin provider component
export const MockAdminProvider: Component<{
  children?: unknown;
  choreDataOverride?: Partial<FamilyChoresData>;
  pinRequired?: boolean;
  initialCachedPin?: string;
  loadDataMock?: () => Promise<void>;
}> = (props) => {
  const contextValue = createMockAdminContextValue(
    () => props.choreDataOverride,
    () => props.pinRequired ?? false,
    () => props.initialCachedPin ?? '',
    () => props.loadDataMock
  );

  return (
    <AdminContext.Provider value={contextValue}>{props.children as never}</AdminContext.Provider>
  );
};
