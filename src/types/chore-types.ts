// Data structures from our development plan

// UUID v4 type alias
export type UUID = string;

export enum SkipDayVisibility {
  HIDE = 'hide', // Never show on skip days
  SHOW_IF_OVERDUE = 'show-if-overdue', // Show only if not caught up
  SHOW_ALWAYS = 'show-always', // Always show, carry over completion state
}

export interface Person {
  /**
   * UUID v4
   */
  id: UUID;
  name: string;
  color: string;
}

export interface Chore {
  /**
   * UUID v4
   */
  id: UUID;
  name: string;
  type: 'personal' | 'rotating';
  /**
   * UUID for personal chores
   */
  assignedTo?: UUID;
  /**
   * Array of person UUIDs for rotating chores
   */
  rotation?: UUID[];
  /**
   * Time in 24-hour format "08:00", "21:00"
   */
  deadline?: string;
  /**
   * Array of day names to skip
   */
  skipDays?: string[];
  /**
   * How to handle display on skip days
   */
  skipDayVisibility?: SkipDayVisibility;

  /**
   * Current position in rotation (rotating chores only)
   */
  rotatingIndex?: number;
  /**
   * true if completed yesterday (false = start day with "overdue" styling)
   */
  caughtUp?: boolean;
  /**
   * true if completed today (resets daily)
   */
  completedToday?: boolean;
}

export interface FamilyChoresData {
  people: Person[];
  chores: Chore[];
  /**
   * ISO date string when daily reset was last performed (YYYY-MM-DD)
   */
  lastResetDate?: string;
}

// Notification interfaces
export interface ChoreTogglePayload {
  /**
   * ID of the chore to toggle
   */
  choreId: string;
  /**
   * Whether the chore is completed
   */
  completed: boolean;
  /**
   * Optional PIN for admin actions
   */
  pin?: string;
}

export interface ChoreReassignPayload {
  /**
   * ID of the chore to reassign
   */
  choreId: string;
  /**
   * ID of the person to assign the chore to
   */
  newPersonId: string;
  /**
   * Optional PIN for admin actions
   */
  pin?: string;
}

export interface CaughtUpResetPayload {
  /**
   * ID of the person to reset caughtUp status for
   */
  personId: string;
  /**
   * Optional PIN for admin actions
   */
  pin?: string;
}
