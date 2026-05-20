import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { updateSettings } from '../api';
import type { UpdateSettingsRequest } from '../types/request-types';
import { useAdminContext } from './admin-context';
import { Button } from './button';

interface SettingsModalProps {
  closeModal: () => void;
}

export const SettingsModal: Component<SettingsModalProps> = (props) => {
  const { choreData } = useAdminContext();
  const settings = () => choreData().settings;

  const [historyEnabled, setHistoryEnabled] = createSignal(settings().historyEnabled);
  const [pinEnabled, setPinEnabled] = createSignal(!!settings().adminPin);
  const [currentPin, setCurrentPin] = createSignal('');
  const [newPin, setNewPin] = createSignal('');
  const [confirmPin, setConfirmPin] = createSignal('');
  const [changePin, setChangePin] = createSignal(false);
  const [showCurrentPin, setShowCurrentPin] = createSignal(false);
  const [showNewPin, setShowNewPin] = createSignal(false);
  const [showConfirmPin, setShowConfirmPin] = createSignal(false);

  const hasPin = () => !!settings().adminPin;

  const handleSubmit = async (event: Event) => {
    event.preventDefault();

    const isEnabled = pinEnabled();
    const hadPin = hasPin();

    if (hadPin && isEnabled && currentPin() === '') {
      alert('Current PIN is required to save settings');
      return;
    }

    if (isEnabled && (!hadPin || changePin())) {
      if (newPin() === '') {
        alert('PIN cannot be empty when PIN protection is enabled');
        return;
      }
      if (newPin() !== confirmPin()) {
        alert('New PIN and confirmation do not match');
        return;
      }
    }

    if (hadPin && !isEnabled && currentPin() === '') {
      alert('Current PIN is required to disable PIN protection');
      return;
    }

    try {
      const body: UpdateSettingsRequest = {
        historyEnabled: historyEnabled(),
        pin: hadPin ? currentPin() || undefined : undefined,
      };

      if (!isEnabled) {
        body.adminPin = null;
      } else if (!hadPin) {
        body.adminPin = newPin();
      } else if (changePin() && newPin()) {
        body.adminPin = newPin();
      }

      await updateSettings(body);
      props.closeModal();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div class="fixed inset-0 z-1000 flex  items-center justify-center bg-black/50">
      <div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-2xl text-indigo-600">Settings</h3>
          <button
            type="button"
            class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"
            aria-label="Close"
            onClick={() => props.closeModal()}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div class="mb-5">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                id="historyEnabled"
                checked={historyEnabled()}
                onInput={(e) => setHistoryEnabled(e.currentTarget.checked)}
                class="size-4.5  cursor-pointer"
              />
              Enable History Tracking
            </label>
            <small class="mt-2 block text-sm text-slate-500">
              Track daily chore completions (keeps last 14 days)
            </small>
          </div>
          <div class="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 class="mb-3 font-medium text-slate-900">Admin PIN Protection</h4>
            <label class="mb-4 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={pinEnabled()}
                onInput={(e) => {
                  setPinEnabled(e.currentTarget.checked);
                  setChangePin(false);
                  setNewPin('');
                  setConfirmPin('');
                }}
                class="size-4.5 cursor-pointer"
              />
              Enable PIN Protection
            </label>

            <Show when={pinEnabled()}>
              <div class="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <strong>Note:</strong> This PIN is a basic deterrent only. It is stored in plain
                text in the module's data file. It is <strong>not</strong> intended for
                high-security environments. Do not expose the admin panel outside your local
                network. See the module README for more details.
              </div>
              <Show when={hasPin()}>
                <div class="mb-3">
                  <label for="currentPin" class="mb-2 block font-medium text-amber-900">
                    Current PIN <span class="text-amber-700">*</span>
                  </label>
                  <div class="flex gap-2">
                    <input
                      type={showCurrentPin() ? 'text' : 'password'}
                      id="currentPin"
                      value={currentPin()}
                      onInput={(e) => setCurrentPin(e.currentTarget.value)}
                      placeholder="Enter current PIN to save changes"
                      required
                      class="flex-1 rounded-lg border border-amber-300 p-2.5 text-base transition-colors focus:border-amber-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPin(!showCurrentPin())}
                      class="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-amber-800 transition-colors hover:bg-amber-100"
                    >
                      {showCurrentPin() ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <label class="mb-3 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={changePin()}
                    onInput={(e) => {
                      setChangePin(e.currentTarget.checked);
                      setNewPin('');
                      setConfirmPin('');
                    }}
                    class="size-4.5 cursor-pointer"
                  />
                  Change PIN
                </label>
              </Show>

              <Show when={!hasPin() || changePin()}>
                <div class="mb-3">
                  <label for="newPin" class="mb-2 block font-medium text-slate-900">
                    {hasPin() ? 'New PIN' : 'Set PIN'} <span class="text-amber-700">*</span>
                  </label>
                  <div class="flex gap-2">
                    <input
                      type={showNewPin() ? 'text' : 'password'}
                      id="newPin"
                      value={newPin()}
                      onInput={(e) => setNewPin(e.currentTarget.value)}
                      placeholder={
                        hasPin() ? 'Enter new PIN' : 'Enter PIN to protect admin actions'
                      }
                      required
                      class="flex-1 rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin())}
                      class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-100"
                    >
                      {showNewPin() ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="confirmPin" class="mb-2 block font-medium text-slate-900">
                    Confirm PIN <span class="text-amber-700">*</span>
                  </label>
                  <div class="flex gap-2">
                    <input
                      type={showConfirmPin() ? 'text' : 'password'}
                      id="confirmPin"
                      value={confirmPin()}
                      onInput={(e) => setConfirmPin(e.currentTarget.value)}
                      placeholder="Confirm PIN"
                      required
                      class="flex-1 rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin())}
                      class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-100"
                    >
                      {showConfirmPin() ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <small class="block text-sm text-slate-500">
                  PIN can be any combination of letters, numbers, or symbols. There is no length
                  limit.
                </small>
              </Show>
            </Show>

            <Show when={!pinEnabled() && hasPin()}>
              <div class="mb-3">
                <label for="currentPin" class="mb-2 block font-medium text-amber-900">
                  Current PIN <span class="text-amber-700">*</span>
                </label>
                <div class="flex gap-2">
                  <input
                    type={showCurrentPin() ? 'text' : 'password'}
                    id="currentPin"
                    value={currentPin()}
                    onInput={(e) => setCurrentPin(e.currentTarget.value)}
                    placeholder="Enter current PIN to disable protection"
                    required
                    class="flex-1 rounded-lg border border-amber-300 p-2.5 text-base transition-colors focus:border-amber-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin())}
                    class="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-amber-800 transition-colors hover:bg-amber-100"
                  >
                    {showCurrentPin() ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
            </Show>

            <small class="block text-sm text-slate-500">
              When enabled, a PIN is required for all admin actions including backup, restore, and
              modifying people or chores.
            </small>
          </div>
          <div class="mt-6 flex justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={() => props.closeModal()}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
