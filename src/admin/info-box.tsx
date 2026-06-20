import type { ParentComponent } from 'solid-js';
import { Show } from 'solid-js';

interface InfoBoxProps {
  /** When true, renders a circular info icon at the start of the box */
  icon?: boolean;
  /** Additional CSS classes applied to the box */
  class?: string;
}

/**
 * Inline info box for contextual help text within the admin panel.
 */
export const InfoBox: ParentComponent<InfoBoxProps> = (props) => (
  <div
    class={`flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 ${props.class || ''}`}
  >
    <Show when={props.icon}>
      <span class="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-xs font-bold text-slate-600">
        i
      </span>
    </Show>
    <div>{props.children}</div>
  </div>
);
