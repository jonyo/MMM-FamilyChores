// Data structures from our development plan

export enum SkipDayVisibility {
  HIDE = 'hide', // Never show on skip days
  SHOW_IF_OVERDUE = 'show-if-overdue', // Show only if not caught up
  SHOW_ALWAYS = 'show-always', // Always show, carry over completion state
}

export interface Person {
  id: string; // UUID v4
  name: string;
  color: string;
}

export interface Chore {
  id: string; // UUID v4
  name: string;
  type: 'personal' | 'rotating';
  assignedTo?: string; // UUID for personal chores
  rotation?: string[]; // Array of person UUIDs for rotating chores
  deadline?: string; // Time in 24-hour format "08:00", "21:00"
  skipDays?: string[]; // Array of day names to skip
  skipDayVisibility?: SkipDayVisibility; // How to handle display on skip days

  // State fields (persisted but reset daily)
  rotatingIndex?: number; // Current position in rotation (rotating chores only)
  caughtUp?: boolean; // true if completed yesterday (false = start day with "overdue" styling)
  completedToday?: boolean; // true if completed today (resets daily)
}

export interface FamilyChoresData {
  people: Person[];
  chores: Chore[];
}

// Notification interfaces
export interface ChoreTogglePayload {
  choreId: string;
  completed: boolean;
  pin?: string;
}

export interface ChoreReassignPayload {
  choreId: string;
  newPersonId: string;
  pin?: string;
}

export interface CaughtUpResetPayload {
  personId: string;
  pin?: string;
}
