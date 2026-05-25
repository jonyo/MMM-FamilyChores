import type { Component } from 'solid-js';
import { createMemo, For } from 'solid-js';
import type { Chore, Person } from '../types/chore-types';
import { ChoreType } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';

interface IncompleteByPersonProps {
  /** Incomplete chores to group and display */
  incompleteChores: Chore[];
  /** All people for looking up names and colors */
  people: Person[];
}

export const IncompleteByPerson: Component<IncompleteByPersonProps> = (props) => {
  const personRows = createMemo(() => {
    const choresByPerson = new Map<string, Chore[]>();
    props.incompleteChores.forEach((chore) => {
      let personId: string | undefined;
      if (chore.type === ChoreType.PERSONAL) {
        personId = chore.assignedTo;
      } else if (
        chore.type === ChoreType.ROTATING &&
        chore.rotation &&
        chore.rotatingIndex !== undefined
      ) {
        personId = chore.rotation[chore.rotatingIndex];
      }

      if (personId) {
        if (!choresByPerson.has(personId)) {
          choresByPerson.set(personId, []);
        }
        choresByPerson.get(personId)?.push(chore);
      }
    });

    return props.people.map((person) => {
      const chores = choresByPerson.get(person.id) || [];
      const count = chores.length;
      const celebrationEmoji = count === 0 ? '🎉' : '';
      return { person, count, celebrationEmoji };
    });
  });

  return (
    <For each={personRows()}>
      {(row) => (
        <div class="incomplete-person-row">
          <span class="person-name" style={{ color: row.person.color }}>
            {escapeHtml(row.person.name)}
          </span>
          <span class="incomplete-count">
            {row.celebrationEmoji}
            {row.celebrationEmoji && ' '}
            {row.count}
          </span>
        </div>
      )}
    </For>
  );
};
