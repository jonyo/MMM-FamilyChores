import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { createPerson, updatePerson } from '../api';
import type { Person } from '../types/chore-types';
import { PersonModal } from './person-modal';
import { MockAdminProvider } from './test-utils';

vi.mock('../api', () => ({
  createPerson: vi.fn().mockResolvedValue(undefined),
  updatePerson: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/browser', () => ({
  generatePastelColor: vi.fn(() => '#FF6B6B'),
}));

describe('PersonModal', () => {
  describe('Create Person Mode', () => {
    it('should render create form when no initial person', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <PersonModal initialPerson={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('modal-title')).toBeVisible();
      expect(page.getByTestId('modal-title').element().textContent).toBe('Add Person');
      await expect.element(page.getByLabelText('Name')).toBeVisible();
      await expect.element(page.getByLabelText('Text Color')).toBeVisible();
    });

    it('should generate default color when creating new person', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <PersonModal initialPerson={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByLabelText('Text Color')).toBeVisible();
      await expect.element(page.getByLabelText('Text Color')).toHaveValue('#ff6b6b');
    });
  });

  describe('Edit Person Mode', () => {
    it('should render edit form when initial person provided', async () => {
      const closeModal = vi.fn();
      const initialPerson: Person = { id: 'p1', name: 'Alice', color: '#FF6B6B' };

      render(() => (
        <MockAdminProvider>
          <PersonModal initialPerson={initialPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('modal-title')).toBeVisible();
      expect(page.getByTestId('modal-title').element().textContent).toBe('Edit Person');
      await expect.element(page.getByLabelText('Name')).toBeVisible();
      await expect.element(page.getByLabelText('Text Color')).toBeVisible();
      await expect.element(page.getByLabelText('Name')).toHaveValue('Alice');
      await expect.element(page.getByLabelText('Text Color')).toHaveValue('#ff6b6b');
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
      await expect.element(saveButton).toBeVisible();
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
      await expect.element(cancelButton).toBeVisible();
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
      await expect.element(addButton).toBeVisible();
      await addButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(createPerson).toHaveBeenCalled();
    });

    it('should render PIN field when pinRequired is true', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider pinRequired={true}>
          <PersonModal initialPerson={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const pinInput = page.getByLabelText('Admin PIN');
      await expect.element(pinInput).toBeVisible();
      expect(pinInput.element().getAttribute('type')).toBe('password');

      const rememberCheckbox = page.getByRole('checkbox');
      await expect.element(rememberCheckbox).toBeVisible();
      await expect.element(rememberCheckbox).not.toBeChecked();
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

    it('should hide PIN field when cachedPin is provided', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider pinRequired={true} initialCachedPin="5678">
          <PersonModal initialPerson={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      expect(page.getByLabelText('Admin PIN').elements().length).toBe(0);
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
