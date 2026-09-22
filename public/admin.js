// ⚠️  STOP — This file is auto-generated and will be overwritten!
// Edit src/admin/*.tsx files and run: pnpm build
(function() {
	//#region node_modules/.pnpm/solid-js@1.9.15/node_modules/solid-js/dist/solid.js
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
			if (typeof value === "function") {
				if (Transition && Transition.running && Transition.sources.has(s)) value = value(s.tValue);
				else value = value(s.value);
			}
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
	function onMount(fn) {
		createEffect(() => untrack(fn));
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
	function createContext(defaultValue, options) {
		const id = Symbol("context");
		return {
			id,
			Provider: createProvider(id),
			defaultValue
		};
	}
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
		if (this.sources && (runningTransition ? this.tState : this.state)) {
			if ((runningTransition ? this.tState : this.state) === STALE) updateComputation(this);
			else {
				const updates = Updates;
				Updates = null;
				runUpdates(() => lookUpstream(this), false);
				Updates = updates;
			}
		}
		if (Listener) {
			const observers = this.observers;
			if (!observers || observers[observers.length - 1] !== Listener) {
				const sSlot = observers ? observers.length : 0;
				if (!Listener.sources) {
					Listener.sources = [this];
					Listener.sourceSlots = [sSlot];
				} else {
					Listener.sources.push(this);
					Listener.sourceSlots.push(sSlot);
				}
				if (!observers) {
					this.observers = [Listener];
					this.observerSlots = [Listener.sources.length - 1];
				} else {
					observers.push(Listener);
					this.observerSlots.push(Listener.sources.length - 1);
				}
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
			if (node.pure) {
				if (Transition && Transition.running) {
					node.tState = STALE;
					node.tOwned && node.tOwned.forEach(cleanNode);
					node.tOwned = void 0;
				} else {
					node.state = STALE;
					node.owned && node.owned.forEach(cleanNode);
					node.owned = null;
				}
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
		else if (Owner !== UNOWNED) {
			if (Transition && Transition.running && Owner.pure) {
				if (!Owner.tOwned) Owner.tOwned = [c];
				else Owner.tOwned.push(c);
			} else if (!Owner.owned) Owner.owned = [c];
			else Owner.owned.push(c);
		}
		if (ExternalSourceConfig && c.fn) {
			const sourceFn = c.fn;
			const [track, trigger] = createSignal(void 0, { equals: false });
			const ordinary = ExternalSourceConfig.factory(sourceFn, trigger);
			onCleanup(() => ordinary.dispose());
			let inTransition;
			let trackedOrdinary = false;
			const triggerInTransition = () => startTransition(trigger).then(() => {
				if (inTransition) {
					inTransition.dispose();
					inTransition = void 0;
					if (!trackedOrdinary) trigger();
				}
			});
			c.fn = (x) => {
				track();
				if (Transition && Transition.running) {
					if (!inTransition) inTransition = ExternalSourceConfig.factory(sourceFn, triggerInTransition);
					return inTransition.track(x);
				}
				trackedOrdinary = true;
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
				if (Array.isArray(result)) {
					if (result.length < 32768) results.push.apply(results, result);
					else for (let j = 0; j < result.length; j++) results.push(result[j]);
				} else results.push(result);
			}
			return results;
		}
		return children;
	}
	function createProvider(id, options) {
		return function provider(props) {
			let res;
			createRenderEffect(() => res = untrack(() => {
				Owner.context = {
					...Owner.context,
					[id]: props.value
				};
				return children(() => props.children);
			}), void 0);
			return res;
		};
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
	//#region node_modules/.pnpm/solid-js@1.9.15/node_modules/solid-js/web/dist/web.js
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
				if (index != null) {
					if (bStart < index && index < bEnd) {
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
				} else a[aStart++].remove();
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
	function className(node, value) {
		if (isHydrating(node)) return;
		if (value == null) node.removeAttribute("class");
		else node.className = value;
	}
	function addEventListener(node, name, handler, delegate) {
		if (delegate) {
			if (Array.isArray(handler)) {
				node[`$$${name}`] = handler[0];
				node[`$$${name}Data`] = handler[1];
			} else node[`$$${name}`] = handler;
		} else if (Array.isArray(handler)) {
			const handlerFn = handler[0];
			node.addEventListener(name, handler[0] = (e) => handlerFn.call(node, handler[1], e));
		} else node.addEventListener(name, handler, typeof handler !== "function" && handler);
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
			} else if (currentArray) {
				if (current.length === 0) appendNodes(parent, array, marker);
				else reconcileArrays(parent, current, array);
			} else {
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
			else if (t === "function") {
				if (unwrap) {
					while (typeof item === "function") item = item();
					dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item], Array.isArray(prev) ? prev : [prev]) || dynamic;
				} else {
					normalized.push(item);
					dynamic = true;
				}
			} else {
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
	//#region node_modules/.pnpm/solid-js@1.9.15/node_modules/solid-js/store/dist/store.js
	var $RAW = Symbol("store-raw");
	var $NODE = Symbol("store-node");
	var $HAS = Symbol("store-has");
	var $SELF = Symbol("store-self");
	function wrap$1(value) {
		let p = value[$PROXY];
		if (!p) {
			Object.defineProperty(value, $PROXY, { value: p = new Proxy(value, proxyTraps$1) });
			if (!Array.isArray(value)) {
				const keys = Object.keys(value), desc = Object.getOwnPropertyDescriptors(value), proto = Object.getPrototypeOf(value);
				const isClass = proto !== null && value !== null && typeof value === "object" && !Array.isArray(value) && proto !== Object.prototype;
				if (isClass) {
					const descriptors = Object.getOwnPropertyDescriptors(proto);
					keys.push(...Object.keys(descriptors));
					Object.assign(desc, descriptors);
				}
				for (let i = 0, l = keys.length; i < l; i++) {
					const prop = keys[i];
					if (isClass && prop === "constructor") continue;
					if (desc[prop].get) Object.defineProperty(value, prop, {
						configurable: true,
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
				if (getListener() && (typeof value !== "function" || Object.prototype.hasOwnProperty.call(target, property)) && !(desc && desc.get)) value = getNode(nodes, property, value)();
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
		if (property === "__proto__") return;
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
			if (isUnsafeKey$1(key)) continue;
			setProperty(state, key, value[key]);
		}
	}
	function isUnsafeKey$1(property) {
		return property === "__proto__" || property === "constructor" || property === "prototype";
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
			if (partType === "string" && (part === "__proto__" || path.length > 1 && isUnsafeKey$1(part))) return;
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
	function isUnsafeKey(property) {
		return property === "__proto__" || property === "constructor" || property === "prototype";
	}
	function applyState(target, parent, property, merge, key) {
		if (isUnsafeKey(property)) return;
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
		for (let i = 0, len = targetKeys.length; i < len; i++) {
			if (isUnsafeKey(targetKeys[i])) continue;
			applyState(target[targetKeys[i]], previous, targetKeys[i], merge, key);
		}
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
	var AfterDeadlineVisibility = /* @__PURE__ */ function(AfterDeadlineVisibility) {
		AfterDeadlineVisibility["SHOW_NORMAL"] = "normal";
		AfterDeadlineVisibility["SHOW_OVERDUE"] = "overdue";
		AfterDeadlineVisibility["MOVE_TO_EARLIER"] = "earlier";
		return AfterDeadlineVisibility;
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
	var TimeFormat = /* @__PURE__ */ function(TimeFormat) {
		TimeFormat["SYSTEM"] = "system";
		TimeFormat["HOUR_12"] = "12h";
		TimeFormat["HOUR_24"] = "24h";
		return TimeFormat;
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
	* Detect whether the system locale prefers 12-hour or 24-hour time.
	* Returns true if the system uses 12-hour format.
	*/
	var systemUses12Hour = () => {
		const hourCycle = new Intl.DateTimeFormat(void 0, { hour: "numeric" }).resolvedOptions().hourCycle;
		return hourCycle === "h11" || hourCycle === "h12";
	};
	/**
	* Format a 24-hour HH:MM time string for display according to the configured time format.
	*
	* @param time - Time string in 24-hour HH:MM format (e.g. "14:30")
	* @param timeFormat - The TimeFormat setting value ("system", "12h", or "24h")
	* @returns Formatted time string for display (e.g. "2:30 PM" or "14:30")
	*/
	var formatTime = (time, timeFormat) => {
		if (!(timeFormat === "12h" || timeFormat === "system" && systemUses12Hour())) return time;
		const [hourStr, minuteStr] = time.split(":");
		const hour = Number.parseInt(hourStr, 10);
		const ampm = hour < 12 ? "AM" : "PM";
		return `${hour % 12 === 0 ? 12 : hour % 12}:${minuteStr} ${ampm}`;
	};
	//#endregion
	//#region src/admin/admin-context.tsx
	/**
	* Admin context for sharing data and state across admin panel components
	*/
	var AdminContext = createContext();
	/**
	* Hook to access the admin context
	* Must be used within an AdminContext.Provider
	*/
	var useAdminContext = () => {
		const context = useContext(AdminContext);
		if (!context) throw new Error("useAdminContext must be used within an AdminContext.Provider");
		return context;
	};
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
	var deleteChore = async (id, pin) => {
		validateId(id);
		const query = pin ? `?pin=${encodeURIComponent(pin)}` : "";
		await handleResponse(await fetch(`${API_BASE_URL}/chores/${id}${query}`, { method: "DELETE" }));
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
	var advanceRotations = async (data) => {
		return handleResponse(await fetch(`${API_BASE_URL}/advance-rotations`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		}));
	};
	var resetCaughtUp = async (data) => {
		return handleResponse(await fetch(`${API_BASE_URL}/reset-caught-up`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		}));
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
	var deletePerson = async (id, pin) => {
		validateId(id);
		const query = pin ? `?pin=${encodeURIComponent(pin)}` : "";
		await handleResponse(await fetch(`${API_BASE_URL}/people/${id}${query}`, { method: "DELETE" }));
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
	/**
	* Download backup JSON. Requires PIN if adminPin is configured.
	*/
	var downloadBackup = async (pin) => {
		const query = pin ? `?pin=${encodeURIComponent(pin)}` : "";
		const response = await fetch(`${API_BASE_URL}/backup${query}`);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			if (errorData?.error) throw new Error(errorData.error);
			throw new Error(`Request failed with status ${response.status}`);
		}
		return response.blob();
	};
	//#endregion
	//#region src/admin/button.tsx
	var _tmpl$$24 = /*#__PURE__*/ template(`<button class="cursor-pointer rounded-lg border-none px-5 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md">`);
	var Button = (props) => {
		return (() => {
			var _el$ = _tmpl$$24();
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
	var _tmpl$$23 = /*#__PURE__*/ template(`<span>`);
	var Tooltip = (rawProps) => {
		const props = mergeProps({
			position: "above",
			align: "left",
			multiline: false,
			class: "",
			classList: {}
		}, rawProps);
		return (() => {
			var _el$ = _tmpl$$23();
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
	//#region src/admin/help-icon.tsx
	/**
	* A small circular question-mark icon with a tooltip.
	* Use next to labels or controls that need extra explanation.
	*/
	var HelpIcon = (props) => createComponent(Tooltip, {
		get text() {
			return props.text;
		},
		get position() {
			return props.position;
		},
		get align() {
			return props.align;
		},
		get multiline() {
			return props.multiline;
		},
		get ["class"]() {
			return `inline-flex size-5 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 ${props.class || ""}`;
		},
		get dataTestId() {
			return props.dataTestId || "help-icon";
		},
		children: "?"
	});
	//#endregion
	//#region src/admin/pin-field.tsx
	var _tmpl$$22 = /*#__PURE__*/ template(`<label class="mt-3 flex cursor-pointer items-center gap-2"><input type=checkbox class="size-4.5 cursor-pointer">Remember PIN for 10 minutes`);
	var _tmpl$2$18 = /*#__PURE__*/ template(`<button type=button class="cursor-help text-sm text-indigo-600 underline">Forgot PIN?`);
	var _tmpl$3$15 = /*#__PURE__*/ template(`<div class="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4"><label for=adminPin class="mb-2 block font-medium text-amber-900">Admin PIN <span class=text-amber-700>*</span></label><div class="flex gap-2"><input id=adminPin placeholder="Enter admin PIN"required class="flex-1 rounded-lg border border-amber-300 p-2.5 text-base transition-colors focus:border-amber-600 focus:outline-none"><button type=button class="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-amber-800 transition-colors hover:bg-amber-100"></button></div><small class="mt-1 block text-sm text-amber-700">PIN is required to make changes</small><div class=mt-1>`);
	/**
	* Reusable PIN input field for admin modals.
	*/
	var PinField = (props) => {
		const [showPin, setShowPin] = createSignal(false);
		return (() => {
			var _el$ = _tmpl$3$15(), _el$3 = _el$.firstChild.nextSibling, _el$4 = _el$3.firstChild, _el$5 = _el$4.nextSibling, _el$9 = _el$3.nextSibling, _el$0 = _el$9.nextSibling;
			_el$4.$$input = (e) => props.onPinChange(e.currentTarget.value);
			_el$5.$$click = () => setShowPin(!showPin());
			insert(_el$5, createComponent(Show, {
				get when() {
					return showPin();
				},
				fallback: "👁",
				children: "🙈"
			}));
			insert(_el$, createComponent(Show, {
				get when() {
					return props.onRememberChange;
				},
				get children() {
					var _el$6 = _tmpl$$22(), _el$7 = _el$6.firstChild;
					_el$7.nextSibling;
					_el$7.$$input = (e) => props.onRememberChange?.(e.currentTarget.checked);
					insert(_el$6, createComponent(HelpIcon, {
						text: "PIN is remembered for 10 minutes or until you refresh or close the window",
						align: "center",
						multiline: true,
						"class": "ml-1"
					}), null);
					createRenderEffect(() => _el$7.checked = props.remember ?? false);
					return _el$6;
				}
			}), _el$9);
			insert(_el$0, createComponent(Tooltip, {
				text: "SSH into the MagicMirror and edit the adminPin value in the module's data file directly",
				position: "above",
				align: "left",
				multiline: true,
				get children() {
					return _tmpl$2$18();
				}
			}));
			createRenderEffect(() => setAttribute(_el$4, "type", showPin() ? "text" : "password"));
			createRenderEffect(() => _el$4.value = props.pin);
			return _el$;
		})();
	};
	delegateEvents(["input", "click"]);
	//#endregion
	//#region src/admin/advance-rotations-modal.tsx
	var _tmpl$$21 = /*#__PURE__*/ template(`<div class="mb-5 overflow-hidden rounded-lg border border-slate-200"data-testid=rotation-preview-list><div class="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase"><span>Chore</span><span></span><span>Next Up`);
	var _tmpl$2$17 = /*#__PURE__*/ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] w-[90%] max-w-140 scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"data-testid=advance-rotations-modal><div class="mb-2 flex items-center justify-between"><h3 class="text-2xl text-indigo-600">Advance All Rotations</h3><button type=button class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"aria-label=Close>×</button></div><p class="mb-5 text-sm text-slate-500">Each rotating chore will move to the next person in its rotation. Completion state will be cleared.</p><div class="mt-6 flex justify-end gap-2.5">`);
	var _tmpl$3$14 = /*#__PURE__*/ template(`<p class="my-4 text-slate-500 italic"data-testid=no-chores-message>No rotating chores with 2+ people to advance.`);
	var _tmpl$4$10 = /*#__PURE__*/ template(`<div class="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-4 py-3"><div><span class="font-medium text-slate-800"></span><div class="mt-0.5 text-sm text-slate-500"></div></div><span class="text-lg text-slate-400">→</span><div class="text-sm font-semibold text-indigo-600">`);
	var AdvanceRotationsModal = (props) => {
		const { choreData, pinRequired, cachedPin, setCachedPin } = useAdminContext();
		const [pin, setPin] = createSignal("");
		const [rememberPin, setRememberPin] = createSignal(false);
		const getPersonName = (id) => choreData().people.find((p) => p.id === id)?.name ?? "Unknown";
		const advanceable = () => props.rotatingChores.filter((c) => (c.rotation ?? []).length >= 2);
		const getNextPersonId = (chore) => {
			const rotation = chore.rotation ?? [];
			return rotation[((chore.rotatingIndex ?? 0) + 1) % rotation.length] ?? "";
		};
		const handleConfirm = async () => {
			try {
				const pinToUse = cachedPin() || pin();
				await advanceRotations({ pin: pinRequired() ? pinToUse || void 0 : void 0 });
				if (!cachedPin() && rememberPin() && pin()) setCachedPin(pin());
				props.closeModal();
			} catch (error) {
				console.error("Error advancing rotations:", error);
				alert(`Failed to advance rotations: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		return (() => {
			var _el$ = _tmpl$2$17(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$5 = _el$3.firstChild.nextSibling, _el$9 = _el$3.nextSibling.nextSibling;
			_el$5.$$click = () => props.closeModal();
			insert(_el$2, createComponent(Show, {
				get when() {
					return advanceable().length > 0;
				},
				get fallback() {
					return _tmpl$3$14();
				},
				get children() {
					var _el$7 = _tmpl$$21();
					_el$7.firstChild;
					insert(_el$7, createComponent(For, {
						get each() {
							return advanceable();
						},
						children: (chore, index) => (() => {
							var _el$1 = _tmpl$4$10(), _el$10 = _el$1.firstChild, _el$11 = _el$10.firstChild, _el$12 = _el$11.nextSibling, _el$14 = _el$10.nextSibling.nextSibling;
							insert(_el$11, () => chore.name);
							insert(_el$12, () => getPersonName((chore.rotation ?? [])[chore.rotatingIndex ?? 0] ?? ""));
							insert(_el$14, () => getPersonName(getNextPersonId(chore)));
							createRenderEffect((_p$) => {
								var _v$ = !!(index() % 2 === 1), _v$2 = `rotation-row-${chore.id}`;
								_v$ !== _p$.e && _el$1.classList.toggle("bg-slate-50/50", _p$.e = _v$);
								_v$2 !== _p$.t && setAttribute(_el$1, "data-testid", _p$.t = _v$2);
								return _p$;
							}, {
								e: void 0,
								t: void 0
							});
							return _el$1;
						})()
					}), null);
					return _el$7;
				}
			}), _el$9);
			insert(_el$2, createComponent(Show, {
				get when() {
					return memo(() => !!pinRequired())() && !cachedPin();
				},
				get children() {
					return createComponent(PinField, {
						get pin() {
							return pin();
						},
						onPinChange: setPin,
						get remember() {
							return rememberPin();
						},
						onRememberChange: setRememberPin
					});
				}
			}), _el$9);
			insert(_el$9, createComponent(Button, {
				type: "button",
				variant: "secondary",
				onClick: () => props.closeModal(),
				children: "Cancel"
			}), null);
			insert(_el$9, createComponent(Show, {
				get when() {
					return advanceable().length > 0;
				},
				get children() {
					return createComponent(Button, {
						type: "button",
						variant: "warning",
						onClick: handleConfirm,
						children: "Advance Rotations"
					});
				}
			}), null);
			return _el$;
		})();
	};
	delegateEvents(["click"]);
	//#endregion
	//#region src/admin/backup-actions.ts
	/**
	* Triggers a browser download of the family chores backup JSON.
	*
	* The caller is responsible for resolving and providing the admin PIN (if required) before
	* invoking this helper. If the API rejects, the error is propagated to the caller.
	*
	* @param pin - The admin PIN, or `undefined` if the server does not require one.
	*/
	async function triggerBackupDownload(pin) {
		const blob = await downloadBackup(pin);
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "family-chores-backup.json";
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	}
	//#endregion
	//#region src/admin/info-box.tsx
	var _tmpl$$20 = /*#__PURE__*/ template(`<span class="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-xs font-bold text-slate-600">i`);
	var _tmpl$2$16 = /*#__PURE__*/ template(`<div><div>`);
	/**
	* Inline info box for contextual help text within the admin panel.
	*/
	var InfoBox = (props) => (() => {
		var _el$ = _tmpl$2$16(), _el$3 = _el$.firstChild;
		insert(_el$, createComponent(Show, {
			get when() {
				return props.icon;
			},
			get children() {
				return _tmpl$$20();
			}
		}), _el$3);
		insert(_el$3, () => props.children);
		createRenderEffect(() => className(_el$, `flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 ${props.class || ""}`));
		return _el$;
	})();
	//#endregion
	//#region src/admin/schedule-days-selector.tsx
	var _tmpl$$19 = /*#__PURE__*/ template(`<div class=mb-5 data-testid=schedule-days-selector><div class="mb-3 flex flex-wrap items-center justify-between gap-2"><div class="font-medium text-slate-900">Schedule</div><div class="inline-flex rounded-lg bg-slate-100 p-1 text-sm"role=tablist aria-label="Schedule selection mode"><button type=button role=tab class="rounded-md px-3 py-1 font-medium transition-colors">Every day except</button><button type=button role=tab class="rounded-md px-3 py-1 font-medium transition-colors">Only on selected days</button></div></div><div class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"data-testid=skip-days-checkbox-list><div class="mb-1 text-sm font-medium text-slate-700"></div></div><p class="mt-2 text-sm text-slate-600"data-testid=schedule-summary>`);
	var _tmpl$2$15 = /*#__PURE__*/ template(`<label class="flex cursor-pointer items-center gap-2 font-normal"><input type=checkbox class="size-4.5 cursor-pointer">`);
	var DAYS$1 = Object.values(DayOfWeek);
	var dayLabel = (day) => day.charAt(0).toUpperCase() + day.slice(1);
	/** Lets an admin edit the same skip-day data using either skipped or active weekdays. */
	var ScheduleDaysSelector = (props) => {
		const [mode, setMode] = createSignal(untrack(() => props.skipDays()).length > 3 ? "only" : "except");
		const activeDays = createMemo(() => DAYS$1.filter((day) => !props.skipDays().includes(day)));
		const isChecked = (day) => mode() === "except" ? props.skipDays().includes(day) : !props.skipDays().includes(day);
		const setDayChecked = (day, checked) => {
			const shouldSkip = mode() === "except" ? checked : !checked;
			const current = props.skipDays();
			const next = shouldSkip ? current.includes(day) ? current : [...current, day] : current.filter((currentDay) => currentDay !== day);
			props.setSkipDays(DAYS$1.filter((currentDay) => next.includes(currentDay)));
		};
		const scheduleSummary = createMemo(() => {
			const active = activeDays();
			if (active.length === DAYS$1.length) return "This chore is active every day.";
			if (active.length === 0) return "This chore is not active on any day.";
			return `This chore is active on ${active.map(dayLabel).join(", ")}.`;
		});
		return (() => {
			var _el$ = _tmpl$$19(), _el$2 = _el$.firstChild, _el$5 = _el$2.firstChild.nextSibling.firstChild, _el$6 = _el$5.nextSibling, _el$7 = _el$2.nextSibling, _el$8 = _el$7.firstChild, _el$9 = _el$7.nextSibling;
			_el$5.$$click = () => setMode("except");
			_el$6.$$click = () => setMode("only");
			insert(_el$8, createComponent(Show, {
				get when() {
					return mode() === "except";
				},
				fallback: "Days to do this chore",
				children: "Days to skip"
			}));
			insert(_el$7, createComponent(For, {
				each: DAYS$1,
				children: (day) => (() => {
					var _el$0 = _tmpl$2$15(), _el$1 = _el$0.firstChild;
					_el$1.$$input = (event) => setDayChecked(day, event.currentTarget.checked);
					_el$1.value = day;
					insert(_el$0, () => dayLabel(day), null);
					createRenderEffect(() => _el$1.checked = isChecked(day));
					return _el$0;
				})()
			}), null);
			insert(_el$9, scheduleSummary, null);
			insert(_el$9, createComponent(Show, {
				get when() {
					return mode() === "only";
				},
				get children() {
					return [" ", "Days not selected are skip days; Skip day visibility controls what happens on those days."];
				}
			}), null);
			createRenderEffect((_p$) => {
				var _v$ = mode() === "except", _v$2 = {
					"bg-white text-indigo-600 shadow-sm": mode() === "except",
					"text-slate-500 hover:text-slate-700": mode() !== "except"
				}, _v$3 = mode() === "only", _v$4 = {
					"bg-white text-indigo-600 shadow-sm": mode() === "only",
					"text-slate-500 hover:text-slate-700": mode() !== "only"
				};
				_v$ !== _p$.e && setAttribute(_el$5, "aria-selected", _p$.e = _v$);
				_p$.t = classList(_el$5, _v$2, _p$.t);
				_v$3 !== _p$.a && setAttribute(_el$6, "aria-selected", _p$.a = _v$3);
				_p$.o = classList(_el$6, _v$4, _p$.o);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0,
				o: void 0
			});
			return _el$;
		})();
	};
	delegateEvents(["click", "input"]);
	//#endregion
	//#region src/admin/time-select.tsx
	var _tmpl$$18 = /*#__PURE__*/ template(`<optgroup label=AM>`);
	var _tmpl$2$14 = /*#__PURE__*/ template(`<optgroup label=PM>`);
	var _tmpl$3$13 = /*#__PURE__*/ template(`<select class="w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><option value>— Not set —`);
	var _tmpl$4$9 = /*#__PURE__*/ template(`<option>`);
	var MINUTES = ["00", "30"];
	/** All standard 30-minute-increment options in HH:MM 24-hour format starting at 00:30 */
	var STANDARD_OPTIONS = [];
	for (let h = 0; h < 24; h++) for (const m of MINUTES) {
		const time = `${String(h).padStart(2, "0")}:${m}`;
		if (time === "00:00") continue;
		STANDARD_OPTIONS.push(time);
	}
	/**
	* Convert a 24-hour HH:MM string to a display label based on time format.
	*/
	var toLabel = (time, use12Hour) => {
		if (!use12Hour) return time;
		const [hourStr, minuteStr] = time.split(":");
		const hour = Number.parseInt(hourStr, 10);
		const ampm = hour < 12 ? "AM" : "PM";
		return `${hour % 12 === 0 ? 12 : hour % 12}:${minuteStr} ${ampm}`;
	};
	var TimeSelect = (props) => {
		const { resolvedTimeFormat } = useAdminContext();
		const use12Hour = () => resolvedTimeFormat() === TimeFormat.HOUR_12;
		const options = () => {
			const base = [...STANDARD_OPTIONS];
			if (props.value && !base.includes(props.value)) return [...base, props.value].sort();
			return base;
		};
		const handleChange = (e) => {
			props.onChange(e.currentTarget.value);
		};
		return (() => {
			var _el$ = _tmpl$3$13(), _el$2 = _el$.firstChild;
			_el$.addEventListener("change", handleChange);
			insert(_el$, createComponent(Show, {
				get when() {
					return !use12Hour();
				},
				get children() {
					return createComponent(For, {
						get each() {
							return options();
						},
						children: (opt) => (() => {
							var _el$5 = _tmpl$4$9();
							_el$5.value = opt;
							insert(_el$5, () => toLabel(opt, false));
							createRenderEffect(() => _el$5.selected = opt === props.value);
							return _el$5;
						})()
					});
				}
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return use12Hour();
				},
				get children() {
					return [(() => {
						var _el$3 = _tmpl$$18();
						insert(_el$3, createComponent(For, {
							get each() {
								return options().filter((o) => Number.parseInt(o.split(":")[0], 10) < 12);
							},
							children: (opt) => (() => {
								var _el$6 = _tmpl$4$9();
								_el$6.value = opt;
								insert(_el$6, () => toLabel(opt, true));
								createRenderEffect(() => _el$6.selected = opt === props.value);
								return _el$6;
							})()
						}));
						return _el$3;
					})(), (() => {
						var _el$4 = _tmpl$2$14();
						insert(_el$4, createComponent(For, {
							get each() {
								return options().filter((o) => Number.parseInt(o.split(":")[0], 10) >= 12);
							},
							children: (opt) => (() => {
								var _el$7 = _tmpl$4$9();
								_el$7.value = opt;
								insert(_el$7, () => toLabel(opt, true));
								createRenderEffect(() => _el$7.selected = opt === props.value);
								return _el$7;
							})()
						}));
						return _el$4;
					})()];
				}
			}), null);
			createRenderEffect((_p$) => {
				var _v$ = props.id, _v$2 = props.value === "";
				_v$ !== _p$.e && setAttribute(_el$, "id", _p$.e = _v$);
				_v$2 !== _p$.t && (_el$2.selected = _p$.t = _v$2);
				return _p$;
			}, {
				e: void 0,
				t: void 0
			});
			return _el$;
		})();
	};
	//#endregion
	//#region src/admin/bulk-edit-modal.tsx
	var _tmpl$$17 = /*#__PURE__*/ template(`<button type=button class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"><span class="flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border text-[10px] leading-none">`);
	var _tmpl$2$13 = /*#__PURE__*/ template(`<button type=button class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"aria-label=Close>×`);
	var _tmpl$3$12 = /*#__PURE__*/ template(`<div class="flex flex-col gap-2"><span><strong>Recommended:</strong> download a backup before making bulk changes, in case you want to undo.</span><div class="flex justify-end">`);
	var _tmpl$4$8 = /*#__PURE__*/ template(`<div data-testid=step-field><div class=mb-4><h4 class="mb-2 font-medium text-slate-900">Main Settings</h4><div class="flex flex-col gap-2"></div></div><div class=mb-4><h4 class="mb-2 font-medium text-slate-900">Advanced Display Settings</h4><div class="flex flex-col gap-2"></div></div><div class="mt-6 flex justify-end gap-2.5">`);
	var _tmpl$5$7 = /*#__PURE__*/ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] scale-95 overflow-y-auto rounded-xl bg-white shadow-2xl transition-[transform,max-width] duration-200"data-testid=modal-content><div class="sticky top-0 z-10 rounded-t-xl border-b border-slate-100 bg-white px-8 pt-8 pb-4"data-testid=modal-header><div class="mb-2 flex items-center justify-between"><h3 class="text-2xl text-indigo-600"data-testid=modal-title>Bulk Edit <!> Chore Settings</h3></div><div class="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-400"data-testid=wizard-breadcrumb><span>① Field</span><span>→</span><span>② Value</span><span>→</span><span>③ Chores</span><span>→</span><span>④ Confirm</span></div></div><div class="px-8 pt-4 pb-8"data-testid=modal-body>`);
	var _tmpl$6$7 = /*#__PURE__*/ template(`<div class="rounded-lg border border-slate-200 p-3"><label class="flex cursor-pointer items-center gap-2"><input type=radio name=bulk-edit-field><span class="font-medium text-slate-900"></span></label><p class="mt-1 ml-6 text-sm text-slate-500">`);
	var _tmpl$7$6 = /*#__PURE__*/ template(`<div data-testid=step-value><h4 class="mb-3 font-medium text-slate-900">New value for </h4><div class="mt-6 flex justify-end gap-2.5">`);
	var _tmpl$8$3 = /*#__PURE__*/ template(`<div class="flex flex-col gap-2">`);
	var _tmpl$9$1 = /*#__PURE__*/ template(`<div class="rounded-lg border border-slate-200 p-3"><label class="flex cursor-pointer items-center gap-2"><input type=radio name=bulk-edit-value><span class="font-medium text-slate-900"></span></label><p class="mt-1 ml-6 text-sm text-slate-500">`);
	var _tmpl$0$1 = /*#__PURE__*/ template(`<div class="rounded-lg border border-slate-200"data-testid=compact-chore-list>`);
	var _tmpl$1$1 = /*#__PURE__*/ template(`<th class=p-2>Person`);
	var _tmpl$10$1 = /*#__PURE__*/ template(`<div class="overflow-x-auto rounded-lg border border-slate-200"data-testid=detailed-chore-table><table class="w-full text-sm"><thead><tr class="bg-slate-50 text-left text-xs text-slate-500 uppercase"><th class=p-2></th><th class=p-2>Chore</th><th class=p-2>Start Time</th><th class=p-2>Deadline</th><th class=p-2>Skip Days</th><th class=p-2>Skip Day Visibility</th><th class=p-2>Before Start Time</th><th class=p-2>After Deadline</th><th class=p-2>Not Caught Up Display</th></tr></thead><tbody>`);
	var _tmpl$11$1 = /*#__PURE__*/ template(`<div data-testid=step-chores><div class="mb-4 flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm"><span><strong></strong> → </span><button type=button class="text-indigo-600 underline"data-testid=edit-field-link>Edit</button></div><div class="mb-3 inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-sm"role=tablist aria-label="Chore list view"><button type=button role=tab class="rounded-md px-3 py-1 font-medium transition-colors"data-testid=view-mode-compact>Compact</button><button type=button role=tab class="rounded-md px-3 py-1 font-medium transition-colors"data-testid=view-mode-detailed>Detailed table</button></div><div class="mb-3 flex flex-wrap gap-2"data-testid=smart-select-shortcuts><button type=button class="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50"data-testid=select-none-chip>Clear</button></div><div class="mt-6 flex justify-end gap-2.5">`);
	var _tmpl$12$1 = /*#__PURE__*/ template(`<p class="my-4 text-slate-500 italic"data-testid=no-chores-message>No chores of this type yet.`);
	var _tmpl$13$1 = /*#__PURE__*/ template(`<div>`);
	var _tmpl$14$1 = /*#__PURE__*/ template(`<div class="border-t border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 first:border-t-0">`);
	var _tmpl$15 = /*#__PURE__*/ template(`<span class="text-xs text-slate-400">(why?)`);
	var _tmpl$16 = /*#__PURE__*/ template(`<label class="flex items-center gap-2 border-t border-slate-100 px-3 py-2 transition-colors"><input type=checkbox><span></span><span class="text-sm text-slate-500">— currently: `);
	var _tmpl$17 = /*#__PURE__*/ template(`<td class="border-t border-slate-100 p-2">`);
	var _tmpl$18 = /*#__PURE__*/ template(`<tr><td class="border-t border-slate-100 p-2"><input type=checkbox></td><td class="border-t border-slate-100 p-2"></td><td class="border-t border-slate-100 p-2"></td><td class="border-t border-slate-100 p-2"></td><td class="border-t border-slate-100 p-2"></td><td class="border-t border-slate-100 p-2"></td><td class="border-t border-slate-100 p-2"></td><td class="border-t border-slate-100 p-2"></td><td class="border-t border-slate-100 p-2">`);
	var _tmpl$19 = /*#__PURE__*/ template(`<div data-testid=step-confirm><div class="mb-4 overflow-hidden rounded-lg border border-slate-200"data-testid=confirm-grid><div class="grid grid-cols-[1.5fr_1fr_auto_1fr_auto] items-center gap-x-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase"><span>Chore</span><span>Current</span><span></span><span>New</span><span>Status</span></div></div><div class="mt-6 flex justify-end gap-2.5">`);
	var _tmpl$20 = /*#__PURE__*/ template(`<div class="border-t border-slate-100 bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-600">`);
	var _tmpl$21 = /*#__PURE__*/ template(`<div class="grid grid-cols-[1.5fr_1fr_auto_1fr_auto] items-center gap-x-3 border-t border-slate-100 px-4 py-2"><span class="font-medium text-slate-800"></span><span class="text-sm text-slate-500"></span><span class=text-slate-400>→</span><span class="text-sm font-semibold text-indigo-600"></span><span>`);
	var MAIN_FIELDS = [
		"startTime",
		"deadline",
		"skipDays"
	];
	var ADVANCED_FIELDS = [
		"notCaughtUpDisplay",
		"beforeStartTimeVisibility",
		"afterDeadlineVisibility",
		"skipDayVisibility"
	];
	var FIELD_LABELS = {
		startTime: "Start Time",
		deadline: "Deadline",
		skipDays: "Skip Days",
		notCaughtUpDisplay: "Not Caught Up Display",
		beforeStartTimeVisibility: "Before Start Time Visibility",
		afterDeadlineVisibility: "After Deadline Visibility",
		skipDayVisibility: "Skip Day Visibility"
	};
	var FIELD_DESCRIPTIONS = {
		startTime: "The time each selected chore first becomes visible.",
		deadline: "The time each selected chore is due by.",
		skipDays: "Days of the week each selected chore does not need to be done.",
		notCaughtUpDisplay: "Whether a chore that is not caught up is styled as overdue or normal.",
		beforeStartTimeVisibility: "Whether a chore that is not caught up can appear before its start time.",
		afterDeadlineVisibility: "How a chore behaves after its deadline passes.",
		skipDayVisibility: "How a chore behaves on its own skip days."
	};
	var NOT_CAUGHT_UP_LABELS = {
		[NotCaughtUpDisplay.OVERDUE]: "Overdue styling",
		[NotCaughtUpDisplay.NORMAL]: "Normal styling"
	};
	var BEFORE_START_LABELS = {
		[BeforeStartTimeVisibility.HIDE]: "Hide",
		[BeforeStartTimeVisibility.SHOW_IF_OVERDUE]: "Show if overdue"
	};
	var AFTER_DEADLINE_LABELS = {
		[AfterDeadlineVisibility.SHOW_NORMAL]: "Show normally",
		[AfterDeadlineVisibility.SHOW_OVERDUE]: "Show as overdue",
		[AfterDeadlineVisibility.MOVE_TO_EARLIER]: "Move to earlier chores"
	};
	var SKIP_DAY_VIS_LABELS = {
		[SkipDayVisibility.HIDE]: "Hide",
		[SkipDayVisibility.SHOW_ALWAYS]: "Always Show",
		[SkipDayVisibility.SHOW_IF_OVERDUE]: "Show If Overdue"
	};
	var RADIO_OPTIONS = {
		notCaughtUpDisplay: [{
			value: NotCaughtUpDisplay.OVERDUE,
			label: "Overdue styling",
			description: "If the chore is not caught up, it is styled as overdue (default style is yellow)."
		}, {
			value: NotCaughtUpDisplay.NORMAL,
			label: "Normal styling",
			description: "If the chore is not caught up, it is styled as normal."
		}],
		beforeStartTimeVisibility: [{
			value: BeforeStartTimeVisibility.HIDE,
			label: "Hide",
			description: "The chore stays hidden until its start time even if it is not caught up."
		}, {
			value: BeforeStartTimeVisibility.SHOW_IF_OVERDUE,
			label: "Show if overdue",
			description: "If the chore is not caught up, it appears before its start time so it can be caught up early."
		}],
		afterDeadlineVisibility: [
			{
				value: AfterDeadlineVisibility.SHOW_NORMAL,
				label: "Show normally",
				description: "Stays in the main list after the deadline until completed."
			},
			{
				value: AfterDeadlineVisibility.SHOW_OVERDUE,
				label: "Show as overdue",
				description: "Stays in the main list and turns yellow after the deadline until completed."
			},
			{
				value: AfterDeadlineVisibility.MOVE_TO_EARLIER,
				label: "Move to earlier chores",
				description: "Moves to the \"Earlier chores\" section after the deadline whether complete or not."
			}
		],
		skipDayVisibility: [
			{
				value: SkipDayVisibility.HIDE,
				label: "Hide",
				description: "The chore disappears completely on skip days. It's a true day off."
			},
			{
				value: SkipDayVisibility.SHOW_ALWAYS,
				label: "Always Show",
				description: "The chore stays visible on skip days (a grace day if already caught up)."
			},
			{
				value: SkipDayVisibility.SHOW_IF_OVERDUE,
				label: "Show If Overdue",
				description: "The chore appears on skip days only if it is not caught up."
			}
		]
	};
	var isFieldEligibleForChore = (field, chore) => {
		switch (field) {
			case "beforeStartTimeVisibility": return !!chore.startTime;
			case "afterDeadlineVisibility": return !!chore.deadline;
			case "skipDayVisibility": return chore.skipDays.length > 0;
			default: return true;
		}
	};
	var ineligibleReason = (field) => {
		switch (field) {
			case "beforeStartTimeVisibility": return "This setting has no effect until the chore has a start time.";
			case "afterDeadlineVisibility": return "This setting has no effect until the chore has a deadline.";
			case "skipDayVisibility": return "This setting has no effect until the chore has skip days configured.";
			default: return "";
		}
	};
	var defaultValueForField = (field) => {
		switch (field) {
			case "startTime":
			case "deadline": return "";
			case "skipDays": return [];
			case "notCaughtUpDisplay": return NotCaughtUpDisplay.OVERDUE;
			case "beforeStartTimeVisibility": return BeforeStartTimeVisibility.HIDE;
			case "afterDeadlineVisibility": return AfterDeadlineVisibility.SHOW_OVERDUE;
			case "skipDayVisibility": return SkipDayVisibility.HIDE;
		}
	};
	var getChoreValue = (chore, field) => {
		switch (field) {
			case "startTime": return chore.startTime ?? "";
			case "deadline": return chore.deadline ?? "";
			case "skipDays": return chore.skipDays;
			case "notCaughtUpDisplay": return chore.notCaughtUpDisplay;
			case "beforeStartTimeVisibility": return chore.beforeStartTimeVisibility;
			case "afterDeadlineVisibility": return chore.afterDeadlineVisibility;
			case "skipDayVisibility": return chore.skipDayVisibility;
		}
	};
	var formatSkipDays = (days) => {
		if (!days || days.length === 0) return "None";
		return days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
	};
	var formatFieldValue = (field, value, timeFormat) => {
		switch (field) {
			case "startTime":
			case "deadline": return value ? formatTime(value, timeFormat) : "Not set";
			case "skipDays": return formatSkipDays(value);
			case "notCaughtUpDisplay": return NOT_CAUGHT_UP_LABELS[value] ?? String(value);
			case "beforeStartTimeVisibility": return BEFORE_START_LABELS[value] ?? String(value);
			case "afterDeadlineVisibility": return AFTER_DEADLINE_LABELS[value] ?? String(value);
			case "skipDayVisibility": return SKIP_DAY_VIS_LABELS[value] ?? String(value);
		}
	};
	var valueMatchesChore = (field, expected, chore) => {
		const actual = getChoreValue(chore, field);
		if (field === "skipDays") {
			const actualDays = actual;
			const expectedDays = expected;
			return actualDays.length === expectedDays.length && expectedDays.every((d) => actualDays.includes(d));
		}
		if (field === "startTime" || field === "deadline") return (actual || "") === (expected || "");
		return actual === expected;
	};
	var buildFieldPayload = (field, value) => {
		switch (field) {
			case "startTime": return { startTime: value === "" ? null : value };
			case "deadline": return { deadline: value === "" ? null : value };
			case "skipDays": return { skipDays: value };
			case "notCaughtUpDisplay": return { notCaughtUpDisplay: value };
			case "beforeStartTimeVisibility": return { beforeStartTimeVisibility: value };
			case "afterDeadlineVisibility": return { afterDeadlineVisibility: value };
			case "skipDayVisibility": return { skipDayVisibility: value };
		}
	};
	var statusLabel = (status) => {
		switch (status) {
			case "pending": return "Pending";
			case "in-progress": return "…";
			case "done": return "✓ Done";
			case "failed": return "✗ Failed";
		}
	};
	/**
	* Small checkbox-style toggle chip used for the Step 3 smart-select shortcuts.
	* Shows a checkmark when every matching chore is selected, a dash when only
	* some are, and an empty box when none are — clicking toggles the whole group.
	*/
	var SelectionChip = (props) => (() => {
		var _el$ = _tmpl$$17(), _el$2 = _el$.firstChild;
		_el$.$$click = () => props.onClick();
		insert(_el$2, createComponent(Show, {
			get when() {
				return props.state === "all";
			},
			children: "✓"
		}), null);
		insert(_el$2, createComponent(Show, {
			get when() {
				return props.state === "some";
			},
			children: "–"
		}), null);
		insert(_el$, () => props.label, null);
		createRenderEffect((_p$) => {
			var _v$ = props.dataTestId, _v$2 = {
				"border-indigo-300 bg-indigo-50 text-indigo-700": props.state !== "none",
				"border-slate-300 bg-white text-slate-600 hover:bg-slate-50": props.state === "none"
			}, _v$3 = {
				"border-indigo-500 bg-indigo-500 text-white": props.state === "all",
				"border-indigo-400 bg-white text-indigo-500": props.state === "some",
				"border-slate-300 bg-white": props.state === "none"
			};
			_v$ !== _p$.e && setAttribute(_el$, "data-testid", _p$.e = _v$);
			_p$.t = classList(_el$, _v$2, _p$.t);
			_p$.a = classList(_el$2, _v$3, _p$.a);
			return _p$;
		}, {
			e: void 0,
			t: void 0,
			a: void 0
		});
		return _el$;
	})();
	/**
	* Wizard modal for changing a single chore setting across many chores of one type
	* (personal or rotating) at once. See docs/plan for the full design rationale.
	*/
	var BulkEditModal = (props) => {
		const { choreData, loadData, pinRequired, cachedPin, setCachedPin, resolvedTimeFormat } = useAdminContext();
		const [step, setStep] = createSignal(1);
		const [field, setFieldRaw] = createSignal(null);
		const [value, setValue] = createSignal("");
		const [selectedChoreIds, setSelectedChoreIds] = createSignal([]);
		const [viewMode, setViewMode] = createSignal("compact");
		const [pin, setPin] = createSignal("");
		const [rememberPin, setRememberPin] = createSignal(false);
		const [submitStatus, setSubmitStatus] = createSignal({});
		const [isSubmitting, setIsSubmitting] = createSignal(false);
		const [finished, setFinished] = createSignal(false);
		const [pinError, setPinError] = createSignal(false);
		const [submitError, setSubmitError] = createSignal("");
		const pinToUse = () => cachedPin() || pin();
		const chooseField = (newField) => {
			setFieldRaw(newField);
			setValue(defaultValueForField(newField));
			setSelectedChoreIds([]);
		};
		const choresForType = createMemo(() => choreData().chores.filter((c) => c.type === props.choreType));
		const groupedChores = createMemo(() => {
			if (props.choreType === ChoreType.ROTATING) return [{
				person: null,
				chores: choresForType()
			}];
			return choreData().people.map((person) => ({
				person,
				chores: choresForType().filter((c) => c.type === ChoreType.PERSONAL && c.assignedTo === person.id)
			})).filter((group) => group.chores.length > 0);
		});
		const eligibleChores = createMemo(() => {
			const f = field();
			if (!f) return [];
			return choresForType().filter((c) => isFieldEligibleForChore(f, c));
		});
		const valueBuckets = createMemo(() => {
			const f = field();
			if (!f) return [];
			if (f === "skipDays" || f === "startTime" || f === "deadline") {
				const hasValue = [];
				const noValue = [];
				for (const chore of eligibleChores()) {
					const v = getChoreValue(chore, f);
					((Array.isArray(v) ? v.length === 0 : !v) ? noValue : hasValue).push(chore.id);
				}
				const buckets = [];
				const noun = f === "skipDays" ? "skip day" : "value";
				if (hasValue.length > 0) buckets.push({
					label: `has a ${noun} set`,
					choreIds: hasValue
				});
				if (noValue.length > 0) buckets.push({
					label: `has no ${noun} set`,
					choreIds: noValue
				});
				return buckets;
			}
			const byValue = /* @__PURE__ */ new Map();
			for (const chore of eligibleChores()) {
				const key = String(getChoreValue(chore, f));
				const ids = byValue.get(key) ?? [];
				ids.push(chore.id);
				byValue.set(key, ids);
			}
			return Array.from(byValue.entries()).map(([key, ids]) => ({
				label: `is currently "${formatFieldValue(f, key, resolvedTimeFormat())}"`,
				choreIds: ids
			}));
		});
		const toggleChore = (id, checked) => {
			if (checked) setSelectedChoreIds([...selectedChoreIds(), id]);
			else setSelectedChoreIds(selectedChoreIds().filter((choreId) => choreId !== id));
		};
		const selectNone = () => setSelectedChoreIds([]);
		const bucketSelectionState = (ids) => {
			if (ids.length === 0) return "none";
			const selected = selectedChoreIds();
			const selectedCount = ids.filter((id) => selected.includes(id)).length;
			if (selectedCount === 0) return "none";
			return selectedCount === ids.length ? "all" : "some";
		};
		const toggleBucketSelection = (ids) => {
			if (bucketSelectionState(ids) === "all") setSelectedChoreIds(selectedChoreIds().filter((id) => !ids.includes(id)));
			else setSelectedChoreIds(Array.from(/* @__PURE__ */ new Set([...selectedChoreIds(), ...ids])));
		};
		const handleDownloadBackup = async () => {
			try {
				const pinValue = pinToUse();
				if (pinRequired() && !pinValue) {
					alert("Enter your admin PIN below first, then click Download Backup again.");
					return;
				}
				await triggerBackupDownload(pinValue || void 0);
			} catch (error) {
				console.error("Error downloading backup:", error);
				alert(`Failed to download backup: ${error instanceof Error ? error.message : "Please try again."}`);
			}
		};
		const doneCount = () => Object.values(submitStatus()).filter((s) => s === "done").length;
		const handleApply = async () => {
			const f = field();
			if (!f) return;
			const ids = selectedChoreIds();
			const initialStatus = {};
			for (const id of ids) initialStatus[id] = "pending";
			setSubmitStatus(initialStatus);
			setPinError(false);
			setSubmitError("");
			setIsSubmitting(true);
			const payload = buildFieldPayload(f, value());
			const expected = value();
			let stoppedEarly = false;
			for (const id of ids) {
				setSubmitStatus((prev) => ({
					...prev,
					[id]: "in-progress"
				}));
				try {
					const pinValue = pinRequired() ? pinToUse() || void 0 : void 0;
					if (!valueMatchesChore(f, expected, await updateChore(id, {
						...payload,
						pin: pinValue
					}))) throw new Error("Update did not apply as expected");
					setSubmitStatus((prev) => ({
						...prev,
						[id]: "done"
					}));
				} catch (error) {
					setSubmitStatus((prev) => ({
						...prev,
						[id]: "failed"
					}));
					if (error instanceof Error && error.message === "Invalid PIN") {
						setPinError(true);
						setCachedPin("");
					} else setSubmitError(error instanceof Error ? error.message : "Unknown error");
					stoppedEarly = true;
					break;
				}
			}
			if (!stoppedEarly && !cachedPin() && rememberPin() && pin()) setCachedPin(pin());
			setIsSubmitting(false);
			setFinished(true);
		};
		const handleClose = async () => {
			await loadData();
			props.closeModal();
		};
		const canApply = () => !(pinRequired() && !cachedPin() && !pin());
		const isWideLayout = () => step() === 3 && viewMode() === "detailed";
		return (() => {
			var _el$3 = _tmpl$5$7(), _el$4 = _el$3.firstChild, _el$5 = _el$4.firstChild, _el$6 = _el$5.firstChild, _el$7 = _el$6.firstChild, _el$0 = _el$7.firstChild.nextSibling;
			_el$0.nextSibling;
			var _el$11 = _el$6.nextSibling.firstChild, _el$13 = _el$11.nextSibling.nextSibling, _el$15 = _el$13.nextSibling.nextSibling, _el$17 = _el$15.nextSibling.nextSibling, _el$18 = _el$5.nextSibling;
			insert(_el$7, () => props.choreType === ChoreType.PERSONAL ? "Personal" : "Rotating", _el$0);
			insert(_el$6, createComponent(Show, {
				get when() {
					return !isSubmitting();
				},
				get children() {
					var _el$1 = _tmpl$2$13();
					_el$1.$$click = () => props.closeModal();
					return _el$1;
				}
			}), null);
			insert(_el$18, createComponent(Show, {
				get when() {
					return step() === 1;
				},
				get children() {
					var _el$19 = _tmpl$4$8(), _el$23 = _el$19.firstChild, _el$25 = _el$23.firstChild.nextSibling, _el$26 = _el$23.nextSibling, _el$28 = _el$26.firstChild.nextSibling, _el$29 = _el$26.nextSibling;
					insert(_el$19, createComponent(InfoBox, {
						icon: true,
						"class": "mb-4",
						get children() {
							var _el$20 = _tmpl$3$12(), _el$22 = _el$20.firstChild.nextSibling;
							insert(_el$22, createComponent(Button, {
								type: "button",
								variant: "secondary",
								size: "sm",
								onClick: handleDownloadBackup,
								dataTestId: "backup-download-btn",
								children: "Download Backup"
							}));
							return _el$20;
						}
					}), _el$23);
					insert(_el$19, createComponent(Show, {
						get when() {
							return memo(() => !!pinRequired())() && !cachedPin();
						},
						get children() {
							return createComponent(PinField, {
								get pin() {
									return pin();
								},
								onPinChange: setPin,
								get remember() {
									return rememberPin();
								},
								onRememberChange: setRememberPin
							});
						}
					}), _el$23);
					insert(_el$19, createComponent(InfoBox, {
						"class": "mb-4",
						children: "Because these settings can interact with each other, you can only bulk-edit one setting at a time. To change multiple settings, run this tool again for each one."
					}), _el$23);
					insert(_el$25, createComponent(For, {
						each: MAIN_FIELDS,
						children: (f) => (() => {
							var _el$30 = _tmpl$6$7(), _el$31 = _el$30.firstChild, _el$32 = _el$31.firstChild, _el$33 = _el$32.nextSibling, _el$34 = _el$31.nextSibling;
							setAttribute(_el$31, "for", `field-${f}`);
							_el$32.$$input = () => chooseField(f);
							setAttribute(_el$32, "id", `field-${f}`);
							insert(_el$33, () => FIELD_LABELS[f]);
							insert(_el$34, () => FIELD_DESCRIPTIONS[f]);
							createRenderEffect(() => _el$32.checked = field() === f);
							return _el$30;
						})()
					}));
					insert(_el$28, createComponent(For, {
						each: ADVANCED_FIELDS,
						children: (f) => (() => {
							var _el$35 = _tmpl$6$7(), _el$36 = _el$35.firstChild, _el$37 = _el$36.firstChild, _el$38 = _el$37.nextSibling, _el$39 = _el$36.nextSibling;
							setAttribute(_el$36, "for", `field-${f}`);
							_el$37.$$input = () => chooseField(f);
							setAttribute(_el$37, "id", `field-${f}`);
							insert(_el$38, () => FIELD_LABELS[f]);
							insert(_el$39, () => FIELD_DESCRIPTIONS[f]);
							createRenderEffect(() => _el$37.checked = field() === f);
							return _el$35;
						})()
					}));
					insert(_el$29, createComponent(Button, {
						type: "button",
						variant: "secondary",
						onClick: () => props.closeModal(),
						children: "Cancel"
					}), null);
					insert(_el$29, createComponent(Button, {
						type: "button",
						variant: "primary",
						get disabled() {
							return !field();
						},
						onClick: () => setStep(2),
						dataTestId: "next-button",
						children: "Next"
					}), null);
					return _el$19;
				}
			}), null);
			insert(_el$18, createComponent(Show, {
				get when() {
					return memo(() => step() === 2)() && field();
				},
				children: (f) => (() => {
					var _el$40 = _tmpl$7$6(), _el$41 = _el$40.firstChild;
					_el$41.firstChild;
					var _el$43 = _el$41.nextSibling;
					insert(_el$41, () => FIELD_LABELS[f()], null);
					insert(_el$40, createComponent(Show, {
						get when() {
							return f() === "startTime" || f() === "deadline";
						},
						get children() {
							return createComponent(TimeSelect, {
								id: "bulk-value-time",
								get value() {
									return value();
								},
								onChange: setValue
							});
						}
					}), _el$43);
					insert(_el$40, createComponent(Show, {
						get when() {
							return f() === "skipDays";
						},
						get children() {
							return createComponent(ScheduleDaysSelector, {
								skipDays: () => value(),
								setSkipDays: setValue
							});
						}
					}), _el$43);
					insert(_el$40, createComponent(Show, {
						get when() {
							return RADIO_OPTIONS[f()];
						},
						children: (options) => (() => {
							var _el$44 = _tmpl$8$3();
							insert(_el$44, createComponent(For, {
								get each() {
									return options();
								},
								children: (opt) => (() => {
									var _el$45 = _tmpl$9$1(), _el$46 = _el$45.firstChild, _el$47 = _el$46.firstChild, _el$48 = _el$47.nextSibling, _el$49 = _el$46.nextSibling;
									_el$47.$$input = () => setValue(opt.value);
									insert(_el$48, () => opt.label);
									insert(_el$49, () => opt.description);
									createRenderEffect((_p$) => {
										var _v$9 = `value-${opt.value}`, _v$0 = `value-${opt.value}`;
										_v$9 !== _p$.e && setAttribute(_el$46, "for", _p$.e = _v$9);
										_v$0 !== _p$.t && setAttribute(_el$47, "id", _p$.t = _v$0);
										return _p$;
									}, {
										e: void 0,
										t: void 0
									});
									createRenderEffect(() => _el$47.checked = value() === opt.value);
									return _el$45;
								})()
							}));
							return _el$44;
						})()
					}), _el$43);
					insert(_el$43, createComponent(Button, {
						type: "button",
						variant: "secondary",
						onClick: () => setStep(1),
						children: "Back"
					}), null);
					insert(_el$43, createComponent(Button, {
						type: "button",
						variant: "primary",
						onClick: () => setStep(3),
						dataTestId: "next-button",
						children: "Next"
					}), null);
					return _el$40;
				})()
			}), null);
			insert(_el$18, createComponent(Show, {
				get when() {
					return memo(() => step() === 3)() && field();
				},
				children: (f) => (() => {
					var _el$50 = _tmpl$11$1(), _el$51 = _el$50.firstChild, _el$52 = _el$51.firstChild, _el$53 = _el$52.firstChild;
					_el$53.nextSibling;
					var _el$56 = _el$52.nextSibling, _el$57 = _el$51.nextSibling, _el$58 = _el$57.firstChild, _el$59 = _el$58.nextSibling, _el$60 = _el$57.nextSibling, _el$61 = _el$60.firstChild, _el$78 = _el$60.nextSibling;
					insert(_el$53, () => FIELD_LABELS[f()]);
					insert(_el$52, () => formatFieldValue(f(), value(), resolvedTimeFormat()), null);
					_el$56.$$click = () => setStep(1);
					_el$58.$$click = () => setViewMode("compact");
					_el$59.$$click = () => setViewMode("detailed");
					insert(_el$60, createComponent(SelectionChip, {
						label: "All",
						get state() {
							return bucketSelectionState(eligibleChores().map((c) => c.id));
						},
						onClick: () => toggleBucketSelection(eligibleChores().map((c) => c.id)),
						dataTestId: "select-all-chip"
					}), _el$61);
					_el$61.$$click = selectNone;
					insert(_el$60, createComponent(For, {
						get each() {
							return valueBuckets();
						},
						children: (bucket) => createComponent(SelectionChip, {
							get label() {
								return bucket.label;
							},
							get state() {
								return bucketSelectionState(bucket.choreIds);
							},
							onClick: () => toggleBucketSelection(bucket.choreIds)
						})
					}), null);
					insert(_el$50, createComponent(Show, {
						get when() {
							return choresForType().length > 0;
						},
						get fallback() {
							return _tmpl$12$1();
						},
						get children() {
							return [createComponent(Show, {
								get when() {
									return viewMode() === "compact";
								},
								get children() {
									var _el$62 = _tmpl$0$1();
									insert(_el$62, createComponent(For, {
										get each() {
											return groupedChores();
										},
										children: (group) => (() => {
											var _el$80 = _tmpl$13$1();
											insert(_el$80, createComponent(Show, {
												get when() {
													return group.person;
												},
												children: (person) => (() => {
													var _el$81 = _tmpl$14$1();
													insert(_el$81, () => person().name);
													return _el$81;
												})()
											}), null);
											insert(_el$80, createComponent(For, {
												get each() {
													return group.chores;
												},
												children: (chore) => {
													const eligible = () => isFieldEligibleForChore(f(), chore);
													return (() => {
														var _el$82 = _tmpl$16(), _el$83 = _el$82.firstChild, _el$84 = _el$83.nextSibling, _el$85 = _el$84.nextSibling;
														_el$85.firstChild;
														_el$83.$$input = (e) => toggleChore(chore.id, e.currentTarget.checked);
														insert(_el$84, () => chore.name);
														insert(_el$85, () => formatFieldValue(f(), getChoreValue(chore, f()), resolvedTimeFormat()), null);
														insert(_el$82, createComponent(Show, {
															get when() {
																return !eligible();
															},
															get children() {
																return createComponent(Tooltip, {
																	get text() {
																		return ineligibleReason(f());
																	},
																	position: "above",
																	align: "left",
																	get children() {
																		return _tmpl$15();
																	}
																});
															}
														}), null);
														createRenderEffect((_p$) => {
															var _v$20 = {
																"cursor-not-allowed opacity-50": !eligible(),
																"cursor-pointer hover:bg-slate-50": eligible()
															}, _v$21 = `chore-row-${chore.id}`, _v$22 = !eligible();
															_p$.e = classList(_el$82, _v$20, _p$.e);
															_v$21 !== _p$.t && setAttribute(_el$82, "data-testid", _p$.t = _v$21);
															_v$22 !== _p$.a && (_el$83.disabled = _p$.a = _v$22);
															return _p$;
														}, {
															e: void 0,
															t: void 0,
															a: void 0
														});
														createRenderEffect(() => _el$83.checked = selectedChoreIds().includes(chore.id));
														return _el$82;
													})();
												}
											}), null);
											return _el$80;
										})()
									}));
									return _el$62;
								}
							}), createComponent(Show, {
								get when() {
									return viewMode() === "detailed";
								},
								get children() {
									var _el$63 = _tmpl$10$1(), _el$65 = _el$63.firstChild.firstChild, _el$66 = _el$65.firstChild, _el$70 = _el$66.firstChild.nextSibling.nextSibling, _el$71 = _el$70.nextSibling, _el$72 = _el$71.nextSibling, _el$73 = _el$72.nextSibling, _el$74 = _el$73.nextSibling, _el$75 = _el$74.nextSibling, _el$76 = _el$75.nextSibling, _el$77 = _el$65.nextSibling;
									insert(_el$66, createComponent(Show, {
										get when() {
											return props.choreType === ChoreType.PERSONAL;
										},
										get children() {
											return _tmpl$1$1();
										}
									}), _el$70);
									insert(_el$77, createComponent(For, {
										get each() {
											return groupedChores();
										},
										children: (group) => createComponent(For, {
											get each() {
												return group.chores;
											},
											children: (chore) => {
												const eligible = () => isFieldEligibleForChore(f(), chore);
												const handleRowClick = (e) => {
													if (!eligible()) return;
													if (e.target.tagName === "INPUT") return;
													toggleChore(chore.id, !selectedChoreIds().includes(chore.id));
												};
												return (() => {
													var _el$89 = _tmpl$18(), _el$90 = _el$89.firstChild, _el$91 = _el$90.firstChild, _el$92 = _el$90.nextSibling, _el$94 = _el$92.nextSibling, _el$95 = _el$94.nextSibling, _el$96 = _el$95.nextSibling, _el$97 = _el$96.nextSibling, _el$98 = _el$97.nextSibling, _el$99 = _el$98.nextSibling, _el$100 = _el$99.nextSibling;
													_el$89.$$click = handleRowClick;
													_el$91.$$input = (e) => toggleChore(chore.id, e.currentTarget.checked);
													insert(_el$92, () => chore.name);
													insert(_el$89, createComponent(Show, {
														get when() {
															return props.choreType === ChoreType.PERSONAL;
														},
														get children() {
															var _el$93 = _tmpl$17();
															insert(_el$93, () => group.person?.name ?? "");
															return _el$93;
														}
													}), _el$94);
													insert(_el$94, (() => {
														var _c$ = memo(() => !!chore.startTime);
														return () => _c$() ? formatTime(chore.startTime, resolvedTimeFormat()) : "—";
													})());
													insert(_el$95, (() => {
														var _c$2 = memo(() => !!chore.deadline);
														return () => _c$2() ? formatTime(chore.deadline, resolvedTimeFormat()) : "—";
													})());
													insert(_el$96, () => formatSkipDays(chore.skipDays));
													insert(_el$97, () => SKIP_DAY_VIS_LABELS[chore.skipDayVisibility]);
													insert(_el$98, () => BEFORE_START_LABELS[chore.beforeStartTimeVisibility]);
													insert(_el$99, () => AFTER_DEADLINE_LABELS[chore.afterDeadlineVisibility]);
													insert(_el$100, () => NOT_CAUGHT_UP_LABELS[chore.notCaughtUpDisplay]);
													createRenderEffect((_p$) => {
														var _v$23 = {
															"cursor-not-allowed opacity-50": !eligible(),
															"cursor-pointer hover:bg-slate-50": eligible()
														}, _v$24 = `detailed-row-${chore.id}`, _v$25 = !eligible(), _v$26 = !!(f() === "startTime"), _v$27 = !!(f() === "deadline"), _v$28 = !!(f() === "skipDays"), _v$29 = !!(f() === "skipDayVisibility"), _v$30 = !!(f() === "beforeStartTimeVisibility"), _v$31 = !!(f() === "afterDeadlineVisibility"), _v$32 = !!(f() === "notCaughtUpDisplay");
														_p$.e = classList(_el$89, _v$23, _p$.e);
														_v$24 !== _p$.t && setAttribute(_el$89, "data-testid", _p$.t = _v$24);
														_v$25 !== _p$.a && (_el$91.disabled = _p$.a = _v$25);
														_v$26 !== _p$.o && _el$94.classList.toggle("bg-indigo-50", _p$.o = _v$26);
														_v$27 !== _p$.i && _el$95.classList.toggle("bg-indigo-50", _p$.i = _v$27);
														_v$28 !== _p$.n && _el$96.classList.toggle("bg-indigo-50", _p$.n = _v$28);
														_v$29 !== _p$.s && _el$97.classList.toggle("bg-indigo-50", _p$.s = _v$29);
														_v$30 !== _p$.h && _el$98.classList.toggle("bg-indigo-50", _p$.h = _v$30);
														_v$31 !== _p$.r && _el$99.classList.toggle("bg-indigo-50", _p$.r = _v$31);
														_v$32 !== _p$.d && _el$100.classList.toggle("bg-indigo-50", _p$.d = _v$32);
														return _p$;
													}, {
														e: void 0,
														t: void 0,
														a: void 0,
														o: void 0,
														i: void 0,
														n: void 0,
														s: void 0,
														h: void 0,
														r: void 0,
														d: void 0
													});
													createRenderEffect(() => _el$91.checked = selectedChoreIds().includes(chore.id));
													return _el$89;
												})();
											}
										})
									}));
									createRenderEffect((_p$) => {
										var _v$1 = { "bg-indigo-100 text-indigo-700": f() === "startTime" }, _v$10 = { "bg-indigo-100 text-indigo-700": f() === "deadline" }, _v$11 = { "bg-indigo-100 text-indigo-700": f() === "skipDays" }, _v$12 = { "bg-indigo-100 text-indigo-700": f() === "skipDayVisibility" }, _v$13 = { "bg-indigo-100 text-indigo-700": f() === "beforeStartTimeVisibility" }, _v$14 = { "bg-indigo-100 text-indigo-700": f() === "afterDeadlineVisibility" }, _v$15 = { "bg-indigo-100 text-indigo-700": f() === "notCaughtUpDisplay" };
										_p$.e = classList(_el$70, _v$1, _p$.e);
										_p$.t = classList(_el$71, _v$10, _p$.t);
										_p$.a = classList(_el$72, _v$11, _p$.a);
										_p$.o = classList(_el$73, _v$12, _p$.o);
										_p$.i = classList(_el$74, _v$13, _p$.i);
										_p$.n = classList(_el$75, _v$14, _p$.n);
										_p$.s = classList(_el$76, _v$15, _p$.s);
										return _p$;
									}, {
										e: void 0,
										t: void 0,
										a: void 0,
										o: void 0,
										i: void 0,
										n: void 0,
										s: void 0
									});
									return _el$63;
								}
							})];
						}
					}), _el$78);
					insert(_el$78, createComponent(Button, {
						type: "button",
						variant: "secondary",
						onClick: () => setStep(2),
						children: "Back"
					}), null);
					insert(_el$78, createComponent(Button, {
						type: "button",
						variant: "primary",
						get disabled() {
							return selectedChoreIds().length === 0;
						},
						onClick: () => setStep(4),
						dataTestId: "next-button",
						children: "Next"
					}), null);
					createRenderEffect((_p$) => {
						var _v$16 = viewMode() === "compact", _v$17 = {
							"bg-white text-indigo-600 shadow-sm": viewMode() === "compact",
							"text-slate-500 hover:text-slate-700": viewMode() !== "compact"
						}, _v$18 = viewMode() === "detailed", _v$19 = {
							"bg-white text-indigo-600 shadow-sm": viewMode() === "detailed",
							"text-slate-500 hover:text-slate-700": viewMode() !== "detailed"
						};
						_v$16 !== _p$.e && setAttribute(_el$58, "aria-selected", _p$.e = _v$16);
						_p$.t = classList(_el$58, _v$17, _p$.t);
						_v$18 !== _p$.a && setAttribute(_el$59, "aria-selected", _p$.a = _v$18);
						_p$.o = classList(_el$59, _v$19, _p$.o);
						return _p$;
					}, {
						e: void 0,
						t: void 0,
						a: void 0,
						o: void 0
					});
					return _el$50;
				})()
			}), null);
			insert(_el$18, createComponent(Show, {
				get when() {
					return memo(() => step() === 4)() && field();
				},
				children: (f) => (() => {
					var _el$101 = _tmpl$19(), _el$102 = _el$101.firstChild;
					_el$102.firstChild;
					var _el$104 = _el$102.nextSibling;
					insert(_el$102, createComponent(For, {
						get each() {
							return groupedChores();
						},
						children: (group) => {
							const selectedInGroup = () => group.chores.filter((c) => selectedChoreIds().includes(c.id));
							return createComponent(Show, {
								get when() {
									return selectedInGroup().length > 0;
								},
								get children() {
									return [createComponent(Show, {
										get when() {
											return group.person;
										},
										children: (person) => (() => {
											var _el$105 = _tmpl$20();
											insert(_el$105, () => person().name);
											return _el$105;
										})()
									}), createComponent(For, {
										get each() {
											return selectedInGroup();
										},
										children: (chore) => (() => {
											var _el$106 = _tmpl$21(), _el$107 = _el$106.firstChild, _el$108 = _el$107.nextSibling, _el$110 = _el$108.nextSibling.nextSibling, _el$111 = _el$110.nextSibling;
											insert(_el$107, () => chore.name);
											insert(_el$108, () => formatFieldValue(f(), getChoreValue(chore, f()), resolvedTimeFormat()));
											insert(_el$110, () => formatFieldValue(f(), value(), resolvedTimeFormat()));
											insert(_el$111, () => statusLabel(submitStatus()[chore.id] ?? "pending"));
											createRenderEffect((_p$) => {
												var _v$33 = `confirm-row-${chore.id}`, _v$34 = `confirm-status-${chore.id}`;
												_v$33 !== _p$.e && setAttribute(_el$106, "data-testid", _p$.e = _v$33);
												_v$34 !== _p$.t && setAttribute(_el$111, "data-testid", _p$.t = _v$34);
												return _p$;
											}, {
												e: void 0,
												t: void 0
											});
											return _el$106;
										})()
									})];
								}
							});
						}
					}), null);
					insert(_el$101, createComponent(Show, {
						get when() {
							return pinError();
						},
						get children() {
							return createComponent(InfoBox, {
								icon: true,
								"class": "mb-4 border-red-200 bg-red-50 text-red-700",
								children: "Incorrect PIN — no further chores were attempted. Check the PIN and try again; none of the remaining chores were touched."
							});
						}
					}), _el$104);
					insert(_el$101, createComponent(Show, {
						get when() {
							return memo(() => !!submitError())() && !pinError();
						},
						get children() {
							return createComponent(InfoBox, {
								icon: true,
								"class": "mb-4 border-red-200 bg-red-50 text-red-700",
								get children() {
									return [
										"Applied to ",
										memo(() => doneCount()),
										" of ",
										memo(() => selectedChoreIds().length),
										" chores before failing:",
										" ",
										memo(() => submitError())
									];
								}
							});
						}
					}), _el$104);
					insert(_el$101, createComponent(Show, {
						get when() {
							return memo(() => !!pinRequired())() && !cachedPin();
						},
						get children() {
							return createComponent(PinField, {
								get pin() {
									return pin();
								},
								onPinChange: setPin,
								get remember() {
									return rememberPin();
								},
								onRememberChange: setRememberPin
							});
						}
					}), _el$104);
					insert(_el$101, createComponent(Show, {
						get when() {
							return isSubmitting();
						},
						get children() {
							return createComponent(InfoBox, {
								icon: true,
								"class": "mb-4 border-amber-200 bg-amber-50 text-amber-800",
								children: "Applying changes — please don't close or refresh this page until this finishes."
							});
						}
					}), _el$104);
					insert(_el$104, createComponent(Show, {
						get when() {
							return memo(() => !!!isSubmitting())() && !finished();
						},
						get children() {
							return [
								createComponent(Button, {
									type: "button",
									variant: "secondary",
									onClick: () => setStep(3),
									children: "Back"
								}),
								createComponent(Button, {
									type: "button",
									variant: "secondary",
									onClick: () => props.closeModal(),
									children: "Cancel"
								}),
								createComponent(Button, {
									type: "button",
									variant: "warning",
									get disabled() {
										return !canApply();
									},
									onClick: handleApply,
									dataTestId: "apply-button",
									children: "Apply Changes"
								})
							];
						}
					}), null);
					insert(_el$104, createComponent(Show, {
						get when() {
							return finished();
						},
						get children() {
							return createComponent(Button, {
								type: "button",
								variant: "primary",
								onClick: handleClose,
								dataTestId: "close-button",
								children: "Close"
							});
						}
					}), null);
					return _el$101;
				})()
			}), null);
			createRenderEffect((_p$) => {
				var _v$4 = {
					"w-[90%] max-w-[720px]": !isWideLayout(),
					"w-[95%] max-w-[1600px]": isWideLayout()
				}, _v$5 = !!(step() === 1), _v$6 = !!(step() === 2), _v$7 = !!(step() === 3), _v$8 = !!(step() === 4);
				_p$.e = classList(_el$4, _v$4, _p$.e);
				_v$5 !== _p$.t && _el$11.classList.toggle("text-indigo-600", _p$.t = _v$5);
				_v$6 !== _p$.a && _el$13.classList.toggle("text-indigo-600", _p$.a = _v$6);
				_v$7 !== _p$.o && _el$15.classList.toggle("text-indigo-600", _p$.o = _v$7);
				_v$8 !== _p$.i && _el$17.classList.toggle("text-indigo-600", _p$.i = _v$8);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0,
				o: void 0,
				i: void 0
			});
			return _el$3;
		})();
	};
	delegateEvents(["click", "input"]);
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
	//#region src/admin/chore-history-modal.tsx
	var _tmpl$$16 = /*#__PURE__*/ template(`<div class="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4"><div class=flex><div class=shrink-0><svg class="size-5 text-amber-400"viewBox="0 0 20 20"fill=currentColor aria-hidden=true><path fill-rule=evenodd d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"clip-rule=evenodd></path></svg></div><div class=ml-3><p class="text-sm font-medium text-amber-800">History tracking is currently disabled</p><p class="mt-1 text-sm text-amber-700">No new completion entries will be recorded until history is re-enabled in settings.`);
	var _tmpl$2$12 = /*#__PURE__*/ template(`<div class="py-4 text-center text-slate-500">Loading history...`);
	var _tmpl$3$11 = /*#__PURE__*/ template(`<div class=overflow-x-auto><table class="w-full border-collapse border border-slate-200"data-testid=history-table><thead><tr><th class="border border-slate-200 p-2.5 text-left text-base font-medium whitespace-nowrap text-slate-900">Chore</th></tr></thead><tbody>`);
	var _tmpl$4$7 = /*#__PURE__*/ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"data-testid=modal><div class="max-h-[90vh] w-[90%] max-w-[95vw] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"data-testid=modal-content><div class="mb-5 flex items-center justify-between"><h3 class="text-2xl text-indigo-600">'s Chore History</h3><button type=button class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"aria-label=Close>×</button></div><div class="mt-6 flex justify-end gap-2.5">`);
	var _tmpl$5$6 = /*#__PURE__*/ template(`<th class="relative h-[100px] w-[50px] overflow-visible border border-slate-200 p-2.5 text-left text-base font-medium text-slate-900"><span class="absolute top-1/2 left-1/2 -translate-1/2 -rotate-90 whitespace-nowrap">`);
	var _tmpl$6$6 = /*#__PURE__*/ template(`<tr><td class="border border-slate-200 p-2.5 text-base whitespace-nowrap text-slate-900">`);
	var _tmpl$7$5 = /*#__PURE__*/ template(`<td class="border border-slate-200 p-2.5 text-center">`);
	var _tmpl$8$2 = /*#__PURE__*/ template(`<span style=opacity:0;width:32px;height:32px;display:inline-block>`);
	var ChoreHistoryModal = (props) => {
		const { choreData, loadData } = useAdminContext();
		const [loading, setLoading] = createSignal(true);
		onMount(async () => {
			await loadData();
			setLoading(false);
		});
		const personHistory = createMemo(() => {
			return (choreData().dailyCompletions ?? []).filter((dc) => dc.personId === props.person.id);
		});
		const getDays = () => {
			const days = [];
			for (let i = 14; i >= 1; i--) {
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
			return choreData().chores.filter((chore) => {
				if (chore.type === "personal" && chore.assignedTo === props.person.id) return true;
				if (chore.type === "rotating" && chore.rotation?.includes(props.person.id)) return true;
				return false;
			});
		};
		const getCompletionDetails = (choreId, date) => {
			return personHistory().find((dc) => dc.choreId === choreId && dc.date === date);
		};
		const isSkipDay = (chore, day) => {
			if (!chore.skipDays || chore.skipDays.length === 0) return false;
			return chore.skipDays.includes(day.dayName);
		};
		return (() => {
			var _el$ = _tmpl$4$7(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.firstChild, _el$6 = _el$4.nextSibling, _el$13 = _el$3.nextSibling;
			insert(_el$4, () => props.person.name, _el$5);
			_el$6.$$click = () => props.closeModal();
			insert(_el$2, createComponent(Show, {
				get when() {
					return memo(() => !!!loading())() && !choreData().settings?.historyEnabled;
				},
				get children() {
					return _tmpl$$16();
				}
			}), _el$13);
			insert(_el$2, createComponent(Show, {
				get when() {
					return loading();
				},
				get children() {
					return _tmpl$2$12();
				}
			}), _el$13);
			insert(_el$2, createComponent(Show, {
				get when() {
					return !loading();
				},
				get children() {
					var _el$9 = _tmpl$3$11(), _el$1 = _el$9.firstChild.firstChild, _el$10 = _el$1.firstChild;
					_el$10.firstChild;
					var _el$12 = _el$1.nextSibling;
					insert(_el$10, createComponent(For, {
						get each() {
							return getDays();
						},
						children: (day) => (() => {
							var _el$14 = _tmpl$5$6(), _el$15 = _el$14.firstChild;
							insert(_el$15, () => day.display);
							return _el$14;
						})()
					}), null);
					insert(_el$12, createComponent(For, {
						get each() {
							return getPersonChores();
						},
						children: (chore) => (() => {
							var _el$16 = _tmpl$6$6(), _el$17 = _el$16.firstChild;
							insert(_el$17, () => chore.name, null);
							insert(_el$17, createComponent(Show, {
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
							insert(_el$16, createComponent(For, {
								get each() {
									return getDays();
								},
								children: (day) => {
									const completion = createMemo(() => getCompletionDetails(chore.id, day.date));
									const skipDay = createMemo(() => isSkipDay(chore, day));
									const emptyDay = () => !skipDay() && !completion();
									const getEmptyTooltip = () => {
										return chore.type === "rotating" ? "Either it was someone else's turn (rotating chore), MagicMirror² was not running this day, the chore was not created yet, or history tracking was disabled when the chore was checked." : "Either MagicMirror² was not running this day, the chore was not created yet, or history tracking was disabled when the chore was checked.";
									};
									const getTooltipText = () => {
										if (completion()?.completed) return `Completed at ${completion()?.completedAt} (24h)`;
										if (completion() && !completion()?.completed) return "Not completed";
										if (skipDay()) return "Skip day";
										if (emptyDay()) return getEmptyTooltip();
										return "";
									};
									return (() => {
										var _el$18 = _tmpl$7$5();
										insert(_el$18, createComponent(Switch, {
											get fallback() {
												return createComponent(Tooltip, {
													get text() {
														return getTooltipText();
													},
													position: "above",
													align: "right",
													get multiline() {
														return emptyDay();
													},
													get children() {
														return _tmpl$8$2();
													}
												});
											},
											get children() {
												return [createComponent(Match, {
													get when() {
														return completion()?.completed;
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
																	"bg-yellow-500": completion()?.wasLate,
																	"bg-green-500": !completion()?.wasLate,
																	"text-white": true
																};
															},
															get dataTestId() {
																return completion()?.wasLate ? "completion-late" : "completion-ontime";
															},
															children: "✓"
														});
													}
												}), createComponent(Match, {
													get when() {
														return completion()?.completed === false;
													},
													get children() {
														return createComponent(Tooltip, {
															get text() {
																return getTooltipText();
															},
															position: "above",
															align: "right",
															"class": "inline-block size-8  rounded-full bg-red-500 text-center leading-8 text-white",
															dataTestId: "completion-missed",
															children: "✗"
														});
													}
												})];
											}
										}));
										createRenderEffect(() => _el$18.classList.toggle("bg-slate-100", !!skipDay()));
										return _el$18;
									})();
								}
							}), null);
							return _el$16;
						})()
					}));
					return _el$9;
				}
			}), _el$13);
			insert(_el$13, createComponent(Button, {
				type: "button",
				variant: "secondary",
				onClick: () => props.closeModal(),
				dataTestId: "close-button",
				children: "Close"
			}));
			return _el$;
		})();
	};
	delegateEvents(["click"]);
	//#endregion
	//#region src/admin/copy-chores-modal.tsx
	var _tmpl$$15 = /*#__PURE__*/ template(`<div class="my-2.5 text-slate-500 italic"data-testid=empty-message><p data-testid=empty-message-text>No other people available to copy chores to.`);
	var _tmpl$2$11 = /*#__PURE__*/ template(`<form><div class=mb-5><div class="mb-3 block font-medium text-slate-900">Select Person to Copy To</div><select id=toPerson required class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><option value>-- Select a person --</option></select></div><div class=mb-5><div class="mb-3 block font-medium text-slate-900">Select Chores to Copy</div><div class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"data-testid=checkbox-list></div></div><div class="mt-6 flex justify-end gap-2.5">`);
	var _tmpl$3$10 = /*#__PURE__*/ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"><div class="mb-5 flex items-center justify-between"><h3 class="text-2xl text-indigo-600"data-testid=modal-title>Copy Chores</h3><button type=button class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"aria-label=Close>×</button></div><div class="mb-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-base"data-testid=copy-from-display><span class="inline-block size-6 rounded-full border-2 border-black/10 align-middle"data-testid=person-color-badge></span><strong>From:</strong> `);
	var _tmpl$4$6 = /*#__PURE__*/ template(`<div class="my-2.5 text-slate-500 italic"data-testid=empty-message><p data-testid=empty-message-text>No personal chores to copy for <!>.`);
	var _tmpl$5$5 = /*#__PURE__*/ template(`<option>`);
	var _tmpl$6$5 = /*#__PURE__*/ template(`<label class="flex cursor-pointer items-center gap-2 font-normal"><input type=checkbox class="size-4.5 cursor-pointer">`);
	var CopyChoresModal = (props) => {
		const { choreData, pinRequired, setCachedPin, cachedPin } = useAdminContext();
		const personalChores = createMemo(() => {
			return choreData().chores.filter((chore) => chore.type === ChoreType.PERSONAL && chore.assignedTo === props.fromPerson.id);
		});
		const availablePeople = createMemo(() => {
			return choreData().people.filter((person) => person.id !== props.fromPerson.id);
		});
		const [selectedChoreIds, setSelectedChoreIds] = createSignal([]);
		const [toPersonId, setToPersonId] = createSignal("");
		const [loading, setLoading] = createSignal(false);
		const [pin, setPin] = createSignal("");
		const [rememberPin, setRememberPin] = createSignal(false);
		onMount(() => {
			const chores = personalChores();
			setSelectedChoreIds(chores.map((chore) => chore.id));
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
				const pinToUse = cachedPin() || pin();
				await copyChores({
					fromPersonId: props.fromPerson.id,
					toPersonId: toPersonId(),
					choreIds: selectedChoreIds(),
					pin: pinRequired() ? pinToUse || void 0 : void 0
				});
				if (!cachedPin() && rememberPin() && pin()) setCachedPin(pin());
				props.closeModal();
			} catch (error) {
				console.error("Error copying chores:", error);
				alert(`Failed to copy chores: ${error instanceof Error ? error.message : "Unknown error"}`);
			} finally {
				setLoading(false);
			}
		};
		return (() => {
			var _el$ = _tmpl$3$10(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$5 = _el$3.firstChild.nextSibling, _el$6 = _el$3.nextSibling, _el$7 = _el$6.firstChild;
			_el$7.nextSibling.nextSibling;
			_el$5.$$click = () => props.closeModal();
			insert(_el$6, () => props.fromPerson.name, null);
			insert(_el$2, createComponent(Show, {
				get when() {
					return personalChores().length > 0;
				},
				get fallback() {
					return (() => {
						var _el$19 = _tmpl$4$6(), _el$20 = _el$19.firstChild, _el$23 = _el$20.firstChild.nextSibling;
						_el$23.nextSibling;
						insert(_el$20, () => props.fromPerson.name, _el$23);
						insert(_el$19, createComponent(Button, {
							type: "button",
							variant: "secondary",
							onClick: () => props.closeModal(),
							children: "Close"
						}), null);
						return _el$19;
					})();
				},
				get children() {
					return [createComponent(Show, {
						get when() {
							return availablePeople().length === 0;
						},
						get children() {
							var _el$0 = _tmpl$$15();
							_el$0.firstChild;
							insert(_el$0, createComponent(Button, {
								type: "button",
								variant: "secondary",
								onClick: () => props.closeModal(),
								children: "Close"
							}), null);
							return _el$0;
						}
					}), createComponent(Show, {
						get when() {
							return availablePeople().length > 0;
						},
						get children() {
							var _el$10 = _tmpl$2$11(), _el$11 = _el$10.firstChild, _el$13 = _el$11.firstChild.nextSibling;
							_el$13.firstChild;
							var _el$15 = _el$11.nextSibling, _el$17 = _el$15.firstChild.nextSibling, _el$18 = _el$15.nextSibling;
							_el$10.addEventListener("submit", handleSubmit);
							_el$13.$$input = (e) => setToPersonId(e.currentTarget.value);
							insert(_el$13, createComponent(For, {
								get each() {
									return availablePeople();
								},
								children: (person) => (() => {
									var _el$24 = _tmpl$5$5();
									insert(_el$24, () => person.name);
									createRenderEffect(() => _el$24.value = person.id);
									return _el$24;
								})()
							}), null);
							insert(_el$17, createComponent(For, {
								get each() {
									return personalChores();
								},
								children: (chore) => (() => {
									var _el$25 = _tmpl$6$5(), _el$26 = _el$25.firstChild;
									_el$26.$$input = (e) => handleChoreToggle(chore.id, e.currentTarget.checked);
									insert(_el$25, () => chore.name, null);
									createRenderEffect(() => _el$26.value = chore.id);
									createRenderEffect(() => _el$26.checked = selectedChoreIds().includes(chore.id));
									return _el$25;
								})()
							}));
							insert(_el$10, createComponent(Show, {
								get when() {
									return memo(() => !!pinRequired())() && !cachedPin();
								},
								get children() {
									return createComponent(PinField, {
										get pin() {
											return pin();
										},
										onPinChange: setPin,
										get remember() {
											return rememberPin();
										},
										onRememberChange: setRememberPin
									});
								}
							}), _el$18);
							insert(_el$18, createComponent(Button, {
								type: "button",
								variant: "secondary",
								onClick: () => props.closeModal(),
								children: "Cancel"
							}), null);
							insert(_el$18, createComponent(Button, {
								type: "submit",
								variant: "primary",
								get disabled() {
									return loading();
								},
								get children() {
									return loading() ? "Copying..." : "Copy";
								}
							}), null);
							createRenderEffect(() => _el$13.value = toPersonId());
							return _el$10;
						}
					})];
				}
			}), null);
			createRenderEffect((_$p) => style(_el$7, `background-color: ${props.fromPerson.color}`, _$p));
			return _el$;
		})();
	};
	delegateEvents(["click", "input"]);
	//#endregion
	//#region src/admin/schedule-days-summary.tsx
	var _tmpl$$14 = /*#__PURE__*/ template(`<p class="mt-1.25 flex items-center gap-1.5 text-sm"data-testid=schedule-days-summary><svg viewBox="0 0 20 20"fill=none stroke=currentColor stroke-width=1.7 class="size-4 shrink-0"aria-hidden=true><rect x=2.5 y=4 width=15 height=13 rx=2></rect><path d="M6 2.5v3M14 2.5v3M2.5 8h15"></path></svg><span><strong></strong> `);
	var _tmpl$2$10 = /*#__PURE__*/ template(`<svg><path d="m6.5 12 2 2 4.5-4.5"></svg>`, false, true, false);
	var _tmpl$3$9 = /*#__PURE__*/ template(`<svg><path d="M6.5 12h7"></svg>`, false, true, false);
	var DAYS = Object.values(DayOfWeek);
	var formatDays = (days) => {
		if (days.length === 0) return "None";
		return days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ");
	};
	/** Shows the shorter active/skip-day representation with a visually distinct calendar icon. */
	var ScheduleDaysSummary = (props) => {
		const showActiveDays = () => props.skipDays.length > 3;
		const displayedDays = () => showActiveDays() ? DAYS.filter((day) => !props.skipDays.includes(day)) : props.skipDays;
		return (() => {
			var _el$ = _tmpl$$14(), _el$2 = _el$.firstChild;
			_el$2.firstChild.nextSibling;
			var _el$5 = _el$2.nextSibling, _el$6 = _el$5.firstChild;
			_el$6.nextSibling;
			insert(_el$2, (() => {
				var _c$ = memo(() => !!showActiveDays());
				return () => _c$() ? _tmpl$2$10() : _tmpl$3$9();
			})(), null);
			insert(_el$6, () => showActiveDays() ? "Active days:" : "Skip days:");
			insert(_el$5, () => formatDays(displayedDays()), null);
			createRenderEffect((_p$) => {
				var _v$ = !!showActiveDays(), _v$2 = !showActiveDays();
				_v$ !== _p$.e && _el$.classList.toggle("text-indigo-600", _p$.e = _v$);
				_v$2 !== _p$.t && _el$.classList.toggle("text-slate-500", _p$.t = _v$2);
				return _p$;
			}, {
				e: void 0,
				t: void 0
			});
			return _el$;
		})();
	};
	//#endregion
	//#region src/admin/person-card.tsx
	var _tmpl$$13 = /*#__PURE__*/ template(`<div class="grid gap-2.5">`);
	var _tmpl$2$9 = /*#__PURE__*/ template(`<div class="mt-4 border-t border-slate-200 pt-4"><div class="mb-4 flex items-center justify-between"><h4 class="m-0 text-lg text-indigo-600">'s Personal Chores</h4><div class="flex gap-2">`);
	var _tmpl$3$8 = /*#__PURE__*/ template(`<div class="rounded-lg border border-slate-200 bg-slate-50 p-5 transition-all hover:border-indigo-600 hover:shadow-md"data-testid=person-card><div class="flex items-start justify-between gap-4"><div class="flex items-start gap-3"><button type=button data-testid=expand-person-chores class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-indigo-600 shadow-sm transition-all hover:border-indigo-600 hover:bg-indigo-50 hover:shadow-md"><svg xmlns=http://www.w3.org/2000/svg width=20 height=20 viewBox="0 0 20 20"fill=none stroke=currentColor stroke-width=2.5 stroke-linecap=round stroke-linejoin=round class="transition-transform duration-200"aria-hidden=true><path d="M5 8l5 5 5-5"></path></svg></button><div><h3 class="mb-1 text-xl text-slate-900"> <span class="inline-block size-6 rounded-full border-2 border-black/10 align-middle"></span></h3><p class="text-sm font-medium text-slate-500"></p></div></div><div class="flex gap-2.5">`);
	var _tmpl$4$5 = /*#__PURE__*/ template(`<div><p class="my-2.5 text-slate-500 italic">No personal chores yet.`);
	var _tmpl$5$4 = /*#__PURE__*/ template(`<span class=mx-1>|`);
	var _tmpl$6$4 = /*#__PURE__*/ template(`<p class="mt-1.25 text-sm text-indigo-600">`);
	var _tmpl$7$4 = /*#__PURE__*/ template(`<div class="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5"><div><h4 class="mb-1.5 text-base text-slate-900"></h4></div><div class="flex gap-2">`);
	/** Card displaying a person and their personal chores with an accordion */
	var PersonCard = (props) => {
		const { resolvedTimeFormat } = useAdminContext();
		const [expanded, setExpanded] = createSignal(false);
		const choreCount = () => props.chores.length;
		const choreCountLabel = () => `${choreCount()} ${choreCount() === 1 ? "personal chore" : "personal chores"}`;
		const toggleExpanded = () => setExpanded((prev) => !prev);
		return (() => {
			var _el$ = _tmpl$3$8(), _el$3 = _el$.firstChild.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.firstChild, _el$7 = _el$4.nextSibling.firstChild, _el$8 = _el$7.firstChild, _el$9 = _el$8.nextSibling, _el$0 = _el$7.nextSibling, _el$1 = _el$3.nextSibling;
			_el$4.$$click = toggleExpanded;
			insert(_el$7, () => props.person.name, _el$8);
			insert(_el$0, choreCountLabel);
			insert(_el$1, createComponent(Button, {
				type: "button",
				variant: "secondary",
				size: "sm",
				onClick: () => props.onEditPerson(props.person),
				children: "Edit"
			}), null);
			insert(_el$1, createComponent(Button, {
				type: "button",
				variant: "secondary",
				size: "sm",
				onClick: () => props.onHistory(props.person),
				children: "History"
			}), null);
			insert(_el$1, createComponent(Button, {
				type: "button",
				variant: "danger",
				size: "sm",
				onClick: () => props.onDeletePerson(props.person.id),
				children: "Delete"
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return expanded();
				},
				get children() {
					var _el$10 = _tmpl$2$9(), _el$12 = _el$10.firstChild.firstChild, _el$13 = _el$12.firstChild, _el$14 = _el$12.nextSibling;
					insert(_el$12, () => props.person.name, _el$13);
					insert(_el$14, createComponent(Button, {
						type: "button",
						variant: "primary",
						size: "sm",
						onClick: () => props.onAddChore(props.person),
						children: "Add Chore"
					}), null);
					insert(_el$14, createComponent(Show, {
						get when() {
							return memo(() => choreCount() > 0)() && props.canCopyChores;
						},
						get children() {
							return createComponent(Button, {
								type: "button",
								variant: "secondary",
								size: "sm",
								onClick: () => props.onCopyChores(props.person),
								children: "Copy Chores"
							});
						}
					}), null);
					insert(_el$10, createComponent(Show, {
						get when() {
							return choreCount() > 0;
						},
						get fallback() {
							return _tmpl$4$5();
						},
						get children() {
							var _el$15 = _tmpl$$13();
							insert(_el$15, createComponent(For, {
								get each() {
									return props.chores;
								},
								children: (chore) => (() => {
									var _el$17 = _tmpl$7$4(), _el$18 = _el$17.firstChild, _el$19 = _el$18.firstChild, _el$22 = _el$18.nextSibling;
									insert(_el$19, () => chore.name);
									insert(_el$18, createComponent(Show, {
										get when() {
											return chore.deadline || chore.startTime;
										},
										get children() {
											var _el$20 = _tmpl$6$4();
											insert(_el$20, createComponent(Show, {
												get when() {
													return chore.startTime;
												},
												get children() {
													return ["Start: ", memo(() => formatTime(chore.startTime ?? "", resolvedTimeFormat()))];
												}
											}), null);
											insert(_el$20, createComponent(Show, {
												get when() {
													return memo(() => !!chore.deadline)() && chore.startTime;
												},
												get children() {
													return _tmpl$5$4();
												}
											}), null);
											insert(_el$20, createComponent(Show, {
												get when() {
													return chore.deadline;
												},
												get children() {
													return ["Deadline: ", memo(() => formatTime(chore.deadline ?? "", resolvedTimeFormat()))];
												}
											}), null);
											return _el$20;
										}
									}), null);
									insert(_el$18, createComponent(ScheduleDaysSummary, { get skipDays() {
										return chore.skipDays;
									} }), null);
									insert(_el$22, createComponent(Button, {
										type: "button",
										variant: "secondary",
										size: "sm",
										dataTestId: "chore-edit-btn",
										onClick: () => props.onEditChore(props.person, chore),
										children: "Edit"
									}), null);
									insert(_el$22, createComponent(Button, {
										type: "button",
										variant: "danger",
										size: "sm",
										onClick: () => props.onDeleteChore(chore.id),
										children: "Delete"
									}), null);
									return _el$17;
								})()
							}));
							return _el$15;
						}
					}), null);
					return _el$10;
				}
			}), null);
			createRenderEffect((_p$) => {
				var _v$ = expanded() ? "Collapse chores" : "Expand chores", _v$2 = expanded(), _v$3 = !!expanded(), _v$4 = `background-color: ${props.person.color}`;
				_v$ !== _p$.e && setAttribute(_el$4, "aria-label", _p$.e = _v$);
				_v$2 !== _p$.t && setAttribute(_el$4, "aria-expanded", _p$.t = _v$2);
				_v$3 !== _p$.a && _el$5.classList.toggle("rotate-180", _p$.a = _v$3);
				_p$.o = style(_el$9, _v$4, _p$.o);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0,
				o: void 0
			});
			return _el$;
		})();
	};
	delegateEvents(["click"]);
	//#endregion
	//#region src/admin/people-tab.tsx
	var _tmpl$$12 = /*#__PURE__*/ template(`<section data-testid=people-section><div class="mb-5 flex items-center justify-between"><h2 class="m-0 border-b-2 border-indigo-600 pb-2.5 text-2xl text-indigo-600">People</h2><div class="flex items-center gap-2"></div></div><div class="mt-5 grid gap-4">`);
	/** Tab showing all people as accordion cards */
	var PeopleTab = (props) => {
		const getPersonalChores = (personId) => props.chores.filter((chore) => chore.type === ChoreType.PERSONAL && chore.assignedTo === personId);
		const canCopyChores = () => props.people.length > 1;
		const hasPersonalChores = () => props.chores.some((chore) => chore.type === ChoreType.PERSONAL);
		return (() => {
			var _el$ = _tmpl$$12(), _el$2 = _el$.firstChild, _el$4 = _el$2.firstChild.nextSibling, _el$5 = _el$2.nextSibling;
			insert(_el$4, createComponent(Button, {
				type: "button",
				variant: "primary",
				onClick: () => props.onAddPerson(),
				children: "Add Person"
			}), null);
			insert(_el$4, createComponent(Show, {
				get when() {
					return memo(() => props.people.length > 0)() && hasPersonalChores();
				},
				get children() {
					return createComponent(Button, {
						type: "button",
						variant: "secondary",
						onClick: () => props.onBulkEdit(),
						dataTestId: "bulk-edit-people-btn",
						children: "Bulk Edit Settings"
					});
				}
			}), null);
			insert(_el$4, createComponent(Show, {
				get when() {
					return props.people.length === 0;
				},
				get children() {
					return createComponent(HelpIcon, {
						text: "Add at least one person before you can create chores",
						"class": "ml-2",
						align: "right"
					});
				}
			}), null);
			insert(_el$5, createComponent(For, {
				get each() {
					return props.people;
				},
				children: (person) => createComponent(PersonCard, {
					person,
					get chores() {
						return getPersonalChores(person.id);
					},
					get canCopyChores() {
						return canCopyChores();
					},
					get onEditPerson() {
						return props.onEditPerson;
					},
					get onHistory() {
						return props.onHistory;
					},
					get onDeletePerson() {
						return props.onDeletePerson;
					},
					get onAddChore() {
						return props.onAddChore;
					},
					get onEditChore() {
						return props.onEditChore;
					},
					get onDeleteChore() {
						return props.onDeleteChore;
					},
					get onCopyChores() {
						return props.onCopyChores;
					}
				})
			}));
			return _el$;
		})();
	};
	//#endregion
	//#region src/admin/person-modal.tsx
	var _tmpl$$11 = /*#__PURE__*/ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"><div class="mb-5 flex items-center justify-between"><h3 class="text-2xl text-indigo-600"data-testid=modal-title></h3><button type=button class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"aria-label=Close>×</button></div><form><div class=mb-5><label for=personName class="mb-3 block font-medium text-slate-900">Name</label><input type=text id=personName required class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"></div><div class=mb-5><label for=personColor class="mb-3 block font-medium text-slate-900">Text Color</label><div class="flex items-center gap-2.5"><input type=color id=personColor required class="h-10 w-15 cursor-pointer rounded-lg border border-slate-300"></div></div><div class="mt-6 flex justify-end gap-2.5">`);
	var PersonModal = (props) => {
		const { loadData, pinRequired, cachedPin, setCachedPin } = useAdminContext();
		const [name, setName] = createSignal(props.initialPerson?.name ?? "");
		const [color, setColor] = createSignal(props.initialPerson?.color ?? generatePastelColor());
		const [pin, setPin] = createSignal("");
		const [rememberPin, setRememberPin] = createSignal(false);
		const handleSubmit = async (event) => {
			event.preventDefault();
			try {
				const pinToUse = cachedPin() || pin();
				if (props.initialPerson?.id) {
					const body = {
						name: name(),
						color: color(),
						pin: pinRequired() ? pinToUse || void 0 : void 0
					};
					await updatePerson(props.initialPerson.id, body);
				} else await createPerson({
					name: name(),
					color: color(),
					pin: pinRequired() ? pinToUse || void 0 : void 0
				});
				if (!cachedPin() && rememberPin() && pin()) setCachedPin(pin());
				try {
					await loadData();
				} catch (loadError) {
					console.error("Error reloading data after save:", loadError);
					alert("Person saved, but failed to refresh the list. Please refresh the page.");
				}
				props.closeModal();
			} catch (error) {
				console.error("Error saving person:", error);
				alert(`Failed to save person: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		return (() => {
			var _el$ = _tmpl$$11(), _el$3 = _el$.firstChild.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.nextSibling, _el$6 = _el$3.nextSibling, _el$7 = _el$6.firstChild, _el$9 = _el$7.firstChild.nextSibling, _el$0 = _el$7.nextSibling, _el$10 = _el$0.firstChild.nextSibling, _el$11 = _el$10.firstChild, _el$12 = _el$0.nextSibling;
			insert(_el$4, () => props.initialPerson ? "Edit Person" : "Add Person");
			_el$5.$$click = () => props.closeModal();
			_el$6.addEventListener("submit", handleSubmit);
			_el$9.$$input = (e) => setName(e.currentTarget.value);
			_el$11.$$input = (e) => setColor(e.currentTarget.value);
			insert(_el$10, createComponent(Button, {
				type: "button",
				variant: "secondary",
				size: "sm",
				onClick: () => setColor(generatePastelColor()),
				children: "Randomize"
			}), null);
			insert(_el$6, createComponent(Show, {
				get when() {
					return memo(() => !!pinRequired())() && !cachedPin();
				},
				get children() {
					return createComponent(PinField, {
						get pin() {
							return pin();
						},
						onPinChange: setPin,
						get remember() {
							return rememberPin();
						},
						onRememberChange: setRememberPin
					});
				}
			}), _el$12);
			insert(_el$12, createComponent(Button, {
				type: "button",
				variant: "secondary",
				onClick: () => props.closeModal(),
				children: "Cancel"
			}), null);
			insert(_el$12, createComponent(Button, {
				type: "submit",
				variant: "primary",
				get children() {
					return props.initialPerson ? "Save" : "Add";
				}
			}), null);
			createRenderEffect(() => _el$9.value = name());
			createRenderEffect(() => _el$11.value = color());
			return _el$;
		})();
	};
	delegateEvents(["click", "input"]);
	//#endregion
	//#region src/admin/display-options-section.tsx
	var _tmpl$$10 = /*#__PURE__*/ template(`<span class="text-xs text-indigo-600">Customized`);
	var _tmpl$2$8 = /*#__PURE__*/ template(`<strong>Note:`);
	var _tmpl$3$7 = /*#__PURE__*/ template(`<strong>caught up`);
	var _tmpl$4$4 = /*#__PURE__*/ template(`<strong>Overdue styling:`);
	var _tmpl$5$3 = /*#__PURE__*/ template(`<strong>Normal styling:`);
	var _tmpl$6$3 = /*#__PURE__*/ template(`<strong>Hide:`);
	var _tmpl$7$3 = /*#__PURE__*/ template(`<strong>Show if overdue:`);
	var _tmpl$8$1 = /*#__PURE__*/ template(`<div><label for=beforeStartTimeVisibility class="mb-1.5 block font-medium text-slate-900">Before start time</label><select id=beforeStartTimeVisibility class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><option>Hide</option><option>Show if overdue`);
	var _tmpl$9 = /*#__PURE__*/ template(`<strong>Show normally:`);
	var _tmpl$0 = /*#__PURE__*/ template(`<strong>Show as overdue:`);
	var _tmpl$1 = /*#__PURE__*/ template(`<strong>Move to earlier chores:`);
	var _tmpl$10 = /*#__PURE__*/ template(`<div><label for=afterDeadlineVisibility class="mb-1.5 block font-medium text-slate-900">After deadline</label><select id=afterDeadlineVisibility class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><option>Show normally</option><option>Show as overdue</option><option>Move to earlier chores`);
	var _tmpl$11 = /*#__PURE__*/ template(`<strong>Always Show:`);
	var _tmpl$12 = /*#__PURE__*/ template(`<strong>Show If Overdue:`);
	var _tmpl$13 = /*#__PURE__*/ template(`<div><label for=skipDayVisibility class="mb-1.5 block font-medium text-slate-900">Skip day visibility</label><select id=skipDayVisibility class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><option>Hide</option><option>Always Show</option><option>Show If Overdue`);
	var _tmpl$14 = /*#__PURE__*/ template(`<details class="mb-5 rounded-lg border border-slate-200"><summary class="cursor-pointer list-none p-3 font-medium text-slate-900"><div class="flex items-center justify-between"><span>Advanced Display Options</span><div class="flex items-center gap-2"><span class="text-lg leading-none"></span></div></div></summary><div class="space-y-4 p-3 pt-0"><div><div class="mb-1.5 flex items-center"><label for=notCaughtUpDisplay class="block font-medium text-slate-900">When visible and not caught up, style as:</label></div><select id=notCaughtUpDisplay class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><option>Overdue styling</option><option>Normal styling`);
	/**
	* Collapsible "Advanced Display Options" section shared by both chore modals.
	* Options that do not apply to the current settings are hidden.
	*/
	var DisplayOptionsSection = (props) => {
		const hasNonDefaultValue = createMemo(() => {
			if (props.startTime() && props.beforeStartTimeVisibility() !== BeforeStartTimeVisibility.HIDE) return true;
			if (props.deadline() && props.afterDeadlineVisibility() !== AfterDeadlineVisibility.SHOW_OVERDUE) return true;
			if (props.notCaughtUpDisplay() !== NotCaughtUpDisplay.OVERDUE) return true;
			if (props.skipDays().length > 0 && props.skipDayVisibility() !== SkipDayVisibility.HIDE) return true;
			return false;
		});
		const [isOpen, setIsOpen] = createSignal(untrack(() => hasNonDefaultValue()));
		const handleToggle = (e) => {
			setIsOpen(e.newState === "open");
		};
		return (() => {
			var _el$ = _tmpl$14(), _el$2 = _el$.firstChild, _el$5 = _el$2.firstChild.firstChild.nextSibling, _el$7 = _el$5.firstChild, _el$8 = _el$2.nextSibling, _el$1 = _el$8.firstChild, _el$11 = _el$1.firstChild.nextSibling, _el$12 = _el$11.firstChild, _el$13 = _el$12.nextSibling;
			addEventListener(_el$, "toggle", handleToggle);
			insert(_el$5, createComponent(Show, {
				get when() {
					return hasNonDefaultValue();
				},
				get children() {
					return _tmpl$$10();
				}
			}), _el$7);
			insert(_el$7, () => isOpen() ? "−" : "+");
			insert(_el$8, createComponent(InfoBox, {
				icon: true,
				get children() {
					return [
						_tmpl$2$8(),
						" A chore is ",
						_tmpl$3$7(),
						" when it was completed on the previous day it appeared (by default, the previous non-skip day). New and newly rotated chores start as caught up."
					];
				}
			}), _el$1);
			_el$11.$$input = (e) => props.setNotCaughtUpDisplay(e.currentTarget.value);
			insert(_el$1, createComponent(InfoBox, { get children() {
				return [createComponent(Show, {
					get when() {
						return props.notCaughtUpDisplay() === NotCaughtUpDisplay.OVERDUE;
					},
					get children() {
						return [_tmpl$4$4(), " If the chore is not caught up, it is styled as overdue (default style is yellow)."];
					}
				}), createComponent(Show, {
					get when() {
						return props.notCaughtUpDisplay() === NotCaughtUpDisplay.NORMAL;
					},
					get children() {
						return [_tmpl$5$3(), " If the chore is not caught up, it is styled as normal."];
					}
				})];
			} }), null);
			insert(_el$8, createComponent(Show, {
				get when() {
					return props.startTime();
				},
				get children() {
					var _el$16 = _tmpl$8$1(), _el$18 = _el$16.firstChild.nextSibling, _el$19 = _el$18.firstChild, _el$20 = _el$19.nextSibling;
					_el$18.$$input = (e) => props.setBeforeStartTimeVisibility(e.currentTarget.value);
					insert(_el$16, createComponent(InfoBox, { get children() {
						return [createComponent(Show, {
							get when() {
								return props.beforeStartTimeVisibility() === BeforeStartTimeVisibility.HIDE;
							},
							get children() {
								return [
									_tmpl$6$3(),
									" The chore stays hidden until ",
									memo(() => props.startTime()),
									" even if it is not caught up."
								];
							}
						}), createComponent(Show, {
							get when() {
								return props.beforeStartTimeVisibility() === BeforeStartTimeVisibility.SHOW_IF_OVERDUE;
							},
							get children() {
								return [
									_tmpl$7$3(),
									" If the chore is caught up, it stays hidden until",
									" ",
									memo(() => props.startTime()),
									". If it is not caught up, it appears before ",
									memo(() => props.startTime()),
									" ",
									"so it can be caught up early."
								];
							}
						})];
					} }), null);
					createRenderEffect(() => _el$19.value = BeforeStartTimeVisibility.HIDE);
					createRenderEffect(() => _el$20.value = BeforeStartTimeVisibility.SHOW_IF_OVERDUE);
					createRenderEffect(() => _el$18.value = props.beforeStartTimeVisibility());
					return _el$16;
				}
			}), null);
			insert(_el$8, createComponent(Show, {
				get when() {
					return props.deadline();
				},
				get children() {
					var _el$23 = _tmpl$10(), _el$25 = _el$23.firstChild.nextSibling, _el$26 = _el$25.firstChild, _el$27 = _el$26.nextSibling, _el$28 = _el$27.nextSibling;
					_el$25.$$input = (e) => props.setAfterDeadlineVisibility(e.currentTarget.value);
					insert(_el$23, createComponent(InfoBox, { get children() {
						return createComponent(Switch, { get children() {
							return [
								createComponent(Match, {
									get when() {
										return props.afterDeadlineVisibility() === AfterDeadlineVisibility.SHOW_NORMAL;
									},
									get children() {
										return [
											_tmpl$9(),
											" If the chore is complete, it moves to the \"Earlier chores\" section after ",
											memo(() => props.deadline()),
											". If it is not complete, it stays in the main list after ",
											memo(() => props.deadline()),
											" until completed."
										];
									}
								}),
								createComponent(Match, {
									get when() {
										return props.afterDeadlineVisibility() === AfterDeadlineVisibility.SHOW_OVERDUE;
									},
									get children() {
										return [
											_tmpl$0(),
											" If the chore is complete, it moves to the \"Earlier chores\" section after ",
											memo(() => props.deadline()),
											". If it is not complete, it stays in the main list and turns yellow after ",
											memo(() => props.deadline()),
											" until completed."
										];
									}
								}),
								createComponent(Match, {
									get when() {
										return props.afterDeadlineVisibility() === AfterDeadlineVisibility.MOVE_TO_EARLIER;
									},
									get children() {
										return [
											_tmpl$1(),
											" The chore moves to the \"Earlier chores\" section after ",
											memo(() => props.deadline()),
											" whether complete or not. You can still mark as complete after that time by expanding the \"Earlier chores\" section."
										];
									}
								})
							];
						} });
					} }), null);
					createRenderEffect(() => _el$26.value = AfterDeadlineVisibility.SHOW_NORMAL);
					createRenderEffect(() => _el$27.value = AfterDeadlineVisibility.SHOW_OVERDUE);
					createRenderEffect(() => _el$28.value = AfterDeadlineVisibility.MOVE_TO_EARLIER);
					createRenderEffect(() => _el$25.value = props.afterDeadlineVisibility());
					return _el$23;
				}
			}), null);
			insert(_el$8, createComponent(Show, {
				get when() {
					return props.skipDays().length > 0;
				},
				get children() {
					var _el$32 = _tmpl$13(), _el$34 = _el$32.firstChild.nextSibling, _el$35 = _el$34.firstChild, _el$36 = _el$35.nextSibling, _el$37 = _el$36.nextSibling;
					_el$34.$$input = (e) => props.setSkipDayVisibility(e.currentTarget.value);
					insert(_el$32, createComponent(InfoBox, { get children() {
						return createComponent(Switch, { get children() {
							return [
								createComponent(Match, {
									get when() {
										return props.skipDayVisibility() === SkipDayVisibility.HIDE;
									},
									get children() {
										return [_tmpl$6$3(), " The chore disappears completely on skip days. It's a true day off — no catch-up needed."];
									}
								}),
								createComponent(Match, {
									get when() {
										return props.skipDayVisibility() === SkipDayVisibility.SHOW_ALWAYS;
									},
									get children() {
										return [_tmpl$11(), " The chore stays visible on skip days. If it is caught up, it remains checked (a grace day). If it is not caught up, you can check it off on the skip day."];
									}
								}),
								createComponent(Match, {
									get when() {
										return props.skipDayVisibility() === SkipDayVisibility.SHOW_IF_OVERDUE;
									},
									get children() {
										return [_tmpl$12(), " The chore appears on skip days only if it is not caught up. You can check it off on the skip day to catch up."];
									}
								})
							];
						} });
					} }), null);
					createRenderEffect(() => _el$35.value = SkipDayVisibility.HIDE);
					createRenderEffect(() => _el$36.value = SkipDayVisibility.SHOW_ALWAYS);
					createRenderEffect(() => _el$37.value = SkipDayVisibility.SHOW_IF_OVERDUE);
					createRenderEffect(() => _el$34.value = props.skipDayVisibility());
					return _el$32;
				}
			}), null);
			createRenderEffect(() => _el$.open = isOpen());
			createRenderEffect(() => _el$12.value = NotCaughtUpDisplay.OVERDUE);
			createRenderEffect(() => _el$13.value = NotCaughtUpDisplay.NORMAL);
			createRenderEffect(() => _el$11.value = props.notCaughtUpDisplay());
			return _el$;
		})();
	};
	delegateEvents(["input"]);
	//#endregion
	//#region src/admin/personal-chore-modal.tsx
	var _tmpl$$9 = /*#__PURE__*/ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"><div class="mb-5 flex items-center justify-between"><h3 class="text-2xl text-indigo-600">Error</h3><button type=button class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"aria-label=Close>×</button></div><p>Person not found. Please refresh the page.`);
	var _tmpl$2$7 = /*#__PURE__*/ template(`<div class="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">`);
	var _tmpl$3$6 = /*#__PURE__*/ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"data-testid=modal><div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"data-testid=modal-content><div class="mb-5 flex items-center justify-between"><h3 class="text-2xl text-indigo-600"data-testid=modal-title></h3><button type=button class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"aria-label=Close>×</button></div><div class="mb-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-base"data-testid=assigned-person-display><span class="inline-block size-6 rounded-full border-2 border-black/10 align-middle"data-testid=person-color-badge></span><strong>Assigned to:</strong> </div><form><div class=mb-5><label for=choreName class="mb-3 block font-medium text-slate-900">Chore Name</label><input type=text id=choreName required class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"></div><div class=mb-5><div class="mb-3 flex items-center"><label for=startTime class="block font-medium text-slate-900">Start Time (optional)</label></div></div><div class=mb-5><div class="mb-3 flex items-center"><label for=deadline class="block font-medium text-slate-900">Deadline (optional)</label></div></div><div class="mt-6 flex justify-end gap-2.5">`);
	var PersonalChoreModal = (props) => {
		const { pinRequired, cachedPin, setCachedPin } = useAdminContext();
		const [name, setName] = createSignal(props.initialChore?.name ?? "");
		const [deadline, setDeadline] = createSignal(props.initialChore?.deadline ?? "");
		const [startTime, setStartTime] = createSignal(props.initialChore?.startTime ?? "");
		const [skipDayVisibility, setSkipDayVisibility] = createSignal(props.initialChore?.skipDayVisibility ?? SkipDayVisibility.HIDE);
		const [skipDays, setSkipDays] = createSignal(props.initialChore?.skipDays ?? []);
		const [beforeStartTimeVisibility, setBeforeStartTimeVisibility] = createSignal(props.initialChore?.beforeStartTimeVisibility ?? BeforeStartTimeVisibility.HIDE);
		const [afterDeadlineVisibility, setAfterDeadlineVisibility] = createSignal(props.initialChore?.afterDeadlineVisibility ?? AfterDeadlineVisibility.SHOW_OVERDUE);
		const [notCaughtUpDisplay, setNotCaughtUpDisplay] = createSignal(props.initialChore?.notCaughtUpDisplay ?? NotCaughtUpDisplay.OVERDUE);
		const [formError, setFormError] = createSignal("");
		const [pin, setPin] = createSignal("");
		const [rememberPin, setRememberPin] = createSignal(false);
		const handleSubmit = async (event) => {
			event.preventDefault();
			setFormError("");
			const person = props.person;
			if (!person) {
				console.error("No person selected");
				return;
			}
			const deadlineValue = deadline() || null;
			const startTimeValue = startTime() || null;
			if (deadlineValue && startTimeValue && startTimeValue >= deadlineValue) {
				setFormError("Start time must be before the deadline.");
				return;
			}
			try {
				const cachedPinValue = cachedPin();
				const pinToUse = cachedPinValue || pin();
				if (props.initialChore?.id) {
					const body = {
						name: name(),
						type: ChoreType.PERSONAL,
						assignedTo: person.id,
						deadline: deadlineValue,
						startTime: startTimeValue,
						skipDays: skipDays(),
						skipDayVisibility: skipDayVisibility(),
						beforeStartTimeVisibility: beforeStartTimeVisibility(),
						afterDeadlineVisibility: afterDeadlineVisibility(),
						notCaughtUpDisplay: notCaughtUpDisplay(),
						pin: pinRequired() ? pinToUse || void 0 : void 0
					};
					await updateChore(props.initialChore.id, body);
				} else await createChore({
					name: name(),
					type: ChoreType.PERSONAL,
					assignedTo: person.id,
					deadline: deadlineValue ?? void 0,
					startTime: startTimeValue ?? void 0,
					skipDays: skipDays(),
					skipDayVisibility: skipDayVisibility(),
					beforeStartTimeVisibility: beforeStartTimeVisibility(),
					afterDeadlineVisibility: afterDeadlineVisibility(),
					notCaughtUpDisplay: notCaughtUpDisplay(),
					pin: pinRequired() ? pinToUse || void 0 : void 0
				});
				if (!cachedPinValue && rememberPin() && pin()) setCachedPin(pin());
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
					var _el$ = _tmpl$$9(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$5 = _el$3.firstChild.nextSibling;
					_el$3.nextSibling;
					_el$5.$$click = () => props.closeModal();
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
				var _el$7 = _tmpl$3$6(), _el$9 = _el$7.firstChild.firstChild, _el$0 = _el$9.firstChild, _el$1 = _el$0.nextSibling, _el$10 = _el$9.nextSibling, _el$11 = _el$10.firstChild;
				_el$11.nextSibling.nextSibling;
				var _el$14 = _el$10.nextSibling, _el$15 = _el$14.firstChild, _el$17 = _el$15.firstChild.nextSibling, _el$18 = _el$15.nextSibling, _el$19 = _el$18.firstChild;
				_el$19.firstChild;
				var _el$21 = _el$18.nextSibling, _el$22 = _el$21.firstChild;
				_el$22.firstChild;
				var _el$25 = _el$21.nextSibling;
				insert(_el$0, () => props.initialChore ? "Edit Personal Chore" : "Add Personal Chore");
				_el$1.$$click = () => props.closeModal();
				insert(_el$10, () => person.name, null);
				_el$14.addEventListener("submit", handleSubmit);
				_el$17.$$input = (e) => setName(e.currentTarget.value);
				insert(_el$19, createComponent(HelpIcon, {
					text: "The chore stays hidden until this time. If a chore that is not caught up is set to 'Show if overdue', it appears early so it can be caught up. The display format (12/24-hour) can be changed in Settings.",
					position: "above",
					align: "center",
					multiline: true,
					"class": "ml-1.5"
				}), null);
				insert(_el$18, createComponent(TimeSelect, {
					id: "startTime",
					get value() {
						return startTime();
					},
					onChange: setStartTime
				}), null);
				insert(_el$22, createComponent(HelpIcon, {
					text: "After-deadline behavior is controlled by the 'After deadline' option in Advanced Display Options. Completed chores past this time move to the 'Earlier chores' section. The display format (12/24-hour) can be changed in Settings.",
					position: "above",
					align: "center",
					multiline: true,
					"class": "ml-1.5"
				}), null);
				insert(_el$21, createComponent(TimeSelect, {
					id: "deadline",
					get value() {
						return deadline();
					},
					onChange: setDeadline
				}), null);
				insert(_el$14, createComponent(ScheduleDaysSelector, {
					skipDays,
					setSkipDays
				}), _el$25);
				insert(_el$14, createComponent(DisplayOptionsSection, {
					startTime,
					deadline,
					skipDays,
					skipDayVisibility,
					setSkipDayVisibility,
					beforeStartTimeVisibility,
					setBeforeStartTimeVisibility,
					afterDeadlineVisibility,
					setAfterDeadlineVisibility,
					notCaughtUpDisplay,
					setNotCaughtUpDisplay
				}), _el$25);
				insert(_el$14, createComponent(Show, {
					get when() {
						return formError();
					},
					get children() {
						var _el$24 = _tmpl$2$7();
						insert(_el$24, formError);
						return _el$24;
					}
				}), _el$25);
				insert(_el$14, createComponent(Show, {
					get when() {
						return memo(() => !!pinRequired())() && !cachedPin();
					},
					get children() {
						return createComponent(PinField, {
							get pin() {
								return pin();
							},
							onPinChange: setPin,
							get remember() {
								return rememberPin();
							},
							onRememberChange: setRememberPin
						});
					}
				}), _el$25);
				insert(_el$25, createComponent(Button, {
					type: "button",
					variant: "secondary",
					onClick: () => props.closeModal(),
					children: "Cancel"
				}), null);
				insert(_el$25, createComponent(Button, {
					type: "submit",
					variant: "primary",
					get children() {
						return props.initialChore ? "Save" : "Add";
					}
				}), null);
				createRenderEffect((_$p) => style(_el$11, `background-color: ${person.color}`, _$p));
				createRenderEffect(() => _el$17.value = name());
				return _el$7;
			})()
		});
	};
	delegateEvents(["click", "input"]);
	//#endregion
	//#region src/admin/pin-prompt-modal.tsx
	var _tmpl$$8 = /*#__PURE__*/ template(`<button type=button class="cursor-help text-sm text-indigo-600 underline">Forgot PIN?`);
	var _tmpl$2$6 = /*#__PURE__*/ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="w-[90%] max-w-[400px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"><div class="mb-2 flex items-center justify-between"><h3 class="text-xl text-indigo-600"data-testid=modal-title></h3><button type=button class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"aria-label=Close>×</button></div><p class="mb-5 text-sm text-slate-600"data-testid=modal-message></p><form><div class=mb-5><label for=pinPromptInput class="mb-2 block font-medium text-amber-900">PIN</label><div class="flex gap-2"><input id=pinPromptInput placeholder="Enter PIN"required autofocus class="flex-1 rounded-lg border border-amber-300 p-2.5 text-base transition-colors focus:border-amber-600 focus:outline-none"><button type=button class="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-amber-800 transition-colors hover:bg-amber-100"></button></div></div><label class="mb-5 flex cursor-pointer items-center gap-2"><input type=checkbox class="size-4.5 cursor-pointer"data-testid=remember-pin-checkbox>Remember PIN for 10 minutes</label><div class=mb-5></div><div class="flex justify-end gap-2.5">`);
	var PinPromptModal = (props) => {
		const [pin, setPin] = createSignal("");
		const [showPin, setShowPin] = createSignal(false);
		const [remember, setRemember] = createSignal(false);
		const handleSubmit = (event) => {
			event.preventDefault();
			if (pin().trim() === "") return;
			props.onConfirm(pin().trim(), remember());
		};
		return (() => {
			var _el$ = _tmpl$2$6(), _el$3 = _el$.firstChild.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.nextSibling, _el$6 = _el$3.nextSibling, _el$7 = _el$6.nextSibling, _el$8 = _el$7.firstChild, _el$1 = _el$8.firstChild.nextSibling.firstChild, _el$10 = _el$1.nextSibling, _el$11 = _el$8.nextSibling, _el$12 = _el$11.firstChild;
			_el$12.nextSibling;
			var _el$14 = _el$11.nextSibling, _el$16 = _el$14.nextSibling;
			insert(_el$4, () => props.title);
			_el$5.$$click = () => props.onCancel();
			insert(_el$6, () => props.message);
			_el$7.addEventListener("submit", handleSubmit);
			_el$1.$$input = (e) => setPin(e.currentTarget.value);
			_el$10.$$click = () => setShowPin(!showPin());
			insert(_el$10, () => showPin() ? "🙈" : "👁");
			_el$12.$$input = (e) => setRemember(e.currentTarget.checked);
			insert(_el$11, createComponent(HelpIcon, {
				text: "PIN is remembered for 10 minutes or until you refresh or close the window",
				multiline: true,
				align: "right",
				"class": "ml-1"
			}), null);
			insert(_el$14, createComponent(Tooltip, {
				text: "SSH into the MagicMirror and edit the adminPin value in the module's data file directly",
				position: "above",
				align: "left",
				multiline: true,
				get children() {
					return _tmpl$$8();
				}
			}));
			insert(_el$16, createComponent(Button, {
				type: "button",
				variant: "secondary",
				get onClick() {
					return props.onCancel;
				},
				children: "Cancel"
			}), null);
			insert(_el$16, createComponent(Button, {
				type: "submit",
				variant: "primary",
				children: "Confirm"
			}), null);
			createRenderEffect(() => setAttribute(_el$1, "type", showPin() ? "text" : "password"));
			createRenderEffect(() => _el$1.value = pin());
			createRenderEffect(() => _el$12.checked = remember());
			return _el$;
		})();
	};
	delegateEvents(["click", "input"]);
	//#endregion
	//#region src/admin/reset-caught-up-modal.tsx
	var _tmpl$$7 = /*#__PURE__*/ template(`<strong>Note:`);
	var _tmpl$2$5 = /*#__PURE__*/ template(`<strong>caught up`);
	var _tmpl$3$5 = /*#__PURE__*/ template(`<br>`);
	var _tmpl$4$3 = /*#__PURE__*/ template(`<div class="mb-5 overflow-hidden rounded-lg border border-slate-200"data-testid=overdue-chores-list><div class="grid grid-cols-[1fr_1fr] items-center gap-x-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase"><span>Chore</span><span>Assigned To`);
	var _tmpl$5$2 = /*#__PURE__*/ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] w-[90%] max-w-140 scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"data-testid=reset-caught-up-modal><div class="mb-2 flex items-center justify-between"><h3 class="text-2xl text-indigo-600">Reset All Caught Up</h3><button type=button class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"aria-label=Close>×</button></div><div class="mt-6 flex justify-end gap-2.5">`);
	var _tmpl$6$2 = /*#__PURE__*/ template(`<p class="my-4 text-slate-500 italic"data-testid=no-overdue-message>All chores are already caught up — nothing to reset.`);
	var _tmpl$7$2 = /*#__PURE__*/ template(`<div class="grid grid-cols-[1fr_1fr] items-center gap-x-3 px-4 py-3"><span class="font-medium text-slate-800"></span><span class="text-sm text-slate-500">`);
	var ResetCaughtUpModal = (props) => {
		const { choreData, pinRequired, cachedPin, setCachedPin } = useAdminContext();
		const [pin, setPin] = createSignal("");
		const [rememberPin, setRememberPin] = createSignal(false);
		const getPersonName = (id) => choreData().people.find((p) => p.id === id)?.name ?? "Unknown";
		const getCurrentAssignee = (chore) => {
			if (chore.type === ChoreType.PERSONAL) return getPersonName(chore.assignedTo);
			const id = (chore.rotation ?? [])[chore.rotatingIndex ?? 0] ?? "";
			return getPersonName(id);
		};
		const handleConfirm = async () => {
			try {
				const pinToUse = cachedPin() || pin();
				await resetCaughtUp({ pin: pinRequired() ? pinToUse || void 0 : void 0 });
				if (!cachedPin() && rememberPin() && pin()) setCachedPin(pin());
				props.closeModal();
			} catch (error) {
				console.error("Error resetting caught up status:", error);
				alert(`Failed to reset caught up status: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		return (() => {
			var _el$ = _tmpl$5$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$5 = _el$3.firstChild.nextSibling, _el$10 = _el$3.nextSibling;
			_el$5.$$click = () => props.closeModal();
			insert(_el$2, createComponent(InfoBox, {
				icon: true,
				"class": "mb-5",
				get children() {
					return [
						_tmpl$$7(),
						" A chore is ",
						_tmpl$2$5(),
						" when it was completed on the previous day it appeared (by default, the previous non-skip day). New and newly rotated chores start as caught up.",
						_tmpl$3$5(),
						_tmpl$3$5(),
						"Clicking reset will mark all chores as caught up. This is useful after a vacation or extended downtime when overdue indicators no longer reflect reality."
					];
				}
			}), _el$10);
			insert(_el$2, createComponent(Show, {
				get when() {
					return props.overdue.length > 0;
				},
				get fallback() {
					return _tmpl$6$2();
				},
				get children() {
					var _el$0 = _tmpl$4$3();
					_el$0.firstChild;
					insert(_el$0, createComponent(For, {
						get each() {
							return props.overdue;
						},
						children: (chore, index) => (() => {
							var _el$12 = _tmpl$7$2(), _el$13 = _el$12.firstChild, _el$14 = _el$13.nextSibling;
							insert(_el$13, () => chore.name);
							insert(_el$14, () => getCurrentAssignee(chore));
							createRenderEffect((_p$) => {
								var _v$ = !!(index() % 2 === 1), _v$2 = `overdue-row-${chore.id}`;
								_v$ !== _p$.e && _el$12.classList.toggle("bg-slate-50/50", _p$.e = _v$);
								_v$2 !== _p$.t && setAttribute(_el$12, "data-testid", _p$.t = _v$2);
								return _p$;
							}, {
								e: void 0,
								t: void 0
							});
							return _el$12;
						})()
					}), null);
					return _el$0;
				}
			}), _el$10);
			insert(_el$2, createComponent(Show, {
				get when() {
					return memo(() => !!pinRequired())() && !cachedPin();
				},
				get children() {
					return createComponent(PinField, {
						get pin() {
							return pin();
						},
						onPinChange: setPin,
						get remember() {
							return rememberPin();
						},
						onRememberChange: setRememberPin
					});
				}
			}), _el$10);
			insert(_el$10, createComponent(Button, {
				type: "button",
				variant: "secondary",
				onClick: () => props.closeModal(),
				children: "Cancel"
			}), null);
			insert(_el$10, createComponent(Show, {
				get when() {
					return props.overdue.length > 0;
				},
				get children() {
					return createComponent(Button, {
						type: "button",
						variant: "success",
						onClick: handleConfirm,
						children: "Reset All Caught Up"
					});
				}
			}), null);
			return _el$;
		})();
	};
	delegateEvents(["click"]);
	//#endregion
	//#region src/admin/rotating-chore-modal.tsx
	var _tmpl$$6 = /*#__PURE__*/ template(`<svg width=12 height=18 viewBox="0 0 12 18"class=text-slate-400><title>Drag handle</title><circle cx=3 cy=3 r=1.5 fill=currentColor></circle><circle cx=9 cy=3 r=1.5 fill=currentColor></circle><circle cx=3 cy=9 r=1.5 fill=currentColor></circle><circle cx=9 cy=9 r=1.5 fill=currentColor></circle><circle cx=3 cy=15 r=1.5 fill=currentColor></circle><circle cx=9 cy=15 r=1.5 fill=currentColor>`);
	var _tmpl$2$4 = /*#__PURE__*/ template(`<li class="list-none p-4 text-center text-sm text-slate-400 italic">All people in rotation`);
	var _tmpl$3$4 = /*#__PURE__*/ template(`<li class="list-none p-4 text-center text-sm text-slate-400 italic"data-testid=empty-rotation-message>Drag people here`);
	var _tmpl$4$2 = /*#__PURE__*/ template(`<div class="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">`);
	var _tmpl$5$1 = /*#__PURE__*/ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] w-[90%] max-w-[600px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"><div class="mb-5 flex items-center justify-between"><h3 class="text-2xl text-indigo-600"data-testid=modal-title></h3><button type=button class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"aria-label=Close>×</button></div><form><div class=mb-5><label for=choreName class="mb-3 block font-medium text-slate-900">Chore Name</label><input type=text id=choreName required class="mb-2 w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"></div><div class=mb-5><div class="mb-3 block font-medium text-slate-900">Rotation</div><div class="flex gap-4"><div class=flex-1><div class="mb-2 text-sm font-medium text-slate-600">Available</div><ul class="min-h-[120px] rounded-lg border border-slate-200 bg-slate-50 p-2"data-testid=available-column></ul></div><div class=flex-1><div class="mb-2 text-sm font-medium text-slate-600">In Rotation</div><ul class="min-h-[120px] rounded-lg border border-slate-200 bg-slate-50 p-2"data-testid=rotation-column></ul></div></div></div><div class=mb-5><div class="mb-3 flex items-center"><label for=startTime class="block font-medium text-slate-900">Start Time (optional)</label></div></div><div class=mb-5><div class="mb-3 flex items-center"><label for=deadline class="block font-medium text-slate-900">Deadline (optional)</label></div></div><div class="mt-6 flex justify-end gap-2.5">`);
	var _tmpl$6$1 = /*#__PURE__*/ template(`<li class="flex cursor-grab items-center gap-2 rounded p-2 transition-opacity hover:bg-slate-100"><span data-drag-handle class=shrink-0></span><span class=text-sm>`);
	var _tmpl$7$1 = /*#__PURE__*/ template(`<li class="flex items-center gap-2 rounded p-2 transition-opacity hover:bg-slate-100"data-rotation-item><span data-drag-handle class="shrink-0 cursor-grab"></span><label class="flex cursor-pointer items-center gap-2"><input type=radio name=active-person class="size-4 cursor-pointer"><span class=text-sm>`);
	/**
	* 6-dot grab handle used as the drag initiator for person rows.
	*/
	var GrabHandle = () => _tmpl$$6();
	var RotatingChoreModal = (props) => {
		const { choreData, pinRequired, setCachedPin, cachedPin } = useAdminContext();
		const [name, setName] = createSignal(props.initialChore?.name ?? "");
		const [deadline, setDeadline] = createSignal(props.initialChore?.deadline ?? "");
		const [startTime, setStartTime] = createSignal(props.initialChore?.startTime ?? "");
		const [skipDayVisibility, setSkipDayVisibility] = createSignal(props.initialChore?.skipDayVisibility ?? SkipDayVisibility.HIDE);
		const [skipDays, setSkipDays] = createSignal(props.initialChore?.skipDays ?? []);
		const [beforeStartTimeVisibility, setBeforeStartTimeVisibility] = createSignal(props.initialChore?.beforeStartTimeVisibility ?? BeforeStartTimeVisibility.HIDE);
		const [afterDeadlineVisibility, setAfterDeadlineVisibility] = createSignal(props.initialChore?.afterDeadlineVisibility ?? AfterDeadlineVisibility.SHOW_OVERDUE);
		const [notCaughtUpDisplay, setNotCaughtUpDisplay] = createSignal(props.initialChore?.notCaughtUpDisplay ?? NotCaughtUpDisplay.OVERDUE);
		const [rotation, setRotation] = createSignal(props.initialChore?.rotation ?? []);
		const [activePersonId, setActivePersonId] = createSignal(props.initialChore ? props.initialChore.rotation[props.initialChore.rotatingIndex ?? 0] ?? "" : "");
		const [formError, setFormError] = createSignal("");
		const [pin, setPin] = createSignal("");
		const [rememberPin, setRememberPin] = createSignal(false);
		const [draggedPersonId, setDraggedPersonId] = createSignal(null);
		const [dragOverColumn, setDragOverColumn] = createSignal(null);
		const [dragOverIndex, setDragOverIndex] = createSignal(null);
		const availablePeople = () => choreData().people.filter((p) => !rotation().includes(p.id));
		const getPersonName = (id) => choreData().people.find((p) => p.id === id)?.name ?? "Unknown";
		const handleDragStart = (personId) => (e) => {
			setDraggedPersonId(personId);
			e.dataTransfer?.setData("text/plain", personId);
			if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
		};
		const handleDragEnd = () => {
			setDraggedPersonId(null);
			setDragOverColumn(null);
			setDragOverIndex(null);
		};
		const handleColumnDragOver = (e, column) => {
			e.preventDefault();
			setDragOverColumn(column);
			if (column === "rotation") {
				const container = e.currentTarget;
				const children = Array.from(container.querySelectorAll("[data-rotation-item]"));
				let insertIndex = children.length;
				for (let i = 0; i < children.length; i++) {
					const rect = children[i].getBoundingClientRect();
					const midY = rect.top + rect.height / 2;
					if (e.clientY < midY) {
						insertIndex = i;
						break;
					}
				}
				setDragOverIndex(insertIndex);
			} else setDragOverIndex(null);
		};
		const handleColumnDrop = (e, column) => {
			e.preventDefault();
			const personId = e.dataTransfer?.getData("text/plain");
			if (!personId) return;
			const currentRotation = rotation();
			const isInRotation = currentRotation.includes(personId);
			if (column === "rotation") {
				const container = e.currentTarget;
				const children = Array.from(container.querySelectorAll("[data-rotation-item]"));
				let insertIndex = children.length;
				for (let i = 0; i < children.length; i++) {
					const rect = children[i].getBoundingClientRect();
					const midY = rect.top + rect.height / 2;
					if (e.clientY < midY) {
						insertIndex = i;
						break;
					}
				}
				if (isInRotation) {
					const oldIndex = currentRotation.indexOf(personId);
					const newRotation = currentRotation.filter((id) => id !== personId);
					if (oldIndex < insertIndex) insertIndex--;
					newRotation.splice(insertIndex, 0, personId);
					setRotation(newRotation);
				} else {
					const newRotation = [...currentRotation];
					newRotation.splice(insertIndex, 0, personId);
					setRotation(newRotation);
					if (!activePersonId()) setActivePersonId(personId);
				}
			} else if (column === "available" && isInRotation) {
				const newRotation = currentRotation.filter((id) => id !== personId);
				setRotation(newRotation);
				if (activePersonId() === personId) setActivePersonId(newRotation[0] ?? "");
			}
			setDraggedPersonId(null);
			setDragOverColumn(null);
			setDragOverIndex(null);
		};
		const handleSubmit = async (event) => {
			event.preventDefault();
			setFormError("");
			const deadlineValue = deadline() || null;
			const startTimeValue = startTime() || null;
			if (deadlineValue && startTimeValue && startTimeValue >= deadlineValue) {
				setFormError("Start time must be before the deadline.");
				return;
			}
			try {
				const pinToUse = cachedPin() || pin();
				const currentRotation = rotation();
				const rotatingIndex = activePersonId() ? currentRotation.indexOf(activePersonId()) : 0;
				if (props.initialChore?.id) {
					const body = {
						name: name(),
						type: ChoreType.ROTATING,
						rotation: currentRotation,
						rotatingIndex,
						deadline: deadlineValue,
						startTime: startTimeValue,
						skipDays: skipDays(),
						skipDayVisibility: skipDayVisibility(),
						beforeStartTimeVisibility: beforeStartTimeVisibility(),
						afterDeadlineVisibility: afterDeadlineVisibility(),
						notCaughtUpDisplay: notCaughtUpDisplay(),
						pin: pinRequired() ? pinToUse || void 0 : void 0
					};
					await updateChore(props.initialChore.id, body);
				} else await createChore({
					name: name(),
					type: ChoreType.ROTATING,
					rotation: currentRotation,
					rotatingIndex,
					deadline: deadlineValue ?? void 0,
					startTime: startTimeValue ?? void 0,
					skipDays: skipDays(),
					skipDayVisibility: skipDayVisibility(),
					beforeStartTimeVisibility: beforeStartTimeVisibility(),
					afterDeadlineVisibility: afterDeadlineVisibility(),
					notCaughtUpDisplay: notCaughtUpDisplay(),
					pin: pinRequired() ? pinToUse || void 0 : void 0
				});
				if (!cachedPin() && rememberPin() && pin()) setCachedPin(pin());
				props.closeModal();
			} catch (error) {
				console.error("Error saving chore:", error);
				alert(`Failed to save chore: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		return (() => {
			var _el$2 = _tmpl$5$1(), _el$4 = _el$2.firstChild.firstChild, _el$5 = _el$4.firstChild, _el$6 = _el$5.nextSibling, _el$7 = _el$4.nextSibling, _el$8 = _el$7.firstChild, _el$0 = _el$8.firstChild.nextSibling, _el$1 = _el$8.nextSibling, _el$12 = _el$1.firstChild.nextSibling.firstChild, _el$14 = _el$12.firstChild.nextSibling, _el$18 = _el$12.nextSibling.firstChild.nextSibling, _el$20 = _el$1.nextSibling, _el$21 = _el$20.firstChild;
			_el$21.firstChild;
			var _el$23 = _el$20.nextSibling, _el$24 = _el$23.firstChild;
			_el$24.firstChild;
			var _el$27 = _el$23.nextSibling;
			insert(_el$5, () => props.initialChore ? "Edit Rotating Chore" : "Add Rotating Chore");
			_el$6.$$click = () => props.closeModal();
			_el$7.addEventListener("submit", handleSubmit);
			_el$0.$$input = (e) => setName(e.currentTarget.value);
			_el$14.addEventListener("drop", (e) => handleColumnDrop(e, "available"));
			_el$14.addEventListener("dragover", (e) => handleColumnDragOver(e, "available"));
			insert(_el$14, createComponent(For, {
				get each() {
					return availablePeople();
				},
				children: (person) => (() => {
					var _el$28 = _tmpl$6$1(), _el$29 = _el$28.firstChild, _el$30 = _el$29.nextSibling;
					_el$28.addEventListener("dragend", handleDragEnd);
					addEventListener(_el$28, "dragstart", handleDragStart(person.id));
					setAttribute(_el$28, "draggable", true);
					insert(_el$29, createComponent(GrabHandle, {}));
					insert(_el$30, () => person.name);
					createRenderEffect((_p$) => {
						var _v$3 = !!(draggedPersonId() === person.id), _v$4 = `available-person-${person.id}`;
						_v$3 !== _p$.e && _el$28.classList.toggle("opacity-50", _p$.e = _v$3);
						_v$4 !== _p$.t && setAttribute(_el$28, "data-testid", _p$.t = _v$4);
						return _p$;
					}, {
						e: void 0,
						t: void 0
					});
					return _el$28;
				})()
			}), null);
			insert(_el$14, createComponent(Show, {
				get when() {
					return availablePeople().length === 0;
				},
				get children() {
					return _tmpl$2$4();
				}
			}), null);
			_el$18.addEventListener("drop", (e) => handleColumnDrop(e, "rotation"));
			_el$18.addEventListener("dragover", (e) => handleColumnDragOver(e, "rotation"));
			insert(_el$18, createComponent(For, {
				get each() {
					return rotation();
				},
				children: (personId, index) => (() => {
					var _el$31 = _tmpl$7$1(), _el$32 = _el$31.firstChild, _el$34 = _el$32.nextSibling.firstChild, _el$35 = _el$34.nextSibling;
					_el$31.addEventListener("dragend", handleDragEnd);
					addEventListener(_el$31, "dragstart", handleDragStart(personId));
					setAttribute(_el$31, "draggable", true);
					setAttribute(_el$31, "data-testid", `rotation-person-${personId}`);
					insert(_el$32, createComponent(GrabHandle, {}));
					_el$34.addEventListener("change", () => setActivePersonId(personId));
					_el$34.value = personId;
					setAttribute(_el$34, "data-testid", `active-person-radio-${personId}`);
					insert(_el$35, () => getPersonName(personId));
					createRenderEffect((_$p) => classList(_el$31, {
						"border-t-2 border-indigo-500": dragOverColumn() === "rotation" && dragOverIndex() === index(),
						"border-b-2 border-indigo-500": dragOverColumn() === "rotation" && dragOverIndex() === rotation().length && index() === rotation().length - 1,
						"opacity-50": draggedPersonId() === personId
					}, _$p));
					createRenderEffect(() => _el$34.checked = activePersonId() === personId);
					return _el$31;
				})()
			}), null);
			insert(_el$18, createComponent(Show, {
				get when() {
					return rotation().length === 0;
				},
				get children() {
					return _tmpl$3$4();
				}
			}), null);
			insert(_el$21, createComponent(HelpIcon, {
				text: "The chore stays hidden until this time. If a chore that is not caught up is set to 'Show if overdue', it appears early so it can be caught up. The display format (12/24-hour) can be changed in Settings.",
				position: "above",
				align: "center",
				multiline: true,
				"class": "ml-1.5"
			}), null);
			insert(_el$20, createComponent(TimeSelect, {
				id: "startTime",
				get value() {
					return startTime();
				},
				onChange: setStartTime
			}), null);
			insert(_el$24, createComponent(HelpIcon, {
				text: "After-deadline behavior is controlled by the 'After deadline' option in Advanced Display Options. Completed chores past this time move to the 'Earlier chores' section. The display format (12/24-hour) can be changed in Settings.",
				position: "above",
				align: "center",
				multiline: true,
				"class": "ml-1.5"
			}), null);
			insert(_el$23, createComponent(TimeSelect, {
				id: "deadline",
				get value() {
					return deadline();
				},
				onChange: setDeadline
			}), null);
			insert(_el$7, createComponent(ScheduleDaysSelector, {
				skipDays,
				setSkipDays
			}), _el$27);
			insert(_el$7, createComponent(DisplayOptionsSection, {
				startTime,
				deadline,
				skipDays,
				skipDayVisibility,
				setSkipDayVisibility,
				beforeStartTimeVisibility,
				setBeforeStartTimeVisibility,
				afterDeadlineVisibility,
				setAfterDeadlineVisibility,
				notCaughtUpDisplay,
				setNotCaughtUpDisplay
			}), _el$27);
			insert(_el$7, createComponent(Show, {
				get when() {
					return formError();
				},
				get children() {
					var _el$26 = _tmpl$4$2();
					insert(_el$26, formError);
					return _el$26;
				}
			}), _el$27);
			insert(_el$7, createComponent(Show, {
				get when() {
					return memo(() => !!pinRequired())() && !cachedPin();
				},
				get children() {
					return createComponent(PinField, {
						get pin() {
							return pin();
						},
						onPinChange: setPin,
						get remember() {
							return rememberPin();
						},
						onRememberChange: setRememberPin
					});
				}
			}), _el$27);
			insert(_el$27, createComponent(Button, {
				type: "button",
				variant: "secondary",
				onClick: () => props.closeModal(),
				children: "Cancel"
			}), null);
			insert(_el$27, createComponent(Button, {
				type: "submit",
				variant: "primary",
				get children() {
					return props.initialChore ? "Save" : "Add";
				}
			}), null);
			createRenderEffect((_p$) => {
				var _v$ = { "border-indigo-500 bg-indigo-50": dragOverColumn() === "available" }, _v$2 = { "border-indigo-500 bg-indigo-50": dragOverColumn() === "rotation" };
				_p$.e = classList(_el$14, _v$, _p$.e);
				_p$.t = classList(_el$18, _v$2, _p$.t);
				return _p$;
			}, {
				e: void 0,
				t: void 0
			});
			createRenderEffect(() => _el$0.value = name());
			return _el$2;
		})();
	};
	delegateEvents(["click", "input"]);
	//#endregion
	//#region src/admin/rotating-chore.tsx
	var _tmpl$$5 = /*#__PURE__*/ template(`<span class=mx-1>|`);
	var _tmpl$2$3 = /*#__PURE__*/ template(`<p class="mt-1.25 text-sm text-indigo-600">`);
	var _tmpl$3$3 = /*#__PURE__*/ template(`<div class="rounded-lg border border-slate-200 bg-slate-50 p-5 transition-all hover:border-indigo-600 hover:shadow-md"><div class=flex-1><h3 class="mb-1.5 text-xl text-slate-900"> <span class="ml-2 inline-block rounded bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">Rotating</span></h3><p class="text-sm text-slate-500">Current: </p><p class="text-sm text-slate-500">Rotation: </p></div><div class="flex gap-2.5">`);
	/** Display card for a rotating chore in the admin interface */
	var RotatingChoreCard = (props) => {
		const { resolvedTimeFormat } = useAdminContext();
		const rotationNames = createMemo(() => props.chore.rotation.map((personId) => {
			const person = props.people.find((p) => p.id === personId);
			return person ? person.name : "Unknown";
		}).join(", "));
		const includesEveryone = createMemo(() => {
			const peopleLength = props.people.length ?? 0;
			return props.chore.rotation.length === peopleLength && props.chore.rotation.every((personId) => props.people.some((p) => p.id === personId));
		});
		const rotationText = createMemo(() => includesEveryone() ? "Everyone" : rotationNames());
		const currentAssignee = createMemo(() => {
			const currentPersonId = props.chore.rotation[props.chore.rotatingIndex ?? 0];
			const currentPerson = props.people.find((p) => p.id === currentPersonId);
			return currentPerson ? currentPerson.name : "Unassigned";
		});
		return (() => {
			var _el$ = _tmpl$3$3(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$3.nextSibling;
			_el$5.firstChild;
			var _el$7 = _el$5.nextSibling;
			_el$7.firstChild;
			var _el$1 = _el$2.nextSibling;
			insert(_el$3, () => props.chore.name, _el$4);
			insert(_el$5, currentAssignee, null);
			insert(_el$7, rotationText, null);
			insert(_el$2, createComponent(Show, {
				get when() {
					return props.chore.deadline || props.chore.startTime;
				},
				get children() {
					var _el$9 = _tmpl$2$3();
					insert(_el$9, createComponent(Show, {
						get when() {
							return props.chore.startTime;
						},
						get children() {
							return ["Start: ", memo(() => formatTime(props.chore.startTime ?? "", resolvedTimeFormat()))];
						}
					}), null);
					insert(_el$9, createComponent(Show, {
						get when() {
							return memo(() => !!props.chore.deadline)() && props.chore.startTime;
						},
						get children() {
							return _tmpl$$5();
						}
					}), null);
					insert(_el$9, createComponent(Show, {
						get when() {
							return props.chore.deadline;
						},
						get children() {
							return ["Deadline: ", memo(() => formatTime(props.chore.deadline ?? "", resolvedTimeFormat()))];
						}
					}), null);
					return _el$9;
				}
			}), null);
			insert(_el$2, createComponent(ScheduleDaysSummary, { get skipDays() {
				return props.chore.skipDays;
			} }), null);
			insert(_el$1, createComponent(Button, {
				type: "button",
				variant: "secondary",
				size: "sm",
				onClick: () => props.onEdit(props.chore),
				children: "Edit"
			}), null);
			insert(_el$1, createComponent(Button, {
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
	//#region src/admin/rotating-chores-tab.tsx
	var _tmpl$$4 = /*#__PURE__*/ template(`<section data-testid=rotating-chores-section><div class="mb-5 flex items-center justify-between"><h2 class="m-0 border-b-2 border-indigo-600 pb-2.5 text-2xl text-indigo-600">Rotating Chores</h2><div class="flex items-center gap-2"></div></div><div class="mt-5 grid gap-4">`);
	/** Tab showing all rotating chores */
	var RotatingChoresTab = (props) => {
		const rotatingChores = () => props.chores.filter((chore) => chore.type === ChoreType.ROTATING);
		return createComponent(Show, {
			get when() {
				return props.people.length > 0;
			},
			get children() {
				var _el$ = _tmpl$$4(), _el$2 = _el$.firstChild, _el$4 = _el$2.firstChild.nextSibling, _el$5 = _el$2.nextSibling;
				insert(_el$4, createComponent(Button, {
					type: "button",
					variant: "primary",
					onClick: () => props.onAddRotatingChore(),
					children: "Add Rotating Chore"
				}), null);
				insert(_el$4, createComponent(Show, {
					get when() {
						return rotatingChores().length > 0;
					},
					get children() {
						return createComponent(Button, {
							type: "button",
							variant: "secondary",
							onClick: () => props.onBulkEdit(),
							dataTestId: "bulk-edit-rotating-btn",
							children: "Bulk Edit Settings"
						});
					}
				}), null);
				insert(_el$5, createComponent(For, {
					get each() {
						return rotatingChores();
					},
					children: (chore) => createComponent(RotatingChoreCard, {
						chore,
						get people() {
							return props.people;
						},
						get onEdit() {
							return props.onEditRotatingChore;
						},
						get onDelete() {
							return props.onDeleteChore;
						}
					})
				}));
				return _el$;
			}
		});
	};
	//#endregion
	//#region src/admin/settings-modal.tsx
	var _tmpl$$3 = /*#__PURE__*/ template(`<div class="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><strong>Note:</strong> This PIN is a basic deterrent only. It is stored in plain text in the module's data file. It is <strong>not</strong> intended for high-security environments. Do not expose the admin panel outside your local network. See the module README for more details.`);
	var _tmpl$2$2 = /*#__PURE__*/ template(`<div class=mb-3><label for=currentPin class="mb-2 block font-medium text-amber-900">Current PIN <span class=text-amber-700>*</span></label><div class="flex gap-2"><input id=currentPin placeholder="Enter current PIN to save changes"required class="flex-1 rounded-lg border border-amber-300 p-2.5 text-base transition-colors focus:border-amber-600 focus:outline-none"><button type=button class="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-amber-800 transition-colors hover:bg-amber-100">`);
	var _tmpl$3$2 = /*#__PURE__*/ template(`<label class="mb-3 flex cursor-pointer items-center gap-2"><input type=checkbox class="size-4.5 cursor-pointer">Change PIN`);
	var _tmpl$4$1 = /*#__PURE__*/ template(`<div class=mb-3><label for=newPin class="mb-2 block font-medium text-slate-900"> <span class=text-amber-700>*</span></label><div class="flex gap-2"><input id=newPin required class="flex-1 rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><button type=button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-100">`);
	var _tmpl$5 = /*#__PURE__*/ template(`<div class=mb-3><label for=confirmPin class="mb-2 block font-medium text-slate-900">Confirm PIN <span class=text-amber-700>*</span></label><div class="flex gap-2"><input id=confirmPin placeholder="Confirm PIN"required class="flex-1 rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><button type=button class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-100">`);
	var _tmpl$6 = /*#__PURE__*/ template(`<small class="block text-sm text-slate-500">PIN can be any combination of letters, numbers, or symbols. There is no length limit.`);
	var _tmpl$7 = /*#__PURE__*/ template(`<div class=mb-3><label for=currentPin class="mb-2 block font-medium text-amber-900">Current PIN <span class=text-amber-700>*</span></label><div class="flex gap-2"><input id=currentPin placeholder="Enter current PIN to disable protection"required class="flex-1 rounded-lg border border-amber-300 p-2.5 text-base transition-colors focus:border-amber-600 focus:outline-none"><button type=button class="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-amber-800 transition-colors hover:bg-amber-100">`);
	var _tmpl$8 = /*#__PURE__*/ template(`<div class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50"><div class="max-h-[90vh] w-[90%] max-w-[500px] scale-95 overflow-y-auto rounded-xl bg-white p-8 shadow-2xl transition-transform duration-200"><div class="mb-5 flex items-center justify-between"><h3 class="text-2xl text-indigo-600">Settings</h3><button type=button class="ml-4 cursor-pointer text-2xl leading-none text-slate-400 hover:text-slate-600"aria-label=Close>×</button></div><form><div class=mb-5><label class="flex cursor-pointer items-center gap-2"><input type=checkbox id=historyEnabled class="size-4.5 cursor-pointer">Enable History Tracking</label><small class="mt-2 block text-sm text-slate-500">Track daily chore completions (keeps last 14 days)</small></div><div class=mb-5><div class="mb-3 flex items-center gap-1.5"><label for=timeFormat class="font-medium text-slate-900">Time Format</label></div><select id=timeFormat class="w-full rounded-lg border border-slate-300 p-2.5 text-base transition-colors focus:border-indigo-600 focus:outline-none"><option>System (auto-detect)</option><option>12-hour (e.g. 2:30 PM)</option><option>24-hour (e.g. 14:30)</option></select></div><div class="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4"><h4 class="mb-3 font-medium text-slate-900">Admin PIN Protection</h4><label class="mb-4 flex cursor-pointer items-center gap-2"><input type=checkbox class="size-4.5 cursor-pointer">Enable PIN Protection</label><small class="block text-sm text-slate-500">When enabled, a PIN is required for all admin actions including backup, restore, and modifying people or chores.</small></div><div class="mt-6 flex justify-end gap-2.5">`);
	var SettingsModal = (props) => {
		const { choreData } = useAdminContext();
		const settings = () => choreData().settings;
		const [historyEnabled, setHistoryEnabled] = createSignal(settings().historyEnabled);
		const [timeFormat, setTimeFormat] = createSignal(settings().timeFormat ?? TimeFormat.SYSTEM);
		const [pinEnabled, setPinEnabled] = createSignal(!!settings().adminPin);
		const [currentPin, setCurrentPin] = createSignal("");
		const [newPin, setNewPin] = createSignal("");
		const [confirmPin, setConfirmPin] = createSignal("");
		const [changePin, setChangePin] = createSignal(false);
		const [showCurrentPin, setShowCurrentPin] = createSignal(false);
		const [showNewPin, setShowNewPin] = createSignal(false);
		const [showConfirmPin, setShowConfirmPin] = createSignal(false);
		const hasPin = () => !!settings().adminPin;
		const handleSubmit = async (event) => {
			event.preventDefault();
			const isEnabled = pinEnabled();
			const hadPin = hasPin();
			if (hadPin && isEnabled && currentPin() === "") {
				alert("Current PIN is required to save settings");
				return;
			}
			if (isEnabled && (!hadPin || changePin())) {
				if (newPin() === "") {
					alert("PIN cannot be empty when PIN protection is enabled");
					return;
				}
				if (newPin() !== confirmPin()) {
					alert("New PIN and confirmation do not match");
					return;
				}
			}
			if (hadPin && !isEnabled && currentPin() === "") {
				alert("Current PIN is required to disable PIN protection");
				return;
			}
			try {
				const body = {
					historyEnabled: historyEnabled(),
					timeFormat: timeFormat(),
					pin: hadPin ? currentPin() || void 0 : void 0
				};
				if (!isEnabled) body.adminPin = null;
				else if (!hadPin) body.adminPin = newPin();
				else if (changePin() && newPin()) body.adminPin = newPin();
				await updateSettings(body);
				props.closeModal();
			} catch (error) {
				console.error("Error saving settings:", error);
				alert(`Failed to save settings: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		return (() => {
			var _el$ = _tmpl$8(), _el$3 = _el$.firstChild.firstChild, _el$5 = _el$3.firstChild.nextSibling, _el$6 = _el$3.nextSibling, _el$7 = _el$6.firstChild, _el$9 = _el$7.firstChild.firstChild, _el$0 = _el$7.nextSibling, _el$1 = _el$0.firstChild;
			_el$1.firstChild;
			var _el$11 = _el$1.nextSibling, _el$12 = _el$11.firstChild, _el$13 = _el$12.nextSibling, _el$14 = _el$13.nextSibling, _el$15 = _el$0.nextSibling, _el$17 = _el$15.firstChild.nextSibling, _el$18 = _el$17.firstChild, _el$44 = _el$17.nextSibling, _el$45 = _el$15.nextSibling;
			_el$5.$$click = () => props.closeModal();
			_el$6.addEventListener("submit", handleSubmit);
			_el$9.$$input = (e) => setHistoryEnabled(e.currentTarget.checked);
			insert(_el$1, createComponent(HelpIcon, {
				text: "Controls how times are displayed in the admin panel and on the mirror. 'System' auto-detects from the browser locale — if times appear in the wrong format on the mirror, set this to 12-hour or 24-hour to override it.",
				position: "above",
				align: "center",
				multiline: true
			}), null);
			_el$11.addEventListener("change", (e) => setTimeFormat(e.currentTarget.value));
			_el$18.$$input = (e) => {
				setPinEnabled(e.currentTarget.checked);
				setChangePin(false);
				setNewPin("");
				setConfirmPin("");
			};
			insert(_el$15, createComponent(Show, {
				get when() {
					return pinEnabled();
				},
				get children() {
					return [
						_tmpl$$3(),
						createComponent(Show, {
							get when() {
								return hasPin();
							},
							get children() {
								return [(() => {
									var _el$20 = _tmpl$2$2(), _el$23 = _el$20.firstChild.nextSibling.firstChild, _el$24 = _el$23.nextSibling;
									_el$23.$$input = (e) => setCurrentPin(e.currentTarget.value);
									_el$24.$$click = () => setShowCurrentPin(!showCurrentPin());
									insert(_el$24, () => showCurrentPin() ? "🙈" : "👁");
									createRenderEffect(() => setAttribute(_el$23, "type", showCurrentPin() ? "text" : "password"));
									createRenderEffect(() => _el$23.value = currentPin());
									return _el$20;
								})(), (() => {
									var _el$25 = _tmpl$3$2(), _el$26 = _el$25.firstChild;
									_el$26.$$input = (e) => {
										setChangePin(e.currentTarget.checked);
										setNewPin("");
										setConfirmPin("");
									};
									createRenderEffect(() => _el$26.checked = changePin());
									return _el$25;
								})()];
							}
						}),
						createComponent(Show, {
							get when() {
								return !hasPin() || changePin();
							},
							get children() {
								return [
									(() => {
										var _el$27 = _tmpl$4$1(), _el$28 = _el$27.firstChild, _el$29 = _el$28.firstChild, _el$31 = _el$28.nextSibling.firstChild, _el$32 = _el$31.nextSibling;
										insert(_el$28, () => hasPin() ? "New PIN" : "Set PIN", _el$29);
										_el$31.$$input = (e) => setNewPin(e.currentTarget.value);
										_el$32.$$click = () => setShowNewPin(!showNewPin());
										insert(_el$32, () => showNewPin() ? "🙈" : "👁");
										createRenderEffect((_p$) => {
											var _v$ = showNewPin() ? "text" : "password", _v$2 = hasPin() ? "Enter new PIN" : "Enter PIN to protect admin actions";
											_v$ !== _p$.e && setAttribute(_el$31, "type", _p$.e = _v$);
											_v$2 !== _p$.t && setAttribute(_el$31, "placeholder", _p$.t = _v$2);
											return _p$;
										}, {
											e: void 0,
											t: void 0
										});
										createRenderEffect(() => _el$31.value = newPin());
										return _el$27;
									})(),
									(() => {
										var _el$33 = _tmpl$5(), _el$36 = _el$33.firstChild.nextSibling.firstChild, _el$37 = _el$36.nextSibling;
										_el$36.$$input = (e) => setConfirmPin(e.currentTarget.value);
										_el$37.$$click = () => setShowConfirmPin(!showConfirmPin());
										insert(_el$37, () => showConfirmPin() ? "🙈" : "👁");
										createRenderEffect(() => setAttribute(_el$36, "type", showConfirmPin() ? "text" : "password"));
										createRenderEffect(() => _el$36.value = confirmPin());
										return _el$33;
									})(),
									_tmpl$6()
								];
							}
						})
					];
				}
			}), _el$44);
			insert(_el$15, createComponent(Show, {
				get when() {
					return memo(() => !!!pinEnabled())() && hasPin();
				},
				get children() {
					var _el$39 = _tmpl$7(), _el$42 = _el$39.firstChild.nextSibling.firstChild, _el$43 = _el$42.nextSibling;
					_el$42.$$input = (e) => setCurrentPin(e.currentTarget.value);
					_el$43.$$click = () => setShowCurrentPin(!showCurrentPin());
					insert(_el$43, () => showCurrentPin() ? "🙈" : "👁");
					createRenderEffect(() => setAttribute(_el$42, "type", showCurrentPin() ? "text" : "password"));
					createRenderEffect(() => _el$42.value = currentPin());
					return _el$39;
				}
			}), _el$44);
			insert(_el$45, createComponent(Button, {
				type: "button",
				variant: "secondary",
				onClick: () => props.closeModal(),
				children: "Cancel"
			}), null);
			insert(_el$45, createComponent(Button, {
				type: "submit",
				variant: "primary",
				children: "Save"
			}), null);
			createRenderEffect(() => _el$9.checked = historyEnabled());
			createRenderEffect(() => _el$12.value = TimeFormat.SYSTEM);
			createRenderEffect(() => _el$13.value = TimeFormat.HOUR_12);
			createRenderEffect(() => _el$14.value = TimeFormat.HOUR_24);
			createRenderEffect(() => _el$11.value = timeFormat());
			createRenderEffect(() => _el$18.checked = pinEnabled());
			return _el$;
		})();
	};
	delegateEvents(["click", "input"]);
	//#endregion
	//#region src/admin/system-actions-tab.tsx
	var _tmpl$$2 = /*#__PURE__*/ template(`<section data-testid=system-actions-section><div class=mb-5><h2 class="m-0 border-b-2 border-amber-500 pb-2.5 text-2xl text-amber-600">System Actions</h2><p class="mt-3 text-sm text-slate-500">Coming back from vacation? Just set up the mirror after it hasn't been used in a while? These tools help you quickly reset or resync the chore state so everything reflects reality again.</p></div><div class="flex flex-wrap gap-3">`);
	/** Tab showing system-level actions for the chore module */
	var SystemActionsTab = (props) => {
		return (() => {
			var _el$ = _tmpl$$2(), _el$3 = _el$.firstChild.nextSibling;
			insert(_el$3, createComponent(Button, {
				type: "button",
				variant: "warning",
				get onClick() {
					return props.onAdvanceRotations;
				},
				dataTestId: "advance-rotations-btn",
				children: "↻ Advance All Rotations"
			}), null);
			insert(_el$3, createComponent(Button, {
				type: "button",
				variant: "secondary",
				get onClick() {
					return props.onResetCaughtUp;
				},
				dataTestId: "reset-caught-up-btn",
				children: "✓ Reset All Caught Up"
			}), null);
			return _el$;
		})();
	};
	//#endregion
	//#region src/admin/main-page.tsx
	var _tmpl$$1 = /*#__PURE__*/ template(`<header class="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-8 text-slate-900"><h1 class="text-3xl font-semibold">Family Chores Admin</h1><div class="flex gap-2.5"><label for=restoreFile class="cursor-pointer rounded-lg border-none bg-gray-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-gray-700 hover:shadow-md">Restore Backup</label><input type=file id=restoreFile accept=.json hidden>`);
	var _tmpl$2$1 = /*#__PURE__*/ template(`<main class=p-8><nav class="mb-8 border-b border-slate-200"><ul class="flex gap-1">`);
	var _tmpl$3$1 = /*#__PURE__*/ template(`<li><button type=button class="cursor-pointer border-b-2 px-4 py-2 text-sm font-medium transition-all hover:text-indigo-600">`);
	var API_BASE$1 = "/MMM-FamilyChores";
	var MainPage = () => {
		const { choreData, loadData, pinRequired, setCachedPin, cachedPin } = useAdminContext();
		const [pinPromptOpen, setPinPromptOpen] = createSignal(false);
		const [pinPromptTitle, setPinPromptTitle] = createSignal("");
		const [pinPromptMessage, setPinPromptMessage] = createSignal("");
		let pinPromiseResolve = null;
		const requestPin = (title, message) => {
			return new Promise((resolve) => {
				pinPromiseResolve = resolve;
				setPinPromptTitle(title);
				setPinPromptMessage(message);
				setPinPromptOpen(true);
			});
		};
		const handlePinConfirm = (pin, remember) => {
			setPinPromptOpen(false);
			pinPromiseResolve?.({
				pin,
				remember
			});
			pinPromiseResolve = null;
		};
		const handlePinCancel = () => {
			setPinPromptOpen(false);
			pinPromiseResolve?.({
				pin: null,
				remember: false
			});
			pinPromiseResolve = null;
		};
		const [advanceRotationsModalOpen, setAdvanceRotationsModalOpen] = createSignal(false);
		const [resetCaughtUpModalOpen, setResetCaughtUpModalOpen] = createSignal(false);
		const [personModalOpen, setPersonModalOpen] = createSignal(false);
		const [personalChoreModalOpen, setPersonalChoreModalOpen] = createSignal(false);
		const [rotatingChoreModalOpen, setRotatingChoreModalOpen] = createSignal(false);
		const [copyChoresModalOpen, setCopyChoresModalOpen] = createSignal(false);
		const [settingsModalOpen, setSettingsModalOpen] = createSignal(false);
		const [bulkEditChoreType, setBulkEditChoreType] = createSignal(null);
		const [editingPerson, setEditingPerson] = createSignal(null);
		const [editingChore, setEditingChore] = createSignal(null);
		const [editingChorePerson, setEditingChorePerson] = createSignal(null);
		const [copyChoresFromPerson, setCopyChoresFromPerson] = createSignal(null);
		const [historyPerson, setHistoryPerson] = createSignal(null);
		const closeAdvanceRotationsModal = async () => {
			setAdvanceRotationsModalOpen(false);
			await loadData();
		};
		const handleAdvanceRotations = () => {
			setAdvanceRotationsModalOpen(true);
		};
		const getOverdueChores = () => choreData().chores.filter((c) => !c.caughtUp);
		const handleResetCaughtUp = () => {
			setResetCaughtUpModalOpen(true);
		};
		const closeResetCaughtUpModal = async () => {
			setResetCaughtUpModalOpen(false);
			await loadData();
		};
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
		const closeSettingsModal = async () => {
			setSettingsModalOpen(false);
			await loadData();
		};
		const closeBulkEditModal = async () => {
			setBulkEditChoreType(null);
			await loadData();
		};
		const handleDownloadBackup = async () => {
			try {
				let pin = cachedPin();
				let rememberPin = false;
				if (pinRequired() && !pin) {
					const result = await requestPin("Download Backup", "Enter admin PIN to download backup");
					if (!result.pin) return;
					pin = result.pin;
					rememberPin = result.remember;
				}
				await triggerBackupDownload(pin || void 0);
				if (rememberPin) setCachedPin(pin);
			} catch (error) {
				console.error("Error downloading backup:", error);
				alert(`Failed to download backup: ${error instanceof Error ? error.message : "Please try again."}`);
			}
		};
		const handleRestore = async (e) => {
			const file = e.target.files?.[0];
			if (!file) return;
			let pin = cachedPin();
			let rememberPin = false;
			if (pinRequired() && !pin) {
				const result = await requestPin("Restore Backup", "Enter admin PIN to restore data");
				if (!result.pin) {
					e.target.value = "";
					return;
				}
				pin = result.pin;
				rememberPin = result.remember;
			}
			try {
				const text = await file.text();
				const data = JSON.parse(text);
				data.pin = pin || void 0;
				if (!(await fetch(`${API_BASE$1}/restore`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data)
				})).ok) throw new Error("Failed to restore data");
				if (rememberPin) setCachedPin(pin);
				alert("Data restored successfully!");
				await loadData();
			} catch (error) {
				console.error("Error restoring data:", error);
				alert("Failed to restore data. Please check the file format and try again.");
			}
			e.target.value = "";
		};
		const handleDeletePerson = async (personId) => {
			if (!confirm("Are you sure you want to delete this person? This will also remove all their assigned chores.")) return;
			let pin = cachedPin();
			let rememberPin = false;
			if (pinRequired() && !pin) {
				const result = await requestPin("Admin PIN Required", "Enter admin PIN to delete this person");
				if (!result.pin) return;
				pin = result.pin;
				rememberPin = result.remember;
			}
			try {
				await deletePerson(personId, pin || void 0);
				if (rememberPin) setCachedPin(pin);
				await loadData();
			} catch (error) {
				console.error("Error deleting person:", error);
				alert(`Failed to delete person: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		const handleDeleteChore = async (choreId) => {
			if (!confirm("Are you sure you want to delete this chore?")) return;
			let pin = cachedPin();
			let rememberPin = false;
			if (pinRequired() && !pin) {
				const result = await requestPin("Admin PIN Required", "Enter admin PIN to delete this chore");
				if (!result.pin) return;
				pin = result.pin;
				rememberPin = result.remember;
			}
			try {
				await deleteChore(choreId, pin || void 0);
				if (rememberPin) setCachedPin(pin);
				await loadData();
			} catch (error) {
				console.error("Error deleting chore:", error);
				alert(`Failed to delete chore: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		};
		const getRotatingChores = () => {
			return choreData().chores.filter((chore) => chore.type === ChoreType.ROTATING);
		};
		const [activeTab, setActiveTab] = createSignal("people");
		const tabs = [
			{
				id: "people",
				label: "People"
			},
			{
				id: "rotating",
				label: "Rotation Chores"
			},
			{
				id: "system",
				label: "System Actions"
			}
		];
		return [
			(() => {
				var _el$ = _tmpl$$1(), _el$3 = _el$.firstChild.nextSibling, _el$4 = _el$3.firstChild, _el$5 = _el$4.nextSibling;
				insert(_el$3, createComponent(Button, {
					type: "button",
					variant: "secondary",
					onClick: handleDownloadBackup,
					children: "Download Backup"
				}), _el$4);
				_el$5.$$input = handleRestore;
				insert(_el$3, createComponent(Button, {
					type: "button",
					variant: "secondary",
					onClick: () => setSettingsModalOpen(true),
					children: "⚙️ Settings"
				}), null);
				return _el$;
			})(),
			(() => {
				var _el$6 = _tmpl$2$1(), _el$8 = _el$6.firstChild.firstChild;
				insert(_el$8, createComponent(For, {
					each: tabs,
					children: (tab) => (() => {
						var _el$9 = _tmpl$3$1(), _el$0 = _el$9.firstChild;
						_el$0.$$click = () => setActiveTab(tab.id);
						insert(_el$0, () => tab.label);
						createRenderEffect((_p$) => {
							var _v$ = {
								"border-indigo-600 text-indigo-600": activeTab() === tab.id,
								"border-transparent text-slate-600": activeTab() !== tab.id
							}, _v$2 = activeTab() === tab.id ? "page" : void 0;
							_p$.e = classList(_el$0, _v$, _p$.e);
							_v$2 !== _p$.t && setAttribute(_el$0, "aria-current", _p$.t = _v$2);
							return _p$;
						}, {
							e: void 0,
							t: void 0
						});
						return _el$9;
					})()
				}));
				insert(_el$6, createComponent(Show, {
					get when() {
						return activeTab() === "people";
					},
					get children() {
						return createComponent(PeopleTab, {
							get people() {
								return choreData().people;
							},
							get chores() {
								return choreData().chores;
							},
							onAddPerson: openPersonModal,
							onEditPerson: openPersonModal,
							onHistory: setHistoryPerson,
							onDeletePerson: handleDeletePerson,
							onAddChore: openPersonalChoreModal,
							onEditChore: openPersonalChoreModal,
							onDeleteChore: handleDeleteChore,
							onCopyChores: openCopyChoresModal,
							onBulkEdit: () => setBulkEditChoreType(ChoreType.PERSONAL)
						});
					}
				}), null);
				insert(_el$6, createComponent(Show, {
					get when() {
						return activeTab() === "rotating";
					},
					get children() {
						return createComponent(RotatingChoresTab, {
							get people() {
								return choreData().people;
							},
							get chores() {
								return choreData().chores;
							},
							onAddRotatingChore: openRotatingChoreModal,
							onEditRotatingChore: openRotatingChoreModal,
							onDeleteChore: handleDeleteChore,
							onBulkEdit: () => setBulkEditChoreType(ChoreType.ROTATING)
						});
					}
				}), null);
				insert(_el$6, createComponent(Show, {
					get when() {
						return activeTab() === "system";
					},
					get children() {
						return createComponent(SystemActionsTab, {
							onAdvanceRotations: handleAdvanceRotations,
							onResetCaughtUp: handleResetCaughtUp
						});
					}
				}), null);
				return _el$6;
			})(),
			createComponent(Show, {
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
			}),
			createComponent(Show, {
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
			}),
			createComponent(Show, {
				get when() {
					return rotatingChoreModalOpen();
				},
				get children() {
					return createComponent(RotatingChoreModal, {
						get initialChore() {
							return editingChore();
						},
						closeModal: closeRotatingChoreModal
					});
				}
			}),
			createComponent(Show, {
				get when() {
					return memo(() => !!copyChoresModalOpen())() && copyChoresFromPerson();
				},
				get children() {
					return createComponent(CopyChoresModal, {
						get fromPerson() {
							return copyChoresFromPerson();
						},
						closeModal: closeCopyChoresModal
					});
				}
			}),
			createComponent(Show, {
				get when() {
					return historyPerson();
				},
				get children() {
					return createComponent(ChoreHistoryModal, {
						get person() {
							return historyPerson();
						},
						closeModal: () => setHistoryPerson(null)
					});
				}
			}),
			createComponent(Show, {
				get when() {
					return settingsModalOpen();
				},
				get children() {
					return createComponent(SettingsModal, { closeModal: closeSettingsModal });
				}
			}),
			createComponent(Show, {
				get when() {
					return bulkEditChoreType();
				},
				children: (choreType) => createComponent(BulkEditModal, {
					get choreType() {
						return choreType();
					},
					closeModal: closeBulkEditModal
				})
			}),
			createComponent(Show, {
				get when() {
					return advanceRotationsModalOpen();
				},
				get children() {
					return createComponent(AdvanceRotationsModal, {
						get rotatingChores() {
							return getRotatingChores();
						},
						closeModal: closeAdvanceRotationsModal
					});
				}
			}),
			createComponent(Show, {
				get when() {
					return resetCaughtUpModalOpen();
				},
				get children() {
					return createComponent(ResetCaughtUpModal, {
						get overdue() {
							return getOverdueChores();
						},
						closeModal: closeResetCaughtUpModal
					});
				}
			}),
			createComponent(Show, {
				get when() {
					return pinPromptOpen();
				},
				get children() {
					return createComponent(PinPromptModal, {
						get title() {
							return pinPromptTitle();
						},
						get message() {
							return pinPromptMessage();
						},
						onConfirm: handlePinConfirm,
						onCancel: handlePinCancel
					});
				}
			})
		];
	};
	delegateEvents(["input", "click"]);
	//#endregion
	//#region src/admin/admin.tsx
	var _tmpl$ = /*#__PURE__*/ template(`<header class="flex flex-wrap items-center justify-between gap-4 bg-slate-100 p-8 text-slate-900"><h1 class="text-3xl font-semibold">Family Chores Admin`);
	var _tmpl$2 = /*#__PURE__*/ template(`<p class="text-sm font-medium text-slate-600 italic">Retrying... (attempt <!>)`);
	var _tmpl$3 = /*#__PURE__*/ template(`<div class="animate-loading-pulse bg-[radial-gradient(circle,#2563eb,#ffffff)] bg-size-[200%_200%] bg-center px-8 py-16 text-center text-slate-500"><div class="inline-block rounded-xl bg-white/30 p-8 shadow-md"><p class="mb-2.5 text-xl font-semibold text-slate-900">MagicMirror² is starting up, please wait...`);
	var _tmpl$4 = /*#__PURE__*/ template(`<div class="mx-auto max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl"data-testid=admin-container>`);
	var API_BASE = "/MMM-FamilyChores";
	var Admin = () => {
		const [choreData, setChoreData] = createStore({ data: null });
		const [loading, setLoading] = createSignal(true);
		const [retryCount, setRetryCount] = createSignal(0);
		const [cachedPin, setCachedPin] = createSignal("");
		let pinTimeout = null;
		const pinRequired = () => !!choreData.data?.settings?.adminPin;
		const resolvedTimeFormat = () => {
			const setting = choreData.data?.settings?.timeFormat ?? TimeFormat.SYSTEM;
			if (setting === TimeFormat.SYSTEM) return formatTime("00:00", TimeFormat.SYSTEM) === "00:00" ? TimeFormat.HOUR_24 : TimeFormat.HOUR_12;
			return setting === TimeFormat.HOUR_12 ? TimeFormat.HOUR_12 : TimeFormat.HOUR_24;
		};
		const setCachedPinWithTimeout = (pin) => {
			setCachedPin(pin);
			if (pinTimeout) clearTimeout(pinTimeout);
			pinTimeout = setTimeout(() => {
				setCachedPin("");
				pinTimeout = null;
			}, 6e5);
		};
		const loadData = async () => {
			try {
				const response = await fetch(`${API_BASE}/data`);
				if (!response.ok) throw new Error("Failed to load data");
				const data = await response.json();
				setChoreData("data", reconcile(data));
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
		const contextValue = {
			choreData: () => {
				if (!choreData.data) throw new Error("choreData is null when creating context");
				return choreData.data;
			},
			loadData,
			pinRequired,
			setCachedPin: setCachedPinWithTimeout,
			cachedPin,
			resolvedTimeFormat
		};
		return (() => {
			var _el$ = _tmpl$4();
			insert(_el$, createComponent(Show, {
				get when() {
					return loading();
				},
				get children() {
					return [_tmpl$(), (() => {
						var _el$3 = _tmpl$3(), _el$4 = _el$3.firstChild;
						_el$4.firstChild;
						insert(_el$4, createComponent(Show, {
							get when() {
								return retryCount() > 0;
							},
							get children() {
								var _el$6 = _tmpl$2(), _el$9 = _el$6.firstChild.nextSibling;
								_el$9.nextSibling;
								insert(_el$6, retryCount, _el$9);
								return _el$6;
							}
						}), null);
						return _el$3;
					})()];
				}
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return choreData.data;
				},
				get children() {
					return createComponent(AdminContext.Provider, {
						value: contextValue,
						get children() {
							return createComponent(MainPage, {});
						}
					});
				}
			}), null);
			return _el$;
		})();
	};
	//#endregion
	//#region src/admin/app.tsx
	var appElement = document.getElementById("app");
	if (appElement) render(() => createComponent(Admin, {}), appElement);
	else console.error("Failed to find #app element");
	//#endregion
})();
