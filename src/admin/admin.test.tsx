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

const makeMockData = (): FamilyChoresData => ({
  people: [
    { id: 'p1', name: 'Alice', color: '#FF6B6B' },
    { id: 'p2', name: 'Bob', color: '#4ECDC4' },
  ],
  chores: [
    {
      id: 'c1',
      name: 'Do dishes',
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
    {
      id: 'rc1',
      name: 'Vacuum living room',
      type: ChoreType.ROTATING,
      rotation: ['p1', 'p2'],
      rotatingIndex: 0,
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
});

const mockFetch = (data: FamilyChoresData = makeMockData()) => {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response);
};

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
      expect(page.getByTestId('rotating-chores-section').elements().length).toBe(0);
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

  describe('Rotating Chore Modal', () => {
    it('should open rotating chore modal when clicking Add Rotating Chore button', async () => {
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

      // Switch to Rotation Chores tab
      await page.getByRole('button', { name: 'Rotation Chores' }).click();
      await expect.element(page.getByTestId('rotating-chores-section')).toBeVisible();

      // Click Add Rotating Chore — should open modal without crashing
      await page.getByRole('button', { name: 'Add Rotating Chore' }).click();
      await expect.element(page.getByTestId('modal-title')).toBeVisible();
      await expect.element(page.getByTestId('modal-title')).toHaveTextContent('Add Rotating Chore');
    });
  });

  describe('Button smoke tests', () => {
    // Top-level smoke tests — catch context/wiring bugs missed by isolated component tests
    it('Add Person opens PersonModal', async () => {
      mockFetch();
      render(() => <Admin />);
      await page.getByRole('button', { name: 'Add Person' }).click();
      await expect.element(page.getByTestId('modal-title')).toHaveTextContent('Add Person');
    });

    it('Settings opens SettingsModal', async () => {
      mockFetch();
      render(() => <Admin />);
      await page.getByRole('button', { name: /Settings/ }).click();
      await expect.element(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    });

    it('Edit person opens PersonModal with person pre-filled', async () => {
      mockFetch();
      render(() => <Admin />);
      await page.getByTestId('expand-person-chores').first().click();
      await page.getByRole('button', { name: 'Edit' }).first().click();
      await expect.element(page.getByTestId('modal-title')).toHaveTextContent('Edit Person');
    });

    it('History opens ChoreHistoryModal', async () => {
      mockFetch();
      render(() => <Admin />);
      await page.getByRole('button', { name: 'History' }).first().click();
      await expect.element(page.getByTestId('modal-content')).toBeVisible();
      await expect
        .element(page.getByTestId('modal-content'))
        .toHaveTextContent("Alice's Chore History");
    });

    it('Add Chore (personal) opens PersonalChoreModal', async () => {
      mockFetch();
      render(() => <Admin />);
      await page.getByTestId('expand-person-chores').first().click();
      await page.getByRole('button', { name: 'Add Chore' }).first().click();
      await expect.element(page.getByTestId('modal-title')).toHaveTextContent('Add Personal Chore');
    });

    it('Edit Chore (personal) opens PersonalChoreModal with chore pre-filled', async () => {
      mockFetch();
      render(() => <Admin />);
      await page.getByTestId('expand-person-chores').first().click();
      await page.getByTestId('chore-edit-btn').first().click();
      await expect
        .element(page.getByTestId('modal-title'))
        .toHaveTextContent('Edit Personal Chore');
    });

    it('Copy Chores opens CopyChoresModal', async () => {
      mockFetch();
      render(() => <Admin />);
      await page.getByTestId('expand-person-chores').first().click();
      await page.getByRole('button', { name: 'Copy Chores' }).first().click();
      await expect.element(page.getByTestId('modal-title')).toHaveTextContent('Copy Chores');
    });

    it('Add Rotating Chore opens RotatingChoreModal', async () => {
      mockFetch();
      render(() => <Admin />);
      await page.getByRole('button', { name: 'Rotation Chores' }).click();
      await page.getByRole('button', { name: 'Add Rotating Chore' }).click();
      await expect.element(page.getByTestId('modal-title')).toHaveTextContent('Add Rotating Chore');
    });

    it('Edit Rotating Chore opens RotatingChoreModal with chore pre-filled', async () => {
      mockFetch();
      render(() => <Admin />);
      await page.getByRole('button', { name: 'Rotation Chores' }).click();
      await page.getByRole('button', { name: 'Edit' }).click();
      await expect
        .element(page.getByTestId('modal-title'))
        .toHaveTextContent('Edit Rotating Chore');
    });

    it('Advance All Rotations opens AdvanceRotationsModal', async () => {
      mockFetch();
      render(() => <Admin />);
      await page.getByRole('button', { name: 'System Actions' }).click();
      await page.getByTestId('advance-rotations-btn').click();
      await expect.element(page.getByTestId('advance-rotations-modal')).toBeVisible();
    });

    it('Reset All Caught Up opens ResetCaughtUpModal', async () => {
      mockFetch();
      render(() => <Admin />);
      await page.getByRole('button', { name: 'System Actions' }).click();
      await page.getByTestId('reset-caught-up-btn').click();
      await expect.element(page.getByTestId('reset-caught-up-modal')).toBeVisible();
    });
  });

  describe('Tabs', () => {
    it('shows People tab as active by default', async () => {
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

      await expect.element(page.getByRole('button', { name: 'People' })).toBeVisible();

      const peopleTab = page.getByRole('button', { name: 'People' }).element();
      expect(peopleTab.classList.contains('border-indigo-600')).toBe(true);
      expect(peopleTab.classList.contains('text-indigo-600')).toBe(true);

      const rotatingTab = page.getByRole('button', { name: 'Rotation Chores' }).element();
      expect(rotatingTab.classList.contains('border-transparent')).toBe(true);
      expect(rotatingTab.classList.contains('text-slate-600')).toBe(true);

      const systemTab = page.getByRole('button', { name: 'System Actions' }).element();
      expect(systemTab.classList.contains('border-transparent')).toBe(true);
      expect(systemTab.classList.contains('text-slate-600')).toBe(true);
    });

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
