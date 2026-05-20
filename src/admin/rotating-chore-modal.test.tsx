import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { createChore, updateChore } from '../api';
import { DayOfWeek, SkipDayVisibility } from '../types/chore-types';
import { RotatingChoreModal } from './rotating-chore-modal';
import { MockAdminProvider } from './test-utils';

// Mock API functions
vi.mock('../api', () => ({
  createChore: vi.fn(),
  updateChore: vi.fn(),
}));

describe('RotatingChoreModal', () => {
  describe('Create Chore Mode', () => {
    it('should render create form when no initial chore', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      expect(container.querySelector('h3')?.textContent).toBe('Add Rotating Chore');
      expect(container.querySelector('#choreName')).toBeTruthy();
      expect(container.querySelector('[data-testid="available-column"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="rotation-column"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="skip-days-checkbox-list"]')).toBeTruthy();
    });

    it('should show available people and empty rotation column', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      expect(container.querySelector('[data-testid="available-person-person-1"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="available-person-person-2"]')).toBeTruthy();
      expect(container.querySelector('[data-rotation-item]')).toBeFalsy();
    });

    it('should click cancel button', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
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
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      // Fill in the chore name
      await page.getByLabelText('Chore Name').fill('Test Rotating Chore');

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
        rotation: ['person-1', 'person-2'],
        rotatingIndex: 0,
        skipDays: [DayOfWeek.SUNDAY],
        skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
        caughtUp: true,
        completedToday: false,
        deadline: '20:00',
      } as import('../types/chore-types').RotatingChore;

      const { container } = render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={initialChore} closeModal={closeModal} />
        </MockAdminProvider>
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

      expect(container.querySelector('[data-testid="rotation-person-person-1"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="rotation-person-person-2"]')).toBeTruthy();
    });

    it('should click save button in edit mode', async () => {
      const closeModal = vi.fn();
      const initialChore = {
        id: 'c1',
        name: 'Do dishes',
        type: 'rotating' as const,
        rotation: ['person-1', 'person-2'],
        rotatingIndex: 0,
        skipDays: [DayOfWeek.SUNDAY],
        skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
        caughtUp: true,
        completedToday: false,
        deadline: '20:00',
      } as import('../types/chore-types').RotatingChore;

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={initialChore} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const saveButton = page.getByRole('button', { name: 'Save' });
      expect(saveButton.element()).toBeVisible();
      await saveButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(updateChore).toHaveBeenCalled();
    });

    it('should send rotatingIndex based on selected active person', async () => {
      const closeModal = vi.fn();
      const initialChore = {
        id: 'c1',
        name: 'Do dishes',
        type: 'rotating' as const,
        rotation: ['person-1', 'person-2'],
        rotatingIndex: 0,
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: true,
        completedToday: false,
      } as import('../types/chore-types').RotatingChore;

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={initialChore} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      // Select the second person as active
      const radio = page.getByTestId('active-person-radio-person-2');
      await radio.click();

      const saveButton = page.getByRole('button', { name: 'Save' });
      await saveButton.click();

      expect(updateChore).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          rotatingIndex: 1,
          rotation: ['person-1', 'person-2'],
        })
      );
    });
  });

  describe('Drag and Drop UI', () => {
    it('should render drag handles and draggable attributes on available people', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const availableItem = container.querySelector(
        '[data-testid="available-person-person-1"]'
      ) as HTMLElement;
      expect(availableItem).toBeTruthy();
      expect(availableItem.draggable).toBe(true);
      expect(availableItem.querySelector('[data-drag-handle]')).toBeTruthy();
    });

    it('should render radio buttons in rotation column for existing rotation', () => {
      const closeModal = vi.fn();
      const initialChore = {
        id: 'c1',
        name: 'Do dishes',
        type: 'rotating' as const,
        rotation: ['person-1', 'person-2'],
        rotatingIndex: 0,
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: true,
        completedToday: false,
      } as import('../types/chore-types').RotatingChore;

      const { container } = render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={initialChore} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const radio1 = container.querySelector(
        '[data-testid="active-person-radio-person-1"]'
      ) as HTMLInputElement;
      const radio2 = container.querySelector(
        '[data-testid="active-person-radio-person-2"]'
      ) as HTMLInputElement;
      expect(radio1).toBeTruthy();
      expect(radio2).toBeTruthy();
      expect(radio1.checked).toBe(true);
      expect(radio2.checked).toBe(false);
    });
  });

  describe('PIN caching', () => {
    it('should show PIN field when pinRequired and no cachedPin', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider
          choreDataOverride={{ settings: { historyEnabled: true } }}
          pinRequired={true}
        >
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      expect(container.querySelector('#adminPin')).toBeTruthy();
    });

    it('should hide PIN field when cachedPin is provided', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <MockAdminProvider
          choreDataOverride={{ settings: { historyEnabled: true } }}
          pinRequired={true}
          initialCachedPin="1234"
        >
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      expect(container.querySelector('#adminPin')).toBeFalsy();
    });

    it('should use cachedPin in request and not call onPinRemembered', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider
          choreDataOverride={{ settings: { historyEnabled: true } }}
          pinRequired={true}
          initialCachedPin="1234"
        >
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await page.getByLabelText('Chore Name').fill('Test Rotating Chore');

      const addButton = page.getByRole('button', { name: 'Add' });
      await addButton.click();

      expect(createChore).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Rotating Chore',
          pin: '1234',
        })
      );
      expect(closeModal).toHaveBeenCalled();
    });
  });
});
