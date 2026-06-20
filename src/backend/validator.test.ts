import { describe, expect, it } from 'vitest';
import type { Chore, Person } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  DayOfWeek,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import { generateTestUUID } from '../utils/uuid';
import {
  validateChore,
  validateDailyCompletion,
  validatePerson,
  validateSettings,
} from './validator';

const person = (n: number, overrides: Partial<Person> = {}): Person => ({
  id: generateTestUUID(n),
  name: `Person ${n}`,
  color: '#FF5733',
  ...overrides,
});

const baseChoreFields = (idNum: number) => ({
  id: generateTestUUID(idNum),
  name: 'Chore name',
  skipDays: [] as DayOfWeek[],
  skipDayVisibility: SkipDayVisibility.HIDE,
  beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
  afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
  notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
  caughtUp: true,
  completedToday: false,
});

describe('validatePerson', () => {
  it('rejects non-objects', () => {
    expect(validatePerson(null).valid).toBe(false);
    expect(validatePerson(undefined).valid).toBe(false);
    expect(validatePerson('x').valid).toBe(false);
    expect(validatePerson(1).valid).toBe(false);
    expect(validatePerson([]).valid).toBe(false);
  });

  it('rejects invalid or empty id', () => {
    expect(validatePerson({}).valid).toBe(false);
    expect(validatePerson({ id: '', name: 'A', color: '#fff' }).valid).toBe(false);
    expect(validatePerson({ id: '   ', name: 'A', color: '#fff' }).valid).toBe(false);
    expect(validatePerson({ id: 1, name: 'A', color: '#fff' }).valid).toBe(false);
    expect(validatePerson({ id: 'not-uuid', name: 'A', color: '#fff' }).valid).toBe(false);
  });

  it('rejects invalid name', () => {
    const id = generateTestUUID(1);
    expect(validatePerson({ id, name: '', color: '#fff' }).valid).toBe(false);
    expect(validatePerson({ id, name: '   ', color: '#fff' }).valid).toBe(false);
    expect(validatePerson({ id, color: '#fff' }).valid).toBe(false);
    expect(validatePerson({ id, name: 1, color: '#fff' }).valid).toBe(false);
  });

  it('rejects invalid color', () => {
    const id = generateTestUUID(1);
    expect(validatePerson({ id, name: 'A', color: '' }).valid).toBe(false);
    expect(validatePerson({ id, name: 'A' }).valid).toBe(false);
    expect(validatePerson({ id, name: 'A', color: 1 }).valid).toBe(false);
    expect(validatePerson({ id, name: 'A', color: 'red' }).valid).toBe(false);
    expect(validatePerson({ id, name: 'A', color: '#GGGGGG' }).valid).toBe(false);
    expect(validatePerson({ id, name: 'A', color: '#12345' }).valid).toBe(false);
  });

  it('accepts valid 3- and 6-digit hex colors', () => {
    const id = generateTestUUID(1);
    expect(validatePerson({ id, name: 'A', color: '#abc' }).valid).toBe(true);
    expect(validatePerson({ id, name: 'A', color: '#ABCDEF' }).valid).toBe(true);
    expect(validatePerson({ id, name: 'A', color: '#abcdef' }).valid).toBe(true);
  });
});

describe('validateChore', () => {
  const people: Person[] = [person(1), person(2), person(3)];

  it('rejects non-objects', () => {
    expect(validateChore(null, people).valid).toBe(false);
    expect(validateChore(undefined, people).valid).toBe(false);
  });

  it('rejects invalid id and name', () => {
    expect(
      validateChore(
        { ...baseChoreFields(1), id: '', type: ChoreType.PERSONAL, assignedTo: people[0].id },
        people
      ).valid
    ).toBe(false);
    expect(
      validateChore(
        { ...baseChoreFields(1), id: 'bad', type: ChoreType.PERSONAL, assignedTo: people[0].id },
        people
      ).valid
    ).toBe(false);
    expect(
      validateChore(
        { ...baseChoreFields(1), name: '', type: ChoreType.PERSONAL, assignedTo: people[0].id },
        people
      ).valid
    ).toBe(false);
    expect(
      validateChore(
        { ...baseChoreFields(1), name: '  ', type: ChoreType.PERSONAL, assignedTo: people[0].id },
        people
      ).valid
    ).toBe(false);
  });

  it('rejects invalid type', () => {
    const c = { ...baseChoreFields(1), type: 'other', assignedTo: people[0].id };
    expect(validateChore(c, people).valid).toBe(false);
    expect(validateChore({ ...baseChoreFields(1), assignedTo: people[0].id }, people).valid).toBe(
      false
    );
  });

  it('rejects invalid deadline when present', () => {
    const personal = {
      ...baseChoreFields(1),
      type: ChoreType.PERSONAL,
      assignedTo: people[0].id,
      deadline: 1,
    };
    expect(validateChore(personal, people).valid).toBe(false);
    expect(validateChore({ ...personal, deadline: '25:00' }, people).valid).toBe(false);
    expect(validateChore({ ...personal, deadline: '8:0' }, people).valid).toBe(false);
    expect(validateChore({ ...personal, deadline: '08:60' }, people).valid).toBe(false);
  });

  it('accepts valid deadline strings', () => {
    const personal = {
      ...baseChoreFields(1),
      type: ChoreType.PERSONAL,
      assignedTo: people[0].id,
      deadline: '8:00',
    };
    expect(validateChore(personal, people).valid).toBe(true);
    expect(validateChore({ ...personal, deadline: '21:00' }, people).valid).toBe(true);
  });

  it('rejects invalid startTime when present', () => {
    const personal = {
      ...baseChoreFields(1),
      type: ChoreType.PERSONAL,
      assignedTo: people[0].id,
      startTime: 1,
    };
    expect(validateChore(personal, people).valid).toBe(false);
    expect(validateChore({ ...personal, startTime: '25:00' }, people).valid).toBe(false);
    expect(validateChore({ ...personal, startTime: '8:0' }, people).valid).toBe(false);
  });

  it('accepts valid startTime strings', () => {
    const personal = {
      ...baseChoreFields(1),
      type: ChoreType.PERSONAL,
      assignedTo: people[0].id,
      startTime: '8:00',
    };
    expect(validateChore(personal, people).valid).toBe(true);
    expect(validateChore({ ...personal, startTime: '21:00' }, people).valid).toBe(true);
  });

  it('rejects startTime that is not before deadline', () => {
    const personal = {
      ...baseChoreFields(1),
      type: ChoreType.PERSONAL,
      assignedTo: people[0].id,
      startTime: '12:00',
      deadline: '12:00',
    };
    expect(validateChore(personal, people).valid).toBe(false);
    expect(validateChore({ ...personal, startTime: '13:00' }, people).valid).toBe(false);
    expect(validateChore({ ...personal, startTime: '11:00' }, people).valid).toBe(true);
  });

  it('rejects invalid skipDays', () => {
    const personal = {
      ...baseChoreFields(1),
      type: ChoreType.PERSONAL,
      assignedTo: people[0].id,
    };
    expect(validateChore({ ...personal, skipDays: undefined }, people).valid).toBe(false);
    expect(validateChore({ ...personal, skipDays: 'monday' }, people).valid).toBe(false);
    expect(validateChore({ ...personal, skipDays: ['Funday'] }, people).valid).toBe(false);
    expect(validateChore({ ...personal, skipDays: [DayOfWeek.MONDAY, 1] }, people).valid).toBe(
      false
    );
  });

  it('rejects invalid skipDayVisibility and booleans', () => {
    const personal = {
      ...baseChoreFields(1),
      type: ChoreType.PERSONAL,
      assignedTo: people[0].id,
    };
    expect(validateChore({ ...personal, skipDayVisibility: 'nope' }, people).valid).toBe(false);
    expect(validateChore({ ...personal, skipDayVisibility: undefined }, people).valid).toBe(false);
    expect(validateChore({ ...personal, caughtUp: 'yes' }, people).valid).toBe(false);
    expect(validateChore({ ...personal, completedToday: 0 }, people).valid).toBe(false);
  });

  it('rejects missing or invalid display option fields', () => {
    const personal = {
      ...baseChoreFields(1),
      type: ChoreType.PERSONAL,
      assignedTo: people[0].id,
    };
    expect(validateChore({ ...personal, beforeStartTimeVisibility: undefined }, people).valid).toBe(
      false
    );
    expect(validateChore({ ...personal, beforeStartTimeVisibility: 'nope' }, people).valid).toBe(
      false
    );
    expect(validateChore({ ...personal, afterDeadlineVisibility: undefined }, people).valid).toBe(
      false
    );
    expect(validateChore({ ...personal, afterDeadlineVisibility: 'nope' }, people).valid).toBe(
      false
    );
    expect(validateChore({ ...personal, notCaughtUpDisplay: undefined }, people).valid).toBe(false);
    expect(validateChore({ ...personal, notCaughtUpDisplay: 'nope' }, people).valid).toBe(false);
  });

  describe('personal chores', () => {
    it('rejects assignedTo issues', () => {
      const base = { ...baseChoreFields(1), type: ChoreType.PERSONAL, assignedTo: people[0].id };
      expect(validateChore({ ...base, assignedTo: undefined }, people).valid).toBe(false);
      expect(validateChore({ ...base, assignedTo: generateTestUUID(99) }, people).valid).toBe(
        false
      );
    });

    it('rejects rotating-only fields on personal chore', () => {
      const base = { ...baseChoreFields(1), type: ChoreType.PERSONAL, assignedTo: people[0].id };
      expect(validateChore({ ...base, rotation: [people[0].id] }, people).valid).toBe(false);
      expect(validateChore({ ...base, rotatingIndex: 0 }, people).valid).toBe(false);
    });

    it('accepts minimal valid personal chore', () => {
      expect(
        validateChore(
          { ...baseChoreFields(1), type: ChoreType.PERSONAL, assignedTo: people[1].id },
          people
        ).valid
      ).toBe(true);
    });
  });

  describe('rotating chores', () => {
    it('rejects personal fields on rotating chore', () => {
      const rotating = {
        ...baseChoreFields(1),
        type: ChoreType.ROTATING,
        rotation: [people[0].id, people[1].id],
        rotatingIndex: 0,
      };
      expect(validateChore({ ...rotating, assignedTo: people[0].id }, people).valid).toBe(false);
    });

    it('rejects wrong type and rotation issues', () => {
      const base = {
        ...baseChoreFields(1),
        type: ChoreType.ROTATING,
        rotation: [people[0].id, people[1].id],
        rotatingIndex: 0,
      };
      expect(validateChore({ ...base, rotation: undefined }, people).valid).toBe(false);
      expect(validateChore({ ...base, rotation: [''] }, people).valid).toBe(false);
      expect(validateChore({ ...base, rotation: [generateTestUUID(88)] }, people).valid).toBe(
        false
      );
      expect(validateChore({ ...base, rotation: [1, people[0].id] }, people).valid).toBe(false);
    });

    it('rejects rotatingIndex out of range or wrong type', () => {
      const base = {
        ...baseChoreFields(1),
        type: ChoreType.ROTATING,
        rotation: [people[0].id, people[1].id],
      };
      expect(validateChore({ ...base, rotatingIndex: -1 }, people).valid).toBe(false);
      expect(validateChore({ ...base, rotatingIndex: 2 }, people).valid).toBe(false);
      expect(validateChore({ ...base, rotatingIndex: '0' }, people).valid).toBe(false);
      expect(validateChore({ ...base, rotatingIndex: undefined }, people).valid).toBe(false);
    });

    it('accepts valid rotating chore including last index', () => {
      expect(
        validateChore(
          {
            ...baseChoreFields(1),
            type: ChoreType.ROTATING,
            rotation: [people[0].id, people[1].id],
            rotatingIndex: 1,
          },
          people
        ).valid
      ).toBe(true);
    });
  });
});

describe('validateSettings', () => {
  it('rejects non-objects', () => {
    expect(validateSettings(null).valid).toBe(false);
    expect(validateSettings(undefined).valid).toBe(false);
    expect(validateSettings('x').valid).toBe(false);
    expect(validateSettings(1).valid).toBe(false);
  });

  it('rejects missing or invalid historyEnabled', () => {
    expect(validateSettings({}).valid).toBe(false);
    expect(validateSettings({ historyEnabled: 'yes' }).valid).toBe(false);
    expect(validateSettings({ historyEnabled: 1 }).valid).toBe(false);
  });

  it('accepts valid settings', () => {
    expect(validateSettings({ historyEnabled: true }).valid).toBe(true);
    expect(validateSettings({ historyEnabled: false }).valid).toBe(true);
  });

  it('accepts valid adminPin values', () => {
    const base = { historyEnabled: true };
    expect(validateSettings({ ...base, adminPin: undefined }).valid).toBe(true);
    expect(validateSettings({ ...base, adminPin: null }).valid).toBe(true);
    expect(validateSettings({ ...base, adminPin: '1234' }).valid).toBe(true);
    expect(validateSettings({ ...base, adminPin: 'my-secret-pin' }).valid).toBe(true);
    expect(validateSettings({ ...base, adminPin: '' }).valid).toBe(true);
  });

  it('rejects invalid adminPin types', () => {
    const base = { historyEnabled: true };
    expect(validateSettings({ ...base, adminPin: 1234 }).valid).toBe(false);
    expect(validateSettings({ ...base, adminPin: true }).valid).toBe(false);
    expect(validateSettings({ ...base, adminPin: {} }).valid).toBe(false);
  });
});

describe('validateDailyCompletion', () => {
  const people: Person[] = [person(1), person(2)];
  const chores: Chore[] = [
    {
      ...baseChoreFields(1),
      type: ChoreType.PERSONAL,
      assignedTo: people[0].id,
    },
    {
      ...baseChoreFields(2),
      type: ChoreType.ROTATING,
      rotation: [people[0].id, people[1].id],
      rotatingIndex: 0,
    },
  ];

  it('rejects non-objects', () => {
    expect(validateDailyCompletion(null, chores).valid).toBe(false);
    expect(validateDailyCompletion(undefined, chores).valid).toBe(false);
    expect(validateDailyCompletion('x', chores).valid).toBe(false);
  });

  it('rejects invalid id', () => {
    expect(validateDailyCompletion({}, chores).valid).toBe(false);
    expect(validateDailyCompletion({ id: '' }, chores).valid).toBe(false);
    expect(validateDailyCompletion({ id: 'not-uuid' }, chores).valid).toBe(false);
  });

  it('rejects invalid date', () => {
    const base = {
      id: generateTestUUID(1),
      date: '2024-01-15',
      personId: people[0].id,
      choreId: chores[0].id,
      completed: true,
      wasLate: false,
    };
    expect(validateDailyCompletion({ ...base, date: '' }, chores).valid).toBe(false);
    expect(validateDailyCompletion({ ...base, date: '01/15/2024' }, chores).valid).toBe(false);
    expect(validateDailyCompletion({ ...base, date: '2024-1-15' }, chores).valid).toBe(false);
  });

  it('rejects invalid personId', () => {
    const base = {
      id: generateTestUUID(1),
      date: '2024-01-15',
      personId: people[0].id,
      choreId: chores[0].id,
      completed: true,
      wasLate: false,
    };
    expect(validateDailyCompletion({ ...base, personId: '' }, chores).valid).toBe(false);
    expect(validateDailyCompletion({ ...base, personId: 'not-uuid' }, chores).valid).toBe(false);
  });

  it('rejects invalid choreId', () => {
    const base = {
      id: generateTestUUID(1),
      date: '2024-01-15',
      personId: people[0].id,
      choreId: chores[0].id,
      completed: true,
      wasLate: false,
    };
    expect(validateDailyCompletion({ ...base, choreId: '' }, chores).valid).toBe(false);
    expect(validateDailyCompletion({ ...base, choreId: 'not-uuid' }, chores).valid).toBe(false);
    expect(validateDailyCompletion({ ...base, choreId: generateTestUUID(99) }, chores).valid).toBe(
      false
    );
  });

  it('rejects invalid completed or wasLate', () => {
    const base = {
      id: generateTestUUID(1),
      date: '2024-01-15',
      personId: people[0].id,
      choreId: chores[0].id,
      completed: true,
      wasLate: false,
    };
    expect(validateDailyCompletion({ ...base, completed: 'yes' }, chores).valid).toBe(false);
    expect(validateDailyCompletion({ ...base, completed: 1 }, chores).valid).toBe(false);
    expect(validateDailyCompletion({ ...base, wasLate: 'no' }, chores).valid).toBe(false);
    expect(validateDailyCompletion({ ...base, wasLate: 0 }, chores).valid).toBe(false);
  });

  it('rejects invalid completedAt when present', () => {
    const base = {
      id: generateTestUUID(1),
      date: '2024-01-15',
      personId: people[0].id,
      choreId: chores[0].id,
      completed: true,
      completedAt: '12:00',
      wasLate: false,
    };
    expect(validateDailyCompletion({ ...base, completedAt: 1 }, chores).valid).toBe(false);
    expect(validateDailyCompletion({ ...base, completedAt: '25:00' }, chores).valid).toBe(false);
    expect(validateDailyCompletion({ ...base, completedAt: '8:0' }, chores).valid).toBe(false);
  });

  it('accepts valid daily completion', () => {
    const valid = {
      id: generateTestUUID(1),
      date: '2024-01-15',
      personId: people[0].id,
      choreId: chores[0].id,
      completed: true,
      completedAt: '12:00',
      wasLate: false,
    };
    expect(validateDailyCompletion(valid, chores).valid).toBe(true);
    expect(validateDailyCompletion({ ...valid, completedAt: undefined }, chores).valid).toBe(true);
  });
});
