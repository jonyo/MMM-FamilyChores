import type { ParentComponent } from 'solid-js';
import { mergeProps } from 'solid-js';

export type TooltipPosition = 'above' | 'below' | 'left' | 'right' | 'above-right' | 'below-right';

export type TooltipAlign = 'left' | 'center' | 'right';

export interface TooltipProps {
  text: string;
  position?: TooltipPosition;
  align?: TooltipAlign;
  multiline?: boolean;
  class?: string;
  classList?: { [key: string]: boolean | undefined };
  dataTestId?: string;
}

export const Tooltip: ParentComponent<TooltipProps> = (rawProps) => {
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
        'tooltip-above': !!props.text && props.position === 'above',
        'tooltip-below': !!props.text && props.position === 'below',
        'tooltip-left': !!props.text && props.position === 'left',
        'tooltip-right': !!props.text && props.position === 'right',
        'tooltip-above-right': !!props.text && props.position === 'above-right',
        'tooltip-below-right': !!props.text && props.position === 'below-right',
        'tooltip-align-left': !!props.text && props.align === 'left',
        'tooltip-align-center': !!props.text && props.align === 'center',
        'tooltip-align-right': !!props.text && props.align === 'right',
        [props.class || '']: !!props.class,
        ...props.classList,
      }}
      data-tooltip={props.text || ''}
      data-testid={props.dataTestId || 'tooltip'}
    >
      {props.children}
    </span>
  );
};
