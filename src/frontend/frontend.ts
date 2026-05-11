import { SocketNotifications } from '../constants/socket-notifications';
import type { FamilyChoresData } from '../types/chore-types';
import type { FamilyChoresModule } from '../types/module';

// Export the module definition for testing and for use in frontend.ts
export const Frontend: FamilyChoresModule = {
  name: 'MMM-FamilyChores',
  config: {
    updateInterval: 60000,
    dataFile: 'data.json',
    adminPin: null,
  },
  file: ((filename: string) => filename) as (filename: string) => string,
  sendSocketNotification: (() => {}) as () => void,
  updateDom: (() => {}) as () => void,
  defaults: {
    updateInterval: 60000,
    dataFile: 'data.json',
    adminPin: null,
  },
  choreData: null as FamilyChoresData | null,

  // MM function: this method is called when all modules are loaded and the system is ready to boot up.
  start(): void {
    Log.info(`${this.name} is starting`);
    this.loadData();
    this.scheduleUpdate();
  },

  /**
   * The getStyles method is called to request any additional stylesheets that need to be loaded.
   * This method should therefore return an array with strings. If you want to return a full path
   * to a file in the module folder, use the this.file('filename.css') method. In all cases the
   * loader will only load a file once. It even checks if the file is available in the default
   * vendor folder.
   */
  getStyles() {
    return [this.file('css/mmm-familychores.css')];
  },

  // MM function: returns DOM element
  getDom(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'MMM-FamilyChores';

    if (!this.choreData) {
      wrapper.innerHTML =
        '<div class="module-header">Family Chores</div><div class="module-content">Loading...</div>';
      return wrapper;
    }

    wrapper.innerHTML = `
      <div class="module-header">Family Chores</div>
      <div class="module-content">
        <div class="chore-summary">
          <div class="summary-item">
            <span class="label">Total Chores:</span>
            <span class="value">${this.choreData.chores.length}</span>
          </div>
          <div class="summary-item">
            <span class="label">Completed Today:</span>
            <span class="value">${this.choreData.state.completedToday.length}</span>
          </div>
        </div>
      </div>
    `;

    return wrapper;
  },

  // MM function: receives socket notifications from node helper
  socketNotificationReceived(notificationIdentifier: string, payload: unknown): void {
    Log.debug(`${this.name} received socket notification: '${notificationIdentifier}'`);

    switch (notificationIdentifier) {
      case SocketNotifications.CONFIG_RESPONSE:
        Log.debug('Received config response');
        break;
      case SocketNotifications.CHORE_DATA:
        this.choreData = payload as FamilyChoresData;
        this.updateDom();
        break;
      case SocketNotifications.PIN_ERROR:
        Log.warn('PIN error received');
        break;
      default:
        Log.warn(`${this.name} received unknown socket notification: '${notificationIdentifier}'`);
    }
  },

  // Custom function: load data every interval
  scheduleUpdate(): void {
    setInterval(() => {
      this.loadData();
    }, this.config.updateInterval || 60000);
  },

  // Custom function: send socket notification to node helper
  loadData(): void {
    Log.debug(`${this.name} is loading data`);
    this.sendSocketNotification(SocketNotifications.CONFIG_REQUEST, this.config);
  },
};
