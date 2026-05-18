import type { Component } from 'solid-js';
import { createSignal, For, onMount, Show } from 'solid-js';
import { getHistory } from '../api';
import type {
  Chore,
  DailyCompletion,
  DayOfWeek,
  FamilyChoresData,
  Person,
} from '../types/chore-types';
import {
  getLocalDateString,
  getLocalDayNameShort,
  getLocalDayOfMonth,
  getLocalMonthNameShort,
} from '../utils/date';

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

  // Check if chore was completed on a specific date
  const _isCompleted = (choreId: string, date: string) => {
    return history().some((dc) => dc.choreId === choreId && dc.date === date && dc.completed);
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
          <span
            class="info-icon"
            data-tooltip="Shows daily chore completions for the last 14 days. Green = completed on time, Yellow = completed late, Gray = skip day."
          >
            ℹ️
          </span>
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
                          <span
                            class="rotating-icon"
                            data-tooltip="Rotating chore: Blank cells mean it was likely someone else's turn, Magic Mirror wasn't running, or the chore is newer than this date."
                          >
                            🔄
                          </span>
                        </Show>
                      </td>
                      <For each={getDays()}>
                        {(day) => {
                          const completion = getCompletionDetails(chore.id, day);
                          const skipDay = isSkipDay(chore, day);
                          return (
                            <td
                              class="history-cell"
                              classList={{
                                'history-skip-day': skipDay,
                              }}
                              data-tooltip={skipDay ? 'Skip day' : ''}
                            >
                              <Show when={completion?.completed}>
                                <span
                                  class="completion-badge"
                                  classList={{
                                    'completion-late': completion?.wasLate,
                                    'completion-ontime': !completion?.wasLate,
                                  }}
                                  data-tooltip={
                                    completion?.completedAt
                                      ? `Completed at ${completion.completedAt} (24h)`
                                      : ''
                                  }
                                >
                                  ✓
                                </span>
                              </Show>
                              <Show when={completion && !completion.completed}>
                                <span
                                  class="completion-badge completion-missed"
                                  data-tooltip="Not completed"
                                >
                                  ✗
                                </span>
                              </Show>
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

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
