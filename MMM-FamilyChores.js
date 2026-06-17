// Automatically built — do not edit directly. Edit src/ and run pnpm build.
(function(factory) {
	typeof define === "function" && define.amd ? define([], factory) : factory();
})(function() {
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
	var $PROXY = Symbol("solid-proxy");
	var $TRACK = Symbol("solid-track");
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
	function batch(fn) {
		return runUpdates(fn, false);
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
	function onCleanup(fn) {
		if (Owner === null);
		else if (Owner.cleanups === null) Owner.cleanups = [fn];
		else Owner.cleanups.push(fn);
		return fn;
	}
	function getListener() {
		return Listener;
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
	var [transPending, setTransPending] = /*@__PURE__*/ createSignal(false);
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
	var FALLBACK = Symbol("fallback");
	function dispose(d) {
		for (let i = 0; i < d.length; i++) d[i]();
	}
	function mapArray(list, mapFn, options = {}) {
		let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
		onCleanup(() => dispose(disposers));
		return () => {
			let newItems = list() || [], newLen = newItems.length, i, j;
			newItems[$TRACK];
			return untrack(() => {
				let newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
				if (newLen === 0) {
					if (len !== 0) {
						dispose(disposers);
						disposers = [];
						items = [];
						mapped = [];
						len = 0;
						indexes && (indexes = []);
					}
					if (options.fallback) {
						items = [FALLBACK];
						mapped[0] = createRoot((disposer) => {
							disposers[0] = disposer;
							return options.fallback();
						});
						len = 1;
					}
				} else if (len === 0) {
					mapped = new Array(newLen);
					for (j = 0; j < newLen; j++) {
						items[j] = newItems[j];
						mapped[j] = createRoot(mapper);
					}
					len = newLen;
				} else {
					temp = new Array(newLen);
					tempdisposers = new Array(newLen);
					indexes && (tempIndexes = new Array(newLen));
					for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++);
					for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
						temp[newEnd] = mapped[end];
						tempdisposers[newEnd] = disposers[end];
						indexes && (tempIndexes[newEnd] = indexes[end]);
					}
					newIndices = /* @__PURE__ */ new Map();
					newIndicesNext = new Array(newEnd + 1);
					for (j = newEnd; j >= start; j--) {
						item = newItems[j];
						i = newIndices.get(item);
						newIndicesNext[j] = i === void 0 ? -1 : i;
						newIndices.set(item, j);
					}
					for (i = start; i <= end; i++) {
						item = items[i];
						j = newIndices.get(item);
						if (j !== void 0 && j !== -1) {
							temp[j] = mapped[i];
							tempdisposers[j] = disposers[i];
							indexes && (tempIndexes[j] = indexes[i]);
							j = newIndicesNext[j];
							newIndices.set(item, j);
						} else disposers[i]();
					}
					for (j = start; j < newLen; j++) if (j in temp) {
						mapped[j] = temp[j];
						disposers[j] = tempdisposers[j];
						if (indexes) {
							indexes[j] = tempIndexes[j];
							indexes[j](j);
						}
					} else mapped[j] = createRoot(mapper);
					mapped = mapped.slice(0, len = newLen);
					items = newItems.slice(0);
				}
				return mapped;
			});
			function mapper(disposer) {
				disposers[j] = disposer;
				if (indexes) {
					const [s, set] = createSignal(j);
					indexes[j] = set;
					return mapFn(newItems[j], s);
				}
				return mapFn(newItems[j]);
			}
		};
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
	var narrowedError = (name) => `Stale read from <${name}>.`;
	function For(props) {
		const fallback = "fallback" in props && { fallback: () => props.fallback };
		return createMemo(mapArray(() => props.each, props.children, fallback || void 0));
	}
	function Show(props) {
		const keyed = props.keyed;
		const conditionValue = createMemo(() => props.when, void 0, void 0);
		const condition = keyed ? conditionValue : createMemo(conditionValue, void 0, { equals: (a, b) => !a === !b });
		return createMemo(() => {
			const c = condition();
			if (c) {
				const child = props.children;
				return typeof child === "function" && child.length > 0 ? untrack(() => child(keyed ? c : () => {
					if (!untrack(condition)) throw narrowedError("Show");
					return conditionValue();
				})) : child;
			}
			return props.fallback;
		}, void 0, void 0);
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
	function setAttribute(node, name, value) {
		if (isHydrating(node)) return;
		if (value == null) node.removeAttribute(name);
		else node.setAttribute(name, value);
	}
	function className(node, value) {
		if (isHydrating(node)) return;
		if (value == null) node.removeAttribute("class");
		else node.className = value;
	}
	function setStyleProperty(node, name, value) {
		value != null ? node.style.setProperty(name, value) : node.style.removeProperty(name);
	}
	function insert(parent, accessor, marker, initial) {
		if (marker !== void 0 && !initial) initial = [];
		if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
		createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
	}
	function isHydrating(node) {
		return !!sharedConfig.context && !sharedConfig.done && (!node || node.isConnected);
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
	//#region node_modules/.pnpm/solid-js@1.9.12/node_modules/solid-js/store/dist/store.js
	var $RAW = Symbol("store-raw"), $NODE = Symbol("store-node"), $HAS = Symbol("store-has"), $SELF = Symbol("store-self");
	function wrap$1(value) {
		let p = value[$PROXY];
		if (!p) {
			Object.defineProperty(value, $PROXY, { value: p = new Proxy(value, proxyTraps$1) });
			if (!Array.isArray(value)) {
				const keys = Object.keys(value), desc = Object.getOwnPropertyDescriptors(value);
				for (let i = 0, l = keys.length; i < l; i++) {
					const prop = keys[i];
					if (desc[prop].get) Object.defineProperty(value, prop, {
						enumerable: desc[prop].enumerable,
						get: desc[prop].get.bind(p)
					});
				}
			}
		}
		return p;
	}
	function isWrappable(obj) {
		let proto;
		return obj != null && typeof obj === "object" && (obj[$PROXY] || !(proto = Object.getPrototypeOf(obj)) || proto === Object.prototype || Array.isArray(obj));
	}
	function unwrap(item, set = /* @__PURE__ */ new Set()) {
		let result, unwrapped, v, prop;
		if (result = item != null && item[$RAW]) return result;
		if (!isWrappable(item) || set.has(item)) return item;
		if (Array.isArray(item)) {
			if (Object.isFrozen(item)) item = item.slice(0);
			else set.add(item);
			for (let i = 0, l = item.length; i < l; i++) {
				v = item[i];
				if ((unwrapped = unwrap(v, set)) !== v) item[i] = unwrapped;
			}
		} else {
			if (Object.isFrozen(item)) item = Object.assign({}, item);
			else set.add(item);
			const keys = Object.keys(item), desc = Object.getOwnPropertyDescriptors(item);
			for (let i = 0, l = keys.length; i < l; i++) {
				prop = keys[i];
				if (desc[prop].get) continue;
				v = item[prop];
				if ((unwrapped = unwrap(v, set)) !== v) item[prop] = unwrapped;
			}
		}
		return item;
	}
	function getNodes(target, symbol) {
		let nodes = target[symbol];
		if (!nodes) Object.defineProperty(target, symbol, { value: nodes = Object.create(null) });
		return nodes;
	}
	function getNode(nodes, property, value) {
		if (nodes[property]) return nodes[property];
		const [s, set] = createSignal(value, {
			equals: false,
			internal: true
		});
		s.$ = set;
		return nodes[property] = s;
	}
	function proxyDescriptor$1(target, property) {
		const desc = Reflect.getOwnPropertyDescriptor(target, property);
		if (!desc || desc.get || !desc.configurable || property === $PROXY || property === $NODE) return desc;
		delete desc.value;
		delete desc.writable;
		desc.get = () => target[$PROXY][property];
		return desc;
	}
	function trackSelf(target) {
		getListener() && getNode(getNodes(target, $NODE), $SELF)();
	}
	function ownKeys(target) {
		trackSelf(target);
		return Reflect.ownKeys(target);
	}
	var proxyTraps$1 = {
		get(target, property, receiver) {
			if (property === $RAW) return target;
			if (property === $PROXY) return receiver;
			if (property === $TRACK) {
				trackSelf(target);
				return receiver;
			}
			const nodes = getNodes(target, $NODE);
			const tracked = nodes[property];
			let value = tracked ? tracked() : target[property];
			if (property === $NODE || property === $HAS || property === "__proto__") return value;
			if (!tracked) {
				const desc = Object.getOwnPropertyDescriptor(target, property);
				if (getListener() && (typeof value !== "function" || target.hasOwnProperty(property)) && !(desc && desc.get)) value = getNode(nodes, property, value)();
			}
			return isWrappable(value) ? wrap$1(value) : value;
		},
		has(target, property) {
			if (property === $RAW || property === $PROXY || property === $TRACK || property === $NODE || property === $HAS || property === "__proto__") return true;
			getListener() && getNode(getNodes(target, $HAS), property)();
			return property in target;
		},
		set() {
			return true;
		},
		deleteProperty() {
			return true;
		},
		ownKeys,
		getOwnPropertyDescriptor: proxyDescriptor$1
	};
	function setProperty(state, property, value, deleting = false) {
		if (!deleting && state[property] === value) return;
		const prev = state[property], len = state.length;
		if (value === void 0) {
			delete state[property];
			if (state[$HAS] && state[$HAS][property] && prev !== void 0) state[$HAS][property].$();
		} else {
			state[property] = value;
			if (state[$HAS] && state[$HAS][property] && prev === void 0) state[$HAS][property].$();
		}
		let nodes = getNodes(state, $NODE), node;
		if (node = getNode(nodes, property, prev)) node.$(() => value);
		if (Array.isArray(state) && state.length !== len) {
			for (let i = state.length; i < len; i++) (node = nodes[i]) && node.$();
			(node = getNode(nodes, "length", len)) && node.$(state.length);
		}
		(node = nodes[$SELF]) && node.$();
	}
	function mergeStoreNode(state, value) {
		const keys = Object.keys(value);
		for (let i = 0; i < keys.length; i += 1) {
			const key = keys[i];
			setProperty(state, key, value[key]);
		}
	}
	function updateArray(current, next) {
		if (typeof next === "function") next = next(current);
		next = unwrap(next);
		if (Array.isArray(next)) {
			if (current === next) return;
			let i = 0, len = next.length;
			for (; i < len; i++) {
				const value = next[i];
				if (current[i] !== value) setProperty(current, i, value);
			}
			setProperty(current, "length", len);
		} else mergeStoreNode(current, next);
	}
	function updatePath(current, path, traversed = []) {
		let part, prev = current;
		if (path.length > 1) {
			part = path.shift();
			const partType = typeof part, isArray = Array.isArray(current);
			if (Array.isArray(part)) {
				for (let i = 0; i < part.length; i++) updatePath(current, [part[i]].concat(path), traversed);
				return;
			} else if (isArray && partType === "function") {
				for (let i = 0; i < current.length; i++) if (part(current[i], i)) updatePath(current, [i].concat(path), traversed);
				return;
			} else if (isArray && partType === "object") {
				const { from = 0, to = current.length - 1, by = 1 } = part;
				for (let i = from; i <= to; i += by) updatePath(current, [i].concat(path), traversed);
				return;
			} else if (path.length > 1) {
				updatePath(current[part], path, [part].concat(traversed));
				return;
			}
			prev = current[part];
			traversed = [part].concat(traversed);
		}
		let value = path[0];
		if (typeof value === "function") {
			value = value(prev, traversed);
			if (value === prev) return;
		}
		if (part === void 0 && value == void 0) return;
		value = unwrap(value);
		if (part === void 0 || isWrappable(prev) && isWrappable(value) && !Array.isArray(value)) mergeStoreNode(prev, value);
		else setProperty(current, part, value);
	}
	function createStore(...[store, options]) {
		const unwrappedStore = unwrap(store || {});
		const isArray = Array.isArray(unwrappedStore);
		const wrappedStore = wrap$1(unwrappedStore);
		function setStore(...args) {
			batch(() => {
				isArray && args.length === 1 ? updateArray(unwrappedStore, args[0]) : updatePath(unwrappedStore, args);
			});
		}
		return [wrappedStore, setStore];
	}
	var $ROOT = Symbol("store-root");
	function applyState(target, parent, property, merge, key) {
		const previous = parent[property];
		if (target === previous) return;
		const isArray = Array.isArray(target);
		if (property !== $ROOT && (!isWrappable(target) || !isWrappable(previous) || isArray !== Array.isArray(previous) || key && target[key] !== previous[key])) {
			setProperty(parent, property, target);
			return;
		}
		if (isArray) {
			if (target.length && previous.length && (!merge || key && target[0] && target[0][key] != null)) {
				let i, j, start, end, newEnd, item, newIndicesNext, keyVal;
				for (start = 0, end = Math.min(previous.length, target.length); start < end && (previous[start] === target[start] || key && previous[start] && target[start] && previous[start][key] && previous[start][key] === target[start][key]); start++) applyState(target[start], previous, start, merge, key);
				const temp = new Array(target.length), newIndices = /* @__PURE__ */ new Map();
				for (end = previous.length - 1, newEnd = target.length - 1; end >= start && newEnd >= start && (previous[end] === target[newEnd] || key && previous[end] && target[newEnd] && previous[end][key] && previous[end][key] === target[newEnd][key]); end--, newEnd--) temp[newEnd] = previous[end];
				if (start > newEnd || start > end) {
					for (j = start; j <= newEnd; j++) setProperty(previous, j, target[j]);
					for (; j < target.length; j++) {
						setProperty(previous, j, temp[j]);
						applyState(target[j], previous, j, merge, key);
					}
					if (previous.length > target.length) setProperty(previous, "length", target.length);
					return;
				}
				newIndicesNext = new Array(newEnd + 1);
				for (j = newEnd; j >= start; j--) {
					item = target[j];
					keyVal = key && item ? item[key] : item;
					i = newIndices.get(keyVal);
					newIndicesNext[j] = i === void 0 ? -1 : i;
					newIndices.set(keyVal, j);
				}
				for (i = start; i <= end; i++) {
					item = previous[i];
					keyVal = key && item ? item[key] : item;
					j = newIndices.get(keyVal);
					if (j !== void 0 && j !== -1) {
						temp[j] = previous[i];
						j = newIndicesNext[j];
						newIndices.set(keyVal, j);
					}
				}
				for (j = start; j < target.length; j++) if (j in temp) {
					setProperty(previous, j, temp[j]);
					applyState(target[j], previous, j, merge, key);
				} else setProperty(previous, j, target[j]);
			} else for (let i = 0, len = target.length; i < len; i++) applyState(target[i], previous, i, merge, key);
			if (previous.length > target.length) setProperty(previous, "length", target.length);
			return;
		}
		const targetKeys = Object.keys(target);
		for (let i = 0, len = targetKeys.length; i < len; i++) applyState(target[targetKeys[i]], previous, targetKeys[i], merge, key);
		const previousKeys = Object.keys(previous);
		for (let i = 0, len = previousKeys.length; i < len; i++) if (target[previousKeys[i]] === void 0) setProperty(previous, previousKeys[i], void 0);
	}
	function reconcile(value, options = {}) {
		const { merge, key = "id" } = options, v = unwrap(value);
		return (state) => {
			if (!isWrappable(state) || !isWrappable(v)) return v;
			const res = applyState(v, { [$ROOT]: state }, $ROOT, merge, key);
			return res === void 0 ? state : res;
		};
	}
	//#endregion
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
		if (completedToday) return "completed";
		if (caughtUp === false) return "overdue";
		if (!deadline) return "normal";
		if (getLocalTimeString() >= deadline) return "overdue";
		return "normal";
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
	//#region src/frontend/chore-filters.ts
	/**
	* Determine if a chore should be shown based on skip day visibility settings
	*/
	function shouldShowChore(chore, todayDayName) {
		if (!chore.skipDays.includes(todayDayName)) return true;
		const skipDayVisibility = chore.skipDayVisibility ?? SkipDayVisibility.HIDE;
		if (skipDayVisibility === SkipDayVisibility.HIDE) return false;
		if (skipDayVisibility === SkipDayVisibility.SHOW_IF_OVERDUE && chore.caughtUp) return false;
		return true;
	}
	/**
	* Get chores filtered for personal view mode
	*/
	function getFilteredChores(chores, people, personFilter, todayDayName) {
		const filterValue = personFilter?.trim().toLowerCase();
		if (!filterValue) return chores.filter((chore) => shouldShowChore(chore, todayDayName));
		const filteredPerson = people.find((person) => person.id.toLowerCase() === filterValue) || people.find((person) => person.name.toLowerCase() === filterValue);
		if (!filteredPerson) return [];
		return chores.filter((chore) => {
			if (!shouldShowChore(chore, todayDayName)) return false;
			if (chore.type === "personal") return chore.assignedTo === filteredPerson.id;
			if (chore.type === "rotating" && chore.rotation?.length) {
				const currentIndex = chore.rotatingIndex ?? 0;
				return chore.rotation[currentIndex] === filteredPerson.id;
			}
			return false;
		});
	}
	/**
	* Get chores for summary view: all incomplete + all rotating chores, with skip day filtering
	*/
	function getSummaryChores(chores, todayDayName) {
		return chores.filter((chore) => {
			if (!shouldShowChore(chore, todayDayName)) return false;
			if (!chore.completedToday) return true;
			if (chore.type === "rotating" && chore.rotation?.length) return true;
			return false;
		});
	}
	/**
	* Build a Config object with all defaults applied
	*/
	function getSummaryConfig(config) {
		return {
			showIncomplete: true,
			showRotating: true,
			showOverdue: true,
			incompleteTitle: "Incomplete Chores",
			rotatingTitle: "Today's Rotation",
			overdueTitle: "Overdue",
			...config.summary
		};
	}
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
	//#region src/frontend/chore-item.tsx
	var _tmpl$$6 = /*#__PURE__*/ template(`<div data-testid=chore-item><label class=chore-label><div class=chore-checkbox><input type=checkbox data-testid=chore-checkbox></div><div class=chore-details><div class=chore-name></div><div class=chore-meta><span class=assigned-to>`), _tmpl$2$4 = /*#__PURE__*/ template(`<span class=deadline>`);
	var ChoreItem = (props) => {
		const assignedPerson = () => {
			const chore = props.chore;
			if (chore.type === ChoreType.PERSONAL) return props.people.find((p) => p.id === chore.assignedTo);
			return null;
		};
		const currentRotationPerson = () => {
			const chore = props.chore;
			if (chore.type === ChoreType.ROTATING && chore.rotation && chore.rotatingIndex !== void 0) return props.people.find((p) => p.id === chore.rotation?.[chore.rotatingIndex ?? -1]);
			return null;
		};
		const displayPerson = () => assignedPerson() || currentRotationPerson();
		const personName = () => displayPerson()?.name ?? "Unassigned";
		const personColor = () => displayPerson()?.color ?? "#ccc";
		const deadlineStatus = () => getDeadlineStatus(props.chore.deadline, props.chore.completedToday, props.chore.caughtUp);
		const deadlineClass = () => deadlineStatus() === DeadlineStatus.COMPLETED ? "completed" : deadlineStatus();
		const handleChange = (event) => {
			const target = event.target;
			props.onToggle(props.chore.id, target.checked);
		};
		return (() => {
			var _el$ = _tmpl$$6(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$6 = _el$3.nextSibling.firstChild, _el$7 = _el$6.nextSibling, _el$8 = _el$7.firstChild;
			_el$4.addEventListener("change", handleChange);
			insert(_el$6, () => escapeHtml(props.chore.name));
			insert(_el$8, () => escapeHtml(personName()));
			insert(_el$7, (() => {
				var _c$ = memo(() => !!props.chore.deadline);
				return () => _c$() && (() => {
					var _el$9 = _tmpl$2$4();
					insert(_el$9, () => props.chore.deadline);
					return _el$9;
				})();
			})(), null);
			createRenderEffect((_p$) => {
				var _v$ = `chore-item ${deadlineClass()}`, _v$2 = `chore-${props.chore.id}`, _v$3 = `chore-${props.chore.id}`, _v$4 = props.chore.id, _v$5 = personColor();
				_v$ !== _p$.e && className(_el$, _p$.e = _v$);
				_v$2 !== _p$.t && setAttribute(_el$2, "for", _p$.t = _v$2);
				_v$3 !== _p$.a && setAttribute(_el$4, "id", _p$.a = _v$3);
				_v$4 !== _p$.o && setAttribute(_el$4, "data-chore-id", _p$.o = _v$4);
				_v$5 !== _p$.i && setStyleProperty(_el$8, "color", _p$.i = _v$5);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0,
				o: void 0,
				i: void 0
			});
			createRenderEffect(() => _el$4.checked = props.chore.completedToday);
			return _el$;
		})();
	};
	//#endregion
	//#region src/frontend/personal-view.tsx
	var _tmpl$$5 = /*#__PURE__*/ template(`<div class=chore-list>`), _tmpl$2$3 = /*#__PURE__*/ template(`<div class=empty-state>No chores match the current filter.`);
	var PersonalView = (props) => {
		const visibleChores = createMemo(() => {
			const data = props.choreData();
			return getFilteredChores(data.chores, data.people, props.config.personFilter, props.todaysDayOfWeek());
		});
		return (() => {
			var _el$ = _tmpl$$5();
			insert(_el$, createComponent(Show, {
				get when() {
					return visibleChores().length > 0;
				},
				get fallback() {
					return _tmpl$2$3();
				},
				get children() {
					return createComponent(For, {
						get each() {
							return visibleChores();
						},
						children: (chore) => createComponent(ChoreItem, {
							chore,
							get people() {
								return props.choreData().people;
							},
							get onToggle() {
								return props.onToggle;
							}
						})
					});
				}
			}));
			return _el$;
		})();
	};
	//#endregion
	//#region src/frontend/incomplete-by-person.tsx
	var _tmpl$$4 = /*#__PURE__*/ template(`<div class=incomplete-person-row><span class=person-name></span><span class=incomplete-count>`);
	var IncompleteByPerson = (props) => {
		const personRows = createMemo(() => {
			const choresByPerson = /* @__PURE__ */ new Map();
			props.incompleteChores.forEach((chore) => {
				let personId;
				if (chore.type === ChoreType.PERSONAL) personId = chore.assignedTo;
				else if (chore.type === ChoreType.ROTATING && chore.rotation && chore.rotatingIndex !== void 0) personId = chore.rotation[chore.rotatingIndex];
				if (personId) {
					if (!choresByPerson.has(personId)) choresByPerson.set(personId, []);
					choresByPerson.get(personId)?.push(chore);
				}
			});
			return props.people.map((person) => {
				const count = (choresByPerson.get(person.id) || []).length;
				return {
					person,
					count,
					celebrationEmoji: count === 0 ? "🎉" : ""
				};
			});
		});
		return createComponent(For, {
			get each() {
				return personRows();
			},
			children: (row) => (() => {
				var _el$ = _tmpl$$4(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling;
				insert(_el$2, () => escapeHtml(row.person.name));
				insert(_el$3, () => row.celebrationEmoji, null);
				insert(_el$3, () => row.celebrationEmoji && " ", null);
				insert(_el$3, () => row.count, null);
				createRenderEffect((_$p) => setStyleProperty(_el$2, "color", row.person.color));
				return _el$;
			})()
		});
	};
	//#endregion
	//#region src/frontend/overdue-by-person.tsx
	var _tmpl$$3 = /*#__PURE__*/ template(`<div class=overdue-person-group><div class=overdue-person-name></div><div class=overdue-chores-list>`), _tmpl$2$2 = /*#__PURE__*/ template(`<div class=overdue-chore-item data-testid=overdue-chore-item>`), _tmpl$3$1 = /*#__PURE__*/ template(`<div class=overdue-more>...<!> more`);
	var OverdueByPerson = (props) => {
		const personGroups = createMemo(() => {
			const choresByPerson = /* @__PURE__ */ new Map();
			props.overdueChores.forEach((chore) => {
				let personId;
				if (chore.type === ChoreType.PERSONAL) personId = chore.assignedTo;
				else if (chore.type === ChoreType.ROTATING && chore.rotation && chore.rotatingIndex !== void 0) personId = chore.rotation[chore.rotatingIndex];
				if (personId) {
					if (!choresByPerson.has(personId)) choresByPerson.set(personId, []);
					choresByPerson.get(personId)?.push(chore);
				}
			});
			const groups = [];
			choresByPerson.forEach((chores, personId) => {
				const person = props.people.find((p) => p.id === personId);
				if (!person) return;
				const displayChores = chores.length <= 4 ? chores : chores.slice(0, 3);
				const remainingCount = chores.length <= 4 ? 0 : chores.length - 3;
				groups.push({
					person,
					displayChores,
					remainingCount
				});
			});
			return groups;
		});
		return createComponent(For, {
			get each() {
				return personGroups();
			},
			children: (group) => (() => {
				var _el$ = _tmpl$$3(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling;
				insert(_el$2, () => escapeHtml(group.person.name));
				insert(_el$3, createComponent(For, {
					get each() {
						return group.displayChores;
					},
					children: (chore) => (() => {
						var _el$4 = _tmpl$2$2();
						insert(_el$4, () => escapeHtml(chore.name));
						createRenderEffect(() => setAttribute(_el$4, "data-chore-id", chore.id));
						return _el$4;
					})()
				}), null);
				insert(_el$3, (() => {
					var _c$ = memo(() => group.remainingCount > 0);
					return () => _c$() && (() => {
						var _el$5 = _tmpl$3$1(), _el$8 = _el$5.firstChild.nextSibling;
						_el$8.nextSibling;
						insert(_el$5, () => group.remainingCount, _el$8);
						return _el$5;
					})();
				})(), null);
				createRenderEffect((_$p) => setStyleProperty(_el$2, "color", group.person.color));
				return _el$;
			})()
		});
	};
	//#endregion
	//#region src/frontend/rotating-chore-inline.tsx
	var _tmpl$$2 = /*#__PURE__*/ template(`<div class=rotating-inline data-testid=rotating-inline><span class=chore-name></span><span class=person-name></span><input type=checkbox class=inline-checkbox data-testid=rotating-checkbox>`);
	var RotatingChoreInline = (props) => {
		const currentRotationPerson = () => {
			const chore = props.chore;
			if (chore.type === ChoreType.ROTATING && chore.rotation && chore.rotatingIndex !== void 0) return props.people.find((p) => p.id === chore.rotation?.[chore.rotatingIndex ?? -1]);
			return null;
		};
		const personName = () => currentRotationPerson()?.name ?? "Unassigned";
		const personColor = () => currentRotationPerson()?.color ?? "#ccc";
		const handleChange = (event) => {
			const target = event.target;
			props.onToggle(props.chore.id, target.checked);
		};
		return (() => {
			var _el$ = _tmpl$$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling;
			insert(_el$2, () => escapeHtml(props.chore.name));
			insert(_el$3, () => escapeHtml(personName()));
			_el$4.addEventListener("change", handleChange);
			createRenderEffect((_p$) => {
				var _v$ = personColor(), _v$2 = props.chore.id;
				_v$ !== _p$.e && setStyleProperty(_el$3, "color", _p$.e = _v$);
				_v$2 !== _p$.t && setAttribute(_el$4, "data-chore-id", _p$.t = _v$2);
				return _p$;
			}, {
				e: void 0,
				t: void 0
			});
			createRenderEffect(() => _el$4.checked = props.chore.completedToday);
			return _el$;
		})();
	};
	//#endregion
	//#region src/frontend/summary-view.tsx
	var _tmpl$$1 = /*#__PURE__*/ template(`<div class="summary-section incomplete-section"><h3 class="section-title incomplete-title"></h3><div class=incomplete-list>`), _tmpl$2$1 = /*#__PURE__*/ template(`<div class="summary-section rotating-section"><h3 class="section-title rotating-title"></h3><div class=chore-list>`), _tmpl$3 = /*#__PURE__*/ template(`<div class="summary-section overdue-section"><h3 class="section-title overdue-title"></h3><div class=overdue-list>`), _tmpl$4 = /*#__PURE__*/ template(`<div class=summary-view>`);
	var SummaryView = (props) => {
		const summaryConfig = () => getSummaryConfig(props.config);
		const visibleChores = createMemo(() => {
			return getSummaryChores(props.choreData().chores, props.todaysDayOfWeek());
		});
		const incompleteChores = createMemo(() => visibleChores().filter((chore) => !chore.completedToday));
		const overdueChores = createMemo(() => visibleChores().filter((chore) => {
			return getDeadlineStatus(chore.deadline, chore.completedToday, chore.caughtUp) === DeadlineStatus.OVERDUE;
		}));
		const rotatingChores = createMemo(() => visibleChores().filter((chore) => chore.type === "rotating"));
		return (() => {
			var _el$ = _tmpl$4();
			insert(_el$, createComponent(Show, {
				get when() {
					return memo(() => !!summaryConfig().showIncomplete)() && incompleteChores().length > 0;
				},
				get children() {
					var _el$2 = _tmpl$$1(), _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling;
					insert(_el$3, () => summaryConfig().incompleteTitle);
					insert(_el$4, createComponent(IncompleteByPerson, {
						get incompleteChores() {
							return incompleteChores();
						},
						get people() {
							return props.choreData().people;
						}
					}));
					return _el$2;
				}
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return memo(() => !!summaryConfig().showRotating)() && rotatingChores().length > 0;
				},
				get children() {
					var _el$5 = _tmpl$2$1(), _el$6 = _el$5.firstChild, _el$7 = _el$6.nextSibling;
					insert(_el$6, () => summaryConfig().rotatingTitle);
					insert(_el$7, createComponent(For, {
						get each() {
							return rotatingChores();
						},
						children: (chore) => createComponent(RotatingChoreInline, {
							chore,
							get people() {
								return props.choreData().people;
							},
							get onToggle() {
								return props.onToggle;
							}
						})
					}));
					return _el$5;
				}
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return memo(() => !!summaryConfig().showOverdue)() && overdueChores().length > 0;
				},
				get children() {
					var _el$8 = _tmpl$3(), _el$9 = _el$8.firstChild, _el$0 = _el$9.nextSibling;
					insert(_el$9, () => summaryConfig().overdueTitle);
					insert(_el$0, createComponent(OverdueByPerson, {
						get overdueChores() {
							return overdueChores();
						},
						get people() {
							return props.choreData().people;
						}
					}));
					return _el$8;
				}
			}), null);
			return _el$;
		})();
	};
	//#endregion
	//#region src/frontend/app.tsx
	var _tmpl$ = /*#__PURE__*/ template(`<div class=module-content>`), _tmpl$2 = /*#__PURE__*/ template(`<div class=loading>Loading...`);
	var App = (props) => {
		return (() => {
			var _el$ = _tmpl$();
			insert(_el$, createComponent(Show, {
				get when() {
					return props.choreData();
				},
				get fallback() {
					return _tmpl$2();
				},
				children: (dataAccessor) => createComponent(Show, {
					get when() {
						return props.config.viewMode === "summary";
					},
					get fallback() {
						return createComponent(PersonalView, {
							choreData: dataAccessor,
							get todaysDayOfWeek() {
								return props.todaysDayOfWeek;
							},
							get config() {
								return props.config;
							},
							get onToggle() {
								return props.onToggle;
							}
						});
					},
					get children() {
						return createComponent(SummaryView, {
							choreData: dataAccessor,
							get todaysDayOfWeek() {
								return props.todaysDayOfWeek;
							},
							get config() {
								return props.config;
							},
							get onToggle() {
								return props.onToggle;
							}
						});
					}
				})
			}));
			return _el$;
		})();
	};
	//#endregion
	//#region src/frontend/frontend.tsx
	Module.register("MMM-FamilyChores", {
		name: "MMM-FamilyChores",
		config: {
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
			const [choreData, setChoreData] = createStore({
				data: null,
				todaysDayOfWeek: getLocalDayName()
			});
			this.choreDataSignal = () => choreData.data;
			this.todaysDayOfWeekSignal = () => choreData.todaysDayOfWeek;
			this.setChoreDataAndDay = (data) => {
				setChoreData("data", reconcile(data));
				setChoreData("todaysDayOfWeek", getLocalDayName());
			};
			setInterval(() => {
				const newDay = getLocalDayName();
				if (newDay !== choreData.todaysDayOfWeek) setChoreData("todaysDayOfWeek", newDay);
			}, 6e4);
			this.loadData();
		},
		/**
		* The getStyles method is called to request any additional stylesheets that need to be loaded.
		*/
		getStyles() {
			return [this.file?.("css/main.css") || ""];
		},
		getDom() {
			if (this.rootContainer) return this.rootContainer;
			const container = document.createElement("div");
			container.className = "MMM-FamilyChores";
			const handleToggle = (choreId, completed) => {
				Log.debug(`${this.name} toggling chore ${choreId} to ${completed}`);
				this.sendSocketNotification?.(SocketNotifications.CHORE_TOGGLE, {
					choreId,
					completed
				});
			};
			const choreDataSignal = this.choreDataSignal;
			const todaysDayOfWeekSignal = this.todaysDayOfWeekSignal;
			if (!choreDataSignal || !todaysDayOfWeekSignal) {
				Log.error(`${this.name} choreDataSignal or todaysDayOfWeekSignal is not initialized`);
				return container;
			}
			render(() => {
				const _self$ = this;
				return createComponent(App, {
					choreData: choreDataSignal,
					todaysDayOfWeek: todaysDayOfWeekSignal,
					get config() {
						return _self$.config;
					},
					onToggle: handleToggle
				});
			}, container);
			this.rootContainer = container;
			return container;
		},
		toggleChoreCompletion(choreId, completed) {
			Log.debug(`${this.name} toggling chore ${choreId} to ${completed}`);
			this.sendSocketNotification?.(SocketNotifications.CHORE_TOGGLE, {
				choreId,
				completed
			});
		},
		socketNotificationReceived(notificationIdentifier, payload) {
			Log.debug(`${this.name} received socket notification: '${notificationIdentifier}'`);
			switch (notificationIdentifier) {
				case SocketNotifications.CONFIG_RESPONSE:
					Log.debug("Received config response");
					break;
				case SocketNotifications.CHORE_DATA:
					this.setChoreDataAndDay?.(payload);
					break;
				case SocketNotifications.CHORE_UPDATE_RESULT:
					Log.debug("Received chore update result");
					this.loadData();
					break;
				default: Log.warn(`${this.name} received unknown socket notification: '${notificationIdentifier}'`);
			}
		},
		loadData() {
			Log.debug(`${this.name} is loading data`);
			this.sendSocketNotification?.(SocketNotifications.CONFIG_REQUEST, this.config);
		}
	});
	//#endregion
});
