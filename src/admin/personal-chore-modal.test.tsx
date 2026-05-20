import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { createChore, updateChore } from '../api';
import type { Person, PersonalChore } from '../types/chore-types';
import { ChoreType, DayOfWeek, SkipDayVisibility } from '../types/chore-types';
import { PersonalChoreModal } from './personal-chore-modal';
import { MockAdminProvider } from './test-utils';

vi.mock('../api', () => ({
  createChore: vi.fn(),
  updateChore: vi.fn(),
}));

describe('PersonalChoreModal', () => {
  const mockPerson: Person = { id: 'p1', name: 'Alice', color: '#FF6B6B' };

  describe('Create Chore Mode', () => {
    it('should render create form when no initial chore', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <PersonalChoreModal
            person={mockPerson}
            initialChore={undefined}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('modal-title')).toBeVisible();
      expect(page.getByTestId('modal-title').element().textContent).toBe('Add Personal Chore');
      await expect.element(page.getByLabelText('Chore Name')).toBeVisible();
      await expect.element(page.getByLabelText('Deadline (optional)')).toBeVisible();
      await expect.element(page.getByTestId('assigned-person-display')).toBeVisible();
      await expect
        .element(page.getByTestId('assigned-person-display'))
        .toHaveTextContent('Assigned to: Alice');
    });

    it('should display person color badge', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <PersonalChoreModal
            person={mockPerson}
            initialChore={undefined}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('person-color-badge')).toBeVisible();
      const colorBadge = page.getByTestId('person-color-badge').element() as HTMLElement;
      expect(colorBadge?.style.backgroundColor).toBe('rgb(255, 107, 107)');
    });

    it('should click cancel button', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <PersonalChoreModal
            person={mockPerson}
            initialChore={undefined}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      const cancelButton = page.getByRole('button', { name: 'Cancel' });
      await expect.element(cancelButton).toBeVisible();
      await cancelButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(createChore).not.toHaveBeenCalled();
    });

    it('should click add button', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <PersonalChoreModal
            person={mockPerson}
            initialChore={undefined}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      // Fill in the chore name
      await page.getByLabelText('Chore Name').fill('Test Chore');

      const addButton = page.getByRole('button', { name: 'Add' });
      await expect.element(addButton).toBeVisible();
      await addButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(createChore).toHaveBeenCalled();
    });
  });

  describe('Edit Chore Mode', () => {
    it('should render edit form when initial chore provided', async () => {
      const closeModal = vi.fn();
      const initialChore: PersonalChore = {
        id: 'c1',
        name: 'Take out trash',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        skipDays: [DayOfWeek.SUNDAY],
        skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
        caughtUp: true,
        completedToday: false,
        deadline: '21:00',
      };

      render(() => (
        <MockAdminProvider>
          <PersonalChoreModal
            person={mockPerson}
            initialChore={initialChore}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('modal-title')).toBeVisible();
      expect(page.getByTestId('modal-title').element().textContent).toBe('Edit Personal Chore');

      await expect.element(page.getByLabelText('Chore Name')).toBeVisible();
      await expect.element(page.getByLabelText('Deadline (optional)')).toBeVisible();
      await expect.element(page.getByLabelText('Skip Day Visibility')).toBeVisible();
      await expect.element(page.getByLabelText('Chore Name')).toHaveValue('Take out trash');
      await expect.element(page.getByLabelText('Deadline (optional)')).toHaveValue('21:00');
      await expect
        .element(page.getByLabelText('Skip Day Visibility'))
        .toHaveValue('show-if-overdue');
    });

    it('should click save button in edit mode', async () => {
      const closeModal = vi.fn();
      const initialChore: PersonalChore = {
        id: 'c1',
        name: 'Take out trash',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        skipDays: [DayOfWeek.SUNDAY],
        skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
        caughtUp: true,
        completedToday: false,
        deadline: '21:00',
      };

      render(() => (
        <MockAdminProvider>
          <PersonalChoreModal
            person={mockPerson}
            initialChore={initialChore}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      const saveButton = page.getByRole('button', { name: 'Save' });
      await expect.element(saveButton).toBeVisible();
      await saveButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(updateChore).toHaveBeenCalled();
    });
  });

  describe('PIN caching', () => {
    it('should show PIN field when pinRequired and no cachedPin', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider pinRequired={true}>
          <PersonalChoreModal
            person={mockPerson}
            initialChore={undefined}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      await expect.element(page.getByLabelText('Admin PIN')).toBeVisible();
    });

    it('should hide PIN field when cachedPin is provided', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider pinRequired={true} initialCachedPin="5678">
          <PersonalChoreModal
            person={mockPerson}
            initialChore={undefined}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      expect(page.getByLabelText('Admin PIN').elements().length).toBe(0);
    });

    it('should use cachedPin in request', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider pinRequired={true} initialCachedPin="5678">
          <PersonalChoreModal
            person={mockPerson}
            initialChore={undefined}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      await page.getByLabelText('Chore Name').fill('Test Chore');

      const addButton = page.getByRole('button', { name: 'Add' });
      await addButton.click();

      expect(createChore).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Chore',
          pin: '5678',
        })
      );
      expect(closeModal).toHaveBeenCalled();
    });
  });
});
