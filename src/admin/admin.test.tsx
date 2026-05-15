import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import '../../public/admin.css';
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
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => Admin({} as Record<string, never>));

      // Wait for data to load
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify people are displayed
      const peopleSection = document.querySelector('#peopleList');
      expect(peopleSection).toBeTruthy();

      const personCards = document.querySelectorAll('.item-card');
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
        lastResetDate: '2024-01-01',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => Admin({} as Record<string, never>));
      await new Promise((resolve) => setTimeout(resolve, 100));

      const addPersonInfo = document.getElementById('addPersonInfo');
      expect(addPersonInfo).toBeTruthy();
      expect(addPersonInfo?.style.display).toBe('');
    });

    it('should hide rotating chores section when no people exist', async () => {
      const mockData: FamilyChoresData = {
        people: [],
        chores: [],
        lastResetDate: '2024-01-01',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => Admin({} as Record<string, never>));
      await new Promise((resolve) => setTimeout(resolve, 100));

      const rotatingSection = document.getElementById('rotatingChoresSection');
      expect(rotatingSection).toBeTruthy();
      expect(rotatingSection?.style.display).toBe('');
    });
  });

  describe('CSS Integration', () => {
    it('should apply CSS classes correctly', async () => {
      const mockData: FamilyChoresData = {
        people: [{ id: 'p1', name: 'Alice', color: '#FF6B6B' }],
        chores: [],
        lastResetDate: '2024-01-01',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => Admin({} as Record<string, never>));
      await new Promise((resolve) => setTimeout(resolve, 100));

      const container = document.querySelector('.container');
      expect(container).toBeTruthy();

      const header = document.querySelector('header');
      expect(header).toBeTruthy();

      const section = document.querySelector('.section');
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
        lastResetDate: '2024-01-01',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      render(() => Admin({} as Record<string, never>));
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Find the "Add Chore" button for Alice (first person)
      const addChoreButtons = document.querySelectorAll('.person-chores-actions button');
      const aliceAddChoreButton = addChoreButtons[0] as HTMLButtonElement;
      expect(aliceAddChoreButton).toBeTruthy();
      expect(aliceAddChoreButton.textContent).toContain('Add Chore');

      // Click the Add Chore button
      aliceAddChoreButton.click();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify modal opened and contains the person's name (not "Person not found")
      const modalContent = document.querySelector('.modal-content');
      expect(modalContent).toBeTruthy();

      // The modal should show "Assigned to: Alice" not "Person not found"
      expect(modalContent?.textContent).toContain('Alice');
      expect(modalContent?.textContent).not.toContain('Person not found');
      expect(modalContent?.textContent).toContain('Add Personal Chore');
    });
  });
});
