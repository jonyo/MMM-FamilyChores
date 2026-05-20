import { render } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { advanceRotations } from '../api';
import type { RotatingChore } from '../types/chore-types';
import { ChoreType, DayOfWeek, SkipDayVisibility } from '../types/chore-types';
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
  caughtUp: true,
  completedToday: false,
};

describe('AdvanceRotationsModal', () => {
  it('renders the modal with rotation preview rows', () => {
    const closeModal = vi.fn();
    const { container } = render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[mockChore1]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    expect(container.querySelector('[data-testid="advance-rotations-modal"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="rotation-preview-list"]')).toBeTruthy();
    expect(container.querySelector(`[data-testid="rotation-row-${mockChore1.id}"]`)).toBeTruthy();
  });

  it('shows current person and next person in each row', () => {
    const closeModal = vi.fn();
    const { container } = render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[mockChore1]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    const row = container.querySelector(`[data-testid="rotation-row-${mockChore1.id}"]`);
    expect(row?.textContent).toContain('Walk the Dog');
    expect(row?.textContent).toContain('Test Person');
    expect(row?.textContent).toContain('Test Person 2');
  });

  it('renders multiple chore rows', () => {
    const closeModal = vi.fn();
    const { container } = render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[mockChore1, mockChore2]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    expect(container.querySelector(`[data-testid="rotation-row-${mockChore1.id}"]`)).toBeTruthy();
    expect(container.querySelector(`[data-testid="rotation-row-${mockChore2.id}"]`)).toBeTruthy();
  });

  it('shows no-chores message when all chores have only 1 person', () => {
    const closeModal = vi.fn();
    const { container } = render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[singlePersonChore]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    expect(container.querySelector('[data-testid="no-chores-message"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="rotation-preview-list"]')).toBeFalsy();
  });

  it('shows no-chores message when rotatingChores is empty', () => {
    const closeModal = vi.fn();
    const { container } = render(() => (
      <MockAdminProvider>
        <AdvanceRotationsModal rotatingChores={[]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    expect(container.querySelector('[data-testid="no-chores-message"]')).toBeTruthy();
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

  it('shows PIN field when pinRequired and no cachedPin', () => {
    const closeModal = vi.fn();
    const { container } = render(() => (
      <MockAdminProvider pinRequired={true}>
        <AdvanceRotationsModal rotatingChores={[mockChore1]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    expect(container.querySelector('#adminPin')).toBeTruthy();
  });

  it('hides PIN field when cachedPin is provided', () => {
    const closeModal = vi.fn();
    const { container } = render(() => (
      <MockAdminProvider pinRequired={true} initialCachedPin="1234">
        <AdvanceRotationsModal rotatingChores={[mockChore1]} closeModal={closeModal} />
      </MockAdminProvider>
    ));
    expect(container.querySelector('#adminPin')).toBeFalsy();
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
