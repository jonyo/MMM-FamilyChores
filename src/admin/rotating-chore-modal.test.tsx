import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import '../../public/admin.css';
import type { FamilyChoresData } from '../types/chore-types';
import { createChore, updateChore } from '../api';
import { DayOfWeek, SkipDayVisibility } from '../types/chore-types';
import { RotatingChoreModal } from './rotating-chore-modal';

// Mock API functions
vi.mock('../api', () => ({
  createChore: vi.fn(),
  updateChore: vi.fn(),
}));

describe('RotatingChoreModal', () => {
  const mockChoreData: FamilyChoresData = {
    people: [
      { id: 'p1', name: 'Alice', color: '#FF6B6B' },
      { id: 'p2', name: 'Bob', color: '#4ECDC4' },
      { id: 'p3', name: 'Charlie', color: '#45B7D1' },
    ],
    chores: [],
  };

  describe('Create Chore Mode', () => {
    it('should render create form when no initial chore', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <RotatingChoreModal
          initialChore={undefined}
          choreData={mockChoreData}
          closeModal={closeModal}
        />
      ));

      expect(container.querySelector('h3')?.textContent).toBe('Add Rotating Chore');
      expect(container.querySelector('#choreName')).toBeTruthy();
      expect(container.querySelector('.checkbox-list')).toBeTruthy();
    });

    it('should click cancel button', async () => {
      const closeModal = vi.fn();

      render(() => (
        <RotatingChoreModal
          initialChore={undefined}
          choreData={mockChoreData}
          closeModal={closeModal}
        />
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
        <RotatingChoreModal
          initialChore={undefined}
          choreData={mockChoreData}
          closeModal={closeModal}
        />
      ));

      // Fill in the chore name
      const nameInput = document.querySelector('#choreName') as HTMLInputElement;
      nameInput.value = 'Test Rotating Chore';

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
      const initialChore = {
        id: 'c1',
        name: 'Do dishes',
        type: 'rotating' as const,
        rotation: ['p1', 'p2'],
        rotatingIndex: 0,
        skipDays: [DayOfWeek.SUNDAY],
        skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
        caughtUp: true,
        completedToday: false,
        deadline: '20:00',
      } as import('../types/chore-types').RotatingChore;

      const { container } = render(() => (
        <RotatingChoreModal
          initialChore={initialChore}
          choreData={mockChoreData}
          closeModal={closeModal}
        />
      ));

      expect(container.querySelector('h3')?.textContent).toBe('Edit Rotating Chore');

      const nameInput = container.querySelector('#choreName') as HTMLInputElement;
      const deadlineInput = container.querySelector('#deadline') as HTMLInputElement;
      const skipDayVisibilitySelect = container.querySelector(
        '#skipDayVisibility'
      ) as HTMLSelectElement;

      expect(nameInput?.value).toBe('Do dishes');
      expect(deadlineInput?.value).toBe('20:00');
      expect(skipDayVisibilitySelect?.value).toBe('show-if-overdue');
    });

    it('should click save button in edit mode', async () => {
      const closeModal = vi.fn();
      const initialChore = {
        id: 'c1',
        name: 'Do dishes',
        type: 'rotating' as const,
        rotation: ['p1', 'p2'],
        rotatingIndex: 0,
        skipDays: [DayOfWeek.SUNDAY],
        skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
        caughtUp: true,
        completedToday: false,
        deadline: '20:00',
      } as import('../types/chore-types').RotatingChore;

      render(() => (
        <RotatingChoreModal
          initialChore={initialChore}
          choreData={mockChoreData}
          closeModal={closeModal}
        />
      ));

      const saveButton = page.getByRole('button', { name: 'Save' });
      expect(saveButton.element()).toBeVisible();
      await saveButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(updateChore).toHaveBeenCalled();
    });
  });
});
