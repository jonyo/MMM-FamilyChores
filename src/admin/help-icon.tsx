import type { Component } from 'solid-js';
import type { TooltipAlign, TooltipPosition } from './tooltip';
import { Tooltip } from './tooltip';

interface HelpIconProps {
  /** Tooltip text displayed on hover */
  text: string;
  /** Tooltip position relative to the icon */
  position?: TooltipPosition;
  /** Tooltip alignment */
  align?: TooltipAlign;
  /** Whether the tooltip text spans multiple lines */
  multiline?: boolean;
  /** Additional CSS classes applied to the icon wrapper */
  class?: string;
  /** Optional test ID for the tooltip element */
  dataTestId?: string;
}

/**
 * A small circular question-mark icon with a tooltip.
 * Use next to labels or controls that need extra explanation.
 */
export const HelpIcon: Component<HelpIconProps> = (props) => (
  <Tooltip
    text={props.text}
    position={props.position}
    align={props.align}
    multiline={props.multiline}
    class={`inline-flex size-5 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 ${props.class || ''}`}
    dataTestId={props.dataTestId || 'help-icon'}
  >
    ?
  </Tooltip>
);
