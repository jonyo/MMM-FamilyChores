// Automatically built — do not edit directly. Edit src/admin/admin.tsx and run pnpm build:admin.
(function() {
	//#region node_modules/.pnpm/solid-js@1.9.12/node_modules/solid-js/dist/solid.js
	var sharedConfig = {
		context: void 0,
		registry: void 0,
		effects: void 0,
		done: false,
		getContextId() {
			return getContextId(this.context.count);
		},
		getNextContextId() {
			return getContextId(this.context.count++);
		}
	};
	function getContextId(count) {
		const num = String(count), len = num.length - 1;
		return sharedConfig.context.id + (len ? String.fromCharCode(96 + len) : "") + num;
	}
	function setHydrateContext(context) {
		sharedConfig.context = context;
	}
	function nextHydrateContext() {
		return {
			...sharedConfig.context,
			id: sharedConfig.getNextContextId(),
			count: 0
		};
	}
	var equalFn = (a, b) => a === b;
	var signalOptions = { equals: equalFn };
	var ERROR = null;
	var runEffects = runQueue;
	var STALE = 1;
	var PENDING = 2;
	var UNOWNED = {
		owned: null,
		cleanups: null,
		context: null,
		owner: null
	};
	var Owner = null;
	var Transition = null;
	var Scheduler = null;
	var ExternalSourceConfig = null;
	var Listener = null;
	var Updates = null;
	var Effects = null;
	var ExecCount = 0;
	function createRoot(fn, detachedOwner) {
		const listener = Listener, owner = Owner, unowned = fn.length === 0, current = detachedOwner === void 0 ? owner : detachedOwner, root = unowned ? UNOWNED : {
			owned: null,
			cleanups: null,
			context: current ? current.context : null,
			owner: current
		}, updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root)));
		Owner = root;
		Listener = null;
		try {
			return runUpdates(updateFn, true);
		} finally {
			Listener = listener;
			Owner = owner;
		}
	}
	function createSignal(value, options) {
		options = options ? Object.assign({}, signalOptions, options) : signalOptions;
		const s = {
			value,
			observers: null,
			observerSlots: null,
			comparator: options.equals || void 0
		};
		const setter = (value) => {
			if (typeof value === "function") if (Transition && Transition.running && Transition.sources.has(s)) value = value(s.tValue);
			else value = value(s.value);
			return writeSignal(s, value);
		};
		return [readSignal.bind(s), setter];
	}
	function createRenderEffect(fn, value, options) {
		const c = createComputation(fn, value, false, STALE);
		if (Scheduler && Transition && Transition.running) Updates.push(c);
		else updateComputation(c);
	}
	function createEffect(fn, value, options) {
		runEffects = runUserEffects;
		const c = createComputation(fn, value, false, STALE), s = SuspenseContext && useContext(SuspenseContext);
		if (s) c.suspense = s;
		if (!options || !options.render) c.user = true;
		Effects ? Effects.push(c) : updateComputation(c);
	}
	function createMemo(fn, value, options) {
		options = options ? Object.assign({}, signalOptions, options) : signalOptions;
		const c = createComputation(fn, value, true, 0);
		c.observers = null;
		c.observerSlots = null;
		c.comparator = options.equals || void 0;
		if (Scheduler && Transition && Transition.running) {
			c.tState = STALE;
			Updates.push(c);
		} else updateComputation(c);
		return readSignal.bind(c);
	}
	function untrack(fn) {
		if (!ExternalSourceConfig && Listener === null) return fn();
		const listener = Listener;
		Listener = null;
		try {
			if (ExternalSourceConfig) return ExternalSourceConfig.untrack(fn);
			return fn();
		} finally {
			Listener = listener;
		}
	}
	function onMount(fn) {
		createEffect(() => untrack(fn));
	}
	function onCleanup(fn) {
		if (Owner === null);
		else if (Owner.cleanups === null) Owner.cleanups = [fn];
		else Owner.cleanups.push(fn);
		return fn;
	}
	function startTransition(fn) {
		if (Transition && Transition.running) {
			fn();
			return Transition.done;
		}
		const l = Listener;
		const o = Owner;
		return Promise.resolve().then(() => {
			Listener = l;
			Owner = o;
			let t;
			if (Scheduler || SuspenseContext) {
				t = Transition || (Transition = {
					sources: /* @__PURE__ */ new Set(),
					effects: [],
					promises: /* @__PURE__ */ new Set(),
					disposed: /* @__PURE__ */ new Set(),
					queue: /* @__PURE__ */ new Set(),
					running: true
				});
				t.done || (t.done = new Promise((res) => t.resolve = res));
				t.running = true;
			}
			runUpdates(fn, false);
			Listener = Owner = null;
			return t ? t.done : void 0;
		});
	}
	var [transPending, setTransPending] = /* @__PURE__ */ createSignal(false);
	function useContext(context) {
		let value;
		return Owner && Owner.context && (value = Owner.context[context.id]) !== void 0 ? value : context.defaultValue;
	}
	var SuspenseContext;
	function readSignal() {
		const runningTransition = Transition && Transition.running;
		if (this.sources && (runningTransition ? this.tState : this.state)) if ((runningTransition ? this.tState : this.state) === STALE) updateComputation(this);
		else {
			const updates = Updates;
			Updates = null;
			runUpdates(() => lookUpstream(this), false);
			Updates = updates;
		}
		if (Listener) {
			const sSlot = this.observers ? this.observers.length : 0;
			if (!Listener.sources) {
				Listener.sources = [this];
				Listener.sourceSlots = [sSlot];
			} else {
				Listener.sources.push(this);
				Listener.sourceSlots.push(sSlot);
			}
			if (!this.observers) {
				this.observers = [Listener];
				this.observerSlots = [Listener.sources.length - 1];
			} else {
				this.observers.push(Listener);
				this.observerSlots.push(Listener.sources.length - 1);
			}
		}
		if (runningTransition && Transition.sources.has(this)) return this.tValue;
		return this.value;
	}
	function writeSignal(node, value, isComp) {
		let current = Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value;
		if (!node.comparator || !node.comparator(current, value)) {
			if (Transition) {
				const TransitionRunning = Transition.running;
				if (TransitionRunning || !isComp && Transition.sources.has(node)) {
					Transition.sources.add(node);
					node.tValue = value;
				}
				if (!TransitionRunning) node.value = value;
			} else node.value = value;
			if (node.observers && node.observers.length) runUpdates(() => {
				for (let i = 0; i < node.observers.length; i += 1) {
					const o = node.observers[i];
					const TransitionRunning = Transition && Transition.running;
					if (TransitionRunning && Transition.disposed.has(o)) continue;
					if (TransitionRunning ? !o.tState : !o.state) {
						if (o.pure) Updates.push(o);
						else Effects.push(o);
						if (o.observers) markDownstream(o);
					}
					if (!TransitionRunning) o.state = STALE;
					else o.tState = STALE;
				}
				if (Updates.length > 1e6) {
					Updates = [];
					throw new Error();
				}
			}, false);
		}
		return value;
	}
	function updateComputation(node) {
		if (!node.fn) return;
		cleanNode(node);
		const time = ExecCount;
		runComputation(node, Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value, time);
		if (Transition && !Transition.running && Transition.sources.has(node)) queueMicrotask(() => {
			runUpdates(() => {
				Transition && (Transition.running = true);
				Listener = Owner = node;
				runComputation(node, node.tValue, time);
				Listener = Owner = null;
			}, false);
		});
	}
	function runComputation(node, value, time) {
		let nextValue;
		const owner = Owner, listener = Listener;
		Listener = Owner = node;
		try {
			nextValue = node.fn(value);
		} catch (err) {
			if (node.pure) if (Transition && Transition.running) {
				node.tState = STALE;
				node.tOwned && node.tOwned.forEach(cleanNode);
				node.tOwned = void 0;
			} else {
				node.state = STALE;
				node.owned && node.owned.forEach(cleanNode);
				node.owned = null;
			}
			node.updatedAt = time + 1;
			return handleError(err);
		} finally {
			Listener = listener;
			Owner = owner;
		}
		if (!node.updatedAt || node.updatedAt <= time) {
			if (node.updatedAt != null && "observers" in node) writeSignal(node, nextValue, true);
			else if (Transition && Transition.running && node.pure) {
				if (!Transition.sources.has(node)) node.value = nextValue;
				Transition.sources.add(node);
				node.tValue = nextValue;
			} else node.value = nextValue;
			node.updatedAt = time;
		}
	}
	function createComputation(fn, init, pure, state = STALE, options) {
		const c = {
			fn,
			state,
			updatedAt: null,
			owned: null,
			sources: null,
			sourceSlots: null,
			cleanups: null,
			value: init,
			owner: Owner,
			context: Owner ? Owner.context : null,
			pure
		};
		if (Transition && Transition.running) {
			c.state = 0;
			c.tState = state;
		}
		if (Owner === null);
		else if (Owner !== UNOWNED) if (Transition && Transition.running && Owner.pure) if (!Owner.tOwned) Owner.tOwned = [c];
		else Owner.tOwned.push(c);
		else if (!Owner.owned) Owner.owned = [c];
		else Owner.owned.push(c);
		if (ExternalSourceConfig && c.fn) {
			const sourceFn = c.fn;
			const [track, trigger] = createSignal(void 0, { equals: false });
			const ordinary = ExternalSourceConfig.factory(sourceFn, trigger);
			onCleanup(() => ordinary.dispose());
			let inTransition;
			const triggerInTransition = () => startTransition(trigger).then(() => {
				if (inTransition) {
					inTransition.dispose();
					inTransition = void 0;
				}
			});
			c.fn = (x) => {
				track();
				if (Transition && Transition.running) {
					if (!inTransition) inTransition = ExternalSourceConfig.factory(sourceFn, triggerInTransition);
					return inTransition.track(x);
				}
				return ordinary.track(x);
			};
		}
		return c;
	}
	function runTop(node) {
		const runningTransition = Transition && Transition.running;
		if ((runningTransition ? node.tState : node.state) === 0) return;
		if ((runningTransition ? node.tState : node.state) === PENDING) return lookUpstream(node);
		if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
		const ancestors = [node];
		while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
			if (runningTransition && Transition.disposed.has(node)) return;
			if (runningTransition ? node.tState : node.state) ancestors.push(node);
		}
		for (let i = ancestors.length - 1; i >= 0; i--) {
			node = ancestors[i];
			if (runningTransition) {
				let top = node, prev = ancestors[i + 1];
				while ((top = top.owner) && top !== prev) if (Transition.disposed.has(top)) return;
			}
			if ((runningTransition ? node.tState : node.state) === STALE) updateComputation(node);
			else if ((runningTransition ? node.tState : node.state) === PENDING) {
				const updates = Updates;
				Updates = null;
				runUpdates(() => lookUpstream(node, ancestors[0]), false);
				Updates = updates;
			}
		}
	}
	function runUpdates(fn, init) {
		if (Updates) return fn();
		let wait = false;
		if (!init) Updates = [];
		if (Effects) wait = true;
		else Effects = [];
		ExecCount++;
		try {
			const res = fn();
			completeUpdates(wait);
			return res;
		} catch (err) {
			if (!wait) Effects = null;
			Updates = null;
			handleError(err);
		}
	}
	function completeUpdates(wait) {
		if (Updates) {
			if (Scheduler && Transition && Transition.running) scheduleQueue(Updates);
			else runQueue(Updates);
			Updates = null;
		}
		if (wait) return;
		let res;
		if (Transition) {
			if (!Transition.promises.size && !Transition.queue.size) {
				const sources = Transition.sources;
				const disposed = Transition.disposed;
				Effects.push.apply(Effects, Transition.effects);
				res = Transition.resolve;
				for (const e of Effects) {
					"tState" in e && (e.state = e.tState);
					delete e.tState;
				}
				Transition = null;
				runUpdates(() => {
					for (const d of disposed) cleanNode(d);
					for (const v of sources) {
						v.value = v.tValue;
						if (v.owned) for (let i = 0, len = v.owned.length; i < len; i++) cleanNode(v.owned[i]);
						if (v.tOwned) v.owned = v.tOwned;
						delete v.tValue;
						delete v.tOwned;
						v.tState = 0;
					}
					setTransPending(false);
				}, false);
			} else if (Transition.running) {
				Transition.running = false;
				Transition.effects.push.apply(Transition.effects, Effects);
				Effects = null;
				setTransPending(true);
				return;
			}
		}
		const e = Effects;
		Effects = null;
		if (e.length) runUpdates(() => runEffects(e), false);
		if (res) res();
	}
	function runQueue(queue) {
		for (let i = 0; i < queue.length; i++) runTop(queue[i]);
	}
	function scheduleQueue(queue) {
		for (let i = 0; i < queue.length; i++) {
			const item = queue[i];
			const tasks = Transition.queue;
			if (!tasks.has(item)) {
				tasks.add(item);
				Scheduler(() => {
					tasks.delete(item);
					runUpdates(() => {
						Transition.running = true;
						runTop(item);
					}, false);
					Transition && (Transition.running = false);
				});
			}
		}
	}
	function runUserEffects(queue) {
		let i, userLength = 0;
		for (i = 0; i < queue.length; i++) {
			const e = queue[i];
			if (!e.user) runTop(e);
			else queue[userLength++] = e;
		}
		if (sharedConfig.context) {
			if (sharedConfig.count) {
				sharedConfig.effects || (sharedConfig.effects = []);
				sharedConfig.effects.push(...queue.slice(0, userLength));
				return;
			}
			setHydrateContext();
		}
		if (sharedConfig.effects && (sharedConfig.done || !sharedConfig.count)) {
			queue = [...sharedConfig.effects, ...queue];
			userLength += sharedConfig.effects.length;
			delete sharedConfig.effects;
		}
		for (i = 0; i < userLength; i++) runTop(queue[i]);
	}
	function lookUpstream(node, ignore) {
		const runningTransition = Transition && Transition.running;
		if (runningTransition) node.tState = 0;
		else node.state = 0;
		for (let i = 0; i < node.sources.length; i += 1) {
			const source = node.sources[i];
			if (source.sources) {
				const state = runningTransition ? source.tState : source.state;
				if (state === STALE) {
					if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount)) runTop(source);
				} else if (state === PENDING) lookUpstream(source, ignore);
			}
		}
	}
	function markDownstream(node) {
		const runningTransition = Transition && Transition.running;
		for (let i = 0; i < node.observers.length; i += 1) {
			const o = node.observers[i];
			if (runningTransition ? !o.tState : !o.state) {
				if (runningTransition) o.tState = PENDING;
				else o.state = PENDING;
				if (o.pure) Updates.push(o);
				else Effects.push(o);
				o.observers && markDownstream(o);
			}
		}
	}
	function cleanNode(node) {
		let i;
		if (node.sources) while (node.sources.length) {
			const source = node.sources.pop(), index = node.sourceSlots.pop(), obs = source.observers;
			if (obs && obs.length) {
				const n = obs.pop(), s = source.observerSlots.pop();
				if (index < obs.length) {
					n.sourceSlots[s] = index;
					obs[index] = n;
					source.observerSlots[index] = s;
				}
			}
		}
		if (node.tOwned) {
			for (i = node.tOwned.length - 1; i >= 0; i--) cleanNode(node.tOwned[i]);
			delete node.tOwned;
		}
		if (Transition && Transition.running && node.pure) reset(node, true);
		else if (node.owned) {
			for (i = node.owned.length - 1; i >= 0; i--) cleanNode(node.owned[i]);
			node.owned = null;
		}
		if (node.cleanups) {
			for (i = node.cleanups.length - 1; i >= 0; i--) node.cleanups[i]();
			node.cleanups = null;
		}
		if (Transition && Transition.running) node.tState = 0;
		else node.state = 0;
	}
	function reset(node, top) {
		if (!top) {
			node.tState = 0;
			Transition.disposed.add(node);
		}
		if (node.owned) for (let i = 0; i < node.owned.length; i++) reset(node.owned[i]);
	}
	function castError(err) {
		if (err instanceof Error) return err;
		return new Error(typeof err === "string" ? err : "Unknown error", { cause: err });
	}
	function runErrors(err, fns, owner) {
		try {
			for (const f of fns) f(err);
		} catch (e) {
			handleError(e, owner && owner.owner || null);
		}
	}
	function handleError(err, owner = Owner) {
		const fns = ERROR && owner && owner.context && owner.context[ERROR];
		const error = castError(err);
		if (!fns) throw error;
		if (Effects) Effects.push({
			fn() {
				runErrors(error, fns, owner);
			},
			state: STALE
		});
		else runErrors(error, fns, owner);
	}
	var hydrationEnabled = false;
	function createComponent(Comp, props) {
		if (hydrationEnabled) {
			if (sharedConfig.context) {
				const c = sharedConfig.context;
				setHydrateContext(nextHydrateContext());
				const r = untrack(() => Comp(props || {}));
				setHydrateContext(c);
				return r;
			}
		}
		return untrack(() => Comp(props || {}));
	}
	//#endregion
	//#region node_modules/.pnpm/solid-js@1.9.12/node_modules/solid-js/web/dist/web.js
	var memo = (fn) => createMemo(() => fn());
	function reconcileArrays(parentNode, a, b) {
		let bLength = b.length, aEnd = a.length, bEnd = bLength, aStart = 0, bStart = 0, after = a[aEnd - 1].nextSibling, map = null;
		while (aStart < aEnd || bStart < bEnd) {
			if (a[aStart] === b[bStart]) {
				aStart++;
				bStart++;
				continue;
			}
			while (a[aEnd - 1] === b[bEnd - 1]) {
				aEnd--;
				bEnd--;
			}
			if (aEnd === aStart) {
				const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
				while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
			} else if (bEnd === bStart) while (aStart < aEnd) {
				if (!map || !map.has(a[aStart])) a[aStart].remove();
				aStart++;
			}
			else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
				const node = a[--aEnd].nextSibling;
				parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
				parentNode.insertBefore(b[--bEnd], node);
				a[aEnd] = b[bEnd];
			} else {
				if (!map) {
					map = /* @__PURE__ */ new Map();
					let i = bStart;
					while (i < bEnd) map.set(b[i], i++);
				}
				const index = map.get(a[aStart]);
				if (index != null) if (bStart < index && index < bEnd) {
					let i = aStart, sequence = 1, t;
					while (++i < aEnd && i < bEnd) {
						if ((t = map.get(a[i])) == null || t !== index + sequence) break;
						sequence++;
					}
					if (sequence > index - bStart) {
						const node = a[aStart];
						while (bStart < index) parentNode.insertBefore(b[bStart++], node);
					} else parentNode.replaceChild(b[bStart++], a[aStart++]);
				} else aStart++;
				else a[aStart++].remove();
			}
		}
	}
	var $$EVENTS = "_$DX_DELEGATE";
	function render(code, element, init, options = {}) {
		let disposer;
		createRoot((dispose) => {
			disposer = dispose;
			element === document ? code() : insert(element, code(), element.firstChild ? null : void 0, init);
		}, options.owner);
		return () => {
			disposer();
			element.textContent = "";
		};
	}
	function template(html, isImportNode, isSVG, isMathML) {
		let node;
		const create = () => {
			const t = isMathML ? document.createElementNS("http://www.w3.org/1998/Math/MathML", "template") : document.createElement("template");
			t.innerHTML = html;
			return isSVG ? t.content.firstChild.firstChild : isMathML ? t.firstChild : t.content.firstChild;
		};
		const fn = isImportNode ? () => untrack(() => document.importNode(node || (node = create()), true)) : () => (node || (node = create())).cloneNode(true);
		fn.cloneNode = fn;
		return fn;
	}
	function delegateEvents(eventNames, document = window.document) {
		const e = document[$$EVENTS] || (document[$$EVENTS] = /* @__PURE__ */ new Set());
		for (let i = 0, l = eventNames.length; i < l; i++) {
			const name = eventNames[i];
			if (!e.has(name)) {
				e.add(name);
				document.addEventListener(name, eventHandler);
			}
		}
	}
	function setAttribute(node, name, value) {
		if (isHydrating(node)) return;
		if (value == null) node.removeAttribute(name);
		else node.setAttribute(name, value);
	}
	function style(node, value, prev) {
		if (!value) return prev ? setAttribute(node, "style") : value;
		const nodeStyle = node.style;
		if (typeof value === "string") return nodeStyle.cssText = value;
		typeof prev === "string" && (nodeStyle.cssText = prev = void 0);
		prev || (prev = {});
		value || (value = {});
		let v, s;
		for (s in prev) {
			value[s] ?? nodeStyle.removeProperty(s);
			delete prev[s];
		}
		for (s in value) {
			v = value[s];
			if (v !== prev[s]) {
				nodeStyle.setProperty(s, v);
				prev[s] = v;
			}
		}
		return prev;
	}
	function insert(parent, accessor, marker, initial) {
		if (marker !== void 0 && !initial) initial = [];
		if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
		createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
	}
	function isHydrating(node) {
		return !!sharedConfig.context && !sharedConfig.done && (!node || node.isConnected);
	}
	function eventHandler(e) {
		if (sharedConfig.registry && sharedConfig.events) {
			if (sharedConfig.events.find(([el, ev]) => ev === e)) return;
		}
		let node = e.target;
		const key = `$$${e.type}`;
		const oriTarget = e.target;
		const oriCurrentTarget = e.currentTarget;
		const retarget = (value) => Object.defineProperty(e, "target", {
			configurable: true,
			value
		});
		const handleNode = () => {
			const handler = node[key];
			if (handler && !node.disabled) {
				const data = node[`${key}Data`];
				data !== void 0 ? handler.call(node, data, e) : handler.call(node, e);
				if (e.cancelBubble) return;
			}
			node.host && typeof node.host !== "string" && !node.host._$host && node.contains(e.target) && retarget(node.host);
			return true;
		};
		const walkUpTree = () => {
			while (handleNode() && (node = node._$host || node.parentNode || node.host));
		};
		Object.defineProperty(e, "currentTarget", {
			configurable: true,
			get() {
				return node || document;
			}
		});
		if (sharedConfig.registry && !sharedConfig.done) sharedConfig.done = _$HY.done = true;
		if (e.composedPath) {
			const path = e.composedPath();
			retarget(path[0]);
			for (let i = 0; i < path.length - 2; i++) {
				node = path[i];
				if (!handleNode()) break;
				if (node._$host) {
					node = node._$host;
					walkUpTree();
					break;
				}
				if (node.parentNode === oriCurrentTarget) break;
			}
		} else walkUpTree();
		retarget(oriTarget);
	}
	function insertExpression(parent, value, current, marker, unwrapArray) {
		const hydrating = isHydrating(parent);
		if (hydrating) {
			!current && (current = [...parent.childNodes]);
			let cleaned = [];
			for (let i = 0; i < current.length; i++) {
				const node = current[i];
				if (node.nodeType === 8 && node.data.slice(0, 2) === "!$") node.remove();
				else cleaned.push(node);
			}
			current = cleaned;
		}
		while (typeof current === "function") current = current();
		if (value === current) return current;
		const t = typeof value, multi = marker !== void 0;
		parent = multi && current[0] && current[0].parentNode || parent;
		if (t === "string" || t === "number") {
			if (hydrating) return current;
			if (t === "number") {
				value = value.toString();
				if (value === current) return current;
			}
			if (multi) {
				let node = current[0];
				if (node && node.nodeType === 3) node.data !== value && (node.data = value);
				else node = document.createTextNode(value);
				current = cleanChildren(parent, current, marker, node);
			} else if (current !== "" && typeof current === "string") current = parent.firstChild.data = value;
			else current = parent.textContent = value;
		} else if (value == null || t === "boolean") {
			if (hydrating) return current;
			current = cleanChildren(parent, current, marker);
		} else if (t === "function") {
			createRenderEffect(() => {
				let v = value();
				while (typeof v === "function") v = v();
				current = insertExpression(parent, v, current, marker);
			});
			return () => current;
		} else if (Array.isArray(value)) {
			const array = [];
			const currentArray = current && Array.isArray(current);
			if (normalizeIncomingArray(array, value, current, unwrapArray)) {
				createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
				return () => current;
			}
			if (hydrating) {
				if (!array.length) return current;
				if (marker === void 0) return current = [...parent.childNodes];
				let node = array[0];
				if (node.parentNode !== parent) return current;
				const nodes = [node];
				while ((node = node.nextSibling) !== marker) nodes.push(node);
				return current = nodes;
			}
			if (array.length === 0) {
				current = cleanChildren(parent, current, marker);
				if (multi) return current;
			} else if (currentArray) if (current.length === 0) appendNodes(parent, array, marker);
			else reconcileArrays(parent, current, array);
			else {
				current && cleanChildren(parent);
				appendNodes(parent, array);
			}
			current = array;
		} else if (value.nodeType) {
			if (hydrating && value.parentNode) return current = multi ? [value] : value;
			if (Array.isArray(current)) {
				if (multi) return current = cleanChildren(parent, current, marker, value);
				cleanChildren(parent, current, null, value);
			} else if (current == null || current === "" || !parent.firstChild) parent.appendChild(value);
			else parent.replaceChild(value, parent.firstChild);
			current = value;
		}
		return current;
	}
	function normalizeIncomingArray(normalized, array, current, unwrap) {
		let dynamic = false;
		for (let i = 0, len = array.length; i < len; i++) {
			let item = array[i], prev = current && current[normalized.length], t;
			if (item == null || item === true || item === false);
			else if ((t = typeof item) === "object" && item.nodeType) normalized.push(item);
			else if (Array.isArray(item)) dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
			else if (t === "function") if (unwrap) {
				while (typeof item === "function") item = item();
				dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item], Array.isArray(prev) ? prev : [prev]) || dynamic;
			} else {
				normalized.push(item);
				dynamic = true;
			}
			else {
				const value = String(item);
				if (prev && prev.nodeType === 3 && prev.data === value) normalized.push(prev);
				else normalized.push(document.createTextNode(value));
			}
		}
		return dynamic;
	}
	function appendNodes(parent, array, marker = null) {
		for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
	}
	function cleanChildren(parent, current, marker, replacement) {
		if (marker === void 0) return parent.textContent = "";
		const node = replacement || document.createTextNode("");
		if (current.length) {
			let inserted = false;
			for (let i = current.length - 1; i >= 0; i--) {
				const el = current[i];
				if (node !== el) {
					const isParent = el.parentNode === parent;
					if (!inserted && !i) isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
					else isParent && el.remove();
				} else inserted = true;
			}
		} else parent.insertBefore(node, marker);
		return [node];
	}
	//#endregion
	//#region src/types/chore-types.ts
	var ChoreType = /* @__PURE__ */ function(ChoreType) {
		ChoreType["PERSONAL"] = "personal";
		ChoreType["ROTATING"] = "rotating";
		return ChoreType;
	}({});
	//#endregion
	//#region src/admin/admin.tsx
	var _tmpl$ = /* @__PURE__ */ template(`<div class=container><header><h1>Family Chores Admin</h1><div class=backup-section><button type=button class="btn btn-secondary"id=backupBtn>Download Backup</button><label for=restoreFile class="btn btn-secondary">Restore Backup</label><input type=file id=restoreFile accept=.json hidden></div></header><main><section class=section><div class=section-header><h2>People</h2><div class=button-with-tooltip><button type=button class="btn btn-primary"id=addPersonBtn>Add Person</button><span id=addPersonInfo class=info-icon data-tooltip="Add at least one person before you can create chores">ℹ️</span></div></div><div id=peopleList class=item-list></div></section><section class=section id=rotatingChoresSection><div class=section-header><h2>Rotating Chores</h2><button type=button class="btn btn-primary"id=addRotatingChoreBtn>Add Rotating Chore</button></div><div id=rotatingChoresList class=item-list></div></section><section class=section><h2>System State</h2><div class=state-info><p><strong>Last Reset Date:</strong> <span id=lastResetDate></span></p><div class=button-with-tooltip><button type=button class="btn btn-warning"id=resetDailyBtn>Force Daily Reset</button><span class=info-icon data-tooltip="WARNING: This will un-check all chores and rotate assignment on rotating chores to the next person. It does respect skip days if today is a skip day. Useful for testing or immediately advancing chore assignments.">ℹ️`), _tmpl$2 = /* @__PURE__ */ template(`<div class=item-card><div class=person-header><div class=item-info><h3> <span class=color-badge></span></h3><p>ID: </p></div><div class=item-actions><button type=button class="btn btn-secondary btn-sm">Edit</button><button type=button class="btn btn-danger btn-sm">Delete</button></div></div><div class=person-chores-header><h4>'s Personal Chores</h4><div class=person-chores-actions><button type=button class="btn btn-primary btn-sm">Add Chore`), _tmpl$3 = /* @__PURE__ */ template(`<button type=button class="btn btn-secondary btn-sm">Copy Chores`), _tmpl$4 = /* @__PURE__ */ template(`<div class=person-chores>`), _tmpl$5 = /* @__PURE__ */ template(`<div class=chore-item><div class=chore-info><h4></h4><p class=skip-days>Skip days: </p></div><div class=chore-actions><button type=button class="btn btn-secondary btn-sm">Edit</button><button type=button class="btn btn-danger btn-sm">Delete`), _tmpl$6 = /* @__PURE__ */ template(`<p class=deadline>Deadline: `), _tmpl$7 = /* @__PURE__ */ template(`<div class=person-chores><p class=empty-message>No personal chores yet.`), _tmpl$8 = /* @__PURE__ */ template(`<div class=item-card><div class=item-info><h3> <span class="chore-type-badge rotating">Rotating</span></h3><p>Current: </p><p>Rotation: </p><p class=skip-days>Skip days: </p></div><div class=item-actions><button type=button class="btn btn-secondary">Edit</button><button type=button class="btn btn-danger">Delete`);
	var API_BASE = "/MMM-FamilyChores";
	function escapeHtml(raw) {
		const div = document.createElement("div");
		div.textContent = raw;
		return div.innerHTML;
	}
	function formatSkipDays(skipDays) {
		if (!skipDays || skipDays.length === 0) return "None";
		return skipDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
	}
	function Admin() {
		const [choreData, setChoreData] = createSignal(null);
		const [_personModalOpen, setPersonModalOpen] = createSignal(false);
		const [_choreModalOpen, setChoreModalOpen] = createSignal(false);
		const [_copyModalOpen, setCopyModalOpen] = createSignal(false);
		const [_editingPerson, setEditingPerson] = createSignal(null);
		const [_editingChore, setEditingChore] = createSignal(null);
		const [_choreType, setChoreType] = createSignal(null);
		const [_personForChore, setPersonForChore] = createSignal(null);
		async function loadData() {
			try {
				const response = await fetch(`${API_BASE}/data`);
				if (!response.ok) throw new Error("Failed to load data");
				setChoreData(await response.json());
			} catch (error) {
				console.error("Error loading data:", error);
				alert("Failed to load data. Please refresh the page.");
			}
		}
		onMount(() => {
			loadData();
		});
		function openPersonModal(person = null) {
			setEditingPerson(person);
			setPersonModalOpen(true);
		}
		function openChoreModal(type, personId = null, chore = null) {
			setEditingChore(chore);
			setChoreType(type);
			setPersonForChore(personId);
			setChoreModalOpen(true);
		}
		function openCopyModal(fromPersonId) {
			setPersonForChore(fromPersonId);
			setCopyModalOpen(true);
		}
		function getPersonalChores(personId) {
			const data = choreData();
			if (!data) return [];
			return data.chores.filter((chore) => chore.type === ChoreType.PERSONAL && chore.assignedTo === personId);
		}
		function getRotatingChores() {
			const data = choreData();
			if (!data) return [];
			return data.chores.filter((chore) => chore.type === ChoreType.ROTATING);
		}
		return (() => {
			var _el$ = _tmpl$(), _el$4 = _el$.firstChild.nextSibling.firstChild, _el$5 = _el$4.firstChild, _el$8 = _el$5.firstChild.nextSibling.firstChild, _el$9 = _el$8.nextSibling, _el$0 = _el$5.nextSibling, _el$1 = _el$4.nextSibling, _el$10 = _el$1.firstChild, _el$12 = _el$10.firstChild.nextSibling, _el$13 = _el$10.nextSibling, _el$17 = _el$1.nextSibling.firstChild.nextSibling.firstChild, _el$20 = _el$17.firstChild.nextSibling.nextSibling, _el$22 = _el$17.nextSibling.firstChild;
			_el$8.$$click = () => openPersonModal();
			insert(_el$0, () => choreData()?.people.map((person) => (() => {
				var _el$23 = _tmpl$2(), _el$24 = _el$23.firstChild, _el$25 = _el$24.firstChild, _el$26 = _el$25.firstChild, _el$27 = _el$26.firstChild, _el$28 = _el$27.nextSibling, _el$29 = _el$26.nextSibling;
				_el$29.firstChild;
				var _el$32 = _el$25.nextSibling.firstChild, _el$33 = _el$32.nextSibling, _el$35 = _el$24.nextSibling.firstChild, _el$36 = _el$35.firstChild, _el$37 = _el$35.nextSibling, _el$38 = _el$37.firstChild;
				insert(_el$26, () => escapeHtml(person.name), _el$27);
				insert(_el$29, () => person.id, null);
				_el$32.$$click = () => openPersonModal(person);
				_el$33.$$click = () => {
					if (confirm("Are you sure you want to delete this person? This will also remove all their assigned chores.")) {}
				};
				insert(_el$35, () => escapeHtml(person.name), _el$36);
				_el$38.$$click = () => openChoreModal("personal", person.id);
				insert(_el$37, (() => {
					var _c$ = memo(() => getPersonalChores(person.id).length > 0);
					return () => _c$() && (() => {
						var _el$39 = _tmpl$3();
						_el$39.$$click = () => openCopyModal(person.id);
						return _el$39;
					})();
				})(), null);
				insert(_el$23, (() => {
					var _c$2 = memo(() => getPersonalChores(person.id).length > 0);
					return () => _c$2() ? (() => {
						var _el$40 = _tmpl$4();
						insert(_el$40, () => getPersonalChores(person.id).map((chore) => (() => {
							var _el$41 = _tmpl$5(), _el$42 = _el$41.firstChild, _el$43 = _el$42.firstChild, _el$44 = _el$43.nextSibling;
							_el$44.firstChild;
							var _el$47 = _el$42.nextSibling.firstChild, _el$48 = _el$47.nextSibling;
							insert(_el$43, () => escapeHtml(chore.name));
							insert(_el$42, (() => {
								var _c$3 = memo(() => !!chore.deadline);
								return () => _c$3() && (() => {
									var _el$49 = _tmpl$6();
									_el$49.firstChild;
									insert(_el$49, () => chore.deadline, null);
									return _el$49;
								})();
							})(), _el$44);
							insert(_el$44, () => formatSkipDays(chore.skipDays), null);
							_el$47.$$click = () => openChoreModal("personal", null, chore);
							_el$48.$$click = () => {
								if (confirm("Are you sure you want to delete this chore?")) {}
							};
							return _el$41;
						})()));
						return _el$40;
					})() : _tmpl$7();
				})(), null);
				createRenderEffect((_$p) => style(_el$28, `background-color: ${person.color}`, _$p));
				return _el$23;
			})()));
			_el$12.$$click = () => openChoreModal("rotating");
			insert(_el$13, () => getRotatingChores().map((chore) => {
				const rotationNames = chore.rotation.map((personId) => {
					const person = choreData()?.people.find((p) => p.id === personId);
					return person ? escapeHtml(person.name) : "Unknown";
				}).join(", ");
				const peopleLength = choreData()?.people.length ?? 0;
				const rotationText = chore.rotation.length === peopleLength && chore.rotation.every((personId) => choreData()?.people.some((p) => p.id === personId)) ? "Everyone" : rotationNames;
				const currentPersonId = chore.rotation[chore.rotatingIndex ?? 0];
				const currentPerson = choreData()?.people.find((p) => p.id === currentPersonId);
				const currentAssignee = currentPerson ? escapeHtml(currentPerson.name) : "Unassigned";
				return (() => {
					var _el$52 = _tmpl$8(), _el$53 = _el$52.firstChild, _el$54 = _el$53.firstChild, _el$55 = _el$54.firstChild, _el$56 = _el$54.nextSibling;
					_el$56.firstChild;
					var _el$58 = _el$56.nextSibling;
					_el$58.firstChild;
					var _el$60 = _el$58.nextSibling;
					_el$60.firstChild;
					var _el$63 = _el$53.nextSibling.firstChild, _el$64 = _el$63.nextSibling;
					insert(_el$54, () => escapeHtml(chore.name), _el$55);
					insert(_el$56, currentAssignee, null);
					insert(_el$58, rotationText, null);
					insert(_el$53, (() => {
						var _c$4 = memo(() => !!chore.deadline);
						return () => _c$4() && (() => {
							var _el$65 = _tmpl$6();
							_el$65.firstChild;
							insert(_el$65, () => chore.deadline, null);
							return _el$65;
						})();
					})(), _el$60);
					insert(_el$60, () => formatSkipDays(chore.skipDays), null);
					_el$63.$$click = () => openChoreModal("rotating", null, chore);
					_el$64.$$click = () => {
						if (confirm("Are you sure you want to delete this chore?")) {}
					};
					return _el$52;
				})();
			}));
			insert(_el$20, () => choreData()?.lastResetDate || "Never");
			_el$22.$$click = () => {
				if (confirm("Are you sure you want to force a daily reset? This will reset all chore states for the new day.")) {}
			};
			createRenderEffect((_p$) => {
				var _v$ = choreData()?.people.length === 0 ? "display: inline" : "display: none", _v$2 = (choreData()?.people?.length ?? 0) > 0 ? "display: block" : "display: none";
				_p$.e = style(_el$9, _v$, _p$.e);
				_p$.t = style(_el$1, _v$2, _p$.t);
				return _p$;
			}, {
				e: void 0,
				t: void 0
			});
			return _el$;
		})();
	}
	delegateEvents(["click"]);
	//#endregion
	//#region src/admin/app.tsx
	var appElement = document.getElementById("app");
	if (appElement) render(() => createComponent(Admin, {}), appElement);
	else console.error("Failed to find #app element");
	//#endregion
})();

//# sourceMappingURL=admin.js.map