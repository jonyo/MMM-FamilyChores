import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { copyChores } from '../api';
import type { FamilyChoresData, Person } from '../types/chore-types';
import { ChoreType, SkipDayVisibility } from '../types/chore-types';
import { CopyChoresModal } from './copy-chores-modal';

// Mock API functions
vi.mock('../api', () => ({
  copyChores: vi.fn(),
}));

describe('CopyChoresModal', () => {
  const mockFromPerson: Person = { id: 'p1', name: 'Alice', color: '#FF6B6B' };
  const mockToPerson: Person = { id: 'p2', name: 'Bob', color: '#4ECDC4' };
  const mockChoreData: FamilyChoresData = {
    people: [mockFromPerson, mockToPerson],
    chores: [
      {
        id: 'c1',
        name: 'Take out trash',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: true,
        completedToday: false,
        deadline: '21:00',
      },
      {
        id: 'c2',
        name: 'Do dishes',
        type: ChoreType.PERSONAL,
        assignedTo: 'p1',
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: true,
        completedToday: false,
      },
    ],
    dailyCompletions: [],
    lastResetDate: '2024-01-01',
    settings: {
      dailyResetTime: '03:00',
      historyEnabled: true,
    },
  };

  describe('Rendering', () => {
    it('should render modal with chores available', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <CopyChoresModal
          fromPerson={mockFromPerson}
          choreData={mockChoreData}
          pinRequired={false}
          closeModal={closeModal}
        />
      ));

      expect(container.querySelector('h3')?.textContent).toBe('Copy Chores');
      expect(container.querySelector('[data-testid="copy-from-display"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="copy-from-display"]')?.textContent).toContain(
        'From: Alice'
      );
      expect(container.querySelector('#toPerson')).toBeTruthy();
      expect(container.querySelector('[data-testid="checkbox-list"]')).toBeTruthy();
    });

    it('should display from person color badge', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <CopyChoresModal
          fromPerson={mockFromPerson}
          choreData={mockChoreData}
          pinRequired={false}
          closeModal={closeModal}
        />
      ));

      const colorBadge = container.querySelector(
        '[data-testid="person-color-badge"]'
      ) as HTMLElement;
      expect(colorBadge?.style.backgroundColor).toBe('rgb(255, 107, 107)');
    });

    it('should show empty state when no personal chores', () => {
      const closeModal = vi.fn();
      const emptyChoreData: FamilyChoresData = {
        people: [mockFromPerson, mockToPerson],
        chores: [],
        dailyCompletions: [],
        lastResetDate: '2024-01-01',
        settings: {
          dailyResetTime: '03:00',
          historyEnabled: true,
        },
      };

      const { container } = render(() => (
        <CopyChoresModal
          fromPerson={mockFromPerson}
          choreData={emptyChoreData}
          pinRequired={false}
          closeModal={closeModal}
        />
      ));

      expect(container.querySelector('[data-testid="empty-message"]')?.textContent).toContain(
        'No personal chores to copy for Alice'
      );
    });

    it('should show empty state when no other people available', () => {
      const closeModal = vi.fn();
      const singlePersonChoreData: FamilyChoresData = {
        people: [mockFromPerson],
        chores: mockChoreData.chores,
        dailyCompletions: [],
        lastResetDate: '2024-01-01',
        settings: {
          dailyResetTime: '03:00',
          historyEnabled: true,
        },
      };

      const { container } = render(() => (
        <CopyChoresModal
          fromPerson={mockFromPerson}
          choreData={singlePersonChoreData}
          pinRequired={false}
          closeModal={closeModal}
        />
      ));

      expect(container.querySelector('[data-testid="empty-message"]')?.textContent).toContain(
        'No other people available to copy chores to'
      );
    });

    it('should list all personal chores with checkboxes default checked', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <CopyChoresModal
          fromPerson={mockFromPerson}
          choreData={mockChoreData}
          pinRequired={false}
          closeModal={closeModal}
        />
      ));

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(2);
      expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
      expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
    });

    it('should populate dropdown with available people', () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <CopyChoresModal
          fromPerson={mockFromPerson}
          choreData={mockChoreData}
          pinRequired={false}
          closeModal={closeModal}
        />
      ));

      const select = container.querySelector('#toPerson') as HTMLSelectElement;
      const options = select?.querySelectorAll('option');
      expect(options?.length).toBe(2);
      expect(options?.[0]?.value).toBe('');
      expect(options?.[0]?.textContent).toBe('-- Select a person --');
      expect(options?.[1]?.value).toBe('p2');
      expect(options?.[1]?.textContent).toBe('Bob');
    });
  });

  describe('Interactions', () => {
    it('should click cancel button', async () => {
      const closeModal = vi.fn();

      render(() => (
        <CopyChoresModal
          fromPerson={mockFromPerson}
          choreData={mockChoreData}
          pinRequired={false}
          closeModal={closeModal}
        />
      ));

      const cancelButton = page.getByRole('button', { name: 'Cancel' });
      expect(cancelButton.element()).toBeVisible();
      await cancelButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(copyChores).not.toHaveBeenCalled();
    });

    it('should uncheck a chore checkbox', async () => {
      const closeModal = vi.fn();

      const { container } = render(() => (
        <CopyChoresModal
          fromPerson={mockFromPerson}
          choreData={mockChoreData}
          pinRequired={false}
          closeModal={closeModal}
        />
      ));

      const checkbox = page.getByLabelText('Take out trash');
      await checkbox.click();

      const checkboxElement = container.querySelector(
        'input[type="checkbox"][value="c1"]'
      ) as HTMLInputElement;
      expect(checkboxElement.checked).toBe(false);
    });

    it('should submit form with selected chores', async () => {
      const closeModal = vi.fn();
      vi.mocked(copyChores).mockResolvedValueOnce(undefined);

      render(() => (
        <CopyChoresModal
          fromPerson={mockFromPerson}
          choreData={mockChoreData}
          pinRequired={false}
          closeModal={closeModal}
        />
      ));

      const select = page.getByRole('combobox');
      await select.selectOptions('p2');
      const copyButton = page.getByRole('button', { name: 'Copy' });
      await copyButton.click();

      expect(copyChores).toHaveBeenCalledWith({
        fromPersonId: 'p1',
        toPersonId: 'p2',
        choreIds: ['c1', 'c2'],
      });
      expect(closeModal).toHaveBeenCalled();
    });

    it('should submit form with only selected chores when some unchecked', async () => {
      const closeModal = vi.fn();
      vi.mocked(copyChores).mockResolvedValueOnce(undefined);

      render(() => (
        <CopyChoresModal
          fromPerson={mockFromPerson}
          choreData={mockChoreData}
          pinRequired={false}
          closeModal={closeModal}
        />
      ));

      const checkbox = page.getByLabelText('Take out trash');
      await checkbox.click();
      const select = page.getByRole('combobox');
      await select.selectOptions('p2');
      const copyButton = page.getByRole('button', { name: 'Copy' });
      await copyButton.click();

      expect(copyChores).toHaveBeenCalledWith({
        fromPersonId: 'p1',
        toPersonId: 'p2',
        choreIds: ['c2'],
      });
      expect(closeModal).toHaveBeenCalled();
    });

    it('should show alert on API error', async () => {
      const closeModal = vi.fn();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      vi.mocked(copyChores).mockRejectedValueOnce(new Error('API Error'));

      render(() => (
        <CopyChoresModal
          fromPerson={mockFromPerson}
          choreData={mockChoreData}
          pinRequired={false}
          closeModal={closeModal}
        />
      ));

      const select = page.getByRole('combobox');
      await select.selectOptions('p2');
      const copyButton = page.getByRole('button', { name: 'Copy' });
      await copyButton.click();

      expect(alertSpy).toHaveBeenCalledWith('Failed to copy chores: API Error');
      expect(closeModal).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });
});
