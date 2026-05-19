import type {
  CopyChoresRequest,
  CreateChoreRequest,
  UpdateChoreRequest,
} from '../types/request-types';
import { validateId } from '../utils/validation';
import { API_BASE_URL, handleResponse } from './client';

export const createChore = async (data: CreateChoreRequest): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}/chores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateChore = async (id: string, data: UpdateChoreRequest): Promise<unknown> => {
  validateId(id);
  const response = await fetch(`${API_BASE_URL}/chores/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteChore = async (id: string, pin?: string): Promise<void> => {
  validateId(id);
  const query = pin ? `?pin=${encodeURIComponent(pin)}` : '';
  const response = await fetch(`${API_BASE_URL}/chores/${id}${query}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
};

export const copyChores = async (data: CopyChoresRequest): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/copy-chores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await handleResponse(response);
  } catch (error) {
    // Re-throw network errors with more context
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'Network error: Could not connect to the server. Is the admin server running?'
      );
    }
    throw error;
  }
};
