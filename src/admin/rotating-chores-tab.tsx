import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import type { Chore, Person, RotatingChore } from '../types/chore-types';
import { ChoreType } from '../types/chore-types';
import { Button } from './button';
import { RotatingChoreCard } from './rotating-chore';

/** Props for the RotatingChoresTab component */
interface RotatingChoresTabProps {
  /** List of all people (required before rotating chores can be created) */
  people: Person[];
  /** All chores (used to filter rotating chores) */
  chores: Chore[];
  /** Callback to add a new rotating chore */
  onAddRotatingChore: () => void;
  /** Callback to edit a rotating chore */
  onEditRotatingChore: (chore: RotatingChore) => void;
  /** Callback to delete a rotating chore */
  onDeleteChore: (choreId: string) => void;
}

/** Tab showing all rotating chores */
export const RotatingChoresTab: Component<RotatingChoresTabProps> = (props) => {
  const rotatingChores = () =>
    props.chores.filter((chore) => chore.type === ChoreType.ROTATING) as RotatingChore[];

  return (
    <Show when={props.people.length > 0}>
      <section id="rotatingChoresSection" data-testid="rotating-chores-section">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="m-0 border-b-2 border-indigo-600 pb-2.5 text-2xl text-indigo-600">
            Rotating Chores
          </h2>
          <Button
            type="button"
            variant="primary"
            id="addRotatingChoreBtn"
            onClick={props.onAddRotatingChore}
          >
            Add Rotating Chore
          </Button>
        </div>
        <div id="rotatingChoresList" class="mt-5 grid gap-4">
          <For each={rotatingChores()}>
            {(chore) => (
              <RotatingChoreCard
                chore={chore}
                people={props.people}
                onEdit={props.onEditRotatingChore}
                onDelete={props.onDeleteChore}
              />
            )}
          </For>
        </div>
      </section>
    </Show>
  );
};
