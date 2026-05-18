import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import './chore-history-modal.css';
import './buttons.css';
import './modals.css';
import { Match, onMount, Switch } from 'solid-js';
import { getHistory } from '../api';
import type {
  Chore,
  DailyCompletion,
  DayOfWeek,
  FamilyChoresData,
  Person,
} from '../types/chore-types';
import { escapeHtml } from '../utils/browser';
import {
  getLocalDateString,
  getLocalDayNameShort,
  getLocalDayOfMonth,
  getLocalMonthNameShort,
} from '../utils/date';
import { Tooltip } from './tooltip';

interface ChoreHistoryModalProps {
  person: Person;
  choreData: FamilyChoresData;
  closeModal: () => void;
}

export const ChoreHistoryModal: Component<ChoreHistoryModalProps> = (props) => {
  const [history, setHistory] = createSignal<DailyCompletion[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const data = await getHistory(props.person.id);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  });

  // Get last 14 days
  const getDays = () => {
    const days: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(getLocalDateString(date));
    }
    return days;
  };

  // Get chores for a person (personal + rotating where person is in rotation)
  const getPersonChores = () => {
    return props.choreData.chores.filter((chore) => {
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
    return history().find((dc) => dc.choreId === choreId && dc.date === date);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = getLocalDayNameShort(date);
    const month = getLocalMonthNameShort(date);
    const day = getLocalDayOfMonth(date);
    return `${dayName} ${month} ${day}`;
  };

  // Check if a date is a skip day for a chore
  const isSkipDay = (chore: Chore, dateStr: string) => {
    if (!chore.skipDays || chore.skipDays.length === 0) {
      return false;
    }
    const date = new Date(dateStr);
    const dayName = date
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase() as DayOfWeek;
    return chore.skipDays.includes(dayName);
  };

  return (
    <div class="modal active">
      <div class="modal-content modal-content-large">
        <h3>
          {escapeHtml(props.person.name)}'s Chore History
          <Tooltip
            text="Shows daily chore completions for the last 14 days. Green = completed on time, Yellow = completed late, Gray = skip day."
            position="below"
            align="center"
            multiline
          >
            <span class="info-icon">ℹ️</span>
          </Tooltip>
        </h3>
        <Show when={loading()}>
          <div class="loading">Loading history...</div>
        </Show>
        <Show when={error()}>
          <div class="error">Error: {escapeHtml(error() ?? 'Unknown error')}</div>
        </Show>
        <Show when={!loading() && !error()}>
          <div class="history-grid">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Chore</th>
                  <For each={getDays()}>
                    {(day) => (
                      <th class="date">
                        <span class="vertical-text">{formatDate(day)}</span>
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={getPersonChores()}>
                  {(chore) => (
                    <tr>
                      <td class="chore-name">
                        {escapeHtml(chore.name)}
                        <Show when={chore.type === 'rotating'}>
                          {' '}
                          <Tooltip
                            text={chore.type === 'rotating' ? 'Rotating chore' : ''}
                            position="above-right"
                            multiline
                            class="rotating-icon"
                          >
                            🔄
                          </Tooltip>
                        </Show>
                      </td>
                      <For each={getDays()}>
                        {(day) => {
                          const completion = getCompletionDetails(chore.id, day);
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
                              class="history-cell"
                              classList={{
                                'history-skip-day': skipDay,
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
                                      'completion-badge': true,
                                      'completion-late': completion?.wasLate,
                                      'completion-ontime': !completion?.wasLate,
                                    }}
                                  >
                                    ✓
                                  </Tooltip>
                                </Match>
                                <Match when={completion?.completed === false}>
                                  <Tooltip
                                    text={getTooltipText()}
                                    position="above"
                                    align="right"
                                    class="completion-badge completion-missed"
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
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onClick={() => props.closeModal()}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
