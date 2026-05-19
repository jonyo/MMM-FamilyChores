import type { Settings } from '../types/chore-types';
import type { UpdateSettingsRequest } from '../types/request-types';
import { API_BASE_URL, handleResponse } from './client';

/**
 * Update global settings
 */
export const updateSettings = async (data: UpdateSettingsRequest): Promise<Settings> => {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return (await handleResponse(response)) as Settings;
};

/**
 * Download backup JSON. Requires PIN if adminPin is configured.
 */
export const downloadBackup = async (pin?: string): Promise<Blob> => {
  const query = pin ? `?pin=${encodeURIComponent(pin)}` : '';
  const response = await fetch(`${API_BASE_URL}/backup${query}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData?.error) {
      throw new Error(errorData.error);
    }
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.blob();
};
