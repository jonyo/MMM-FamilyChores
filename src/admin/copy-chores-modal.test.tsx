import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { copyChores } from '../api';
import type { Person } from '../types/chore-types';
import { CopyChoresModal } from './copy-chores-modal';
import { MockAdminProvider, mockPersonalChore } from './test-utils';

vi.mock('../api', () => ({
  copyChores: vi.fn(),
}));

describe('CopyChoresModal', () => {
  const mockFromPerson: Person = { id: 'p1', name: 'Alice', color: '#FF6B6B' };
  const mockToPerson: Person = { id: 'p2', name: 'Bob', color: '#4ECDC4' };

  describe('Rendering', () => {
    it('should render modal with chores available', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
          }}
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('modal-title')).toBeVisible();
      expect(page.getByTestId('modal-title').element().textContent).toBe('Copy Chores');
      await expect.element(page.getByTestId('copy-from-display')).toBeVisible();
      await expect.element(page.getByTestId('copy-from-display')).toHaveTextContent('From: Alice');
      expect(page.getByRole('combobox').element()).toBeTruthy();
      await expect.element(page.getByTestId('checkbox-list')).toBeVisible();
    });

    it('should display from person color badge', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
          }}
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('person-color-badge')).toBeVisible();
      const colorBadge = page.getByTestId('person-color-badge').element() as HTMLElement;
      expect(colorBadge?.style.backgroundColor).toBe('rgb(255, 107, 107)');
    });

    it('should show empty state when no personal chores', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [],
          }}
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('empty-message-text')).toBeVisible();
      expect(page.getByTestId('empty-message-text').element().textContent).toContain(
        'No personal chores to copy for Alice'
      );
    });

    it('should show empty state when no other people available', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
          }}
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByTestId('empty-message-text')).toBeVisible();
      expect(page.getByTestId('empty-message-text').element().textContent).toContain(
        'No other people available to copy chores to'
      );
    });

    it('should list all personal chores with checkboxes default checked', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
          }}
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const checkboxes = page.getByRole('checkbox').elements();
      expect(checkboxes.length).toBe(2);
      expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
      expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
    });

    it('should populate dropdown with available people', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
          }}
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const select = page.getByRole('combobox').element() as HTMLSelectElement;
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
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
          }}
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const cancelButton = page.getByRole('button', { name: 'Cancel' });
      await expect.element(cancelButton).toBeVisible();
      await cancelButton.click();

      expect(closeModal).toHaveBeenCalled();
      expect(copyChores).not.toHaveBeenCalled();
    });

    it('should uncheck a chore checkbox', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
          }}
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const checkbox = page.getByLabelText('Take out trash');
      await checkbox.click();

      await expect.element(checkbox).not.toBeChecked();
    });

    it('should submit form with selected chores', async () => {
      const closeModal = vi.fn();
      vi.mocked(copyChores).mockResolvedValueOnce(undefined);

      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
          }}
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
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
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
          }}
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
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
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
          }}
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
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

  describe('PIN caching', () => {
    it('should show PIN field when pinRequired and no cachedPin', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
            settings: { historyEnabled: true },
          }}
          pinRequired={true}
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      await expect.element(page.getByLabelText('Admin PIN')).toBeVisible();
    });

    it('should hide PIN field when cachedPin is provided', async () => {
      const closeModal = vi.fn();

      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
            settings: { historyEnabled: true },
          }}
          pinRequired={true}
          initialCachedPin="1234"
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      expect(page.getByLabelText('Admin PIN').elements().length).toBe(0);
    });

    it('should use cachedPin in request and not call onPinRemembered', async () => {
      const closeModal = vi.fn();
      vi.mocked(copyChores).mockResolvedValueOnce(undefined);

      render(() => (
        <MockAdminProvider
          choreDataOverride={{
            people: [mockFromPerson, mockToPerson],
            chores: [
              {
                ...mockPersonalChore,
                id: 'c1',
                name: 'Take out trash',
                assignedTo: 'p1',
                deadline: '21:00',
              },
              { ...mockPersonalChore, id: 'c2', name: 'Do dishes', assignedTo: 'p1' },
            ],
            settings: { historyEnabled: true },
          }}
          pinRequired={true}
          initialCachedPin="1234"
        >
          <CopyChoresModal fromPerson={mockFromPerson} closeModal={closeModal} />
        </MockAdminProvider>
      ));

      const select = page.getByRole('combobox');
      await select.selectOptions('p2');
      const copyButton = page.getByRole('button', { name: 'Copy' });
      await copyButton.click();

      expect(copyChores).toHaveBeenCalledWith(
        expect.objectContaining({
          fromPersonId: 'p1',
          toPersonId: 'p2',
          pin: '1234',
        })
      );
      expect(closeModal).toHaveBeenCalled();
    });
  });
});
