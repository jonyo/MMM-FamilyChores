import type { Component } from 'solid-js';
import type { Chore, Person } from '../types/chore-types';
import { ChoreType } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';

interface RotatingChoreInlineProps {
  /** The rotating chore to display */
  chore: Chore;
  /** All people for looking up current rotation person */
  people: Person[];
  /** Callback when checkbox is toggled */
  onToggle: (choreId: string, completed: boolean) => void;
}

export const RotatingChoreInline: Component<RotatingChoreInlineProps> = (props) => {
  const currentRotationPerson = () => {
    const chore = props.chore;
    if (chore.type === ChoreType.ROTATING && chore.rotation && chore.rotatingIndex !== undefined) {
      return props.people.find((p) => p.id === chore.rotation?.[chore.rotatingIndex ?? -1]);
    }
    return null;
  };

  const personName = () => currentRotationPerson()?.name ?? 'Unassigned';
  const personColor = () => currentRotationPerson()?.color ?? '#ccc';

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onToggle(props.chore.id, target.checked);
  };

  return (
    <div class="rotating-inline" data-testid="rotating-inline">
      <span class="chore-name">{escapeHtml(props.chore.name)}</span>
      <span class="person-name" style={{ color: personColor() }}>
        {escapeHtml(personName())}
      </span>
      <input
        type="checkbox"
        class="inline-checkbox"
        data-testid="rotating-checkbox"
        data-chore-id={props.chore.id}
        checked={props.chore.completedToday}
        onChange={handleChange}
      />
    </div>
  );
};
