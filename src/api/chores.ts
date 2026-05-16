import type { CreateChoreRequest, UpdateChoreRequest } from '../types/request-types';
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

export const deleteChore = async (id: string): Promise<void> => {
  validateId(id);
  const response = await fetch(`${API_BASE_URL}/chores/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
};
