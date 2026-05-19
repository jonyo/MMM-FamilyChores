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

// NOTE: Adding or changing fields on Person, Chore, Settings, or DailyCompletion?
// Update the matching validate* function in src/backend/validator.ts and add tests.

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

/**
 * Daily completion record for tracking chore completion status
 */
export interface DailyCompletion {
  /**
   * UUID v4
   */
  id: UUID;
  /**
   * Local date in YYYY-MM-DD format
   */
  date: string;
  /**
   * Person ID who completed (or was assigned) the chore
   */
  personId: UUID;
  /**
   * Chore ID
   */
  choreId: UUID;
  /**
   * Whether the chore was completed on this day
   */
  completed: boolean;
  /**
   * Local time in HH:mm format when the chore was completed (if completed)
   */
  completedAt?: string;
  /**
   * Whether the completion was late (after the deadline)
   */
  wasLate: boolean;
}

/**
 * Global settings that apply across all module instances
 */
export interface Settings {
  /**
   * Format: "HH:mm" in 24-hour format, default "03:00"
   */
  dailyResetTime: string;
  /**
   * Enable/disable history tracking (default: true)
   */
  historyEnabled: boolean;
  /**
   * PIN for protecting admin actions. null or undefined = no PIN required.
   */
  adminPin?: string | null;
}

export interface FamilyChoresData {
  people: Person[];
  chores: Chore[];
  /**
   * Global settings that apply across all module instances
   */
  settings: Settings;
  /**
   * ISO date string when daily reset was last performed (YYYY-MM-DD)
   */
  lastResetDate?: string;
  /**
   * Daily completion records for tracking chore completion status
   */
  dailyCompletions: DailyCompletion[];
}
