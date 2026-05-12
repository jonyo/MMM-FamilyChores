import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import '../../css/main.css';
import type { FamilyChoresModule } from '../types/module';
import './frontend';

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
  let module: FamilyChoresModule;
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
    };

    module.config = {
      updateInterval: 60000,
      dataFile: 'data.json',
      adminPin: null,
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

  describe('getDom', () => {
    it('should show loading state when no chore data', async () => {
      module.choreData = null;

      // Render the module to page
      const dom = module.getDom();
      document.body.appendChild(dom);

      // Use page locators to verify loading state
      expect(page.getByText('Loading...')).toBeVisible();

      // Clean up
      document.body.removeChild(dom);
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

      // Clean up
      document.body.removeChild(dom);
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

      // Clean up
      document.body.removeChild(dom);
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

      // Clean up
      document.body.removeChild(dom);
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

      // Clean up
      document.body.removeChild(dom);
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

      // Clean up
      document.body.removeChild(dom);
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
