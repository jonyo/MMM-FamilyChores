import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../public/admin.css';
import type { FamilyChoresData } from '../types/chore-types';
import { ChoreType, SkipDayVisibility } from '../types/chore-types';
import { Admin } from './admin';

// Mock fetch API
globalThis.fetch = vi.fn();

describe('Admin Component Tests', () => {
  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
  });

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

      // Add mount point
      const appDiv = document.createElement('div');
      document.body.appendChild(appDiv);
      appDiv.id = 'app';

      // Render the Admin component
      render(() => Admin(), appDiv);

      // Wait for data to load
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify people are displayed
      const peopleSection = document.querySelector('#peopleList');
      expect(peopleSection).toBeTruthy();

      const personCards = document.querySelectorAll('.item-card');
      expect(personCards.length).toBe(2);
    });

    it('should show error when data load fails', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      // Add mount point
      const appDiv = document.createElement('div');
      document.body.appendChild(appDiv);
      appDiv.id = 'app';

      // Render the Admin component
      render(() => Admin(), appDiv);

      // Wait for error
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(alertSpy).toHaveBeenCalledWith('Failed to load data. Please refresh the page.');

      alertSpy.mockRestore();
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

      // Add mount point
      const appDiv = document.createElement('div');
      document.body.appendChild(appDiv);
      appDiv.id = 'app';

      // Render the Admin component
      render(() => Admin(), appDiv);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const addPersonInfo = document.getElementById('addPersonInfo');
      expect(addPersonInfo).toBeTruthy();
      expect(addPersonInfo?.style.display).toBe('inline');
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

      // Add mount point
      const appDiv = document.createElement('div');
      document.body.appendChild(appDiv);
      appDiv.id = 'app';

      // Render the Admin component
      render(() => Admin(), appDiv);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const rotatingSection = document.getElementById('rotatingChoresSection');
      expect(rotatingSection).toBeTruthy();
      expect(rotatingSection?.style.display).toBe('none');
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

      // Add mount point
      const appDiv = document.createElement('div');
      document.body.appendChild(appDiv);
      appDiv.id = 'app';

      // Render the Admin component
      render(() => Admin(), appDiv);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const container = document.querySelector('.container');
      expect(container).toBeTruthy();

      const header = document.querySelector('header');
      expect(header).toBeTruthy();

      const section = document.querySelector('.section');
      expect(section).toBeTruthy();
    });
  });
});
