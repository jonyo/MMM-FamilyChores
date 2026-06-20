import type { Component } from 'solid-js';
import { Button } from './button';

/** Props for the SystemActionsTab component */
interface SystemActionsTabProps {
  /** Callback to advance all rotations */
  onAdvanceRotations: () => void;
  /** Callback to reset all caught up state */
  onResetCaughtUp: () => void;
}

/** Tab showing system-level actions for the chore module */
export const SystemActionsTab: Component<SystemActionsTabProps> = (props) => {
  return (
    <section data-testid="system-actions-section">
      <div class="mb-5">
        <h2 class="m-0 border-b-2 border-amber-500 pb-2.5 text-2xl text-amber-600">
          System Actions
        </h2>
        <p class="mt-3 text-sm text-slate-500">
          Coming back from vacation? Just set up the mirror after it hasn't been used in a while?
          These tools help you quickly reset or resync the chore state so everything reflects
          reality again.
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="warning"
          onClick={props.onAdvanceRotations}
          dataTestId="advance-rotations-btn"
        >
          ↻ Advance All Rotations
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={props.onResetCaughtUp}
          dataTestId="reset-caught-up-btn"
        >
          ✓ Reset All Caught Up
        </Button>
      </div>
    </section>
  );
};
