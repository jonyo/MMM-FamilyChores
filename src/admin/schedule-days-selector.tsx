import type { Accessor, Component } from 'solid-js';
import { createMemo, createSignal, For, Show, untrack } from 'solid-js';
import { DayOfWeek } from '../types/chore-types';

/** The checkbox interpretation shown by the schedule editor. */
type ScheduleMode = 'except' | 'only';

/** Props for editing a chore's active schedule while persisting skip days. */
interface ScheduleDaysSelectorProps {
  skipDays: Accessor<DayOfWeek[]>;
  setSkipDays: (days: DayOfWeek[]) => void;
}

const DAYS = Object.values(DayOfWeek);

const dayLabel = (day: DayOfWeek): string => day.charAt(0).toUpperCase() + day.slice(1);

/** Lets an admin edit the same skip-day data using either skipped or active weekdays. */
export const ScheduleDaysSelector: Component<ScheduleDaysSelectorProps> = (props) => {
  const initialSkipDays = untrack(() => props.skipDays());
  const [mode, setMode] = createSignal<ScheduleMode>(
    initialSkipDays.length > 3 ? 'only' : 'except'
  );

  const activeDays = createMemo(() => DAYS.filter((day) => !props.skipDays().includes(day)));

  const isChecked = (day: DayOfWeek): boolean =>
    mode() === 'except' ? props.skipDays().includes(day) : !props.skipDays().includes(day);

  const setDayChecked = (day: DayOfWeek, checked: boolean) => {
    const shouldSkip = mode() === 'except' ? checked : !checked;
    const current = props.skipDays();
    const next = shouldSkip
      ? current.includes(day)
        ? current
        : [...current, day]
      : current.filter((currentDay) => currentDay !== day);
    props.setSkipDays(DAYS.filter((currentDay) => next.includes(currentDay)));
  };

  const scheduleSummary = createMemo(() => {
    const active = activeDays();
    if (active.length === DAYS.length) return 'This chore is active every day.';
    if (active.length === 0) return 'This chore is not active on any day.';
    return `This chore is active on ${active.map(dayLabel).join(', ')}.`;
  });

  return (
    <div class="mb-5" data-testid="schedule-days-selector">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div class="font-medium text-slate-900">Schedule</div>
        <div
          class="inline-flex rounded-lg bg-slate-100 p-1 text-sm"
          role="tablist"
          aria-label="Schedule selection mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode() === 'except'}
            class="rounded-md px-3 py-1 font-medium transition-colors"
            classList={{
              'bg-white text-indigo-600 shadow-sm': mode() === 'except',
              'text-slate-500 hover:text-slate-700': mode() !== 'except',
            }}
            onClick={() => setMode('except')}
          >
            Every day except
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode() === 'only'}
            class="rounded-md px-3 py-1 font-medium transition-colors"
            classList={{
              'bg-white text-indigo-600 shadow-sm': mode() === 'only',
              'text-slate-500 hover:text-slate-700': mode() !== 'only',
            }}
            onClick={() => setMode('only')}
          >
            Only on selected days
          </button>
        </div>
      </div>
      <div
        class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
        data-testid="skip-days-checkbox-list"
      >
        <div class="mb-1 text-sm font-medium text-slate-700">
          <Show when={mode() === 'except'} fallback="Days to do this chore">
            Days to skip
          </Show>
        </div>
        <For each={DAYS}>
          {(day) => (
            <label class="flex cursor-pointer items-center gap-2 font-normal">
              <input
                type="checkbox"
                value={day}
                checked={isChecked(day)}
                onInput={(event) => setDayChecked(day, event.currentTarget.checked)}
                class="size-4.5 cursor-pointer"
              />
              {dayLabel(day)}
            </label>
          )}
        </For>
      </div>
      <p class="mt-2 text-sm text-slate-600" data-testid="schedule-summary">
        {scheduleSummary()}
        <Show when={mode() === 'only'}>
          {' '}
          Days not selected are skip days; Skip day visibility controls what happens on those days.
        </Show>
      </p>
    </div>
  );
};
