import type { Accessor, Component } from 'solid-js';
import { createMemo, For, Show } from 'solid-js';
import type { DayOfWeek, FamilyChoresData } from '../types/chore-types';
import type { Config } from '../types/config';
import { getFilteredChores } from './chore-filters';
import { ChoreItem } from './chore-item';

interface PersonalViewProps {
  /** Accessor to the chore data (reactive) */
  choreData: Accessor<FamilyChoresData>;
  /** Reactive accessor for today's day of week (updates at midnight) */
  todaysDayOfWeek: Accessor<DayOfWeek>;
  /** Module configuration */
  config: Config;
  /** Callback when a chore checkbox is toggled */
  onToggle: (choreId: string, completed: boolean) => void;
}

export const PersonalView: Component<PersonalViewProps> = (props) => {
  const visibleChores = createMemo(() => {
    const data = props.choreData();
    return getFilteredChores(
      data.chores,
      data.people,
      props.config.personFilter,
      props.todaysDayOfWeek()
    );
  });

  return (
    <div class="chore-list">
      <Show
        when={visibleChores().length > 0}
        fallback={<div class="empty-state">No chores match the current filter.</div>}
      >
        <For each={visibleChores()}>
          {(chore) => (
            <ChoreItem chore={chore} people={props.choreData().people} onToggle={props.onToggle} />
          )}
        </For>
      </Show>
    </div>
  );
};
