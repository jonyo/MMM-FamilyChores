import type { Component } from 'solid-js';
import type { Chore, Person } from '../types/chore-types';
import { ChoreType } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';
import { isChoreOverdue } from './chore-filters';

interface ChoreItemProps {
  /** The chore to display */
  chore: Chore;
  /** All people for looking up assigned person */
  people: Person[];
  /** Current local time in HH:MM */
  currentTime: string;
  /** Callback when checkbox is toggled */
  onToggle: (choreId: string, completed: boolean) => void;
}

export const ChoreItem: Component<ChoreItemProps> = (props) => {
  const assignedPerson = () => {
    const chore = props.chore;
    if (chore.type === ChoreType.PERSONAL) {
      return props.people.find((p) => p.id === chore.assignedTo);
    }
    return null;
  };

  const currentRotationPerson = () => {
    const chore = props.chore;
    if (chore.type === ChoreType.ROTATING && chore.rotation && chore.rotatingIndex !== undefined) {
      return props.people.find((p) => p.id === chore.rotation?.[chore.rotatingIndex ?? -1]);
    }
    return null;
  };

  const displayPerson = () => assignedPerson() || currentRotationPerson();
  const personName = () => displayPerson()?.name ?? 'Unassigned';
  const personColor = () => displayPerson()?.color ?? '#ccc';

  const deadlineClass = () => {
    if (props.chore.completedToday) {
      return 'completed';
    }
    if (isChoreOverdue(props.chore, props.currentTime)) {
      return 'overdue';
    }
    return 'normal';
  };

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onToggle(props.chore.id, target.checked);
  };

  return (
    <div class={`chore-item ${deadlineClass()}`} data-testid="chore-item">
      <label class="chore-label" for={`chore-${props.chore.id}`}>
        <div class="chore-checkbox">
          <input
            type="checkbox"
            id={`chore-${props.chore.id}`}
            data-testid="chore-checkbox"
            data-chore-id={props.chore.id}
            checked={props.chore.completedToday}
            onChange={handleChange}
          />
        </div>
        <div class="chore-details">
          <div class="chore-name">{escapeHtml(props.chore.name)}</div>
          <div class="chore-meta">
            <span class="assigned-to" style={{ color: personColor() }}>
              {escapeHtml(personName())}
            </span>
            {props.chore.deadline && <span class="deadline">{props.chore.deadline}</span>}
          </div>
        </div>
      </label>
    </div>
  );
};
