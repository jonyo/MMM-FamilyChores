import type { Accessor, Component } from 'solid-js';
import { createMemo, createSignal, For, Show } from 'solid-js';
import type { DayOfWeek, FamilyChoresData } from '../types/chore-types';
import { TimeFormat } from '../types/chore-types';
import type { Config } from '../types/config';
import { formatTime } from '../utils/browser';
import { getFilteredChores, getHiddenLaterChores, isEarlierChore } from './chore-filters';
import { ChoreItem } from './chore-item';
import { LaterChoresIndicator } from './later-chores-indicator';

/** Debounce window after the last check/uncheck before moving chores to the earlier section. */
const EARLIER_SECTION_DEBOUNCE_MS = 5000;

interface PersonalViewProps {
  /** Accessor to the chore data (reactive) */
  choreData: Accessor<FamilyChoresData>;
  /** Reactive accessor for today's day of week (updates at midnight) */
  todaysDayOfWeek: Accessor<DayOfWeek>;
  /** Reactive accessor for current local time in HH:MM (updates every minute) */
  currentTime: Accessor<string>;
  /** Module configuration */
  config: Config;
  /** Callback when a chore checkbox is toggled */
  onToggle: (choreId: string, completed: boolean) => void;
}

export const PersonalView: Component<PersonalViewProps> = (props) => {
  const resolvedTimeFormat = (): TimeFormat.HOUR_12 | TimeFormat.HOUR_24 => {
    const setting = props.choreData().settings?.timeFormat ?? TimeFormat.SYSTEM;
    if (setting === TimeFormat.SYSTEM) {
      return formatTime('00:00', TimeFormat.SYSTEM) === '00:00'
        ? TimeFormat.HOUR_24
        : TimeFormat.HOUR_12;
    }
    return setting === TimeFormat.HOUR_12 ? TimeFormat.HOUR_12 : TimeFormat.HOUR_24;
  };

  const visibleChores = createMemo(() => {
    const data = props.choreData();
    return getFilteredChores(
      data.chores,
      data.people,
      props.config.personFilter,
      props.todaysDayOfWeek(),
      props.currentTime()
    );
  });

  // Live set of chore IDs that belong in the earlier section based on current data and time
  const liveEarlierIds = createMemo(() => {
    const time = props.currentTime();
    const ids = new Set<string>();
    for (const chore of visibleChores()) {
      if (isEarlierChore(chore, time)) {
        ids.add(chore.id);
      }
    }
    return ids;
  });

  // Frozen snapshot of the earlier section during the post-toggle debounce window
  const [frozenEarlierIds, setFrozenEarlierIds] = createSignal<Set<string> | null>(null);
  let earlierDebounceTimer: number | undefined;

  const freezeEarlierSection = () => {
    // Only take a fresh snapshot if there isn't already an active freeze. If we
    // re-snapshotted on every toggle, a toggle that lands while a previous
    // toggle's freeze is still active would capture `liveEarlierIds()` *after*
    // that earlier toggle's data had already round-tripped from the backend,
    // which would immediately reveal its moved state and cause the list to
    // jump instead of waiting out its own debounce window.
    if (frozenEarlierIds() === null) {
      setFrozenEarlierIds(liveEarlierIds());
    }
    if (earlierDebounceTimer) {
      clearTimeout(earlierDebounceTimer);
    }
    earlierDebounceTimer = window.setTimeout(() => {
      setFrozenEarlierIds(null);
    }, EARLIER_SECTION_DEBOUNCE_MS);
  };

  const effectiveEarlierIds = createMemo(() => frozenEarlierIds() ?? liveEarlierIds());

  const mainChores = createMemo(() =>
    visibleChores().filter((chore) => !effectiveEarlierIds().has(chore.id))
  );

  const earlierChores = createMemo(() =>
    visibleChores().filter((chore) => effectiveEarlierIds().has(chore.id))
  );

  const hiddenLaterChores = createMemo(() => {
    const data = props.choreData();
    return getHiddenLaterChores(
      data.chores,
      data.people,
      props.config.personFilter,
      props.todaysDayOfWeek(),
      props.currentTime()
    );
  });

  const hasVisibleChores = createMemo(
    () => mainChores().length > 0 || earlierChores().length > 0 || hiddenLaterChores().length > 0
  );

  const handleToggle = (choreId: string, completed: boolean) => {
    freezeEarlierSection();
    props.onToggle(choreId, completed);
  };

  return (
    <Show
      when={hasVisibleChores()}
      fallback={
        <div class="chore-list">
          <div class="empty-state">No chores match the current filter.</div>
        </div>
      }
    >
      <div class="chore-list">
        <For each={mainChores()}>
          {(chore) => (
            <ChoreItem
              chore={chore}
              people={props.choreData().people}
              currentTime={props.currentTime()}
              timeFormat={resolvedTimeFormat()}
              onToggle={handleToggle}
            />
          )}
        </For>
        <Show when={hiddenLaterChores().length > 0}>
          <LaterChoresIndicator count={hiddenLaterChores().length} />
        </Show>
      </div>

      <Show when={earlierChores().length > 0}>
        <div class="chore-list">
          <div class="earlier-chores-container">
            <details class="earlier-chores">
              <summary class="earlier-chores-summary">
                <div class="earlier-chores-header">
                  <span class="earlier-chores-title">Earlier chores</span>
                  <span class="earlier-chores-count">{earlierChores().length}</span>
                </div>
              </summary>
              <div class="earlier-chores-content">
                <For each={earlierChores()}>
                  {(chore) => (
                    <ChoreItem
                      chore={chore}
                      people={props.choreData().people}
                      currentTime={props.currentTime()}
                      timeFormat={resolvedTimeFormat()}
                      onToggle={handleToggle}
                    />
                  )}
                </For>
              </div>
            </details>
          </div>
        </div>
      </Show>
    </Show>
  );
};
