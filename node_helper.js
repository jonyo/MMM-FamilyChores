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
	CONFIG_RESPONSE: "CONFIG_RESPONSE",
	CHORE_DATA: "CHORE_DATA",
	CHORE_UPDATE_RESULT: "CHORE_UPDATE_RESULT"
};
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
//#region src/types/chore-types.ts
var SkipDayVisibility = /* @__PURE__ */ function(SkipDayVisibility) {
	SkipDayVisibility["HIDE"] = "hide";
	SkipDayVisibility["SHOW_IF_OVERDUE"] = "show-if-overdue";
	SkipDayVisibility["SHOW_ALWAYS"] = "show-always";
	return SkipDayVisibility;
}({});
/**
* Controls how a chore is handled after its deadline
*/
var PostDeadlineVisibility = /* @__PURE__ */ function(PostDeadlineVisibility) {
	PostDeadlineVisibility["SHOW_NORMAL"] = "normal";
	PostDeadlineVisibility["SHOW_OVERDUE"] = "overdue";
	PostDeadlineVisibility["MOVE_TO_EARLIER"] = "earlier";
	return PostDeadlineVisibility;
}({});
/**
* Controls whether a missed chore is shown before its startTime
*/
var BeforeStartTimeVisibility = /* @__PURE__ */ function(BeforeStartTimeVisibility) {
	BeforeStartTimeVisibility["HIDE"] = "hide";
	BeforeStartTimeVisibility["SHOW_IF_OVERDUE"] = "show-if-overdue";
	return BeforeStartTimeVisibility;
}({});
/**
* Controls how a chore that is not caught up is displayed
*/
var NotCaughtUpDisplay = /* @__PURE__ */ function(NotCaughtUpDisplay) {
	NotCaughtUpDisplay["NORMAL"] = "normal";
	NotCaughtUpDisplay["OVERDUE"] = "overdue";
	return NotCaughtUpDisplay;
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
//#region src/backend/data-upgrade.ts
/**
* Data migration helper for loading older versions of data.json.
*
* This module runs on the raw parsed JSON **before** validation. It is additive
* and idempotent: it only fills missing fields with safe defaults and never
* rewrites or removes existing data.
*/
/**
* Upgrade a raw parsed data.json object to the current expected shape.
*
* Missing fields are filled with defaults. Existing values are preserved.
* This function is idempotent: running it on already-upgraded data is a no-op.
*
* @param rawData - The parsed JSON from data.json (type unknown for safety)
* @returns The upgraded data object, still untyped until validation runs
*/
var upgradeData = (rawData) => {
	if (!rawData || typeof rawData !== "object") return {};
	const data = { ...rawData };
	data.chores = (Array.isArray(data.chores) ? data.chores : []).map((chore) => upgradeChore(chore));
	return data;
};
/**
* Upgrade a single raw chore object with default values for missing fields.
*
* @param chore - Raw chore object from data.json
* @returns Upgraded chore object
*/
var upgradeChore = (chore) => {
	if (!chore || typeof chore !== "object") return chore;
	const choreObj = { ...chore };
	if (choreObj.beforeStartTimeVisibility === void 0) choreObj.beforeStartTimeVisibility = BeforeStartTimeVisibility.HIDE;
	if (choreObj.postDeadlineVisibility === void 0) choreObj.postDeadlineVisibility = PostDeadlineVisibility.SHOW_OVERDUE;
	if (choreObj.postDeadlineVisibility === "hide") choreObj.postDeadlineVisibility = PostDeadlineVisibility.MOVE_TO_EARLIER;
	if (choreObj.notCaughtUpDisplay === void 0) choreObj.notCaughtUpDisplay = NotCaughtUpDisplay.OVERDUE;
	return choreObj;
};
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
	if (choreObj.startTime !== void 0) {
		if (typeof choreObj.startTime !== "string") return {
			valid: false,
			error: "Chore startTime must be a string"
		};
		if (!choreObj.startTime.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) return {
			valid: false,
			error: "Chore startTime must be in 24-hour format (e.g., \"08:00\" or \"21:00\")"
		};
	}
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
	if (typeof choreObj.startTime === "string" && typeof choreObj.deadline === "string" && choreObj.startTime >= choreObj.deadline) return {
		valid: false,
		error: "Chore startTime must be before deadline"
	};
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
	if (!choreObj.beforeStartTimeVisibility || typeof choreObj.beforeStartTimeVisibility !== "string") return {
		valid: false,
		error: "Chore must have a beforeStartTimeVisibility"
	};
	if (!Object.values(BeforeStartTimeVisibility).includes(choreObj.beforeStartTimeVisibility)) return {
		valid: false,
		error: "Chore beforeStartTimeVisibility must be \"hide\" or \"show-if-overdue\""
	};
	if (!choreObj.postDeadlineVisibility || typeof choreObj.postDeadlineVisibility !== "string") return {
		valid: false,
		error: "Chore must have a postDeadlineVisibility"
	};
	if (!Object.values(PostDeadlineVisibility).includes(choreObj.postDeadlineVisibility)) return {
		valid: false,
		error: "Chore postDeadlineVisibility must be \"normal\", \"overdue\", or \"earlier\""
	};
	if (!choreObj.notCaughtUpDisplay || typeof choreObj.notCaughtUpDisplay !== "string") return {
		valid: false,
		error: "Chore must have a notCaughtUpDisplay"
	};
	if (!Object.values(NotCaughtUpDisplay).includes(choreObj.notCaughtUpDisplay)) return {
		valid: false,
		error: "Chore notCaughtUpDisplay must be \"normal\" or \"overdue\""
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
var validateSettings = (settings) => {
	if (!settings || typeof settings !== "object") return {
		valid: false,
		error: "Settings must be an object"
	};
	const settingsObj = settings;
	if (typeof settingsObj.historyEnabled !== "boolean") return {
		valid: false,
		error: "Settings must have a historyEnabled boolean"
	};
	if (settingsObj.adminPin !== void 0 && settingsObj.adminPin !== null) {
		if (typeof settingsObj.adminPin !== "string") return {
			valid: false,
			error: "Settings adminPin must be a string or null"
		};
	}
	return { valid: true };
};
var validateDailyCompletion = (completion, chores) => {
	if (!completion || typeof completion !== "object") return {
		valid: false,
		error: "Daily completion must be an object"
	};
	const completionObj = completion;
	if (!completionObj.id || typeof completionObj.id !== "string" || !completionObj.id.trim()) return {
		valid: false,
		error: "Daily completion must have a non-empty id"
	};
	if (!isValidUUID(completionObj.id)) return {
		valid: false,
		error: "Daily completion id must be a valid UUID"
	};
	if (!completionObj.date || typeof completionObj.date !== "string") return {
		valid: false,
		error: "Daily completion must have a date string"
	};
	if (!completionObj.date.match(/^\d{4}-\d{2}-\d{2}$/)) return {
		valid: false,
		error: "Daily completion date must be in YYYY-MM-DD format (e.g., \"2024-01-15\")"
	};
	if (!completionObj.personId || typeof completionObj.personId !== "string" || !completionObj.personId.trim()) return {
		valid: false,
		error: "Daily completion must have a non-empty personId"
	};
	if (!isValidUUID(completionObj.personId)) return {
		valid: false,
		error: "Daily completion personId must be a valid UUID"
	};
	if (!completionObj.choreId || typeof completionObj.choreId !== "string" || !completionObj.choreId.trim()) return {
		valid: false,
		error: "Daily completion must have a non-empty choreId"
	};
	if (!isValidUUID(completionObj.choreId)) return {
		valid: false,
		error: "Daily completion choreId must be a valid UUID"
	};
	if (!chores.some((chore) => chore.id === completionObj.choreId)) return {
		valid: false,
		error: "Daily completion choreId references a non-existent chore (may have been deleted)"
	};
	if (typeof completionObj.completed !== "boolean") return {
		valid: false,
		error: "Daily completion must have a completed boolean"
	};
	if (completionObj.completedAt !== void 0) {
		if (typeof completionObj.completedAt !== "string") return {
			valid: false,
			error: "Daily completion completedAt must be a string"
		};
		if (!completionObj.completedAt.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) return {
			valid: false,
			error: "Daily completion completedAt must be in 24-hour format (e.g., \"12:00\" or \"19:30\")"
		};
	}
	if (typeof completionObj.wasLate !== "boolean") return {
		valid: false,
		error: "Daily completion must have a wasLate boolean"
	};
	return { valid: true };
};
//#endregion
//#region src/backend/admin-routes.ts
/**
* Validate PIN for protected actions. Returns true if allowed, false if blocked (and sends response).
* Checks body first, then query params (for DELETE requests without body).
*/
function validatePin(req, res, context) {
	const adminPin = context.getChoreData()?.settings?.adminPin;
	if (!adminPin) return true;
	const body = req.body;
	const query = req.query;
	if ((body?.pin ?? query?.pin) !== adminPin) {
		res.status(403).json({ error: "Invalid PIN" });
		return false;
	}
	return true;
}
function createAdminHandlers(context) {
	const apiErr = (message) => ({ error: message });
	return {
		getData: (_req, res) => {
			const choreData = context.getChoreData();
			if (!choreData) {
				res.status(500).json(apiErr("No data available"));
				return;
			}
			const data = JSON.parse(JSON.stringify(choreData));
			const settings = data.settings;
			if (settings?.adminPin) settings.adminPin = true;
			res.json(data);
		},
		postPerson: (req, res) => {
			if (!validatePin(req, res, context)) return;
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
				logger.info(`Person added: ${newPerson.name} (${newPerson.id})`);
				res.json(newPerson);
			} catch (error) {
				logger.error(`Error adding person: ${error}`);
				res.status(500).json(apiErr("Failed to add person"));
			}
		},
		putPerson: (req, res) => {
			if (!validatePin(req, res, context)) return;
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
				logger.info(`Person updated: ${updatedPerson.name} (${updatedPerson.id})`);
				res.json(person);
			} catch (error) {
				logger.error(`Error updating person: ${error}`);
				res.status(500).json(apiErr("Failed to update person"));
			}
		},
		deletePerson: (req, res) => {
			if (!validatePin(req, res, context)) return;
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
				logger.info(`Person deleted: ${id}`);
				res.json({ success: true });
			} catch (error) {
				logger.error(`Error deleting person: ${error}`);
				res.status(500).json(apiErr("Failed to delete person"));
			}
		},
		postChore: (req, res) => {
			if (!validatePin(req, res, context)) return;
			try {
				const { name, type, assignedTo, rotation, rotatingIndex, startTime, deadline, skipDays, skipDayVisibility, beforeStartTimeVisibility, postDeadlineVisibility, notCaughtUpDisplay } = req.body;
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				const newChore = {
					id: generateUUID(),
					name: name?.trim() || "",
					type,
					startTime: startTime?.trim(),
					deadline: deadline?.trim(),
					skipDays: skipDays || [],
					skipDayVisibility: skipDayVisibility || SkipDayVisibility.SHOW_IF_OVERDUE,
					beforeStartTimeVisibility: beforeStartTimeVisibility || BeforeStartTimeVisibility.HIDE,
					postDeadlineVisibility: postDeadlineVisibility || PostDeadlineVisibility.SHOW_OVERDUE,
					notCaughtUpDisplay: notCaughtUpDisplay || NotCaughtUpDisplay.OVERDUE,
					caughtUp: true,
					completedToday: false
				};
				if (type === "personal") newChore.assignedTo = assignedTo;
				else if (type === "rotating") {
					newChore.rotation = rotation;
					newChore.rotatingIndex = rotatingIndex ?? 0;
				}
				const validation = validateChore(newChore, choreData.people);
				if (!validation.valid) {
					res.status(400).json(apiErr(validation.error));
					return;
				}
				choreData.chores.push(newChore);
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				logger.info(`Chore added: ${String(newChore.name)} (${String(newChore.id)}, type=${String(newChore.type)})`);
				res.json(newChore);
			} catch (error) {
				logger.error(`Error adding chore: ${error}`);
				res.status(500).json(apiErr("Failed to add chore"));
			}
		},
		putChore: (req, res) => {
			if (!validatePin(req, res, context)) return;
			try {
				const { id } = req.params;
				const { name, type, assignedTo, rotation, rotatingIndex, startTime, deadline, skipDays, skipDayVisibility, beforeStartTimeVisibility, postDeadlineVisibility, notCaughtUpDisplay } = req.body;
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
					startTime: startTime ? startTime.trim() : chore.startTime,
					deadline: deadline ? deadline.trim() : chore.deadline,
					skipDays: skipDays || chore.skipDays,
					skipDayVisibility: skipDayVisibility || chore.skipDayVisibility,
					beforeStartTimeVisibility: beforeStartTimeVisibility || chore.beforeStartTimeVisibility,
					postDeadlineVisibility: postDeadlineVisibility || chore.postDeadlineVisibility,
					notCaughtUpDisplay: notCaughtUpDisplay || chore.notCaughtUpDisplay
				};
				if (chore.type === ChoreType.PERSONAL) updatedChore.assignedTo = assignedTo || chore.assignedTo;
				else if (chore.type === ChoreType.ROTATING) {
					updatedChore.rotation = rotation || chore.rotation;
					updatedChore.rotatingIndex = rotatingIndex !== void 0 ? rotatingIndex : chore.rotatingIndex ?? 0;
				}
				const validation = validateChore(updatedChore, choreData.people);
				if (!validation.valid) {
					res.status(400).json(apiErr(validation.error));
					return;
				}
				Object.assign(chore, updatedChore);
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				logger.info(`Chore updated: ${chore.name} (${chore.id})`);
				res.json(chore);
			} catch (error) {
				logger.error(`Error updating chore: ${error}`);
				res.status(500).json(apiErr("Failed to update chore"));
			}
		},
		deleteChore: (req, res) => {
			if (!validatePin(req, res, context)) return;
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
				logger.info(`Chore deleted: ${id}`);
				res.json({ success: true });
			} catch (error) {
				logger.error(`Error deleting chore: ${error}`);
				res.status(500).json(apiErr("Failed to delete chore"));
			}
		},
		getBackup: (req, res) => {
			if (!validatePin(req, res, context)) return;
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
				logger.info(`Backup downloaded: ${filename}`);
			} catch (error) {
				logger.error(`Error creating backup: ${error}`);
				res.status(500).json(apiErr("Failed to create backup"));
			}
		},
		postRestore: (req, res) => {
			if (!validatePin(req, res, context)) return;
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
				const upgradedData = upgradeData(restoredData);
				const restoredChores = Array.isArray(upgradedData.chores) ? upgradedData.chores : [];
				const restoredPeople = Array.isArray(upgradedData.people) ? upgradedData.people : [];
				const restoredCompletions = Array.isArray(upgradedData.dailyCompletions) ? upgradedData.dailyCompletions : [];
				const validPeople = [];
				for (const person of restoredPeople) {
					const validation = validatePerson(person);
					if (!validation.valid) {
						res.status(400).json(apiErr(`Invalid person data: ${validation.error}`));
						return;
					}
					validPeople.push(person);
				}
				const validChores = [];
				for (const chore of restoredChores) {
					const validation = validateChore(chore, validPeople);
					if (!validation.valid) {
						res.status(400).json(apiErr(`Invalid chore data: ${validation.error}`));
						return;
					}
					validChores.push(chore);
				}
				const rawSettings = upgradedData.settings ?? { historyEnabled: true };
				const settingsValidation = validateSettings(rawSettings);
				if (!settingsValidation.valid) {
					res.status(400).json(apiErr(`Invalid settings: ${settingsValidation.error}`));
					return;
				}
				const retentionDays = 14;
				const cutoffDate = /* @__PURE__ */ new Date();
				cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
				const cutoffDateString = getLocalDateString(cutoffDate);
				const validCompletions = [];
				for (const completion of restoredCompletions) {
					const validation = validateDailyCompletion(completion, validChores);
					if (!validation.valid) {
						logger.warn(`Skipping invalid daily completion in restore data: ${validation.error}`);
						continue;
					}
					const completionObj = completion;
					if (completionObj.date < cutoffDateString) continue;
					validCompletions.push(completionObj);
				}
				context.setChoreData({
					people: validPeople,
					chores: validChores,
					dailyCompletions: validCompletions,
					lastResetDate: typeof upgradedData.lastResetDate === "string" ? upgradedData.lastResetDate : getLocalDateString(),
					settings: rawSettings
				});
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, context.getChoreData());
				logger.info(`Data restored: ${validPeople.length} people, ${validChores.length} chores, ${validCompletions.length} completions`);
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
			if (!validatePin(req, res, context)) return;
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
						startTime: chore.startTime,
						deadline: chore.deadline,
						skipDays: chore.skipDays,
						skipDayVisibility: chore.skipDayVisibility,
						beforeStartTimeVisibility: chore.beforeStartTimeVisibility,
						postDeadlineVisibility: chore.postDeadlineVisibility,
						notCaughtUpDisplay: chore.notCaughtUpDisplay,
						caughtUp: true,
						completedToday: false
					};
					choreData.chores.push(newChore);
					newChores.push(newChore);
				}
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				logger.info(`Chores copied: ${newChores.length} chore(s) from ${fromPersonId} to ${toPersonId}`);
				res.json(newChores);
			} catch (error) {
				logger.error(`Error copying chores: ${error}`);
				res.status(500).json(apiErr("Failed to copy chores"));
			}
		},
		postAdvanceRotations: (req, res) => {
			if (!validatePin(req, res, context)) return;
			try {
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				if (getLocalDateString() > choreData.lastResetDate) {
					res.status(503).json(apiErr("Daily midnight reset is in progress. Please try again in a moment. If this persists you may need to restart MagicMirror."));
					return;
				}
				const rotatingChores = choreData.chores.filter((c) => c.type === ChoreType.ROTATING);
				let advanced = 0;
				for (const chore of rotatingChores) {
					if (chore.type !== ChoreType.ROTATING) continue;
					const rotation = chore.rotation ?? [];
					if (rotation.length < 2) continue;
					chore.rotatingIndex = ((chore.rotatingIndex ?? 0) + 1) % rotation.length;
					chore.completedToday = false;
					chore.caughtUp = true;
					advanced++;
				}
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				logger.info(`Rotations advanced: ${advanced} chore(s)`);
				res.json({
					success: true,
					advanced
				});
			} catch (error) {
				logger.error(`Error advancing rotations: ${error}`);
				res.status(500).json(apiErr("Failed to advance rotations"));
			}
		},
		postResetCaughtUp: (req, res) => {
			if (!validatePin(req, res, context)) return;
			try {
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				let reset = 0;
				for (const chore of choreData.chores) if (!chore.caughtUp) {
					chore.caughtUp = true;
					reset++;
				}
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				logger.info(`Caught up status reset: ${reset} chore(s) updated`);
				res.json({
					success: true,
					reset
				});
			} catch (error) {
				logger.error(`Error resetting caught up status: ${error}`);
				res.status(500).json(apiErr("Failed to reset caught up status"));
			}
		},
		putSettings: (req, res) => {
			if (!validatePin(req, res, context)) return;
			try {
				const { historyEnabled, adminPin } = req.body;
				const choreData = context.getChoreData();
				if (!choreData) {
					res.status(500).json(apiErr("No data available"));
					return;
				}
				if (!choreData.settings) choreData.settings = { historyEnabled: true };
				if (historyEnabled !== void 0) choreData.settings.historyEnabled = historyEnabled;
				if (adminPin !== void 0) choreData.settings.adminPin = adminPin || null;
				context.saveChoreData();
				context.sendNotification(SocketNotifications.CHORE_DATA, choreData);
				logger.info(`Settings updated: historyEnabled=${choreData.settings.historyEnabled}, adminPin=${choreData.settings.adminPin ? "set" : "unset"}`);
				const responseSettings = { ...choreData.settings };
				if (responseSettings.adminPin) responseSettings.adminPin = true;
				res.json(responseSettings);
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
	dailyResetTimer: null,
	/**
	* MM function: called when the node helper starts
	*/
	start() {
		logger.info(`Starting node helper for MMM-FamilyChores`);
		this.setupAdminRoutes();
		this.dailyResetTimer = setInterval(() => {
			const previousResetDate = this.choreData?.lastResetDate;
			this.checkAndPerformDailyReset();
			if (this.choreData && this.choreData.lastResetDate !== previousResetDate) this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
		}, 6e4);
	},
	/**
	* MM function: called when the node helper stops
	*/
	stop() {
		if (this.dailyResetTimer) {
			clearInterval(this.dailyResetTimer);
			this.dailyResetTimer = null;
		}
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
		const dataPath = node_path.resolve(__dirname, "data.json");
		try {
			if (node_fs.existsSync(dataPath)) {
				const fileContent = node_fs.readFileSync(dataPath, "utf8");
				const upgradedData = upgradeData(JSON.parse(fileContent));
				const rawPeople = Array.isArray(upgradedData.people) ? upgradedData.people : [];
				const validPeople = [];
				for (const person of rawPeople) {
					const result = validatePerson(person);
					if (result.valid) validPeople.push(person);
					else logger.warn(`Skipping invalid person in data file: ${result.error}`);
				}
				const rawChores = Array.isArray(upgradedData.chores) ? upgradedData.chores : [];
				const validChores = [];
				for (const chore of rawChores) {
					const result = validateChore(chore, validPeople);
					if (result.valid) validChores.push(chore);
					else logger.warn(`Skipping invalid chore in data file: ${result.error}`);
				}
				const rawSettings = upgradedData.settings;
				const settingsResult = validateSettings(rawSettings);
				let settings;
				if (settingsResult.valid) settings = rawSettings;
				else {
					logger.warn(`Invalid settings in data file, using defaults: ${settingsResult.error}`);
					settings = { historyEnabled: true };
				}
				const rawCompletions = Array.isArray(upgradedData.dailyCompletions) ? upgradedData.dailyCompletions : [];
				const validCompletions = [];
				for (const completion of rawCompletions) {
					const result = validateDailyCompletion(completion, validChores);
					if (result.valid) validCompletions.push(completion);
					else logger.warn(`Skipping invalid daily completion in data file: ${result.error}`);
				}
				this.choreData = {
					people: validPeople,
					chores: validChores,
					dailyCompletions: validCompletions,
					lastResetDate: typeof upgradedData.lastResetDate === "string" ? upgradedData.lastResetDate : getLocalDateString(),
					settings
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
		const dataPath = node_path.resolve(__dirname, "data.json");
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
			settings: { historyEnabled: true }
		};
	},
	/**
	* Check if daily reset should be performed and execute if needed
	*/
	checkAndPerformDailyReset() {
		if (!this.choreData) return;
		const todayDateString = getLocalDateString();
		if (todayDateString <= this.choreData.lastResetDate) return;
		logger.info(`Daily reset triggered for ${todayDateString}`);
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
		const yesterday = /* @__PURE__ */ new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayDateString = getLocalDateString(yesterday);
		const yesterdayDayName = getLocalDayName(yesterday);
		for (const chore of this.choreData.chores) {
			if (!(chore.skipDays ?? []).includes(yesterdayDayName) && !chore.completedToday) this.logIncompleteChore(chore, yesterdayDateString);
			chore.caughtUp = chore.completedToday === true;
		}
		for (const chore of this.choreData.chores) {
			if ((chore.skipDays ?? []).includes(todayDayName)) continue;
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
		const cutoffDateString = getLocalDateString(cutoffDate);
		const initialCount = this.choreData.dailyCompletions.length;
		this.choreData.dailyCompletions = this.choreData.dailyCompletions.filter((dc) => dc.date >= cutoffDateString);
		if (this.choreData.dailyCompletions.length < initialCount) logger.info(`Cleaned up ${initialCount - this.choreData.dailyCompletions.length} old daily completion records (retention: ${retentionDays} days)`);
	},
	handleChoreToggle(payload) {
		logger.info(`CHORE_TOGGLE received: choreId=${payload.choreId}, completed=${payload.completed}`);
		if (!this.choreData) {
			logger.error("choreData is null, cannot handle toggle");
			return;
		}
		if (getLocalDateString() > this.choreData.lastResetDate) {
			logger.warn("Cannot toggle chore, daily midnight reset is in progress. If this persists you may need to restart MagicMirror.");
			return;
		}
		const chore = this.choreData.chores.find((c) => c.id === payload.choreId);
		if (!chore) {
			logger.error(`Chore not found: ${payload.choreId}`);
			return;
		}
		if (chore.completedToday === true === payload.completed) {
			logger.debug(`Chore ${payload.choreId} is already in desired state, skipping update`);
			return;
		}
		logger.info(`Setting chore ${payload.choreId} completedToday to ${payload.completed}`);
		chore.completedToday = payload.completed;
		this.trackDailyCompletion(chore, payload.completed);
		this.saveChoreData();
		const updateResult = {
			choreId: payload.choreId,
			completed: payload.completed
		};
		this.sendSocketNotification?.(SocketNotifications.CHORE_UPDATE_RESULT, updateResult);
		this.sendSocketNotification?.(SocketNotifications.CHORE_DATA, this.choreData);
	},
	/**
	* Track daily completion in history if enabled
	*/
	trackDailyCompletion(chore, completed) {
		if (!this.choreData?.settings?.historyEnabled) {
			logger.warn(`Skipping daily completion save for chore ${chore.id}, history is disabled`);
			return;
		}
		let personId;
		if (chore.type === "personal") personId = chore.assignedTo;
		else if (chore.type === "rotating") personId = chore.rotation[chore.rotatingIndex ?? 0];
		const todayDate = getLocalDateString();
		if (completed && personId) {
			const currentTime = /* @__PURE__ */ new Date();
			const currentTimeString = getLocalTimeString();
			const wasLate = !!chore.deadline && currentTimeString > chore.deadline;
			const dailyCompletion = {
				id: generateUUID(),
				date: todayDate,
				personId,
				choreId: chore.id,
				completed: true,
				completedAt: getLocalTimeString(currentTime),
				wasLate
			};
			this.choreData.dailyCompletions.push(dailyCompletion);
			logger.info(`Daily completion added for chore ${chore.id}, person ${personId}. Total completions: ${this.choreData.dailyCompletions.length}`);
		} else if (!completed && personId) {
			const index = this.choreData.dailyCompletions.findIndex((dc) => dc.date === todayDate && dc.personId === personId && dc.choreId === chore.id);
			if (index !== -1) {
				this.choreData.dailyCompletions.splice(index, 1);
				logger.info(`Daily completion removed for chore ${chore.id}, person ${personId}. Total completions: ${this.choreData.dailyCompletions.length}`);
			} else logger.warn(`No daily completion found to remove for chore ${chore.id}, person ${personId}, date ${todayDate}`);
		}
	},
	/**
	* Logs an incomplete chore to the daily completion history
	*/
	logIncompleteChore(chore, date) {
		if (!this.choreData?.settings?.historyEnabled) return;
		let personId;
		if (chore.type === "personal") personId = chore.assignedTo;
		else personId = (chore.rotation ?? [])[chore.rotatingIndex ?? 0] ?? "";
		if (!personId) return;
		const completion = {
			id: generateUUID(),
			date,
			personId,
			choreId: chore.id,
			completed: false,
			wasLate: false
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
		this.expressApp?.put("/MMM-FamilyChores/settings", handlers.putSettings);
		this.expressApp?.post("/MMM-FamilyChores/advance-rotations", handlers.postAdvanceRotations);
		this.expressApp?.post("/MMM-FamilyChores/reset-caught-up", handlers.postResetCaughtUp);
		logger.info("Admin routes configured for MMM-FamilyChores");
	}
});
//#endregion
module.exports = node_helper_default;
