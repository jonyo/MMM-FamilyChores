import type { Component } from 'solid-js';

interface LaterChoresIndicatorProps {
  /** Number of chores hidden because their startTime has not been reached yet */
  count: number;
}

/**
 * A non-interactive placeholder that tells the user there are more chores coming later today.
 */
export const LaterChoresIndicator: Component<LaterChoresIndicatorProps> = (props) => {
  return (
    <div class="later-chores-indicator" data-testid="later-chores-indicator">
      <span class="later-chores-icon">&#x23F0;</span>
      <span class="later-chores-text">
        {props.count} more {props.count === 1 ? 'chore starts' : 'chores start'} later
      </span>
    </div>
  );
};
