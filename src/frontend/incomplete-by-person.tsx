import type { Component } from 'solid-js';
import { createMemo, For, Show } from 'solid-js';
import type { Chore, Person } from '../types/chore-types';
import { ChoreType } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';

interface IncompleteByPersonProps {
  /** Incomplete chores to group and display */
  incompleteChores: Chore[];
  /** All people for looking up names and colors */
  people: Person[];
  /** Chores hidden because their startTime has not been reached yet */
  hiddenLaterChores?: Chore[];
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

    const laterByPerson = new Map<string, number>();
    props.hiddenLaterChores?.forEach((chore) => {
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
        laterByPerson.set(personId, (laterByPerson.get(personId) ?? 0) + 1);
      }
    });

    return props.people.map((person) => {
      const chores = choresByPerson.get(person.id) || [];
      const count = chores.length;
      const laterCount = laterByPerson.get(person.id) ?? 0;
      const celebrationEmoji = count === 0 && laterCount === 0 ? '🎉' : '';
      return { person, count, laterCount, celebrationEmoji };
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
            <Show when={row.laterCount > 0}>
              <span class="later-count-note" data-testid="later-count-note">
                {' '}
                +{row.laterCount} later
              </span>
            </Show>
          </span>
        </div>
      )}
    </For>
  );
};
