import type { Component, JSX } from 'solid-js';
import { mergeProps } from 'solid-js';

export type TooltipPosition = 'above' | 'below' | 'left' | 'right' | 'above-right' | 'below-right';

export type TooltipAlign = 'left' | 'center' | 'right';

export interface TooltipProps {
  children: JSX.Element;
  text: string;
  position?: TooltipPosition;
  align?: TooltipAlign;
  multiline?: boolean;
  class?: string;
  classList?: { [key: string]: boolean | undefined };
}

export const Tooltip: Component<TooltipProps> = (rawProps) => {
  const props = mergeProps(
    {
      position: 'above' as TooltipPosition,
      align: 'left' as TooltipAlign,
      multiline: false,
      class: '',
      classList: {} as { [key: string]: boolean | undefined },
    },
    rawProps
  );

  return (
    <span
      classList={{
        tooltip: !!props.text,
        'tooltip-multiline': !!props.text && props.multiline,
        [`tooltip-${props.position}`]: !!props.text,
        [`tooltip-align-${props.align}`]: !!props.text,
        [props.class || '']: !!props.class,
        ...props.classList,
      }}
      data-tooltip={props.text || ''}
      data-testid="tooltip"
    >
      {props.children}
    </span>
  );
};
