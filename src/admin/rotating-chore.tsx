import type { Component } from 'solid-js';
import { createMemo, Show } from 'solid-js';
import type { Person, RotatingChore } from '../types/chore-types';
import { escapeHtml, formatTime } from '../utils/browser';
import { useAdminContext } from './admin-context';
import { Button } from './button';

/** Props for the RotatingChoreCard component */
interface RotatingChoreCardProps {
  /** The rotating chore to display */
  chore: RotatingChore;
  /** List of all people for name resolution */
  people: Person[];
  /** Callback when the edit button is clicked */
  onEdit: (chore: RotatingChore) => void;
  /** Callback when the delete button is clicked */
  onDelete: (choreId: string) => void;
}

/** Format skip days for display */
const formatSkipDays = (skipDays: string[]): string => {
  if (!skipDays || skipDays.length === 0) return 'None';
  return skipDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
};

/** Display card for a rotating chore in the admin interface */
export const RotatingChoreCard: Component<RotatingChoreCardProps> = (props) => {
  const { resolvedTimeFormat } = useAdminContext();
  // Get rotation list names
  const rotationNames = createMemo(() =>
    props.chore.rotation
      .map((personId) => {
        const person = props.people.find((p) => p.id === personId);
        return person ? escapeHtml(person.name) : 'Unknown';
      })
      .join(', ')
  );

  // Check if rotation includes everyone
  const includesEveryone = createMemo(() => {
    const peopleLength = props.people.length ?? 0;
    return (
      props.chore.rotation.length === peopleLength &&
      props.chore.rotation.every((personId) => props.people.some((p) => p.id === personId))
    );
  });

  const rotationText = createMemo(() => (includesEveryone() ? 'Everyone' : rotationNames()));

  // Get current assignee
  const currentAssignee = createMemo(() => {
    const currentPersonId = props.chore.rotation[props.chore.rotatingIndex ?? 0];
    const currentPerson = props.people.find((p) => p.id === currentPersonId);
    return currentPerson ? escapeHtml(currentPerson.name) : 'Unassigned';
  });

  return (
    <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 transition-all hover:border-indigo-600 hover:shadow-md">
      <div class="flex-1">
        <h3 class="mb-1.5 text-xl text-slate-900">
          {escapeHtml(props.chore.name)}{' '}
          <span class="ml-2 inline-block rounded bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
            Rotating
          </span>
        </h3>
        <p class="text-sm text-slate-500">Current: {currentAssignee()}</p>
        <p class="text-sm text-slate-500">Rotation: {rotationText()}</p>
        <Show when={props.chore.deadline || props.chore.startTime}>
          <p class="mt-1.25 text-sm text-indigo-600">
            <Show when={props.chore.startTime}>
              Start: {formatTime(props.chore.startTime ?? '', resolvedTimeFormat())}
            </Show>
            <Show when={props.chore.deadline && props.chore.startTime}>
              <span class="mx-1">|</span>
            </Show>
            <Show when={props.chore.deadline}>
              Deadline: {formatTime(props.chore.deadline ?? '', resolvedTimeFormat())}
            </Show>
          </p>
        </Show>
        <p class="mt-1.25 text-sm text-slate-500">
          Skip days: {formatSkipDays(props.chore.skipDays)}
        </p>
      </div>
      <div class="flex gap-2.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => props.onEdit(props.chore)}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => props.onDelete(props.chore.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
