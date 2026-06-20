import type { Chore, DayOfWeek, Person } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import type { Config } from '../types/config';

/**
 * Determine if a chore should be shown based on skip day and time-based visibility settings.
 *
 * Skip-day filtering is applied first. A completed chore is then shown even if it would
 * otherwise be hidden by the start-time or after-deadline settings, so the user can see
 * what has already been done today.
 */
export function shouldShowChore(
  chore: Chore,
  todayDayName: DayOfWeek,
  currentTime: string
): boolean {
  // Skip day filtering is the first gate
  const skipDays = chore.skipDays;
  if (skipDays.includes(todayDayName)) {
    const skipDayVisibility = chore.skipDayVisibility;

    if (skipDayVisibility === SkipDayVisibility.HIDE) {
      return false;
    }

    if (skipDayVisibility === SkipDayVisibility.SHOW_IF_OVERDUE && chore.caughtUp) {
      return false;
    }
  }

  // Completed chores are visible even if they would be hidden by time-based settings
  if (chore.completedToday) {
    return true;
  }

  // Hide before startTime unless configured to show when not caught up
  if (chore.startTime && currentTime < chore.startTime) {
    if (chore.beforeStartTimeVisibility !== BeforeStartTimeVisibility.SHOW_IF_OVERDUE) {
      return false;
    }

    if (chore.caughtUp) {
      return false;
    }
  }

  return true;
}

/**
 * Determine if a chore belongs in the "Earlier chores" collapsed section.
 *
 * A chore with a deadline that has passed moves to the earlier section when:
 * - it is completed, or
 * - it is not completed and its after-deadline setting is "Move to earlier".
 */
export function isEarlierChore(chore: Chore, currentTime: string): boolean {
  if (!chore.deadline || currentTime < chore.deadline) {
    return false;
  }

  if (
    !chore.completedToday &&
    chore.afterDeadlineVisibility === AfterDeadlineVisibility.MOVE_TO_EARLIER
  ) {
    return true;
  }

  if (chore.completedToday) {
    return true;
  }

  return false;
}

/**
 * Determine if a chore should be styled as overdue based on display options.
 *
 * Completed chores are never overdue. A missed chore is overdue when
 * notCaughtUpDisplay is 'overdue'. A chore past its deadline is overdue when
 * afterDeadlineVisibility is 'overdue'.
 */
export function isChoreOverdue(chore: Chore, currentTime: string): boolean {
  if (chore.completedToday) {
    return false;
  }

  if (!chore.caughtUp && chore.notCaughtUpDisplay === NotCaughtUpDisplay.OVERDUE) {
    return true;
  }

  if (
    chore.deadline &&
    currentTime >= chore.deadline &&
    chore.afterDeadlineVisibility === AfterDeadlineVisibility.SHOW_OVERDUE
  ) {
    return true;
  }

  return false;
}

/**
 * Determine if a chore is hidden because its startTime has not been reached yet.
 *
 * A chore is considered hidden by start time when it:
 * - is not hidden by skip-day settings,
 * - has a startTime that is in the future,
 * - is not completed today,
 * - and is configured to hide before startTime (or is caught up with SHOW_IF_OVERDUE).
 */
export function isHiddenByStartTime(
  chore: Chore,
  todayDayName: DayOfWeek,
  currentTime: string
): boolean {
  const skipDays = chore.skipDays;
  if (skipDays.includes(todayDayName)) {
    const skipDayVisibility = chore.skipDayVisibility;
    if (skipDayVisibility === SkipDayVisibility.HIDE) {
      return false;
    }
    if (skipDayVisibility === SkipDayVisibility.SHOW_IF_OVERDUE && chore.caughtUp) {
      return false;
    }
  }

  if (!chore.startTime || currentTime >= chore.startTime) {
    return false;
  }

  if (chore.completedToday) {
    return false;
  }

  if (chore.beforeStartTimeVisibility === BeforeStartTimeVisibility.SHOW_IF_OVERDUE) {
    return chore.caughtUp;
  }

  return chore.beforeStartTimeVisibility === BeforeStartTimeVisibility.HIDE;
}

/**
 * Get chores that are currently hidden because their startTime has not been reached yet.
 */
export function getHiddenLaterChores(
  chores: Chore[],
  people: Person[],
  personFilter: string | null | undefined,
  todayDayName: DayOfWeek,
  currentTime: string
): Chore[] {
  const filterValue = personFilter?.trim().toLowerCase();
  const filteredPerson = filterValue
    ? people.find((person) => person.id.toLowerCase() === filterValue) ||
      people.find((person) => person.name.toLowerCase() === filterValue)
    : null;

  return chores.filter((chore) => {
    if (filteredPerson) {
      if (chore.type === 'personal') {
        if (chore.assignedTo !== filteredPerson.id) return false;
      } else if (chore.type === 'rotating' && chore.rotation?.length) {
        const currentIndex = chore.rotatingIndex ?? 0;
        if (chore.rotation[currentIndex] !== filteredPerson.id) return false;
      } else {
        return false;
      }
    }

    return isHiddenByStartTime(chore, todayDayName, currentTime);
  });
}

/**
 * Get chores filtered for personal view mode
 */
export function getFilteredChores(
  chores: Chore[],
  people: Person[],
  personFilter: string | null | undefined,
  todayDayName: DayOfWeek,
  currentTime: string
): Chore[] {
  // No person filter - apply skip day and time filtering to all chores
  const filterValue = personFilter?.trim().toLowerCase();
  if (!filterValue) {
    return chores.filter((chore) => shouldShowChore(chore, todayDayName, currentTime));
  }

  const filteredPerson =
    people.find((person) => person.id.toLowerCase() === filterValue) ||
    people.find((person) => person.name.toLowerCase() === filterValue);

  if (!filteredPerson) {
    return [];
  }

  return chores.filter((chore) => {
    // Check skip day and time-based visibility
    if (!shouldShowChore(chore, todayDayName, currentTime)) {
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
 * Get chores for summary view: all incomplete + all rotating chores, with skip day and time filtering
 */
export function getSummaryChores(
  chores: Chore[],
  todayDayName: DayOfWeek,
  currentTime: string
): Chore[] {
  return chores.filter((chore) => {
    // Check skip day and time-based visibility
    if (!shouldShowChore(chore, todayDayName, currentTime)) {
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
