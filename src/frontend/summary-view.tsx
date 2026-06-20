import type { Accessor, Component } from 'solid-js';
import { createMemo, For, Show } from 'solid-js';
import type { DayOfWeek, FamilyChoresData } from '../types/chore-types';
import type { Config } from '../types/config';
import {
  getHiddenLaterChores,
  getSummaryChores,
  getSummaryConfig,
  isChoreOverdue,
} from './chore-filters';
import { IncompleteByPerson } from './incomplete-by-person';
import { OverdueByPerson } from './overdue-by-person';
import { RotatingChoreInline } from './rotating-chore-inline';

interface SummaryViewProps {
  /** Accessor to the chore data (reactive) */
  choreData: Accessor<FamilyChoresData>;
  /** Reactive accessor for today's day of week (updates at midnight) */
  todaysDayOfWeek: Accessor<DayOfWeek>;
  /** Reactive accessor for current local time in HH:MM (updates every minute) */
  currentTime: Accessor<string>;
  /** Module configuration */
  config: Config;
  /** Callback when a chore checkbox is toggled */
  onToggle: (choreId: string, completed: boolean) => void;
}

export const SummaryView: Component<SummaryViewProps> = (props) => {
  const summaryConfig = () => getSummaryConfig(props.config);

  const visibleChores = createMemo(() => {
    const data = props.choreData();
    return getSummaryChores(data.chores, props.todaysDayOfWeek(), props.currentTime());
  });

  const incompleteChores = createMemo(() =>
    visibleChores().filter((chore) => !chore.completedToday)
  );

  const overdueChores = createMemo(() =>
    visibleChores().filter((chore) => isChoreOverdue(chore, props.currentTime()))
  );

  const rotatingChores = createMemo(() =>
    visibleChores().filter((chore) => chore.type === 'rotating')
  );

  const hiddenLaterChores = createMemo(() =>
    getHiddenLaterChores(
      props.choreData().chores,
      props.choreData().people,
      props.config.personFilter,
      props.todaysDayOfWeek(),
      props.currentTime()
    )
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
              hiddenLaterChores={hiddenLaterChores()}
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
