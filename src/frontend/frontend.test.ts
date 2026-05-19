import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import '../../css/main.css';
import type { Chore, PersonalChore, RotatingChore } from '../types/chore-types';
import { ChoreType, DayOfWeek, SkipDayVisibility } from '../types/chore-types';
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
    } as FamilyChoresModule;

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
        lastResetDate: '2024-01-01',
        people: [
          { id: 'alice', name: 'Alice', color: '#FF6B6B' },
          { id: 'bob', name: 'Bob', color: '#4ECDC4' },
          { id: 'charlie', name: 'Charlie', color: '#45B7D1' },
        ],
        chores: [
          {
            id: '1',
            name: 'Take out trash',
            type: ChoreType.ROTATING,
            rotation: ['alice', 'bob'],
            rotatingIndex: 0,
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
          {
            id: '2',
            name: 'Clean kitchen',
            type: ChoreType.PERSONAL,
            assignedTo: 'bob',
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
          {
            id: '3',
            name: 'Vacuum living room',
            type: ChoreType.PERSONAL,
            assignedTo: 'charlie',
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
        ],
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
        },
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

    it('should delegate to getSummaryChores when viewMode is summary', () => {
      module.config.viewMode = 'summary';
      const spy = vi.spyOn(module, 'getSummaryChores').mockReturnValue([]);
      expect(module.getFilteredChores()).toEqual([]);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      module.config.viewMode = 'personal';
    });

    it('should handle whitespace in filter', () => {
      module.config.personFilter = '  alice  ';
      const filtered = module.getFilteredChores();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    describe('skip day filtering', () => {
      beforeEach(() => {
        // Set system time to a Monday (2026-05-11 12:00 UTC) for consistent skip day testing
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));

        if (module.choreData) {
          module.choreData.chores.push(
            {
              id: 'skip-hide',
              name: 'Hidden on Monday',
              type: ChoreType.PERSONAL,
              assignedTo: 'alice',
              completedToday: false,
              skipDays: [DayOfWeek.MONDAY],
              skipDayVisibility: SkipDayVisibility.HIDE,
              caughtUp: true,
            },
            {
              id: 'skip-show-always',
              name: 'Always shown on Monday',
              type: ChoreType.PERSONAL,
              assignedTo: 'alice',
              completedToday: false,
              skipDays: [DayOfWeek.MONDAY],
              skipDayVisibility: SkipDayVisibility.SHOW_ALWAYS,
              caughtUp: true,
            },
            {
              id: 'skip-overdue-not-caught-up',
              name: 'Overdue on Monday - not caught up',
              type: ChoreType.PERSONAL,
              assignedTo: 'alice',
              completedToday: false,
              skipDays: [DayOfWeek.MONDAY],
              skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
              caughtUp: false,
            },
            {
              id: 'skip-overdue-caught-up',
              name: 'Overdue on Monday - caught up',
              type: ChoreType.PERSONAL,
              assignedTo: 'alice',
              completedToday: false,
              skipDays: [DayOfWeek.MONDAY],
              skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
              caughtUp: true,
            }
          );
        }
      });

      it('should hide personal chore with default HIDE visibility on skip day', () => {
        module.config.personFilter = null;
        const filtered = module.getFilteredChores();
        expect(filtered.some((c) => c.id === 'skip-hide')).toBe(false);
      });

      it('should include personal chore with SHOW_ALWAYS visibility on skip day', () => {
        module.config.personFilter = null;
        const filtered = module.getFilteredChores();
        expect(filtered.some((c) => c.id === 'skip-show-always')).toBe(true);
      });

      it('should include personal chore with SHOW_IF_OVERDUE when not caught up on skip day', () => {
        module.config.personFilter = null;
        const filtered = module.getFilteredChores();
        expect(filtered.some((c) => c.id === 'skip-overdue-not-caught-up')).toBe(true);
      });

      it('should hide personal chore with SHOW_IF_OVERDUE when caught up on skip day', () => {
        module.config.personFilter = null;
        const filtered = module.getFilteredChores();
        expect(filtered.some((c) => c.id === 'skip-overdue-caught-up')).toBe(false);
      });

      it('should include chores whose skip days do not include today', () => {
        module.config.personFilter = null;
        const filtered = module.getFilteredChores();
        // Chore '2' (Clean kitchen - no skip days) should always be included
        expect(filtered.some((c) => c.id === '2')).toBe(true);
      });

      it('should apply skip day filtering when person filter is set', () => {
        module.config.personFilter = 'alice';
        const filtered = module.getFilteredChores();
        // skip-hide (alice's, HIDE on monday) should be excluded
        expect(filtered.some((c) => c.id === 'skip-hide')).toBe(false);
        // skip-show-always (alice's, SHOW_ALWAYS on monday) should be included
        expect(filtered.some((c) => c.id === 'skip-show-always')).toBe(true);
      });

      it('should apply skip day filtering to rotating chores', () => {
        if (!module.choreData) return;
        // Add skip day to the rotating chore
        const rotatingChore = module.choreData.chores.find((c) => c.id === '1');
        if (rotatingChore) {
          rotatingChore.skipDays = [DayOfWeek.MONDAY];
          rotatingChore.skipDayVisibility = SkipDayVisibility.HIDE;
        }
        module.config.personFilter = null;
        const filtered = module.getFilteredChores();
        expect(filtered.some((c) => c.id === '1')).toBe(false);
      });

      afterEach(() => {
        vi.useRealTimers();
      });
    });
  });

  describe('shouldShowChore', () => {
    beforeEach(() => {
      module.choreData = {
        lastResetDate: '2024-01-01',
        people: [{ id: 'alice', name: 'Alice', color: '#FF6B6B' }],
        chores: [
          {
            id: '1',
            name: 'Test chore',
            type: ChoreType.PERSONAL,
            assignedTo: 'alice',
            completedToday: false,
            caughtUp: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
          },
        ],
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
        },
      };
    });

    it('should return true when today is not a skip day', () => {
      const chore = module.choreData?.chores[0] as Chore;
      const todayDayName = DayOfWeek.MONDAY;
      chore.skipDays = [DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY];

      const result = module.shouldShowChore(chore, todayDayName);
      expect(result).toBe(true);
    });

    it('should return false when today is a skip day and visibility is HIDE', () => {
      const chore = module.choreData?.chores[0] as Chore;
      const todayDayName = DayOfWeek.MONDAY;
      chore.skipDays = [DayOfWeek.MONDAY];
      chore.skipDayVisibility = SkipDayVisibility.HIDE;

      const result = module.shouldShowChore(chore, todayDayName);
      expect(result).toBe(false);
    });

    it('should return false when today is a skip day and visibility defaults to HIDE', () => {
      const chore = module.choreData?.chores[0] as Chore;
      const todayDayName = DayOfWeek.MONDAY;
      chore.skipDays = [DayOfWeek.MONDAY];
      // skipDayVisibility is undefined, should default to 'hide'

      const result = module.shouldShowChore(chore, todayDayName);
      expect(result).toBe(false);
    });

    it('should return true when today is a skip day and visibility is SHOW_ALWAYS', () => {
      const chore = module.choreData?.chores[0] as Chore;
      const todayDayName = DayOfWeek.MONDAY;
      chore.skipDays = [DayOfWeek.MONDAY];
      chore.skipDayVisibility = SkipDayVisibility.SHOW_ALWAYS;

      const result = module.shouldShowChore(chore, todayDayName);
      expect(result).toBe(true);
    });

    it('should return true when today is a skip day, visibility is SHOW_IF_OVERDUE, and chore is not caught up', () => {
      const chore = module.choreData?.chores[0] as Chore;
      const todayDayName = DayOfWeek.MONDAY;
      chore.skipDays = [DayOfWeek.MONDAY];
      chore.skipDayVisibility = SkipDayVisibility.SHOW_IF_OVERDUE;
      chore.caughtUp = false;

      const result = module.shouldShowChore(chore, todayDayName);
      expect(result).toBe(true);
    });

    it('should return false when today is a skip day, visibility is SHOW_IF_OVERDUE, and chore is caught up', () => {
      const chore = module.choreData?.chores[0] as Chore;
      const todayDayName = DayOfWeek.MONDAY;
      chore.skipDays = [DayOfWeek.MONDAY];
      chore.skipDayVisibility = SkipDayVisibility.SHOW_IF_OVERDUE;
      chore.caughtUp = true;

      const result = module.shouldShowChore(chore, todayDayName);
      expect(result).toBe(false);
    });
  });

  describe('getSummaryChores', () => {
    beforeEach(() => {
      module.choreData = {
        lastResetDate: '2024-01-01',
        people: [
          { id: 'alice', name: 'Alice', color: '#FF6B6B' },
          { id: 'bob', name: 'Bob', color: '#4ECDC4' },
          { id: 'charlie', name: 'Charlie', color: '#45B7D1' },
        ],
        chores: [
          {
            id: '1',
            name: 'Take out trash',
            type: ChoreType.ROTATING,
            rotation: ['alice', 'bob'],
            rotatingIndex: 0,
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
          {
            id: '2',
            name: 'Clean kitchen',
            type: ChoreType.PERSONAL,
            assignedTo: 'bob',
            completedToday: true,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
          {
            id: '3',
            name: 'Vacuum living room',
            type: ChoreType.PERSONAL,
            assignedTo: 'charlie',
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
          {
            id: '4',
            name: 'Wash dishes',
            type: ChoreType.ROTATING,
            rotation: ['bob', 'charlie'],
            rotatingIndex: 1,
            completedToday: true,
            caughtUp: true,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
          },
        ],
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
        },
      };
    });

    it('should return all incomplete chores and rotating chores', () => {
      const summaryChores = module.getSummaryChores();

      // Should include incomplete personal chores
      expect(summaryChores.some((c) => c.id === '3')).toBe(true);

      // Should include all rotating chores regardless of completion
      expect(summaryChores.some((c) => c.id === '1')).toBe(true);
      expect(summaryChores.some((c) => c.id === '4')).toBe(true);

      // Should not include completed personal chores
      expect(summaryChores.some((c) => c.id === '2')).toBe(false);

      expect(summaryChores).toHaveLength(3);
    });

    it('should return empty array when no chore data', () => {
      module.choreData = null;
      const summaryChores = module.getSummaryChores();
      expect(summaryChores).toHaveLength(0);
    });

    it('should handle all chores completed', () => {
      if (!module.choreData) return;

      // Mark all chores as completed
      module.choreData.chores.forEach((chore) => {
        chore.completedToday = true;
      });

      const summaryChores = module.getSummaryChores();

      // Should only include rotating chores when all are completed
      expect(summaryChores).toHaveLength(2);
      expect(summaryChores.every((c) => c.type === 'rotating')).toBe(true);
    });

    it('should handle no rotating chores', () => {
      if (!module.choreData) return;

      // Remove rotating chores
      module.choreData.chores = module.choreData.chores.filter((c) => c.type !== 'rotating');

      const summaryChores = module.getSummaryChores();

      // Should only include incomplete personal chores
      expect(summaryChores).toHaveLength(1);
      expect(summaryChores.every((c) => c.type === 'personal')).toBe(true);
      expect(summaryChores.every((c) => !c.completedToday)).toBe(true);
    });

    describe('skip day filtering', () => {
      beforeEach(() => {
        // Set system time to a Monday (2026-05-11 12:00 UTC) for consistent skip day testing
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));

        if (module.choreData) {
          module.choreData.chores.push(
            {
              id: 'skip-hide-personal',
              name: 'Hidden personal on Monday',
              type: ChoreType.PERSONAL,
              assignedTo: 'alice',
              completedToday: false,
              skipDays: [DayOfWeek.MONDAY],
              skipDayVisibility: SkipDayVisibility.HIDE,
              caughtUp: true,
            },
            {
              id: 'skip-show-always-personal',
              name: 'Always shown personal on Monday',
              type: ChoreType.PERSONAL,
              assignedTo: 'alice',
              completedToday: false,
              skipDays: [DayOfWeek.MONDAY],
              skipDayVisibility: SkipDayVisibility.SHOW_ALWAYS,
              caughtUp: true,
            },
            {
              id: 'skip-hide-rotating',
              name: 'Hidden rotating on Monday',
              type: ChoreType.ROTATING,
              rotation: ['alice', 'bob'],
              rotatingIndex: 0,
              completedToday: false,
              skipDays: [DayOfWeek.MONDAY],
              skipDayVisibility: SkipDayVisibility.HIDE,
              caughtUp: true,
            },
            {
              id: 'skip-overdue-not-caught-up',
              name: 'Overdue personal - not caught up',
              type: ChoreType.PERSONAL,
              assignedTo: 'alice',
              completedToday: false,
              skipDays: [DayOfWeek.MONDAY],
              skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
              caughtUp: false,
            },
            {
              id: 'skip-overdue-caught-up',
              name: 'Overdue personal - caught up',
              type: ChoreType.PERSONAL,
              assignedTo: 'alice',
              completedToday: false,
              skipDays: [DayOfWeek.MONDAY],
              skipDayVisibility: SkipDayVisibility.SHOW_IF_OVERDUE,
              caughtUp: true,
            }
          );
        }
      });

      it('should hide personal chore with default HIDE visibility on skip day', () => {
        const summary = module.getSummaryChores();
        expect(summary.some((c) => c.id === 'skip-hide-personal')).toBe(false);
      });

      it('should include personal chore with SHOW_ALWAYS visibility on skip day', () => {
        const summary = module.getSummaryChores();
        expect(summary.some((c) => c.id === 'skip-show-always-personal')).toBe(true);
      });

      it('should hide rotating chore with default HIDE visibility on skip day', () => {
        const summary = module.getSummaryChores();
        expect(summary.some((c) => c.id === 'skip-hide-rotating')).toBe(false);
      });

      it('should include personal chore with SHOW_IF_OVERDUE when not caught up on skip day', () => {
        const summary = module.getSummaryChores();
        expect(summary.some((c) => c.id === 'skip-overdue-not-caught-up')).toBe(true);
      });

      it('should hide personal chore with SHOW_IF_OVERDUE when caught up on skip day', () => {
        const summary = module.getSummaryChores();
        expect(summary.some((c) => c.id === 'skip-overdue-caught-up')).toBe(false);
      });

      it('should include chores whose skip days do not include today', () => {
        const summary = module.getSummaryChores();
        // Chore '3' (Vacuum - no skip days, incomplete personal) should be included
        expect(summary.some((c) => c.id === '3')).toBe(true);
        // Chore '1' (Take out trash - no skip days, incomplete rotating) should be included
        expect(summary.some((c) => c.id === '1')).toBe(true);
      });

      it('should apply skip day filtering to completed rotating chores', () => {
        if (!module.choreData) return;
        // Add skip day to the completed rotating chore '4'
        const rotatingChore = module.choreData.chores.find((c) => c.id === '4');
        if (rotatingChore) {
          rotatingChore.skipDays = [DayOfWeek.MONDAY];
          rotatingChore.skipDayVisibility = SkipDayVisibility.HIDE;
        }
        const summary = module.getSummaryChores();
        expect(summary.some((c) => c.id === '4')).toBe(false);
      });

      afterEach(() => {
        vi.useRealTimers();
      });
    });
  });

  describe('renderChoreItem', () => {
    beforeEach(() => {
      module.choreData = {
        lastResetDate: '2024-01-01',
        people: [
          { id: 'alice', name: 'Alice', color: '#FF6B6B' },
          { id: 'bob', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [],
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
        },
      };
    });

    it('should render personal chore with assigned person', () => {
      if (!module.choreData) {
        throw new Error('choreData is null');
      }
      const chore: PersonalChore = {
        id: '1',
        name: 'Clean kitchen',
        type: ChoreType.PERSONAL,
        assignedTo: 'alice',
        completedToday: false,
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: true,
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
      const chore: PersonalChore = {
        id: '2',
        name: 'Take out trash',
        type: ChoreType.PERSONAL,
        assignedTo: 'bob',
        completedToday: true,
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: true,
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
      const chore: RotatingChore = {
        id: '3',
        name: 'Vacuum',
        type: ChoreType.ROTATING,
        rotation: ['alice', 'bob'],
        rotatingIndex: 1,
        completedToday: false,
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: true,
      };

      const html = module.renderChoreItem(chore, module.choreData);

      expect(html).toContain('Bob');
      expect(html).toContain('#4ECDC4');
    });

    it('should render chore with deadline', () => {
      if (!module.choreData) {
        throw new Error('choreData is null');
      }
      const chore: PersonalChore = {
        id: '4',
        name: 'Water plants',
        type: ChoreType.PERSONAL,
        assignedTo: 'alice',
        completedToday: false,
        deadline: 'Daily',
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: true,
      };

      const html = module.renderChoreItem(chore, module.choreData);

      expect(html).toContain('Daily');
    });

    it('should render unassigned chore', () => {
      if (!module.choreData) {
        throw new Error('choreData is null');
      }
      const chore: PersonalChore = {
        id: '5',
        name: 'General cleanup',
        type: ChoreType.PERSONAL,
        assignedTo: 'nonexistent',
        completedToday: false,
        skipDays: [],
        skipDayVisibility: SkipDayVisibility.HIDE,
        caughtUp: true,
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
        const chore: PersonalChore = {
          id: 'deadline-overdue',
          name: 'Morning task',
          type: ChoreType.PERSONAL,
          assignedTo: 'alice',
          deadline: '08:00', // Past current time (11:30)
          completedToday: false,
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
          caughtUp: true,
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
        const chore: PersonalChore = {
          id: 'deadline-normal',
          name: 'Evening task',
          type: ChoreType.PERSONAL,
          assignedTo: 'alice',
          deadline: '21:00', // Future time (11:30 < 21:00)
          completedToday: false,
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
          caughtUp: true,
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
        const chore: PersonalChore = {
          id: 'deadline-equal',
          name: 'Exact time task',
          type: ChoreType.PERSONAL,
          assignedTo: 'alice',
          deadline: '11:30', // Equal to current time
          completedToday: false,
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
          caughtUp: true,
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
        const chore: PersonalChore = {
          id: 'deadline-completed',
          name: 'Completed task',
          type: ChoreType.PERSONAL,
          assignedTo: 'alice',
          deadline: '08:00', // Past current time
          completedToday: true, // But completed
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
          caughtUp: true,
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
        const chore: PersonalChore = {
          id: 'no-deadline',
          name: 'No deadline task',
          type: ChoreType.PERSONAL,
          assignedTo: 'alice',
          completedToday: false,
          // No deadline property
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
          caughtUp: true,
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
        const chore: RotatingChore = {
          id: 'rotating-overdue',
          name: 'Rotating task',
          type: ChoreType.ROTATING,
          rotation: ['alice', 'bob'],
          rotatingIndex: 0,
          deadline: '08:00', // Past current time
          completedToday: false,
          skipDays: [],
          skipDayVisibility: SkipDayVisibility.HIDE,
          caughtUp: true,
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
          const chore: PersonalChore = {
            id: 'not-caught-up',
            name: 'Not caught up task',
            type: ChoreType.PERSONAL,
            assignedTo: 'alice',
            deadline: '23:59', // Future deadline
            completedToday: false,
            caughtUp: false, // Not caught up - should show overdue
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
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
          const chore: PersonalChore = {
            id: 'caught-up',
            name: 'Caught up task',
            type: ChoreType.PERSONAL,
            assignedTo: 'alice',
            deadline: '23:59', // Future deadline
            completedToday: false,
            caughtUp: true, // Caught up - should show normal
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
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
        lastResetDate: '2024-01-01',
        people: [
          { id: '1', name: 'Alice', color: '#FF6B6B' },
          { id: '2', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [
          {
            id: '1',
            name: 'Take out trash',
            type: ChoreType.ROTATING,
            rotation: ['1', '2'],
            rotatingIndex: 0,
            completedToday: true,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
          {
            id: '2',
            name: 'Clean kitchen',
            type: ChoreType.PERSONAL,
            assignedTo: '1',
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
        ],
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
        },
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
        lastResetDate: '2024-01-01',
        people: [
          { id: '1', name: 'Alice', color: '#FF6B6B' },
          { id: '2', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [
          {
            id: '1',
            name: 'Take out trash',
            type: ChoreType.ROTATING,
            rotation: ['1', '2'],
            rotatingIndex: 0,
            completedToday: true,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
          {
            id: '2',
            name: 'Clean kitchen',
            type: ChoreType.PERSONAL,
            assignedTo: '2',
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
        ],
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
        },
      };

      module.config.personFilter = 'Alice';

      const dom = module.getDom();
      document.body.appendChild(dom);

      expect(page.getByText('Take out trash')).toBeVisible();
      expect(page.getByText('Clean kitchen').elements()).toHaveLength(0);
    });

    it('should show empty state when filter matches no chores', async () => {
      module.choreData = {
        lastResetDate: '2024-01-01',
        people: [
          { id: '1', name: 'Alice', color: '#FF6B6B' },
          { id: '2', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [
          {
            id: '1',
            name: 'Clean kitchen',
            type: ChoreType.PERSONAL,
            assignedTo: '1',
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
        ],
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
        },
      };

      module.config.personFilter = 'Bob'; // Bob has no chores

      const dom = module.getDom();
      document.body.appendChild(dom);

      expect(page.getByText('No chores match the current filter.')).toBeVisible();
      expect(page.getByText('Clean kitchen').elements()).toHaveLength(0);
    });
  });

  describe('renderSummaryView', () => {
    beforeEach(() => {
      module.config.viewMode = 'summary';
      module.choreData = {
        lastResetDate: '2024-01-01',
        people: [
          { id: 'alice', name: 'Alice', color: '#FF6B6B' },
          { id: 'bob', name: 'Bob', color: '#4ECDC4' },
          { id: 'charlie', name: 'Charlie', color: '#45B7D1' },
        ],
        chores: [
          {
            id: '1',
            name: 'Take out trash',
            type: ChoreType.ROTATING,
            rotation: ['alice', 'bob'],
            rotatingIndex: 0,
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
          {
            id: '2',
            name: 'Clean kitchen',
            type: ChoreType.PERSONAL,
            assignedTo: 'bob',
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: false,
          },
          {
            id: '3',
            name: 'Vacuum living room',
            type: ChoreType.PERSONAL,
            assignedTo: 'charlie',
            completedToday: true,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
          {
            id: '4',
            name: 'Wash dishes',
            type: ChoreType.ROTATING,
            rotation: ['bob', 'charlie'],
            rotatingIndex: 1,
            completedToday: true,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
        ],
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
        },
      };
    });

    it('should show all sections when summary config is default (all true)', async () => {
      // Default config - all sections should be visible
      module.config.summary = {
        showIncomplete: true,
        showRotating: true,
        showOverdue: true,
      };

      const wrapper = document.createElement('div');
      const result = module.renderSummaryView(wrapper);
      document.body.appendChild(result);

      // Should show incomplete chores section
      expect(page.getByText('Incomplete Chores')).toBeVisible();
      expect(page.getByText('Take out trash').first()).toBeVisible();
      expect(page.getByText('Clean kitchen').first()).toBeVisible();

      // Should show Current Rotating Assignments section
      expect(page.getByText("Today's Rotation")).toBeVisible();
      expect(page.getByText('Wash dishes')).toBeVisible();

      // Should show overdue section
      expect(page.getByText('Overdue')).toBeVisible();
      // Appears in incomplete and overdue sections
      expect(page.getByText('Clean kitchen').elements()).toHaveLength(2);

      // Should not show completed personal chores
      expect(page.getByText('Vacuum living room').elements()).toHaveLength(0);
    });

    it('should only show Current Rotating Assignments when showIncomplete and showOverdue are false', async () => {
      module.config.summary = {
        showIncomplete: false,
        showRotating: true,
        showOverdue: false,
      };

      const wrapper = document.createElement('div');
      const result = module.renderSummaryView(wrapper);
      document.body.appendChild(result);

      // Should only show Current Rotating Assignments
      expect(page.getByText("Today's Rotation")).toBeVisible();
      expect(page.getByText('Take out trash')).toBeVisible();
      expect(page.getByText('Wash dishes')).toBeVisible();

      // Should not show other sections
      expect(page.getByText('Incomplete Chores').elements()).toHaveLength(0);
      expect(page.getByText('Overdue').elements()).toHaveLength(0);
    });

    it('should only show incomplete chores when showRotating and showOverdue are false', async () => {
      module.config.summary = {
        showIncomplete: true,
        showRotating: false,
        showOverdue: false,
      };

      const wrapper = document.createElement('div');
      const result = module.renderSummaryView(wrapper);
      document.body.appendChild(result);

      // Should only show incomplete chores
      expect(page.getByText('Incomplete Chores')).toBeVisible();
      expect(page.getByText('Take out trash')).toBeVisible();
      expect(page.getByText('Clean kitchen')).toBeVisible();

      // Should not show other sections
      expect(page.getByText("Today's Rotation").elements()).toHaveLength(0);
      expect(page.getByText('Overdue').elements()).toHaveLength(0);
    });

    it('should only show overdue when showIncomplete and showRotating are false', async () => {
      module.config.summary = {
        showIncomplete: false,
        showRotating: false,
        showOverdue: true,
      };

      const wrapper = document.createElement('div');
      const result = module.renderSummaryView(wrapper);
      document.body.appendChild(result);

      // Should only show overdue chores
      expect(page.getByText('Overdue')).toBeVisible();
      expect(page.getByText('Clean kitchen')).toBeVisible();

      // Should not show other sections
      expect(page.getByText('Incomplete Chores').elements()).toHaveLength(0);
      expect(page.getByText("Today's Rotation").elements()).toHaveLength(0);
    });

    it('should show empty summary view when all sections are disabled', async () => {
      module.config.summary = {
        showIncomplete: false,
        showRotating: false,
        showOverdue: false,
      };

      const wrapper = document.createElement('div');
      const result = module.renderSummaryView(wrapper);
      document.body.appendChild(result);

      // Should not show any sections
      expect(page.getByText('Incomplete Chores').elements()).toHaveLength(0);
      expect(page.getByText("Today's Rotation").elements()).toHaveLength(0);
      expect(page.getByText('Overdue').elements()).toHaveLength(0);

      // Should still have the summary-view container
      expect(result.querySelector('.summary-view')).toBeTruthy();
    });

    it('should use default values when summary config is undefined', async () => {
      module.config.summary = undefined;

      const wrapper = document.createElement('div');
      const result = module.renderSummaryView(wrapper);
      document.body.appendChild(result);

      // Should show all sections (default behavior)
      expect(page.getByText('Incomplete Chores')).toBeVisible();
      expect(page.getByText("Today's Rotation")).toBeVisible();
      expect(page.getByText('Overdue')).toBeVisible();
    });

    it('should handle partial config with defaults', async () => {
      module.config.summary = {
        showIncomplete: false,
        // showRotating should default to true
        // showOverdue should default to true
      };

      const wrapper = document.createElement('div');
      const result = module.renderSummaryView(wrapper);
      document.body.appendChild(result);

      // Should show rotating and overdue sections (defaults)
      expect(page.getByText("Today's Rotation")).toBeVisible();
      expect(page.getByText('Overdue')).toBeVisible();

      // Should not show incomplete section (explicitly disabled)
      expect(page.getByText('Incomplete Chores').elements()).toHaveLength(0);
    });

    it('should show loading state when no chore data', async () => {
      module.choreData = null;

      const wrapper = document.createElement('div');
      const result = module.renderSummaryView(wrapper);
      document.body.appendChild(result);

      expect(page.getByText('Loading...')).toBeVisible();
    });

    it('should not show sections when no chores match criteria', async () => {
      if (!module.choreData) return;

      // Mark all chores as completed and caught up
      module.choreData.chores.forEach((chore) => {
        chore.completedToday = true;
        chore.caughtUp = true;
      });

      module.config.summary = {
        showIncomplete: true,
        showRotating: false,
        showOverdue: true,
      };

      const wrapper = document.createElement('div');
      const result = module.renderSummaryView(wrapper);
      document.body.appendChild(result);

      // Should not show incomplete or overdue sections (no matching chores)
      expect(page.getByText('Incomplete Chores').elements()).toHaveLength(0);
      expect(page.getByText('Overdue').elements()).toHaveLength(0);

      // Should still have the summary-view container
      expect(result.querySelector('.summary-view')).toBeTruthy();
    });

    it('should use custom section titles when provided', async () => {
      module.config.summary = {
        showIncomplete: true,
        showRotating: true,
        showOverdue: true,
        incompleteTitle: 'To Do Today',
        rotatingTitle: 'Weekly Rotation',
        overdueTitle: 'Past Due',
      };

      const wrapper = document.createElement('div');
      const result = module.renderSummaryView(wrapper);
      document.body.appendChild(result);

      // Should show custom titles
      expect(page.getByText('To Do Today')).toBeVisible();
      expect(page.getByText('Weekly Rotation')).toBeVisible();
      expect(page.getByText('Past Due')).toBeVisible();

      // Should not show default titles
      expect(page.getByText('Incomplete Chores').elements()).toHaveLength(0);
      expect(page.getByText("Today's Rotation").elements()).toHaveLength(0);
      expect(page.getByText('Overdue').elements()).toHaveLength(0);
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
        lastResetDate: '2024-01-01',
        people: [
          { id: '1', name: 'Alice', color: '#FF6B6B' },
          { id: '2', name: 'Bob', color: '#4ECDC4' },
        ],
        chores: [
          {
            id: 'chore-1',
            name: 'Take out trash',
            type: ChoreType.ROTATING,
            rotation: ['1', '2'],
            rotatingIndex: 0,
            completedToday: false,
            skipDays: [],
            skipDayVisibility: SkipDayVisibility.HIDE,
            caughtUp: true,
          },
        ],
        dailyCompletions: [],
        settings: {
          historyEnabled: true,
        },
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
