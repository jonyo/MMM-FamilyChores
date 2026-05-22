import type { ParentComponent } from 'solid-js';

/**
 * Inline info box for contextual help text within the admin panel.
 */
export const InfoBox: ParentComponent = (props) => (
  <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
    {props.children}
  </div>
);
