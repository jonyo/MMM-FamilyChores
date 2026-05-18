// ⚠️  STOP — This file is auto-generated and will be overwritten!
// Edit src/admin/*.tsx files and run: pnpm build
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
	var $PROXY = Symbol("solid-proxy");
	var SUPPORTS_PROXY = typeof Proxy === "function";
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
	function children(fn) {
		const children = createMemo(fn);
		const memo = createMemo(() => resolveChildren(children()));
		memo.toArray = () => {
			const c = memo();
			return Array.isArray(c) ? c : c != null ? [c] : [];
		};
		return memo;
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
	function resolveChildren(children) {
		if (typeof children === "function" && !children.length) return resolveChildren(children());
		if (Array.isArray(children)) {
			const results = [];
			for (let i = 0; i < children.length; i++) {
				const result = resolveChildren(children[i]);
				Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
			}
			return results;
		}
		return children;
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
	function trueFn() {
		return true;
	}
	var propTraps = {
		get(_, property, receiver) {
			if (property === $PROXY) return receiver;
			return _.get(property);
		},
		has(_, property) {
			if (property === $PROXY) return true;
			return _.has(property);
		},
		set: trueFn,
		deleteProperty: trueFn,
		getOwnPropertyDescriptor(_, property) {
			return {
				configurable: true,
				enumerable: true,
				get() {
					return _.get(property);
				},
				set: trueFn,
				deleteProperty: trueFn
			};
		},
		ownKeys(_) {
			return _.keys();
		}
	};
	function resolveSource(s) {
		return !(s = typeof s === "function" ? s() : s) ? {} : s;
	}
	function resolveSources() {
		for (let i = 0, length = this.length; i < length; ++i) {
			const v = this[i]();
			if (v !== void 0) return v;
		}
	}
	function mergeProps(...sources) {
		let proxy = false;
		for (let i = 0; i < sources.length; i++) {
			const s = sources[i];
			proxy = proxy || !!s && $PROXY in s;
			sources[i] = typeof s === "function" ? (proxy = true, createMemo(s)) : s;
		}
		if (SUPPORTS_PROXY && proxy) return new Proxy({
			get(property) {
				for (let i = sources.length - 1; i >= 0; i--) {
					const v = resolveSource(sources[i])[property];
					if (v !== void 0) return v;
				}
			},
			has(property) {
				for (let i = sources.length - 1; i >= 0; i--) if (property in resolveSource(sources[i])) return true;
				return false;
			},
			keys() {
				const keys = [];
				for (let i = 0; i < sources.length; i++) keys.push(...Object.keys(resolveSource(sources[i])));
				return [...new Set(keys)];
			}
		}, propTraps);
		const sourcesMap = {};
		const defined = Object.create(null);
		for (let i = sources.length - 1; i >= 0; i--) {
			const source = sources[i];
			if (!source) continue;
			const sourceKeys = Object.getOwnPropertyNames(source);
			for (let i = sourceKeys.length - 1; i >= 0; i--) {
				const key = sourceKeys[i];
				if (key === "__proto__" || key === "constructor") continue;
				const desc = Object.getOwnPropertyDescriptor(source, key);
				if (!defined[key]) defined[key] = desc.get ? {
					enumerable: true,
					configurable: true,
					get: resolveSources.bind(sourcesMap[key] = [desc.get.bind(source)])
				} : desc.value !== void 0 ? desc : void 0;
				else {
					const sources = sourcesMap[key];
					if (sources) {
						if (desc.get) sources.push(desc.get.bind(source));
						else if (desc.value !== void 0) sources.push(() => desc.value);
					}
				}
			}
		}
		const target = {};
		const definedKeys = Object.keys(defined);
		for (let i = definedKeys.length - 1; i >= 0; i--) {
			const key = definedKeys[i], desc = defined[key];
			if (desc && desc.get) Object.defineProperty(target, key, desc);
			else target[key] = desc ? desc.value : void 0;
		}
		return target;
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
	function Switch(props) {
		const chs = children(() => props.children);
		const switchFunc = createMemo(() => {
			const ch = chs();
			const mps = Array.isArray(ch) ? ch : [ch];
			let func = () => void 0;
			for (let i = 0; i < mps.length; i++) {
				const index = i;
				const mp = mps[i];
				const prevFunc = func;
				const conditionValue = createMemo(() => prevFunc() ? void 0 : mp.when, void 0, void 0);
				const condition = mp.keyed ? conditionValue : createMemo(conditionValue, void 0, { equals: (a, b) => !a === !b });
				func = () => prevFunc() || (condition() ? [
					index,
					conditionValue,
					mp
				] : void 0);
			}
			return func;
		});
		return createMemo(() => {
			const sel = switchFunc()();
			if (!sel) return props.fallback;
			const [index, conditionValue, mp] = sel;
			const child = mp.children;
			return typeof child === "function" && child.length > 0 ? untrack(() => child(mp.keyed ? conditionValue() : () => {
				if (untrack(switchFunc)()?.[0] !== index) throw narrowedError("Match");
				return conditionValue();
			})) : child;
		}, void 0, void 0);
	}
	function Match(props) {
		return props;
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
	function classList(node, value, prev = {}) {
		const classKeys = Object.keys(value || {}), prevKeys = Object.keys(prev);
		let i, len;
		for (i = 0, len = prevKeys.length; i < len; i++) {
			const key = prevKeys[i];
			if (!key || key === "undefined" || value[key]) continue;
			toggleClassKey(node, key, false);
			delete prev[key];
		}
		for (i = 0, len = classKeys.length; i < len; i++) {
			const key = classKeys[i], classValue = !!value[key];
			if (!key || key === "undefined" || prev[key] === classValue || !classValue) continue;
			toggleClassKey(node, key, true);
			prev[key] = classValue;
		}
		return prev;
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
	function toggleClassKey(node, key, value) {
		const classNames = key.trim().split(/\s+/);
		for (let i = 0, nameLen = classNames.length; i < nameLen; i++) node.classList.toggle(classNames[i], value);
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
	//#region src/utils/validation.ts
	/**
	* Validates that an ID contains only safe characters (a-z, 0-9, hyphen)
	* This is a simplified UUID-like validation to prevent injection attacks
	* in URL paths where IDs are used directly.
	*
	* @param id - The ID to validate
	* @returns true if the ID contains only safe characters, false otherwise
	*/
	var isValidId = (id) => {
		return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(id);
	};
	/**
	* Validates an ID and throws an error if it contains unsafe characters
	*
	* @param id - The ID to validate
	* @throws Error if the ID contains unsafe characters
	*/
	var validateId = (id) => {
		if (!isValidId(id)) throw new Error(`Invalid ID: ${id}. ID must contain only lowercase letters, numbers, and hyphens.`);
	};
	//#endregion
	//#region src/api/client.ts
	var API_BASE_URL = "/MMM-FamilyChores";
	var handleResponse = async (response) => {
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			if (errorData?.error) throw new Error(errorData.error);
			throw new Error(`Request failed with status ${response.status}`);
		}
		return response.json();
	};
	//#endregion
	//#region src/api/chores.ts
	var createChore = async (data) => {
		return handleResponse(await fetch(`${API_BASE_URL}/chores`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		}));
	};
	var updateChore = async (id, data) => {
		validateId(id);
		return handleResponse(await fetch(`${API_BASE_URL}/chores/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		}));
	};
	var deleteChore = async (id) => {
		validateId(id);
		await handleResponse(await fetch(`${API_BASE_URL}/chores/${id}`, { method: "DELETE" }));
	};
	var copyChores = async (data) => {
		try {
			await handleResponse(await fetch(`${API_BASE_URL}/copy-chores`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data)
			}));
		} catch (error) {
			if (error instanceof TypeError && error.message === "Failed to fetch") throw new Error("Network error: Could not connect to the server. Is the admin server running?");
			throw error;
		}
	};
	//#endregion
	//#region src/api/history.ts
	var getHistory = async (personId) => {
		const url = personId ? `${API_BASE_URL}/history?personId=${personId}` : `${API_BASE_URL}/history`;
		return await handleResponse(await fetch(url));
	};
	//#endregion
	//#region src/api/people.ts
	var createPerson = async (data) => {
		return handleResponse(await fetch(`${API_BASE_URL}/people`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		}));
	};
	var updatePerson = async (id, data) => {
		validateId(id);
		return handleResponse(await fetch(`${API_BASE_URL}/people/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		}));
	};
	var deletePerson = async (id) => {
		validateId(id);
		await handleResponse(await fetch(`${API_BASE_URL}/people/${id}`, { method: "DELETE" }));
	};
	//#endregion
	//#region src/api/settings.ts
	/**
	* Update global settings
	*/
	var updateSettings = async (data) => {
		return await handleResponse(await fetch(`${API_BASE_URL}/settings`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		}));
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
	//#region src/utils/browser.ts
	/**
	* Client-Side Only Utilities
	*
	* This file contains utilities that require browser/DOM APIs and can only run in a browser environment.
	* These utilities are excluded from Node.js tests in the vitest configuration.
	*/
	/**
	* Generate a random pastel color (light, soft colors suitable for dark backgrounds)
	* Returns a hex color string in #RRGGBB format
	*/
	var generatePastelColor = () => {
		const r = 180 + Math.floor(Math.random() * 75);
		const g = 180 + Math.floor(Math.random() * 75);
		const b = 180 + Math.floor(Math.random() * 75);
		const toHex = (value) => {
			const hex = value.toString(16);
			return hex.length === 1 ? `0${hex}` : hex;
		};
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	};
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
	* Gets the local day name in abbreviated format (Sun, Mon, Tue, etc.)
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
	var getLocalDayNameShort = (date = /* @__PURE__ */ new Date()) => {
		return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
	};
	/**
	* Gets the local month name in abbreviated format (Jan, Feb, Mar, etc.)
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
	var getLocalMonthNameShort = (date = /* @__PURE__ */ new Date()) => {
		return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
	};
	/**
	* Gets the local day of month as a number
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
	var getLocalDayOfMonth = (date = /* @__PURE__ */ new Date()) => {
		const formatter = new Intl.DateTimeFormat("en-US", { day: "numeric" });
		return parseInt(formatter.format(date), 10);
	};
	//#endregion
	//#region src/admin/button.tsx
	var _tmpl$$9 = /* @__PURE__ */ template(`<button class="cursor-pointer rounded-lg border-none px-5 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md">`);
	var Button = (props) => {
		return (() => {
			var _el$ = _tmpl$$9();
			_el$.$$click = (event) => props.onClick?.(event);
			insert(_el$, () => props.children);
			createRenderEffect((_p$) => {
				var _v$ = props.id, _v$2 = props.dataTestId, _v$3 = props.type ?? "button", _v$4 = {
					"bg-indigo-600 text-white hover:bg-indigo-700": props.variant === "primary",
					"bg-gray-600 text-white hover:bg-gray-700": props.variant === "secondary",
					"bg-yellow-500 text-gray-900 hover:bg-yellow-600": props.variant === "warning",
					"bg-red-600 text-white hover:bg-red-700": props.variant === "danger",
					"bg-green-600 text-white hover:bg-green-700": props.variant === "success",
					"px-3 py-1.5 text-xs": props.size === "sm",
					[props.class || ""]: !!props.class,
					...props.classList
				}, _v$5 = props.disabled;
				_v$ !== _p$.e && setAttribute(_el$, "id", _p$.e = _v$);
				_v$2 !== _p$.t && setAttribute(_el$, "data-testid", _p$.t = _v$2);
				_v$3 !== _p$.a && setAttribute(_el$, "type", _p$.a = _v$3);
				_p$.o = classList(_el$, _v$4, _p$.o);
				_v$5 !== _p$.i && (_el$.disabled = _p$.i = _v$5);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0,
				o: void 0,
				i: void 0
			});
			return _el$;
		})();
	};
	delegateEvents(["click"]);
	//#endregion
	//#region src/admin/tooltip.tsx
	var _tmpl$$8 = /* @__PURE__ */ template(`<span>`);
	var Tooltip = (rawProps) => {
		const props = mergeProps({
			position: "above",
			align: "left",
			multiline: false,
			class: "",
			classList: {}
		}, rawProps);
		return (() => {
			var _el$ = _tmpl$$8();
			insert(_el$, () => props.children);
			createRenderEffect((_p$) => {
				var _v$ = {
					tooltip: !!props.text,
					"tooltip-multiline": !!props.text && props.multiline,
					"tooltip-above": !!props.text && props.position === "above",
					"tooltip-below": !!props.text && props.position === "below",
					"tooltip-left": !!props.text && props.position === "left",
					"tooltip-right": !!props.text && props.position === "right",
					"tooltip-above-right": !!props.text && props.position === "above-right",
					"tooltip-below-right": !!props.text && props.position === "below-right",
					"tooltip-align-left": !!props.text && props.align === "left",
					"tooltip-align-center": !!props.text && props.align === "center",
					"tooltip-align-right": !!props.text && props.align === "right",
					[props.class || ""]: !!props.class,
					...props.classList
				}, _v$2 = props.text || "", _v$3 = props.dataTestId || "tooltip";
				_p$.e = classList(_el$, _v$, _p$.e);
				_v$2 !== _p$.t && setAttribute(_el$, "data-tooltip", _p$.t = _v$2);
				_v$3 !== _p$.a && setAttribute(_el$, "data-testid", _p$.a = _v$3);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0
			});
			return _el$;
		})();
	};
	//#endregion
	//#region src/admin/chore-history-modal.tsx
	var _tmpl$$7 = /* @__PURE__ */ template(`<div class="py-4 text-center text-slate-500">Loading history...`), _tmpl$2$5 = /* @__PURE__ */ template(`<div class="py-4 text-center text-red-600">Error: `), _tmpl$3$4 = /* @__PURE__ */ template(`<div class=overflow-x-auto><table class="w-full border-collapse border border-slate-200"data-testid=history-table><thead><tr><th class="border border-slate-200 p-2.5 text-left text-base font-medium whitespace-nowrap text-slate-900">Chore</th></tr></thead><tbody>`), _tmpl$4$2 = /* @__PURE__ */ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"data-testid=modal><div class="max-h-[90vh] w-[90%] max-w-[95vw] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"data-testid=modal-content><h3 class="mb-5 text-2xl text-indigo-600">'s Chore History</h3><div class="mt-6 flex justify-end gap-2.5">`), _tmpl$5$2 = /* @__PURE__ */ template(`<th class="relative h-[100px] w-[50px] overflow-visible border border-slate-200 p-2.5 text-left text-base font-medium text-slate-900"><span class="absolute top-1/2 left-1/2 -translate-1/2 -rotate-90 whitespace-nowrap">`), _tmpl$6$2 = /* @__PURE__ */ template(`<tr><td class="border border-slate-200 p-2.5 text-base whitespace-nowrap text-slate-900">`), _tmpl$7$1 = /* @__PURE__ */ template(`<td class="border border-slate-200 p-2.5 text-center">`), _tmpl$8$1 = /* @__PURE__ */ template(`<span style=opacity:0;width:32px;height:32px;display:inline-block>`);
	var ChoreHistoryModal = (props) => {
		const [history, setHistory] = createSignal([]);
		const [loading, setLoading] = createSignal(true);
		const [error, setError] = createSignal(null);
		onMount(async () => {
			try {
				setHistory(await getHistory(props.person.id));
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load history");
			} finally {
				setLoading(false);
			}
		});
		const getDays = () => {
			const days = [];
			for (let i = 13; i >= 0; i--) {
				const date = /* @__PURE__ */ new Date();
				date.setDate(date.getDate() - i);
				const dayNameShort = getLocalDayNameShort(date);
				const monthShort = getLocalMonthNameShort(date);
				const dayOfMonth = getLocalDayOfMonth(date);
				days.push({
					date: getLocalDateString(date),
					dayName: getLocalDayName(date),
					display: `${dayNameShort} ${monthShort} ${dayOfMonth}`
				});
			}
			return days;
		};
		const getPersonChores = () => {
			return props.choreData.chores.filter((chore) => {
				if (chore.type === "personal" && chore.assignedTo === props.person.id) return true;
				if (chore.type === "rotating" && chore.rotation?.includes(props.person.id)) return true;
				return false;
			});
		};
		const getCompletionDetails = (choreId, date) => {
			return history().find((dc) => dc.choreId === choreId && dc.date === date);
		};
		const isSkipDay = (chore, day) => {
			if (!chore.skipDays || chore.skipDays.length === 0) return false;
			return chore.skipDays.includes(day.dayName);
		};
		return (() => {
			var _el$ = _tmpl$4$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$12 = _el$3.nextSibling;
			insert(_el$3, () => escapeHtml(props.person.name), _el$4);
			insert(_el$2, createComponent(Show, {
				get when() {
					return loading();
				},
				get children() {
					return _tmpl$$7();
				}
			}), _el$12);
			insert(_el$2, createComponent(Show, {
				get when() {
					return error();
				},
				get children() {
					var _el$6 = _tmpl$2$5();
					_el$6.firstChild;
					insert(_el$6, () => escapeHtml(error() ?? "Unknown error"), null);
					return _el$6;
				}
			}), _el$12);
			insert(_el$2, createComponent(Show, {
				get when() {
					return memo(() => !!!loading())() && !error();
				},
				get children() {
					var _el$8 = _tmpl$3$4(), _el$0 = _el$8.firstChild.firstChild, _el$1 = _el$0.firstChild;
					_el$1.firstChild;
					var _el$11 = _el$0.nextSibling;
					insert(_el$1, createComponent(For, {
						get each() {
							return getDays();
						},
						children: (day) => (() => {
							var _el$13 = _tmpl$5$2(), _el$14 = _el$13.firstChild;
							insert(_el$14, () => day.display);
							return _el$13;
						})()
					}), null);
					insert(_el$11, createComponent(For, {
						get each() {
							return getPersonChores();
						},
						children: (chore) => (() => {
							var _el$15 = _tmpl$6$2(), _el$16 = _el$15.firstChild;
							insert(_el$16, () => escapeHtml(chore.name), null);
							insert(_el$16, createComponent(Show, {
								get when() {
									return chore.type === "rotating";
								},
								get children() {
									return [" ", createComponent(Tooltip, {
										text: "Rotating chore",
										position: "above-right",
										multiline: true,
										"class": "text-sm",
										children: "🔄"
									})];
								}
							}), null);
							insert(_el$15, createComponent(For, {
								get each() {
									return getDays();
								},
								children: (day) => {
									const completion = getCompletionDetails(chore.id, day.date);
									const skipDay = isSkipDay(chore, day);
									const emptyDay = !skipDay && !completion;
									const getEmptyTooltip = () => {
										if (chore.type === "rotating") return "Either it was someone else's turn (rotating chore), Magic Mirror was not running this day, or the chore was not created yet.";
										return "Either Magic Mirror was not running this day, or the chore was not created yet.";
									};
									const getTooltipText = () => {
										if (completion?.completed) return `Completed at ${completion.completedAt} (24h)`;
										if (completion && !completion.completed) return "Not completed";
										if (skipDay) return "Skip day";
										if (emptyDay) return getEmptyTooltip();
										return "";
									};
									return (() => {
										var _el$17 = _tmpl$7$1();
										_el$17.classList.toggle("bg-slate-100", !!skipDay);
										insert(_el$17, createComponent(Switch, {
											get fallback() {
												return createComponent(Tooltip, {
													get text() {
														return getTooltipText();
													},
													position: "above",
													align: "right",
													multiline: emptyDay,
													get children() {
														return _tmpl$8$1();
													}
												});
											},
											get children() {
												return [createComponent(Match, {
													get when() {
														return completion?.completed;
													},
													get children() {
														return createComponent(Tooltip, {
															get text() {
																return getTooltipText();
															},
															position: "above",
															align: "right",
															get classList() {
																return {
																	"inline-block": true,
																	"w-8": true,
																	"h-8": true,
																	"rounded-full": true,
																	"text-center": true,
																	"leading-8": true,
																	"bg-red-500": completion?.wasLate,
																	"bg-green-500": !completion?.wasLate,
																	"text-white": true
																};
															},
															get dataTestId() {
																return completion?.wasLate ? "completion-late" : "completion-ontime";
															},
															children: "✓"
														});
													}
												}), createComponent(Match, {
													get when() {
														return completion?.completed === false;
													},
													get children() {
														return createComponent(Tooltip, {
															get text() {
																return getTooltipText();
															},
															position: "above",
															align: "right",
															"class": "inline-block size-8  rounded-full bg-yellow-500 text-center leading-8 text-slate-900",
															dataTestId: "completion-missed",
															children: "✗"
														});
													}
												})];
											}
										}));
										return _el$17;
									})();
								}
							}), null);
							return _el$15;
						})()
					}));
					return _el$8;
				}
			}), _el$12);
			insert(_el$12, createComponent(Button, {
				type: "button",
				variant: "secondary",
				onClick: () => props.closeModal(),
				dataTestId: "close-button",
				children: "Close"
			}));
			return _el$;
		})();
	};
	//#endregion
	//#region src/admin/copy-chores-modal.tsx
	var _tmpl$$6 = /* @__PURE__ */ template(`<div class="my-2.5 text-slate-500 italic"data-testid=empty-message><p>No other people available to copy chores to.`), _tmpl$2$4 = /* @__PURE__ */ template(`<form><div class=mb-5><div class="mb-3 block font-medium text-slate-900">Select Person to Copy To</div><select id=toPerson required class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><option value>-- Select a person --</option></select></div><div class=mb-5><div class="mb-3 block font-medium text-slate-900">Select Chores to Copy</div><div class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"data-testid=checkbox-list></div></div><div class="mt-6 flex justify-end gap-2.5">`), _tmpl$3$3 = /* @__PURE__ */ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"><h3 class="mb-5 text-2xl text-indigo-600">Copy Chores</h3><div class="mb-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-base"data-testid=copy-from-display><span class="inline-block size-6 rounded-full border-2 border-black/10 align-middle"data-testid=person-color-badge></span><strong>From:</strong> `), _tmpl$4$1 = /* @__PURE__ */ template(`<div class="my-2.5 text-slate-500 italic"data-testid=empty-message><p>No personal chores to copy for <!>.`), _tmpl$5$1 = /* @__PURE__ */ template(`<option>`), _tmpl$6$1 = /* @__PURE__ */ template(`<label class="flex cursor-pointer items-center gap-2 font-normal"><input type=checkbox class="size-4.5 cursor-pointer">`);
	var CopyChoresModal = (props) => {
		const personalChores = createMemo(() => {
			return props.choreData.chores.filter((chore) => chore.type === ChoreType.PERSONAL && chore.assignedTo === props.fromPerson.id);
		});
		const availablePeople = createMemo(() => {
			return props.choreData.people.filter((person) => person.id !== props.fromPerson.id);
		});
		const [selectedChoreIds, setSelectedChoreIds] = createSignal([]);
		const [toPersonId, setToPersonId] = createSignal("");
		const [loading, setLoading] = createSignal(false);
		onMount(() => {
			setSelectedChoreIds(personalChores().map((chore) => chore.id));
		});
		const handleChoreToggle = (choreId, checked) => {
			if (checked) setSelectedChoreIds([...selectedChoreIds(), choreId]);
			else setSelectedChoreIds(selectedChoreIds().filter((id) => id !== choreId));
		};
		const handleSubmit = async (event) => {
			event.preventDefault();
			if (!toPersonId()) {
				alert("Please select a person to copy chores to.");
				return;
			}
			if (selectedChoreIds().length === 0) {
				alert("Please select at least one chore to copy.");
				return;
			}
			setLoading(true);
			try {
				await copyChores({
					fromPersonId: props.fromPerson.id,
					toPersonId: toPersonId(),
					choreIds: selectedChoreIds()
				});
				props.closeModal();
			} catch (error) {
				console.error("Error copying chores:", error);
				alert(`Failed to copy chores: ${error instanceof Error ? error.message : "Unknown error"}`);
			} finally {
				setLoading(false);
			}
		};
		return (() => {
			var _el$ = _tmpl$3$3(), _el$2 = _el$.firstChild, _el$4 = _el$2.firstChild.nextSibling, _el$5 = _el$4.firstChild;
			_el$5.nextSibling.nextSibling;
			insert(_el$4, () => escapeHtml(props.fromPerson.name), null);
			insert(_el$2, createComponent(Show, {
				get when() {
					return personalChores().length > 0;
				},
				get fallback() {
					return (() => {
						var _el$17 = _tmpl$4$1(), _el$18 = _el$17.firstChild, _el$21 = _el$18.firstChild.nextSibling;
						_el$21.nextSibling;
						insert(_el$18, () => escapeHtml(props.fromPerson.name), _el$21);
						insert(_el$17, createComponent(Button, {
							type: "button",
							variant: "secondary",
							onClick: () => props.closeModal(),
							children: "Close"
						}), null);
						return _el$17;
					})();
				},
				get children() {
					return [createComponent(Show, {
						get when() {
							return availablePeople().length === 0;
						},
						get children() {
							var _el$8 = _tmpl$$6();
							_el$8.firstChild;
							insert(_el$8, createComponent(Button, {
								type: "button",
								variant: "secondary",
								onClick: () => props.closeModal(),
								children: "Close"
							}), null);
							return _el$8;
						}
					}), createComponent(Show, {
						get when() {
							return availablePeople().length > 0;
						},
						get children() {
							var _el$0 = _tmpl$2$4(), _el$1 = _el$0.firstChild, _el$11 = _el$1.firstChild.nextSibling;
							_el$11.firstChild;
							var _el$13 = _el$1.nextSibling, _el$15 = _el$13.firstChild.nextSibling, _el$16 = _el$13.nextSibling;
							_el$0.addEventListener("submit", handleSubmit);
							_el$11.$$input = (e) => setToPersonId(e.currentTarget.value);
							insert(_el$11, createComponent(For, {
								get each() {
									return availablePeople();
								},
								children: (person) => (() => {
									var _el$22 = _tmpl$5$1();
									insert(_el$22, () => escapeHtml(person.name));
									createRenderEffect(() => _el$22.value = person.id);
									return _el$22;
								})()
							}), null);
							insert(_el$15, createComponent(For, {
								get each() {
									return personalChores();
								},
								children: (chore) => (() => {
									var _el$23 = _tmpl$6$1(), _el$24 = _el$23.firstChild;
									_el$24.$$input = (e) => handleChoreToggle(chore.id, e.currentTarget.checked);
									insert(_el$23, () => escapeHtml(chore.name), null);
									createRenderEffect(() => _el$24.value = chore.id);
									createRenderEffect(() => _el$24.checked = selectedChoreIds().includes(chore.id));
									return _el$23;
								})()
							}));
							insert(_el$16, createComponent(Button, {
								type: "button",
								variant: "secondary",
								onClick: () => props.closeModal(),
								children: "Cancel"
							}), null);
							insert(_el$16, createComponent(Button, {
								type: "submit",
								variant: "primary",
								get disabled() {
									return loading();
								},
								get children() {
									return loading() ? "Copying..." : "Copy";
								}
							}), null);
							createRenderEffect(() => _el$11.value = toPersonId());
							return _el$0;
						}
					})];
				}
			}), null);
			createRenderEffect((_$p) => style(_el$5, `background-color: ${props.fromPerson.color}`, _$p));
			return _el$;
		})();
	};
	delegateEvents(["input"]);
	//#endregion
	//#region src/admin/person-modal.tsx
	var _tmpl$$5 = /* @__PURE__ */ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"><h3 class="mb-5 text-2xl text-indigo-600"></h3><form><div class=mb-5><label for=personName class="mb-3 block font-medium text-slate-900">Name</label><input type=text id=personName required class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"></div><div class=mb-5><label for=personColor class="mb-3 block font-medium text-slate-900">Color</label><div class="flex items-center gap-2.5"><input type=color id=personColor required class="h-10 w-15 cursor-pointer rounded-lg border border-slate-300"></div></div><div class="mt-6 flex justify-end gap-2.5">`);
	var PersonModal = (props) => {
		const [name, setName] = createSignal(props.initialPerson?.name ?? "");
		const [color, setColor] = createSignal(props.initialPerson?.color ?? generatePastelColor());
		const handleSubmit = async (event) => {
			event.preventDefault();
			try {
				if (props.initialPerson?.id) {
					const body = {
						name: name(),
						color: color()
					};
					await updatePerson(props.initialPerson.id, body);
				} else await createPerson({
					name: name(),
					color: color()
				});
				props.closeModal();
			} catch (error) {
				console.error("Error saving person:", error);
				alert(`Failed to save person: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		return (() => {
			var _el$ = _tmpl$$5(), _el$3 = _el$.firstChild.firstChild, _el$4 = _el$3.nextSibling, _el$5 = _el$4.firstChild, _el$7 = _el$5.firstChild.nextSibling, _el$8 = _el$5.nextSibling, _el$0 = _el$8.firstChild.nextSibling, _el$1 = _el$0.firstChild, _el$10 = _el$8.nextSibling;
			insert(_el$3, () => props.initialPerson ? "Edit Person" : "Add Person");
			_el$4.addEventListener("submit", handleSubmit);
			_el$7.$$input = (e) => setName(e.currentTarget.value);
			_el$1.$$input = (e) => setColor(e.currentTarget.value);
			insert(_el$0, createComponent(Button, {
				type: "button",
				variant: "secondary",
				size: "sm",
				onClick: () => setColor(generatePastelColor()),
				children: "Randomize"
			}), null);
			insert(_el$10, createComponent(Button, {
				type: "button",
				variant: "secondary",
				onClick: () => props.closeModal(),
				children: "Cancel"
			}), null);
			insert(_el$10, createComponent(Button, {
				type: "submit",
				variant: "primary",
				get children() {
					return props.initialPerson ? "Save" : "Add";
				}
			}), null);
			createRenderEffect(() => _el$7.value = name());
			createRenderEffect(() => _el$1.value = color());
			return _el$;
		})();
	};
	delegateEvents(["input"]);
	//#endregion
	//#region src/admin/personal-chore-modal.tsx
	var _tmpl$$4 = /* @__PURE__ */ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"><h3 class="mb-5 text-2xl text-indigo-600">Error</h3><p>Person not found. Please refresh the page.`), _tmpl$2$3 = /* @__PURE__ */ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"data-testid=modal><div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"data-testid=modal-content><h3 class="mb-5 text-2xl text-indigo-600"></h3><div class="mb-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-base"data-testid=assigned-person-display><span class="inline-block size-6 rounded-full border-2 border-black/10 align-middle"data-testid=person-color-badge></span><strong>Assigned to:</strong> </div><form><div class=mb-5><label for=choreName class="mb-3 block font-medium text-slate-900">Chore Name</label><input type=text id=choreName required class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"></div><div class=mb-5><label for=deadline class="mb-3 block font-medium text-slate-900">Deadline (optional)</label><input type=time id=deadline class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"></div><div class=mb-5><div class="mb-3 block font-medium text-slate-900">Skip Days</div><div class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"></div></div><div class=mb-5><label for=skipDayVisibility class="mb-3 block font-medium text-slate-900">Skip Day Visibility</label><select id=skipDayVisibility class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><option>Hide</option><option>Show Always</option><option>Show If Overdue</option></select></div><div class="mt-6 flex justify-end gap-2.5">`), _tmpl$3$2 = /* @__PURE__ */ template(`<label class="flex cursor-pointer items-center gap-2 font-normal"><input type=checkbox class="size-4.5 cursor-pointer">`);
	var PersonalChoreModal = (props) => {
		const [name, setName] = createSignal(props.initialChore?.name ?? "");
		const [deadline, setDeadline] = createSignal(props.initialChore?.deadline ?? "");
		const [skipDayVisibility, setSkipDayVisibility] = createSignal(props.initialChore?.skipDayVisibility ?? SkipDayVisibility.HIDE);
		const [skipDays, setSkipDays] = createSignal(props.initialChore?.skipDays ?? []);
		const handleSkipDayChange = (day, checked) => {
			if (checked) setSkipDays([...skipDays(), day]);
			else setSkipDays(skipDays().filter((d) => d !== day));
		};
		const handleSubmit = async (event) => {
			event.preventDefault();
			const person = props.person;
			if (!person) {
				console.error("No person selected");
				return;
			}
			try {
				if (props.initialChore?.id) {
					const body = {
						name: name(),
						type: ChoreType.PERSONAL,
						assignedTo: person.id,
						deadline: deadline() || void 0,
						skipDays: skipDays(),
						skipDayVisibility: skipDayVisibility()
					};
					await updateChore(props.initialChore.id, body);
				} else await createChore({
					name: name(),
					type: ChoreType.PERSONAL,
					assignedTo: person.id,
					deadline: deadline() || void 0,
					skipDays: skipDays(),
					skipDayVisibility: skipDayVisibility()
				});
				props.closeModal();
			} catch (error) {
				console.error("Error saving chore:", error);
				alert(`Failed to save chore: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		return createComponent(Show, {
			get when() {
				return props.person;
			},
			keyed: true,
			get fallback() {
				return (() => {
					var _el$ = _tmpl$$4(), _el$2 = _el$.firstChild;
					_el$2.firstChild.nextSibling;
					insert(_el$2, createComponent(Button, {
						type: "button",
						variant: "secondary",
						onClick: () => props.closeModal(),
						children: "Close"
					}), null);
					return _el$;
				})();
			},
			children: (person) => (() => {
				var _el$5 = _tmpl$2$3(), _el$7 = _el$5.firstChild.firstChild, _el$8 = _el$7.nextSibling, _el$9 = _el$8.firstChild;
				_el$9.nextSibling.nextSibling;
				var _el$10 = _el$8.nextSibling, _el$11 = _el$10.firstChild, _el$13 = _el$11.firstChild.nextSibling, _el$14 = _el$11.nextSibling, _el$16 = _el$14.firstChild.nextSibling, _el$17 = _el$14.nextSibling, _el$19 = _el$17.firstChild.nextSibling, _el$20 = _el$17.nextSibling, _el$22 = _el$20.firstChild.nextSibling, _el$23 = _el$22.firstChild, _el$24 = _el$23.nextSibling, _el$25 = _el$24.nextSibling, _el$26 = _el$20.nextSibling;
				insert(_el$7, () => props.initialChore ? "Edit Personal Chore" : "Add Personal Chore");
				insert(_el$8, () => person.name, null);
				_el$10.addEventListener("submit", handleSubmit);
				_el$13.$$input = (e) => setName(e.currentTarget.value);
				_el$16.$$input = (e) => setDeadline(e.currentTarget.value);
				insert(_el$19, createComponent(For, {
					get each() {
						return Object.values(DayOfWeek);
					},
					children: (day) => (() => {
						var _el$27 = _tmpl$3$2(), _el$28 = _el$27.firstChild;
						_el$28.$$input = (e) => handleSkipDayChange(day, e.currentTarget.checked);
						_el$28.value = day;
						insert(_el$27, () => day.charAt(0).toUpperCase() + day.slice(1), null);
						createRenderEffect(() => _el$28.checked = skipDays().includes(day));
						return _el$27;
					})()
				}));
				_el$22.$$input = (e) => setSkipDayVisibility(e.currentTarget.value);
				insert(_el$26, createComponent(Button, {
					type: "button",
					variant: "secondary",
					onClick: () => props.closeModal(),
					children: "Cancel"
				}), null);
				insert(_el$26, createComponent(Button, {
					type: "submit",
					variant: "primary",
					get children() {
						return props.initialChore ? "Save" : "Add";
					}
				}), null);
				createRenderEffect((_$p) => style(_el$9, `background-color: ${person.color}`, _$p));
				createRenderEffect(() => _el$13.value = name());
				createRenderEffect(() => _el$16.value = deadline());
				createRenderEffect(() => _el$23.value = SkipDayVisibility.HIDE);
				createRenderEffect(() => _el$24.value = SkipDayVisibility.SHOW_ALWAYS);
				createRenderEffect(() => _el$25.value = SkipDayVisibility.SHOW_IF_OVERDUE);
				createRenderEffect(() => _el$22.value = skipDayVisibility());
				return _el$5;
			})()
		});
	};
	delegateEvents(["input"]);
	//#endregion
	//#region src/admin/rotating-chore.tsx
	var _tmpl$$3 = /* @__PURE__ */ template(`<p class="mt-1.25 text-sm text-indigo-600">Deadline: `), _tmpl$2$2 = /* @__PURE__ */ template(`<div class="rounded-lg border border-slate-200 bg-slate-50 p-5 transition-all hover:border-indigo-600 hover:shadow-md"><div class=flex-1><h3 class="mb-1.5 text-xl text-slate-900"> <span class="ml-2 inline-block rounded bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">Rotating</span></h3><p class="text-sm text-slate-500">Current: </p><p class="text-sm text-slate-500">Rotation: </p><p class="mt-1.25 text-sm text-slate-500">Skip days: </p></div><div class="flex gap-2.5">`);
	/** Format skip days for display */
	var formatSkipDays$1 = (skipDays) => {
		if (!skipDays || skipDays.length === 0) return "None";
		return skipDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
	};
	/** Display card for a rotating chore in the admin interface */
	var RotatingChoreCard = (props) => {
		const rotationNames = createMemo(() => props.chore.rotation.map((personId) => {
			const person = props.people.find((p) => p.id === personId);
			return person ? escapeHtml(person.name) : "Unknown";
		}).join(", "));
		const includesEveryone = createMemo(() => {
			const peopleLength = props.people.length ?? 0;
			return props.chore.rotation.length === peopleLength && props.chore.rotation.every((personId) => props.people.some((p) => p.id === personId));
		});
		const rotationText = createMemo(() => includesEveryone() ? "Everyone" : rotationNames());
		const currentAssignee = createMemo(() => {
			const currentPersonId = props.chore.rotation[props.chore.rotatingIndex ?? 0];
			const currentPerson = props.people.find((p) => p.id === currentPersonId);
			return currentPerson ? escapeHtml(currentPerson.name) : "Unassigned";
		});
		return (() => {
			var _el$ = _tmpl$2$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$3.nextSibling;
			_el$5.firstChild;
			var _el$7 = _el$5.nextSibling;
			_el$7.firstChild;
			var _el$1 = _el$7.nextSibling;
			_el$1.firstChild;
			var _el$11 = _el$2.nextSibling;
			insert(_el$3, () => escapeHtml(props.chore.name), _el$4);
			insert(_el$5, currentAssignee, null);
			insert(_el$7, rotationText, null);
			insert(_el$2, createComponent(Show, {
				get when() {
					return props.chore.deadline;
				},
				get children() {
					var _el$9 = _tmpl$$3();
					_el$9.firstChild;
					insert(_el$9, () => props.chore.deadline, null);
					return _el$9;
				}
			}), _el$1);
			insert(_el$1, () => formatSkipDays$1(props.chore.skipDays), null);
			insert(_el$11, createComponent(Button, {
				type: "button",
				variant: "secondary",
				size: "sm",
				onClick: () => props.onEdit(props.chore),
				children: "Edit"
			}), null);
			insert(_el$11, createComponent(Button, {
				type: "button",
				variant: "danger",
				size: "sm",
				onClick: () => props.onDelete(props.chore.id),
				children: "Delete"
			}), null);
			return _el$;
		})();
	};
	//#endregion
	//#region src/admin/rotating-chore-modal.tsx
	var _tmpl$$2 = /* @__PURE__ */ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"><h3 class="mb-5 text-2xl text-indigo-600"></h3><form><div class=mb-5><label for=choreName class="mb-3 block font-medium text-slate-900">Chore Name</label><input type=text id=choreName required class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"></div><div class=mb-5><div class="mb-3 block font-medium text-slate-900">Rotation (select people)</div><div class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"data-testid=checkbox-list></div></div><div class=mb-5><label for=rotatingIndex class="mb-3 block font-medium text-slate-900">Starting Index (current person)</label><select id=rotatingIndex class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"></select></div><div class=mb-5><label for=deadline class="mb-3 block font-medium text-slate-900">Deadline (optional)</label><input type=time id=deadline class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"></div><div class=mb-5><div class="mb-3 block font-medium text-slate-900">Skip Days</div><div class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"data-testid=skip-days-checkbox-list></div></div><div class=mb-5><label for=skipDayVisibility class="mb-3 block font-medium text-slate-900">Skip Day Visibility</label><select id=skipDayVisibility class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><option>Hide</option><option>Show Always</option><option>Show If Overdue</option></select></div><div class="mt-6 flex justify-end gap-2.5">`), _tmpl$2$1 = /* @__PURE__ */ template(`<label class="flex cursor-pointer items-center gap-2 font-normal"><input type=checkbox class="size-4.5 cursor-pointer">`), _tmpl$3$1 = /* @__PURE__ */ template(`<option>`);
	var RotatingChoreModal = (props) => {
		const [name, setName] = createSignal(props.initialChore?.name ?? "");
		const [deadline, setDeadline] = createSignal(props.initialChore?.deadline ?? "");
		const [skipDayVisibility, setSkipDayVisibility] = createSignal(props.initialChore?.skipDayVisibility ?? SkipDayVisibility.HIDE);
		const [skipDays, setSkipDays] = createSignal(props.initialChore?.skipDays ?? []);
		const [rotation, setRotation] = createSignal(props.initialChore?.rotation ?? []);
		const handleSkipDayChange = (day, checked) => {
			if (checked) setSkipDays([...skipDays(), day]);
			else setSkipDays(skipDays().filter((d) => d !== day));
		};
		const handleRotationChange = (personId, checked) => {
			if (checked) setRotation([...rotation(), personId]);
			else setRotation(rotation().filter((id) => id !== personId));
		};
		const handleSubmit = async (event) => {
			event.preventDefault();
			try {
				if (props.initialChore?.id) {
					const body = {
						name: name(),
						type: ChoreType.ROTATING,
						rotation: rotation(),
						deadline: deadline() || void 0,
						skipDays: skipDays(),
						skipDayVisibility: skipDayVisibility()
					};
					await updateChore(props.initialChore.id, body);
				} else await createChore({
					name: name(),
					type: ChoreType.ROTATING,
					rotation: rotation(),
					deadline: deadline() || void 0,
					skipDays: skipDays(),
					skipDayVisibility: skipDayVisibility()
				});
				props.closeModal();
			} catch (error) {
				console.error("Error saving chore:", error);
				alert(`Failed to save chore: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		return (() => {
			var _el$ = _tmpl$$2(), _el$3 = _el$.firstChild.firstChild, _el$4 = _el$3.nextSibling, _el$5 = _el$4.firstChild, _el$7 = _el$5.firstChild.nextSibling, _el$8 = _el$5.nextSibling, _el$0 = _el$8.firstChild.nextSibling, _el$1 = _el$8.nextSibling, _el$11 = _el$1.firstChild.nextSibling, _el$12 = _el$1.nextSibling, _el$14 = _el$12.firstChild.nextSibling, _el$15 = _el$12.nextSibling, _el$17 = _el$15.firstChild.nextSibling, _el$18 = _el$15.nextSibling, _el$20 = _el$18.firstChild.nextSibling, _el$21 = _el$20.firstChild, _el$22 = _el$21.nextSibling, _el$23 = _el$22.nextSibling, _el$24 = _el$18.nextSibling;
			insert(_el$3, () => props.initialChore ? "Edit Rotating Chore" : "Add Rotating Chore");
			_el$4.addEventListener("submit", handleSubmit);
			_el$7.$$input = (e) => setName(e.currentTarget.value);
			insert(_el$0, createComponent(For, {
				get each() {
					return props.choreData.people;
				},
				children: (person) => (() => {
					var _el$25 = _tmpl$2$1(), _el$26 = _el$25.firstChild;
					_el$26.$$input = (e) => handleRotationChange(person.id, e.currentTarget.checked);
					insert(_el$25, () => person.name, null);
					createRenderEffect(() => _el$26.checked = rotation().includes(person.id));
					return _el$25;
				})()
			}));
			_el$11.$$input = (_e) => {};
			insert(_el$11, createComponent(For, {
				get each() {
					return rotation();
				},
				children: (personId, index) => {
					const person = props.choreData.people.find((p) => p.id === personId);
					return (() => {
						var _el$27 = _tmpl$3$1();
						insert(_el$27, () => person ? person.name : "Unknown");
						createRenderEffect(() => _el$27.value = index());
						return _el$27;
					})();
				}
			}));
			_el$14.$$input = (e) => setDeadline(e.currentTarget.value);
			insert(_el$17, createComponent(For, {
				get each() {
					return Object.values(DayOfWeek);
				},
				children: (day) => (() => {
					var _el$28 = _tmpl$2$1(), _el$29 = _el$28.firstChild;
					_el$29.$$input = (e) => handleSkipDayChange(day, e.currentTarget.checked);
					_el$29.value = day;
					insert(_el$28, () => day.charAt(0).toUpperCase() + day.slice(1), null);
					createRenderEffect(() => _el$29.checked = skipDays().includes(day));
					return _el$28;
				})()
			}));
			_el$20.$$input = (e) => setSkipDayVisibility(e.currentTarget.value);
			insert(_el$24, createComponent(Button, {
				type: "button",
				variant: "secondary",
				onClick: () => props.closeModal(),
				children: "Cancel"
			}), null);
			insert(_el$24, createComponent(Button, {
				type: "submit",
				variant: "primary",
				get children() {
					return props.initialChore ? "Save" : "Add";
				}
			}), null);
			createRenderEffect(() => _el$7.value = name());
			createRenderEffect(() => _el$11.value = props.initialChore?.rotatingIndex ?? 0);
			createRenderEffect(() => _el$14.value = deadline());
			createRenderEffect(() => _el$21.value = SkipDayVisibility.HIDE);
			createRenderEffect(() => _el$22.value = SkipDayVisibility.SHOW_ALWAYS);
			createRenderEffect(() => _el$23.value = SkipDayVisibility.SHOW_IF_OVERDUE);
			createRenderEffect(() => _el$20.value = skipDayVisibility());
			return _el$;
		})();
	};
	delegateEvents(["input"]);
	//#endregion
	//#region src/admin/settings-modal.tsx
	var _tmpl$$1 = /* @__PURE__ */ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"><h3 class="mb-5 text-2xl text-indigo-600">Settings</h3><form><div class=mb-5><label for=dailyResetTime class="mb-3 block font-medium text-slate-900">Daily Reset Time (24-hour format, HH:mm)</label><input type=time id=dailyResetTime required class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><small class="text-sm text-slate-500">Time when daily chore reset occurs. Default: 03:00</small><br><small class="text-sm text-slate-500"><strong>Tip:</strong> Set to at least 03:00 to avoid daylight savings time changes (no roll forward/back occurs after 3am)</small></div><div class=mb-5><label class="flex cursor-pointer items-center gap-2"><input type=checkbox id=historyEnabled class="size-4.5 cursor-pointer">Enable History Tracking</label><small class="mt-2 block text-sm text-slate-500">Track daily chore completions (keeps last 14 days)</small></div><div class="mt-6 flex justify-end gap-2.5">`);
	var SettingsModal = (props) => {
		const [dailyResetTime, setDailyResetTime] = createSignal(props.initialSettings.dailyResetTime);
		const [historyEnabled, setHistoryEnabled] = createSignal(props.initialSettings.historyEnabled);
		const handleSubmit = async (event) => {
			event.preventDefault();
			try {
				await updateSettings({
					dailyResetTime: dailyResetTime(),
					historyEnabled: historyEnabled()
				});
				props.closeModal();
			} catch (error) {
				console.error("Error saving settings:", error);
				alert(`Failed to save settings: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		return (() => {
			var _el$ = _tmpl$$1(), _el$4 = _el$.firstChild.firstChild.nextSibling, _el$5 = _el$4.firstChild, _el$7 = _el$5.firstChild.nextSibling, _el$8 = _el$5.nextSibling, _el$0 = _el$8.firstChild.firstChild, _el$1 = _el$8.nextSibling;
			_el$4.addEventListener("submit", handleSubmit);
			_el$7.$$input = (e) => setDailyResetTime(e.currentTarget.value);
			_el$0.$$input = (e) => setHistoryEnabled(e.currentTarget.checked);
			insert(_el$1, createComponent(Button, {
				type: "button",
				variant: "secondary",
				onClick: () => props.closeModal(),
				children: "Cancel"
			}), null);
			insert(_el$1, createComponent(Button, {
				type: "submit",
				variant: "primary",
				children: "Save"
			}), null);
			createRenderEffect(() => _el$7.value = dailyResetTime());
			createRenderEffect(() => _el$0.checked = historyEnabled());
			return _el$;
		})();
	};
	delegateEvents(["input"]);
	//#endregion
	//#region src/admin/admin.tsx
	var _tmpl$ = /* @__PURE__ */ template(`<p class="text-sm font-medium text-slate-600 italic">Retrying... (attempt <!>)`), _tmpl$2 = /* @__PURE__ */ template(`<div class="animate-loading-pulse bg-[radial-gradient(circle,#2563eb,#ffffff)] bg-size-[200%_200%] bg-center px-8 py-16 text-center text-slate-500"><div class="inline-block rounded-xl bg-white/30 p-8 shadow-md"><p class="mb-2.5 text-xl font-semibold text-slate-900">Magic Mirror is starting up, please wait...`), _tmpl$3 = /* @__PURE__ */ template(`<section class=mb-10 id=rotatingChoresSection><div class="mb-5 flex items-center justify-between"><h2 class="m-0 border-b-2 border-indigo-600 pb-2.5 text-2xl text-indigo-600">Rotating Chores</h2></div><div id=rotatingChoresList class="mt-5 grid gap-4">`), _tmpl$4 = /* @__PURE__ */ template(`<main class=p-8><section class=mb-10 data-testid=people-section><div class="mb-5 flex items-center justify-between"><h2 class="m-0 border-b-2 border-indigo-600 pb-2.5 text-2xl text-indigo-600">People</h2><div class="flex items-center gap-2"></div></div><div id=peopleList class="mt-5 grid gap-4"></div></section><section class=mb-10><h2 class="m-0 border-b-2 border-indigo-600 pb-2.5 text-2xl text-indigo-600">System State</h2><div class="rounded-lg border border-slate-200 bg-slate-50 p-5"><p class="mb-4 text-base"><strong class=text-indigo-600>Last Reset Date:</strong> <span id=lastResetDate></span></p><div class="mt-4 flex flex-row items-start gap-4"><div class="flex items-center gap-2">`), _tmpl$5 = /* @__PURE__ */ template(`<div class="mx-auto max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl"data-testid=admin-container><header class="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-8 text-slate-900"><h1 class="text-3xl font-semibold">Family Chores Admin</h1><div class="flex gap-2.5"><label for=restoreFile class="cursor-pointer rounded-lg border-none bg-gray-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-gray-700 hover:shadow-md">Restore Backup</label><input type=file id=restoreFile accept=.json hidden>`), _tmpl$6 = /* @__PURE__ */ template(`<div class="mt-4 border-t border-slate-200 pt-4">`), _tmpl$7 = /* @__PURE__ */ template(`<div class="rounded-lg border border-slate-200 bg-slate-50 p-5 transition-all hover:border-indigo-600 hover:shadow-md"data-testid=person-card><div class="mb-4 flex items-center justify-between"><div class=flex-1><h3 class="mb-1.5 text-xl text-slate-900"> <span class="inline-block size-6 rounded-full border-2 border-black/10 align-middle"></span></h3><p class="text-sm text-slate-500">ID: </p></div><div class="flex gap-2.5"></div></div><div class="mt-4 flex items-center justify-between border-t border-slate-200 pt-4"><h4 class="m-0 text-lg text-indigo-600">'s Personal Chores</h4><div class="flex gap-2">`), _tmpl$8 = /* @__PURE__ */ template(`<div class="mt-4 border-t border-slate-200 pt-4"><p class="my-2.5 text-slate-500 italic">No personal chores yet.`), _tmpl$9 = /* @__PURE__ */ template(`<p class="mt-1.25 text-sm text-indigo-600">Deadline: `), _tmpl$0 = /* @__PURE__ */ template(`<div class="mb-2.5 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 last:mb-0"><div><h4 class="mb-1.5 text-base text-slate-900"></h4><p class="mt-1.25 text-sm text-slate-500">Skip days: </p></div><div class="flex gap-2">`);
	var API_BASE = "/MMM-FamilyChores";
	var formatSkipDays = (skipDays) => {
		if (!skipDays || skipDays.length === 0) return "None";
		return skipDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
	};
	var Admin = () => {
		const [choreData, setChoreData] = createSignal(null);
		const [personModalOpen, setPersonModalOpen] = createSignal(false);
		const [personalChoreModalOpen, setPersonalChoreModalOpen] = createSignal(false);
		const [rotatingChoreModalOpen, setRotatingChoreModalOpen] = createSignal(false);
		const [copyChoresModalOpen, setCopyChoresModalOpen] = createSignal(false);
		const [settingsModalOpen, setSettingsModalOpen] = createSignal(false);
		const [editingPerson, setEditingPerson] = createSignal(null);
		const [editingChore, setEditingChore] = createSignal(null);
		const [editingChorePerson, setEditingChorePerson] = createSignal(null);
		const [copyChoresFromPerson, setCopyChoresFromPerson] = createSignal(null);
		const [historyPerson, setHistoryPerson] = createSignal(null);
		const [loading, setLoading] = createSignal(true);
		const [retryCount, setRetryCount] = createSignal(0);
		const loadData = async () => {
			try {
				const response = await fetch(`${API_BASE}/data`);
				if (!response.ok) throw new Error("Failed to load data");
				setChoreData(await response.json());
				setLoading(false);
			} catch (error) {
				console.error("Error loading data:", error);
				setTimeout(() => {
					setRetryCount((prev) => prev + 1);
					loadData();
				}, 1e4);
			}
		};
		onMount(() => {
			loadData();
		});
		const openPersonModal = (person = null) => {
			setEditingPerson(person);
			setPersonModalOpen(true);
		};
		const closePersonModal = async () => {
			setPersonModalOpen(false);
			setEditingPerson(null);
			await loadData();
		};
		const openPersonalChoreModal = (person, chore = null) => {
			setEditingChore(chore);
			setEditingChorePerson(person);
			setPersonalChoreModalOpen(true);
		};
		const closePersonalChoreModal = async () => {
			setPersonalChoreModalOpen(false);
			setEditingChore(null);
			setEditingChorePerson(null);
			await loadData();
		};
		const openRotatingChoreModal = (chore = null) => {
			setEditingChore(chore);
			setRotatingChoreModalOpen(true);
		};
		const closeRotatingChoreModal = async () => {
			setRotatingChoreModalOpen(false);
			setEditingChore(null);
			await loadData();
		};
		const openCopyChoresModal = (person) => {
			setCopyChoresFromPerson(person);
			setCopyChoresModalOpen(true);
		};
		const closeCopyChoresModal = async () => {
			setCopyChoresModalOpen(false);
			setCopyChoresFromPerson(null);
			await loadData();
		};
		const openSettingsModal = () => {
			setSettingsModalOpen(true);
		};
		const closeSettingsModal = async () => {
			setSettingsModalOpen(false);
			await loadData();
		};
		const handleDeletePerson = async (personId) => {
			if (!confirm("Are you sure you want to delete this person? This will also remove all their assigned chores.")) return;
			try {
				await deletePerson(personId);
				await loadData();
			} catch (error) {
				console.error("Error deleting person:", error);
				alert(`Failed to delete person: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		const handleDeleteChore = async (choreId) => {
			if (!confirm("Are you sure you want to delete this chore?")) return;
			try {
				await deleteChore(choreId);
				await loadData();
			} catch (error) {
				console.error("Error deleting chore:", error);
				alert(`Failed to delete chore: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		const handleDownloadBackup = async () => {
			try {
				const response = await fetch(`${API_BASE}/backup`);
				if (!response.ok) throw new Error("Failed to create backup");
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = response.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || "family-chores-backup.json";
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			} catch (error) {
				console.error("Error downloading backup:", error);
				alert("Failed to download backup. Please try again.");
			}
		};
		const handleRestore = async (e) => {
			const file = e.target.files?.[0];
			if (!file) return;
			try {
				const text = await file.text();
				const data = JSON.parse(text);
				if (!(await fetch(`${API_BASE}/restore`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data)
				})).ok) throw new Error("Failed to restore data");
				alert("Data restored successfully!");
				await loadData();
			} catch (error) {
				console.error("Error restoring data:", error);
				alert("Failed to restore data. Please check the file format and try again.");
			}
			e.target.value = "";
		};
		const handleForceReset = async () => {
			if (!confirm("Are you sure you want to force a daily reset? This will reset all chore states for the new day.")) return;
			try {
				const data = choreData();
				if (!data) return;
				const yesterday = /* @__PURE__ */ new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				data.lastResetDate = getLocalDateString(yesterday);
				if (!(await fetch(`${API_BASE}/restore`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data)
				})).ok) throw new Error("Failed to force reset");
				alert("Daily reset triggered successfully! The data will be updated on the next sync.");
				await loadData();
			} catch (error) {
				console.error("Error forcing reset:", error);
				alert("Failed to force reset. Please try again.");
			}
		};
		const getPersonalChores = (personId) => {
			const data = choreData();
			if (!data) return [];
			return data.chores.filter((chore) => chore.type === ChoreType.PERSONAL && chore.assignedTo === personId);
		};
		const getRotatingChores = () => {
			const data = choreData();
			if (!data) return [];
			return data.chores.filter((chore) => chore.type === ChoreType.ROTATING);
		};
		return (() => {
			var _el$ = _tmpl$5(), _el$4 = _el$.firstChild.firstChild.nextSibling, _el$5 = _el$4.firstChild, _el$6 = _el$5.nextSibling;
			insert(_el$4, createComponent(Button, {
				type: "button",
				variant: "secondary",
				id: "backupBtn",
				onClick: handleDownloadBackup,
				children: "Download Backup"
			}), _el$5);
			_el$6.$$input = handleRestore;
			insert(_el$4, createComponent(Button, {
				type: "button",
				variant: "secondary",
				id: "settingsBtn",
				onClick: openSettingsModal,
				children: "⚙️ Settings"
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return loading();
				},
				get children() {
					var _el$7 = _tmpl$2(), _el$8 = _el$7.firstChild;
					_el$8.firstChild;
					insert(_el$8, createComponent(Show, {
						get when() {
							return retryCount() > 0;
						},
						get children() {
							var _el$0 = _tmpl$(), _el$11 = _el$0.firstChild.nextSibling;
							_el$11.nextSibling;
							insert(_el$0, retryCount, _el$11);
							return _el$0;
						}
					}), null);
					return _el$7;
				}
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return choreData();
				},
				get children() {
					var _el$12 = _tmpl$4(), _el$13 = _el$12.firstChild, _el$14 = _el$13.firstChild, _el$16 = _el$14.firstChild.nextSibling, _el$17 = _el$14.nextSibling, _el$22 = _el$13.nextSibling, _el$25 = _el$22.firstChild.nextSibling.firstChild, _el$28 = _el$25.firstChild.nextSibling.nextSibling, _el$30 = _el$25.nextSibling.firstChild;
					insert(_el$16, createComponent(Button, {
						type: "button",
						variant: "primary",
						id: "addPersonBtn",
						onClick: () => openPersonModal(),
						children: "Add Person"
					}), null);
					insert(_el$16, createComponent(Show, {
						get when() {
							return choreData()?.people.length === 0;
						},
						get children() {
							return createComponent(Tooltip, {
								text: "Add at least one person before you can create chores",
								"class": "ml-2 text-base",
								children: "ℹ️"
							});
						}
					}), null);
					insert(_el$17, createComponent(For, {
						get each() {
							return choreData()?.people ?? [];
						},
						children: (person) => (() => {
							var _el$31 = _tmpl$7(), _el$32 = _el$31.firstChild, _el$33 = _el$32.firstChild, _el$34 = _el$33.firstChild, _el$35 = _el$34.firstChild, _el$36 = _el$35.nextSibling, _el$37 = _el$34.nextSibling;
							_el$37.firstChild;
							var _el$39 = _el$33.nextSibling, _el$41 = _el$32.nextSibling.firstChild, _el$42 = _el$41.firstChild, _el$43 = _el$41.nextSibling;
							insert(_el$34, () => escapeHtml(person.name), _el$35);
							insert(_el$37, () => person.id, null);
							insert(_el$39, createComponent(Button, {
								type: "button",
								variant: "secondary",
								size: "sm",
								onClick: () => openPersonModal(person),
								children: "Edit"
							}), null);
							insert(_el$39, createComponent(Button, {
								type: "button",
								variant: "secondary",
								size: "sm",
								onClick: () => setHistoryPerson(person),
								children: "History"
							}), null);
							insert(_el$39, createComponent(Button, {
								type: "button",
								variant: "danger",
								size: "sm",
								onClick: () => handleDeletePerson(person.id),
								children: "Delete"
							}), null);
							insert(_el$41, () => escapeHtml(person.name), _el$42);
							insert(_el$43, createComponent(Button, {
								type: "button",
								variant: "primary",
								size: "sm",
								onClick: () => {
									openPersonalChoreModal(person, null);
								},
								children: "Add Chore"
							}), null);
							insert(_el$43, createComponent(Show, {
								get when() {
									return memo(() => getPersonalChores(person.id).length > 0)() && (choreData()?.people.length ?? 0) > 1;
								},
								get children() {
									return createComponent(Button, {
										type: "button",
										variant: "secondary",
										size: "sm",
										onClick: () => {
											openCopyChoresModal(person);
										},
										children: "Copy Chores"
									});
								}
							}), null);
							insert(_el$31, createComponent(Show, {
								get when() {
									return getPersonalChores(person.id).length > 0;
								},
								get fallback() {
									return _tmpl$8();
								},
								get children() {
									var _el$44 = _tmpl$6();
									insert(_el$44, createComponent(For, {
										get each() {
											return getPersonalChores(person.id);
										},
										children: (chore) => (() => {
											var _el$46 = _tmpl$0(), _el$47 = _el$46.firstChild, _el$48 = _el$47.firstChild, _el$51 = _el$48.nextSibling;
											_el$51.firstChild;
											var _el$53 = _el$47.nextSibling;
											insert(_el$48, () => escapeHtml(chore.name));
											insert(_el$47, createComponent(Show, {
												get when() {
													return chore.deadline;
												},
												get children() {
													var _el$49 = _tmpl$9();
													_el$49.firstChild;
													insert(_el$49, () => chore.deadline, null);
													return _el$49;
												}
											}), _el$51);
											insert(_el$51, () => formatSkipDays(chore.skipDays), null);
											insert(_el$53, createComponent(Button, {
												type: "button",
												variant: "secondary",
												size: "sm",
												onClick: () => {
													openPersonalChoreModal(person, chore);
												},
												children: "Edit"
											}), null);
											insert(_el$53, createComponent(Button, {
												type: "button",
												variant: "danger",
												size: "sm",
												onClick: () => handleDeleteChore(chore.id),
												children: "Delete"
											}), null);
											return _el$46;
										})()
									}));
									return _el$44;
								}
							}), null);
							createRenderEffect((_$p) => style(_el$36, `background-color: ${person.color}`, _$p));
							return _el$31;
						})()
					}));
					insert(_el$12, createComponent(Show, {
						get when() {
							return (choreData()?.people?.length ?? 0) > 0;
						},
						get children() {
							var _el$18 = _tmpl$3(), _el$19 = _el$18.firstChild;
							_el$19.firstChild;
							var _el$21 = _el$19.nextSibling;
							insert(_el$19, createComponent(Button, {
								type: "button",
								variant: "primary",
								id: "addRotatingChoreBtn",
								onClick: () => openRotatingChoreModal(),
								children: "Add Rotating Chore"
							}), null);
							insert(_el$21, createComponent(For, {
								get each() {
									return getRotatingChores();
								},
								children: (chore) => createComponent(RotatingChoreCard, {
									chore,
									get people() {
										return choreData()?.people ?? [];
									},
									onEdit: openRotatingChoreModal,
									onDelete: handleDeleteChore
								})
							}));
							return _el$18;
						}
					}), _el$22);
					insert(_el$28, () => choreData()?.lastResetDate || "Never");
					insert(_el$30, createComponent(Button, {
						type: "button",
						variant: "warning",
						id: "resetDailyBtn",
						onClick: handleForceReset,
						children: "Force Daily Reset"
					}), null);
					insert(_el$30, createComponent(Tooltip, {
						text: "WARNING: This will un-check all chores and rotate assignment on rotating chores to the next person. It does respect skip days if today is a skip day. Useful for testing or immediately advancing chore assignments.",
						position: "above",
						align: "center",
						multiline: true,
						"class": "ml-2 text-base",
						children: "ℹ️"
					}), null);
					return _el$12;
				}
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return personModalOpen();
				},
				get children() {
					return createComponent(PersonModal, {
						get initialPerson() {
							return editingPerson() ?? void 0;
						},
						closeModal: closePersonModal
					});
				}
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return personalChoreModalOpen();
				},
				get children() {
					return createComponent(PersonalChoreModal, {
						get person() {
							return editingChorePerson();
						},
						get initialChore() {
							return editingChore();
						},
						closeModal: closePersonalChoreModal
					});
				}
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return memo(() => !!rotatingChoreModalOpen())() && choreData();
				},
				get children() {
					return createComponent(RotatingChoreModal, {
						get initialChore() {
							return editingChore();
						},
						get choreData() {
							return choreData() ?? {
								people: [],
								chores: [],
								dailyCompletions: [],
								settings: {
									dailyResetTime: "03:00",
									historyEnabled: true
								}
							};
						},
						closeModal: closeRotatingChoreModal
					});
				}
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return memo(() => !!(copyChoresModalOpen() && copyChoresFromPerson()))() && choreData();
				},
				get children() {
					return createComponent(CopyChoresModal, {
						get fromPerson() {
							return copyChoresFromPerson();
						},
						get choreData() {
							return choreData();
						},
						closeModal: closeCopyChoresModal
					});
				}
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return memo(() => !!historyPerson())() && choreData();
				},
				get children() {
					return createComponent(ChoreHistoryModal, {
						get person() {
							return historyPerson();
						},
						get choreData() {
							return choreData();
						},
						closeModal: () => setHistoryPerson(null)
					});
				}
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return memo(() => !!settingsModalOpen())() && choreData();
				},
				get children() {
					return createComponent(SettingsModal, {
						get initialSettings() {
							return choreData()?.settings ?? {
								dailyResetTime: "03:00",
								historyEnabled: true
							};
						},
						closeModal: closeSettingsModal
					});
				}
			}), null);
			return _el$;
		})();
	};
	delegateEvents(["input"]);
	//#endregion
	//#region src/admin/app.tsx
	var appElement = document.getElementById("app");
	if (appElement) render(() => createComponent(Admin, {}), appElement);
	else console.error("Failed to find #app element");
	//#endregion
})();

//# sourceMappingURL=admin.js.map