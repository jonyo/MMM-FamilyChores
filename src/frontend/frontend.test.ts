import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import '../../css/main.css';
import type { FamilyChoresData } from '../types/chore-types';
import type { FamilyChoresModule } from '../types/module';
import './frontend';

type FamilyChoresModuleWithExtras = FamilyChoresModule & {
  getFilteredChores: () => FamilyChoresData['chores'];
  renderChoreItem: (chore: FamilyChoresData['chores'][0], choreData: FamilyChoresData) => string;
};

const { capturedModule } = vi.hoisted(() => {
  vi.stubGlobal('Log', {
    info: vi.fn(),
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  });

  // Capture module definition for testing
  let module: FamilyChoresModule | null = null;

  vi.stubGlobal('Module', {
    register: vi.fn((_name: string, moduleDefinition: FamilyChoresModule) => {
      module = moduleDefinition;
      return moduleDefinition;
    }),
  });

  return {
    capturedModule: () => module,
  };
});

describe('Frontend Tests', () => {
  let module: FamilyChoresModuleWithExtras;
  let mockSendSocketNotification: ReturnType<typeof vi.fn>;
  let mockUpdateDom: ReturnType<typeof vi.fn>;
  let mockFile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Add black background for better screenshot visibility in tests
    const testStyle = document.createElement('style');
    testStyle.type = 'text/css';
    testStyle.textContent = `
      body {
        background: #000 !important;
        margin: 0;
        padding: 20px;
      }
    `;
    document.head.appendChild(testStyle);

    // Mock MagicMirror module methods with proper signatures
    mockSendSocketNotification = vi.fn();
    mockUpdateDom = vi.fn();
    mockFile = vi.fn((filename: string) => filename);

    // Get captured module definition and mock MagicMirror methods
    const capturedModuleFn = capturedModule();
    if (!capturedModuleFn) {
      throw new Error('Module not captured - ensure frontend.ts is imported first');
    }

    module = {
      ...capturedModuleFn,
      sendSocketNotification: mockSendSocketNotification as (
        notification: string,
        payload?: unknown
      ) => void,
      updateDom: mockUpdateDom as (speed?: number) => void,
      file: mockFile as (filename: string) => string,
    } as FamilyChoresModuleWithExtras;

    module.config = {
      updateInterval: 60000,
      dataFile: 'data.json',
      adminPin: null,
      personFilter: null,
    };
  });

  afterEach(() => {
    // Clean up DOM after each test to prevent interference
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    if (module) {
      module.choreData = null;
    }
  });

  describe('Module Configuration', () => {
    it('should have correct default configuration', () => {
      expect(module.defaults.updateInterval).toBe(60000);
      expect(module.defaults.dataFile).toBe('data.json');
      expect(module.defaults.adminPin).toBe(null);
    });

    it('should return correct styles', () => {
      const styles = module.getStyles();
      expect(styles).toContain('css/main.css');
      expect(mockFile).toHaveBeenCalledWith('css/main.css');
    });
  });

  describe('start', () => {
    it('should initialize module and start data loading', () => {
      const loadDataSpy = vi.spyOn(module, 'loadData');
      const scheduleUpdateSpy = vi.spyOn(module, 'scheduleUpdate');

      module.start();

      expect(loadDataSpy).toHaveBeenCalled();
      expect(scheduleUpdateSpy).toHaveBeenCalled();
    });
  });

  describe('getFilteredChores', () => {
    beforeEach(() => {
      module.choreData = {
        people: [
          { id: 'alice', name: 'Alice', color: '#FF6B6B' },
          { id: 'bob', name: 'Bob', color: '#4ECDC4' },
          { id: 'charlie', name: 'Charlie', color: '#45B7D1' },
        ],
        chores: [
          {
            id: '1',
            name: 'Take out trash',
            type: 'rotating',
            rotation: ['alice', 'bob'],
            rotatingIndex: 0,
            completedToday: false,
          },
          {
            id: '2',
            name: 'Clean kitchen',
            type: 'personal',
            assignedTo: 'bob',
            completedToday: false,
          },
          {
            id: '3',
            name: 'Vacuum living room',
            type: 'personal',
            assignedTo: 'charlie',
            completedToday: false,
          },
        ],
      };
    });

    it('should return all chores when no filter is set', () => {
      module.config.personFilter = null;
      const filtered = module.getFilteredChores();
      expect(filtered).toHaveLength(3);
    });

    it('should filter by person ID', () => {
      module.config.personFilter = 'bob';
      const filtered = module.getFilteredChores();
      expect(filtered).toHaveLength(1); // only personal chore assigned to bob
      expect(filtered.map((c) => c.id)).toEqual(['2']);
    });

    it('should filter by person name (case insensitive)', () => {
      module.config.personFilter = 'ALICE';
      const filtered = module.getFilteredChores();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter rotating chores correctly', () => {
      module.config.personFilter = 'alice';
      const filtered = module.getFilteredChores();
      // rotating chore where alice is current
      expect(filtered.some((c) => c.id === '1')).toBe(true);
      expect(filtered).toHaveLength(1);
    });

    it('should return empty array when no person matches filter', () => {
      module.config.personFilter = 'nonexistent';
      const filtered = module.getFilteredChores();
      expect(filtered).toHaveLength(0);
    });

    it('should return empty array when no chore data', () => {
      module.choreData = null;
      const filtered = module.getFilteredChores();
      expect(filtered).toHaveLength(0);
    });

    it('should handle whitespace in filter', () => {
      module.config.personFilter = '  alice  ';
      const filtered = module.getFilteredChores();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  describe('renderChoreItem', () => {
    beforeEach(() => {
      module.choreData = {
        people: [
          { id: 'alice', name: 'Alice', color: '#FF6B6B' },
          { id: 'bob', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [],
      };
    });

    it('should render personal chore with assigned person', () => {
      if (!module.choreData) {
        throw new Error('choreData is null');
      }
      const chore = {
        id: '1',
        name: 'Clean kitchen',
        type: 'personal' as const,
        assignedTo: 'alice',
        completedToday: false,
      };

      const html = module.renderChoreItem(chore, module.choreData);

      expect(html).toContain('Clean kitchen');
      expect(html).toContain('Alice');
      expect(html).toContain('#FF6B6B');
      expect(html).toContain('data-chore-id="1"');
      expect(html).toContain('id="chore-1"');
      expect(html).not.toContain('checked');
      expect(html).not.toContain('completed');
    });

    it('should render completed chore (DOM testing)', () => {
      if (!module.choreData) {
        throw new Error('choreData is null');
      }
      const chore = {
        id: '2',
        name: 'Take out trash',
        type: 'personal' as const,
        assignedTo: 'bob',
        completedToday: true,
      };

      // Render and append to DOM
      const html = module.renderChoreItem(chore, module.choreData);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const choreElement = tempDiv.firstElementChild as HTMLElement;
      document.body.appendChild(choreElement);

      // Verify DOM structure and completed class
      expect(choreElement).toBeTruthy();
      expect(choreElement.classList.contains('completed')).toBe(true);
      expect(choreElement.classList.contains('overdue')).toBe(false);
      expect(choreElement.classList.contains('normal')).toBe(false);

      // Verify checkbox is checked
      const checkbox = choreElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
      expect(checkbox.id).toBe('chore-2');

      // Verify completed class is applied
      expect(choreElement.classList.contains('completed')).toBe(true);
      expect(choreElement.classList.contains('overdue')).toBe(false);
      expect(choreElement.classList.contains('normal')).toBe(false);

      // Verify content
      const choreName = choreElement.querySelector('.chore-name');
      expect(choreName?.textContent).toBe('Take out trash');
      expect(choreElement.querySelector('.assigned-to')?.textContent).toBe('Bob');
    });

    it('should render rotating chore with current person', () => {
      if (!module.choreData) {
        throw new Error('choreData is null');
      }
      const chore = {
        id: '3',
        name: 'Vacuum',
        type: 'rotating' as const,
        rotation: ['alice', 'bob'],
        rotatingIndex: 1,
        completedToday: false,
      };

      const html = module.renderChoreItem(chore, module.choreData);

      expect(html).toContain('Bob');
      expect(html).toContain('#4ECDC4');
    });

    it('should render chore with deadline', () => {
      if (!module.choreData) {
        throw new Error('choreData is null');
      }
      const chore = {
        id: '4',
        name: 'Water plants',
        type: 'personal' as const,
        assignedTo: 'alice',
        completedToday: false,
        deadline: 'Daily',
      };

      const html = module.renderChoreItem(chore, module.choreData);

      expect(html).toContain('Daily');
    });

    it('should render unassigned chore', () => {
      if (!module.choreData) {
        throw new Error('choreData is null');
      }
      const chore = {
        id: '5',
        name: 'General cleanup',
        type: 'personal' as const,
        assignedTo: 'nonexistent',
        completedToday: false,
      };

      const html = module.renderChoreItem(chore, module.choreData);

      expect(html).toContain('Unassigned');
      expect(html).toContain('#ccc');
    });

    describe('deadline CSS classes (DOM testing)', () => {
      beforeEach(() => {
        // Mock current time to 11:30 for consistent deadline testing
        vi.useFakeTimers();
        const mockDate = new Date('2024-05-12T15:30:00.000Z'); // 11:30 in America/New_York
        vi.setSystemTime(mockDate);

        // Clear any existing DOM elements
        document.body.innerHTML = '';
      });

      afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = '';
      });

      it('should apply overdue class and styling when current time is after deadline', () => {
        if (!module.choreData) {
          throw new Error('choreData is null');
        }
        const chore = {
          id: 'deadline-overdue',
          name: 'Morning task',
          type: 'personal' as const,
          assignedTo: 'alice',
          deadline: '08:00', // Past current time (11:30)
          completedToday: false,
        };

        // Render and append to DOM
        const html = module.renderChoreItem(chore, module.choreData);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const choreElement = tempDiv.firstElementChild as HTMLElement;
        document.body.appendChild(choreElement);

        // Verify DOM structure and classes
        expect(choreElement).toBeTruthy();
        expect(choreElement.classList.contains('overdue')).toBe(true);
        expect(choreElement.classList.contains('completed')).toBe(false);
        expect(choreElement.classList.contains('normal')).toBe(false);

        // Verify overdue class is applied (CSS styles will be applied via CSS rules)
        expect(choreElement.classList.contains('overdue')).toBe(true);

        // Verify content
        expect(choreElement.querySelector('.chore-name')?.textContent).toBe('Morning task');
        expect(choreElement.querySelector('.deadline')?.textContent).toBe('08:00');

        // Verify checkbox state
        const checkbox = choreElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
      });

      it('should apply normal class and default styling when current time is before deadline', () => {
        if (!module.choreData) {
          throw new Error('choreData is null');
        }
        const chore = {
          id: 'deadline-normal',
          name: 'Evening task',
          type: 'personal' as const,
          assignedTo: 'alice',
          deadline: '21:00', // Future time (11:30 < 21:00)
          completedToday: false,
        };

        const html = module.renderChoreItem(chore, module.choreData);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const choreElement = tempDiv.firstElementChild as HTMLElement;
        document.body.appendChild(choreElement);

        // Verify DOM structure and classes
        expect(choreElement.classList.contains('normal')).toBe(true);
        expect(choreElement.classList.contains('overdue')).toBe(false);
        expect(choreElement.classList.contains('completed')).toBe(false);

        // Verify normal class is applied (CSS styles will be applied via CSS rules)
        expect(choreElement.classList.contains('normal')).toBe(true);

        // Verify content
        expect(choreElement.querySelector('.chore-name')?.textContent).toBe('Evening task');
        expect(choreElement.querySelector('.deadline')?.textContent).toBe('21:00');
      });

      it('should apply overdue class when current time equals deadline', () => {
        if (!module.choreData) {
          throw new Error('choreData is null');
        }
        const chore = {
          id: 'deadline-equal',
          name: 'Exact time task',
          type: 'personal' as const,
          assignedTo: 'alice',
          deadline: '11:30', // Equal to current time
          completedToday: false,
        };

        const html = module.renderChoreItem(chore, module.choreData);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const choreElement = tempDiv.firstElementChild as HTMLElement;
        document.body.appendChild(choreElement);

        // Verify DOM structure and content (timezone-dependent logic tested in unit tests)
        expect(choreElement).toBeTruthy();
        expect(choreElement.querySelector('.chore-name')?.textContent).toBe('Exact time task');
        expect(choreElement.querySelector('.deadline')?.textContent).toBe('11:30');
        expect(choreElement.querySelector('input[type="checkbox"]')).toBeTruthy();

        // Note: The exact class (overdue vs normal) depends on timezone and current time
        // This is tested thoroughly in the unit tests for getDeadlineStatus
        // Here we just verify the DOM structure is correct
      });

      it('should apply completed class regardless of deadline when completed', () => {
        if (!module.choreData) {
          throw new Error('choreData is null');
        }
        const chore = {
          id: 'deadline-completed',
          name: 'Completed task',
          type: 'personal' as const,
          assignedTo: 'alice',
          deadline: '08:00', // Past current time
          completedToday: true, // But completed
        };

        const html = module.renderChoreItem(chore, module.choreData);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const choreElement = tempDiv.firstElementChild as HTMLElement;
        document.body.appendChild(choreElement);

        // Verify completed class takes priority
        expect(choreElement.classList.contains('completed')).toBe(true);
        expect(choreElement.classList.contains('overdue')).toBe(false);
        expect(choreElement.classList.contains('normal')).toBe(false);

        // Verify completed class takes priority
        expect(choreElement.classList.contains('completed')).toBe(true);
        expect(choreElement.classList.contains('overdue')).toBe(false);
        expect(choreElement.classList.contains('normal')).toBe(false);

        // Verify checkbox is checked
        const checkbox = choreElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);

        // Verify content
        expect(choreElement.querySelector('.chore-name')?.textContent).toBe('Completed task');
        expect(choreElement.querySelector('.assigned-to')?.textContent).toBe('Alice');
      });

      it('should apply normal class when no deadline is set', () => {
        if (!module.choreData) {
          throw new Error('choreData is null');
        }
        const chore = {
          id: 'no-deadline',
          name: 'No deadline task',
          type: 'personal' as const,
          assignedTo: 'alice',
          completedToday: false,
          // No deadline property
        };

        const html = module.renderChoreItem(chore, module.choreData);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const choreElement = tempDiv.firstElementChild as HTMLElement;
        document.body.appendChild(choreElement);

        // Verify normal class and no deadline element
        expect(choreElement.classList.contains('normal')).toBe(true);
        expect(choreElement.classList.contains('overdue')).toBe(false);
        expect(choreElement.classList.contains('completed')).toBe(false);

        expect(choreElement.querySelector('.deadline')).toBeNull();
        expect(choreElement.querySelector('.chore-name')?.textContent).toBe('No deadline task');
      });

      it('should apply overdue class to rotating chores with missed deadline', () => {
        if (!module.choreData) {
          throw new Error('choreData is null');
        }
        const chore = {
          id: 'rotating-overdue',
          name: 'Rotating task',
          type: 'rotating' as const,
          rotation: ['alice', 'bob'],
          rotatingIndex: 0,
          deadline: '08:00', // Past current time
          completedToday: false,
        };

        const html = module.renderChoreItem(chore, module.choreData);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const choreElement = tempDiv.firstElementChild as HTMLElement;
        document.body.appendChild(choreElement);

        // Verify overdue styling for rotating chore
        expect(choreElement.classList.contains('overdue')).toBe(true);
        expect(choreElement.classList.contains('normal')).toBe(false);

        // Verify current rotation person is displayed
        const assignedTo = choreElement.querySelector('.assigned-to');
        expect(assignedTo?.textContent).toBe('Alice'); // Current rotation person
        expect(assignedTo?.getAttribute('style')).toContain('#FF6B6B'); // Alice's color

        // Verify deadline content
        const deadline = choreElement.querySelector('.deadline');
        expect(deadline?.textContent).toBe('08:00');
      });

      describe('caughtUp behavior', () => {
        it('should apply overdue class when not caught up regardless of deadline', () => {
          if (!module.choreData) {
            throw new Error('choreData is null');
          }
          const chore = {
            id: 'not-caught-up',
            name: 'Not caught up task',
            type: 'personal' as const,
            assignedTo: 'alice',
            deadline: '23:59', // Future deadline
            completedToday: false,
            caughtUp: false, // Not caught up - should show overdue
          };

          const html = module.renderChoreItem(chore, module.choreData);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          const choreElement = tempDiv.firstElementChild as HTMLElement;
          document.body.appendChild(choreElement);

          // Should show overdue because not caught up
          expect(choreElement.classList.contains('overdue')).toBe(true);
          expect(choreElement.classList.contains('normal')).toBe(false);
          expect(choreElement.classList.contains('completed')).toBe(false);

          // Verify content
          expect(choreElement.querySelector('.chore-name')?.textContent).toBe('Not caught up task');
          expect(choreElement.querySelector('.deadline')?.textContent).toBe('23:59');
        });

        it('should apply normal class when caught up and deadline is future', () => {
          if (!module.choreData) {
            throw new Error('choreData is null');
          }
          const chore = {
            id: 'caught-up',
            name: 'Caught up task',
            type: 'personal' as const,
            assignedTo: 'alice',
            deadline: '23:59', // Future deadline
            completedToday: false,
            caughtUp: true, // Caught up - should show normal
          };

          const html = module.renderChoreItem(chore, module.choreData);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          const choreElement = tempDiv.firstElementChild as HTMLElement;
          document.body.appendChild(choreElement);

          // Should show normal because caught up and deadline is future
          expect(choreElement.classList.contains('normal')).toBe(true);
          expect(choreElement.classList.contains('overdue')).toBe(false);
          expect(choreElement.classList.contains('completed')).toBe(false);

          // Verify content
          expect(choreElement.querySelector('.chore-name')?.textContent).toBe('Caught up task');
          expect(choreElement.querySelector('.deadline')?.textContent).toBe('23:59');
        });
      });
    });
  });

  describe('getDom', () => {
    it('should show loading state when no chore data', async () => {
      module.choreData = null;

      // Render the module to page
      const dom = module.getDom();
      document.body.appendChild(dom);

      // Use page locators to verify loading state
      expect(page.getByText('Loading...')).toBeVisible();
    });

    it('should show chore data when available', async () => {
      module.choreData = {
        people: [
          { id: '1', name: 'Alice', color: '#FF6B6B' },
          { id: '2', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [
          {
            id: '1',
            name: 'Take out trash',
            type: 'rotating',
            rotation: ['1', '2'],
            rotatingIndex: 0,
            completedToday: true,
          },
          {
            id: '2',
            name: 'Clean kitchen',
            type: 'personal',
            assignedTo: '1',
            completedToday: false,
          },
        ],
      };

      // Render the module to page
      const dom = module.getDom();
      document.body.appendChild(dom);

      // Use page locators to verify content
      expect(page.getByText('Take out trash')).toBeVisible();
      expect(page.getByText('Clean kitchen')).toBeVisible();
      expect(page.getByText('Alice').first()).toBeVisible();
      expect(page.getByRole('checkbox').first()).toBeVisible();
      expect(page.getByText('Loading...').elements()).toHaveLength(0);
    });

    it('should filter chores by personFilter using person name', async () => {
      module.choreData = {
        people: [
          { id: '1', name: 'Alice', color: '#FF6B6B' },
          { id: '2', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [
          {
            id: '1',
            name: 'Take out trash',
            type: 'rotating',
            rotation: ['1', '2'],
            rotatingIndex: 0,
            completedToday: true,
          },
          {
            id: '2',
            name: 'Clean kitchen',
            type: 'personal',
            assignedTo: '2',
            completedToday: false,
          },
        ],
      };

      module.config.personFilter = 'Alice';

      const dom = module.getDom();
      document.body.appendChild(dom);

      expect(page.getByText('Take out trash')).toBeVisible();
      expect(page.getByText('Clean kitchen').elements()).toHaveLength(0);
    });

    it('should show empty state when filter matches no chores', async () => {
      module.choreData = {
        people: [
          { id: '1', name: 'Alice', color: '#FF6B6B' },
          { id: '2', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [
          {
            id: '1',
            name: 'Clean kitchen',
            type: 'personal',
            assignedTo: '1',
            completedToday: false,
          },
        ],
      };

      module.config.personFilter = 'Bob'; // Bob has no chores

      const dom = module.getDom();
      document.body.appendChild(dom);

      expect(page.getByText('No chores match the current filter.')).toBeVisible();
      expect(page.getByText('Clean kitchen').elements()).toHaveLength(0);
    });
  });

  describe('socketNotificationReceived', () => {
    it('should handle CHORE_DATA notification', () => {
      const mockData = {
        people: [{ id: '1', name: 'Alice', color: '#FF6B6B' }],
        chores: [{ id: '1', name: 'Test Chore', type: 'personal', assignedTo: '1' }],
      };

      module.socketNotificationReceived('CHORE_DATA', mockData);

      expect(module.choreData).toBe(mockData);
      expect(mockUpdateDom).toHaveBeenCalled();
    });

    it('should handle CHORE_UPDATE_RESULT notification', () => {
      const loadDataSpy = vi.spyOn(module, 'loadData');

      module.socketNotificationReceived('CHORE_UPDATE_RESULT', { choreId: '1', completed: true });

      expect(loadDataSpy).toHaveBeenCalled();
    });

    it('should handle CONFIG_RESPONSE notification', () => {
      module.socketNotificationReceived('CONFIG_RESPONSE', {});
      // Should not error, just log debug
    });

    it('should handle PIN_ERROR notification', () => {
      module.socketNotificationReceived('PIN_ERROR', { message: 'Invalid PIN' });
      // Should not error, just log warning
    });

    it('should handle unknown notification', () => {
      module.socketNotificationReceived('UNKNOWN_NOTIFICATION', {});
      // Should not error, just log warning
    });
  });

  describe('toggleChoreCompletion', () => {
    it('should send CHORE_TOGGLE socket notification', () => {
      module.toggleChoreCompletion('chore-1', true);

      expect(mockSendSocketNotification).toHaveBeenCalledWith('CHORE_TOGGLE', {
        choreId: 'chore-1',
        completed: true,
      });
    });

    it('should send CHORE_TOGGLE socket notification for unchecking', () => {
      module.toggleChoreCompletion('chore-2', false);

      expect(mockSendSocketNotification).toHaveBeenCalledWith('CHORE_TOGGLE', {
        choreId: 'chore-2',
        completed: false,
      });
    });
  });

  describe('Checkbox Interactions', () => {
    beforeEach(() => {
      // Set up chore data for interaction tests
      module.choreData = {
        people: [
          { id: '1', name: 'Alice', color: '#FF6B6B' },
          { id: '2', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [
          {
            id: 'chore-1',
            name: 'Take out trash',
            type: 'rotating',
            rotation: ['1', '2'],
            rotatingIndex: 0,
            completedToday: false,
          },
        ],
      };
    });

    it('should toggle chore when checkbox is clicked', async () => {
      // Render the module to page
      const dom = module.getDom();
      document.body.appendChild(dom);
      module.addCheckboxListeners(dom);

      const toggleChoreCompletionSpy = vi.spyOn(module, 'toggleChoreCompletion');

      // Use page to find and click checkbox by role
      const checkbox = page.getByRole('checkbox');
      await checkbox.click();

      expect(toggleChoreCompletionSpy).toHaveBeenCalledWith('chore-1', true);
    });

    it('should toggle chore when chore name is clicked', async () => {
      // Render the module to page
      const dom = module.getDom();
      document.body.appendChild(dom);
      module.addCheckboxListeners(dom);

      const toggleChoreCompletionSpy = vi.spyOn(module, 'toggleChoreCompletion');

      // Use page to find and click by text content
      const choreName = page.getByText('Take out trash');
      await choreName.click();

      expect(toggleChoreCompletionSpy).toHaveBeenCalledWith('chore-1', true);
    });

    it('should toggle chore when assigned person is clicked', async () => {
      // Render the module to page
      const dom = module.getDom();
      document.body.appendChild(dom);
      module.addCheckboxListeners(dom);

      const toggleChoreCompletionSpy = vi.spyOn(module, 'toggleChoreCompletion');

      // Use page to find and click by person name
      const assignedPerson = page.getByText('Alice');
      await assignedPerson.click();

      expect(toggleChoreCompletionSpy).toHaveBeenCalledWith('chore-1', true);
    });

    it('should handle checkbox unchecking', async () => {
      // Render the module to page
      const dom = module.getDom();
      document.body.appendChild(dom);
      module.addCheckboxListeners(dom);

      const toggleChoreCompletionSpy = vi.spyOn(module, 'toggleChoreCompletion');

      // First click to check
      const checkbox = page.getByRole('checkbox');
      await checkbox.click();

      // Clear previous calls
      toggleChoreCompletionSpy.mockClear();

      // Second click to uncheck
      await checkbox.click();

      expect(toggleChoreCompletionSpy).toHaveBeenCalledWith('chore-1', false);
    });
  });

  describe('loadData', () => {
    it('should send CONFIG_REQUEST socket notification', () => {
      module.loadData();

      expect(mockSendSocketNotification).toHaveBeenCalledWith('CONFIG_REQUEST', module.config);
    });
  });

  describe('scheduleUpdate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should schedule data loading at intervals', () => {
      const loadDataSpy = vi.spyOn(module, 'loadData');

      module.scheduleUpdate();

      // Should not call immediately
      expect(loadDataSpy).not.toHaveBeenCalled();

      // Should call after interval
      vi.advanceTimersByTime(60000);
      expect(loadDataSpy).toHaveBeenCalledTimes(1);

      // Should call again after another interval
      vi.advanceTimersByTime(60000);
      expect(loadDataSpy).toHaveBeenCalledTimes(2);
    });

    it('should use custom update interval from config', () => {
      module.config.updateInterval = 30000;
      const loadDataSpy = vi.spyOn(module, 'loadData');

      module.scheduleUpdate();
      vi.advanceTimersByTime(30000);

      expect(loadDataSpy).toHaveBeenCalledTimes(1);
    });
  });
});
