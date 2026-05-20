import { render } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { resetCaughtUp } from '../api';
import type { PersonalChore, RotatingChore } from '../types/chore-types';
import { ChoreType, SkipDayVisibility } from '../types/chore-types';
import { ResetCaughtUpModal } from './reset-caught-up-modal';
import { MockAdminProvider } from './test-utils';

vi.mock('../api', () => ({
  resetCaughtUp: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const mockPersonalChore: PersonalChore = {
  id: 'chore-p1',
  name: 'Do the Dishes',
  type: ChoreType.PERSONAL,
  assignedTo: 'person-1',
  skipDays: [],
  skipDayVisibility: SkipDayVisibility.HIDE,
  caughtUp: false,
  completedToday: false,
};

const mockRotatingChore: RotatingChore = {
  id: 'chore-r1',
  name: 'Take Out Trash',
  type: ChoreType.ROTATING,
  rotation: ['person-1', 'person-2'],
  rotatingIndex: 1,
  skipDays: [],
  skipDayVisibility: SkipDayVisibility.HIDE,
  caughtUp: false,
  completedToday: false,
};

describe('ResetCaughtUpModal', () => {
  it('renders the modal', async () => {
    render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[mockPersonalChore]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    await expect.element(page.getByTestId('reset-caught-up-modal')).toBeVisible();
  });

  it('shows overdue chore rows with chore name and assignee', async () => {
    render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[mockPersonalChore]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    await expect.element(page.getByTestId('overdue-chores-list')).toBeVisible();
    const row = page.getByTestId(`overdue-row-${mockPersonalChore.id}`);
    await expect.element(row).toBeVisible();
    await expect.element(row).toHaveTextContent('Do the Dishes');
    await expect.element(row).toHaveTextContent('Test Person');
  });

  it('shows assignee for rotating chore using current rotation index', async () => {
    render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[mockRotatingChore]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    const row = page.getByTestId(`overdue-row-${mockRotatingChore.id}`);
    await expect.element(row).toBeVisible();
    // rotatingIndex=1 → person-2 → "Test Person 2"
    await expect.element(row).toHaveTextContent('Test Person 2');
  });

  it('renders multiple overdue rows', async () => {
    render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[mockPersonalChore, mockRotatingChore]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    await expect.element(page.getByTestId(`overdue-row-${mockPersonalChore.id}`)).toBeVisible();
    await expect.element(page.getByTestId(`overdue-row-${mockRotatingChore.id}`)).toBeVisible();
  });

  it('shows all-caught-up message when overdue list is empty', async () => {
    render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    await expect.element(page.getByTestId('no-overdue-message')).toBeVisible();
    expect(page.getByTestId('overdue-chores-list').elements().length).toBe(0);
  });

  it('hides Reset button when overdue list is empty', () => {
    render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    expect(page.getByRole('button', { name: 'Reset All Caught Up' }).elements()).toHaveLength(0);
  });

  it('calls resetCaughtUp API and closeModal on confirm', async () => {
    const closeModal = vi.fn();
    vi.mocked(resetCaughtUp).mockResolvedValueOnce({ success: true, reset: 1 });

    render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[mockPersonalChore]} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await page.getByRole('button', { name: 'Reset All Caught Up' }).click();

    expect(resetCaughtUp).toHaveBeenCalledWith({ pin: undefined });
    expect(closeModal).toHaveBeenCalled();
  });

  it('calls closeModal on cancel without calling API', async () => {
    const closeModal = vi.fn();

    render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[mockPersonalChore]} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await page.getByRole('button', { name: 'Cancel' }).click();

    expect(resetCaughtUp).not.toHaveBeenCalled();
    expect(closeModal).toHaveBeenCalled();
  });

  it('shows PIN field when pinRequired and no cachedPin', async () => {
    render(() => (
      <MockAdminProvider pinRequired={true} initialCachedPin={undefined}>
        <ResetCaughtUpModal overdue={[mockPersonalChore]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    await expect.element(page.getByLabelText('Admin PIN')).toBeVisible();
  });

  it('hides PIN field when cachedPin is provided', async () => {
    render(() => (
      <MockAdminProvider pinRequired={true} initialCachedPin="1234">
        <ResetCaughtUpModal overdue={[mockPersonalChore]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    expect(page.getByLabelText('Admin PIN').elements().length).toBe(0);
  });

  it('sends cachedPin in API request', async () => {
    const closeModal = vi.fn();
    vi.mocked(resetCaughtUp).mockResolvedValueOnce({ success: true, reset: 1 });

    render(() => (
      <MockAdminProvider pinRequired={true} initialCachedPin="1234">
        <ResetCaughtUpModal overdue={[mockPersonalChore]} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await page.getByRole('button', { name: 'Reset All Caught Up' }).click();

    expect(resetCaughtUp).toHaveBeenCalledWith({ pin: '1234' });
    expect(closeModal).toHaveBeenCalled();
  });

  it('shows alert and does not call closeModal on API error', async () => {
    const closeModal = vi.fn();
    vi.mocked(resetCaughtUp).mockRejectedValueOnce(new Error('Server error'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[mockPersonalChore]} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await page.getByRole('button', { name: 'Reset All Caught Up' }).click();

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Server error'));
    expect(closeModal).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
