import type { Component } from 'solid-js';
import { DayOfWeek } from '../types/chore-types';

/** Props for the compact schedule summary shown on chore cards. */
interface ScheduleDaysSummaryProps {
  skipDays: DayOfWeek[];
}

const DAYS = Object.values(DayOfWeek);

const formatDays = (days: DayOfWeek[]): string => {
  if (days.length === 0) return 'None';
  return days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
};

/** Shows the shorter active/skip-day representation with a visually distinct calendar icon. */
export const ScheduleDaysSummary: Component<ScheduleDaysSummaryProps> = (props) => {
  const showActiveDays = () => props.skipDays.length > 3;
  const displayedDays = () =>
    showActiveDays() ? DAYS.filter((day) => !props.skipDays.includes(day)) : props.skipDays;

  return (
    <p
      class="mt-1.25 flex items-center gap-1.5 text-sm"
      classList={{
        'text-indigo-600': showActiveDays(),
        'text-slate-500': !showActiveDays(),
      }}
      data-testid="schedule-days-summary"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        class="size-4 shrink-0"
        aria-hidden="true"
      >
        <rect x="2.5" y="4" width="15" height="13" rx="2" />
        <path d="M6 2.5v3M14 2.5v3M2.5 8h15" />
        {showActiveDays() ? <path d="m6.5 12 2 2 4.5-4.5" /> : <path d="M6.5 12h7" />}
      </svg>
      <span>
        <strong>{showActiveDays() ? 'Active days:' : 'Skip days:'}</strong>{' '}
        {formatDays(displayedDays())}
      </span>
    </p>
  );
};
