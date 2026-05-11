import _ from "node_helper";
var f = Object.create, c = Object.defineProperty, g = Object.getOwnPropertyDescriptor, C = Object.getOwnPropertyNames, D = Object.getPrototypeOf, E = Object.prototype.hasOwnProperty, O = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), R = (e, t, r, i) => {
  if (t && typeof t == "object" || typeof t == "function")
    for (var h = C(t), s = 0, d = h.length, a; s < d; s++)
      a = h[s], !E.call(e, a) && a !== r && c(e, a, {
        get: ((l) => t[l]).bind(null, a),
        enumerable: !(i = g(t, a)) || i.enumerable
      });
  return e;
}, u = (e, t, r) => (r = e != null ? f(D(e)) : {}, R(t || !e || !e.__esModule ? c(r, "default", {
  value: e,
  enumerable: !0
}) : r, e)), I = /* @__PURE__ */ O(((e, t) => {
  t.exports = {};
})), n = /* @__PURE__ */ u(I(), 1), o = {
  CONFIG_REQUEST: "CONFIG_REQUEST",
  CHORE_TOGGLE: "CHORE_TOGGLE",
  CHORE_REASSIGN: "CHORE_REASSIGN",
  CHORE_UNDO: "CHORE_UNDO",
  CONFIG_RESPONSE: "CONFIG_RESPONSE",
  CHORE_DATA: "CHORE_DATA",
  CHORE_UPDATE_RESULT: "CHORE_UPDATE_RESULT",
  CHORE_REASSIGN_RESULT: "CHORE_REASSIGN_RESULT",
  CHORE_UNDO_RESULT: "CHORE_UNDO_RESULT",
  PIN_ERROR: "PIN_ERROR"
}, p = _.create({
  choreData: null,
  config: null,
  start() {
    Log.info("Starting node helper for MMM-FamilyChores");
  },
  socketNotificationReceived(e, t) {
    switch (Log.debug(`Node helper received: '${e}'`), e) {
      case o.CONFIG_REQUEST:
        this.config = t, this.loadChoreData();
        break;
      case o.CHORE_TOGGLE:
        this.handleChoreToggle(t);
        break;
      case o.CHORE_REASSIGN:
        this.handleChoreReassign(t);
        break;
      case o.CHORE_UNDO:
        this.handleChoreUndo(t);
        break;
      default:
        Log.warn(`Node helper received unknown notification: '${e}'`);
    }
  },
  loadChoreData() {
    if (!this.config) {
      Log.error("Config not set, cannot load chore data");
      return;
    }
    const e = n.resolve(__dirname, "..", "..", this.config.dataFile || "data.json");
    try {
      if (n.existsSync(e)) {
        const t = n.readFileSync(e, "utf8");
        this.choreData = JSON.parse(t), Log.info(`Loaded chore data from ${e}`);
      } else
        this.choreData = this.createDefaultData(), this.saveChoreData(), Log.info(`Created default chore data at ${e}`);
      this.sendSocketNotification(o.CHORE_DATA, this.choreData);
    } catch (t) {
      Log.error(`Error loading chore data: ${t}`), this.choreData = this.createDefaultData(), this.sendSocketNotification(o.CHORE_DATA, this.choreData);
    }
  },
  saveChoreData() {
    if (!this.config || !this.choreData) {
      Log.error("Config or chore data not set, cannot save");
      return;
    }
    const e = n.resolve(__dirname, "..", "..", this.config.dataFile || "data.json");
    try {
      n.writeFileSync(e, JSON.stringify(this.choreData, null, 2), "utf8"), Log.info(`Saved chore data to ${e}`);
    } catch (t) {
      Log.error(`Error saving chore data: ${t}`);
    }
  },
  createDefaultData() {
    return {
      people: [
        {
          id: "1",
          name: "Alice",
          color: "#FF6B6B"
        },
        {
          id: "2",
          name: "Bob",
          color: "#4ECDC4"
        },
        {
          id: "3",
          name: "Charlie",
          color: "#45B7D1"
        },
        {
          id: "4",
          name: "Diana",
          color: "#96CEB4"
        },
        {
          id: "5",
          name: "Evan",
          color: "#FFEAA7"
        }
      ],
      chores: [
        {
          id: "1",
          name: "Take out trash",
          type: "rotating",
          rotation: [
            "1",
            "2",
            "3",
            "4",
            "5"
          ]
        },
        {
          id: "2",
          name: "Clean kitchen",
          type: "rotating",
          rotation: [
            "1",
            "2",
            "3",
            "4",
            "5"
          ]
        },
        {
          id: "3",
          name: "Make bed",
          type: "personal",
          assignedTo: "1"
        },
        {
          id: "4",
          name: "Do homework",
          type: "personal",
          assignedTo: "3"
        }
      ],
      state: {
        rotatingIndex: {
          1: 0,
          2: 0
        },
        lastCompleted: {},
        previousLastCompleted: {},
        completedToday: []
      }
    };
  },
  handleChoreToggle(e) {
    if (!(!this.choreData || !this.config)) {
      if (!this.choreData.chores.find((t) => t.id === e.choreId)) {
        Log.error(`Chore not found: ${e.choreId}`);
        return;
      }
      if (this.choreData.state.completedToday.includes(e.choreId) === e.completed) {
        Log.debug(`Chore ${e.choreId} is already in desired state, skipping update`);
        return;
      }
      if (e.completed) {
        const t = this.choreData.state.lastCompleted[e.choreId];
        t && (this.choreData.state.previousLastCompleted[e.choreId] = t), this.choreData.state.completedToday.push(e.choreId), this.choreData.state.lastCompleted[e.choreId] = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      } else {
        this.choreData.state.completedToday = this.choreData.state.completedToday.filter((r) => r !== e.choreId);
        const t = this.choreData.state.previousLastCompleted[e.choreId];
        t ? this.choreData.state.lastCompleted[e.choreId] = t : delete this.choreData.state.lastCompleted[e.choreId];
      }
      this.saveChoreData(), this.sendSocketNotification(o.CHORE_UPDATE_RESULT, {
        choreId: e.choreId,
        completed: e.completed
      }), this.sendSocketNotification(o.CHORE_DATA, this.choreData);
    }
  },
  handleChoreReassign(e) {
    if (!this.choreData || !this.config) return;
    if (this.config.adminPin && e.pin !== this.config.adminPin) {
      this.sendSocketNotification(o.PIN_ERROR, { message: "Invalid PIN" });
      return;
    }
    const t = this.choreData.chores.find((i) => i.id === e.choreId);
    if (!t) {
      Log.error(`Chore not found: ${e.choreId}`);
      return;
    }
    let r;
    if (t.type === "personal") r = t.assignedTo;
    else if (t.type === "rotating" && t.rotation) {
      const i = this.choreData.state.rotatingIndex[e.choreId] || 0;
      r = t.rotation[i];
    }
    if (r === e.newPersonId) {
      Log.debug(`Chore ${e.choreId} is already assigned to ${e.newPersonId}, skipping reassignment`);
      return;
    }
    if (t.type === "personal") t.assignedTo = e.newPersonId;
    else if (t.type === "rotating" && t.rotation) {
      const i = t.rotation.indexOf(e.newPersonId);
      i !== -1 && (this.choreData.state.rotatingIndex[e.choreId] = i);
    }
    this.saveChoreData(), this.sendSocketNotification(o.CHORE_REASSIGN_RESULT, {
      choreId: e.choreId,
      newPersonId: e.newPersonId
    }), this.sendSocketNotification(o.CHORE_DATA, this.choreData);
  },
  handleChoreUndo(e) {
    if (!(!this.choreData || !this.config)) {
      if (this.config.adminPin && e.pin !== this.config.adminPin) {
        this.sendSocketNotification(o.PIN_ERROR, { message: "Invalid PIN" });
        return;
      }
      if (!this.choreData.state.completedToday.includes(e.choreId)) {
        Log.debug(`Chore ${e.choreId} is already not completed today, skipping undo`);
        return;
      }
      this.choreData.state.completedToday = this.choreData.state.completedToday.filter((t) => t !== e.choreId), delete this.choreData.state.lastCompleted[e.choreId], this.saveChoreData(), this.sendSocketNotification(o.CHORE_UNDO_RESULT, { choreId: e.choreId }), this.sendSocketNotification(o.CHORE_DATA, this.choreData);
    }
  }
});
export {
  p as default
};

//# sourceMappingURL=node_helper.js.map