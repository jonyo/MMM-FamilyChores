import type { DailyCompletion } from '../types/chore-types';
import { API_BASE_URL, handleResponse } from './client';

export const getHistory = async (personId?: string): Promise<DailyCompletion[]> => {
  const url = personId ? `${API_BASE_URL}/history?personId=${personId}` : `${API_BASE_URL}/history`;
  const response = await fetch(url);
  return (await handleResponse(response)) as DailyCompletion[];
};
