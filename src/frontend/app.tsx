import type { Accessor, Component } from 'solid-js';
import { Show } from 'solid-js';
import type { DayOfWeek, FamilyChoresData } from '../types/chore-types';
import type { Config } from '../types/config';
import { PersonalView } from './personal-view';
import { SummaryView } from './summary-view';

interface AppProps {
  /** Reactive accessor to chore data (null while loading) */
  choreData: Accessor<FamilyChoresData | null>;
  /** Reactive accessor for today's day of week (updates at midnight) */
  todaysDayOfWeek: Accessor<DayOfWeek>;
  /** Reactive accessor for current local time in HH:MM (updates every minute) */
  currentTime: Accessor<string>;
  /** Module configuration */
  config: Config;
  /** Callback when a chore checkbox is toggled */
  onToggle: (choreId: string, completed: boolean) => void;
}

export const App: Component<AppProps> = (props) => {
  return (
    <div class="module-content">
      <Show when={props.choreData()} fallback={<div class="loading">Loading...</div>}>
        {(dataAccessor) => (
          <Show
            when={props.config.viewMode === 'summary'}
            fallback={
              <PersonalView
                choreData={dataAccessor}
                todaysDayOfWeek={props.todaysDayOfWeek}
                currentTime={props.currentTime}
                config={props.config}
                onToggle={props.onToggle}
              />
            }
          >
            <SummaryView
              choreData={dataAccessor}
              todaysDayOfWeek={props.todaysDayOfWeek}
              currentTime={props.currentTime}
              config={props.config}
              onToggle={props.onToggle}
            />
          </Show>
        )}
      </Show>
    </div>
  );
};
