import type { Person } from '../types/chore-types';
import type { CreatePersonRequest, UpdatePersonRequest } from '../types/request-types';
import { validateId } from '../utils/validation';
import { API_BASE_URL, handleResponse } from './client';

export const createPerson = async (data: CreatePersonRequest): Promise<Person> => {
  const response = await fetch(`${API_BASE_URL}/people`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response) as Promise<Person>;
};

export const updatePerson = async (id: string, data: UpdatePersonRequest): Promise<Person> => {
  validateId(id);
  const response = await fetch(`${API_BASE_URL}/people/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response) as Promise<Person>;
};

export const deletePerson = async (id: string, pin?: string): Promise<void> => {
  validateId(id);
  const query = pin ? `?pin=${encodeURIComponent(pin)}` : '';
  const response = await fetch(`${API_BASE_URL}/people/${id}${query}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
};
