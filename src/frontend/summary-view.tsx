import type { Accessor, Component } from 'solid-js';
import { createMemo, For, Show } from 'solid-js';
import type { FamilyChoresData } from '../types/chore-types';
import type { Config } from '../types/config';
import { DeadlineStatus, getDeadlineStatus } from '../utils/date';
import { getSummaryChores, getSummaryConfig } from './chore-filters';
import { IncompleteByPerson } from './incomplete-by-person';
import { OverdueByPerson } from './overdue-by-person';
import { RotatingChoreInline } from './rotating-chore-inline';

interface SummaryViewProps {
  /** Accessor to the chore data (reactive) */
  choreData: Accessor<FamilyChoresData>;
  /** Module configuration */
  config: Config;
  /** Callback when a chore checkbox is toggled */
  onToggle: (choreId: string, completed: boolean) => void;
}

export const SummaryView: Component<SummaryViewProps> = (props) => {
  const summaryConfig = () => getSummaryConfig(props.config);

  const visibleChores = createMemo(() => {
    const data = props.choreData();
    return getSummaryChores(data.chores);
  });

  const incompleteChores = createMemo(() =>
    visibleChores().filter((chore) => !chore.completedToday)
  );

  const overdueChores = createMemo(() =>
    visibleChores().filter((chore) => {
      const status = getDeadlineStatus(chore.deadline, chore.completedToday, chore.caughtUp);
      return status === DeadlineStatus.OVERDUE;
    })
  );

  const rotatingChores = createMemo(() =>
    visibleChores().filter((chore) => chore.type === 'rotating')
  );

  return (
    <div class="summary-view">
      <Show when={summaryConfig().showIncomplete && incompleteChores().length > 0}>
        <div class="summary-section incomplete-section">
          <h3 class="section-title incomplete-title">{summaryConfig().incompleteTitle}</h3>
          <div class="incomplete-list">
            <IncompleteByPerson
              incompleteChores={incompleteChores()}
              people={props.choreData().people}
            />
          </div>
        </div>
      </Show>

      <Show when={summaryConfig().showRotating && rotatingChores().length > 0}>
        <div class="summary-section rotating-section">
          <h3 class="section-title rotating-title">{summaryConfig().rotatingTitle}</h3>
          <div class="chore-list">
            <For each={rotatingChores()}>
              {(chore) => (
                <RotatingChoreInline
                  chore={chore}
                  people={props.choreData().people}
                  onToggle={props.onToggle}
                />
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={summaryConfig().showOverdue && overdueChores().length > 0}>
        <div class="summary-section overdue-section">
          <h3 class="section-title overdue-title">{summaryConfig().overdueTitle}</h3>
          <div class="overdue-list">
            <OverdueByPerson overdueChores={overdueChores()} people={props.choreData().people} />
          </div>
        </div>
      </Show>
    </div>
  );
};
