import { createStore, reconcile } from 'solid-js/store';
import { render } from 'solid-js/web';
import { SocketNotifications } from '../constants/socket-notifications';
import type { DayOfWeek, FamilyChoresData } from '../types/chore-types';
import type { Config } from '../types/config';
import type { FamilyChoresModule } from '../types/module';
import { getLocalDayName } from '../utils/date';
import { App } from './app';

declare global {
  const Log: {
    info: (message: string) => void;
    log: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
    debug: (message: string) => void;
  };
}

// Register the module with MagicMirror
const familyChoresModule: FamilyChoresModule = {
  name: 'MMM-FamilyChores',
  config: {
    personFilter: null,
    viewMode: 'personal',
    summary: {
      showIncomplete: true,
      showRotating: true,
      showOverdue: true,
      incompleteTitle: 'Incomplete Chores',
      rotatingTitle: "Today's Rotation",
      overdueTitle: 'Overdue',
    },
  },
  defaults: {
    personFilter: null,
    viewMode: 'personal',
    summary: {
      showIncomplete: true,
      showRotating: true,
      showOverdue: true,
      incompleteTitle: 'Incomplete Chores',
      rotatingTitle: "Today's Rotation",
      overdueTitle: 'Overdue',
    },
  },
  choreData: null,

  // MM function: this method is called when all modules are loaded and the system is ready to boot up.
  start(): void {
    Log.info(`${this.name} is starting`);

    // Create per-instance store so socket updates diff rather than replace the whole tree
    const [choreData, setChoreData] = createStore<{
      data: FamilyChoresData | null;
      todaysDayOfWeek: DayOfWeek;
    }>({
      data: null,
      todaysDayOfWeek: getLocalDayName(),
    });
    this.choreDataSignal = () => choreData.data;
    this.todaysDayOfWeekSignal = () => choreData.todaysDayOfWeek;
    this.setChoreDataAndDay = (data: FamilyChoresData) => {
      setChoreData('data', reconcile(data));
      setChoreData('todaysDayOfWeek', getLocalDayName());
    };

    // Check every minute if the date has rolled over and update the reactive signal
    setInterval(() => {
      const newDay = getLocalDayName();
      if (newDay !== choreData.todaysDayOfWeek) {
        setChoreData('todaysDayOfWeek', newDay);
      }
    }, 60_000);

    this.loadData();
  },

  /**
   * The getStyles method is called to request any additional stylesheets that need to be loaded.
   */
  getStyles() {
    return [this.file?.('css/main.css') || ''];
  },

  // MM function: returns DOM element
  getDom(): HTMLElement {
    // Return cached container to prevent Solid from remounting.
    // MM may call getDom() multiple times (e.g., on suspend/resume).
    if (this.rootContainer) {
      return this.rootContainer;
    }

    const container = document.createElement('div');
    container.className = 'MMM-FamilyChores';

    const handleToggle = (choreId: string, completed: boolean) => {
      Log.debug(`${this.name} toggling chore ${choreId} to ${completed}`);
      this.sendSocketNotification?.(SocketNotifications.CHORE_TOGGLE, {
        choreId,
        completed,
      });
    };

    const choreDataSignal = this.choreDataSignal;
    const todaysDayOfWeekSignal = this.todaysDayOfWeekSignal;
    if (!choreDataSignal || !todaysDayOfWeekSignal) {
      Log.error(`${this.name} choreDataSignal or todaysDayOfWeekSignal is not initialized`);
      return container;
    }

    render(
      () => (
        <App
          choreData={choreDataSignal}
          todaysDayOfWeek={todaysDayOfWeekSignal}
          config={this.config}
          onToggle={handleToggle}
        />
      ),
      container
    );

    this.rootContainer = container;
    return container;
  },

  // Custom function: toggle chore completion
  toggleChoreCompletion(choreId: string, completed: boolean): void {
    Log.debug(`${this.name} toggling chore ${choreId} to ${completed}`);

    this.sendSocketNotification?.(SocketNotifications.CHORE_TOGGLE, {
      choreId,
      completed,
    });
  },

  // MM function: receives socket notifications from node helper
  socketNotificationReceived(notificationIdentifier: string, payload: unknown): void {
    Log.debug(`${this.name} received socket notification: '${notificationIdentifier}'`);

    switch (notificationIdentifier) {
      case SocketNotifications.CONFIG_RESPONSE:
        Log.debug('Received config response');
        break;
      case SocketNotifications.CHORE_DATA:
        this.setChoreDataAndDay?.(payload as FamilyChoresData);
        break;
      case SocketNotifications.CHORE_UPDATE_RESULT:
        Log.debug('Received chore update result');
        // Refresh data to get updated state
        this.loadData();
        break;
      default:
        Log.warn(`${this.name} received unknown socket notification: '${notificationIdentifier}'`);
    }
  },

  // Custom function: send socket notification to node helper
  loadData(): void {
    Log.debug(`${this.name} is loading data`);
    this.sendSocketNotification?.(SocketNotifications.CONFIG_REQUEST, this.config);
  },
};

Module.register<Config>('MMM-FamilyChores', familyChoresModule);
