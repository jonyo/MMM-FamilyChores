import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import { TimeFormat } from '../types/chore-types';
import { useAdminContext } from './admin-context';

interface TimeSelectProps {
  /** Current value as HH:MM 24-hour string, or empty string for "not set" */
  value: string;
  /** Called with new HH:MM 24-hour string, or empty string when cleared */
  onChange: (value: string) => void;
  id?: string;
}

const MINUTES = ['00', '30'];

/** All standard 30-minute-increment options in HH:MM 24-hour format starting at 00:30 */
const STANDARD_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of MINUTES) {
    const time = `${String(h).padStart(2, '0')}:${m}`;
    // Skip 00:00 — midnight is not a practical start or deadline time for a chore.
    if (time === '00:00') continue;
    STANDARD_OPTIONS.push(time);
  }
}

/**
 * Convert a 24-hour HH:MM string to a display label based on time format.
 */
const toLabel = (time: string, use12Hour: boolean): string => {
  if (!use12Hour) return time;
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number.parseInt(hourStr, 10);
  const ampm = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteStr} ${ampm}`;
};

export const TimeSelect: Component<TimeSelectProps> = (props) => {
  const { resolvedTimeFormat } = useAdminContext();
  const use12Hour = () => resolvedTimeFormat() === TimeFormat.HOUR_12;

  const options = () => {
    const base = [...STANDARD_OPTIONS];
    // If the current value is set but not a standard 30-min option, inject it
    if (props.value && !base.includes(props.value)) {
      const sorted = [...base, props.value].sort();
      return sorted;
    }
    return base;
  };

  const handleChange = (e: Event) => {
    props.onChange((e.currentTarget as HTMLSelectElement).value);
  };

  return (
    <select
      id={props.id}
      onChange={handleChange}
      class="w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
    >
      <option value="" selected={props.value === ''}>
        — Not set —
      </option>
      <Show when={!use12Hour()}>
        <For each={options()}>
          {(opt) => (
            <option value={opt} selected={opt === props.value}>
              {toLabel(opt, false)}
            </option>
          )}
        </For>
      </Show>
      <Show when={use12Hour()}>
        <optgroup label="AM">
          <For each={options().filter((o) => Number.parseInt(o.split(':')[0], 10) < 12)}>
            {(opt) => (
              <option value={opt} selected={opt === props.value}>
                {toLabel(opt, true)}
              </option>
            )}
          </For>
        </optgroup>
        <optgroup label="PM">
          <For each={options().filter((o) => Number.parseInt(o.split(':')[0], 10) >= 12)}>
            {(opt) => (
              <option value={opt} selected={opt === props.value}>
                {toLabel(opt, true)}
              </option>
            )}
          </For>
        </optgroup>
      </Show>
    </select>
  );
};
