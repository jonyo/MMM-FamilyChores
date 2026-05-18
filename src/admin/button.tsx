import type { Component } from 'solid-js';

export type ButtonVariant = 'primary' | 'secondary' | 'warning' | 'danger' | 'success';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: 'sm';
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
  id?: string;
  dataTestId?: string;
  class?: string;
  classList?: { [key: string]: boolean | undefined };
  children: string;
}

export const Button: Component<ButtonProps> = (props) => {
  return (
    <button
      id={props.id}
      data-testid={props.dataTestId}
      type={props.type ?? 'button'}
      class="cursor-pointer rounded-lg border-none px-5 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md"
      classList={{
        'bg-indigo-600 text-white hover:bg-indigo-700': props.variant === 'primary',
        'bg-gray-600 text-white hover:bg-gray-700': props.variant === 'secondary',
        'bg-yellow-500 text-gray-900 hover:bg-yellow-600': props.variant === 'warning',
        'bg-red-600 text-white hover:bg-red-700': props.variant === 'danger',
        'bg-green-600 text-white hover:bg-green-700': props.variant === 'success',
        'px-3 py-1.5 text-xs': props.size === 'sm',
        [props.class || '']: !!props.class,
        ...props.classList,
      }}
      disabled={props.disabled}
      onClick={(event) => props.onClick?.(event)}
    >
      {props.children}
    </button>
  );
};
