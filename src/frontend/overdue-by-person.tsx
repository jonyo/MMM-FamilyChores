import type { Component } from 'solid-js';
import { createMemo, For } from 'solid-js';
import type { Chore, Person } from '../types/chore-types';
import { ChoreType } from '../types/chore-types';
import { escapeHtml } from '../utils/browser';

interface OverdueByPersonProps {
  /** Overdue chores to group and display */
  overdueChores: Chore[];
  /** All people for looking up names and colors */
  people: Person[];
}

export const OverdueByPerson: Component<OverdueByPersonProps> = (props) => {
  const personGroups = createMemo(() => {
    const choresByPerson = new Map<string, Chore[]>();
    props.overdueChores.forEach((chore) => {
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

    const groups: {
      person: Person;
      displayChores: Chore[];
      remainingCount: number;
    }[] = [];

    choresByPerson.forEach((chores, personId) => {
      const person = props.people.find((p) => p.id === personId);
      if (!person) return;

      const displayChores = chores.length <= 4 ? chores : chores.slice(0, 3);
      const remainingCount = chores.length <= 4 ? 0 : chores.length - 3;
      groups.push({ person, displayChores, remainingCount });
    });

    return groups;
  });

  return (
    <For each={personGroups()}>
      {(group) => (
        <div class="overdue-person-group">
          <div class="overdue-person-name" style={{ color: group.person.color }}>
            {escapeHtml(group.person.name)}
          </div>
          <div class="overdue-chores-list">
            <For each={group.displayChores}>
              {(chore) => (
                <div
                  class="overdue-chore-item"
                  data-testid="overdue-chore-item"
                  data-chore-id={chore.id}
                >
                  {escapeHtml(chore.name)}
                </div>
              )}
            </For>
            {group.remainingCount > 0 && (
              <div class="overdue-more">...{group.remainingCount} more</div>
            )}
          </div>
        </div>
      )}
    </For>
  );
};
