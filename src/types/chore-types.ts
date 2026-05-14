/**
 * Persisted domain model: people, chores, and related enums.
 * Socket notification payloads live in `socket-payload-types.ts`.
 * MagicMirror module config lives in `config.ts`.
 */

export type UUID = string;

export enum SkipDayVisibility {
  HIDE = 'hide', // Never show on skip days
  SHOW_IF_OVERDUE = 'show-if-overdue', // Show only if not caught up
  SHOW_ALWAYS = 'show-always', // Always show, carry over completion state
}

export enum DayOfWeek {
  SUNDAY = 'sunday',
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
}

export interface Person {
  /**
   * UUID v4
   */
  id: UUID;
  name: string;
  color: string;
}

export enum ChoreType {
  PERSONAL = 'personal',
  ROTATING = 'rotating',
}

type ChoreBase = {
  /**
   * UUID v4
   */
  id: UUID;
  name: string;
  /**
   * Time in 24-hour format "08:00", "21:00"
   */
  deadline?: string;
  /**
   * Array of day names to skip
   */
  skipDays: DayOfWeek[];
  /**
   * How to handle display on skip days
   */
  skipDayVisibility: SkipDayVisibility;
  /**
   * true if completed yesterday (false = start day with "overdue" styling)
   */
  caughtUp: boolean;
  /**
   * true if completed today (resets daily)
   */
  completedToday: boolean;
};

export type PersonalChore = ChoreBase & {
  type: ChoreType.PERSONAL;
  assignedTo: UUID;
};

export type RotatingChore = ChoreBase & {
  type: ChoreType.ROTATING;
  /**
   * Array of person UUIDs for rotating chores
   */
  rotation: UUID[];
  /**
   * Current position in rotation (rotating chores only)
   */
  rotatingIndex: number;
};

export type Chore = PersonalChore | RotatingChore;

export interface FamilyChoresData {
  people: Person[];
  chores: Chore[];
  /**
   * ISO date string when daily reset was last performed (YYYY-MM-DD)
   */
  lastResetDate?: string;
}
