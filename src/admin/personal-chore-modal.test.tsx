import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { createChore, updateChore } from '../api';
import type { Person, PersonalChore } from '../types/chore-types';
import { ChoreType, DayOfWeek, SkipDayVisibility } from '../types/chore-types';
import { PersonalChoreModal } from './personal-chore-modal';
import { MockAdminProvider } from './test-utils';

// Mock API functions
vi.mock('../api', () => ({
  createChore: vi.fn(),
  updateChore: vi.fn(),
}));

describe('PersonalChoreModal', () => {
  const mockPerson: Person = { id: 'p1', name: 'Alice', color: '#FF6B6B' };

  describe('Create Chore Mode', () => {
    it('should render create form when no initial chore', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider>
          <PersonalChoreModal
            person={mockPerson}
            initialChore={undefined}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      expect(container.querySelector('h3')?.textContent).toBe('Add Personal Chore');
      expect(container.querySelector('#choreName')).toBeTruthy();
      expect(container.querySelector('#deadline')).toBeTruthy();
      expect(container.querySelector('[data-testid="assigned-person-display"]')).toBeTruthy();
      expect(
        container.querySelector('[data-testid="assigned-person-display"]')?.textContent
      ).toContain('Assigned to: Alice');
    });

    it('should display person color badge', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider>
          <PersonalChoreModal
            person={mockPerson}
            initialChore={undefined}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      const colorBadge = container.querySelector(
        '[data-testid="person-color-badge"]'
      ) as HTMLElement;
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
      expect(cancelButton.element()).toBeVisible();
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
      expect(addButton.element()).toBeVisible();
      await addButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(createChore).toHaveBeenCalled();
    });
  });

  describe('Edit Chore Mode', () => {
    it('should render edit form when initial chore provided', () => {
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

      const { container } = render(() => (
        <MockAdminProvider>
          <PersonalChoreModal
            person={mockPerson}
            initialChore={initialChore}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      expect(container.querySelector('h3')?.textContent).toBe('Edit Personal Chore');

      const nameInput = container.querySelector('#choreName') as HTMLInputElement;
      const deadlineInput = container.querySelector('#deadline') as HTMLInputElement;
      const skipDayVisibilitySelect = container.querySelector(
        '#skipDayVisibility'
      ) as HTMLSelectElement;

      expect(nameInput?.value).toBe('Take out trash');
      expect(deadlineInput?.value).toBe('21:00');
      expect(skipDayVisibilitySelect?.value).toBe('show-if-overdue');
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
      expect(saveButton.element()).toBeVisible();
      await saveButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(updateChore).toHaveBeenCalled();
    });
  });

  describe('PIN caching', () => {
    it('should show PIN field when pinRequired and no cachedPin', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider pinRequired={true}>
          <PersonalChoreModal
            person={mockPerson}
            initialChore={undefined}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      expect(container.querySelector('#adminPin')).toBeTruthy();
    });

    it('should hide PIN field when cachedPin is provided', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider pinRequired={true} initialAdminPin="5678">
          <PersonalChoreModal
            person={mockPerson}
            initialChore={undefined}
            closeModal={closeModal}
          />
        </MockAdminProvider>
      ));

      expect(container.querySelector('#adminPin')).toBeFalsy();
    });

    it('should use cachedPin in request', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider pinRequired={true} initialAdminPin="5678">
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
