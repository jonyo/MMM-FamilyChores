import { render } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { updateChore } from '../api';
import type { Person, PersonalChore, RotatingChore } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import { triggerBackupDownload } from './backup-actions';
import { BulkEditModal } from './bulk-edit-modal';
import { MockAdminProvider } from './test-utils';

vi.mock('../api', () => ({
  updateChore: vi.fn(),
}));

vi.mock('./backup-actions', () => ({
  triggerBackupDownload: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const alice: Person = { id: 'p1', name: 'Alice', color: '#FF6B6B' };
const bob: Person = { id: 'p2', name: 'Bob', color: '#4ECDC4' };

const makePersonalChore = (overrides: Partial<PersonalChore>): PersonalChore => ({
  id: 'chore-default',
  name: 'Chore',
  type: ChoreType.PERSONAL,
  assignedTo: alice.id,
  skipDays: [],
  skipDayVisibility: SkipDayVisibility.HIDE,
  beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
  afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
  notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
  caughtUp: true,
  completedToday: false,
  ...overrides,
});

const makeRotatingChore = (overrides: Partial<RotatingChore>): RotatingChore => ({
  id: 'rot-default',
  name: 'Rotating Chore',
  type: ChoreType.ROTATING,
  rotation: [alice.id, bob.id],
  rotatingIndex: 0,
  skipDays: [],
  skipDayVisibility: SkipDayVisibility.HIDE,
  beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
  afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
  notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
  caughtUp: true,
  completedToday: false,
  ...overrides,
});

describe('BulkEditModal', () => {
  describe('Step 1 — Field', () => {
    it('renders the backup recommendation and field groups', async () => {
      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [alice],
            chores: [makePersonalChore({ id: 'c1', name: 'Make bed' })],
          }}
        >
          <BulkEditModal choreType={ChoreType.PERSONAL} closeModal={vi.fn()} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('backup-download-btn')).toBeVisible();
      await expect
        .element(page.getByRole('radio', { name: 'Start Time', exact: true }))
        .toBeVisible();
      await expect.element(page.getByRole('radio', { name: 'Skip Days' })).toBeVisible();
      await expect
        .element(page.getByRole('radio', { name: 'Not Caught Up Display' }))
        .toBeVisible();
    });

    it('keeps Next disabled until a field is chosen', async () => {
      render(() => (
        <MockAdminProvider
          choreDataOverride={{ people: [alice], chores: [makePersonalChore({ id: 'c1' })] }}
        >
          <BulkEditModal choreType={ChoreType.PERSONAL} closeModal={vi.fn()} />
        </MockAdminProvider>
      ));

      const next = page.getByTestId('next-button');
      expect((next.element() as HTMLButtonElement).disabled).toBe(true);

      await page.getByRole('radio', { name: 'Not Caught Up Display' }).click();
      expect((next.element() as HTMLButtonElement).disabled).toBe(false);
    });

    it('downloads a backup without closing the modal', async () => {
      const closeModal = vi.fn();
      render(() => (
        <MockAdminProvider
          choreDataOverride={{ people: [alice], chores: [makePersonalChore({ id: 'c1' })] }}
        >
          <BulkEditModal choreType={ChoreType.PERSONAL} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await page.getByTestId('backup-download-btn').click();

      expect(triggerBackupDownload).toHaveBeenCalledWith(undefined);
      expect(closeModal).not.toHaveBeenCalled();
      await expect.element(page.getByTestId('step-field')).toBeVisible();
    });
  });

  describe('Step 3 — Chores', () => {
    it('grays out chores ineligible for the chosen field', async () => {
      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [alice],
            chores: [
              makePersonalChore({ id: 'c1', name: 'Has deadline', deadline: '20:00' }),
              makePersonalChore({ id: 'c2', name: 'No deadline' }),
            ],
          }}
        >
          <BulkEditModal choreType={ChoreType.PERSONAL} closeModal={vi.fn()} />
        </MockAdminProvider>
      ));

      await page.getByRole('radio', { name: 'After Deadline Visibility' }).click();
      await page.getByTestId('next-button').click();
      await page.getByTestId('next-button').click();

      const eligibleRow = page.getByTestId('chore-row-c1').getByRole('checkbox');
      const ineligibleRow = page.getByTestId('chore-row-c2').getByRole('checkbox');
      expect((eligibleRow.element() as HTMLInputElement).disabled).toBe(false);
      expect((ineligibleRow.element() as HTMLInputElement).disabled).toBe(true);
    });

    it('preserves the same order as the People tab (no re-sorting)', async () => {
      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [bob, alice],
            chores: [
              makePersonalChore({ id: 'c1', name: 'Zebra chore', assignedTo: bob.id }),
              makePersonalChore({ id: 'c2', name: 'Apple chore', assignedTo: alice.id }),
            ],
          }}
        >
          <BulkEditModal choreType={ChoreType.PERSONAL} closeModal={vi.fn()} />
        </MockAdminProvider>
      ));

      await page.getByRole('radio', { name: 'Not Caught Up Display' }).click();
      await page.getByTestId('next-button').click();
      await page.getByTestId('next-button').click();

      const list = page.getByTestId('compact-chore-list').element() as HTMLElement;
      const names = Array.from(list.querySelectorAll('[data-testid^="chore-row-"]')).map(
        (el) => el.textContent
      );
      expect(names[0]).toContain('Zebra chore');
      expect(names[1]).toContain('Apple chore');
    });

    it('detailed table view highlights the field being edited and preserves selection', async () => {
      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [alice],
            chores: [makePersonalChore({ id: 'c1', name: 'Make bed' })],
          }}
        >
          <BulkEditModal choreType={ChoreType.PERSONAL} closeModal={vi.fn()} />
        </MockAdminProvider>
      ));

      await page.getByRole('radio', { name: 'Not Caught Up Display' }).click();
      await page.getByTestId('next-button').click();
      await page.getByTestId('next-button').click();

      await page.getByTestId('chore-row-c1').getByRole('checkbox').click();
      await page.getByTestId('view-mode-detailed').click();

      await expect.element(page.getByTestId('detailed-chore-table')).toBeVisible();
      const detailedCheckbox = page.getByTestId('detailed-row-c1').getByRole('checkbox');
      expect((detailedCheckbox.element() as HTMLInputElement).checked).toBe(true);
    });
  });

  describe('Step 4 — Confirm and submit', () => {
    const setupToConfirmStep = async () => {
      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [alice],
            chores: [
              makePersonalChore({ id: 'c1', name: 'Make bed' }),
              makePersonalChore({ id: 'c2', name: 'Feed dog' }),
            ],
          }}
        >
          <BulkEditModal choreType={ChoreType.PERSONAL} closeModal={vi.fn()} />
        </MockAdminProvider>
      ));

      await page.getByRole('radio', { name: 'Not Caught Up Display' }).click();
      await page.getByTestId('next-button').click();
      await page.getByRole('radio', { name: 'Normal styling' }).click();
      await page.getByTestId('next-button').click();
      await page.getByTestId('chore-row-c1').getByRole('checkbox').click();
      await page.getByTestId('chore-row-c2').getByRole('checkbox').click();
      await page.getByTestId('next-button').click();
    };

    it('shows current -> new values with every row starting as Pending', async () => {
      await setupToConfirmStep();

      await expect.element(page.getByTestId('confirm-row-c1')).toHaveTextContent('Overdue styling');
      await expect.element(page.getByTestId('confirm-row-c1')).toHaveTextContent('Normal styling');
      await expect.element(page.getByTestId('confirm-status-c1')).toHaveTextContent('Pending');
      await expect.element(page.getByTestId('confirm-status-c2')).toHaveTextContent('Pending');
    });

    it('submits sequentially, one row at a time, and marks each Done', async () => {
      let resolveFirst: (value: unknown) => void = () => {};
      const firstCall = new Promise((resolve) => {
        resolveFirst = resolve;
      });
      vi.mocked(updateChore).mockImplementationOnce(() => firstCall as Promise<unknown>);
      vi.mocked(updateChore).mockImplementationOnce(() =>
        Promise.resolve({
          id: 'c2',
          notCaughtUpDisplay: NotCaughtUpDisplay.NORMAL,
        })
      );

      await setupToConfirmStep();
      const apply = page.getByTestId('apply-button');
      await apply.click();

      // Second row must not have been called yet — first request hasn't resolved.
      expect(updateChore).toHaveBeenCalledTimes(1);
      await expect.element(page.getByTestId('confirm-status-c1')).toHaveTextContent('…');
      await expect.element(page.getByTestId('confirm-status-c2')).toHaveTextContent('Pending');

      resolveFirst({ id: 'c1', notCaughtUpDisplay: NotCaughtUpDisplay.NORMAL });

      await expect.element(page.getByTestId('confirm-status-c1')).toHaveTextContent('✓ Done');
      await expect.element(page.getByTestId('confirm-status-c2')).toHaveTextContent('✓ Done');
      expect(updateChore).toHaveBeenCalledTimes(2);
      expect(updateChore).toHaveBeenNthCalledWith(1, 'c1', {
        notCaughtUpDisplay: NotCaughtUpDisplay.NORMAL,
        pin: undefined,
      });
    });

    it('stops on failure and leaves remaining rows Pending', async () => {
      vi.mocked(updateChore).mockRejectedValueOnce(new Error('Chore not found'));

      await setupToConfirmStep();
      await page.getByTestId('apply-button').click();

      await expect.element(page.getByTestId('confirm-status-c1')).toHaveTextContent('✗ Failed');
      await expect.element(page.getByTestId('confirm-status-c2')).toHaveTextContent('Pending');
      expect(updateChore).toHaveBeenCalledTimes(1);
      await expect.element(page.getByTestId('close-button')).toBeVisible();
    });

    it('stops immediately on an invalid PIN and shows a distinct message', async () => {
      vi.mocked(updateChore).mockRejectedValueOnce(new Error('Invalid PIN'));

      await setupToConfirmStep();
      await page.getByTestId('apply-button').click();

      await expect.element(page.getByText(/Incorrect PIN/)).toBeVisible();
      expect(updateChore).toHaveBeenCalledTimes(1);
    });

    it('marks a row Failed if the response does not reflect the requested change', async () => {
      vi.mocked(updateChore).mockResolvedValueOnce({
        id: 'c1',
        notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE, // unchanged, should not count as success
      });

      await setupToConfirmStep();
      await page.getByTestId('apply-button').click();

      await expect.element(page.getByTestId('confirm-status-c1')).toHaveTextContent('✗ Failed');
    });
  });

  describe('Field-change reset', () => {
    it('clears chore selection when changing field via the Step 3 Edit link', async () => {
      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [alice],
            chores: [makePersonalChore({ id: 'c1', name: 'Make bed', deadline: '20:00' })],
          }}
        >
          <BulkEditModal choreType={ChoreType.PERSONAL} closeModal={vi.fn()} />
        </MockAdminProvider>
      ));

      await page.getByRole('radio', { name: 'Not Caught Up Display' }).click();
      await page.getByTestId('next-button').click();
      await page.getByTestId('next-button').click();
      await page.getByTestId('chore-row-c1').getByRole('checkbox').click();

      await page.getByTestId('edit-field-link').click();
      await page.getByRole('radio', { name: 'After Deadline Visibility' }).click();
      await page.getByTestId('next-button').click();
      await page.getByTestId('next-button').click();

      const checkbox = page.getByTestId('chore-row-c1').getByRole('checkbox');
      expect((checkbox.element() as HTMLInputElement).checked).toBe(false);
    });
  });

  describe('Rotating chores', () => {
    it('lists rotating chores as a flat list (no person grouping)', async () => {
      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [alice, bob],
            chores: [makeRotatingChore({ id: 'r1', name: 'Take out trash' })],
          }}
        >
          <BulkEditModal choreType={ChoreType.ROTATING} closeModal={vi.fn()} />
        </MockAdminProvider>
      ));

      await page.getByRole('radio', { name: 'Not Caught Up Display' }).click();
      await page.getByTestId('next-button').click();
      await page.getByTestId('next-button').click();

      await expect.element(page.getByTestId('chore-row-r1')).toBeVisible();
    });
  });
});
