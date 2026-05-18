import type { Component } from 'solid-js';
import { createMemo, Show } from 'solid-js';
import './rotating-chore.css';
import './buttons.css';
import type { Person, RotatingChore } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';

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
    <div class="item-card">
      <div class="item-info">
        <h3>
          {escapeHtml(props.chore.name)} <span class="chore-type-badge rotating">Rotating</span>
        </h3>
        <p>Current: {currentAssignee()}</p>
        <p>Rotation: {rotationText()}</p>
        <Show when={props.chore.deadline}>
          <p class="deadline">Deadline: {props.chore.deadline}</p>
        </Show>
        <p class="skip-days">Skip days: {formatSkipDays(props.chore.skipDays)}</p>
      </div>
      <div class="item-actions">
        <button type="button" class="btn btn-secondary" onClick={() => props.onEdit(props.chore)}>
          Edit
        </button>
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onClick={() => props.onDelete(props.chore.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
