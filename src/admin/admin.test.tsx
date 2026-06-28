import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import type { FamilyChoresData } from '../types/chore-types';
import {
  AfterDeadlineVisibility,
  BeforeStartTimeVisibility,
  ChoreType,
  NotCaughtUpDisplay,
  SkipDayVisibility,
  TimeFormat,
} from '../types/chore-types';
import { Admin } from './admin';

// Mock fetch API
globalThis.fetch = vi.fn();

describe('Admin Component Tests', () => {
  describe('Data Loading', () => {
    it('should load and display chore data', async () => {
      const mockData: FamilyChoresData = {
        people: [
          { id: 'p1', name: 'Alice', color: '#FF6B6B' },
          { id: 'p2', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [
          {
            id: 'c1',
            name: 'Take out trash',
            type: ChoreType.PERSONAL,
            assignedTo: 'p1',
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            beforeStartTimeVisibility: BeforeStartTimeVisibility.HIDE,
            afterDeadlineVisibility: AfterDeadlineVisibility.SHOW_OVERDUE,
            notCaughtUpDisplay: NotCaughtUpDisplay.OVERDUE,
            caughtUp: true,
            completedToday: false,
          },
        ],
        lastResetDate: '2024-01-01',
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
          timeFormat: TimeFormat.SYSTEM,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => <Admin />);

      // Verify the People tab is active and people are displayed
      await expect.element(page.getByRole('button', { name: 'People' })).toBeVisible();

      const personCards = page.getByTestId('person-card').elements();
      expect(personCards.length).toBe(2);
      expect(personCards[0].textContent).toContain('Alice');
      expect(personCards[1].textContent).toContain('Bob');
      // Verify the collapsed accordion view shows the personal chore count
      expect(personCards[0].textContent).toContain('1 personal chore');
    });
  });

  describe('People Section', () => {
    it('should show add person info when no people exist', async () => {
      const mockData: FamilyChoresData = {
        people: [],
        chores: [],
        dailyCompletions: [],
        lastResetDate: '2024-01-01',
        settings: {
          historyEnabled: true,
          timeFormat: TimeFormat.SYSTEM,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => <Admin />);
      await expect.element(page.getByRole('button', { name: 'Add Person' })).toBeVisible();
    });

    it('should hide rotating chores section when no people exist', async () => {
      const mockData: FamilyChoresData = {
        people: [],
        chores: [],
        dailyCompletions: [],
        lastResetDate: '2024-01-01',
        settings: {
          historyEnabled: true,
          timeFormat: TimeFormat.SYSTEM,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => <Admin />);
      await expect.element(page.getByText('Family Chores Admin')).toBeVisible();

      // Verify rotating chores section is not present when no people exist
      const rotatingSection = document.getElementById('rotatingChoresSection');
      expect(rotatingSection).toBeFalsy();
    });
  });

  describe('CSS Integration', () => {
    it('should apply CSS classes correctly', async () => {
      const mockData: FamilyChoresData = {
        people: [{ id: 'p1', name: 'Alice', color: '#FF6B6B' }],
        chores: [],
        dailyCompletions: [],
        lastResetDate: '2024-01-01',
        settings: {
          historyEnabled: true,
          timeFormat: TimeFormat.SYSTEM,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => <Admin />);
      await expect.element(page.getByText('Family Chores Admin')).toBeVisible();

      await expect.element(page.getByTestId('admin-container')).toBeVisible();
      await expect.element(page.getByTestId('people-section')).toBeVisible();
    });
  });

  describe('Chore Modal', () => {
    it('should open personal chore modal with correct person when clicking add chore', async () => {
      const mockData: FamilyChoresData = {
        people: [
          { id: 'p1', name: 'Alice', color: '#FF6B6B' },
          { id: 'p2', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [],
        dailyCompletions: [],
        lastResetDate: '2024-01-01',
        settings: {
          historyEnabled: true,
          timeFormat: TimeFormat.SYSTEM,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => <Admin />);

      // Expand the first person's accordion to reveal the Add Chore button
      const expandButtons = page.getByTestId('expand-person-chores');
      await expect.element(expandButtons.first()).toBeVisible();
      await expandButtons.first().click();

      // Find the "Add Chore" button for Alice (first person)
      const addChoreButtons = page.getByRole('button', { name: 'Add Chore' });
      const aliceAddChoreButton = addChoreButtons.first();
      await expect.element(aliceAddChoreButton).toBeVisible();

      // Click the Add Chore button
      await aliceAddChoreButton.click();

      // Verify modal opened and contains the person's name (not "Person not found")
      await expect.element(page.getByTestId('modal-content')).toBeVisible();

      // The modal should show "Assigned to: Alice" not "Person not found"
      await expect.element(page.getByTestId('modal-content')).toHaveTextContent('Alice');
      expect(page.getByTestId('modal-content').element().textContent).not.toContain(
        'Person not found'
      );
      await expect
        .element(page.getByTestId('modal-content'))
        .toHaveTextContent('Add Personal Chore');
    });
  });

  describe('Tabs', () => {
    it('should switch between tabs', async () => {
      const mockData: FamilyChoresData = {
        people: [
          { id: 'p1', name: 'Alice', color: '#FF6B6B' },
          { id: 'p2', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [],
        dailyCompletions: [],
        lastResetDate: '2024-01-01',
        settings: {
          historyEnabled: true,
          timeFormat: TimeFormat.SYSTEM,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => <Admin />);

      await expect.element(page.getByRole('button', { name: 'People' })).toBeVisible();
      await expect.element(page.getByRole('button', { name: 'Rotation Chores' })).toBeVisible();
      await expect.element(page.getByRole('button', { name: 'System Actions' })).toBeVisible();

      // Verify default People tab is active
      await expect.element(page.getByTestId('people-section')).toBeVisible();
      expect(page.getByTestId('system-actions-section').elements().length).toBe(0);

      // Switch to System Actions tab
      await page.getByRole('button', { name: 'System Actions' }).click();
      await expect.element(page.getByTestId('system-actions-section')).toBeVisible();
      expect(page.getByTestId('people-section').elements().length).toBe(0);

      // Switch to Rotation Chores tab
      await page.getByRole('button', { name: 'Rotation Chores' }).click();
      await expect.element(page.getByTestId('rotating-chores-section')).toBeVisible();
    });
  });
});
