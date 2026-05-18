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
