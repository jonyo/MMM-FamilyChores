import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { HelpIcon } from './help-icon';
import { Tooltip } from './tooltip';

interface PinFieldProps {
  pin: string;
  onPinChange: (pin: string) => void;
  remember?: boolean;
  onRememberChange?: (remember: boolean) => void;
}

/**
 * Reusable PIN input field for admin modals.
 */
export const PinField: Component<PinFieldProps> = (props) => {
  const [showPin, setShowPin] = createSignal(false);

  return (
    <div class="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <label for="adminPin" class="mb-2 block font-medium text-amber-900">
        Admin PIN <span class="text-amber-700">*</span>
      </label>
      <div class="flex gap-2">
        <input
          type={showPin() ? 'text' : 'password'}
          id="adminPin"
          value={props.pin}
          onInput={(e) => props.onPinChange(e.currentTarget.value)}
          placeholder="Enter admin PIN"
          required
          class="flex-1 rounded-lg border border-amber-300 p-2.5 text-base transition-colors focus:border-amber-600 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShowPin(!showPin())}
          class="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-amber-800 transition-colors hover:bg-amber-100"
        >
          <Show when={showPin()} fallback="👁">
            🙈
          </Show>
        </button>
      </div>
      <Show when={props.onRememberChange}>
        <label class="mt-3 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={props.remember ?? false}
            onInput={(e) => props.onRememberChange?.(e.currentTarget.checked)}
            class="size-4.5 cursor-pointer"
          />
          Remember PIN for 10 minutes
          <HelpIcon
            text="PIN is remembered for 10 minutes or until you refresh or close the window"
            align="center"
            multiline
            class="ml-1"
          />
        </label>
      </Show>
      <small class="mt-1 block text-sm text-amber-700">PIN is required to make changes</small>
      <div class="mt-1">
        <Tooltip
          text="SSH into the MagicMirror and edit the adminPin value in the module's data file directly"
          position="above"
          align="left"
          multiline
        >
          <button type="button" class="cursor-help text-sm text-indigo-600 underline">
            Forgot PIN?
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
