import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import type { FamilyChoresData } from '../types/chore-types';
import { ChoreType, SkipDayVisibility } from '../types/chore-types';
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
            caughtUp: true,
            completedToday: false,
          },
        ],
        lastResetDate: '2024-01-01',
        dailyCompletions: [],
        settings: {
          dailyResetTime: '03:00',
          historyEnabled: true,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => <Admin />);

      // Verify people are displayed
      await expect.element(page.getByText('People')).toBeVisible();

      const personCards = document.querySelectorAll('[data-testid="person-card"]');
      expect(personCards.length).toBe(2);
      expect(personCards[0].textContent).toContain('Alice');
      expect(personCards[1].textContent).toContain('Bob');
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
          dailyResetTime: '03:00',
          historyEnabled: true,
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
          dailyResetTime: '03:00',
          historyEnabled: true,
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
          dailyResetTime: '03:00',
          historyEnabled: true,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => <Admin />);
      await expect.element(page.getByText('Family Chores Admin')).toBeVisible();

      const container = document.querySelector('[data-testid="admin-container"]');
      expect(container).toBeTruthy();

      const header = document.querySelector('header');
      expect(header).toBeTruthy();

      const section = document.querySelector('[data-testid="people-section"]');
      expect(section).toBeTruthy();
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
          dailyResetTime: '03:00',
          historyEnabled: true,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => <Admin />);

      // Find the "Add Chore" button for Alice (first person)
      const addChoreButtons = page.getByRole('button', { name: 'Add Chore' });
      const aliceAddChoreButton = addChoreButtons.first();
      await expect.element(aliceAddChoreButton).toBeVisible();

      // Click the Add Chore button
      await aliceAddChoreButton.click();

      // Verify modal opened and contains the person's name (not "Person not found")
      const modalContent = document.querySelector('[data-testid="modal-content"]');
      expect(modalContent).toBeTruthy();

      // The modal should show "Assigned to: Alice" not "Person not found"
      expect(modalContent?.textContent).toContain('Alice');
      expect(modalContent?.textContent).not.toContain('Person not found');
      expect(modalContent?.textContent).toContain('Add Personal Chore');
    });
  });
});
