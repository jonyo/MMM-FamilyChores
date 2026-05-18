import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import './settings-modal.css';
import './buttons.css';
import './forms.css';
import './modals.css';
import { updateSettings } from '../api';
import type { Settings } from '../types/chore-types';
import type { UpdateSettingsRequest } from '../types/request-types';

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
    <div class="modal active">
      <div class="modal-content">
        <h3>Settings</h3>
        <form onSubmit={handleSubmit}>
          <div class="form-group">
            <label for="dailyResetTime">Daily Reset Time (24-hour format, HH:mm)</label>
            <input
              type="time"
              id="dailyResetTime"
              value={dailyResetTime()}
              onInput={(e) => setDailyResetTime(e.currentTarget.value)}
              required
            />
            <small class="form-help">Time when daily chore reset occurs. Default: 03:00</small>
            <br />
            <small class="form-help">
              <strong>Tip:</strong> Set to at least 03:00 to avoid daylight savings time changes (no
              roll forward/back occurs after 3am)
            </small>
          </div>
          <div class="form-group">
            <label>
              <input
                type="checkbox"
                id="historyEnabled"
                checked={historyEnabled()}
                onInput={(e) => setHistoryEnabled(e.currentTarget.checked)}
              />
              Enable History Tracking
            </label>
            <small class="form-help">Track daily chore completions (keeps last 14 days)</small>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onClick={() => props.closeModal()}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
