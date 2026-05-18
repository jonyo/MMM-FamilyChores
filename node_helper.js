// Automatically built — do not edit directly. Edit src/ and run pnpm build.
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let node_fs = require("node:fs");
node_fs = __toESM(node_fs);
let node_path = require("node:path");
node_path = __toESM(node_path);
let logger = require("logger");
logger = __toESM(logger);
let node_helper = require("node_helper");
node_helper = __toESM(node_helper);
//#region src/constants/socket-notifications.ts
var SocketNotifications = {
	CONFIG_REQUEST: "CONFIG_REQUEST",
	CHORE_TOGGLE: "CHORE_TOGGLE",
	CHORE_REASSIGN: "CHORE_REASSIGN",
	CAUGHTUP_RESET: "CAUGHTUP_RESET",
	CONFIG_RESPONSE: "CONFIG_RESPONSE",
	CHORE_DATA: "CHORE_DATA",
	CHORE_UPDATE_RESULT: "CHORE_UPDATE_RESULT",
	CHORE_REASSIGN_RESULT: "CHORE_REASSIGN_RESULT",
	CAUGHTUP_RESET_RESULT: "CAUGHTUP_RESET_RESULT",
	PIN_ERROR: "PIN_ERROR"
};
//#endregion
//#region src/types/chore-types.ts
var SkipDayVisibility = /* @__PURE__ */ function(SkipDayVisibility) {
	SkipDayVisibility["HIDE"] = "hide";
	SkipDayVisibility["SHOW_IF_OVERDUE"] = "show-if-overdue";
	SkipDayVisibility["SHOW_ALWAYS"] = "show-always";
	return SkipDayVisibility;
}({});
var DayOfWeek = /* @__PURE__ */ function(DayOfWeek) {
	DayOfWeek["SUNDAY"] = "sunday";
	DayOfWeek["MONDAY"] = "monday";
	DayOfWeek["TUESDAY"] = "tuesday";
	DayOfWeek["WEDNESDAY"] = "wednesday";
	DayOfWeek["THURSDAY"] = "thursday";
	DayOfWeek["FRIDAY"] = "friday";
	DayOfWeek["SATURDAY"] = "saturday";
	return DayOfWeek;
}({});
var ChoreType = /* @__PURE__ */ function(ChoreType) {
	ChoreType["PERSONAL"] = "personal";
	ChoreType["ROTATING"] = "rotating";
	return ChoreType;
}({});
//#endregion
//#region src/utils/date.ts
/**
* Gets the local date string in YYYY-MM-DD format
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
var getLocalDateString = (date = /* @__PURE__ */ new Date()) => {
	return new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(date);
};
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
//#endregion
//#region src/utils/uuid.ts
/**
* UUID v4 generation utilities
* Implements RFC 4122 UUID version 4
*/
/**
* Generate a random UUID v4
* Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
* @returns A new UUID v4 string
*/
function generateUUID() {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	bytes[6] = bytes[6] & 15 | 64;
	bytes[8] = bytes[8] & 63 | 128;
	const hex = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		hex.slice(12, 16),
		hex.slice(16, 20),
		hex.slice(20, 32)
	].join("-");
}
/**
* Validate if a string is a valid UUID v4
* @param uuid The string to validate
* @returns True if valid UUID v4, false otherwise
*/
function isValidUUID(uuid) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}
//#endregion
//#region src/backend/validator.ts
var validatePerson = (person) => {
	if (!person || typeof person !== "object") return {
		valid: false,
		error: "Person must be an object"
	};
	const personObj = person;
	if (!personObj.id || typeof personObj.id !== "string" || !personObj.id.trim()) return {
		valid: false,
		error: "Person must have a non-empty id"
	};
	if (!isValidUUID(personObj.id)) return {
		valid: false,
		error: "Person id must be a valid UUID"
	};
	if (!personObj.name || typeof personObj.name !== "string") return {
		valid: false,
		error: "Person must have a name"
	};
	if (!personObj.name.trim()) return {
		valid: false,
		error: "Person name must be non-empty"
	};
	if (!personObj.color || typeof personObj.color !== "string") return {
		valid: false,
		error: "Person color must be a string"
	};
	if (!personObj.color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)) return {
		valid: false,
		error: "Person color must be a valid hex color (e.g., #FF5733 or #F53)"
	};
	return { valid: true };
};
var validateChore = (chore, people) => {
	if (!chore || typeof chore !== "object") return {
		valid: false,
		error: "Chore must be an object"
	};
	const choreObj = chore;
	if (!choreObj.id || typeof choreObj.id !== "string" || !choreObj.id.trim()) return {
		valid: false,
		error: "Chore must have a non-empty id"
	};
	if (!isValidUUID(choreObj.id)) return {
		valid: false,
		error: "Chore id must be a valid UUID"
	};
	if (!choreObj.name || typeof choreObj.name !== "string") return {
		valid: false,
		error: "Chore must have a name"
	};
	if (!choreObj.name.trim()) return {
		valid: false,
		error: "Chore name must be non-empty"
	};
	if (!choreObj.type || typeof choreObj.type !== "string") return {
		valid: false,
		error: "Chore must have a type"
	};
	if (!Object.values(ChoreType).includes(choreObj.type)) return {
		valid: false,
		error: "Chore type must be either \"personal\" or \"rotating\""
	};
	if (choreObj.deadline !== void 0) {
		if (typeof choreObj.deadline !== "string") return {
			valid: false,
			error: "Chore deadline must be a string"
		};
		if (!choreObj.deadline.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) return {
			valid: false,
			error: "Chore deadline must be in 24-hour format (e.g., \"08:00\" or \"21:00\")"
		};
	}
	if (!choreObj.skipDays || !Array.isArray(choreObj.skipDays)) return {
		valid: false,
		error: "Chore must have a skipDays array"
	};
	for (const day of choreObj.skipDays) if (typeof day !== "string" || !Object.values(DayOfWeek).includes(day)) return {
		valid: false,
		error: "Chore skipDays must be valid day names (e.g., \"monday\", \"tuesday\")"
	};
	if (!choreObj.skipDayVisibility || typeof choreObj.skipDayVisibility !== "string") return {
		valid: false,
		error: "Chore must have a skipDayVisibility"
	};
	if (!Object.values(SkipDayVisibility).includes(choreObj.skipDayVisibility)) return {
		valid: false,
		error: "Chore skipDayVisibility must be \"hide\", \"show-if-overdue\", or \"show-always\""
	};
	if (typeof choreObj.caughtUp !== "boolean") return {
		valid: false,
		error: "Chore must have a caughtUp boolean"
	};
	if (typeof choreObj.completedToday !== "boolean") return {
		valid: false,
		error: "Chore must have a completedToday boolean"
	};
	if (choreObj.type === ChoreType.PERSONAL) return validatePersonalChoreParts(choreObj, people);
	return validateRotatingChoreParts(choreObj, people);
};
var validateRotatingChoreParts = (chore, people) => {
	if (chore.type !== ChoreType.ROTATING) return {
		valid: false,
		error: "Chore type must be \"rotating\""
	};
	if (!chore.rotation || !Array.isArray(chore.rotation)) return {
		valid: false,
		error: "Rotating chore must have a rotation array"
	};
	for (const personId of chore.rotation) {
		if (typeof personId !== "string" || !personId) return {
			valid: false,
			error: "Rotating chore rotation must be an array of non-empty strings"
		};
		if (!people.some((person) => person.id === personId)) return {
			valid: false,
			error: "Rotating chore rotation must be an array of valid person IDs"
		};
	}
	if (chore.assignedTo !== void 0) return {
		valid: false,
		error: "Rotating chore must not have an assignedTo field"
	};
	if (typeof chore.rotatingIndex !== "number") return {
		valid: false,
		error: "Rotating chore must have a rotatingIndex number"
	};
	if (chore.rotatingIndex < 0 || chore.rotatingIndex >= chore.rotation.length) return {
		valid: false,
		error: "Rotating chore rotatingIndex must be within bounds of rotation array"
	};
	return { valid: true };
};
var validatePersonalChoreParts = (chore, people) => {
	if (chore.type !== ChoreType.PERSONAL) return {
		valid: false,
		error: "Chore type must be \"personal\""
	};
	if (!chore.assignedTo || typeof chore.assignedTo !== "string") return {
		valid: false,
		error: "Personal chore must have an assignedTo field"
	};
	if (!people.some((person) => person.id === chore.assignedTo)) return {
		valid: false,
		error: "Personal chore assignedTo - person not found"
	};
	if (chore.rotation !== void 0) return {
		valid: false,
		error: "Personal chore must not have a rotation array"
	};
	if (chore.rotatingIndex !== void 0) return {
		valid: false,
		error: "Personal chore must not have a rotatingIndex field"
	};
	return { valid: true };
};
//#endregion
//#region src/backend/admin-routes.ts
function createAdminHandlers(context) {
	const apiErr = (message) => ({ error: message });
	return {
		getData: (_req, res) => {
			const choreData = context.getChoreData();
			if (!choreData) {
				res.status(500).json(apiErr("No data available"));
				return;
			}
			res.json(choreData);
		},
		postPerson: (req, res) => {
			try {
				const { name, color } = req.body;
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				const newPerson = {
					id: generateUUID(),
					name: name?.trim() || "",
					color: color?.trim() || ""
				};
				const validation = validatePerson(newPerson);
				if (!validation.valid) {
					res.status(400).json(apiErr(validation.error));
					return;
				}
				choreData.people.push(newPerson);
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				res.json(newPerson);
			} catch (error) {
				logger.error(`Error adding person: ${error}`);
				res.status(500).json(apiErr("Failed to add person"));
			}
		},
		putPerson: (req, res) => {
			try {
				const { id } = req.params;
				const { name, color } = req.body;
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				const person = choreData.people.find((p) => p.id === id);
				if (!person) {
					res.status(404).json(apiErr("Person not found"));
					return;
				}
				const updatedPerson = {
					id: person.id,
					name: name ? name.trim() : person.name,
					color: color ? color.trim() : person.color
				};
				const validation = validatePerson(updatedPerson);
				if (!validation.valid) {
					res.status(400).json(apiErr(validation.error));
					return;
				}
				Object.assign(person, updatedPerson);
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				res.json(person);
			} catch (error) {
				logger.error(`Error updating person: ${error}`);
				res.status(500).json(apiErr("Failed to update person"));
			}
		},
		deletePerson: (req, res) => {
			try {
				const { id } = req.params;
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				const personIndex = choreData.people.findIndex((p) => p.id === id);
				if (personIndex === -1) {
					res.status(404).json(apiErr("Person not found"));
					return;
				}
				choreData.people.splice(personIndex, 1);
				choreData.chores = choreData.chores.filter((chore) => {
					if (chore.type === "personal") return chore.assignedTo !== id;
					else if (chore.type === "rotating") {
						chore.rotation = chore.rotation?.filter((personId) => personId !== id) || [];
						if (chore.rotatingIndex !== void 0 && chore.rotatingIndex >= chore.rotation.length) chore.rotatingIndex = Math.max(0, chore.rotation.length - 1);
						return chore.rotation.length > 0;
					}
					return true;
				});
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				res.json({ success: true });
			} catch (error) {
				logger.error(`Error deleting person: ${error}`);
				res.status(500).json(apiErr("Failed to delete person"));
			}
		},
		postChore: (req, res) => {
			try {
				const { name, type, assignedTo, rotation, deadline, skipDays, skipDayVisibility } = req.body;
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				const newChore = {
					id: generateUUID(),
					name: name?.trim() || "",
					type,
					deadline: deadline?.trim(),
					skipDays: skipDays || [],
					skipDayVisibility: skipDayVisibility || SkipDayVisibility.SHOW_IF_OVERDUE,
					caughtUp: true,
					completedToday: false
				};
				if (type === "personal") newChore.assignedTo = assignedTo;
				else if (type === "rotating") {
					newChore.rotation = rotation;
					newChore.rotatingIndex = 0;
				}
				const validation = validateChore(newChore, choreData.people);
				if (!validation.valid) {
					res.status(400).json(apiErr(validation.error));
					return;
				}
				choreData.chores.push(newChore);
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				res.json(newChore);
			} catch (error) {
				logger.error(`Error adding chore: ${error}`);
				res.status(500).json(apiErr("Failed to add chore"));
			}
		},
		putChore: (req, res) => {
			try {
				const { id } = req.params;
				const { name, type, assignedTo, rotation, deadline, skipDays, skipDayVisibility } = req.body;
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				const chore = choreData.chores.find((c) => c.id === id);
				if (!chore) {
					res.status(404).json(apiErr("Chore not found"));
					return;
				}
				if (type && type !== chore.type) {
					res.status(400).json(apiErr("Cannot change chore type"));
					return;
				}
				const updatedChore = {
					...chore,
					name: name ? name.trim() : chore.name,
					deadline: deadline ? deadline.trim() : chore.deadline,
					skipDays: skipDays || chore.skipDays,
					skipDayVisibility: skipDayVisibility || chore.skipDayVisibility
				};
				if (chore.type === ChoreType.PERSONAL) updatedChore.assignedTo = assignedTo || chore.assignedTo;
				else if (chore.type === ChoreType.ROTATING) {
					updatedChore.rotation = rotation || chore.rotation;
					updatedChore.rotatingIndex = chore.rotatingIndex ?? 0;
				}
				const validation = validateChore(updatedChore, choreData.people);
				if (!validation.valid) {
					res.status(400).json(apiErr(validation.error));
					return;
				}
				Object.assign(chore, updatedChore);
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				res.json(chore);
			} catch (error) {
				logger.error(`Error updating chore: ${error}`);
				res.status(500).json(apiErr("Failed to update chore"));
			}
		},
		deleteChore: (req, res) => {
			try {
				const { id } = req.params;
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				const choreIndex = choreData.chores.findIndex((c) => c.id === id);
				if (choreIndex === -1) {
					res.status(404).json(apiErr("Chore not found"));
					return;
				}
				choreData.chores.splice(choreIndex, 1);
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				res.json({ success: true });
			} catch (error) {
				logger.error(`Error deleting chore: ${error}`);
				res.status(500).json(apiErr("Failed to delete chore"));
			}
		},
		getBackup: (_req, res) => {
			try {
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				const filename = `family-chores-backup-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
				res.setHeader("Content-Type", "application/json");
				res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
				res.send(JSON.stringify(choreData, null, 2));
			} catch (error) {
				logger.error(`Error creating backup: ${error}`);
				res.status(500).json(apiErr("Failed to create backup"));
			}
		},
		postRestore: (req, res) => {
			try {
				const restoredData = req.body;
				if (!restoredData?.people || !restoredData.chores) {
					res.status(400).json(apiErr("Invalid data format"));
					return;
				}
				if (!Array.isArray(restoredData.people) || !Array.isArray(restoredData.chores)) {
					res.status(400).json(apiErr("Invalid data format"));
					return;
				}
				const validPeople = [];
				for (const person of restoredData.people) {
					const validation = validatePerson(person);
					if (!validation.valid) {
						res.status(400).json(apiErr(`Invalid person data: ${validation.error}`));
						return;
					}
					validPeople.push(person);
				}
				const validChores = [];
				for (const chore of restoredData.chores) {
					const validation = validateChore(chore, validPeople);
					if (!validation.valid) {
						res.status(400).json(apiErr(`Invalid chore data: ${validation.error}`));
						return;
					}
					validChores.push(chore);
				}
				context.setChoreData({
					people: validPeople,
					chores: validChores,
					dailyCompletions: Array.isArray(restoredData.dailyCompletions) ? restoredData.dailyCompletions : [],
					lastResetDate: restoredData.lastResetDate,
					settings: {
						dailyResetTime: restoredData.settings?.dailyResetTime ?? "03:00",
						historyEnabled: restoredData.settings?.historyEnabled ?? true
					}
				});
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, context.getChoreData());
				res.json({
					success: true,
					message: "Data restored successfully"
				});
			} catch (error) {
				logger.error(`Error restoring data: ${error}`);
				res.status(500).json(apiErr("Failed to restore data"));
			}
		},
		postCopyChores: (req, res) => {
			try {
				const { fromPersonId, toPersonId, choreIds } = req.body;
				if (!fromPersonId || !toPersonId || !choreIds) {
					res.status(400).json(apiErr("fromPersonId, toPersonId, and choreIds are required"));
					return;
				}
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				const newChores = [];
				for (const choreId of choreIds) {
					const chore = choreData.chores.find((c) => c.id === choreId);
					if (!chore) {
						logger.warn(`Chore not found: ${choreId}, skipping`);
						continue;
					}
					if (chore.type !== "personal" || chore.assignedTo !== fromPersonId) {
						logger.warn(`Chore ${choreId} is not a personal chore assigned to ${fromPersonId}, skipping`);
						continue;
					}
					const newChore = {
						id: generateUUID(),
						name: chore.name,
						type: ChoreType.PERSONAL,
						assignedTo: toPersonId,
						deadline: chore.deadline,
						skipDays: chore.skipDays,
						skipDayVisibility: chore.skipDayVisibility,
						caughtUp: true,
						completedToday: false
					};
					choreData.chores.push(newChore);
					newChores.push(newChore);
				}
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				res.json(newChores);
			} catch (error) {
				logger.error(`Error copying chores: ${error}`);
				res.status(500).json(apiErr("Failed to copy chores"));
			}
		},
		getHistory: (req, res) => {
			const choreData = context.getChoreData();
			if (!choreData) {
				res.status(500).json(apiErr("No data available"));
				return;
			}
			if (!choreData.settings?.historyEnabled) {
				res.json([]);
				return;
			}
			const personId = req.query?.personId;
			const dailyCompletions = choreData.dailyCompletions || [];
			const sortedCompletions = [...personId ? dailyCompletions.filter((dc) => dc.personId === personId) : dailyCompletions].sort((a, b) => {
				return new Date(b.date).getTime() - new Date(a.date).getTime();
			});
			res.json(sortedCompletions);
		},
		putSettings: (req, res) => {
			try {
				const { dailyResetTime, historyEnabled } = req.body;
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				if (!choreData.settings) choreData.settings = {
					dailyResetTime: "03:00",
					historyEnabled: true
				};
				if (dailyResetTime !== void 0) {
					if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dailyResetTime)) {
						res.status(400).json(apiErr("Invalid time format. Use HH:mm (24-hour format)"));
						return;
					}
					choreData.settings.dailyResetTime = dailyResetTime;
				}
				if (historyEnabled !== void 0) choreData.settings.historyEnabled = historyEnabled;
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				res.json(choreData.settings);
			} catch (error) {
				logger.error(`Error updating settings: ${error}`);
				res.status(500).json(apiErr("Failed to update settings"));
			}
		}
	};
}
var node_helper_default = node_helper.create({
	choreData: null,
	config: null,
	/**
	* MM function: called when the node helper starts
	*/
	start() {
		logger.info(`Starting node helper for MMM-FamilyChores`);
		this.setupAdminRoutes();
	},
	/**
	* MM function: called when a socket notification arrives from the module
	*/
	socketNotificationReceived(notificationIdentifier, payload) {
		logger.debug(`Node helper received: '${notificationIdentifier}'`);
		switch (notificationIdentifier) {
			case SocketNotifications.CONFIG_REQUEST:
				this.config = payload;
				this.loadChoreData();
				break;
			case SocketNotifications.CHORE_TOGGLE:
				this.handleChoreToggle(payload);
				break;
			case SocketNotifications.CHORE_REASSIGN:
				this.handleChoreReassign(payload);
				break;
			case SocketNotifications.CAUGHTUP_RESET:
				this.handleCaughtUpReset(payload);
				break;
			default: logger.warn(`Node helper received unknown notification: '${notificationIdentifier}'`);
		}
	},
	/**
	* Load chore data from file
	*/
	loadChoreData() {
		if (!this.config) {
			logger.error("Config not set, cannot load chore data");
			return;
		}
		const dataPath = node_path.resolve(__dirname, this.config.dataFile || "data.json");
		try {
			if (node_fs.existsSync(dataPath)) {
				const fileContent = node_fs.readFileSync(dataPath, "utf8");
				const rawData = JSON.parse(fileContent);
				const rawPeople = Array.isArray(rawData.people) ? rawData.people : [];
				const validPeople = [];
				for (const person of rawPeople) {
					const result = validatePerson(person);
					if (result.valid) validPeople.push(person);
					else logger.warn(`Skipping invalid person in data file: ${result.error}`);
				}
				const rawChores = Array.isArray(rawData.chores) ? rawData.chores : [];
				const validChores = [];
				for (const chore of rawChores) {
					const result = validateChore(chore, validPeople);
					if (result.valid) validChores.push(chore);
					else logger.warn(`Skipping invalid chore in data file: ${result.error}`);
				}
				this.choreData = {
					people: validPeople,
					chores: validChores,
					dailyCompletions: Array.isArray(rawData.dailyCompletions) ? rawData.dailyCompletions : [],
					lastResetDate: typeof rawData.lastResetDate === "string" ? rawData.lastResetDate : void 0,
					settings: {
						dailyResetTime: rawData.settings?.dailyResetTime ?? "03:00",
						historyEnabled: rawData.settings?.historyEnabled ?? true
					}
				};
				logger.info(`Loaded chore data from ${dataPath}`);
			} else {
				this.choreData = this.createDefaultData();
				this.saveChoreData();
				logger.info(`Created default chore data at ${dataPath}`);
			}
			this.checkAndPerformDailyReset();
			this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
		} catch (error) {
			logger.error(`Error loading chore data: ${error}`);
			this.choreData = this.createDefaultData();
			this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
		}
	},
	saveChoreData() {
		if (!this.config || !this.choreData) {
			logger.error("Config or chore data not set, cannot save");
			return;
		}
		const dataPath = node_path.resolve(__dirname, this.config.dataFile || "data.json");
		try {
			node_fs.writeFileSync(dataPath, JSON.stringify(this.choreData, null, 2), "utf8");
			logger.info(`Saved chore data to ${dataPath}`);
		} catch (error) {
			logger.error(`Error saving chore data: ${error}`);
		}
	},
	/**
	* Create default empty data structure
	*/
	createDefaultData() {
		return {
			people: [],
			chores: [],
			dailyCompletions: [],
			lastResetDate: getLocalDateString(),
			settings: {
				dailyResetTime: "03:00",
				historyEnabled: true
			}
		};
	},
	/**
	* Check if daily reset should be performed and execute if needed
	*/
	checkAndPerformDailyReset() {
		if (!this.choreData) return;
		const todayDateString = getLocalDateString();
		const currentTimeString = getLocalTimeString();
		if (this.choreData.lastResetDate && todayDateString <= this.choreData.lastResetDate) return;
		const dailyResetTime = this.choreData.settings?.dailyResetTime || "03:00";
		if (currentTimeString < dailyResetTime) return;
		logger.info(`Daily reset triggered for ${getLocalDateString()} at ${currentTimeString}, reset time: ${dailyResetTime}`);
		this.transitionChoresForNewDay();
		this.cleanupOldDailyCompletions();
		this.choreData.lastResetDate = getLocalDateString();
		this.saveChoreData();
	},
	/**
	* Transitions chore state for a new day.
	*
	* Updates caughtUp status, clears completedToday, and rotates chores as needed.
	* Does NOT guard against multiple executions in the same day.
	*
	* See {@link checkAndPerformDailyReset} for the guard.
	*/
	transitionChoresForNewDay() {
		if (!this.choreData) return;
		const todayDayName = getLocalDayName();
		const todayDateString = getLocalDateString();
		for (const chore of this.choreData.chores) {
			const isSkipDay = (chore.skipDays ?? []).includes(todayDayName);
			const skipDayVisibility = chore.skipDayVisibility ?? SkipDayVisibility.HIDE;
			if (isSkipDay && skipDayVisibility === SkipDayVisibility.HIDE) {
				chore.caughtUp = chore.completedToday === true;
				continue;
			}
			chore.caughtUp = chore.completedToday === true;
			if (isSkipDay) continue;
			if (!chore.completedToday) this.logIncompleteChore(chore, todayDateString);
			chore.completedToday = false;
			if (chore.caughtUp && chore.type === "rotating") chore.rotatingIndex = ((chore.rotatingIndex ?? 0) + 1) % (chore.rotation ?? []).length;
		}
		logger.info("Daily reset performed - completedToday cleared, caughtUp status updated");
	},
	/**
	* Clean up old daily completion records (older than 14 days)
	*/
	cleanupOldDailyCompletions() {
		if (!this.choreData?.dailyCompletions || !this.choreData.settings?.historyEnabled) return;
		const retentionDays = 14;
		const cutoffDate = /* @__PURE__ */ new Date();
		cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
		const initialCount = this.choreData.dailyCompletions.length;
		this.choreData.dailyCompletions = this.choreData.dailyCompletions.filter((dc) => new Date(dc.date) > cutoffDate);
		if (this.choreData.dailyCompletions.length < initialCount) logger.info(`Cleaned up ${initialCount - this.choreData.dailyCompletions.length} old daily completion records (retention: ${retentionDays} days)`);
	},
	handleChoreToggle(payload) {
		if (!this.choreData) return;
		const chore = this.choreData.chores.find((c) => c.id === payload.choreId);
		if (!chore) {
			logger.error(`Chore not found: ${payload.choreId}`);
			return;
		}
		if (chore.completedToday === true === payload.completed) {
			logger.debug(`Chore ${payload.choreId} is already in desired state, skipping update`);
			return;
		}
		chore.completedToday = payload.completed;
		if (this.choreData.settings?.historyEnabled) {
			let personId;
			if (chore.type === "personal") personId = chore.assignedTo;
			else if (chore.type === "rotating") personId = chore.rotation[chore.rotatingIndex ?? 0];
			const todayDate = getLocalDateString();
			const todayDayName = getLocalDayName();
			const isSkipDay = (chore.skipDays ?? []).includes(todayDayName);
			if (payload.completed && personId) {
				const currentTime = /* @__PURE__ */ new Date();
				const currentTimeString = getLocalTimeString();
				const wasLate = Boolean(chore.deadline && currentTimeString > chore.deadline);
				const wasMyTurn = chore.type === "personal" || chore.type === "rotating" && chore.rotation[chore.rotatingIndex ?? 0] === personId;
				const dailyCompletion = {
					id: generateUUID(),
					date: todayDate,
					personId,
					choreId: chore.id,
					completed: true,
					completedAt: getLocalTimeString(currentTime),
					wasLate,
					wasSkipDay: isSkipDay,
					wasMyTurn
				};
				this.choreData.dailyCompletions.push(dailyCompletion);
			} else if (!payload.completed && personId) {
				const index = this.choreData.dailyCompletions.findIndex((dc) => dc.date === todayDate && dc.personId === personId && dc.choreId === chore.id);
				if (index !== -1) this.choreData.dailyCompletions.splice(index, 1);
			}
		}
		this.saveChoreData();
		const updateResult = {
			choreId: payload.choreId,
			completed: payload.completed
		};
		this.sendSocketNotification?.(SocketNotifications.CHORE_UPDATE_RESULT, updateResult);
		this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
	},
	handleChoreReassign(payload) {
		if (!this.choreData) return;
		if (this.config?.adminPin && payload.pin !== this.config.adminPin) {
			this.sendSocketNotification?.(SocketNotifications.PIN_ERROR, { message: "Invalid PIN" });
			return;
		}
		const chore = this.choreData.chores.find((c) => c.id === payload.choreId);
		if (!chore) {
			logger.error(`Chore not found: ${payload.choreId}`);
			return;
		}
		let currentAssignment;
		if (chore.type === "personal") currentAssignment = chore.assignedTo;
		else if (chore.type === "rotating" && chore.rotation) {
			const currentIndex = chore.rotatingIndex ?? 0;
			currentAssignment = chore.rotation[currentIndex];
		}
		if (currentAssignment === payload.newPersonId) {
			logger.debug(`Chore ${payload.choreId} is already assigned to ${payload.newPersonId}, skipping reassignment`);
			return;
		}
		if (chore.type === "personal") chore.assignedTo = payload.newPersonId;
		else if (chore.type === "rotating" && chore.rotation) {
			const currentIndex = chore.rotation.indexOf(payload.newPersonId);
			if (currentIndex !== -1) chore.rotatingIndex = currentIndex;
		}
		this.saveChoreData();
		const reassignResult = {
			choreId: payload.choreId,
			newPersonId: payload.newPersonId
		};
		this.sendSocketNotification?.(SocketNotifications.CHORE_REASSIGN_RESULT, reassignResult);
		this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
	},
	handleCaughtUpReset(payload) {
		if (!this.choreData) return;
		if (this.config?.adminPin && payload.pin !== this.config.adminPin) {
			this.sendSocketNotification?.(SocketNotifications.PIN_ERROR, { message: "Invalid PIN" });
			return;
		}
		let resetCount = 0;
		for (const chore of this.choreData.chores) {
			let isAssignedToPerson = false;
			if (chore.type === "personal") isAssignedToPerson = chore.assignedTo === payload.personId;
			else if (chore.type === "rotating" && chore.rotation) {
				const currentIndex = chore.rotatingIndex ?? 0;
				isAssignedToPerson = chore.rotation[currentIndex] === payload.personId;
			}
			if (isAssignedToPerson) {
				chore.caughtUp = true;
				resetCount++;
			}
		}
		logger.info(`Reset caughtUp status for person ${payload.personId}, affected ${resetCount} chores`);
		this.saveChoreData();
		const caughtUpResult = {
			personId: payload.personId,
			resetCount
		};
		this.sendSocketNotification?.(SocketNotifications.CAUGHTUP_RESET_RESULT, caughtUpResult);
		this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
	},
	/**
	* Logs an incomplete chore to the daily completion history
	*/
	logIncompleteChore(chore, date) {
		if (!this.choreData?.settings?.historyEnabled) return;
		let personId;
		let wasMyTurn = false;
		if (chore.type === "personal") {
			personId = chore.assignedTo;
			wasMyTurn = true;
		} else {
			personId = (chore.rotation ?? [])[chore.rotatingIndex ?? 0] ?? "";
			wasMyTurn = true;
		}
		if (!personId) return;
		const completion = {
			id: generateUUID(),
			date,
			personId,
			choreId: chore.id,
			completed: false,
			wasLate: false,
			wasSkipDay: false,
			wasMyTurn
		};
		this.choreData.dailyCompletions.push(completion);
	},
	setupAdminRoutes() {
		const handlers = createAdminHandlers({
			getChoreData: () => this.choreData,
			setChoreData: (data) => {
				this.choreData = data;
			},
			saveChoreData: () => this.saveChoreData(),
			sendNotification: (notification, payload) => this.sendSocketNotification?.(notification, payload)
		});
		this.expressApp?.get("/MMM-FamilyChores/data", handlers.getData);
		this.expressApp?.post("/MMM-FamilyChores/people", handlers.postPerson);
		this.expressApp?.put("/MMM-FamilyChores/people/:id", handlers.putPerson);
		this.expressApp?.delete("/MMM-FamilyChores/people/:id", handlers.deletePerson);
		this.expressApp?.post("/MMM-FamilyChores/chores", handlers.postChore);
		this.expressApp?.put("/MMM-FamilyChores/chores/:id", handlers.putChore);
		this.expressApp?.delete("/MMM-FamilyChores/chores/:id", handlers.deleteChore);
		this.expressApp?.get("/MMM-FamilyChores/backup", handlers.getBackup);
		this.expressApp?.post("/MMM-FamilyChores/restore", handlers.postRestore);
		this.expressApp?.post("/MMM-FamilyChores/copy-chores", handlers.postCopyChores);
		this.expressApp?.get("/MMM-FamilyChores/history", handlers.getHistory);
		this.expressApp?.put("/MMM-FamilyChores/settings", handlers.putSettings);
		logger.info("Admin routes configured for MMM-FamilyChores");
	}
});
//#endregion
module.exports = node_helper_default;

//# sourceMappingURL=node_helper.js.map