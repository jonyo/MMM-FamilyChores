import type { Component } from 'solid-js';
import { createMemo, createSignal, For, Match, onMount, Show, Switch } from 'solid-js';
import type { Chore, DayOfWeek, Person } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';
import {
  getLocalDateString,
  getLocalDayName,
  getLocalDayNameShort,
  getLocalDayOfMonth,
  getLocalMonthNameShort,
} from '../utils/date';
import { useAdminContext } from './admin-context';
import { Button } from './button';
import { Tooltip } from './tooltip';

interface ChoreHistoryModalProps {
  person: Person;
  closeModal: () => void;
}

/**
 * Pre-computed day information for history grid
 * All values derived from a single local Date object to avoid timezone issues
 */
interface DayInfo {
  /** Local date string in YYYY-MM-DD format - for completion lookup */
  date: string;
  /** Full day name (sunday, monday, etc.) - for skip day checks */
  dayName: string;
  /** Display string for header (e.g., "Sun May 17") */
  display: string;
}

export const ChoreHistoryModal: Component<ChoreHistoryModalProps> = (props) => {
  const { choreData, loadData } = useAdminContext();
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    await loadData();
    setLoading(false);
  });

  // Derive this person's history from the shared chore data
  const personHistory = createMemo(() => {
    const completions = choreData().dailyCompletions ?? [];
    return completions.filter((dc) => dc.personId === props.person.id);
  });

  // Get last 14 completed days with pre-computed display data (excludes today)
  // IMPORTANT: We compute all localized values (date string, day name, display) from the
  // same local Date object before serialization. This avoids the timezone double-correction bug:
  // new Date('2026-05-17') parses as UTC midnight, and when formatted back to local timezone
  // via getLocalDayName(), it can shift to the previous day for timezones west of UTC.
  // By computing all values from a single Date object, we ensure consistency.
  const getDays = (): DayInfo[] => {
    const days: DayInfo[] = [];
    // Start at 14 days ago and end at yesterday (i=1) so today is not shown
    for (let i = 14; i >= 1; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayNameShort = getLocalDayNameShort(date);
      const monthShort = getLocalMonthNameShort(date);
      const dayOfMonth = getLocalDayOfMonth(date);
      days.push({
        date: getLocalDateString(date),
        dayName: getLocalDayName(date),
        display: `${dayNameShort} ${monthShort} ${dayOfMonth}`,
      });
    }
    return days;
  };

  // Get chores for a person (personal + rotating where person is in rotation)
  const getPersonChores = () => {
    const data = choreData();
    return data.chores.filter((chore) => {
      if (chore.type === 'personal' && chore.assignedTo === props.person.id) {
        return true;
      }
      if (chore.type === 'rotating' && chore.rotation?.includes(props.person.id)) {
        return true;
      }
      return false;
    });
  };

  // Get completion details for a chore on a specific date
  const getCompletionDetails = (choreId: string, date: string) => {
    return personHistory().find((dc) => dc.choreId === choreId && dc.date === date);
  };

  // Check if a date is a skip day for a chore
  const isSkipDay = (chore: Chore, day: DayInfo) => {
    if (!chore.skipDays || chore.skipDays.length === 0) {
      return false;
    }
    return chore.skipDays.includes(day.dayName as DayOfWeek);
  };

  return (
    <div
      class="fixed inset-0 z-1000 flex  items-center justify-center bg-black/50"
      data-testid="modal"
    >
      <div
        class="max-h-[90vh] w-[90%] max-w-[95vw] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"
        data-testid="modal-content"
      >
        <h3 class="mb-5 text-2xl text-indigo-600">
          {escapeHtml(props.person.name)}'s Chore History
        </h3>
        <Show when={loading()}>
          <div class="py-4 text-center text-slate-500">Loading history...</div>
        </Show>
        <Show when={!loading()}>
          <div class="overflow-x-auto">
            <table
              class="w-full border-collapse border border-slate-200"
              data-testid="history-table"
            >
              <thead>
                <tr>
                  <th class="border border-slate-200 p-2.5 text-left text-base font-medium whitespace-nowrap text-slate-900">
                    Chore
                  </th>
                  <For each={getDays()}>
                    {(day) => (
                      <th class="relative h-[100px] w-[50px] overflow-visible border border-slate-200 p-2.5 text-left text-base font-medium text-slate-900">
                        <span class="absolute top-1/2 left-1/2 -translate-1/2  -rotate-90 whitespace-nowrap">
                          {day.display}
                        </span>
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={getPersonChores()}>
                  {(chore) => (
                    <tr>
                      <td class="border border-slate-200 p-2.5 text-base whitespace-nowrap text-slate-900">
                        {escapeHtml(chore.name)}
                        <Show when={chore.type === 'rotating'}>
                          {' '}
                          <Tooltip
                            text="Rotating chore"
                            position="above-right"
                            multiline
                            class="text-sm"
                          >
                            🔄
                          </Tooltip>
                        </Show>
                      </td>
                      <For each={getDays()}>
                        {(day) => {
                          const completion = getCompletionDetails(chore.id, day.date);
                          const skipDay = isSkipDay(chore, day);
                          const emptyDay = !skipDay && !completion;

                          const getEmptyTooltip = () => {
                            if (chore.type === 'rotating') {
                              return "Either it was someone else's turn (rotating chore), Magic Mirror was not running this day, or the chore was not created yet.";
                            }
                            return 'Either Magic Mirror was not running this day, or the chore was not created yet.';
                          };

                          const getTooltipText = () => {
                            if (completion?.completed)
                              return `Completed at ${completion.completedAt} (24h)`;
                            if (completion && !completion.completed) return 'Not completed';
                            if (skipDay) return 'Skip day';
                            if (emptyDay) return getEmptyTooltip();
                            return '';
                          };

                          return (
                            <td
                              class="border border-slate-200 p-2.5 text-center"
                              classList={{
                                'bg-slate-100': skipDay,
                              }}
                            >
                              <Switch
                                fallback={
                                  <Tooltip
                                    text={getTooltipText()}
                                    position="above"
                                    align="right"
                                    multiline={emptyDay}
                                  >
                                    <span
                                      style={{
                                        opacity: 0,
                                        width: '32px',
                                        height: '32px',
                                        display: 'inline-block',
                                      }}
                                    />
                                  </Tooltip>
                                }
                              >
                                <Match when={completion?.completed}>
                                  <Tooltip
                                    text={getTooltipText()}
                                    position="above"
                                    align="right"
                                    classList={{
                                      'inline-block': true,
                                      'w-8': true,
                                      'h-8': true,
                                      'rounded-full': true,
                                      'text-center': true,
                                      'leading-8': true,
                                      'bg-yellow-500': completion?.wasLate,
                                      'bg-green-500': !completion?.wasLate,
                                      'text-white': true,
                                    }}
                                    dataTestId={
                                      completion?.wasLate ? 'completion-late' : 'completion-ontime'
                                    }
                                  >
                                    ✓
                                  </Tooltip>
                                </Match>
                                <Match when={completion?.completed === false}>
                                  <Tooltip
                                    text={getTooltipText()}
                                    position="above"
                                    align="right"
                                    class="inline-block size-8  rounded-full bg-red-500 text-center leading-8 text-white"
                                    dataTestId="completion-missed"
                                  >
                                    ✗
                                  </Tooltip>
                                </Match>
                              </Switch>
                            </td>
                          );
                        }}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
        <div class="mt-6 flex justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => props.closeModal()}
            dataTestId="close-button"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
