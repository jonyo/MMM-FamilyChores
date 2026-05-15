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
	//#region src/api/client.ts
	var API_BASE_URL = "/MMM-FamilyChores";
	var handleResponse = async (response) => {
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			if (errorData?.error) throw new Error(errorData.error);
			throw new Error("Request failed");
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
		return handleResponse(await fetch(`${API_BASE_URL}/chores/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		}));
	};
	var deleteChore = async (id) => {
		await handleResponse(await fetch(`${API_BASE_URL}/chores/${id}`, { method: "DELETE" }));
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
		return handleResponse(await fetch(`${API_BASE_URL}/people/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data)
		}));
	};
	var deletePerson = async (id) => {
		await handleResponse(await fetch(`${API_BASE_URL}/people/${id}`, { method: "DELETE" }));
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
	* @param date - Optional date to convert (defaults to current time)
	*/
	var getLocalDateString = (date = /* @__PURE__ */ new Date()) => {
		return new Intl.DateTimeFormat("en-CA", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit"
		}).format(date);
	};
	//#endregion
	//#region src/admin/person-modal.tsx
	var _tmpl$$3 = /* @__PURE__ */ template(`<div class="modal active"><div class=modal-content><h3></h3><form><div class=form-group><label for=personName>Name</label><input type=text id=personName required></div><div class=form-group><label for=personColor>Color</label><div class=color-input-group><input type=color id=personColor required><button type=button class="btn btn-secondary btn-sm">Randomize</button></div></div><div class=form-actions><button type=button class="btn btn-secondary">Cancel</button><button type=submit class="btn btn-primary">`);
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
			var _el$ = _tmpl$$3(), _el$3 = _el$.firstChild.firstChild, _el$4 = _el$3.nextSibling, _el$5 = _el$4.firstChild, _el$7 = _el$5.firstChild.nextSibling, _el$8 = _el$5.nextSibling, _el$1 = _el$8.firstChild.nextSibling.firstChild, _el$10 = _el$1.nextSibling, _el$12 = _el$8.nextSibling.firstChild, _el$13 = _el$12.nextSibling;
			insert(_el$3, () => props.initialPerson ? "Edit Person" : "Add Person");
			_el$4.addEventListener("submit", handleSubmit);
			_el$7.$$input = (e) => setName(e.currentTarget.value);
			_el$1.$$input = (e) => setColor(e.currentTarget.value);
			_el$10.$$click = () => setColor(generatePastelColor());
			_el$12.$$click = () => props.closeModal();
			insert(_el$13, () => props.initialPerson ? "Save" : "Add");
			createRenderEffect(() => _el$7.value = name());
			createRenderEffect(() => _el$1.value = color());
			return _el$;
		})();
	};
	delegateEvents(["input", "click"]);
	//#endregion
	//#region src/admin/personal-chore-modal.tsx
	var _tmpl$$2 = /* @__PURE__ */ template(`<div class="modal active"><div class=modal-content><h3>Error</h3><p>Person not found. Please refresh the page.</p><button type=button class="btn btn-secondary">Close`), _tmpl$2$2 = /* @__PURE__ */ template(`<div class="modal active"><div class=modal-content><h3></h3><div class=assigned-person-display><span class=color-badge></span><strong>Assigned to:</strong> </div><form><div class=form-group><label for=choreName>Chore Name</label><input type=text id=choreName required></div><div class=form-group><label for=deadline>Deadline (optional)</label><input type=time id=deadline></div><div class=form-group><div class=form-label>Skip Days</div><div class=checkbox-list></div></div><div class=form-group><label for=skipDayVisibility>Skip Day Visibility</label><select id=skipDayVisibility><option>Hide</option><option>Show Always</option><option>Show If Overdue</option></select></div><div class=form-actions><button type=button class="btn btn-secondary">Cancel</button><button type=submit class="btn btn-primary">`), _tmpl$3$2 = /* @__PURE__ */ template(`<label><input type=checkbox>`);
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
			try {
				if (props.initialChore?.id) {
					const body = {
						name: name(),
						type: ChoreType.PERSONAL,
						assignedTo: props.person?.id ?? "",
						deadline: deadline() || void 0,
						skipDays: skipDays(),
						skipDayVisibility: skipDayVisibility()
					};
					await updateChore(props.initialChore.id, body);
				} else await createChore({
					name: name(),
					type: ChoreType.PERSONAL,
					assignedTo: props.person?.id ?? "",
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
					var _el$ = _tmpl$$2(), _el$5 = _el$.firstChild.firstChild.nextSibling.nextSibling;
					_el$5.$$click = () => props.closeModal();
					return _el$;
				})();
			},
			children: (person) => (() => {
				var _el$6 = _tmpl$2$2(), _el$8 = _el$6.firstChild.firstChild, _el$9 = _el$8.nextSibling, _el$0 = _el$9.firstChild;
				_el$0.nextSibling.nextSibling;
				var _el$11 = _el$9.nextSibling, _el$12 = _el$11.firstChild, _el$14 = _el$12.firstChild.nextSibling, _el$15 = _el$12.nextSibling, _el$17 = _el$15.firstChild.nextSibling, _el$18 = _el$15.nextSibling, _el$20 = _el$18.firstChild.nextSibling, _el$21 = _el$18.nextSibling, _el$23 = _el$21.firstChild.nextSibling, _el$24 = _el$23.firstChild, _el$25 = _el$24.nextSibling, _el$26 = _el$25.nextSibling, _el$28 = _el$21.nextSibling.firstChild, _el$29 = _el$28.nextSibling;
				insert(_el$8, () => props.initialChore ? "Edit Personal Chore" : "Add Personal Chore");
				insert(_el$9, () => person.name, null);
				_el$11.addEventListener("submit", handleSubmit);
				_el$14.$$input = (e) => setName(e.currentTarget.value);
				_el$17.$$input = (e) => setDeadline(e.currentTarget.value);
				insert(_el$20, createComponent(For, {
					get each() {
						return Object.values(DayOfWeek);
					},
					children: (day) => (() => {
						var _el$30 = _tmpl$3$2(), _el$31 = _el$30.firstChild;
						_el$31.$$input = (e) => handleSkipDayChange(day, e.currentTarget.checked);
						_el$31.value = day;
						insert(_el$30, () => day.charAt(0).toUpperCase() + day.slice(1), null);
						createRenderEffect(() => _el$31.checked = skipDays().includes(day));
						return _el$30;
					})()
				}));
				_el$23.$$input = (e) => setSkipDayVisibility(e.currentTarget.value);
				_el$28.$$click = () => props.closeModal();
				insert(_el$29, () => props.initialChore ? "Save" : "Add");
				createRenderEffect((_$p) => style(_el$0, `background-color: ${person.color}`, _$p));
				createRenderEffect(() => _el$14.value = name());
				createRenderEffect(() => _el$17.value = deadline());
				createRenderEffect(() => _el$24.value = SkipDayVisibility.HIDE);
				createRenderEffect(() => _el$25.value = SkipDayVisibility.SHOW_ALWAYS);
				createRenderEffect(() => _el$26.value = SkipDayVisibility.SHOW_IF_OVERDUE);
				createRenderEffect(() => _el$23.value = skipDayVisibility());
				return _el$6;
			})()
		});
	};
	delegateEvents(["click", "input"]);
	//#endregion
	//#region src/admin/rotating-chore-modal.tsx
	var _tmpl$$1 = /* @__PURE__ */ template(`<div class="modal active"><div class=modal-content><h3></h3><form><div class=form-group><label for=choreName>Chore Name</label><input type=text id=choreName required></div><div class=form-group><div class=form-label>Rotation (select people)</div><div class=checkbox-list></div></div><div class=form-group><label for=rotatingIndex>Starting Index (current person)</label><select id=rotatingIndex></select></div><div class=form-group><label for=deadline>Deadline (optional)</label><input type=time id=deadline></div><div class=form-group><div class=form-label>Skip Days</div><div class=checkbox-list></div></div><div class=form-group><label for=skipDayVisibility>Skip Day Visibility</label><select id=skipDayVisibility><option>Hide</option><option>Show Always</option><option>Show If Overdue</option></select></div><div class=form-actions><button type=button class="btn btn-secondary">Cancel</button><button type=submit class="btn btn-primary">`), _tmpl$2$1 = /* @__PURE__ */ template(`<label><input type=checkbox>`), _tmpl$3$1 = /* @__PURE__ */ template(`<option>`);
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
			var _el$ = _tmpl$$1(), _el$3 = _el$.firstChild.firstChild, _el$4 = _el$3.nextSibling, _el$5 = _el$4.firstChild, _el$7 = _el$5.firstChild.nextSibling, _el$8 = _el$5.nextSibling, _el$0 = _el$8.firstChild.nextSibling, _el$1 = _el$8.nextSibling, _el$11 = _el$1.firstChild.nextSibling, _el$12 = _el$1.nextSibling, _el$14 = _el$12.firstChild.nextSibling, _el$15 = _el$12.nextSibling, _el$17 = _el$15.firstChild.nextSibling, _el$18 = _el$15.nextSibling, _el$20 = _el$18.firstChild.nextSibling, _el$21 = _el$20.firstChild, _el$22 = _el$21.nextSibling, _el$23 = _el$22.nextSibling, _el$25 = _el$18.nextSibling.firstChild, _el$26 = _el$25.nextSibling;
			insert(_el$3, () => props.initialChore ? "Edit Rotating Chore" : "Add Rotating Chore");
			_el$4.addEventListener("submit", handleSubmit);
			_el$7.$$input = (e) => setName(e.currentTarget.value);
			insert(_el$0, createComponent(For, {
				get each() {
					return props.choreData.people;
				},
				children: (person) => (() => {
					var _el$27 = _tmpl$2$1(), _el$28 = _el$27.firstChild;
					_el$28.$$input = (e) => handleRotationChange(person.id, e.currentTarget.checked);
					insert(_el$27, () => person.name, null);
					createRenderEffect(() => _el$28.checked = rotation().includes(person.id));
					return _el$27;
				})()
			}));
			_el$11.$$input = (_e) => {};
			insert(_el$11, () => rotation().map((personId, index) => {
				const person = props.choreData.people.find((p) => p.id === personId);
				return (() => {
					var _el$29 = _tmpl$3$1();
					_el$29.value = index;
					insert(_el$29, () => person ? person.name : "Unknown");
					return _el$29;
				})();
			}));
			_el$14.$$input = (e) => setDeadline(e.currentTarget.value);
			insert(_el$17, createComponent(For, {
				get each() {
					return Object.values(DayOfWeek);
				},
				children: (day) => (() => {
					var _el$30 = _tmpl$2$1(), _el$31 = _el$30.firstChild;
					_el$31.$$input = (e) => handleSkipDayChange(day, e.currentTarget.checked);
					_el$31.value = day;
					insert(_el$30, () => day.charAt(0).toUpperCase() + day.slice(1), null);
					createRenderEffect(() => _el$31.checked = skipDays().includes(day));
					return _el$30;
				})()
			}));
			_el$20.$$input = (e) => setSkipDayVisibility(e.currentTarget.value);
			_el$25.$$click = () => props.closeModal();
			insert(_el$26, () => props.initialChore ? "Save" : "Add");
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
	delegateEvents(["input", "click"]);
	//#endregion
	//#region src/admin/admin.tsx
	var _tmpl$ = /* @__PURE__ */ template(`<p class=retry-info>Retrying... (attempt <!>)`), _tmpl$2 = /* @__PURE__ */ template(`<div class=loading-message><div class=loading-message-content><p>Magic Mirror is starting up, please wait...`), _tmpl$3 = /* @__PURE__ */ template(`<span id=addPersonInfo class=info-icon data-tooltip="Add at least one person before you can create chores">ℹ️`), _tmpl$4 = /* @__PURE__ */ template(`<section class=section id=rotatingChoresSection><div class=section-header><h2>Rotating Chores</h2><button type=button class="btn btn-primary"id=addRotatingChoreBtn>Add Rotating Chore</button></div><div id=rotatingChoresList class=item-list>`), _tmpl$5 = /* @__PURE__ */ template(`<main><section class=section><div class=section-header><h2>People</h2><div class=button-with-tooltip><button type=button class="btn btn-primary"id=addPersonBtn>Add Person</button></div></div><div id=peopleList class=item-list></div></section><section class=section><h2>System State</h2><div class=state-info><p><strong>Last Reset Date:</strong> <span id=lastResetDate></span></p><div class=button-with-tooltip><button type=button class="btn btn-warning"id=resetDailyBtn>Force Daily Reset</button><span class=info-icon data-tooltip="WARNING: This will un-check all chores and rotate assignment on rotating chores to the next person. It does respect skip days if today is a skip day. Useful for testing or immediately advancing chore assignments.">ℹ️`), _tmpl$6 = /* @__PURE__ */ template(`<div class=container><header><h1>Family Chores Admin</h1><div class=backup-section><button type=button class="btn btn-secondary"id=backupBtn>Download Backup</button><label for=restoreFile class="btn btn-secondary">Restore Backup</label><input type=file id=restoreFile accept=.json hidden>`), _tmpl$7 = /* @__PURE__ */ template(`<div class=person-chores>`), _tmpl$8 = /* @__PURE__ */ template(`<div class=item-card><div class=person-header><div class=item-info><h3> <span class=color-badge></span></h3><p>ID: </p></div><div class=item-actions><button type=button class="btn btn-secondary btn-sm">Edit</button><button type=button class="btn btn-danger btn-sm">Delete</button></div></div><div class=person-chores-header><h4>'s Personal Chores</h4><div class=person-chores-actions><button type=button class="btn btn-primary btn-sm">Add Chore`), _tmpl$9 = /* @__PURE__ */ template(`<div class=person-chores><p class=empty-message>No personal chores yet.`), _tmpl$0 = /* @__PURE__ */ template(`<div class=chore-item><div class=chore-info><h4></h4><p class=skip-days>Skip days: </p></div><div class=chore-actions><button type=button class="btn btn-secondary btn-sm">Edit</button><button type=button class="btn btn-danger btn-sm">Delete`), _tmpl$1 = /* @__PURE__ */ template(`<p class=deadline>Deadline: `), _tmpl$10 = /* @__PURE__ */ template(`<div class=item-card><div class=item-info><h3> <span class="chore-type-badge rotating">Rotating</span></h3><p>Current: </p><p>Rotation: </p><p class=skip-days>Skip days: </p></div><div class=item-actions><button type=button class="btn btn-secondary">Edit</button><button type=button class="btn btn-danger btn-sm">Delete`);
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
		const [editingPerson, setEditingPerson] = createSignal(null);
		const [editingChore, setEditingChore] = createSignal(null);
		const [editingChorePerson, setEditingChorePerson] = createSignal(null);
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
			var _el$ = _tmpl$6(), _el$5 = _el$.firstChild.firstChild.nextSibling.firstChild, _el$7 = _el$5.nextSibling.nextSibling;
			_el$5.$$click = handleDownloadBackup;
			_el$7.$$input = handleRestore;
			insert(_el$, createComponent(Show, {
				get when() {
					return loading();
				},
				get children() {
					var _el$8 = _tmpl$2(), _el$9 = _el$8.firstChild;
					_el$9.firstChild;
					insert(_el$9, createComponent(Show, {
						get when() {
							return retryCount() > 0;
						},
						get children() {
							var _el$1 = _tmpl$(), _el$12 = _el$1.firstChild.nextSibling;
							_el$12.nextSibling;
							insert(_el$1, retryCount, _el$12);
							return _el$1;
						}
					}), null);
					return _el$8;
				}
			}), null);
			insert(_el$, createComponent(Show, {
				get when() {
					return choreData();
				},
				get children() {
					var _el$13 = _tmpl$5(), _el$14 = _el$13.firstChild, _el$15 = _el$14.firstChild, _el$17 = _el$15.firstChild.nextSibling, _el$18 = _el$17.firstChild, _el$20 = _el$15.nextSibling, _el$26 = _el$14.nextSibling, _el$29 = _el$26.firstChild.nextSibling.firstChild, _el$32 = _el$29.firstChild.nextSibling.nextSibling, _el$34 = _el$29.nextSibling.firstChild;
					_el$18.$$click = () => openPersonModal();
					insert(_el$17, createComponent(Show, {
						get when() {
							return choreData()?.people.length === 0;
						},
						get children() {
							return _tmpl$3();
						}
					}), null);
					insert(_el$20, createComponent(For, {
						get each() {
							return choreData()?.people ?? [];
						},
						children: (person) => (() => {
							var _el$35 = _tmpl$8(), _el$36 = _el$35.firstChild, _el$37 = _el$36.firstChild, _el$38 = _el$37.firstChild, _el$39 = _el$38.firstChild, _el$40 = _el$39.nextSibling, _el$41 = _el$38.nextSibling;
							_el$41.firstChild;
							var _el$44 = _el$37.nextSibling.firstChild, _el$45 = _el$44.nextSibling, _el$47 = _el$36.nextSibling.firstChild, _el$48 = _el$47.firstChild, _el$50 = _el$47.nextSibling.firstChild;
							insert(_el$38, () => escapeHtml(person.name), _el$39);
							insert(_el$41, () => person.id, null);
							_el$44.$$click = () => openPersonModal(person);
							_el$45.$$click = () => handleDeletePerson(person.id);
							insert(_el$47, () => escapeHtml(person.name), _el$48);
							_el$50.$$click = () => {
								openPersonalChoreModal(person, null);
							};
							insert(_el$35, createComponent(Show, {
								get when() {
									return getPersonalChores(person.id).length > 0;
								},
								get fallback() {
									return _tmpl$9();
								},
								get children() {
									var _el$51 = _tmpl$7();
									insert(_el$51, createComponent(For, {
										get each() {
											return getPersonalChores(person.id);
										},
										children: (chore) => (() => {
											var _el$53 = _tmpl$0(), _el$54 = _el$53.firstChild, _el$55 = _el$54.firstChild, _el$56 = _el$55.nextSibling;
											_el$56.firstChild;
											var _el$59 = _el$54.nextSibling.firstChild, _el$60 = _el$59.nextSibling;
											insert(_el$55, () => escapeHtml(chore.name));
											insert(_el$54, (() => {
												var _c$ = memo(() => !!chore.deadline);
												return () => _c$() && (() => {
													var _el$61 = _tmpl$1();
													_el$61.firstChild;
													insert(_el$61, () => chore.deadline, null);
													return _el$61;
												})();
											})(), _el$56);
											insert(_el$56, () => formatSkipDays(chore.skipDays), null);
											_el$59.$$click = () => {
												openPersonalChoreModal(person, chore);
											};
											_el$60.$$click = () => handleDeleteChore(chore.id);
											return _el$53;
										})()
									}));
									return _el$51;
								}
							}), null);
							createRenderEffect((_$p) => style(_el$40, `background-color: ${person.color}`, _$p));
							return _el$35;
						})()
					}));
					insert(_el$13, createComponent(Show, {
						get when() {
							return (choreData()?.people?.length ?? 0) > 0;
						},
						get children() {
							var _el$21 = _tmpl$4(), _el$22 = _el$21.firstChild, _el$24 = _el$22.firstChild.nextSibling, _el$25 = _el$22.nextSibling;
							_el$24.$$click = () => openRotatingChoreModal();
							insert(_el$25, createComponent(For, {
								get each() {
									return getRotatingChores();
								},
								children: (chore) => {
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
										var _el$63 = _tmpl$10(), _el$64 = _el$63.firstChild, _el$65 = _el$64.firstChild, _el$66 = _el$65.firstChild, _el$67 = _el$65.nextSibling;
										_el$67.firstChild;
										var _el$69 = _el$67.nextSibling;
										_el$69.firstChild;
										var _el$71 = _el$69.nextSibling;
										_el$71.firstChild;
										var _el$74 = _el$64.nextSibling.firstChild, _el$75 = _el$74.nextSibling;
										insert(_el$65, () => escapeHtml(chore.name), _el$66);
										insert(_el$67, currentAssignee, null);
										insert(_el$69, rotationText, null);
										insert(_el$64, (() => {
											var _c$2 = memo(() => !!chore.deadline);
											return () => _c$2() && (() => {
												var _el$76 = _tmpl$1();
												_el$76.firstChild;
												insert(_el$76, () => chore.deadline, null);
												return _el$76;
											})();
										})(), _el$71);
										insert(_el$71, () => formatSkipDays(chore.skipDays), null);
										_el$74.$$click = () => openRotatingChoreModal(chore);
										_el$75.$$click = () => handleDeleteChore(chore.id);
										return _el$63;
									})();
								}
							}));
							return _el$21;
						}
					}), _el$26);
					insert(_el$32, () => choreData()?.lastResetDate || "Never");
					_el$34.$$click = handleForceReset;
					return _el$13;
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
								chores: []
							};
						},
						closeModal: closeRotatingChoreModal
					});
				}
			}), null);
			return _el$;
		})();
	};
	delegateEvents(["click", "input"]);
	//#endregion
	//#region src/admin/app.tsx
	var appElement = document.getElementById("app");
	if (appElement) render(() => createComponent(Admin, {}), appElement);
	else console.error("Failed to find #app element");
	//#endregion
})();

//# sourceMappingURL=admin.js.map