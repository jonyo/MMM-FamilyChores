import { SocketNotifications } from '../constants/socket-notifications';
import type { Chore, FamilyChoresData } from '../types/chore-types';
import { ChoreType, SkipDayVisibility } from '../types/chore-types';
import type { Config } from '../types/config';
import type { FamilyChoresModule } from '../types/module';
import { escapeHtml } from '../utils/browser';
import { DeadlineStatus, getDeadlineStatus, getLocalDayName } from '../utils/date';

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
    updateInterval: 60000,
    dataFile: 'data.json',
    adminPin: null,
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
    updateInterval: 60000,
    dataFile: 'data.json',
    adminPin: null,
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
    return [this.file?.('css/main.css') || ''];
  },

  // Helper function: check if a chore should be shown based on skip day visibility
  shouldShowChore(chore, todayDayName): boolean {
    const skipDays = chore.skipDays;
    if (!skipDays.includes(todayDayName)) {
      // not a skip day
      return true;
    }
    // skip day - decide whether to show based on visibility setting
    const skipDayVisibility = chore.skipDayVisibility ?? SkipDayVisibility.HIDE;

    if (skipDayVisibility === SkipDayVisibility.HIDE) {
      // Today is a skip day and visibility is HIDE - skip this chore entirely
      return false;
    }
    if (skipDayVisibility === SkipDayVisibility.SHOW_IF_OVERDUE && chore.caughtUp) {
      // Visibility is "show if overdue" and we are caught up - don't show
      return false;
    }
    // either "always show" or "show if overdue" and it is overdue
    return true;
  },

  getFilteredChores(): FamilyChoresData['chores'] {
    if (!this.choreData) {
      return [];
    }

    // Handle summary view mode - show all incomplete chores + rotating assignments
    if (this.config.viewMode === 'summary') {
      return this.getSummaryChores();
    }

    const todayDayName = getLocalDayName();

    // Personal view mode (default)
    const filterValue = this.config.personFilter?.trim().toLowerCase();
    if (!filterValue) {
      // No person filter - apply skip day filtering to all chores
      return this.choreData.chores.filter((chore) => this.shouldShowChore(chore, todayDayName));
    }

    const filteredPerson =
      this.choreData.people.find((person) => person.id.toLowerCase() === filterValue) ||
      this.choreData.people.find((person) => person.name.toLowerCase() === filterValue);

    if (!filteredPerson) {
      Log.warn(`${this.name} could not find a person matching '${this.config.personFilter}'`);
      return [];
    }

    return this.choreData.chores.filter((chore) => {
      // Check skip day visibility
      if (!this.shouldShowChore(chore, todayDayName)) {
        return false;
      }

      // Apply person filter
      if (chore.type === 'personal') {
        return chore.assignedTo === filteredPerson.id;
      }

      if (chore.type === 'rotating' && chore.rotation?.length) {
        const currentIndex = chore.rotatingIndex ?? 0;
        return chore.rotation[currentIndex] === filteredPerson.id;
      }

      return false;
    });
  },

  // Custom function: get chores for summary view
  getSummaryChores(): FamilyChoresData['chores'] {
    if (!this.choreData) {
      return [];
    }

    const todayDayName = getLocalDayName();

    return this.choreData.chores.filter((chore) => {
      // Check skip day visibility
      if (!this.shouldShowChore(chore, todayDayName)) {
        return false;
      }

      // Show all incomplete chores
      if (!chore.completedToday) {
        return true;
      }

      // For rotating chores, always show current assignment even if completed
      if (chore.type === 'rotating' && chore.rotation?.length) {
        return true;
      }

      return false;
    });
  },

  // MM function: returns DOM element
  getDom(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'MMM-FamilyChores';

    if (!this.choreData) {
      wrapper.innerHTML = '<div class="module-content loading">Loading...</div>';
      return wrapper;
    }

    const choreData = this.choreData as FamilyChoresData;
    const visibleChores = this.getFilteredChores();

    if (visibleChores.length === 0) {
      wrapper.innerHTML = `
      <div class="module-content">
        <div class="chore-list empty-state">No chores match the current filter.</div>
      </div>
      `;
      return wrapper;
    }

    // Handle summary view with sections
    if (this.config.viewMode === 'summary') {
      return this.renderSummaryView(wrapper);
    }

    // Personal view (default)
    const choreItemsHtml = visibleChores
      .map((chore) => this.renderChoreItem(chore, choreData))
      .join('');

    wrapper.innerHTML = `
      <div class="module-content">
        <div class="chore-list">
          ${choreItemsHtml}
        </div>
      </div>
    `;

    // Remove old listener if it exists to prevent accumulation
    if (this.checkboxChangeListener) {
      wrapper.removeEventListener('change', this.checkboxChangeListener);
    }

    // Use event delegation for checkbox interactions
    // This ensures listeners work even after DOM updates
    this.checkboxChangeListener = (event) => {
      const target = event.target as HTMLInputElement;
      if (target.type === 'checkbox') {
        const choreId = target.getAttribute('data-chore-id');
        if (choreId) {
          this.toggleChoreCompletion(choreId, target.checked);
        }
      }
    };
    wrapper.addEventListener('change', this.checkboxChangeListener);

    return wrapper;
  },

  // Custom function: toggle chore completion
  toggleChoreCompletion(choreId: string, completed: boolean): void {
    Log.debug(`${this.name} toggling chore ${choreId} to ${completed}`);

    const payload = {
      choreId,
      completed,
    };

    this.sendSocketNotification?.(SocketNotifications.CHORE_TOGGLE, payload);
  },

  renderChoreItem(chore, choreData): string {
    const assignedPerson =
      chore.type === ChoreType.PERSONAL
        ? choreData.people.find((p) => p.id === chore.assignedTo)
        : null;

    const currentRotationPerson =
      chore.type === ChoreType.ROTATING && chore.rotation && chore.rotatingIndex !== undefined
        ? choreData.people.find((p) => p.id === chore.rotation?.[chore.rotatingIndex ?? -1])
        : null;

    const displayName = assignedPerson || currentRotationPerson;
    const personName = displayName ? displayName.name : 'Unassigned';
    const personColor = displayName ? displayName.color : '#ccc';

    // Determine deadline status for CSS classes
    const deadlineStatus = getDeadlineStatus(chore.deadline, chore.completedToday, chore.caughtUp);
    const deadlineClass =
      deadlineStatus === DeadlineStatus.COMPLETED ? 'completed' : deadlineStatus;
    const checkedAttr = chore.completedToday ? 'checked' : '';

    let html = `<div class="chore-item ${deadlineClass}">`;
    html += `<label class="chore-label" for="chore-${chore.id}">`;
    html += '<div class="chore-checkbox">';
    html += `<input type="checkbox" id="chore-${chore.id}" data-chore-id="${chore.id}" ${checkedAttr} />`;
    html += '</div>';
    html += '<div class="chore-details">';
    html += `<div class="chore-name">${escapeHtml(chore.name)}</div>`;
    html += '<div class="chore-meta">';
    html += `<span class="assigned-to" style="color: ${personColor}">${escapeHtml(personName)}</span>`;
    if (chore.deadline) {
      html += `<span class="deadline">${chore.deadline}</span>`;
    }
    html += '</div>';
    html += '</div>';
    html += '</label>';
    html += '</div>';

    return html;
  },

  // Custom function: render rotating chore in compact inline style
  renderRotatingChoreInline(chore: Chore, choreData: FamilyChoresData): string {
    const currentRotationPerson =
      chore.type === ChoreType.ROTATING && chore.rotation && chore.rotatingIndex !== undefined
        ? choreData.people.find(
            (p: FamilyChoresData['people'][0]) =>
              p.id === chore.rotation?.[chore.rotatingIndex ?? -1]
          )
        : null;

    const personName = currentRotationPerson ? currentRotationPerson.name : 'Unassigned';
    const personColor = currentRotationPerson ? currentRotationPerson.color : '#ccc';
    const checkedAttr = chore.completedToday ? 'checked' : '';

    let html = `<div class="rotating-inline">`;
    html += `<span class="chore-name">${escapeHtml(chore.name)}</span>`;
    html += `<span class="person-name" style="color: ${personColor}">${escapeHtml(personName)}</span>`;
    html += `<input type="checkbox" class="inline-checkbox" data-chore-id="${chore.id}" ${checkedAttr} />`;
    html += '</div>';

    return html;
  },

  // Custom function: render overdue chores grouped by person in compact inline style
  renderOverdueByPerson(overdueChores: Chore[], choreData: FamilyChoresData): string {
    // Group overdue chores by person
    const choresByPerson = new Map<string, Chore[]>();
    overdueChores.forEach((chore) => {
      let personId: string | undefined;
      if (chore.type === ChoreType.PERSONAL) {
        personId = chore.assignedTo;
      } else if (
        chore.type === ChoreType.ROTATING &&
        chore.rotation &&
        chore.rotatingIndex !== undefined
      ) {
        personId = chore.rotation[chore.rotatingIndex];
      }

      if (personId) {
        if (!choresByPerson.has(personId)) {
          choresByPerson.set(personId, []);
        }
        choresByPerson.get(personId)?.push(chore);
      }
    });

    let html = '';
    choresByPerson.forEach((chores, personId) => {
      const person = choreData.people.find((p) => p.id === personId);
      if (!person) return;

      // Show all if 4 or fewer, otherwise show 3 and "...X more"
      const displayChores = chores.length <= 4 ? chores : chores.slice(0, 3);
      const remainingCount = chores.length <= 4 ? 0 : chores.length - 3;

      html += `<div class="overdue-person-group">`;
      html += `<div class="overdue-person-name" style="color: ${person.color}">${escapeHtml(person.name)}</div>`;
      html += '<div class="overdue-chores-list">';
      displayChores.forEach((chore) => {
        html += `<div class="overdue-chore-item" data-chore-id="${chore.id}">${escapeHtml(chore.name)}</div>`;
      });

      if (remainingCount > 0) {
        html += `<div class="overdue-more">...${remainingCount} more</div>`;
      }

      html += '</div>';
      html += '</div>';
    });

    return html;
  },

  // Custom function: render incomplete chores grouped by person with counts
  renderIncompleteByPerson(incompleteChores: Chore[], choreData: FamilyChoresData): string {
    // Group incomplete chores by person
    const choresByPerson = new Map<string, Chore[]>();
    incompleteChores.forEach((chore) => {
      let personId: string | undefined;
      if (chore.type === ChoreType.PERSONAL) {
        personId = chore.assignedTo;
      } else if (
        chore.type === ChoreType.ROTATING &&
        chore.rotation &&
        chore.rotatingIndex !== undefined
      ) {
        personId = chore.rotation[chore.rotatingIndex];
      }

      if (personId) {
        if (!choresByPerson.has(personId)) {
          choresByPerson.set(personId, []);
        }
        choresByPerson.get(personId)?.push(chore);
      }
    });

    let html = '';
    // Show all people, including those with 0 incomplete chores
    choreData.people.forEach((person) => {
      const chores = choresByPerson.get(person.id) || [];
      const count = chores.length;
      // Show multiple emoji options for 0 count so user can choose
      const celebrationEmoji = count === 0 ? '🎉' : '';

      html += `<div class="incomplete-person-row">`;
      html += `<span class="person-name" style="color: ${person.color}">${escapeHtml(person.name)}</span>`;
      html += `<span class="incomplete-count">${celebrationEmoji} ${count}</span>`;
      html += '</div>';
    });

    return html;
  },

  // Custom function: render summary view with sections
  renderSummaryView(wrapper: HTMLElement): HTMLElement {
    if (!this.choreData) {
      wrapper.innerHTML = '<div class="module-content loading">Loading...</div>';
      return wrapper;
    }

    const choreData = this.choreData;
    const visibleChores = this.getFilteredChores();

    // Get summary config with defaults
    const summaryConfig = {
      showIncomplete: true,
      showRotating: true,
      showOverdue: true,
      incompleteTitle: 'Incomplete Chores',
      rotatingTitle: "Today's Rotation",
      overdueTitle: 'Overdue',
      ...this.config.summary,
    };

    // Separate chores into categories
    const incompleteChores = visibleChores.filter((chore: Chore) => !chore.completedToday);
    const overdueChores = visibleChores.filter((chore: Chore) => {
      const deadlineStatus = getDeadlineStatus(
        chore.deadline,
        chore.completedToday,
        chore.caughtUp
      );
      return deadlineStatus === DeadlineStatus.OVERDUE;
    });
    const rotatingChores = visibleChores.filter((chore: Chore) => chore.type === 'rotating');

    let html = '<div class="module-content summary-view">';

    // Incomplete chores section
    if (summaryConfig.showIncomplete && incompleteChores.length > 0) {
      html += '<div class="summary-section incomplete-section">';
      html += `<h3 class="section-title incomplete-title">${summaryConfig.incompleteTitle}</h3>`;
      html += '<div class="incomplete-list">';
      html += this.renderIncompleteByPerson(incompleteChores, choreData);
      html += '</div>';
      html += '</div>';
    }

    // Rotating assignments section
    if (summaryConfig.showRotating && rotatingChores.length > 0) {
      html += '<div class="summary-section rotating-section">';
      html += `<h3 class="section-title rotating-title">${summaryConfig.rotatingTitle}</h3>`;
      html += '<div class="chore-list">';
      html += rotatingChores
        .map((chore: Chore) => this.renderRotatingChoreInline(chore, choreData))
        .join('');
      html += '</div>';
      html += '</div>';
    }

    // Overdue section
    if (summaryConfig.showOverdue && overdueChores.length > 0) {
      html += '<div class="summary-section overdue-section">';
      html += `<h3 class="section-title overdue-title">${summaryConfig.overdueTitle}</h3>`;
      html += '<div class="overdue-list">';
      html += this.renderOverdueByPerson(overdueChores, choreData);
      html += '</div>';
      html += '</div>';
    }

    html += '</div>';
    wrapper.innerHTML = html;

    // Remove old listener if it exists to prevent accumulation
    if (this.checkboxChangeListener) {
      wrapper.removeEventListener('change', this.checkboxChangeListener);
    }

    // Use event delegation for checkbox interactions
    // This ensures listeners work even after DOM updates
    this.checkboxChangeListener = (event) => {
      const target = event.target as HTMLInputElement;
      if (target.type === 'checkbox') {
        const choreId = target.getAttribute('data-chore-id');
        if (choreId) {
          this.toggleChoreCompletion(choreId, target.checked);
        }
      }
    };
    wrapper.addEventListener('change', this.checkboxChangeListener);

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
        this.updateDom?.();
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

  // Custom function: load data every interval
  scheduleUpdate(): void {
    setInterval(() => {
      this.loadData();
    }, this.config.updateInterval || 60000);
  },

  // Custom function: send socket notification to node helper
  loadData(): void {
    Log.debug(`${this.name} is loading data`);
    this.sendSocketNotification?.(SocketNotifications.CONFIG_REQUEST, this.config);
  },
};

Module.register<Config>('MMM-FamilyChores', familyChoresModule);
