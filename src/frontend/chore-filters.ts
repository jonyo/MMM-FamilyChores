import type { Chore, DayOfWeek, Person } from '../types/chore-types';
import { SkipDayVisibility } from '../types/chore-types';
import type { Config } from '../types/config';

/**
 * Determine if a chore should be shown based on skip day visibility settings
 */
export function shouldShowChore(chore: Chore, todayDayName: DayOfWeek): boolean {
  const skipDays = chore.skipDays;
  if (!skipDays.includes(todayDayName)) {
    // not a skip day
    return true;
  }

  // skip day - decide whether to show based on visibility setting
  const skipDayVisibility = chore.skipDayVisibility ?? SkipDayVisibility.HIDE;

  if (skipDayVisibility === SkipDayVisibility.HIDE) {
    // Today is a skip day and visibility is HIDE - skip this chore entirely
    return false;
  }

  if (skipDayVisibility === SkipDayVisibility.SHOW_IF_OVERDUE && chore.caughtUp) {
    // Visibility is "show if overdue" and we are caught up - don't show
    return false;
  }

  // either "always show" or "show if overdue" and it is overdue
  return true;
}

/**
 * Get chores filtered for personal view mode
 */
export function getFilteredChores(
  chores: Chore[],
  people: Person[],
  personFilter: string | null | undefined,
  todayDayName: DayOfWeek
): Chore[] {
  // No person filter - apply skip day filtering to all chores
  const filterValue = personFilter?.trim().toLowerCase();
  if (!filterValue) {
    return chores.filter((chore) => shouldShowChore(chore, todayDayName));
  }

  const filteredPerson =
    people.find((person) => person.id.toLowerCase() === filterValue) ||
    people.find((person) => person.name.toLowerCase() === filterValue);

  if (!filteredPerson) {
    return [];
  }

  return chores.filter((chore) => {
    // Check skip day visibility
    if (!shouldShowChore(chore, todayDayName)) {
      return false;
    }

    // Apply person filter
    if (chore.type === 'personal') {
      return chore.assignedTo === filteredPerson.id;
    }

    if (chore.type === 'rotating' && chore.rotation?.length) {
      const currentIndex = chore.rotatingIndex ?? 0;
      return chore.rotation[currentIndex] === filteredPerson.id;
    }

    return false;
  });
}

/**
 * Get chores for summary view: all incomplete + all rotating chores, with skip day filtering
 */
export function getSummaryChores(chores: Chore[], todayDayName: DayOfWeek): Chore[] {
  return chores.filter((chore) => {
    // Check skip day visibility
    if (!shouldShowChore(chore, todayDayName)) {
      return false;
    }

    // Show all incomplete chores
    if (!chore.completedToday) {
      return true;
    }

    // For rotating chores, always show current assignment even if completed
    if (chore.type === 'rotating' && chore.rotation?.length) {
      return true;
    }

    return false;
  });
}

/**
 * Build a Config object with all defaults applied
 */
export function getSummaryConfig(config: Config) {
  return {
    showIncomplete: true,
    showRotating: true,
    showOverdue: true,
    incompleteTitle: 'Incomplete Chores',
    rotatingTitle: "Today's Rotation",
    overdueTitle: 'Overdue',
    ...config.summary,
  };
}
