import type { Accessor, Component } from 'solid-js';
import { Show } from 'solid-js';
import type { FamilyChoresData } from '../types/chore-types';
import type { Config } from '../types/config';
import { PersonalView } from './personal-view';
import { SummaryView } from './summary-view';

interface AppProps {
  /** Reactive accessor to chore data (null while loading) */
  choreData: Accessor<FamilyChoresData | null>;
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
          <>
            {props.config.viewMode === 'summary' ? (
              <SummaryView
                choreData={dataAccessor}
                config={props.config}
                onToggle={props.onToggle}
              />
            ) : (
              <PersonalView
                choreData={dataAccessor}
                config={props.config}
                onToggle={props.onToggle}
              />
            )}
          </>
        )}
      </Show>
    </div>
  );
};
