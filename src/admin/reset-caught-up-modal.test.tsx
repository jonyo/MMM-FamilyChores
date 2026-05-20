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
  it('renders the modal', () => {
    const { container } = render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[mockPersonalChore]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    expect(container.querySelector('[data-testid="reset-caught-up-modal"]')).toBeTruthy();
  });

  it('shows overdue chore rows with chore name and assignee', () => {
    const { container } = render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[mockPersonalChore]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    expect(container.querySelector('[data-testid="overdue-chores-list"]')).toBeTruthy();
    const row = container.querySelector(`[data-testid="overdue-row-${mockPersonalChore.id}"]`);
    expect(row?.textContent).toContain('Do the Dishes');
    expect(row?.textContent).toContain('Test Person');
  });

  it('shows assignee for rotating chore using current rotation index', () => {
    const { container } = render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[mockRotatingChore]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    const row = container.querySelector(`[data-testid="overdue-row-${mockRotatingChore.id}"]`);
    // rotatingIndex=1 → person-2 → "Test Person 2"
    expect(row?.textContent).toContain('Test Person 2');
  });

  it('renders multiple overdue rows', () => {
    const { container } = render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[mockPersonalChore, mockRotatingChore]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    expect(
      container.querySelector(`[data-testid="overdue-row-${mockPersonalChore.id}"]`)
    ).toBeTruthy();
    expect(
      container.querySelector(`[data-testid="overdue-row-${mockRotatingChore.id}"]`)
    ).toBeTruthy();
  });

  it('shows all-caught-up message when overdue list is empty', () => {
    const { container } = render(() => (
      <MockAdminProvider>
        <ResetCaughtUpModal overdue={[]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    expect(container.querySelector('[data-testid="no-overdue-message"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="overdue-chores-list"]')).toBeFalsy();
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

  it('shows PIN field when pinRequired and no cachedPin', () => {
    const { container } = render(() => (
      <MockAdminProvider pinRequired={true}>
        <ResetCaughtUpModal overdue={[mockPersonalChore]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    expect(container.querySelector('#adminPin')).toBeTruthy();
  });

  it('hides PIN field when cachedPin is provided', () => {
    const { container } = render(() => (
      <MockAdminProvider pinRequired={true} initialCachedPin="1234">
        <ResetCaughtUpModal overdue={[mockPersonalChore]} closeModal={vi.fn()} />
      </MockAdminProvider>
    ));
    expect(container.querySelector('#adminPin')).toBeFalsy();
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
