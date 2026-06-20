import { render } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { advanceRotations } from '../api';
import type { RotatingChore } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  DayOfWeek,
  NotCaughtUpDisplay,
  SkipDayVisibility,
} from '../types/chore-types';
import { AdvanceRotationsModal } from './advance-rotations-modal';
import { MockAdminProvider } from './test-utils';

vi.mock('../api', () => ({
  advanceRotations: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const mockChore1: RotatingChore = {
  id: 'chore-r1',
  name: 'Walk the Dog',
  type: ChoreType.ROTATING,
  rotation: ['person-1', 'person-2'],
  rotatingIndex: 0,
  skipDays: [],
  skipDayVisibility: SkipDayVisibility.HIDE,
  beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
  afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
  notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
  caughtUp: true,
  completedToday: false,
};

const mockChore2: RotatingChore = {
  id: 'chore-r2',
  name: 'Take Out Trash',
  type: ChoreType.ROTATING,
  rotation: ['person-1', 'person-2'],
  rotatingIndex: 1,
  skipDays: [DayOfWeek.SUNDAY],
  skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
  beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
  afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
  notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
  caughtUp: false,
  completedToday: false,
};

const singlePersonChore: RotatingChore = {
  id: 'chore-r3',
  name: 'Solo Chore',
  type: ChoreType.ROTATING,
  rotation: ['person-1'],
  rotatingIndex: 0,
  skipDays: [],
  skipDayVisibility: SkipDayVisibility.HIDE,
  beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
  afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
  notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
  caughtUp: true,
  completedToday: false,
};

describe('AdvanceRotationsModal', () => {
  it('renders the modal with rotation preview rows', async () => {
    const closeModal = vi.fn();
    render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[mockChore1]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    await expect.element(page.getByTestId('advance-rotations-modal')).toBeVisible();
    await expect.element(page.getByTestId('rotation-preview-list')).toBeVisible();
    await expect.element(page.getByTestId(`rotation-row-${mockChore1.id}`)).toBeVisible();
  });

  it('shows current person and next person in each row', async () => {
    const closeModal = vi.fn();
    render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[mockChore1]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    const row = page.getByTestId(`rotation-row-${mockChore1.id}`);
    await expect.element(row).toBeVisible();
    await expect.element(row).toHaveTextContent('Walk the Dog');
    await expect.element(row).toHaveTextContent('Test Person');
    await expect.element(row).toHaveTextContent('Test Person 2');
  });

  it('renders multiple chore rows', async () => {
    const closeModal = vi.fn();
    render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[mockChore1, mockChore2]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    await expect.element(page.getByTestId(`rotation-row-${mockChore1.id}`)).toBeVisible();
    await expect.element(page.getByTestId(`rotation-row-${mockChore2.id}`)).toBeVisible();
  });

  it('shows no-chores message when all chores have only 1 person', async () => {
    const closeModal = vi.fn();
    render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[singlePersonChore]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    await expect.element(page.getByTestId('no-chores-message')).toBeVisible();
    expect(page.getByTestId('rotation-preview-list').elements().length).toBe(0);
  });

  it('shows no-chores message when rotatingChores is empty', async () => {
    const closeModal = vi.fn();
    render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    await expect.element(page.getByTestId('no-chores-message')).toBeVisible();
  });

  it('hides Advance Rotations button when no advanceable chores', () => {
    const closeModal = vi.fn();
    render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[singlePersonChore]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    const advanceBtn = page.getByRole('button', { name: 'Advance Rotations' }).elements();
    expect(advanceBtn).toHaveLength(0);
  });

  it('calls advanceRotations API and closeModal on confirm', async () => {
    const closeModal = vi.fn();
    vi.mocked(advanceRotations).mockResolvedValueOnce({ success: true, advanced: 1 });

    render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[mockChore1]} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await page.getByRole('button', { name: 'Advance Rotations' }).click();

    expect(advanceRotations).toHaveBeenCalledWith({ pin: undefined });
    expect(closeModal).toHaveBeenCalled();
  });

  it('calls closeModal on cancel without calling API', async () => {
    const closeModal = vi.fn();

    render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[mockChore1]} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await page.getByRole('button', { name: 'Cancel' }).click();

    expect(advanceRotations).not.toHaveBeenCalled();
    expect(closeModal).toHaveBeenCalled();
  });

  it('shows PIN field when pinRequired and no cachedPin', async () => {
    const closeModal = vi.fn();
    render(() => (
      <MockAdminProvider pinRequired={true}>
        <AdvanceRotationsModal rotatingChores={[mockChore1]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    await expect.element(page.getByLabelText('Admin PIN')).toBeVisible();
  });

  it('hides PIN field when cachedPin is provided', async () => {
    const closeModal = vi.fn();
    render(() => (
      <MockAdminProvider pinRequired={true} initialCachedPin="1234">
        <AdvanceRotationsModal rotatingChores={[mockChore1]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    expect(page.getByLabelText('Admin PIN').elements().length).toBe(0);
  });

  it('sends cachedPin in API request', async () => {
    const closeModal = vi.fn();
    vi.mocked(advanceRotations).mockResolvedValueOnce({ success: true, advanced: 1 });

    render(() => (
      <MockAdminProvider pinRequired={true} initialCachedPin="1234">
        <AdvanceRotationsModal rotatingChores={[mockChore1]} closeModal={closeModal} />
      </MockAdminProvider>
    ));

    await page.getByRole('button', { name: 'Advance Rotations' }).click();

    expect(advanceRotations).toHaveBeenCalledWith({ pin: '1234' });
    expect(closeModal).toHaveBeenCalled();
  });
});
