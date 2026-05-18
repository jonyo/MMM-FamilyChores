import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { updateSettings } from '../api';
import type { Settings } from '../types/chore-types';
import type { UpdateSettingsRequest } from '../types/request-types';
import { Button } from './button';

interface SettingsModalProps {
  initialSettings: Settings;
  closeModal: () => void;
}

export const SettingsModal: Component<SettingsModalProps> = (props) => {
  const [dailyResetTime, setDailyResetTime] = createSignal(props.initialSettings.dailyResetTime);
  const [historyEnabled, setHistoryEnabled] = createSignal(props.initialSettings.historyEnabled);

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    try {
      const body: UpdateSettingsRequest = {
        dailyResetTime: dailyResetTime(),
        historyEnabled: historyEnabled(),
      };
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
        <h3 class="mb-5 text-2xl text-indigo-600">Settings</h3>
        <form onSubmit={handleSubmit}>
          <div class="mb-5">
            <label for="dailyResetTime" class="mb-3 block font-medium text-slate-900">
              Daily Reset Time (24-hour format, HH:mm)
            </label>
            <input
              type="time"
              id="dailyResetTime"
              value={dailyResetTime()}
              onInput={(e) => setDailyResetTime(e.currentTarget.value)}
              required
              class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"
            />
            <small class="text-sm text-slate-500">
              Time when daily chore reset occurs. Default: 03:00
            </small>
            <br />
            <small class="text-sm text-slate-500">
              <strong>Tip:</strong> Set to at least 03:00 to avoid daylight savings time changes (no
              roll forward/back occurs after 3am)
            </small>
          </div>
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
