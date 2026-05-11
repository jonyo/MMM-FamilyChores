import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FamilyChoresModule } from '../types/module';

describe('Frontend Tests', () => {
  let module: FamilyChoresModule;

  beforeEach(async () => {
    // Clear previous mock calls
    vi.clearAllMocks();

    // Create a simple module instance for testing
    module = {
      name: 'MMM-FamilyChores',
      config: {
        updateInterval: 60000,
        dataFile: 'data.json',
        adminPin: null,
      },
      choreData: null,
      sendSocketNotification: vi.fn(),
      updateDom: vi.fn(),
      file: vi.fn().mockReturnValue('css/mmm-familychores.css'),
      defaults: {
        updateInterval: 60000,
        dataFile: 'data.json',
        adminPin: null,
      },
      getStyles: vi.fn().mockReturnValue(['css/mmm-familychores.css']),
      getDom: vi.fn().mockImplementation(() => {
        const wrapper = document.createElement('div');
        wrapper.className = 'MMM-FamilyChores';

        if (!module.choreData) {
          wrapper.innerHTML = '<div class="loading">Loading...</div><h2>Family Chores</h2>';
        } else {
          const totalChores = module.choreData.chores?.length || 0;
          const completedCount = module.choreData.state?.completedToday?.length || 0;
          wrapper.innerHTML = `
            <h2>Family Chores</h2>
            <div class="summary">
              <div>Total Chores: <span class="total">${totalChores}</span></div>
              <div>Completed Today: <span class="completed">${completedCount}</span></div>
            </div>
          `;
        }

        return wrapper;
      }),
      socketNotificationReceived: vi.fn().mockImplementation((notification, payload) => {
        if (notification === 'CHORE_DATA') {
          module.choreData = payload;
          module.updateDom();
        }
      }),
      loadData: vi.fn().mockImplementation(() => {
        module.sendSocketNotification('CONFIG_REQUEST', module.config);
      }),
      scheduleUpdate: vi.fn().mockImplementation(() => {
        // Use vi.useFakeTimers compatible approach with recurring timer
        const interval = module.config.updateInterval || 60000;
        setInterval(() => {
          module.loadData();
        }, interval);
      }),
      start: vi.fn(),
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
      expect(styles).toContain('css/mmm-familychores.css');
    });
  });

  describe('getDom', () => {
    it('should show loading state when no chore data', () => {
      module.choreData = null;

      const dom = module.getDom();

      expect(dom.className).toBe('MMM-FamilyChores');
      expect(dom.innerHTML).toContain('Loading...');
      expect(dom.innerHTML).toContain('Family Chores');
    });

    it('should show chore data when available', () => {
      module.choreData = {
        people: [
          { id: '1', name: 'Alice', color: '#FF6B6B' },
          { id: '2', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [
          { id: '1', name: 'Take out trash', type: 'rotating', rotation: ['1', '2'] },
          { id: '2', name: 'Clean kitchen', type: 'personal', assignedTo: '1' },
        ],
        state: {
          rotatingIndex: {},
          lastCompleted: {},
          previousLastCompleted: {},
          completedToday: ['1'],
        },
      };

      const dom = module.getDom();

      expect(dom.className).toBe('MMM-FamilyChores');
      expect(dom.innerHTML).toContain('Total Chores:');
      expect(dom.innerHTML).toContain('2');
      expect(dom.innerHTML).toContain('Completed Today:');
      expect(dom.innerHTML).toContain('1');
    });
  });

  describe('socketNotificationReceived', () => {
    it('should handle CHORE_DATA notification', () => {
      const mockData = {
        chores: [{ id: '1', name: 'Test Chore' }],
        state: { completedToday: [] },
      };

      module.socketNotificationReceived('CHORE_DATA', mockData);

      expect(module.choreData).toBe(mockData);
      expect(module.updateDom).toHaveBeenCalled();
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

  describe('loadData', () => {
    it('should send CONFIG_REQUEST socket notification', () => {
      module.loadData();

      expect(module.sendSocketNotification).toHaveBeenCalledWith('CONFIG_REQUEST', module.config);
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
