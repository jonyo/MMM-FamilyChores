import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { createChore, updateChore } from '../api';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  DayOfWeek,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import { RotatingChoreModal } from './rotating-chore-modal';
import { MockAdminProvider } from './test-utils';

vi.mock('../api', () => ({
  createChore: vi.fn(),
  updateChore: vi.fn(),
}));

describe('RotatingChoreModal', () => {
  describe('Create Chore Mode', () => {
    it('should render create form when no initial chore', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('modal-title')).toBeVisible();
      expect(page.getByTestId('modal-title').element().textContent).toBe('Add Rotating Chore');
      await expect.element(page.getByLabelText('Chore Name')).toBeVisible();
      await expect.element(page.getByLabelText('Deadline (optional)')).toBeVisible();
      await expect.element(page.getByTestId('skip-days-checkbox-list')).toBeVisible();
    });

    it('should show available people and empty rotation column', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('available-person-person-1')).toBeVisible();
      await expect.element(page.getByTestId('available-person-person-2')).toBeVisible();
      await expect.element(page.getByTestId('empty-rotation-message')).toBeVisible();
    });

    it('should click cancel button', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const cancelButton = page.getByRole('button', { name: 'Cancel' });
      await expect.element(cancelButton).toBeVisible();
      await cancelButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(createChore).not.toHaveBeenCalled();
    });

    it('should hide skip day visibility when no skip days are selected', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      expect(page.getByLabelText('Skip day visibility').elements().length).toBe(0);
    });

    it('should show skip day visibility when a skip day is checked', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      expect(page.getByLabelText('Skip day visibility').elements().length).toBe(0);

      const sundayCheckbox = page.getByLabelText('Sunday');
      await sundayCheckbox.click();
      await page.getByText('Advanced Display Options').click();

      await expect.element(page.getByLabelText('Skip day visibility')).toBeVisible();
    });

    it('should hide skip day visibility when all skip days are unchecked', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const sundayCheckbox = page.getByLabelText('Sunday');
      await sundayCheckbox.click();
      await page.getByText('Advanced Display Options').click();
      await expect.element(page.getByLabelText('Skip day visibility')).toBeVisible();

      await sundayCheckbox.click();
      expect(page.getByLabelText('Skip day visibility').elements().length).toBe(0);
    });

    it('should click add button', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await page.getByLabelText('Chore Name').fill('Test Rotating Chore');

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
      const initialChore = {
        id: 'c1',
        name: 'Do dishes',
        type: 'rotating' as const,
        rotation: ['person-1', 'person-2'],
        rotatingIndex: 0,
        skipDays: [DayOfWeek.SUNDAY],
        skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
        caughtUp: true,
        completedToday: false,
        deadline: '20:00',
      } as import('../types/chore-types').RotatingChore;

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={initialChore} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('modal-title')).toBeVisible();
      expect(page.getByTestId('modal-title').element().textContent).toBe('Edit Rotating Chore');

      await expect.element(page.getByLabelText('Chore Name')).toBeVisible();
      await expect.element(page.getByLabelText('Deadline (optional)')).toBeVisible();
      await expect.element(page.getByLabelText('Skip day visibility')).toBeVisible();

      await expect.element(page.getByLabelText('Chore Name')).toHaveValue('Do dishes');
      await expect.element(page.getByLabelText('Deadline (optional)')).toHaveValue('20:00');
      await expect
        .element(page.getByLabelText('Skip day visibility'))
        .toHaveValue('show-if-overdue');

      await expect.element(page.getByTestId('rotation-person-person-1')).toBeVisible();
      await expect.element(page.getByTestId('rotation-person-person-2')).toBeVisible();
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
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
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
      await expect.element(saveButton).toBeVisible();
      await saveButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(updateChore).toHaveBeenCalled();
    });

    it('should hide skip day visibility when all skip days are unchecked and preserve value when re-checked', async () => {
      const closeModal = vi.fn();
      const initialChore = {
        id: 'c1',
        name: 'Do dishes',
        type: 'rotating' as const,
        rotation: ['person-1', 'person-2'],
        rotatingIndex: 0,
        skipDays: [DayOfWeek.SUNDAY],
        skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
        caughtUp: true,
        completedToday: false,
        deadline: '20:00',
      } as import('../types/chore-types').RotatingChore;

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={initialChore} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByLabelText('Skip day visibility')).toBeVisible();
      await expect
        .element(page.getByLabelText('Skip day visibility'))
        .toHaveValue('show-if-overdue');

      const sundayCheckbox = page.getByLabelText('Sunday');
      await sundayCheckbox.click();
      expect(page.getByLabelText('Skip day visibility').elements().length).toBe(0);

      await sundayCheckbox.click();
      await expect.element(page.getByLabelText('Skip day visibility')).toBeVisible();
      await expect
        .element(page.getByLabelText('Skip day visibility'))
        .toHaveValue('show-if-overdue');
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
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
        caughtUp: true,
        completedToday: false,
      } as import('../types/chore-types').RotatingChore;

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={initialChore} closeModal={closeModal} />
        </MockAdminProvider>
      ));

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
    it('should render drag handles and draggable attributes on available people', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const availableItem = page.getByTestId('available-person-person-1');
      await expect.element(availableItem).toBeVisible();

      expect((availableItem.element() as HTMLElement).draggable).toBe(true);
      expect(
        (availableItem.element() as HTMLElement).querySelector('[data-drag-handle]')
      ).toBeTruthy();
    });

    it('should render radio buttons in rotation column for existing rotation', async () => {
      const closeModal = vi.fn();
      const initialChore = {
        id: 'c1',
        name: 'Do dishes',
        type: 'rotating' as const,
        rotation: ['person-1', 'person-2'],
        rotatingIndex: 0,
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
        afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
        caughtUp: true,
        completedToday: false,
      } as import('../types/chore-types').RotatingChore;

      render(() => (
        <MockAdminProvider>
          <RotatingChoreModal initialChore={initialChore} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('active-person-radio-person-1')).toBeVisible();
      await expect.element(page.getByTestId('active-person-radio-person-2')).toBeVisible();

      const radio1 = page.getByTestId('active-person-radio-person-1').element() as HTMLInputElement;
      const radio2 = page.getByTestId('active-person-radio-person-2').element() as HTMLInputElement;
      expect(radio1?.checked).toBe(true);
      expect(radio2?.checked).toBe(false);
    });
  });

  describe('PIN caching', () => {
    it('should show PIN field when pinRequired and no cachedPin', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider
          choreDataOverride={{ settings: { historyEnabled: true } }}
          pinRequired={true}
        >
          <RotatingChoreModal initialChore={undefined} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByLabelText('Admin PIN')).toBeVisible();
    });

    it('should hide PIN field when cachedPin is provided', async () => {
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

      expect(page.getByLabelText('Admin PIN').elements().length).toBe(0);
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
