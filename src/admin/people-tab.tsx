import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import type { Chore, Person, PersonalChore } from '../types/chore-types';
import { ChoreType } from '../types/chore-types';
import { Button } from './button';
import { HelpIcon } from './help-icon';
import { PersonCard } from './person-card';

/** Props for the PeopleTab component */
interface PeopleTabProps {
  /** List of all people */
  people: Person[];
  /** All chores (used to find personal chores per person) */
  chores: Chore[];
  /** Callback to add a new person */
  onAddPerson: () => void;
  /** Callback to edit an existing person */
  onEditPerson: (person: Person) => void;
  /** Callback to open a person's history */
  onHistory: (person: Person) => void;
  /** Callback to delete a person */
  onDeletePerson: (personId: string) => void;
  /** Callback to add a personal chore for a person */
  onAddChore: (person: Person) => void;
  /** Callback to edit a personal chore */
  onEditChore: (person: Person, chore: PersonalChore) => void;
  /** Callback to delete a chore */
  onDeleteChore: (choreId: string) => void;
  /** Callback to copy chores from a person */
  onCopyChores: (person: Person) => void;
}

/** Tab showing all people as accordion cards */
export const PeopleTab: Component<PeopleTabProps> = (props) => {
  const getPersonalChores = (personId: string): PersonalChore[] =>
    props.chores.filter(
      (chore) => chore.type === ChoreType.PERSONAL && chore.assignedTo === personId
    ) as PersonalChore[];

  const canCopyChores = () => props.people.length > 1;

  return (
    <section data-testid="people-section">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="m-0 border-b-2 border-indigo-600 pb-2.5 text-2xl text-indigo-600">People</h2>
        <div class="flex items-center gap-2">
          <Button type="button" variant="primary" onClick={() => props.onAddPerson()}>
            Add Person
          </Button>
          <Show when={props.people.length === 0}>
            <HelpIcon
              text="Add at least one person before you can create chores"
              class="ml-2"
              align="right"
            />
          </Show>
        </div>
      </div>
      <div class="mt-5 grid gap-4">
        <For each={props.people}>
          {(person) => (
            <PersonCard
              person={person}
              chores={getPersonalChores(person.id)}
              canCopyChores={canCopyChores()}
              onEditPerson={props.onEditPerson}
              onHistory={props.onHistory}
              onDeletePerson={props.onDeletePerson}
              onAddChore={props.onAddChore}
              onEditChore={props.onEditChore}
              onDeleteChore={props.onDeleteChore}
              onCopyChores={props.onCopyChores}
            />
          )}
        </For>
      </div>
    </section>
  );
};
