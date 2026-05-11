// Data structures from our development plan

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
}

export interface ChoreState {
  rotatingIndex: Record<string, number>; // chore ID -> current rotation index
  caughtUp: Record<string, boolean>; // chore ID -> true if completed yesterday (false = start day "overdue")
  completedToday: string[]; // Array of completed chore IDs
}

export interface FamilyChoresData {
  people: Person[];
  chores: Chore[];
  state: ChoreState;
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
