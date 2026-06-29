import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import type { DayOfWeek, Person, PersonalChore } from '../types/chore-types';
import { escapeHtml, formatTime } from '../utils/browser';
import { useAdminContext } from './admin-context';
import { Button } from './button';

/** Props for the PersonCard component */
interface PersonCardProps {
  /** Person to display */
  person: Person;
  /** Personal chores assigned to this person */
  chores: PersonalChore[];
  /** Whether chores can be copied from this person (other people exist) */
  canCopyChores: boolean;
  /** Callback to edit the person */
  onEditPerson: (person: Person) => void;
  /** Callback to open history for the person */
  onHistory: (person: Person) => void;
  /** Callback to delete the person */
  onDeletePerson: (personId: string) => void;
  /** Callback to add a new chore for the person */
  onAddChore: (person: Person) => void;
  /** Callback to edit an existing chore */
  onEditChore: (person: Person, chore: PersonalChore) => void;
  /** Callback to delete a chore */
  onDeleteChore: (choreId: string) => void;
  /** Callback to copy chores from this person */
  onCopyChores: (person: Person) => void;
}

// Format skip days for display
const formatSkipDays = (skipDays: DayOfWeek[]): string => {
  if (!skipDays || skipDays.length === 0) return 'None';
  return skipDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
};

/** Card displaying a person and their personal chores with an accordion */
export const PersonCard: Component<PersonCardProps> = (props) => {
  const { resolvedTimeFormat } = useAdminContext();
  const [expanded, setExpanded] = createSignal(false);

  const choreCount = () => props.chores.length;
  const choreCountLabel = () =>
    `${choreCount()} ${choreCount() === 1 ? 'personal chore' : 'personal chores'}`;

  const toggleExpanded = () => setExpanded((prev) => !prev);

  return (
    <div
      class="rounded-lg border border-slate-200 bg-slate-50 p-5 transition-all hover:border-indigo-600 hover:shadow-md"
      data-testid="person-card"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <button
            type="button"
            data-testid="expand-person-chores"
            class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-indigo-600 shadow-sm transition-all hover:border-indigo-600 hover:bg-indigo-50 hover:shadow-md"
            aria-label={expanded() ? 'Collapse chores' : 'Expand chores'}
            aria-expanded={expanded()}
            onClick={toggleExpanded}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class={`transition-transform duration-200 ${expanded() ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <path d="M5 8l5 5 5-5" />
            </svg>
          </button>
          <div>
            <h3 class="mb-1 text-xl text-slate-900">
              {escapeHtml(props.person.name)}{' '}
              <span
                class="inline-block size-6 rounded-full border-2 border-black/10 align-middle"
                style={`background-color: ${props.person.color}`}
              ></span>
            </h3>
            <p class="text-sm font-medium text-slate-500">{choreCountLabel()}</p>
          </div>
        </div>
        <div class="flex gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => props.onEditPerson(props.person)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => props.onHistory(props.person)}
          >
            History
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => props.onDeletePerson(props.person.id)}
          >
            Delete
          </Button>
        </div>
      </div>
      <Show when={expanded()}>
        <div class="mt-4 border-t border-slate-200 pt-4">
          <div class="mb-4 flex items-center justify-between">
            <h4 class="m-0 text-lg text-indigo-600">
              {escapeHtml(props.person.name)}'s Personal Chores
            </h4>
            <div class="flex gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => props.onAddChore(props.person)}
              >
                Add Chore
              </Button>
              <Show when={choreCount() > 0 && props.canCopyChores}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => props.onCopyChores(props.person)}
                >
                  Copy Chores
                </Button>
              </Show>
            </div>
          </div>
          <Show
            when={choreCount() > 0}
            fallback={
              <div>
                <p class="my-2.5 text-slate-500 italic">No personal chores yet.</p>
              </div>
            }
          >
            <div class="grid gap-2.5">
              <For each={props.chores}>
                {(chore) => (
                  <div class="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5">
                    <div>
                      <h4 class="mb-1.5 text-base text-slate-900">{escapeHtml(chore.name)}</h4>
                      <Show when={chore.deadline || chore.startTime}>
                        <p class="mt-1.25 text-sm text-indigo-600">
                          <Show when={chore.startTime}>
                            Start: {formatTime(chore.startTime ?? '', resolvedTimeFormat())}
                          </Show>
                          <Show when={chore.deadline && chore.startTime}>
                            <span class="mx-1">|</span>
                          </Show>
                          <Show when={chore.deadline}>
                            Deadline: {formatTime(chore.deadline ?? '', resolvedTimeFormat())}
                          </Show>
                        </p>
                      </Show>
                      <p class="mt-1.25 text-sm text-slate-500">
                        Skip days: {formatSkipDays(chore.skipDays)}
                      </p>
                    </div>
                    <div class="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => props.onEditChore(props.person, chore)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => props.onDeleteChore(chore.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};
