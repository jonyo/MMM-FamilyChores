// Automatically built — do not edit directly. Edit src/ and run pnpm build.
(function(factory) {
	typeof define === "function" && define.amd ? define([], factory) : factory();
})(function() {
	//#region src/constants/socket-notifications.ts
	var SocketNotifications = {
		CONFIG_REQUEST: "CONFIG_REQUEST",
		CHORE_TOGGLE: "CHORE_TOGGLE",
		CONFIG_RESPONSE: "CONFIG_RESPONSE",
		CHORE_DATA: "CHORE_DATA",
		CHORE_UPDATE_RESULT: "CHORE_UPDATE_RESULT"
	};
	//#endregion
	//#region src/types/chore-types.ts
	var SkipDayVisibility = /* @__PURE__ */ function(SkipDayVisibility) {
		SkipDayVisibility["HIDE"] = "hide";
		SkipDayVisibility["SHOW_IF_OVERDUE"] = "show-if-overdue";
		SkipDayVisibility["SHOW_ALWAYS"] = "show-always";
		return SkipDayVisibility;
	}({});
	var ChoreType = /* @__PURE__ */ function(ChoreType) {
		ChoreType["PERSONAL"] = "personal";
		ChoreType["ROTATING"] = "rotating";
		return ChoreType;
	}({});
	//#endregion
	//#region src/utils/browser.ts
	/**
	* Escape HTML special characters to prevent XSS attacks
	* Uses the browser's DOM API to properly escape HTML entities
	*
	* @param raw - The raw string to escape
	* @returns The escaped HTML string
	*/
	var escapeHtml = (raw) => {
		const div = document.createElement("div");
		div.textContent = raw;
		return div.innerHTML;
	};
	//#endregion
	//#region src/utils/date.ts
	/**
	* Gets the local time string in HH:MM format
	* Uses Intl.DateTimeFormat for proper timezone and DST handling
	*
	* @warning Do not pass a Date object created from a YYYY-MM-DD string (e.g., new Date('2026-05-17'))
	* as it parses as UTC midnight and will produce incorrect results when formatted back to local timezone.
	* Only pass Date objects created from real time values (e.g., new Date(), new Date(timestamp)).
	*
	* Avoid:
	* - Date objects created from YYYY-MM-DD strings (parsed as UTC midnight)
	* - Double local correction (UTC → local timezone → back into helper)
	*
	* @param date - Optional date to convert (defaults to current time)
	*/
	var getLocalTimeString = (date = /* @__PURE__ */ new Date()) => {
		return new Intl.DateTimeFormat("en-CA", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false
		}).format(date);
	};
	/**
	* Gets the local day name in lowercase (sunday, monday, etc.)
	* Uses Intl.DateTimeFormat for proper timezone and DST handling
	*
	* @warning Do not pass a Date object created from a YYYY-MM-DD string (e.g., new Date('2026-05-17'))
	* as it parses as UTC midnight and will produce incorrect results when formatted back to local timezone.
	* Only pass Date objects created from real time values (e.g., new Date(), new Date(timestamp)).
	*
	* Avoid:
	* - Date objects created from YYYY-MM-DD strings (parsed as UTC midnight)
	* - Double local correction (UTC → local timezone → back into helper)
	*
	* @param date - Optional date to convert (defaults to current time)
	*/
	var getLocalDayName = (date = /* @__PURE__ */ new Date()) => {
		return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date).toLowerCase();
	};
	/**
	* Deadline status enum for visual indicators
	*/
	var DeadlineStatus = /* @__PURE__ */ function(DeadlineStatus) {
		DeadlineStatus["NORMAL"] = "normal";
		DeadlineStatus["OVERDUE"] = "overdue";
		DeadlineStatus["COMPLETED"] = "completed";
		return DeadlineStatus;
	}({});
	/**
	* Determines the deadline status for a chore
	* @param deadline - Optional deadline time in "HH:MM" format
	* @param completedToday - Whether the chore is completed today
	* @param caughtUp - Whether the chore is caught up (completed yesterday)
	* @returns DeadlineStatus for CSS class application
	*/
	var getDeadlineStatus = (deadline, completedToday, caughtUp) => {
		if (completedToday) return DeadlineStatus.COMPLETED;
		if (caughtUp === false) return DeadlineStatus.OVERDUE;
		if (!deadline) return DeadlineStatus.NORMAL;
		if (getLocalTimeString() >= deadline) return DeadlineStatus.OVERDUE;
		return DeadlineStatus.NORMAL;
	};
	//#endregion
	//#region src/frontend/frontend.ts
	Module.register("MMM-FamilyChores", {
		name: "MMM-FamilyChores",
		config: {
			updateInterval: 6e4,
			dataFile: "data.json",
			personFilter: null,
			viewMode: "personal",
			summary: {
				showIncomplete: true,
				showRotating: true,
				showOverdue: true,
				incompleteTitle: "Incomplete Chores",
				rotatingTitle: "Today's Rotation",
				overdueTitle: "Overdue"
			}
		},
		defaults: {
			updateInterval: 6e4,
			dataFile: "data.json",
			personFilter: null,
			viewMode: "personal",
			summary: {
				showIncomplete: true,
				showRotating: true,
				showOverdue: true,
				incompleteTitle: "Incomplete Chores",
				rotatingTitle: "Today's Rotation",
				overdueTitle: "Overdue"
			}
		},
		choreData: null,
		start() {
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
			return [this.file?.("css/main.css") || ""];
		},
		shouldShowChore(chore, todayDayName) {
			if (!chore.skipDays.includes(todayDayName)) return true;
			const skipDayVisibility = chore.skipDayVisibility ?? SkipDayVisibility.HIDE;
			if (skipDayVisibility === SkipDayVisibility.HIDE) return false;
			if (skipDayVisibility === SkipDayVisibility.SHOW_IF_OVERDUE && chore.caughtUp) return false;
			return true;
		},
		getFilteredChores() {
			if (!this.choreData) return [];
			if (this.config.viewMode === "summary") return this.getSummaryChores();
			const todayDayName = getLocalDayName();
			const filterValue = this.config.personFilter?.trim().toLowerCase();
			if (!filterValue) return this.choreData.chores.filter((chore) => this.shouldShowChore(chore, todayDayName));
			const filteredPerson = this.choreData.people.find((person) => person.id.toLowerCase() === filterValue) || this.choreData.people.find((person) => person.name.toLowerCase() === filterValue);
			if (!filteredPerson) {
				Log.warn(`${this.name} could not find a person matching '${this.config.personFilter}'`);
				return [];
			}
			return this.choreData.chores.filter((chore) => {
				if (!this.shouldShowChore(chore, todayDayName)) return false;
				if (chore.type === "personal") return chore.assignedTo === filteredPerson.id;
				if (chore.type === "rotating" && chore.rotation?.length) {
					const currentIndex = chore.rotatingIndex ?? 0;
					return chore.rotation[currentIndex] === filteredPerson.id;
				}
				return false;
			});
		},
		getSummaryChores() {
			if (!this.choreData) return [];
			const todayDayName = getLocalDayName();
			return this.choreData.chores.filter((chore) => {
				if (!this.shouldShowChore(chore, todayDayName)) return false;
				if (!chore.completedToday) return true;
				if (chore.type === "rotating" && chore.rotation?.length) return true;
				return false;
			});
		},
		getDom() {
			const wrapper = document.createElement("div");
			wrapper.className = "MMM-FamilyChores";
			if (!this.choreData) {
				wrapper.innerHTML = "<div class=\"module-content loading\">Loading...</div>";
				return wrapper;
			}
			const choreData = this.choreData;
			const visibleChores = this.getFilteredChores();
			if (visibleChores.length === 0) {
				wrapper.innerHTML = `
      <div class="module-content">
        <div class="chore-list empty-state">No chores match the current filter.</div>
      </div>
      `;
				return wrapper;
			}
			if (this.config.viewMode === "summary") return this.renderSummaryView(wrapper);
			wrapper.innerHTML = `
      <div class="module-content">
        <div class="chore-list">
          ${visibleChores.map((chore) => this.renderChoreItem(chore, choreData)).join("")}
        </div>
      </div>
    `;
			if (this.checkboxChangeListener) wrapper.removeEventListener("change", this.checkboxChangeListener);
			this.checkboxChangeListener = (event) => {
				const target = event.target;
				if (target.type === "checkbox") {
					const choreId = target.getAttribute("data-chore-id");
					if (choreId) this.toggleChoreCompletion(choreId, target.checked);
				}
			};
			wrapper.addEventListener("change", this.checkboxChangeListener);
			return wrapper;
		},
		toggleChoreCompletion(choreId, completed) {
			Log.debug(`${this.name} toggling chore ${choreId} to ${completed}`);
			const payload = {
				choreId,
				completed
			};
			this.sendSocketNotification?.(SocketNotifications.CHORE_TOGGLE, payload);
		},
		renderChoreItem(chore, choreData) {
			const assignedPerson = chore.type === ChoreType.PERSONAL ? choreData.people.find((p) => p.id === chore.assignedTo) : null;
			const currentRotationPerson = chore.type === ChoreType.ROTATING && chore.rotation && chore.rotatingIndex !== void 0 ? choreData.people.find((p) => p.id === chore.rotation?.[chore.rotatingIndex ?? -1]) : null;
			const displayName = assignedPerson || currentRotationPerson;
			const personName = displayName ? displayName.name : "Unassigned";
			const personColor = displayName ? displayName.color : "#ccc";
			const deadlineStatus = getDeadlineStatus(chore.deadline, chore.completedToday, chore.caughtUp);
			const deadlineClass = deadlineStatus === DeadlineStatus.COMPLETED ? "completed" : deadlineStatus;
			const checkedAttr = chore.completedToday ? "checked" : "";
			let html = `<div class="chore-item ${deadlineClass}">`;
			html += `<label class="chore-label" for="chore-${chore.id}">`;
			html += "<div class=\"chore-checkbox\">";
			html += `<input type="checkbox" id="chore-${chore.id}" data-chore-id="${chore.id}" ${checkedAttr} />`;
			html += "</div>";
			html += "<div class=\"chore-details\">";
			html += `<div class="chore-name">${escapeHtml(chore.name)}</div>`;
			html += "<div class=\"chore-meta\">";
			html += `<span class="assigned-to" style="color: ${personColor}">${escapeHtml(personName)}</span>`;
			if (chore.deadline) html += `<span class="deadline">${chore.deadline}</span>`;
			html += "</div>";
			html += "</div>";
			html += "</label>";
			html += "</div>";
			return html;
		},
		renderRotatingChoreInline(chore, choreData) {
			const currentRotationPerson = chore.type === ChoreType.ROTATING && chore.rotation && chore.rotatingIndex !== void 0 ? choreData.people.find((p) => p.id === chore.rotation?.[chore.rotatingIndex ?? -1]) : null;
			const personName = currentRotationPerson ? currentRotationPerson.name : "Unassigned";
			const personColor = currentRotationPerson ? currentRotationPerson.color : "#ccc";
			const checkedAttr = chore.completedToday ? "checked" : "";
			let html = `<div class="rotating-inline">`;
			html += `<span class="chore-name">${escapeHtml(chore.name)}</span>`;
			html += `<span class="person-name" style="color: ${personColor}">${escapeHtml(personName)}</span>`;
			html += `<input type="checkbox" class="inline-checkbox" data-chore-id="${chore.id}" ${checkedAttr} />`;
			html += "</div>";
			return html;
		},
		renderOverdueByPerson(overdueChores, choreData) {
			const choresByPerson = /* @__PURE__ */ new Map();
			overdueChores.forEach((chore) => {
				let personId;
				if (chore.type === ChoreType.PERSONAL) personId = chore.assignedTo;
				else if (chore.type === ChoreType.ROTATING && chore.rotation && chore.rotatingIndex !== void 0) personId = chore.rotation[chore.rotatingIndex];
				if (personId) {
					if (!choresByPerson.has(personId)) choresByPerson.set(personId, []);
					choresByPerson.get(personId)?.push(chore);
				}
			});
			let html = "";
			choresByPerson.forEach((chores, personId) => {
				const person = choreData.people.find((p) => p.id === personId);
				if (!person) return;
				const displayChores = chores.length <= 4 ? chores : chores.slice(0, 3);
				const remainingCount = chores.length <= 4 ? 0 : chores.length - 3;
				html += `<div class="overdue-person-group">`;
				html += `<div class="overdue-person-name" style="color: ${person.color}">${escapeHtml(person.name)}</div>`;
				html += "<div class=\"overdue-chores-list\">";
				displayChores.forEach((chore) => {
					html += `<div class="overdue-chore-item" data-chore-id="${chore.id}">${escapeHtml(chore.name)}</div>`;
				});
				if (remainingCount > 0) html += `<div class="overdue-more">...${remainingCount} more</div>`;
				html += "</div>";
				html += "</div>";
			});
			return html;
		},
		renderIncompleteByPerson(incompleteChores, choreData) {
			const choresByPerson = /* @__PURE__ */ new Map();
			incompleteChores.forEach((chore) => {
				let personId;
				if (chore.type === ChoreType.PERSONAL) personId = chore.assignedTo;
				else if (chore.type === ChoreType.ROTATING && chore.rotation && chore.rotatingIndex !== void 0) personId = chore.rotation[chore.rotatingIndex];
				if (personId) {
					if (!choresByPerson.has(personId)) choresByPerson.set(personId, []);
					choresByPerson.get(personId)?.push(chore);
				}
			});
			let html = "";
			choreData.people.forEach((person) => {
				const count = (choresByPerson.get(person.id) || []).length;
				const celebrationEmoji = count === 0 ? "🎉" : "";
				html += `<div class="incomplete-person-row">`;
				html += `<span class="person-name" style="color: ${person.color}">${escapeHtml(person.name)}</span>`;
				html += `<span class="incomplete-count">${celebrationEmoji} ${count}</span>`;
				html += "</div>";
			});
			return html;
		},
		renderSummaryView(wrapper) {
			if (!this.choreData) {
				wrapper.innerHTML = "<div class=\"module-content loading\">Loading...</div>";
				return wrapper;
			}
			const choreData = this.choreData;
			const visibleChores = this.getFilteredChores();
			const summaryConfig = {
				showIncomplete: true,
				showRotating: true,
				showOverdue: true,
				incompleteTitle: "Incomplete Chores",
				rotatingTitle: "Today's Rotation",
				overdueTitle: "Overdue",
				...this.config.summary
			};
			const incompleteChores = visibleChores.filter((chore) => !chore.completedToday);
			const overdueChores = visibleChores.filter((chore) => {
				return getDeadlineStatus(chore.deadline, chore.completedToday, chore.caughtUp) === DeadlineStatus.OVERDUE;
			});
			const rotatingChores = visibleChores.filter((chore) => chore.type === "rotating");
			let html = "<div class=\"module-content summary-view\">";
			if (summaryConfig.showIncomplete && incompleteChores.length > 0) {
				html += "<div class=\"summary-section incomplete-section\">";
				html += `<h3 class="section-title incomplete-title">${summaryConfig.incompleteTitle}</h3>`;
				html += "<div class=\"incomplete-list\">";
				html += this.renderIncompleteByPerson(incompleteChores, choreData);
				html += "</div>";
				html += "</div>";
			}
			if (summaryConfig.showRotating && rotatingChores.length > 0) {
				html += "<div class=\"summary-section rotating-section\">";
				html += `<h3 class="section-title rotating-title">${summaryConfig.rotatingTitle}</h3>`;
				html += "<div class=\"chore-list\">";
				html += rotatingChores.map((chore) => this.renderRotatingChoreInline(chore, choreData)).join("");
				html += "</div>";
				html += "</div>";
			}
			if (summaryConfig.showOverdue && overdueChores.length > 0) {
				html += "<div class=\"summary-section overdue-section\">";
				html += `<h3 class="section-title overdue-title">${summaryConfig.overdueTitle}</h3>`;
				html += "<div class=\"overdue-list\">";
				html += this.renderOverdueByPerson(overdueChores, choreData);
				html += "</div>";
				html += "</div>";
			}
			html += "</div>";
			wrapper.innerHTML = html;
			if (this.checkboxChangeListener) wrapper.removeEventListener("change", this.checkboxChangeListener);
			this.checkboxChangeListener = (event) => {
				const target = event.target;
				if (target.type === "checkbox") {
					const choreId = target.getAttribute("data-chore-id");
					if (choreId) this.toggleChoreCompletion(choreId, target.checked);
				}
			};
			wrapper.addEventListener("change", this.checkboxChangeListener);
			return wrapper;
		},
		socketNotificationReceived(notificationIdentifier, payload) {
			Log.debug(`${this.name} received socket notification: '${notificationIdentifier}'`);
			switch (notificationIdentifier) {
				case SocketNotifications.CONFIG_RESPONSE:
					Log.debug("Received config response");
					break;
				case SocketNotifications.CHORE_DATA:
					this.choreData = payload;
					this.updateDom?.();
					break;
				case SocketNotifications.CHORE_UPDATE_RESULT:
					Log.debug("Received chore update result");
					this.loadData();
					break;
				default: Log.warn(`${this.name} received unknown socket notification: '${notificationIdentifier}'`);
			}
		},
		scheduleUpdate() {
			setInterval(() => {
				this.loadData();
			}, this.config.updateInterval || 6e4);
		},
		loadData() {
			Log.debug(`${this.name} is loading data`);
			this.sendSocketNotification?.(SocketNotifications.CONFIG_REQUEST, this.config);
		}
	});
	//#endregion
});
