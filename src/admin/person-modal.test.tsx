import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { createPerson, updatePerson } from '../api';
import type { Person } from '../types/chore-types';
import { PersonModal } from './person-modal';
import { MockAdminProvider } from './test-utils';

// Mock API functions
vi.mock('../api', () => ({
  createPerson: vi.fn().mockResolvedValue(undefined),
  updatePerson: vi.fn().mockResolvedValue(undefined),
}));

// Mock color utility
vi.mock('../utils/browser', () => ({
  generatePastelColor: vi.fn(() => '#FF6B6B'),
}));

describe('PersonModal', () => {
  describe('Create Person Mode', () => {
    it('should render create form when no initial person', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider>
          <PersonModal initialPerson={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      expect(container.querySelector('h3')?.textContent).toBe('Add Person');
      expect(container.querySelector('#personName')).toBeTruthy();
      expect(container.querySelector('#personColor')).toBeTruthy();
    });

    it('should generate default color when creating new person', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider>
          <PersonModal initialPerson={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const colorInput = container.querySelector('#personColor') as HTMLInputElement;
      expect(colorInput?.value.toLowerCase()).toBe('#ff6b6b');
    });
  });

  describe('Edit Person Mode', () => {
    it('should render edit form when initial person provided', () => {
      const closeModal = vi.fn();
      const initialPerson: Person = { id: 'p1', name: 'Alice', color: '#FF6B6B' };

      const { container } = render(() => (
        <MockAdminProvider>
          <PersonModal initialPerson={initialPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      expect(container.querySelector('h3')?.textContent).toBe('Edit Person');
      const nameInput = container.querySelector('#personName') as HTMLInputElement;
      const colorInput = container.querySelector('#personColor') as HTMLInputElement;

      expect(nameInput?.value).toBe('Alice');
      expect(colorInput?.value.toLowerCase()).toBe('#ff6b6b');
    });

    it('should click save button in edit mode', async () => {
      const closeModal = vi.fn();
      const initialPerson: Person = { id: 'p1', name: 'Alice', color: '#FF6B6B' };

      render(() => (
        <MockAdminProvider>
          <PersonModal initialPerson={initialPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const saveButton = page.getByRole('button', { name: 'Save' });
      expect(saveButton.element()).toBeVisible();
      await saveButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(updatePerson).toHaveBeenCalledWith('p1', expect.any(Object));
    });
  });

  describe('Form Interactions', () => {
    it('should click cancel button', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <PersonModal initialPerson={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const cancelButton = page.getByRole('button', { name: 'Cancel' });
      expect(cancelButton.element()).toBeVisible();
      await cancelButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(createPerson).not.toHaveBeenCalled();
    });

    it('should click add button', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <PersonModal initialPerson={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      // Fill in the name field
      await page.getByLabelText('Name').fill('Test Person');

      const addButton = page.getByRole('button', { name: 'Add' });
      expect(addButton.element()).toBeVisible();
      await addButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(createPerson).toHaveBeenCalled();
    });

    it('should render PIN field when pinRequired is true', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider pinRequired={true}>
          <PersonModal initialPerson={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const pinInput = container.querySelector('#adminPin') as HTMLInputElement;
      expect(pinInput).toBeTruthy();
      expect(pinInput.type).toBe('password');

      const rememberCheckbox = container.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      expect(rememberCheckbox).toBeTruthy();
      expect(rememberCheckbox.checked).toBe(false);
    });

    it('should include PIN in request when pinRequired is true', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider pinRequired={true}>
          <PersonModal initialPerson={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await page.getByLabelText('Name').fill('Test Person');
      await page.getByLabelText('Admin PIN').fill('1234');

      const addButton = page.getByRole('button', { name: 'Add' });
      await addButton.click();

      expect(createPerson).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Person',
          pin: '1234',
        })
      );
    });

    it('should hide PIN field when cachedPin is provided', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider pinRequired={true} initialCachedPin="5678">
          <PersonModal initialPerson={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const pinInput = container.querySelector('#adminPin');
      expect(pinInput).toBeFalsy();
    });

    it('should use cachedPin in request when provided', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider pinRequired={true} initialCachedPin="5678">
          <PersonModal initialPerson={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await page.getByLabelText('Name').fill('Test Person');

      const addButton = page.getByRole('button', { name: 'Add' });
      await addButton.click();

      expect(createPerson).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Person',
          pin: '5678',
        })
      );
    });
  });
});
