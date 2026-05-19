import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { Button } from './button';
import { Tooltip } from './tooltip';

interface PinPromptModalProps {
  title: string;
  message: string;
  onConfirm: (pin: string, remember: boolean) => void;
  onCancel: () => void;
}

export const PinPromptModal: Component<PinPromptModalProps> = (props) => {
  const [pin, setPin] = createSignal('');
  const [showPin, setShowPin] = createSignal(false);
  const [remember, setRemember] = createSignal(false);

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    if (pin().trim() === '') return;
    props.onConfirm(pin().trim(), remember());
  };

  return (
    <div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50">
      <div class="w-[90%] max-w-[400px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200">
        <h3 class="mb-2 text-xl text-indigo-600">{props.title}</h3>
        <p class="mb-5 text-sm text-slate-600">{props.message}</p>
        <form onSubmit={handleSubmit}>
          <div class="mb-5">
            <label for="pinPromptInput" class="mb-2 block font-medium text-amber-900">
              PIN
            </label>
            <div class="flex gap-2">
              <input
                type={showPin() ? 'text' : 'password'}
                id="pinPromptInput"
                value={pin()}
                onInput={(e) => setPin(e.currentTarget.value)}
                placeholder="Enter PIN"
                required
                autofocus
                class="flex-1 rounded-lg border border-amber-300 p-2.5 text-base transition-colors focus:border-amber-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin())}
                class="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-amber-800 transition-colors hover:bg-amber-100"
              >
                {showPin() ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <label class="mb-5 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={remember()}
              onInput={(e) => setRemember(e.currentTarget.checked)}
              class="size-4.5 cursor-pointer"
            />
            Remember PIN for 10 minutes
            <span
              title="PIN is remembered for 10 minutes or until you refresh or close the window"
              class="ml-1 cursor-help text-slate-400"
            >
              &#9432;
            </span>
          </label>
          <div class="mb-5">
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
          <div class="flex justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={props.onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
