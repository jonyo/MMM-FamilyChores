import type { Person } from '../types/chore-types';
import type { CreatePersonRequest, UpdatePersonRequest } from '../types/request-types';
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
  const response = await fetch(`${API_BASE_URL}/people/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response) as Promise<Person>;
};

export const deletePerson = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/people/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
};
