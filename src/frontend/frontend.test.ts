import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
        payload: unknown
      ) => void,
      updateDom: mockUpdateDom as () => void,
      file: mockFile as (filename: string) => string,
    };
    module.config = {
      updateInterval: 60000,
      dataFile: 'data.json',
      adminPin: null,
    };
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
    it('should show loading state when no chore data', () => {
      module.choreData = null;

      const dom = module.getDom();

      expect(dom.className).toBe('MMM-FamilyChores');
      expect(dom.innerHTML).toContain('Loading...');
      expect(dom.innerHTML).toContain('module-content');
    });

    it('should show chore data when available', () => {
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

      const dom = module.getDom();

      expect(dom.className).toBe('MMM-FamilyChores');
      expect(dom.innerHTML).toContain('Take out trash');
      expect(dom.innerHTML).toContain('Clean kitchen');
      expect(dom.innerHTML).toContain('Alice');
      expect(dom.innerHTML).toContain('chore-item');
      expect(dom.innerHTML).toContain('chore-checkbox');
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

  describe('addCheckboxListeners', () => {
    let mockWrapper: HTMLElement;
    let mockCheckbox: HTMLInputElement;
    let mockEvent: Event;

    beforeEach(() => {
      mockWrapper = document.createElement('div');
      mockCheckbox = document.createElement('input');
      mockCheckbox.type = 'checkbox';
      mockCheckbox.id = 'chore-test-1';

      const mockChoreItem = document.createElement('div');
      mockChoreItem.className = 'chore-item';
      mockChoreItem.setAttribute('data-chore-id', 'test-chore-id');
      mockChoreItem.appendChild(mockCheckbox);

      mockWrapper.appendChild(mockChoreItem);

      const _toggleChoreCompletionSpy = vi.spyOn(module, 'toggleChoreCompletion');

      // Mock the event
      mockEvent = new Event('change');
      Object.defineProperty(mockEvent, 'target', { value: mockCheckbox });

      mockCheckbox.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        const choreItem = target.closest('.chore-item');
        if (choreItem) {
          const choreId = choreItem.getAttribute('data-chore-id');
          if (choreId) {
            module.toggleChoreCompletion(choreId, target.checked);
          }
        }
      });
    });

    it('should add event listeners to checkboxes', () => {
      const toggleChoreCompletionSpy = vi.spyOn(module, 'toggleChoreCompletion');

      module.addCheckboxListeners(mockWrapper);

      mockCheckbox.checked = true;
      mockCheckbox.dispatchEvent(mockEvent);

      expect(toggleChoreCompletionSpy).toHaveBeenCalledWith('test-chore-id', true);
    });

    it('should handle checkbox uncheck', () => {
      const toggleChoreCompletionSpy = vi.spyOn(module, 'toggleChoreCompletion');

      module.addCheckboxListeners(mockWrapper);

      mockCheckbox.checked = false;
      mockCheckbox.dispatchEvent(mockEvent);

      expect(toggleChoreCompletionSpy).toHaveBeenCalledWith('test-chore-id', false);
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
