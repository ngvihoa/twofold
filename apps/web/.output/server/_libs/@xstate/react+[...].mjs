import { t as __commonJSMin } from "../../_runtime.mjs";
import { g as require_react, m as require_shim, p as require_with_selector } from "../@tanstack/react-router+[...].mjs";
//#region ../../node_modules/.pnpm/use-isomorphic-layout-effect@1.2.1_@types+react@19.2.18_react@19.2.8/node_modules/use-isomorphic-layout-effect/dist/use-isomorphic-layout-effect.cjs.js
var require_use_isomorphic_layout_effect_cjs = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var react = require_react();
	exports["default"] = typeof document !== "undefined" ? react.useLayoutEffect : function noop() {};
}));
//#endregion
//#region ../../node_modules/.pnpm/xstate@5.32.6/node_modules/xstate/dist/xstate-dev.cjs.js
var require_xstate_dev_cjs = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	function getGlobal() {
		if (typeof globalThis !== "undefined") return globalThis;
		if (typeof self !== "undefined") return self;
		if (typeof window !== "undefined") return window;
		if (typeof global !== "undefined") return global;
	}
	function getDevTools() {
		const w = getGlobal();
		if (w.__xstate__) return w.__xstate__;
	}
	function registerService(service) {
		if (typeof window === "undefined") return;
		const devTools = getDevTools();
		if (devTools) devTools.register(service);
	}
	var devToolsAdapter = (service) => {
		if (typeof window === "undefined") return;
		const devTools = getDevTools();
		if (devTools) devTools.register(service);
	};
	exports.devToolsAdapter = devToolsAdapter;
	exports.getGlobal = getGlobal;
	exports.registerService = registerService;
}));
//#endregion
//#region ../../node_modules/.pnpm/xstate@5.32.6/node_modules/xstate/dist/raise-a26997bd.cjs.js
var require_raise_a26997bd_cjs = /* @__PURE__ */ __commonJSMin(((exports) => {
	var dist_xstateDev = require_xstate_dev_cjs();
	var Mailbox = class {
		constructor(_process) {
			this._process = _process;
			this._active = false;
			this._current = null;
			this._last = null;
		}
		start() {
			this._active = true;
			this.flush();
		}
		clear() {
			if (this._current) {
				this._current.next = null;
				this._last = this._current;
			}
		}
		enqueue(event) {
			const enqueued = {
				value: event,
				next: null
			};
			if (this._current) {
				this._last.next = enqueued;
				this._last = enqueued;
				return;
			}
			this._current = enqueued;
			this._last = enqueued;
			if (this._active) this.flush();
		}
		flush() {
			while (this._current) {
				const consumed = this._current;
				this._process(consumed.value);
				this._current = consumed.next;
			}
			this._last = null;
		}
	};
	var STATE_DELIMITER = ".";
	var TARGETLESS_KEY = "";
	var NULL_EVENT = "";
	var STATE_IDENTIFIER = "#";
	var WILDCARD = "*";
	var XSTATE_INIT = "xstate.init";
	var XSTATE_ERROR = "xstate.error";
	var XSTATE_STOP = "xstate.stop";
	/**
	* Returns an event that represents an implicit event that is sent after the
	* specified `delay`.
	*
	* @param delayRef The delay in milliseconds
	* @param id The state node ID where this event is handled
	*/
	function createAfterEvent(delayRef, id) {
		return { type: `xstate.after.${delayRef}.${id}` };
	}
	/**
	* Returns an event that represents that a final state node has been reached in
	* the parent state node.
	*
	* @param id The final state node's parent state node `id`
	* @param output The data to pass into the event
	*/
	function createDoneStateEvent(id, output) {
		return {
			type: `xstate.done.state.${id}`,
			output
		};
	}
	/**
	* Returns an event that represents that an invoked service has terminated.
	*
	* An invoked service is terminated when it has reached a top-level final state
	* node, but not when it is canceled.
	*
	* @param invokeId The invoked service ID
	* @param output The data to pass into the event
	*/
	function createDoneActorEvent(invokeId, output) {
		return {
			type: `xstate.done.actor.${invokeId}`,
			output,
			actorId: invokeId
		};
	}
	function createErrorActorEvent(id, error) {
		return {
			type: `xstate.error.actor.${id}`,
			error,
			actorId: id
		};
	}
	function createInitEvent(input) {
		return {
			type: XSTATE_INIT,
			input
		};
	}
	/**
	* This function makes sure that unhandled errors are thrown in a separate
	* macrotask. It allows those errors to be detected by global error handlers and
	* reported to bug tracking services without interrupting our own stack of
	* execution.
	*
	* @param err Error to be thrown
	*/
	function reportUnhandledError(err) {
		setTimeout(() => {
			throw err;
		});
	}
	var symbolObservable = (() => typeof Symbol === "function" && Symbol.observable || "@@observable")();
	function matchesState(parentStateId, childStateId) {
		const parentStateValue = toStateValue(parentStateId);
		const childStateValue = toStateValue(childStateId);
		if (typeof childStateValue === "string") {
			if (typeof parentStateValue === "string") return childStateValue === parentStateValue;
			return false;
		}
		if (typeof parentStateValue === "string") return parentStateValue in childStateValue;
		return Object.keys(parentStateValue).every((key) => {
			if (!(key in childStateValue)) return false;
			return matchesState(parentStateValue[key], childStateValue[key]);
		});
	}
	function toStatePath(stateId) {
		if (isArray(stateId)) return stateId;
		const result = [];
		let segment = "";
		for (let i = 0; i < stateId.length; i++) {
			switch (stateId.charCodeAt(i)) {
				case 92:
					segment += stateId[i + 1];
					i++;
					continue;
				case 46:
					result.push(segment);
					segment = "";
					continue;
			}
			segment += stateId[i];
		}
		result.push(segment);
		return result;
	}
	function toStateValue(stateValue) {
		if (isMachineSnapshot(stateValue)) return stateValue.value;
		if (typeof stateValue !== "string") return stateValue;
		return pathToStateValue(toStatePath(stateValue));
	}
	function pathToStateValue(statePath) {
		if (statePath.length === 1) return statePath[0];
		const value = {};
		let marker = value;
		for (let i = 0; i < statePath.length - 1; i++) if (i === statePath.length - 2) marker[statePath[i]] = statePath[i + 1];
		else {
			const previous = marker;
			marker = {};
			previous[statePath[i]] = marker;
		}
		return value;
	}
	function mapValues(collection, iteratee) {
		const result = {};
		const collectionKeys = Object.keys(collection);
		for (let i = 0; i < collectionKeys.length; i++) {
			const key = collectionKeys[i];
			result[key] = iteratee(collection[key], key, collection, i);
		}
		return result;
	}
	function toArrayStrict(value) {
		if (isArray(value)) return value;
		return [value];
	}
	function toArray(value) {
		if (value === void 0) return [];
		return toArrayStrict(value);
	}
	function resolveOutput(mapper, context, event, self) {
		if (typeof mapper === "function") return mapper({
			context,
			event,
			self
		});
		return mapper;
	}
	function isArray(value) {
		return Array.isArray(value);
	}
	function isErrorActorEvent(event) {
		return event.type.startsWith("xstate.error.actor");
	}
	function toTransitionConfigArray(configLike) {
		return toArrayStrict(configLike).map((transitionLike) => {
			if (typeof transitionLike === "undefined" || typeof transitionLike === "string") return { target: transitionLike };
			return transitionLike;
		});
	}
	function normalizeTarget(target) {
		if (target === void 0 || target === TARGETLESS_KEY) return;
		return toArray(target);
	}
	function toObserver(nextHandler, errorHandler, completionHandler) {
		const isObserver = typeof nextHandler === "object";
		const self = isObserver ? nextHandler : void 0;
		return {
			next: (isObserver ? nextHandler.next : nextHandler)?.bind(self),
			error: (isObserver ? nextHandler.error : errorHandler)?.bind(self),
			complete: (isObserver ? nextHandler.complete : completionHandler)?.bind(self)
		};
	}
	function createInvokeId(stateNodeId, index) {
		return `${index}.${stateNodeId}`;
	}
	function resolveReferencedActor(machine, src) {
		const match = src.match(/^xstate\.invoke\.(\d+)\.(.*)/);
		if (!match) return machine.implementations.actors[src];
		const [, indexStr, nodeId] = match;
		const invokeConfig = machine.getStateNodeById(nodeId).config.invoke;
		return (Array.isArray(invokeConfig) ? invokeConfig[indexStr] : invokeConfig).src;
	}
	function getAllOwnEventDescriptors(snapshot) {
		return [.../* @__PURE__ */ new Set([...snapshot._nodes.flatMap((sn) => sn.ownEvents)])];
	}
	/**
	* Checks if an event type matches an event descriptor, supporting wildcards.
	* Event descriptors can be:
	*
	* - Exact matches: "event.type"
	* - Wildcard: "*"
	* - Partial matches: "event.*"
	*
	* @param eventType - The actual event type string
	* @param descriptor - The event descriptor to match against
	* @returns True if the event type matches the descriptor
	*/
	function matchesEventDescriptor(eventType, descriptor) {
		if (descriptor === eventType) return true;
		if (descriptor === WILDCARD) return true;
		if (!descriptor.endsWith(".*")) return false;
		const partialEventTokens = descriptor.split(".");
		const eventTokens = eventType.split(".");
		for (let tokenIndex = 0; tokenIndex < partialEventTokens.length; tokenIndex++) {
			const partialEventToken = partialEventTokens[tokenIndex];
			const eventToken = eventTokens[tokenIndex];
			if (partialEventToken === "*") return tokenIndex === partialEventTokens.length - 1;
			if (partialEventToken !== eventToken) return false;
		}
		return true;
	}
	function createScheduledEventId(actorRef, id) {
		return `${actorRef.sessionId}.${id}`;
	}
	var idCounter = 0;
	function createSystem(rootActor, options) {
		const children = /* @__PURE__ */ new Map();
		const keyedActors = /* @__PURE__ */ new Map();
		const reverseKeyedActors = /* @__PURE__ */ new WeakMap();
		const inspectionObservers = /* @__PURE__ */ new Set();
		const timerMap = {};
		const { clock, logger } = options;
		const scheduler = {
			schedule: (source, target, event, delay, id = Math.random().toString(36).slice(2)) => {
				const scheduledEvent = {
					source,
					target,
					event,
					delay,
					id,
					startedAt: Date.now()
				};
				const scheduledEventId = createScheduledEventId(source, id);
				system._snapshot._scheduledEvents[scheduledEventId] = scheduledEvent;
				const timeout = clock.setTimeout(() => {
					delete timerMap[scheduledEventId];
					delete system._snapshot._scheduledEvents[scheduledEventId];
					system._relay(source, target, event);
				}, delay);
				timerMap[scheduledEventId] = timeout;
			},
			cancel: (source, id) => {
				const scheduledEventId = createScheduledEventId(source, id);
				const timeout = timerMap[scheduledEventId];
				delete timerMap[scheduledEventId];
				delete system._snapshot._scheduledEvents[scheduledEventId];
				if (timeout !== void 0) clock.clearTimeout(timeout);
			},
			cancelAll: (actorRef) => {
				for (const scheduledEventId in system._snapshot._scheduledEvents) {
					const scheduledEvent = system._snapshot._scheduledEvents[scheduledEventId];
					if (scheduledEvent.source === actorRef) scheduler.cancel(actorRef, scheduledEvent.id);
				}
			}
		};
		const sendInspectionEvent = (event) => {
			if (!inspectionObservers.size) return;
			const resolvedInspectionEvent = {
				...event,
				rootId: rootActor.sessionId
			};
			inspectionObservers.forEach((observer) => observer.next?.(resolvedInspectionEvent));
		};
		const system = {
			_snapshot: { _scheduledEvents: (options?.snapshot && options.snapshot.scheduler) ?? {} },
			_bookId: () => `x:${idCounter++}`,
			_register: (sessionId, actorRef) => {
				children.set(sessionId, actorRef);
				return sessionId;
			},
			_unregister: (actorRef) => {
				children.delete(actorRef.sessionId);
				const systemId = reverseKeyedActors.get(actorRef);
				if (systemId !== void 0) {
					keyedActors.delete(systemId);
					reverseKeyedActors.delete(actorRef);
				}
			},
			get: (systemId) => {
				return keyedActors.get(systemId);
			},
			getAll: () => {
				return Object.fromEntries(keyedActors.entries());
			},
			_set: (systemId, actorRef) => {
				const existing = keyedActors.get(systemId);
				if (existing && existing !== actorRef) throw new Error(`Actor with system ID '${systemId}' already exists.`);
				keyedActors.set(systemId, actorRef);
				reverseKeyedActors.set(actorRef, systemId);
			},
			inspect: (observerOrFn) => {
				const observer = toObserver(observerOrFn);
				inspectionObservers.add(observer);
				return { unsubscribe() {
					inspectionObservers.delete(observer);
				} };
			},
			_sendInspectionEvent: sendInspectionEvent,
			_relay: (source, target, event) => {
				system._sendInspectionEvent({
					type: "@xstate.event",
					sourceRef: source,
					actorRef: target,
					event
				});
				target._send(event);
			},
			scheduler,
			getSnapshot: () => {
				return { _scheduledEvents: { ...system._snapshot._scheduledEvents } };
			},
			start: () => {
				const scheduledEvents = system._snapshot._scheduledEvents;
				system._snapshot._scheduledEvents = {};
				for (const scheduledId in scheduledEvents) {
					const { source, target, event, delay, id } = scheduledEvents[scheduledId];
					scheduler.schedule(source, target, event, delay, id);
				}
			},
			_clock: clock,
			_logger: logger
		};
		return system;
	}
	var executingCustomAction = false;
	var $$ACTOR_TYPE = 1;
	var ProcessingStatus = /*#__PURE__*/ function(ProcessingStatus) {
		ProcessingStatus[ProcessingStatus["NotStarted"] = 0] = "NotStarted";
		ProcessingStatus[ProcessingStatus["Running"] = 1] = "Running";
		ProcessingStatus[ProcessingStatus["Stopped"] = 2] = "Stopped";
		return ProcessingStatus;
	}({});
	var defaultOptions = {
		clock: {
			setTimeout: (fn, ms) => {
				return setTimeout(fn, ms);
			},
			clearTimeout: (id) => {
				return clearTimeout(id);
			}
		},
		logger: console.log.bind(console),
		devTools: false
	};
	/**
	* An Actor is a running process that can receive events, send events and change
	* its behavior based on the events it receives, which can cause effects outside
	* of the actor. When you run a state machine, it becomes an actor.
	*/
	var Actor = class {
		/**
		* Creates a new actor instance for the given logic with the provided options,
		* if any.
		*
		* @param logic The logic to create an actor from
		* @param options Actor options
		*/
		constructor(logic, options) {
			this.logic = logic;
			/** The current internal state of the actor. */
			this._snapshot = void 0;
			/**
			* The clock that is responsible for setting and clearing timeouts, such as
			* delayed events and transitions.
			*/
			this.clock = void 0;
			this.options = void 0;
			/** The unique identifier for this actor relative to its parent. */
			this.id = void 0;
			this.mailbox = new Mailbox(this._process.bind(this));
			this.observers = /* @__PURE__ */ new Set();
			this.eventListeners = /* @__PURE__ */ new Map();
			this.logger = void 0;
			/** @internal */
			this._processingStatus = ProcessingStatus.NotStarted;
			this._parent = void 0;
			/** @internal */
			this._syncSnapshot = void 0;
			this.ref = void 0;
			this._actorScope = void 0;
			this.systemId = void 0;
			/** The globally unique process ID for this invocation. */
			this.sessionId = void 0;
			/** The system to which this actor belongs. */
			this.system = void 0;
			this._doneEvent = void 0;
			this.src = void 0;
			this._deferred = [];
			const resolvedOptions = {
				...defaultOptions,
				...options
			};
			const { clock, logger, parent, syncSnapshot, id, systemId, inspect } = resolvedOptions;
			this.system = parent ? parent.system : createSystem(this, {
				clock,
				logger
			});
			if (inspect && !parent) this.system.inspect(toObserver(inspect));
			this.sessionId = this.system._bookId();
			this.id = id ?? this.sessionId;
			this.logger = options?.logger ?? this.system._logger;
			this.clock = options?.clock ?? this.system._clock;
			this._parent = parent;
			this._syncSnapshot = syncSnapshot;
			this.options = resolvedOptions;
			this.src = resolvedOptions.src ?? logic;
			this.ref = this;
			this._actorScope = {
				self: this,
				id: this.id,
				sessionId: this.sessionId,
				logger: this.logger,
				defer: (fn) => {
					this._deferred.push(fn);
				},
				system: this.system,
				stopChild: (child) => {
					if (child._parent !== this) throw new Error(`Cannot stop child actor ${child.id} of ${this.id} because it is not a child`);
					child._stop();
				},
				emit: (emittedEvent) => {
					const listeners = this.eventListeners.get(emittedEvent.type);
					const wildcardListener = this.eventListeners.get("*");
					if (!listeners && !wildcardListener) return;
					const allListeners = [...listeners ? listeners.values() : [], ...wildcardListener ? wildcardListener.values() : []];
					for (const handler of allListeners) try {
						handler(emittedEvent);
					} catch (err) {
						reportUnhandledError(err);
					}
				},
				actionExecutor: (action) => {
					const exec = () => {
						this._actorScope.system._sendInspectionEvent({
							type: "@xstate.action",
							actorRef: this,
							action: {
								type: action.type,
								params: action.params
							}
						});
						if (!action.exec) return;
						const saveExecutingCustomAction = executingCustomAction;
						try {
							executingCustomAction = true;
							action.exec(action.info, action.params);
						} finally {
							executingCustomAction = saveExecutingCustomAction;
						}
					};
					if (this._processingStatus === ProcessingStatus.Running) exec();
					else this._deferred.push(exec);
				}
			};
			this.send = this.send.bind(this);
			this.system._sendInspectionEvent({
				type: "@xstate.actor",
				actorRef: this
			});
			if (systemId) {
				this.systemId = systemId;
				this.system._set(systemId, this);
			}
			this._initState(options?.snapshot ?? options?.state);
			if (systemId && this._snapshot.status !== "active") this.system._unregister(this);
		}
		_initState(persistedState) {
			try {
				this._snapshot = persistedState ? this.logic.restoreSnapshot ? this.logic.restoreSnapshot(persistedState, this._actorScope) : persistedState : this.logic.getInitialSnapshot(this._actorScope, this.options?.input);
			} catch (err) {
				this._snapshot = {
					status: "error",
					output: void 0,
					error: err
				};
			}
		}
		update(snapshot, event) {
			this._snapshot = snapshot;
			let deferredFn;
			while (deferredFn = this._deferred.shift()) try {
				deferredFn();
			} catch (err) {
				this._deferred.length = 0;
				this._snapshot = {
					...snapshot,
					status: "error",
					error: err
				};
			}
			switch (this._snapshot.status) {
				case "active":
					for (const observer of this.observers) try {
						observer.next?.(snapshot);
					} catch (err) {
						reportUnhandledError(err);
					}
					break;
				case "done":
					for (const observer of this.observers) try {
						observer.next?.(snapshot);
					} catch (err) {
						reportUnhandledError(err);
					}
					this._stopProcedure();
					this._complete();
					this._doneEvent = createDoneActorEvent(this.id, this._snapshot.output);
					if (this._parent) this.system._relay(this, this._parent, this._doneEvent);
					break;
				case "error": this._error(this._snapshot.error);
			}
			this.system._sendInspectionEvent({
				type: "@xstate.snapshot",
				actorRef: this,
				event,
				snapshot
			});
		}
		/**
		* Subscribe an observer to an actor’s snapshot values.
		*
		* @remarks
		* The observer will receive the actor’s snapshot value when it is emitted.
		* The observer can be:
		*
		* - A plain function that receives the latest snapshot, or
		* - An observer object whose `.next(snapshot)` method receives the latest
		*   snapshot
		*
		* @example
		*
		* ```ts
		* // Observer as a plain function
		* const subscription = actor.subscribe((snapshot) => {
		*   console.log(snapshot);
		* });
		* ```
		*
		* @example
		*
		* ```ts
		* // Observer as an object
		* const subscription = actor.subscribe({
		*   next(snapshot) {
		*     console.log(snapshot);
		*   },
		*   error(err) {
		*     // ...
		*   },
		*   complete() {
		*     // ...
		*   }
		* });
		* ```
		*
		* The return value of `actor.subscribe(observer)` is a subscription object
		* that has an `.unsubscribe()` method. You can call
		* `subscription.unsubscribe()` to unsubscribe the observer:
		*
		* @example
		*
		* ```ts
		* const subscription = actor.subscribe((snapshot) => {
		*   // ...
		* });
		*
		* // Unsubscribe the observer
		* subscription.unsubscribe();
		* ```
		*
		* When the actor is stopped, all of its observers will automatically be
		* unsubscribed.
		*
		* @param observer - Either a plain function that receives the latest
		*   snapshot, or an observer object whose `.next(snapshot)` method receives
		*   the latest snapshot
		*/
		subscribe(nextListenerOrObserver, errorListener, completeListener) {
			const observer = toObserver(nextListenerOrObserver, errorListener, completeListener);
			if (this._processingStatus !== ProcessingStatus.Stopped) this.observers.add(observer);
			else switch (this._snapshot.status) {
				case "done":
					try {
						observer.complete?.();
					} catch (err) {
						reportUnhandledError(err);
					}
					break;
				case "error": {
					const err = this._snapshot.error;
					if (!observer.error) reportUnhandledError(err);
					else try {
						observer.error(err);
					} catch (err) {
						reportUnhandledError(err);
					}
					break;
				}
			}
			return { unsubscribe: () => {
				this.observers.delete(observer);
			} };
		}
		on(type, handler) {
			let listeners = this.eventListeners.get(type);
			if (!listeners) {
				listeners = /* @__PURE__ */ new Set();
				this.eventListeners.set(type, listeners);
			}
			const wrappedHandler = handler.bind(void 0);
			listeners.add(wrappedHandler);
			return { unsubscribe: () => {
				listeners.delete(wrappedHandler);
			} };
		}
		select(selector, equalityFn = Object.is) {
			return {
				subscribe: (observerOrFn) => {
					const observer = toObserver(observerOrFn);
					let previousSelected = selector(this.getSnapshot());
					return this.subscribe((snapshot) => {
						const nextSelected = selector(snapshot);
						if (!equalityFn(previousSelected, nextSelected)) {
							previousSelected = nextSelected;
							observer.next?.(nextSelected);
						}
					});
				},
				get: () => selector(this.getSnapshot())
			};
		}
		/** Starts the Actor from the initial state */
		start() {
			if (this._processingStatus === ProcessingStatus.Running) return this;
			if (this._syncSnapshot) this.subscribe({
				next: (snapshot) => {
					if (snapshot.status === "active") this.system._relay(this, this._parent, {
						type: `xstate.snapshot.${this.id}`,
						snapshot
					});
				},
				error: () => {}
			});
			this.system._register(this.sessionId, this);
			if (this.systemId) this.system._set(this.systemId, this);
			this._processingStatus = ProcessingStatus.Running;
			const initEvent = createInitEvent(this.options.input);
			this.system._sendInspectionEvent({
				type: "@xstate.event",
				sourceRef: this._parent,
				actorRef: this,
				event: initEvent
			});
			switch (this._snapshot.status) {
				case "done":
					this.update(this._snapshot, initEvent);
					return this;
				case "error":
					this._error(this._snapshot.error);
					return this;
			}
			if (!this._parent) this.system.start();
			if (this.logic.start) try {
				this.logic.start(this._snapshot, this._actorScope);
			} catch (err) {
				this._snapshot = {
					...this._snapshot,
					status: "error",
					error: err
				};
				this._error(err);
				return this;
			}
			this.update(this._snapshot, initEvent);
			if (this.options.devTools) this.attachDevTools();
			this.mailbox.start();
			return this;
		}
		_process(event) {
			let nextState;
			let caughtError;
			try {
				nextState = this.logic.transition(this._snapshot, event, this._actorScope);
			} catch (err) {
				caughtError = { err };
			}
			if (caughtError) {
				const { err } = caughtError;
				this._snapshot = {
					...this._snapshot,
					status: "error",
					error: err
				};
				this._error(err);
				return;
			}
			this.update(nextState, event);
			if (event.type === XSTATE_STOP) {
				this._stopProcedure();
				this._complete();
			}
		}
		_stop() {
			if (this._processingStatus === ProcessingStatus.Stopped) return this;
			this.mailbox.clear();
			if (this._processingStatus === ProcessingStatus.NotStarted) {
				this._processingStatus = ProcessingStatus.Stopped;
				return this;
			}
			this.mailbox.enqueue({ type: XSTATE_STOP });
			return this;
		}
		/** Stops the Actor and unsubscribe all listeners. */
		stop() {
			if (this._parent) throw new Error("A non-root actor cannot be stopped directly.");
			return this._stop();
		}
		_complete() {
			for (const observer of this.observers) try {
				observer.complete?.();
			} catch (err) {
				reportUnhandledError(err);
			}
			this.observers.clear();
			this.eventListeners.clear();
		}
		_reportError(err) {
			if (!this.observers.size) {
				if (!this._parent) reportUnhandledError(err);
				this.eventListeners.clear();
				return;
			}
			let reportError = false;
			for (const observer of this.observers) {
				const errorListener = observer.error;
				reportError ||= !errorListener;
				try {
					errorListener?.(err);
				} catch (err2) {
					reportUnhandledError(err2);
				}
			}
			this.observers.clear();
			this.eventListeners.clear();
			if (reportError) reportUnhandledError(err);
		}
		_error(err) {
			this._stopProcedure();
			this._reportError(err);
			if (this._parent) this.system._relay(this, this._parent, createErrorActorEvent(this.id, err));
		}
		_stopProcedure() {
			if (this._processingStatus !== ProcessingStatus.Running) return this;
			this.system.scheduler.cancelAll(this);
			this.mailbox.clear();
			this.mailbox = new Mailbox(this._process.bind(this));
			this._processingStatus = ProcessingStatus.Stopped;
			this.system._unregister(this);
			return this;
		}
		/** @internal */
		_send(event) {
			if (this._processingStatus === ProcessingStatus.Stopped) return;
			this.mailbox.enqueue(event);
		}
		/**
		* Sends an event to the running Actor to trigger a transition.
		*
		* @param event The event to send
		*/
		send(event) {
			this.system._relay(void 0, this, event);
		}
		attachDevTools() {
			const { devTools } = this.options;
			if (devTools) (typeof devTools === "function" ? devTools : dist_xstateDev.devToolsAdapter)(this);
		}
		toJSON() {
			return {
				xstate$$type: $$ACTOR_TYPE,
				id: this.id
			};
		}
		/**
		* Obtain the internal state of the actor, which can be persisted.
		*
		* @remarks
		* The internal state can be persisted from any actor, not only machines.
		*
		* Note that the persisted state is not the same as the snapshot from
		* {@link Actor.getSnapshot}. Persisted state represents the internal state of
		* the actor, while snapshots represent the actor's last emitted value.
		*
		* Can be restored with {@link ActorOptions.state}
		* @see https://stately.ai/docs/persistence
		*/
		getPersistedSnapshot(options) {
			return this.logic.getPersistedSnapshot(this._snapshot, options);
		}
		[symbolObservable]() {
			return this;
		}
		/**
		* Read an actor’s snapshot synchronously.
		*
		* @remarks
		* The snapshot represent an actor's last emitted value.
		*
		* When an actor receives an event, its internal state may change. An actor
		* may emit a snapshot when a state transition occurs.
		*
		* Note that some actors, such as callback actors generated with
		* `fromCallback`, will not emit snapshots.
		* @see {@link Actor.subscribe} to subscribe to an actor’s snapshot values.
		* @see {@link Actor.getPersistedSnapshot} to persist the internal state of an actor (which is more than just a snapshot).
		*/
		getSnapshot() {
			return this._snapshot;
		}
	};
	/**
	* Creates a new actor instance for the given actor logic with the provided
	* options, if any.
	*
	* @remarks
	* When you create an actor from actor logic via `createActor(logic)`, you
	* implicitly create an actor system where the created actor is the root actor.
	* Any actors spawned from this root actor and its descendants are part of that
	* actor system.
	* @example
	*
	* ```ts
	* import { createActor } from 'xstate';
	* import { someActorLogic } from './someActorLogic.ts';
	*
	* // Creating the actor, which implicitly creates an actor system with itself as the root actor
	* const actor = createActor(someActorLogic);
	*
	* actor.subscribe((snapshot) => {
	*   console.log(snapshot);
	* });
	*
	* // Actors must be started by calling `actor.start()`, which will also start the actor system.
	* actor.start();
	*
	* // Actors can receive events
	* actor.send({ type: 'someEvent' });
	*
	* // You can stop root actors by calling `actor.stop()`, which will also stop the actor system and all actors in that system.
	* actor.stop();
	* ```
	*
	* @param logic - The actor logic to create an actor from. For a state machine
	*   actor logic creator, see {@link createMachine}. Other actor logic creators
	*   include {@link fromCallback}, {@link fromEventObservable},
	*   {@link fromObservable}, {@link fromPromise}, and {@link fromTransition}.
	* @param options - Actor options
	*/
	function createActor(logic, ...[options]) {
		return new Actor(logic, options);
	}
	/**
	* Creates a new Interpreter instance for the given machine with the provided
	* options, if any.
	*
	* @deprecated Use `createActor` instead
	* @alias
	*/
	var interpret = createActor;
	/**
	* @deprecated Use `Actor` instead.
	* @alias
	*/
	function resolveCancel(_, snapshot, actionArgs, actionParams, { sendId }) {
		return [
			snapshot,
			{ sendId: typeof sendId === "function" ? sendId(actionArgs, actionParams) : sendId },
			void 0
		];
	}
	function executeCancel(actorScope, params) {
		actorScope.defer(() => {
			actorScope.system.scheduler.cancel(actorScope.self, params.sendId);
		});
	}
	/**
	* Cancels a delayed `sendTo(...)` action that is waiting to be executed. The
	* canceled `sendTo(...)` action will not send its event or execute, unless the
	* `delay` has already elapsed before `cancel(...)` is called.
	*
	* @example
	*
	* ```ts
	* import { createMachine, sendTo, cancel } from 'xstate';
	*
	* const machine = createMachine({
	*   // ...
	*   on: {
	*     sendEvent: {
	*       actions: sendTo(
	*         'some-actor',
	*         { type: 'someEvent' },
	*         {
	*           id: 'some-id',
	*           delay: 1000
	*         }
	*       )
	*     },
	*     cancelEvent: {
	*       actions: cancel('some-id')
	*     }
	*   }
	* });
	* ```
	*
	* @param sendId The `id` of the `sendTo(...)` action to cancel.
	*/
	function cancel(sendId) {
		function cancel(_args, _params) {}
		cancel.type = "xstate.cancel";
		cancel.sendId = sendId;
		cancel.resolve = resolveCancel;
		cancel.execute = executeCancel;
		return cancel;
	}
	function resolveSpawn(actorScope, snapshot, actionArgs, _actionParams, { id, systemId, src, input, syncSnapshot }) {
		const logic = typeof src === "string" ? resolveReferencedActor(snapshot.machine, src) : src;
		const resolvedId = typeof id === "function" ? id(actionArgs) : id;
		let actorRef;
		let resolvedInput = void 0;
		if (logic) {
			resolvedInput = typeof input === "function" ? input({
				context: snapshot.context,
				event: actionArgs.event,
				self: actorScope.self
			}) : input;
			actorRef = createActor(logic, {
				id: resolvedId,
				src,
				parent: actorScope.self,
				syncSnapshot,
				systemId,
				input: resolvedInput
			});
		}
		return [
			cloneMachineSnapshot(snapshot, { children: {
				...snapshot.children,
				[resolvedId]: actorRef
			} }),
			{
				id,
				systemId,
				actorRef,
				src,
				input: resolvedInput
			},
			void 0
		];
	}
	function executeSpawn(actorScope, { actorRef }) {
		if (!actorRef) return;
		actorScope.defer(() => {
			if (actorRef._processingStatus === ProcessingStatus.Stopped) return;
			actorRef.start();
		});
	}
	function spawnChild(...[src, { id, systemId, input, syncSnapshot = false } = {}]) {
		function spawnChild(_args, _params) {}
		spawnChild.type = "xstate.spawnChild";
		spawnChild.id = id;
		spawnChild.systemId = systemId;
		spawnChild.src = src;
		spawnChild.input = input;
		spawnChild.syncSnapshot = syncSnapshot;
		spawnChild.resolve = resolveSpawn;
		spawnChild.execute = executeSpawn;
		return spawnChild;
	}
	function resolveStop(_, snapshot, args, actionParams, { actorRef }) {
		const actorRefOrString = typeof actorRef === "function" ? actorRef(args, actionParams) : actorRef;
		const resolvedActorRef = typeof actorRefOrString === "string" ? snapshot.children[actorRefOrString] : actorRefOrString;
		let children = snapshot.children;
		if (resolvedActorRef) {
			children = { ...children };
			delete children[resolvedActorRef.id];
		}
		return [
			cloneMachineSnapshot(snapshot, { children }),
			resolvedActorRef,
			void 0
		];
	}
	function unregisterRecursively(actorScope, actorRef) {
		const snapshot = actorRef.getSnapshot();
		if (snapshot && "children" in snapshot) for (const child of Object.values(snapshot.children)) unregisterRecursively(actorScope, child);
		actorScope.system._unregister(actorRef);
	}
	function executeStop(actorScope, actorRef) {
		if (!actorRef) return;
		unregisterRecursively(actorScope, actorRef);
		if (actorRef._processingStatus !== ProcessingStatus.Running) {
			actorScope.stopChild(actorRef);
			return;
		}
		actorScope.defer(() => {
			actorScope.stopChild(actorRef);
		});
	}
	/**
	* Stops a child actor.
	*
	* @param actorRef The actor to stop.
	*/
	function stopChild(actorRef) {
		function stop(_args, _params) {}
		stop.type = "xstate.stopChild";
		stop.actorRef = actorRef;
		stop.resolve = resolveStop;
		stop.execute = executeStop;
		return stop;
	}
	/**
	* Stops a child actor.
	*
	* @deprecated Use `stopChild(...)` instead
	* @alias
	*/
	var stop = stopChild;
	function checkStateIn(snapshot, _, { stateValue }) {
		if (typeof stateValue === "string" && isStateId(stateValue)) {
			const target = snapshot.machine.getStateNodeById(stateValue);
			return snapshot._nodes.some((sn) => sn === target);
		}
		return snapshot.matches(stateValue);
	}
	function stateIn(stateValue) {
		function stateIn() {
			return false;
		}
		stateIn.check = checkStateIn;
		stateIn.stateValue = stateValue;
		return stateIn;
	}
	function checkNot(snapshot, { context, event }, { guards }) {
		return !evaluateGuard(guards[0], context, event, snapshot);
	}
	/**
	* Higher-order guard that evaluates to `true` if the `guard` passed to it
	* evaluates to `false`.
	*
	* @category Guards
	* @example
	*
	* ```ts
	* import { setup, not } from 'xstate';
	*
	* const machine = setup({
	*   guards: {
	*     someNamedGuard: () => false
	*   }
	* }).createMachine({
	*   on: {
	*     someEvent: {
	*       guard: not('someNamedGuard'),
	*       actions: () => {
	*         // will be executed if guard in `not(...)`
	*         // evaluates to `false`
	*       }
	*     }
	*   }
	* });
	* ```
	*
	* @returns A guard
	*/
	function not(guard) {
		function not(_args, _params) {
			return false;
		}
		not.check = checkNot;
		not.guards = [guard];
		return not;
	}
	function checkAnd(snapshot, { context, event }, { guards }) {
		return guards.every((guard) => evaluateGuard(guard, context, event, snapshot));
	}
	/**
	* Higher-order guard that evaluates to `true` if all `guards` passed to it
	* evaluate to `true`.
	*
	* @category Guards
	* @example
	*
	* ```ts
	* import { setup, and } from 'xstate';
	*
	* const machine = setup({
	*   guards: {
	*     someNamedGuard: () => true
	*   }
	* }).createMachine({
	*   on: {
	*     someEvent: {
	*       guard: and([({ context }) => context.value > 0, 'someNamedGuard']),
	*       actions: () => {
	*         // will be executed if all guards in `and(...)`
	*         // evaluate to true
	*       }
	*     }
	*   }
	* });
	* ```
	*
	* @returns A guard action object
	*/
	function and(guards) {
		function and(_args, _params) {
			return false;
		}
		and.check = checkAnd;
		and.guards = guards;
		return and;
	}
	function checkOr(snapshot, { context, event }, { guards }) {
		return guards.some((guard) => evaluateGuard(guard, context, event, snapshot));
	}
	/**
	* Higher-order guard that evaluates to `true` if any of the `guards` passed to
	* it evaluate to `true`.
	*
	* @category Guards
	* @example
	*
	* ```ts
	* import { setup, or } from 'xstate';
	*
	* const machine = setup({
	*   guards: {
	*     someNamedGuard: () => true
	*   }
	* }).createMachine({
	*   on: {
	*     someEvent: {
	*       guard: or([({ context }) => context.value > 0, 'someNamedGuard']),
	*       actions: () => {
	*         // will be executed if any of the guards in `or(...)`
	*         // evaluate to true
	*       }
	*     }
	*   }
	* });
	* ```
	*
	* @returns A guard action object
	*/
	function or(guards) {
		function or(_args, _params) {
			return false;
		}
		or.check = checkOr;
		or.guards = guards;
		return or;
	}
	function evaluateGuard(guard, context, event, snapshot) {
		const { machine } = snapshot;
		const isInline = typeof guard === "function";
		const resolved = isInline ? guard : machine.implementations.guards[typeof guard === "string" ? guard : guard.type];
		if (!isInline && !resolved) throw new Error(`Guard '${typeof guard === "string" ? guard : guard.type}' is not implemented.'.`);
		if (typeof resolved !== "function") return evaluateGuard(resolved, context, event, snapshot);
		const guardArgs = {
			context,
			event
		};
		const guardParams = isInline || typeof guard === "string" ? void 0 : "params" in guard ? typeof guard.params === "function" ? guard.params({
			context,
			event
		}) : guard.params : void 0;
		if (!("check" in resolved)) return resolved(guardArgs, guardParams);
		return resolved.check(snapshot, guardArgs, resolved);
	}
	function isAtomicStateNode(stateNode) {
		return stateNode.type === "atomic" || stateNode.type === "final";
	}
	function getChildren(stateNode) {
		return Object.values(stateNode.states).filter((sn) => sn.type !== "history");
	}
	function getProperAncestors(stateNode, toStateNode) {
		const ancestors = [];
		if (toStateNode === stateNode) return ancestors;
		let m = stateNode.parent;
		while (m && m !== toStateNode) {
			ancestors.push(m);
			m = m.parent;
		}
		return ancestors;
	}
	function getAllStateNodes(stateNodes) {
		const nodeSet = new Set(stateNodes);
		const adjList = getAdjList(nodeSet);
		for (const s of nodeSet) if (s.type === "compound" && (!adjList.get(s) || !adjList.get(s).length)) getInitialStateNodesWithTheirAncestors(s).forEach((sn) => nodeSet.add(sn));
		else if (s.type === "parallel") for (const child of getChildren(s)) {
			if (child.type === "history") continue;
			if (!nodeSet.has(child)) {
				const initialStates = getInitialStateNodesWithTheirAncestors(child);
				for (const initialStateNode of initialStates) nodeSet.add(initialStateNode);
			}
		}
		for (const s of nodeSet) {
			let m = s.parent;
			while (m) {
				nodeSet.add(m);
				m = m.parent;
			}
		}
		return nodeSet;
	}
	function getValueFromAdj(baseNode, adjList) {
		const childStateNodes = adjList.get(baseNode);
		if (!childStateNodes) return {};
		if (baseNode.type === "compound") {
			const childStateNode = childStateNodes[0];
			if (childStateNode) {
				if (isAtomicStateNode(childStateNode)) return childStateNode.key;
			} else return {};
		}
		const stateValue = {};
		for (const childStateNode of childStateNodes) stateValue[childStateNode.key] = getValueFromAdj(childStateNode, adjList);
		return stateValue;
	}
	function getAdjList(stateNodes) {
		const adjList = /* @__PURE__ */ new Map();
		for (const s of stateNodes) {
			if (!adjList.has(s)) adjList.set(s, []);
			if (s.parent) {
				if (!adjList.has(s.parent)) adjList.set(s.parent, []);
				adjList.get(s.parent).push(s);
			}
		}
		return adjList;
	}
	function getStateValue(rootNode, stateNodes) {
		return getValueFromAdj(rootNode, getAdjList(getAllStateNodes(stateNodes)));
	}
	function isInFinalState(stateNodeSet, stateNode) {
		if (stateNode.type === "compound") return getChildren(stateNode).some((s) => s.type === "final" && stateNodeSet.has(s));
		if (stateNode.type === "parallel") return getChildren(stateNode).every((sn) => isInFinalState(stateNodeSet, sn));
		return stateNode.type === "final";
	}
	var isStateId = (str) => str[0] === STATE_IDENTIFIER;
	function getCandidates(stateNode, receivedEventType) {
		const exactMatch = stateNode.transitions.get(receivedEventType);
		const wildcardCandidates = [...stateNode.transitions.keys()].filter((eventDescriptor) => eventDescriptor !== receivedEventType && matchesEventDescriptor(receivedEventType, eventDescriptor)).sort((a, b) => b.length - a.length).flatMap((key) => stateNode.transitions.get(key));
		return exactMatch ? [...exactMatch, ...wildcardCandidates] : wildcardCandidates;
	}
	/** All delayed transitions from the config. */
	function getDelayedTransitions(stateNode) {
		const afterConfig = stateNode.config.after;
		if (!afterConfig) return [];
		const mutateEntryExit = (delay) => {
			const afterEvent = createAfterEvent(delay, stateNode.id);
			const eventType = afterEvent.type;
			stateNode.entry.push(raise(afterEvent, {
				id: eventType,
				delay
			}));
			stateNode.exit.push(cancel(eventType));
			return eventType;
		};
		return Object.keys(afterConfig).flatMap((delay) => {
			const configTransition = afterConfig[delay];
			const resolvedTransition = typeof configTransition === "string" ? { target: configTransition } : configTransition;
			const resolvedDelay = Number.isNaN(+delay) ? delay : +delay;
			const eventType = mutateEntryExit(resolvedDelay);
			return toArray(resolvedTransition).map((transition) => ({
				...transition,
				event: eventType,
				delay: resolvedDelay
			}));
		}).map((delayedTransition) => {
			const { delay } = delayedTransition;
			return {
				...formatTransition(stateNode, delayedTransition.event, delayedTransition),
				delay
			};
		});
	}
	function formatTransition(stateNode, descriptor, transitionConfig) {
		const normalizedTarget = normalizeTarget(transitionConfig.target);
		const reenter = transitionConfig.reenter ?? false;
		const target = resolveTarget(stateNode, normalizedTarget);
		const transition = {
			...transitionConfig,
			actions: toArray(transitionConfig.actions),
			guard: transitionConfig.guard,
			target,
			source: stateNode,
			reenter,
			eventType: descriptor,
			toJSON: () => ({
				...transition,
				source: `#${stateNode.id}`,
				target: target ? target.map((t) => `#${t.id}`) : void 0
			})
		};
		return transition;
	}
	function formatTransitions(stateNode) {
		const transitions = /* @__PURE__ */ new Map();
		if (stateNode.config.on) for (const descriptor of Object.keys(stateNode.config.on)) {
			if (descriptor === NULL_EVENT) throw new Error("Null events (\"\") cannot be specified as a transition key. Use `always: { ... }` instead.");
			const transitionsConfig = stateNode.config.on[descriptor];
			transitions.set(descriptor, toTransitionConfigArray(transitionsConfig).map((t) => formatTransition(stateNode, descriptor, t)));
		}
		if (stateNode.config.onDone) {
			const descriptor = `xstate.done.state.${stateNode.id}`;
			transitions.set(descriptor, toTransitionConfigArray(stateNode.config.onDone).map((t) => formatTransition(stateNode, descriptor, t)));
		}
		for (const invokeDef of stateNode.invoke) {
			if (invokeDef.onDone) {
				const descriptor = `xstate.done.actor.${invokeDef.id}`;
				transitions.set(descriptor, toTransitionConfigArray(invokeDef.onDone).map((t) => formatTransition(stateNode, descriptor, t)));
			}
			if (invokeDef.onError) {
				const descriptor = `xstate.error.actor.${invokeDef.id}`;
				transitions.set(descriptor, toTransitionConfigArray(invokeDef.onError).map((t) => formatTransition(stateNode, descriptor, t)));
			}
			if (invokeDef.onSnapshot) {
				const descriptor = `xstate.snapshot.${invokeDef.id}`;
				transitions.set(descriptor, toTransitionConfigArray(invokeDef.onSnapshot).map((t) => formatTransition(stateNode, descriptor, t)));
			}
		}
		for (const delayedTransition of stateNode.after) {
			let existing = transitions.get(delayedTransition.eventType);
			if (!existing) {
				existing = [];
				transitions.set(delayedTransition.eventType, existing);
			}
			existing.push(delayedTransition);
		}
		return transitions;
	}
	/**
	* Collects route transitions from all descendants with explicit IDs. Called
	* once on the root node to avoid O(N²) repeated traversals.
	*/
	function formatRouteTransitions(rootStateNode) {
		const routeTransitions = [];
		const collectRoutes = (states) => {
			Object.values(states).forEach((sn) => {
				if (sn.config.route && sn.config.id) {
					const routeId = sn.config.id;
					const userGuard = sn.config.route.guard;
					const routeMatches = ({ event }) => event.to === `#${routeId}`;
					const transition = {
						...sn.config.route,
						guard: userGuard ? and([routeMatches, userGuard]) : routeMatches,
						target: `#${routeId}`
					};
					routeTransitions.push(formatTransition(rootStateNode, "xstate.route", transition));
				}
				if (sn.states) collectRoutes(sn.states);
			});
		};
		collectRoutes(rootStateNode.states);
		if (routeTransitions.length > 0) rootStateNode.transitions.set("xstate.route", routeTransitions);
	}
	function formatInitialTransition(stateNode, _target) {
		const resolvedTarget = typeof _target === "string" ? stateNode.states[_target] : _target ? stateNode.states[_target.target] : void 0;
		if (!resolvedTarget && _target) throw new Error(`Initial state node "${_target}" not found on parent state node #${stateNode.id}`);
		const transition = {
			source: stateNode,
			actions: !_target || typeof _target === "string" ? [] : toArray(_target.actions),
			eventType: null,
			reenter: false,
			target: resolvedTarget ? [resolvedTarget] : [],
			toJSON: () => ({
				...transition,
				source: `#${stateNode.id}`,
				target: resolvedTarget ? [`#${resolvedTarget.id}`] : []
			})
		};
		return transition;
	}
	function resolveTarget(stateNode, targets) {
		if (targets === void 0) return;
		return targets.map((target) => {
			if (typeof target !== "string") return target;
			if (isStateId(target)) return stateNode.machine.getStateNodeById(target);
			const isInternalTarget = target[0] === STATE_DELIMITER;
			if (isInternalTarget && !stateNode.parent) return getStateNodeByPath(stateNode, target.slice(1));
			const resolvedTarget = isInternalTarget ? stateNode.key + target : target;
			if (stateNode.parent) try {
				return getStateNodeByPath(stateNode.parent, resolvedTarget);
			} catch (err) {
				throw new Error(`Invalid transition definition for state node '${stateNode.id}':\n${err.message}`);
			}
			else throw new Error(`Invalid target: "${target}" is not a valid target from the root node. Did you mean ".${target}"?`);
		});
	}
	function resolveHistoryDefaultTransition(stateNode) {
		const normalizedTarget = normalizeTarget(stateNode.config.target);
		if (!normalizedTarget) {
			if (stateNode.parent.type === "parallel") return { target: [stateNode.parent] };
			return stateNode.parent.initial;
		}
		return { target: normalizedTarget.map((t) => typeof t === "string" ? getStateNodeByPath(stateNode.parent, t) : t) };
	}
	function isHistoryNode(stateNode) {
		return stateNode.type === "history";
	}
	function getInitialStateNodesWithTheirAncestors(stateNode) {
		const states = getInitialStateNodes(stateNode);
		for (const initialState of states) for (const ancestor of getProperAncestors(initialState, stateNode)) states.add(ancestor);
		return states;
	}
	function getInitialStateNodes(stateNode) {
		const set = /* @__PURE__ */ new Set();
		function iter(descStateNode) {
			if (set.has(descStateNode)) return;
			set.add(descStateNode);
			if (descStateNode.type === "compound") iter(descStateNode.initial.target[0]);
			else if (descStateNode.type === "parallel") for (const child of getChildren(descStateNode)) iter(child);
		}
		iter(stateNode);
		return set;
	}
	/** Returns the child state node from its relative `stateKey`, or throws. */
	function getStateNode(stateNode, stateKey) {
		if (isStateId(stateKey)) return stateNode.machine.getStateNodeById(stateKey);
		if (!stateNode.states) throw new Error(`Unable to retrieve child state '${stateKey}' from '${stateNode.id}'; no child states exist.`);
		const result = stateNode.states[stateKey];
		if (!result) throw new Error(`Child state '${stateKey}' does not exist on '${stateNode.id}'`);
		return result;
	}
	/**
	* Returns the relative state node from the given `statePath`, or throws.
	*
	* @param statePath The string or string array relative path to the state node.
	*/
	function getStateNodeByPath(stateNode, statePath) {
		if (typeof statePath === "string" && isStateId(statePath)) try {
			return stateNode.machine.getStateNodeById(statePath);
		} catch {}
		const arrayStatePath = toStatePath(statePath).slice();
		let currentStateNode = stateNode;
		while (arrayStatePath.length) {
			const key = arrayStatePath.shift();
			if (!key.length) break;
			currentStateNode = getStateNode(currentStateNode, key);
		}
		return currentStateNode;
	}
	/**
	* Returns the state nodes represented by the current state value.
	*
	* @param stateValue The state value or State instance
	*/
	function getStateNodes(stateNode, stateValue) {
		if (typeof stateValue === "string") {
			const childStateNode = stateNode.states[stateValue];
			if (!childStateNode) throw new Error(`State '${stateValue}' does not exist on '${stateNode.id}'`);
			return [stateNode, childStateNode];
		}
		const childStateKeys = Object.keys(stateValue);
		const childStateNodes = childStateKeys.map((subStateKey) => getStateNode(stateNode, subStateKey)).filter(Boolean);
		return [stateNode.machine.root, stateNode].concat(childStateNodes, childStateKeys.reduce((allSubStateNodes, subStateKey) => {
			const subStateNode = getStateNode(stateNode, subStateKey);
			if (!subStateNode) return allSubStateNodes;
			const subStateNodes = getStateNodes(subStateNode, stateValue[subStateKey]);
			return allSubStateNodes.concat(subStateNodes);
		}, []));
	}
	function transitionAtomicNode(stateNode, stateValue, snapshot, event) {
		const next = getStateNode(stateNode, stateValue).next(snapshot, event);
		if (!next || !next.length) return stateNode.next(snapshot, event);
		return next;
	}
	function transitionCompoundNode(stateNode, stateValue, snapshot, event) {
		const subStateKeys = Object.keys(stateValue);
		const next = transitionNode(getStateNode(stateNode, subStateKeys[0]), stateValue[subStateKeys[0]], snapshot, event);
		if (!next || !next.length) return stateNode.next(snapshot, event);
		return next;
	}
	function transitionParallelNode(stateNode, stateValue, snapshot, event) {
		const allInnerTransitions = [];
		for (const subStateKey of Object.keys(stateValue)) {
			const subStateValue = stateValue[subStateKey];
			if (!subStateValue) continue;
			const innerTransitions = transitionNode(getStateNode(stateNode, subStateKey), subStateValue, snapshot, event);
			if (innerTransitions) allInnerTransitions.push(...innerTransitions);
		}
		if (!allInnerTransitions.length) return stateNode.next(snapshot, event);
		return allInnerTransitions;
	}
	function transitionNode(stateNode, stateValue, snapshot, event) {
		if (typeof stateValue === "string") return transitionAtomicNode(stateNode, stateValue, snapshot, event);
		if (Object.keys(stateValue).length === 1) return transitionCompoundNode(stateNode, stateValue, snapshot, event);
		return transitionParallelNode(stateNode, stateValue, snapshot, event);
	}
	function getHistoryNodes(stateNode) {
		return Object.keys(stateNode.states).map((key) => stateNode.states[key]).filter((sn) => sn.type === "history");
	}
	function isDescendant(childStateNode, parentStateNode) {
		let marker = childStateNode;
		while (marker.parent && marker.parent !== parentStateNode) marker = marker.parent;
		return marker.parent === parentStateNode;
	}
	function hasIntersection(s1, s2) {
		const set1 = new Set(s1);
		const set2 = new Set(s2);
		for (const item of set1) if (set2.has(item)) return true;
		for (const item of set2) if (set1.has(item)) return true;
		return false;
	}
	function removeConflictingTransitions(enabledTransitions, stateNodeSet, historyValue) {
		const filteredTransitions = /* @__PURE__ */ new Set();
		for (const t1 of enabledTransitions) {
			let t1Preempted = false;
			const transitionsToRemove = /* @__PURE__ */ new Set();
			for (const t2 of filteredTransitions) if (hasIntersection(computeExitSet([t1], stateNodeSet, historyValue), computeExitSet([t2], stateNodeSet, historyValue))) {
				if (isDescendant(t1.source, t2.source)) transitionsToRemove.add(t2);
				else {
					t1Preempted = true;
					break;
				}
			}
			if (!t1Preempted) {
				for (const t3 of transitionsToRemove) filteredTransitions.delete(t3);
				filteredTransitions.add(t1);
			}
		}
		return Array.from(filteredTransitions);
	}
	function findLeastCommonAncestor(stateNodes) {
		const [head, ...tail] = stateNodes;
		for (const ancestor of getProperAncestors(head, void 0)) if (tail.every((sn) => isDescendant(sn, ancestor))) return ancestor;
	}
	function getEffectiveTargetStates(transition, historyValue) {
		if (!transition.target) return [];
		const targets = /* @__PURE__ */ new Set();
		for (const targetNode of transition.target) if (isHistoryNode(targetNode)) {
			if (historyValue[targetNode.id]) for (const node of historyValue[targetNode.id]) targets.add(node);
			else for (const node of getEffectiveTargetStates(resolveHistoryDefaultTransition(targetNode), historyValue)) targets.add(node);
		} else targets.add(targetNode);
		return [...targets];
	}
	function getTransitionDomain(transition, historyValue) {
		const targetStates = getEffectiveTargetStates(transition, historyValue);
		if (!targetStates) return;
		if (!transition.reenter && targetStates.every((target) => target === transition.source || isDescendant(target, transition.source))) return transition.source;
		const lca = findLeastCommonAncestor(targetStates.concat(transition.source));
		if (lca) return lca;
		if (transition.reenter) return;
		return transition.source.machine.root;
	}
	function computeExitSet(transitions, stateNodeSet, historyValue) {
		const statesToExit = /* @__PURE__ */ new Set();
		for (const t of transitions) if (t.target?.length) {
			const domain = getTransitionDomain(t, historyValue);
			if (t.reenter && t.source === domain) statesToExit.add(domain);
			for (const stateNode of stateNodeSet) if (isDescendant(stateNode, domain)) statesToExit.add(stateNode);
		}
		return [...statesToExit];
	}
	function areStateNodeCollectionsEqual(prevStateNodes, nextStateNodeSet) {
		if (prevStateNodes.length !== nextStateNodeSet.size) return false;
		for (const node of prevStateNodes) if (!nextStateNodeSet.has(node)) return false;
		return true;
	}
	function initialMicrostep(root, preInitialState, actorScope, initEvent, internalQueue) {
		return microstep([{
			target: [...getInitialStateNodes(root)],
			source: root,
			reenter: true,
			actions: [],
			eventType: null,
			toJSON: null
		}], preInitialState, actorScope, initEvent, true, internalQueue);
	}
	/** https://www.w3.org/TR/scxml/#microstepProcedure */
	function microstep(transitions, currentSnapshot, actorScope, event, isInitial, internalQueue) {
		const actions = [];
		if (!transitions.length) return [currentSnapshot, actions];
		const originalExecutor = actorScope.actionExecutor;
		actorScope.actionExecutor = (action) => {
			actions.push(action);
			originalExecutor(action);
		};
		try {
			const mutStateNodeSet = new Set(currentSnapshot._nodes);
			let historyValue = currentSnapshot.historyValue;
			const filteredTransitions = removeConflictingTransitions(transitions, mutStateNodeSet, historyValue);
			let nextState = currentSnapshot;
			if (!isInitial) [nextState, historyValue] = exitStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, historyValue, internalQueue, actorScope.actionExecutor);
			nextState = resolveActionsAndContext(nextState, event, actorScope, filteredTransitions.flatMap((t) => t.actions), internalQueue, void 0);
			nextState = enterStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial);
			const nextStateNodes = [...mutStateNodeSet];
			if (nextState.status === "done") nextState = resolveActionsAndContext(nextState, event, actorScope, nextStateNodes.sort((a, b) => b.order - a.order).flatMap((state) => state.exit), internalQueue, void 0);
			try {
				if (historyValue === currentSnapshot.historyValue && areStateNodeCollectionsEqual(currentSnapshot._nodes, mutStateNodeSet)) return [nextState, actions];
				return [cloneMachineSnapshot(nextState, {
					_nodes: nextStateNodes,
					historyValue
				}), actions];
			} catch (e) {
				throw e;
			}
		} finally {
			actorScope.actionExecutor = originalExecutor;
		}
	}
	function getMachineOutput(snapshot, event, actorScope, rootNode, rootCompletionNode) {
		if (rootNode.output === void 0) return;
		const doneStateEvent = createDoneStateEvent(rootCompletionNode.id, rootCompletionNode.output !== void 0 && rootCompletionNode.parent ? resolveOutput(rootCompletionNode.output, snapshot.context, event, actorScope.self) : void 0);
		return resolveOutput(rootNode.output, snapshot.context, doneStateEvent, actorScope.self);
	}
	function enterStates(currentSnapshot, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial) {
		let nextSnapshot = currentSnapshot;
		const statesToEnter = /* @__PURE__ */ new Set();
		const statesForDefaultEntry = /* @__PURE__ */ new Set();
		computeEntrySet(filteredTransitions, historyValue, statesForDefaultEntry, statesToEnter);
		if (isInitial) statesForDefaultEntry.add(currentSnapshot.machine.root);
		const completedNodes = /* @__PURE__ */ new Set();
		for (const stateNodeToEnter of [...statesToEnter].sort((a, b) => a.order - b.order)) {
			mutStateNodeSet.add(stateNodeToEnter);
			const actions = [];
			actions.push(...stateNodeToEnter.entry);
			for (const invokeDef of stateNodeToEnter.invoke) actions.push(spawnChild(invokeDef.src, {
				...invokeDef,
				syncSnapshot: !!invokeDef.onSnapshot
			}));
			if (statesForDefaultEntry.has(stateNodeToEnter)) {
				const initialActions = stateNodeToEnter.initial.actions;
				actions.push(...initialActions);
			}
			nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, actions, internalQueue, stateNodeToEnter.invoke.map((invokeDef) => invokeDef.id));
			if (stateNodeToEnter.type === "final") {
				const parent = stateNodeToEnter.parent;
				let ancestorMarker = parent?.type === "parallel" ? parent : parent?.parent;
				let rootCompletionNode = ancestorMarker || stateNodeToEnter;
				if (parent?.type === "compound") internalQueue.push(createDoneStateEvent(parent.id, stateNodeToEnter.output !== void 0 ? resolveOutput(stateNodeToEnter.output, nextSnapshot.context, event, actorScope.self) : void 0));
				while (ancestorMarker?.type === "parallel" && !completedNodes.has(ancestorMarker) && isInFinalState(mutStateNodeSet, ancestorMarker)) {
					completedNodes.add(ancestorMarker);
					internalQueue.push(createDoneStateEvent(ancestorMarker.id));
					rootCompletionNode = ancestorMarker;
					ancestorMarker = ancestorMarker.parent;
				}
				if (ancestorMarker) continue;
				nextSnapshot = cloneMachineSnapshot(nextSnapshot, {
					status: "done",
					output: getMachineOutput(nextSnapshot, event, actorScope, nextSnapshot.machine.root, rootCompletionNode)
				});
			}
		}
		return nextSnapshot;
	}
	function computeEntrySet(transitions, historyValue, statesForDefaultEntry, statesToEnter) {
		for (const t of transitions) {
			const domain = getTransitionDomain(t, historyValue);
			for (const s of t.target || []) {
				if (!isHistoryNode(s) && (t.source !== s || t.source !== domain || t.reenter)) {
					statesToEnter.add(s);
					statesForDefaultEntry.add(s);
				}
				addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
			}
			const targetStates = getEffectiveTargetStates(t, historyValue);
			for (const s of targetStates) {
				const ancestors = getProperAncestors(s, domain);
				if (domain?.type === "parallel") ancestors.push(domain);
				addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, !t.source.parent && t.reenter ? void 0 : domain);
			}
		}
	}
	function addDescendantStatesToEnter(stateNode, historyValue, statesForDefaultEntry, statesToEnter) {
		if (isHistoryNode(stateNode)) {
			if (historyValue[stateNode.id]) {
				const historyStateNodes = historyValue[stateNode.id];
				for (const s of historyStateNodes) {
					statesToEnter.add(s);
					addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
				}
				for (const s of historyStateNodes) addProperAncestorStatesToEnter(s, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
			} else {
				const historyDefaultTransition = resolveHistoryDefaultTransition(stateNode);
				for (const s of historyDefaultTransition.target) {
					statesToEnter.add(s);
					if (historyDefaultTransition === stateNode.parent?.initial) statesForDefaultEntry.add(stateNode.parent);
					addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
				}
				for (const s of historyDefaultTransition.target) addProperAncestorStatesToEnter(s, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
			}
		} else if (stateNode.type === "compound") {
			const [initialState] = stateNode.initial.target;
			if (!isHistoryNode(initialState)) {
				statesToEnter.add(initialState);
				statesForDefaultEntry.add(initialState);
			}
			addDescendantStatesToEnter(initialState, historyValue, statesForDefaultEntry, statesToEnter);
			addProperAncestorStatesToEnter(initialState, stateNode, statesToEnter, historyValue, statesForDefaultEntry);
		} else if (stateNode.type === "parallel") {
			for (const child of getChildren(stateNode).filter((sn) => !isHistoryNode(sn))) if (![...statesToEnter].some((s) => isDescendant(s, child))) {
				if (!isHistoryNode(child)) {
					statesToEnter.add(child);
					statesForDefaultEntry.add(child);
				}
				addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
			}
		}
	}
	function addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, reentrancyDomain) {
		for (const anc of ancestors) {
			if (!reentrancyDomain || isDescendant(anc, reentrancyDomain)) statesToEnter.add(anc);
			if (anc.type === "parallel") {
				for (const child of getChildren(anc).filter((sn) => !isHistoryNode(sn))) if (![...statesToEnter].some((s) => isDescendant(s, child))) {
					statesToEnter.add(child);
					addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
				}
			}
		}
	}
	function addProperAncestorStatesToEnter(stateNode, toStateNode, statesToEnter, historyValue, statesForDefaultEntry) {
		addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, getProperAncestors(stateNode, toStateNode));
	}
	function exitStates(currentSnapshot, event, actorScope, transitions, mutStateNodeSet, historyValue, internalQueue, _actionExecutor) {
		let nextSnapshot = currentSnapshot;
		const statesToExit = computeExitSet(transitions, mutStateNodeSet, historyValue);
		statesToExit.sort((a, b) => b.order - a.order);
		let changedHistory;
		for (const exitStateNode of statesToExit) for (const historyNode of getHistoryNodes(exitStateNode)) {
			let predicate;
			if (historyNode.history === "deep") predicate = (sn) => isAtomicStateNode(sn) && isDescendant(sn, exitStateNode);
			else predicate = (sn) => {
				return sn.parent === exitStateNode;
			};
			changedHistory ??= { ...historyValue };
			changedHistory[historyNode.id] = Array.from(mutStateNodeSet).filter(predicate);
		}
		for (const s of statesToExit) {
			nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, [...s.exit, ...s.invoke.map((def) => stopChild(def.id))], internalQueue, void 0);
			mutStateNodeSet.delete(s);
		}
		return [nextSnapshot, changedHistory || historyValue];
	}
	function getAction(machine, actionType) {
		return machine.implementations.actions[actionType];
	}
	function resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions, extra, retries) {
		const { machine } = currentSnapshot;
		let intermediateSnapshot = currentSnapshot;
		for (const action of actions) {
			const isInline = typeof action === "function";
			const resolvedAction = isInline ? action : getAction(machine, typeof action === "string" ? action : action.type);
			const actionArgs = {
				context: intermediateSnapshot.context,
				event,
				self: actorScope.self,
				system: actorScope.system
			};
			const actionParams = isInline || typeof action === "string" ? void 0 : "params" in action ? typeof action.params === "function" ? action.params({
				context: intermediateSnapshot.context,
				event
			}) : action.params : void 0;
			if (!resolvedAction || !("resolve" in resolvedAction)) {
				actorScope.actionExecutor({
					type: typeof action === "string" ? action : typeof action === "object" ? action.type : action.name || "(anonymous)",
					info: actionArgs,
					params: actionParams,
					exec: resolvedAction
				});
				continue;
			}
			const builtinAction = resolvedAction;
			const [nextState, params, actions] = builtinAction.resolve(actorScope, intermediateSnapshot, actionArgs, actionParams, resolvedAction, extra);
			intermediateSnapshot = nextState;
			if ("retryResolve" in builtinAction) retries?.push([builtinAction, params]);
			if ("execute" in builtinAction) actorScope.actionExecutor({
				type: builtinAction.type,
				info: actionArgs,
				params,
				exec: builtinAction.execute.bind(null, actorScope, params)
			});
			if (actions) intermediateSnapshot = resolveAndExecuteActionsWithContext(intermediateSnapshot, event, actorScope, actions, extra, retries);
		}
		return intermediateSnapshot;
	}
	function resolveActionsAndContext(currentSnapshot, event, actorScope, actions, internalQueue, deferredActorIds) {
		const retries = deferredActorIds ? [] : void 0;
		const nextState = resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions, {
			internalQueue,
			deferredActorIds
		}, retries);
		retries?.forEach(([builtinAction, params]) => {
			builtinAction.retryResolve(actorScope, nextState, params);
		});
		return nextState;
	}
	function macrostep(snapshot, event, actorScope, internalQueue) {
		let nextSnapshot = snapshot;
		const microsteps = [];
		function addMicrostep(step, event, transitions) {
			actorScope.system._sendInspectionEvent({
				type: "@xstate.microstep",
				actorRef: actorScope.self,
				event,
				snapshot: step[0],
				_transitions: transitions
			});
			microsteps.push(step);
		}
		if (event.type === XSTATE_STOP) {
			nextSnapshot = cloneMachineSnapshot(stopChildren(nextSnapshot, event, actorScope), { status: "stopped" });
			addMicrostep([nextSnapshot, []], event, []);
			return {
				snapshot: nextSnapshot,
				microsteps
			};
		}
		let nextEvent = event;
		if (nextEvent.type !== XSTATE_INIT) {
			const currentEvent = nextEvent;
			const isErr = isErrorActorEvent(currentEvent);
			const transitions = selectTransitions(currentEvent, nextSnapshot);
			if (isErr && !transitions.length) {
				nextSnapshot = cloneMachineSnapshot(snapshot, {
					status: "error",
					error: currentEvent.error
				});
				addMicrostep([nextSnapshot, []], currentEvent, []);
				return {
					snapshot: nextSnapshot,
					microsteps
				};
			}
			const step = microstep(transitions, snapshot, actorScope, nextEvent, false, internalQueue);
			nextSnapshot = step[0];
			addMicrostep(step, currentEvent, transitions);
		}
		let shouldSelectEventlessTransitions = true;
		const maxIterations = snapshot.machine.options?.maxIterations ?? Infinity;
		let iterationCount = 0;
		while (nextSnapshot.status === "active") {
			iterationCount++;
			if (iterationCount > maxIterations) throw new Error(`Infinite loop detected: the machine has processed more than ${maxIterations} microsteps without reaching a stable state. This usually happens when there's a cycle of transitions (e.g., eventless transitions or raised events causing state A -> B -> C -> A).`);
			let enabledTransitions = shouldSelectEventlessTransitions ? selectEventlessTransitions(nextSnapshot, nextEvent) : [];
			const previousState = enabledTransitions.length ? nextSnapshot : void 0;
			if (!enabledTransitions.length) {
				if (!internalQueue.length) break;
				nextEvent = internalQueue.shift();
				enabledTransitions = selectTransitions(nextEvent, nextSnapshot);
			}
			const step = microstep(enabledTransitions, nextSnapshot, actorScope, nextEvent, false, internalQueue);
			nextSnapshot = step[0];
			shouldSelectEventlessTransitions = nextSnapshot !== previousState;
			addMicrostep(step, nextEvent, enabledTransitions);
		}
		if (nextSnapshot.status !== "active") stopChildren(nextSnapshot, nextEvent, actorScope);
		return {
			snapshot: nextSnapshot,
			microsteps
		};
	}
	function stopChildren(nextState, event, actorScope) {
		return resolveActionsAndContext(nextState, event, actorScope, Object.values(nextState.children).map((child) => stopChild(child)), [], void 0);
	}
	function selectTransitions(event, nextState) {
		return nextState.machine.getTransitionData(nextState, event);
	}
	function selectEventlessTransitions(nextState, event) {
		const enabledTransitionSet = /* @__PURE__ */ new Set();
		const atomicStates = nextState._nodes.filter(isAtomicStateNode);
		for (const stateNode of atomicStates) loop: for (const s of [stateNode].concat(getProperAncestors(stateNode, void 0))) {
			if (!s.always) continue;
			for (const transition of s.always) if (transition.guard === void 0 || evaluateGuard(transition.guard, nextState.context, event, nextState)) {
				enabledTransitionSet.add(transition);
				break loop;
			}
		}
		return removeConflictingTransitions(Array.from(enabledTransitionSet), new Set(nextState._nodes), nextState.historyValue);
	}
	/**
	* Resolves a partial state value with its full representation in the state
	* node's machine.
	*
	* @param stateValue The partial state value to resolve.
	*/
	function resolveStateValue(rootNode, stateValue) {
		return getStateValue(rootNode, [...getAllStateNodes(getStateNodes(rootNode, stateValue))]);
	}
	function isMachineSnapshot(value) {
		return !!value && typeof value === "object" && "machine" in value && "value" in value;
	}
	var machineSnapshotMatches = function matches(testValue) {
		return matchesState(testValue, this.value);
	};
	var machineSnapshotHasTag = function hasTag(tag) {
		return this.tags.has(tag);
	};
	var machineSnapshotCan = function can(event) {
		const transitionData = this.machine.getTransitionData(this, event);
		return !!transitionData?.length && transitionData.some((t) => t.target !== void 0 || t.actions.length);
	};
	var machineSnapshotToJSON = function toJSON() {
		const { _nodes: nodes, tags, machine, getMeta, toJSON, can, hasTag, matches, ...jsonValues } = this;
		return {
			...jsonValues,
			tags: Array.from(tags)
		};
	};
	var machineSnapshotGetMeta = function getMeta() {
		return this._nodes.reduce((acc, stateNode) => {
			if (stateNode.meta !== void 0) acc[stateNode.id] = stateNode.meta;
			return acc;
		}, {});
	};
	function createMachineSnapshot(config, machine) {
		return {
			status: config.status,
			output: config.output,
			error: config.error,
			machine,
			context: config.context,
			_nodes: config._nodes,
			value: getStateValue(machine.root, config._nodes),
			tags: new Set(config._nodes.flatMap((sn) => sn.tags)),
			children: config.children,
			historyValue: config.historyValue || {},
			matches: machineSnapshotMatches,
			hasTag: machineSnapshotHasTag,
			can: machineSnapshotCan,
			getMeta: machineSnapshotGetMeta,
			toJSON: machineSnapshotToJSON
		};
	}
	function cloneMachineSnapshot(snapshot, config = {}) {
		return createMachineSnapshot({
			...snapshot,
			...config
		}, snapshot.machine);
	}
	function serializeHistoryValue(historyValue) {
		if (typeof historyValue !== "object" || historyValue === null) return {};
		const result = {};
		for (const key in historyValue) {
			const value = historyValue[key];
			if (Array.isArray(value)) result[key] = value.map((item) => ({ id: item.id }));
		}
		return result;
	}
	function getPersistedSnapshot(snapshot, options) {
		const { _nodes: nodes, tags, machine, children, context, can, hasTag, matches, getMeta, toJSON, ...jsonValues } = snapshot;
		const childrenJson = {};
		for (const id in children) {
			const child = children[id];
			childrenJson[id] = {
				snapshot: child.getPersistedSnapshot(options),
				src: child.src,
				systemId: child.systemId,
				syncSnapshot: child._syncSnapshot
			};
		}
		return {
			...jsonValues,
			context: persistContext(context),
			children: childrenJson,
			historyValue: serializeHistoryValue(jsonValues.historyValue)
		};
	}
	function persistContext(contextPart) {
		let copy;
		for (const key in contextPart) {
			const value = contextPart[key];
			if (value && typeof value === "object") {
				if ("sessionId" in value && "send" in value && "ref" in value) {
					copy ??= Array.isArray(contextPart) ? contextPart.slice() : { ...contextPart };
					copy[key] = {
						xstate$$type: $$ACTOR_TYPE,
						id: value.id
					};
				} else {
					const result = persistContext(value);
					if (result !== value) {
						copy ??= Array.isArray(contextPart) ? contextPart.slice() : { ...contextPart };
						copy[key] = result;
					}
				}
			}
		}
		return copy ?? contextPart;
	}
	function resolveRaise(_, snapshot, args, actionParams, { event: eventOrExpr, id, delay }, { internalQueue }) {
		const delaysMap = snapshot.machine.implementations.delays;
		if (typeof eventOrExpr === "string") throw new Error(`Only event objects may be used with raise; use raise({ type: "${eventOrExpr}" }) instead`);
		const resolvedEvent = typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr;
		let resolvedDelay;
		if (typeof delay === "string") {
			const configDelay = delaysMap && delaysMap[delay];
			resolvedDelay = typeof configDelay === "function" ? configDelay(args, actionParams) : configDelay;
		} else resolvedDelay = typeof delay === "function" ? delay(args, actionParams) : delay;
		if (typeof resolvedDelay !== "number") internalQueue.push(resolvedEvent);
		return [
			snapshot,
			{
				event: resolvedEvent,
				id,
				delay: resolvedDelay
			},
			void 0
		];
	}
	function executeRaise(actorScope, params) {
		const { event, delay, id } = params;
		if (typeof delay === "number") {
			actorScope.defer(() => {
				const self = actorScope.self;
				actorScope.system.scheduler.schedule(self, self, event, delay, id);
			});
			return;
		}
	}
	/**
	* Raises an event. This places the event in the internal event queue, so that
	* the event is immediately consumed by the machine in the current step.
	*
	* @param eventType The event to raise.
	*/
	function raise(eventOrExpr, options) {
		function raise(_args, _params) {}
		raise.type = "xstate.raise";
		raise.event = eventOrExpr;
		raise.id = options?.id;
		raise.delay = options?.delay;
		raise.resolve = resolveRaise;
		raise.execute = executeRaise;
		return raise;
	}
	exports.$$ACTOR_TYPE = $$ACTOR_TYPE;
	exports.Actor = Actor;
	exports.NULL_EVENT = NULL_EVENT;
	exports.ProcessingStatus = ProcessingStatus;
	exports.STATE_DELIMITER = STATE_DELIMITER;
	exports.XSTATE_ERROR = XSTATE_ERROR;
	exports.XSTATE_STOP = XSTATE_STOP;
	exports.and = and;
	exports.cancel = cancel;
	exports.cloneMachineSnapshot = cloneMachineSnapshot;
	exports.createActor = createActor;
	exports.createErrorActorEvent = createErrorActorEvent;
	exports.createInitEvent = createInitEvent;
	exports.createInvokeId = createInvokeId;
	exports.createMachineSnapshot = createMachineSnapshot;
	exports.createSystem = createSystem;
	exports.evaluateGuard = evaluateGuard;
	exports.formatInitialTransition = formatInitialTransition;
	exports.formatRouteTransitions = formatRouteTransitions;
	exports.formatTransition = formatTransition;
	exports.formatTransitions = formatTransitions;
	exports.getAllOwnEventDescriptors = getAllOwnEventDescriptors;
	exports.getAllStateNodes = getAllStateNodes;
	exports.getCandidates = getCandidates;
	exports.getDelayedTransitions = getDelayedTransitions;
	exports.getPersistedSnapshot = getPersistedSnapshot;
	exports.getProperAncestors = getProperAncestors;
	exports.getStateNodeByPath = getStateNodeByPath;
	exports.getStateNodes = getStateNodes;
	exports.initialMicrostep = initialMicrostep;
	exports.interpret = interpret;
	exports.isAtomicStateNode = isAtomicStateNode;
	exports.isInFinalState = isInFinalState;
	exports.isMachineSnapshot = isMachineSnapshot;
	exports.isStateId = isStateId;
	exports.macrostep = macrostep;
	exports.mapValues = mapValues;
	exports.matchesEventDescriptor = matchesEventDescriptor;
	exports.matchesState = matchesState;
	exports.not = not;
	exports.or = or;
	exports.pathToStateValue = pathToStateValue;
	exports.raise = raise;
	exports.resolveActionsAndContext = resolveActionsAndContext;
	exports.resolveReferencedActor = resolveReferencedActor;
	exports.resolveStateValue = resolveStateValue;
	exports.spawnChild = spawnChild;
	exports.stateIn = stateIn;
	exports.stop = stop;
	exports.stopChild = stopChild;
	exports.toArray = toArray;
	exports.toObserver = toObserver;
	exports.toStatePath = toStatePath;
	exports.toTransitionConfigArray = toTransitionConfigArray;
	exports.transitionNode = transitionNode;
}));
//#endregion
//#region ../../node_modules/.pnpm/xstate@5.32.6/node_modules/xstate/dist/xstate-actors.cjs.js
var require_xstate_actors_cjs = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var dist_xstateGuards = require_raise_a26997bd_cjs();
	require_xstate_dev_cjs();
	/**
	* Represents an actor created by `fromTransition`.
	*
	* The type of `self` within the actor's logic.
	*
	* @example
	*
	* ```ts
	* import {
	*   fromTransition,
	*   createActor,
	*   type AnyActorSystem
	* } from 'xstate';
	*
	* //* The actor's stored context.
	* type Context = {
	*   // The current count.
	*   count: number;
	*   // The amount to increase `count` by.
	*   step: number;
	* };
	* // The events the actor receives.
	* type Event = { type: 'increment' };
	* // The actor's input.
	* type Input = { step?: number };
	*
	* // Actor logic that increments `count` by `step` when it receives an event of
	* // type `increment`.
	* const logic = fromTransition<Context, Event, AnyActorSystem, Input>(
	*   (state, event, actorScope) => {
	*     actorScope.self;
	*     //         ^? TransitionActorRef<Context, Event>
	*
	*     if (event.type === 'increment') {
	*       return {
	*         ...state,
	*         count: state.count + state.step
	*       };
	*     }
	*     return state;
	*   },
	*   ({ input, self }) => {
	*     self;
	*     // ^? TransitionActorRef<Context, Event>
	*
	*     return {
	*       count: 0,
	*       step: input.step ?? 1
	*     };
	*   }
	* );
	*
	* const actor = createActor(logic, { input: { step: 10 } });
	* //    ^? TransitionActorRef<Context, Event>
	* ```
	*
	* @see {@link fromTransition}
	*/
	/**
	* Returns actor logic given a transition function and its initial state.
	*
	* A “transition function” is a function that takes the current `state` and
	* received `event` object as arguments, and returns the next state, similar to
	* a reducer.
	*
	* Actors created from transition logic (“transition actors”) can:
	*
	* - Receive events
	* - Emit snapshots of its state
	*
	* The transition function’s `state` is used as its transition actor’s
	* `context`.
	*
	* Note that the "state" for a transition function is provided by the initial
	* state argument, and is not the same as the State object of an actor or a
	* state within a machine configuration.
	*
	* @example
	*
	* ```ts
	* const transitionLogic = fromTransition(
	*   (state, event) => {
	*     if (event.type === 'increment') {
	*       return {
	*         ...state,
	*         count: state.count + 1
	*       };
	*     }
	*     return state;
	*   },
	*   { count: 0 }
	* );
	*
	* const transitionActor = createActor(transitionLogic);
	* transitionActor.subscribe((snapshot) => {
	*   console.log(snapshot);
	* });
	* transitionActor.start();
	* // => {
	* //   status: 'active',
	* //   context: { count: 0 },
	* //   ...
	* // }
	*
	* transitionActor.send({ type: 'increment' });
	* // => {
	* //   status: 'active',
	* //   context: { count: 1 },
	* //   ...
	* // }
	* ```
	*
	* @param transition The transition function used to describe the transition
	*   logic. It should return the next state given the current state and event.
	*   It receives the following arguments:
	*
	*   - `state` - the current state.
	*   - `event` - the received event.
	*   - `actorScope` - the actor scope object, with properties like `self` and
	*       `system`.
	*
	* @param initialContext The initial state of the transition function, either an
	*   object representing the state, or a function which returns a state object.
	*   If a function, it will receive as its only argument an object with the
	*   following properties:
	*
	*   - `input` - the `input` provided to its parent transition actor.
	*   - `self` - a reference to its parent transition actor.
	*
	* @returns Actor logic
	* @see {@link https://stately.ai/docs/input | Input docs} for more information about how input is passed
	*/
	function fromTransition(transition, initialContext) {
		return {
			config: transition,
			transition: (snapshot, event, actorScope) => {
				return {
					...snapshot,
					context: transition(snapshot.context, event, actorScope)
				};
			},
			getInitialSnapshot: (_, input) => {
				return {
					status: "active",
					output: void 0,
					error: void 0,
					context: typeof initialContext === "function" ? initialContext({ input }) : initialContext
				};
			},
			getPersistedSnapshot: (snapshot) => snapshot,
			restoreSnapshot: (snapshot) => snapshot
		};
	}
	var instanceStates = /* #__PURE__ */ new WeakMap();
	/**
	* Represents an actor created by `fromCallback`.
	*
	* The type of `self` within the actor's logic.
	*
	* @example
	*
	* ```ts
	* import { fromCallback, createActor } from 'xstate';
	*
	* // The events the actor receives.
	* type Event = { type: 'someEvent' };
	* // The actor's input.
	* type Input = { name: string };
	*
	* // Actor logic that logs whenever it receives an event of type `someEvent`.
	* const logic = fromCallback<Event, Input>(({ self, input, receive }) => {
	*   self;
	*   // ^? CallbackActorRef<Event, Input>
	*
	*   receive((event) => {
	*     if (event.type === 'someEvent') {
	*       console.log(`${input.name}: received "someEvent" event`);
	*       // logs 'myActor: received "someEvent" event'
	*     }
	*   });
	* });
	*
	* const actor = createActor(logic, { input: { name: 'myActor' } });
	* //    ^? CallbackActorRef<Event, Input>
	* ```
	*
	* @see {@link fromCallback}
	*/
	/**
	* An actor logic creator which returns callback logic as defined by a callback
	* function.
	*
	* @remarks
	* Useful for subscription-based or other free-form logic that can send events
	* back to the parent actor.
	*
	* Actors created from callback logic (“callback actors”) can:
	*
	* - Receive events via the `receive` function
	* - Send events to the parent actor via the `sendBack` function
	*
	* Callback actors are a bit different from other actors in that they:
	*
	* - Do not work with `onDone`
	* - Do not produce a snapshot using `.getSnapshot()`
	* - Do not emit values when used with `.subscribe()`
	* - Can not be stopped with `.stop()`
	*
	* @example
	*
	* ```typescript
	* const callbackLogic = fromCallback(({ sendBack, receive }) => {
	*   let lockStatus = 'unlocked';
	*
	*   const handler = (event) => {
	*     if (lockStatus === 'locked') {
	*       return;
	*     }
	*     sendBack(event);
	*   };
	*
	*   receive((event) => {
	*     if (event.type === 'lock') {
	*       lockStatus = 'locked';
	*     } else if (event.type === 'unlock') {
	*       lockStatus = 'unlocked';
	*     }
	*   });
	*
	*   document.body.addEventListener('click', handler);
	*
	*   return () => {
	*     document.body.removeEventListener('click', handler);
	*   };
	* });
	* ```
	*
	* @param callback - The callback function used to describe the callback logic
	*   The callback function is passed an object with the following properties:
	*
	*   - `receive` - A function that can send events back to the parent actor; the
	*       listener is then called whenever events are received by the callback
	*       actor
	*   - `sendBack` - A function that can send events back to the parent actor
	*   - `input` - Data that was provided to the callback actor
	*   - `self` - The parent actor of the callback actor
	*   - `system` - The actor system to which the callback actor belongs The callback
	*       function can (optionally) return a cleanup function, which is called
	*       when the actor is stopped.
	*
	* @returns Callback logic
	* @see {@link CallbackLogicFunction} for more information about the callback function and its object argument
	* @see {@link https://stately.ai/docs/input | Input docs} for more information about how input is passed
	*/
	function fromCallback(callback) {
		return {
			config: callback,
			start: (state, actorScope) => {
				const { self, system, emit } = actorScope;
				const callbackState = {
					receivers: void 0,
					dispose: void 0
				};
				instanceStates.set(self, callbackState);
				callbackState.dispose = callback({
					input: state.input,
					system,
					self,
					sendBack: (event) => {
						if (self.getSnapshot().status === "stopped") return;
						if (self._parent) system._relay(self, self._parent, event);
					},
					receive: (listener) => {
						callbackState.receivers ??= /* @__PURE__ */ new Set();
						callbackState.receivers.add(listener);
					},
					emit
				});
			},
			transition: (state, event, actorScope) => {
				const callbackState = instanceStates.get(actorScope.self);
				if (event.type === dist_xstateGuards.XSTATE_STOP) {
					state = {
						...state,
						status: "stopped",
						error: void 0
					};
					instanceStates.delete(actorScope.self);
					callbackState.receivers?.clear();
					callbackState.dispose?.();
					return state;
				}
				callbackState.receivers?.forEach((receiver) => receiver(event));
				return state;
			},
			getInitialSnapshot: (_, input) => {
				return {
					status: "active",
					output: void 0,
					error: void 0,
					input
				};
			},
			getPersistedSnapshot: (snapshot) => snapshot,
			restoreSnapshot: (snapshot) => snapshot
		};
	}
	var XSTATE_OBSERVABLE_NEXT = "xstate.observable.next";
	var XSTATE_OBSERVABLE_ERROR = "xstate.observable.error";
	var XSTATE_OBSERVABLE_COMPLETE = "xstate.observable.complete";
	/**
	* Represents an actor created by `fromObservable` or `fromEventObservable`.
	*
	* The type of `self` within the actor's logic.
	*
	* @example
	*
	* ```ts
	* import { fromObservable, createActor } from 'xstate';
	* import { interval } from 'rxjs';
	*
	* // The type of the value observed by the actor's logic.
	* type Context = number;
	* // The actor's input.
	* type Input = { period?: number };
	*
	* // Actor logic that observes a number incremented every `input.period`
	* // milliseconds (default: 1_000).
	* const logic = fromObservable<Context, Input>(({ input, self }) => {
	*   self;
	*   // ^? ObservableActorRef<Event, Input>
	*
	*   return interval(input.period ?? 1_000);
	* });
	*
	* const actor = createActor(logic, { input: { period: 2_000 } });
	* //    ^? ObservableActorRef<Event, Input>
	* ```
	*
	* @see {@link fromObservable}
	* @see {@link fromEventObservable}
	*/
	/**
	* Observable actor logic is described by an observable stream of values. Actors
	* created from observable logic (“observable actors”) can:
	*
	* - Emit snapshots of the observable’s emitted value
	*
	* The observable’s emitted value is used as its observable actor’s `context`.
	*
	* Sending events to observable actors will have no effect.
	*
	* @example
	*
	* ```ts
	* import { fromObservable, createActor } from 'xstate';
	* import { interval } from 'rxjs';
	*
	* const logic = fromObservable((obj) => interval(1000));
	*
	* const actor = createActor(logic);
	*
	* actor.subscribe((snapshot) => {
	*   console.log(snapshot.context);
	* });
	*
	* actor.start();
	* // At every second:
	* // Logs 0
	* // Logs 1
	* // Logs 2
	* // ...
	* ```
	*
	* @param observableCreator A function that creates an observable. It receives
	*   one argument, an object with the following properties:
	*
	*   - `input` - Data that was provided to the observable actor
	*   - `self` - The parent actor
	*   - `system` - The actor system to which the observable actor belongs
	*
	*   It should return a {@link Subscribable}, which is compatible with an RxJS
	*   Observable, although RxJS is not required to create them.
	* @see {@link https://rxjs.dev} for documentation on RxJS Observable and observable creators.
	* @see {@link Subscribable} interface in XState, which is based on and compatible with RxJS Observable.
	*/
	function fromObservable(observableCreator) {
		return {
			config: observableCreator,
			transition: (snapshot, event) => {
				if (snapshot.status !== "active") return snapshot;
				switch (event.type) {
					case XSTATE_OBSERVABLE_NEXT: return {
						...snapshot,
						context: event.data
					};
					case XSTATE_OBSERVABLE_ERROR: return {
						...snapshot,
						status: "error",
						error: event.data,
						input: void 0,
						_subscription: void 0
					};
					case XSTATE_OBSERVABLE_COMPLETE: return {
						...snapshot,
						status: "done",
						input: void 0,
						_subscription: void 0
					};
					case dist_xstateGuards.XSTATE_STOP:
						snapshot._subscription.unsubscribe();
						return {
							...snapshot,
							status: "stopped",
							input: void 0,
							_subscription: void 0
						};
					default: return snapshot;
				}
			},
			getInitialSnapshot: (_, input) => {
				return {
					status: "active",
					output: void 0,
					error: void 0,
					context: void 0,
					input,
					_subscription: void 0
				};
			},
			start: (state, { self, system, emit }) => {
				if (state.status === "done") return;
				state._subscription = observableCreator({
					input: state.input,
					system,
					self,
					emit
				}).subscribe({
					next: (value) => {
						system._relay(self, self, {
							type: XSTATE_OBSERVABLE_NEXT,
							data: value
						});
					},
					error: (err) => {
						system._relay(self, self, {
							type: XSTATE_OBSERVABLE_ERROR,
							data: err
						});
					},
					complete: () => {
						system._relay(self, self, { type: XSTATE_OBSERVABLE_COMPLETE });
					}
				});
			},
			getPersistedSnapshot: ({ _subscription, ...state }) => state,
			restoreSnapshot: (state) => ({
				...state,
				_subscription: void 0
			})
		};
	}
	/**
	* Creates event observable logic that listens to an observable that delivers
	* event objects.
	*
	* Event observable actor logic is described by an observable stream of
	* {@link https://stately.ai/docs/transitions#event-objects | event objects}.
	* Actors created from event observable logic (“event observable actors”) can:
	*
	* - Implicitly send events to its parent actor
	* - Emit snapshots of its emitted event objects
	*
	* Sending events to event observable actors will have no effect.
	*
	* @example
	*
	* ```ts
	* import {
	*   fromEventObservable,
	*   Subscribable,
	*   EventObject,
	*   createMachine,
	*   createActor
	* } from 'xstate';
	* import { fromEvent } from 'rxjs';
	*
	* const mouseClickLogic = fromEventObservable(
	*   () => fromEvent(document.body, 'click') as Subscribable<EventObject>
	* );
	*
	* const canvasMachine = createMachine({
	*   invoke: {
	*     // Will send mouse `click` events to the canvas actor
	*     src: mouseClickLogic
	*   }
	* });
	*
	* const canvasActor = createActor(canvasMachine);
	* canvasActor.start();
	* ```
	*
	* @param lazyObservable A function that creates an observable that delivers
	*   event objects. It receives one argument, an object with the following
	*   properties:
	*
	*   - `input` - Data that was provided to the event observable actor
	*   - `self` - The parent actor
	*   - `system` - The actor system to which the event observable actor belongs.
	*
	*   It should return a {@link Subscribable}, which is compatible with an RxJS
	*   Observable, although RxJS is not required to create them.
	*/
	function fromEventObservable(lazyObservable) {
		return {
			config: lazyObservable,
			transition: (state, event) => {
				if (state.status !== "active") return state;
				switch (event.type) {
					case XSTATE_OBSERVABLE_ERROR: return {
						...state,
						status: "error",
						error: event.data,
						input: void 0,
						_subscription: void 0
					};
					case XSTATE_OBSERVABLE_COMPLETE: return {
						...state,
						status: "done",
						input: void 0,
						_subscription: void 0
					};
					case dist_xstateGuards.XSTATE_STOP:
						state._subscription.unsubscribe();
						return {
							...state,
							status: "stopped",
							input: void 0,
							_subscription: void 0
						};
					default: return state;
				}
			},
			getInitialSnapshot: (_, input) => {
				return {
					status: "active",
					output: void 0,
					error: void 0,
					context: void 0,
					input,
					_subscription: void 0
				};
			},
			start: (state, { self, system, emit }) => {
				if (state.status === "done") return;
				state._subscription = lazyObservable({
					input: state.input,
					system,
					self,
					emit
				}).subscribe({
					next: (value) => {
						if (self._parent) system._relay(self, self._parent, value);
					},
					error: (err) => {
						system._relay(self, self, {
							type: XSTATE_OBSERVABLE_ERROR,
							data: err
						});
					},
					complete: () => {
						system._relay(self, self, { type: XSTATE_OBSERVABLE_COMPLETE });
					}
				});
			},
			getPersistedSnapshot: ({ _subscription, ...snapshot }) => snapshot,
			restoreSnapshot: (snapshot) => ({
				...snapshot,
				_subscription: void 0
			})
		};
	}
	var XSTATE_PROMISE_RESOLVE = "xstate.promise.resolve";
	var XSTATE_PROMISE_REJECT = "xstate.promise.reject";
	/**
	* Represents an actor created by `fromPromise`.
	*
	* The type of `self` within the actor's logic.
	*
	* @example
	*
	* ```ts
	* import { fromPromise, createActor } from 'xstate';
	*
	* // The actor's resolved output
	* type Output = string;
	* // The actor's input.
	* type Input = { message: string };
	*
	* // Actor logic that fetches the url of an image of a cat saying `input.message`.
	* const logic = fromPromise<Output, Input>(async ({ input, self }) => {
	*   self;
	*   // ^? PromiseActorRef<Output, Input>
	*
	*   const data = await fetch(
	*     `https://cataas.com/cat/says/${input.message}`
	*   );
	*   const url = await data.json();
	*   return url;
	* });
	*
	* const actor = createActor(logic, { input: { message: 'hello world' } });
	* //    ^? PromiseActorRef<Output, Input>
	* ```
	*
	* @see {@link fromPromise}
	*/
	var controllerMap = /* @__PURE__ */ new WeakMap();
	/**
	* An actor logic creator which returns promise logic as defined by an async
	* process that resolves or rejects after some time.
	*
	* Actors created from promise actor logic (“promise actors”) can:
	*
	* - Emit the resolved value of the promise
	* - Output the resolved value of the promise
	*
	* Sending events to promise actors will have no effect.
	*
	* @example
	*
	* ```ts
	* const promiseLogic = fromPromise(async () => {
	*   const result = await fetch('https://example.com/...').then((data) =>
	*     data.json()
	*   );
	*
	*   return result;
	* });
	*
	* const promiseActor = createActor(promiseLogic);
	* promiseActor.subscribe((snapshot) => {
	*   console.log(snapshot);
	* });
	* promiseActor.start();
	* // => {
	* //   output: undefined,
	* //   status: 'active'
	* //   ...
	* // }
	*
	* // After promise resolves
	* // => {
	* //   output: { ... },
	* //   status: 'done',
	* //   ...
	* // }
	* ```
	*
	* @param promiseCreator A function which returns a Promise, and accepts an
	*   object with the following properties:
	*
	*   - `input` - Data that was provided to the promise actor
	*   - `self` - The parent actor of the promise actor
	*   - `system` - The actor system to which the promise actor belongs
	*
	* @see {@link https://stately.ai/docs/input | Input docs} for more information about how input is passed
	*/
	function fromPromise(promiseCreator) {
		return {
			config: promiseCreator,
			transition: (state, event, scope) => {
				if (state.status !== "active") return state;
				switch (event.type) {
					case XSTATE_PROMISE_RESOLVE: {
						const resolvedValue = event.data;
						return {
							...state,
							status: "done",
							output: resolvedValue,
							input: void 0
						};
					}
					case XSTATE_PROMISE_REJECT: return {
						...state,
						status: "error",
						error: event.data,
						input: void 0
					};
					case dist_xstateGuards.XSTATE_STOP:
						controllerMap.get(scope.self)?.abort();
						controllerMap.delete(scope.self);
						return {
							...state,
							status: "stopped",
							input: void 0
						};
					default: return state;
				}
			},
			start: (state, { self, system, emit }) => {
				if (state.status !== "active") return;
				const controller = new AbortController();
				controllerMap.set(self, controller);
				Promise.resolve(promiseCreator({
					input: state.input,
					system,
					self,
					signal: controller.signal,
					emit
				})).then((response) => {
					if (self.getSnapshot().status !== "active") return;
					controllerMap.delete(self);
					system._relay(self, self, {
						type: XSTATE_PROMISE_RESOLVE,
						data: response
					});
				}, (errorData) => {
					if (self.getSnapshot().status !== "active") return;
					controllerMap.delete(self);
					system._relay(self, self, {
						type: XSTATE_PROMISE_REJECT,
						data: errorData
					});
				});
			},
			getInitialSnapshot: (_, input) => {
				return {
					status: "active",
					output: void 0,
					error: void 0,
					input
				};
			},
			getPersistedSnapshot: (snapshot) => snapshot,
			restoreSnapshot: (snapshot) => snapshot
		};
	}
	var emptyLogic = fromTransition((_) => void 0, void 0);
	function createEmptyActor() {
		return dist_xstateGuards.createActor(emptyLogic);
	}
	exports.createEmptyActor = createEmptyActor;
	exports.fromCallback = fromCallback;
	exports.fromEventObservable = fromEventObservable;
	exports.fromObservable = fromObservable;
	exports.fromPromise = fromPromise;
	exports.fromTransition = fromTransition;
}));
//#endregion
//#region ../../node_modules/.pnpm/xstate@5.32.6/node_modules/xstate/dist/assign-d3f33159.cjs.js
var require_assign_d3f33159_cjs = /* @__PURE__ */ __commonJSMin(((exports) => {
	var dist_xstateGuards = require_raise_a26997bd_cjs();
	function createSpawner(actorScope, { machine, context }, event, spawnedChildren) {
		const spawn = (src, options) => {
			if (typeof src === "string") {
				const logic = dist_xstateGuards.resolveReferencedActor(machine, src);
				if (!logic) throw new Error(`Actor logic '${src}' not implemented in machine '${machine.id}'`);
				const actorRef = dist_xstateGuards.createActor(logic, {
					id: options?.id,
					parent: actorScope.self,
					syncSnapshot: options?.syncSnapshot,
					input: typeof options?.input === "function" ? options.input({
						context,
						event,
						self: actorScope.self
					}) : options?.input,
					src,
					systemId: options?.systemId
				});
				spawnedChildren[actorRef.id] = actorRef;
				return actorRef;
			} else return dist_xstateGuards.createActor(src, {
				id: options?.id,
				parent: actorScope.self,
				syncSnapshot: options?.syncSnapshot,
				input: options?.input,
				src,
				systemId: options?.systemId
			});
		};
		return (src, options) => {
			const actorRef = spawn(src, options);
			spawnedChildren[actorRef.id] = actorRef;
			actorScope.defer(() => {
				if (actorRef._processingStatus === dist_xstateGuards.ProcessingStatus.Stopped) return;
				actorRef.start();
			});
			return actorRef;
		};
	}
	function resolveAssign(actorScope, snapshot, actionArgs, actionParams, { assignment }) {
		if (!snapshot.context) throw new Error("Cannot assign to undefined `context`. Ensure that `context` is defined in the machine config.");
		const spawnedChildren = {};
		const assignArgs = {
			context: snapshot.context,
			event: actionArgs.event,
			spawn: createSpawner(actorScope, snapshot, actionArgs.event, spawnedChildren),
			self: actorScope.self,
			system: actorScope.system
		};
		let partialUpdate = {};
		if (typeof assignment === "function") partialUpdate = assignment(assignArgs, actionParams);
		else for (const key of Object.keys(assignment)) {
			const propAssignment = assignment[key];
			partialUpdate[key] = typeof propAssignment === "function" ? propAssignment(assignArgs, actionParams) : propAssignment;
		}
		const updatedContext = Object.assign({}, snapshot.context, partialUpdate);
		return [
			dist_xstateGuards.cloneMachineSnapshot(snapshot, {
				context: updatedContext,
				children: Object.keys(spawnedChildren).length ? {
					...snapshot.children,
					...spawnedChildren
				} : snapshot.children
			}),
			void 0,
			void 0
		];
	}
	/**
	* Updates the current context of the machine.
	*
	* @example
	*
	* ```ts
	* import { createMachine, assign } from 'xstate';
	*
	* const countMachine = createMachine({
	*   context: {
	*     count: 0,
	*     message: ''
	*   },
	*   on: {
	*     inc: {
	*       actions: assign({
	*         count: ({ context }) => context.count + 1
	*       })
	*     },
	*     updateMessage: {
	*       actions: assign(({ context, event }) => {
	*         return {
	*           message: event.message.trim()
	*         };
	*       })
	*     }
	*   }
	* });
	* ```
	*
	* @param assignment An object that represents the partial context to update, or
	*   a function that returns an object that represents the partial context to
	*   update.
	*/
	function assign(assignment) {
		function assign(_args, _params) {}
		assign.type = "xstate.assign";
		assign.assignment = assignment;
		assign.resolve = resolveAssign;
		return assign;
	}
	exports.assign = assign;
}));
//#endregion
//#region ../../node_modules/.pnpm/xstate@5.32.6/node_modules/xstate/dist/StateMachine-3f520def.cjs.js
var require_StateMachine_3f520def_cjs = /* @__PURE__ */ __commonJSMin(((exports) => {
	var dist_xstateGuards = require_raise_a26997bd_cjs();
	var assign = require_assign_d3f33159_cjs();
	var cache = /* @__PURE__ */ new WeakMap();
	function memo(object, key, fn) {
		let memoizedData = cache.get(object);
		if (!memoizedData) {
			memoizedData = { [key]: fn() };
			cache.set(object, memoizedData);
		} else if (!(key in memoizedData)) memoizedData[key] = fn();
		return memoizedData[key];
	}
	var EMPTY_OBJECT = {};
	var toSerializableAction = (action) => {
		if (typeof action === "string") return { type: action };
		if (typeof action === "function") {
			if ("resolve" in action) return { type: action.type };
			return { type: action.name };
		}
		return action;
	};
	var StateNode = class StateNode {
		constructor(config, options) {
			this.config = config;
			/**
			* The relative key of the state node, which represents its location in the
			* overall state value.
			*/
			this.key = void 0;
			/** The unique ID of the state node. */
			this.id = void 0;
			/**
			* The type of this state node:
			*
			* - `'atomic'` - no child state nodes
			* - `'compound'` - nested child state nodes (XOR)
			* - `'parallel'` - orthogonal nested child state nodes (AND)
			* - `'history'` - history state node
			* - `'final'` - final state node
			*/
			this.type = void 0;
			/** The string path from the root machine node to this node. */
			this.path = void 0;
			/** The child state nodes. */
			this.states = void 0;
			/**
			* The type of history on this state node. Can be:
			*
			* - `'shallow'` - recalls only top-level historical state value
			* - `'deep'` - recalls historical state value at all levels
			*/
			this.history = void 0;
			/** The action(s) to be executed upon entering the state node. */
			this.entry = void 0;
			/** The action(s) to be executed upon exiting the state node. */
			this.exit = void 0;
			/** The parent state node. */
			this.parent = void 0;
			/** The root machine node. */
			this.machine = void 0;
			/**
			* The meta data associated with this state node, which will be returned in
			* State instances.
			*/
			this.meta = void 0;
			/**
			* The output data sent with the "xstate.done.state._id_" event if this is a
			* final state node.
			*/
			this.output = void 0;
			/**
			* The order this state node appears. Corresponds to the implicit document
			* order.
			*/
			this.order = -1;
			this.description = void 0;
			this.tags = [];
			this.transitions = void 0;
			this.always = void 0;
			this.parent = options._parent;
			this.key = options._key;
			this.machine = options._machine;
			this.path = this.parent ? this.parent.path.concat(this.key) : [];
			this.id = this.config.id || [this.machine.id, ...this.path].join(dist_xstateGuards.STATE_DELIMITER);
			this.type = this.config.type || (this.config.states && Object.keys(this.config.states).length ? "compound" : this.config.history ? "history" : "atomic");
			this.description = this.config.description;
			this.order = this.machine.idMap.size;
			this.machine.idMap.set(this.id, this);
			this.states = this.config.states ? dist_xstateGuards.mapValues(this.config.states, (stateConfig, key) => {
				return new StateNode(stateConfig, {
					_parent: this,
					_key: key,
					_machine: this.machine
				});
			}) : EMPTY_OBJECT;
			if (this.type === "compound" && !this.config.initial) throw new Error(`No initial state specified for compound state node "#${this.id}". Try adding { initial: "${Object.keys(this.states)[0]}" } to the state config.`);
			this.history = this.config.history === true ? "shallow" : this.config.history || false;
			this.entry = dist_xstateGuards.toArray(this.config.entry).slice();
			this.exit = dist_xstateGuards.toArray(this.config.exit).slice();
			this.meta = this.config.meta;
			this.output = this.type === "final" || !this.parent ? this.config.output : void 0;
			this.tags = dist_xstateGuards.toArray(config.tags).slice();
		}
		/** @internal */
		_initialize() {
			this.transitions = dist_xstateGuards.formatTransitions(this);
			if (this.config.always) this.always = dist_xstateGuards.toTransitionConfigArray(this.config.always).map((t) => dist_xstateGuards.formatTransition(this, dist_xstateGuards.NULL_EVENT, t));
			Object.keys(this.states).forEach((key) => {
				this.states[key]._initialize();
			});
		}
		/** The well-structured state node definition. */
		get definition() {
			return {
				id: this.id,
				key: this.key,
				version: this.machine.version,
				type: this.type,
				initial: this.initial ? {
					target: this.initial.target,
					source: this,
					actions: this.initial.actions.map(toSerializableAction),
					eventType: null,
					reenter: false,
					toJSON: () => ({
						target: this.initial.target.map((t) => `#${t.id}`),
						source: `#${this.id}`,
						actions: this.initial.actions.map(toSerializableAction),
						eventType: null
					})
				} : void 0,
				history: this.history,
				states: dist_xstateGuards.mapValues(this.states, (state) => {
					return state.definition;
				}),
				on: this.on,
				transitions: [...this.transitions.values()].flat().map((t) => ({
					...t,
					actions: t.actions.map(toSerializableAction)
				})),
				entry: this.entry.map(toSerializableAction),
				exit: this.exit.map(toSerializableAction),
				meta: this.meta,
				order: this.order || -1,
				output: this.output,
				invoke: this.invoke,
				description: this.description,
				tags: this.tags
			};
		}
		/** @internal */
		toJSON() {
			return this.definition;
		}
		/** The logic invoked as actors by this state node. */
		get invoke() {
			return memo(this, "invoke", () => dist_xstateGuards.toArray(this.config.invoke).map((invokeConfig, i) => {
				const { src, systemId } = invokeConfig;
				const resolvedId = invokeConfig.id ?? dist_xstateGuards.createInvokeId(this.id, i);
				const sourceName = typeof src === "string" ? src : `xstate.invoke.${dist_xstateGuards.createInvokeId(this.id, i)}`;
				return {
					...invokeConfig,
					src: sourceName,
					id: resolvedId,
					systemId,
					toJSON() {
						const { onDone, onError, ...invokeDefValues } = invokeConfig;
						return {
							...invokeDefValues,
							type: "xstate.invoke",
							src: sourceName,
							id: resolvedId
						};
					}
				};
			}));
		}
		/** The mapping of events to transitions. */
		get on() {
			return memo(this, "on", () => {
				return [...this.transitions].flatMap(([descriptor, t]) => t.map((t) => [descriptor, t])).reduce((map, [descriptor, transition]) => {
					map[descriptor] = map[descriptor] || [];
					map[descriptor].push(transition);
					return map;
				}, {});
			});
		}
		get after() {
			return memo(this, "delayedTransitions", () => dist_xstateGuards.getDelayedTransitions(this));
		}
		get initial() {
			return memo(this, "initial", () => dist_xstateGuards.formatInitialTransition(this, this.config.initial));
		}
		/** @internal */
		next(snapshot, event) {
			const eventType = event.type;
			const actions = [];
			let selectedTransition;
			const candidates = memo(this, `candidates-${eventType}`, () => dist_xstateGuards.getCandidates(this, eventType));
			for (const candidate of candidates) {
				const { guard } = candidate;
				const resolvedContext = snapshot.context;
				let guardPassed = false;
				try {
					guardPassed = !guard || dist_xstateGuards.evaluateGuard(guard, resolvedContext, event, snapshot);
				} catch (err) {
					const guardType = typeof guard === "string" ? guard : typeof guard === "object" ? guard.type : void 0;
					throw new Error(`Unable to evaluate guard ${guardType ? `'${guardType}' ` : ""}in transition for event '${eventType}' in state node '${this.id}':\n${err.message}`);
				}
				if (guardPassed) {
					actions.push(...candidate.actions);
					selectedTransition = candidate;
					break;
				}
			}
			return selectedTransition ? [selectedTransition] : void 0;
		}
		/** All the event types accepted by this state node and its descendants. */
		get events() {
			return memo(this, "events", () => {
				const { states } = this;
				const events = new Set(this.ownEvents);
				if (states) for (const stateId of Object.keys(states)) {
					const state = states[stateId];
					if (state.states) for (const event of state.events) events.add(`${event}`);
				}
				return Array.from(events);
			});
		}
		/**
		* All the events that have transitions directly from this state node.
		*
		* Excludes any inert events.
		*/
		get ownEvents() {
			const keys = Object.keys(Object.fromEntries(this.transitions));
			const events = new Set(keys.filter((descriptor) => {
				return this.transitions.get(descriptor).some((transition) => !(!transition.target && !transition.actions.length && !transition.reenter));
			}));
			return Array.from(events);
		}
	};
	exports.StateMachine = class StateMachine {
		constructor(config, implementations) {
			this.config = config;
			/** The machine's own version. */
			this.version = void 0;
			this.schemas = void 0;
			this.implementations = void 0;
			/** Runtime options for machine execution. */
			this.options = void 0;
			/** @internal */
			this.__xstatenode = true;
			/** @internal */
			this.idMap = /* @__PURE__ */ new Map();
			this.root = void 0;
			this.id = void 0;
			this.states = void 0;
			this.events = void 0;
			this.id = config.id || "(machine)";
			this.implementations = {
				actors: implementations?.actors ?? {},
				actions: implementations?.actions ?? {},
				delays: implementations?.delays ?? {},
				guards: implementations?.guards ?? {}
			};
			this.version = this.config.version;
			this.schemas = this.config.schemas;
			this.options = {
				maxIterations: Infinity,
				...this.config.options
			};
			this.transition = this.transition.bind(this);
			this.getInitialSnapshot = this.getInitialSnapshot.bind(this);
			this.getPersistedSnapshot = this.getPersistedSnapshot.bind(this);
			this.restoreSnapshot = this.restoreSnapshot.bind(this);
			this.start = this.start.bind(this);
			this.root = new StateNode(config, {
				_key: this.id,
				_machine: this
			});
			this.root._initialize();
			dist_xstateGuards.formatRouteTransitions(this.root);
			this.states = this.root.states;
			this.events = this.root.events;
		}
		/**
		* Clones this state machine with the provided implementations.
		*
		* @param implementations Options (`actions`, `guards`, `actors`, `delays`) to
		*   recursively merge with the existing options.
		* @returns A new `StateMachine` instance with the provided implementations.
		*/
		provide(implementations) {
			const { actions, guards, actors, delays } = this.implementations;
			return new StateMachine(this.config, {
				actions: {
					...actions,
					...implementations.actions
				},
				guards: {
					...guards,
					...implementations.guards
				},
				actors: {
					...actors,
					...implementations.actors
				},
				delays: {
					...delays,
					...implementations.delays
				}
			});
		}
		resolveState(config) {
			const resolvedStateValue = dist_xstateGuards.resolveStateValue(this.root, config.value);
			const nodeSet = dist_xstateGuards.getAllStateNodes(dist_xstateGuards.getStateNodes(this.root, resolvedStateValue));
			return dist_xstateGuards.createMachineSnapshot({
				_nodes: [...nodeSet],
				context: config.context || {},
				children: {},
				status: dist_xstateGuards.isInFinalState(nodeSet, this.root) ? "done" : config.status || "active",
				output: config.output,
				error: config.error,
				historyValue: config.historyValue
			}, this);
		}
		/**
		* Determines the next snapshot given the current `snapshot` and received
		* `event`. Calculates a full macrostep from all microsteps.
		*
		* @param snapshot The current snapshot
		* @param event The received event
		*/
		transition(snapshot, event, actorScope) {
			return dist_xstateGuards.macrostep(snapshot, event, actorScope, []).snapshot;
		}
		/**
		* Determines the next state given the current `state` and `event`. Calculates
		* a microstep.
		*
		* @param state The current state
		* @param event The received event
		*/
		microstep(snapshot, event, actorScope) {
			return dist_xstateGuards.macrostep(snapshot, event, actorScope, []).microsteps.map(([s]) => s);
		}
		getTransitionData(snapshot, event) {
			return dist_xstateGuards.transitionNode(this.root, snapshot.value, snapshot, event) || [];
		}
		/**
		* The initial state _before_ evaluating any microsteps. This "pre-initial"
		* state is provided to initial actions executed in the initial state.
		*
		* @internal
		*/
		_getPreInitialState(actorScope, initEvent, internalQueue) {
			const { context } = this.config;
			const preInitial = dist_xstateGuards.createMachineSnapshot({
				context: typeof context !== "function" && context ? context : {},
				_nodes: [this.root],
				children: {},
				status: "active"
			}, this);
			if (typeof context === "function") {
				const assignment = ({ spawn, event, self }) => context({
					spawn,
					input: event.input,
					self
				});
				return dist_xstateGuards.resolveActionsAndContext(preInitial, initEvent, actorScope, [assign.assign(assignment)], internalQueue, void 0);
			}
			return preInitial;
		}
		/**
		* Returns the initial `State` instance, with reference to `self` as an
		* `ActorRef`.
		*/
		getInitialSnapshot(actorScope, input) {
			const initEvent = dist_xstateGuards.createInitEvent(input);
			const internalQueue = [];
			let snapshot = dist_xstateGuards.createMachineSnapshot({
				context: typeof this.config.context !== "function" && this.config.context ? this.config.context : {},
				_nodes: [this.root],
				children: {},
				status: "active"
			}, this);
			try {
				snapshot = this._getPreInitialState(actorScope, initEvent, internalQueue);
				const [nextState] = dist_xstateGuards.initialMicrostep(this.root, snapshot, actorScope, initEvent, internalQueue);
				const { snapshot: macroState } = dist_xstateGuards.macrostep(nextState, initEvent, actorScope, internalQueue);
				return macroState;
			} catch (error) {
				return dist_xstateGuards.cloneMachineSnapshot(snapshot, {
					status: "error",
					error
				});
			}
		}
		start(snapshot) {
			Object.values(snapshot.children).forEach((child) => {
				if (child.getSnapshot().status === "active") child.start();
			});
		}
		getStateNodeById(stateId) {
			const fullPath = dist_xstateGuards.toStatePath(stateId);
			const relativePath = fullPath.slice(1);
			const resolvedStateId = dist_xstateGuards.isStateId(fullPath[0]) ? fullPath[0].slice(1) : fullPath[0];
			const stateNode = this.idMap.get(resolvedStateId);
			if (!stateNode) throw new Error(`Child state node '#${resolvedStateId}' does not exist on machine '${this.id}'`);
			return dist_xstateGuards.getStateNodeByPath(stateNode, relativePath);
		}
		get definition() {
			return this.root.definition;
		}
		toJSON() {
			return this.definition;
		}
		getPersistedSnapshot(snapshot, options) {
			return dist_xstateGuards.getPersistedSnapshot(snapshot, options);
		}
		restoreSnapshot(snapshot, _actorScope) {
			const children = {};
			const snapshotChildren = snapshot.children;
			Object.keys(snapshotChildren).forEach((actorId) => {
				const actorData = snapshotChildren[actorId];
				const childState = actorData.snapshot;
				const src = actorData.src;
				const logic = typeof src === "string" ? dist_xstateGuards.resolveReferencedActor(this, src) : src;
				if (!logic) return;
				const actorRef = dist_xstateGuards.createActor(logic, {
					id: actorId,
					parent: _actorScope.self,
					syncSnapshot: actorData.syncSnapshot,
					snapshot: childState,
					src,
					systemId: actorData.systemId
				});
				children[actorId] = actorRef;
			});
			function resolveHistoryReferencedState(root, referenced) {
				if (referenced instanceof StateNode) return referenced;
				try {
					return root.machine.getStateNodeById(referenced.id);
				} catch {}
			}
			function reviveHistoryValue(root, historyValue) {
				if (!historyValue || typeof historyValue !== "object") return {};
				const revived = {};
				for (const key in historyValue) {
					const arr = historyValue[key];
					for (const item of arr) {
						const resolved = resolveHistoryReferencedState(root, item);
						if (!resolved) continue;
						revived[key] ??= [];
						revived[key].push(resolved);
					}
				}
				return revived;
			}
			const revivedHistoryValue = reviveHistoryValue(this.root, snapshot.historyValue);
			const restoredSnapshot = dist_xstateGuards.createMachineSnapshot({
				...snapshot,
				children,
				_nodes: Array.from(dist_xstateGuards.getAllStateNodes(dist_xstateGuards.getStateNodes(this.root, snapshot.value))),
				historyValue: revivedHistoryValue
			}, this);
			const seen = /* @__PURE__ */ new Set();
			function reviveContext(contextPart, children) {
				if (seen.has(contextPart)) return;
				seen.add(contextPart);
				for (const key in contextPart) {
					const value = contextPart[key];
					if (value && typeof value === "object") {
						if ("xstate$$type" in value && value.xstate$$type === dist_xstateGuards.$$ACTOR_TYPE) {
							contextPart[key] = children[value.id];
							continue;
						}
						reviveContext(value, children);
					}
				}
			}
			reviveContext(restoredSnapshot.context, children);
			return restoredSnapshot;
		}
	};
	exports.StateNode = StateNode;
}));
//#endregion
//#region ../../node_modules/.pnpm/xstate@5.32.6/node_modules/xstate/dist/log-3beea04f.cjs.js
var require_log_3beea04f_cjs = /* @__PURE__ */ __commonJSMin(((exports) => {
	var dist_xstateGuards = require_raise_a26997bd_cjs();
	var assign = require_assign_d3f33159_cjs();
	function resolveEmit(_, snapshot, args, actionParams, { event: eventOrExpr }) {
		return [
			snapshot,
			{ event: typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr },
			void 0
		];
	}
	function executeEmit(actorScope, { event }) {
		actorScope.defer(() => actorScope.emit(event));
	}
	/**
	* Emits an event to event handlers registered on the actor via `actor.on(event,
	* handler)`.
	*
	* @example
	*
	* ```ts
	* import { emit } from 'xstate';
	*
	* const machine = createMachine({
	*   // ...
	*   on: {
	*     something: {
	*       actions: emit({
	*         type: 'emitted',
	*         some: 'data'
	*       })
	*     }
	*   }
	*   // ...
	* });
	*
	* const actor = createActor(machine).start();
	*
	* actor.on('emitted', (event) => {
	*   console.log(event);
	* });
	*
	* actor.send({ type: 'something' });
	* // logs:
	* // {
	* //   type: 'emitted',
	* //   some: 'data'
	* // }
	* ```
	*/
	function emit(eventOrExpr) {
		function emit(_args, _params) {}
		emit.type = "xstate.emit";
		emit.event = eventOrExpr;
		emit.resolve = resolveEmit;
		emit.execute = executeEmit;
		return emit;
	}
	/**
	* @remarks
	* `T | unknown` reduces to `unknown` and that can be problematic when it comes
	* to contextual typing. It especially is a problem when the union has a
	* function member, like here:
	*
	* ```ts
	* declare function test(
	*   cbOrVal: ((arg: number) => unknown) | unknown
	* ): void;
	* test((arg) => {}); // oops, implicit any
	* ```
	*
	* This type can be used to avoid this problem. This union represents the same
	* value space as `unknown`.
	*/
	/** @deprecated Use the built-in `NoInfer` type instead */
	/** The full definition of an event, with a string `type`. */
	/**
	* The string or object representing the state value relative to the parent
	* state node.
	*
	* @remarks
	* - For a child atomic state node, this is a string, e.g., `"pending"`.
	* - For complex state nodes, this is an object, e.g., `{ success:
	*   "someChildState" }`.
	*/
	/** @deprecated Use `AnyMachineSnapshot` instead */
	/** @ignore */
	/**
	* Runtime options for state machine execution.
	*
	* @example
	*
	* ```ts
	* const machine = createMachine({
	*   // ... machine config
	*   options: {
	*     maxIterations: 5000
	*     // other runtime options can be added here
	*   }
	* });
	* ```
	*/
	var SpecialTargets = /*#__PURE__*/ function(SpecialTargets) {
		SpecialTargets["Parent"] = "#_parent";
		SpecialTargets["Internal"] = "#_internal";
		return SpecialTargets;
	}({});
	/** @deprecated Use `AnyActor` instead. */
	/** @deprecated Use `Actor<T>` instead. */
	/**
	* Represents logic which can be used by an actor.
	*
	* @template TSnapshot - The type of the snapshot.
	* @template TEvent - The type of the event object.
	* @template TInput - The type of the input.
	* @template TSystem - The type of the actor system.
	*/
	/** @deprecated */
	function resolveSendTo(actorScope, snapshot, args, actionParams, { to, event: eventOrExpr, id, delay }, extra) {
		const delaysMap = snapshot.machine.implementations.delays;
		if (typeof eventOrExpr === "string") throw new Error(`Only event objects may be used with sendTo; use sendTo({ type: "${eventOrExpr}" }) instead`);
		const resolvedEvent = typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr;
		let resolvedDelay;
		if (typeof delay === "string") {
			const configDelay = delaysMap && delaysMap[delay];
			resolvedDelay = typeof configDelay === "function" ? configDelay(args, actionParams) : configDelay;
		} else resolvedDelay = typeof delay === "function" ? delay(args, actionParams) : delay;
		const resolvedTarget = typeof to === "function" ? to(args, actionParams) : to;
		let targetActorRef;
		if (typeof resolvedTarget === "string") {
			if (resolvedTarget === SpecialTargets.Parent) targetActorRef = actorScope.self._parent;
			else if (resolvedTarget === SpecialTargets.Internal) targetActorRef = actorScope.self;
			else if (resolvedTarget.startsWith("#_")) targetActorRef = snapshot.children[resolvedTarget.slice(2)];
			else targetActorRef = extra.deferredActorIds?.includes(resolvedTarget) ? resolvedTarget : snapshot.children[resolvedTarget];
			if (!targetActorRef) throw new Error(`Unable to send event to actor '${resolvedTarget}' from machine '${snapshot.machine.id}'.`);
		} else targetActorRef = resolvedTarget || actorScope.self;
		return [
			snapshot,
			{
				to: targetActorRef,
				targetId: typeof resolvedTarget === "string" ? resolvedTarget : void 0,
				event: resolvedEvent,
				id,
				delay: resolvedDelay
			},
			void 0
		];
	}
	function retryResolveSendTo(_, snapshot, params) {
		if (typeof params.to === "string") params.to = snapshot.children[params.to];
	}
	function executeSendTo(actorScope, params) {
		actorScope.defer(() => {
			const { to, event, delay, id } = params;
			if (typeof delay === "number") {
				actorScope.system.scheduler.schedule(actorScope.self, to, event, delay, id);
				return;
			}
			actorScope.system._relay(actorScope.self, to, event.type === dist_xstateGuards.XSTATE_ERROR ? dist_xstateGuards.createErrorActorEvent(actorScope.self.id, event.data) : event);
		});
	}
	/**
	* Sends an event to an actor.
	*
	* @param actor The `ActorRef` to send the event to.
	* @param event The event to send, or an expression that evaluates to the event
	*   to send
	* @param options Send action options
	*
	*   - `id` - The unique send event identifier (used with `cancel()`).
	*   - `delay` - The number of milliseconds to delay the sending of the event.
	*/
	function sendTo(to, eventOrExpr, options) {
		function sendTo(_args, _params) {}
		sendTo.type = "xstate.sendTo";
		sendTo.to = to;
		sendTo.event = eventOrExpr;
		sendTo.id = options?.id;
		sendTo.delay = options?.delay;
		sendTo.resolve = resolveSendTo;
		sendTo.retryResolve = retryResolveSendTo;
		sendTo.execute = executeSendTo;
		return sendTo;
	}
	/**
	* Sends an event to this machine's parent.
	*
	* @param event The event to send to the parent machine.
	* @param options Options to pass into the send event.
	*/
	function sendParent(event, options) {
		return sendTo(SpecialTargets.Parent, event, options);
	}
	/**
	* Forwards (sends) an event to the `target` actor.
	*
	* @param target The target actor to forward the event to.
	* @param options Options to pass into the send action creator.
	*/
	function forwardTo(target, options) {
		return sendTo(target, ({ event }) => event, options);
	}
	function resolveEnqueueActions(actorScope, snapshot, args, actionParams, { collect }) {
		const actions = [];
		const enqueue = function enqueue(action) {
			actions.push(action);
		};
		enqueue.assign = (...args) => {
			actions.push(assign.assign(...args));
		};
		enqueue.cancel = (...args) => {
			actions.push(dist_xstateGuards.cancel(...args));
		};
		enqueue.raise = (...args) => {
			actions.push(dist_xstateGuards.raise(...args));
		};
		enqueue.sendTo = (...args) => {
			actions.push(sendTo(...args));
		};
		enqueue.sendParent = (...args) => {
			actions.push(sendParent(...args));
		};
		enqueue.spawnChild = (...args) => {
			actions.push(dist_xstateGuards.spawnChild(...args));
		};
		enqueue.stopChild = (...args) => {
			actions.push(dist_xstateGuards.stopChild(...args));
		};
		enqueue.emit = (...args) => {
			actions.push(emit(...args));
		};
		collect({
			context: args.context,
			event: args.event,
			enqueue,
			check: (guard) => dist_xstateGuards.evaluateGuard(guard, snapshot.context, args.event, snapshot),
			self: actorScope.self,
			system: actorScope.system
		}, actionParams);
		return [
			snapshot,
			void 0,
			actions
		];
	}
	/**
	* Creates an action object that will execute actions that are queued by the
	* `enqueue(action)` function.
	*
	* @example
	*
	* ```ts
	* import { createMachine, enqueueActions } from 'xstate';
	*
	* const machine = createMachine({
	*   entry: enqueueActions(({ enqueue, check }) => {
	*     enqueue.assign({ count: 0 });
	*
	*     if (check('someGuard')) {
	*       enqueue.assign({ count: 1 });
	*     }
	*
	*     enqueue('someAction');
	*   })
	* });
	* ```
	*/
	function enqueueActions(collect) {
		function enqueueActions(_args, _params) {}
		enqueueActions.type = "xstate.enqueueActions";
		enqueueActions.collect = collect;
		enqueueActions.resolve = resolveEnqueueActions;
		return enqueueActions;
	}
	function resolveLog(_, snapshot, actionArgs, actionParams, { value, label }) {
		return [
			snapshot,
			{
				value: typeof value === "function" ? value(actionArgs, actionParams) : value,
				label
			},
			void 0
		];
	}
	function executeLog({ logger }, { value, label }) {
		if (label) logger(label, value);
		else logger(value);
	}
	/**
	* @param expr The expression function to evaluate which will be logged. Takes
	*   in 2 arguments:
	*
	*   - `ctx` - the current state context
	*   - `event` - the event that caused this action to be executed.
	*
	* @param label The label to give to the logged expression.
	*/
	function log(value = ({ context, event }) => ({
		context,
		event
	}), label) {
		function log(_args, _params) {}
		log.type = "xstate.log";
		log.value = value;
		log.label = label;
		log.resolve = resolveLog;
		log.execute = executeLog;
		return log;
	}
	exports.SpecialTargets = SpecialTargets;
	exports.emit = emit;
	exports.enqueueActions = enqueueActions;
	exports.forwardTo = forwardTo;
	exports.log = log;
	exports.sendParent = sendParent;
	exports.sendTo = sendTo;
}));
//#endregion
//#region ../../node_modules/.pnpm/xstate@5.32.6/node_modules/xstate/dist/xstate.cjs.js
var require_xstate_cjs = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var dist_xstateActors = require_xstate_actors_cjs();
	var dist_xstateGuards = require_raise_a26997bd_cjs();
	var StateMachine = require_StateMachine_3f520def_cjs();
	var assign = require_assign_d3f33159_cjs();
	var log = require_log_3beea04f_cjs();
	require_xstate_dev_cjs();
	/**
	* Asserts that the given event object is of the specified type or types. Throws
	* an error if the event object is not of the specified types.
	*
	* @example
	*
	* ```ts
	* // ...
	* entry: ({ event }) => {
	*   assertEvent(event, 'doNothing');
	*   // event is { type: 'doNothing' }
	* },
	* // ...
	* exit: ({ event }) => {
	*   assertEvent(event, 'greet');
	*   // event is { type: 'greet'; message: string }
	*
	*   assertEvent(event, ['greet', 'notify']);
	*   // event is { type: 'greet'; message: string }
	*   // or { type: 'notify'; message: string; level: 'info' | 'error' }
	* },
	* ```
	*/
	function assertEvent(event, type) {
		const types = dist_xstateGuards.toArray(type);
		if (!types.some((descriptor) => dist_xstateGuards.matchesEventDescriptor(event.type, descriptor))) {
			const typesText = types.length === 1 ? `type matching "${types[0]}"` : `one of types matching "${types.join("\", \"")}"`;
			throw new Error(`Expected event ${JSON.stringify(event)} to have ${typesText}`);
		}
	}
	/**
	* Creates a state machine (statechart) with the given configuration.
	*
	* The state machine represents the pure logic of a state machine actor.
	*
	* @example
	*
	* ```ts
	* import { createMachine } from 'xstate';
	*
	* const lightMachine = createMachine({
	*   id: 'light',
	*   initial: 'green',
	*   states: {
	*     green: {
	*       on: {
	*         TIMER: { target: 'yellow' }
	*       }
	*     },
	*     yellow: {
	*       on: {
	*         TIMER: { target: 'red' }
	*       }
	*     },
	*     red: {
	*       on: {
	*         TIMER: { target: 'green' }
	*       }
	*     }
	*   }
	* });
	*
	* const lightActor = createActor(lightMachine);
	* lightActor.start();
	*
	* lightActor.send({ type: 'TIMER' });
	* ```
	*
	* @param config The state machine configuration.
	* @param options DEPRECATED: use `setup({ ... })` or `machine.provide({ ... })`
	*   to provide machine implementations instead.
	*/
	function createMachine(config, implementations) {
		return new StateMachine.StateMachine(config, implementations);
	}
	/**
	* A mapper object that defines how to transform a snapshot based on its state.
	* Can be nested to match the state hierarchy of the machine.
	*/
	/**
	* Maps a machine snapshot to an array of result objects based on active states.
	*
	* Traverses all active state nodes (from atomic/leaf states up to root) and
	* collects results from matching `map` functions in the mapper object. Results
	* are ordered leaf-to-root (most specific state first).
	*/
	function mapState(snapshot, mapper) {
		const results = [];
		const findMapper = (currentMapper, nodePath) => {
			let mapper = currentMapper;
			for (const key of nodePath) {
				if (!mapper?.states) return;
				const states = mapper.states;
				if (!(key in states)) return;
				mapper = states[key];
			}
			return mapper;
		};
		const visited = /* @__PURE__ */ new Set();
		for (const atomicNode of snapshot._nodes.filter(dist_xstateGuards.isAtomicStateNode)) {
			let current = atomicNode;
			while (current && !visited.has(current)) {
				visited.add(current);
				const nodeMapper = findMapper(mapper, current.path);
				if (nodeMapper?.map) results.push({
					stateNode: current,
					result: nodeMapper.map(snapshot)
				});
				current = current.parent;
			}
		}
		return results;
	}
	/** @internal */
	function createInertActorScope(actorLogic) {
		const self = dist_xstateGuards.createActor(actorLogic);
		const freshSystem = dist_xstateGuards.createSystem(self, {
			clock: self.system._clock,
			logger: self.system._logger
		});
		self.system = freshSystem;
		return {
			self,
			defer: () => {},
			id: "",
			logger: () => {},
			sessionId: "",
			stopChild: () => {},
			system: freshSystem,
			emit: () => {},
			actionExecutor: () => {}
		};
	}
	/** @deprecated Use `initialTransition(…)` instead. */
	function getInitialSnapshot(actorLogic, ...[input]) {
		const actorScope = createInertActorScope(actorLogic);
		return actorLogic.getInitialSnapshot(actorScope, input);
	}
	/**
	* Determines the next snapshot for the given `actorLogic` based on the given
	* `snapshot` and `event`.
	*
	* If the `snapshot` is `undefined`, the initial snapshot of the `actorLogic` is
	* used.
	*
	* @deprecated Use `transition(…)` instead.
	* @example
	*
	* ```ts
	* import { getNextSnapshot } from 'xstate';
	* import { trafficLightMachine } from './trafficLightMachine.ts';
	*
	* const nextSnapshot = getNextSnapshot(
	*   trafficLightMachine, // actor logic
	*   undefined, // snapshot (or initial state if undefined)
	*   { type: 'TIMER' }
	* ); // event object
	*
	* console.log(nextSnapshot.value);
	* // => 'yellow'
	*
	* const nextSnapshot2 = getNextSnapshot(
	*   trafficLightMachine, // actor logic
	*   nextSnapshot, // snapshot
	*   { type: 'TIMER' }
	* ); // event object
	*
	* console.log(nextSnapshot2.value);
	* // =>'red'
	* ```
	*/
	function getNextSnapshot(actorLogic, snapshot, event) {
		const inertActorScope = createInertActorScope(actorLogic);
		inertActorScope.self._snapshot = snapshot;
		return actorLogic.transition(snapshot, event, inertActorScope);
	}
	function setup({ schemas, actors, actions, guards, delays }) {
		return {
			assign: assign.assign,
			sendTo: log.sendTo,
			raise: dist_xstateGuards.raise,
			log: log.log,
			cancel: dist_xstateGuards.cancel,
			stopChild: dist_xstateGuards.stopChild,
			enqueueActions: log.enqueueActions,
			emit: log.emit,
			spawnChild: dist_xstateGuards.spawnChild,
			createStateConfig: (config) => config,
			createAction: (fn) => fn,
			createMachine: (config) => createMachine({
				...config,
				schemas
			}, {
				actors,
				actions,
				guards,
				delays
			}),
			extend: (extended) => setup({
				schemas,
				actors,
				actions: {
					...actions,
					...extended.actions
				},
				guards: {
					...guards,
					...extended.guards
				},
				delays: {
					...delays,
					...extended.delays
				}
			})
		};
	}
	var SimulatedClock = class {
		constructor() {
			this.timeouts = /* @__PURE__ */ new Map();
			this._now = 0;
			this._id = 0;
			this._flushing = false;
			this._flushingInvalidated = false;
		}
		now() {
			return this._now;
		}
		getId() {
			return this._id++;
		}
		setTimeout(fn, timeout) {
			this._flushingInvalidated = this._flushing;
			const id = this.getId();
			this.timeouts.set(id, {
				start: this.now(),
				timeout,
				fn
			});
			return id;
		}
		clearTimeout(id) {
			this._flushingInvalidated = this._flushing;
			this.timeouts.delete(id);
		}
		set(time) {
			if (this._now > time) throw new Error("Unable to travel back in time");
			this._now = time;
			this.flushTimeouts();
		}
		flushTimeouts() {
			if (this._flushing) {
				this._flushingInvalidated = true;
				return;
			}
			this._flushing = true;
			const sorted = [...this.timeouts].sort(([_idA, timeoutA], [_idB, timeoutB]) => {
				const endA = timeoutA.start + timeoutA.timeout;
				return timeoutB.start + timeoutB.timeout > endA ? -1 : 1;
			});
			for (const [id, timeout] of sorted) {
				if (this._flushingInvalidated) {
					this._flushingInvalidated = false;
					this._flushing = false;
					this.flushTimeouts();
					return;
				}
				if (this.now() - timeout.start >= timeout.timeout) {
					this.timeouts.delete(id);
					timeout.fn.call(null);
				}
			}
			this._flushing = false;
		}
		increment(ms) {
			this._now += ms;
			this.flushTimeouts();
		}
	};
	/**
	* Returns a promise that resolves to the `output` of the actor when it is done.
	*
	* @example
	*
	* ```ts
	* const machine = createMachine({
	*   // ...
	*   output: {
	*     count: 42
	*   }
	* });
	*
	* const actor = createActor(machine);
	*
	* actor.start();
	*
	* const output = await toPromise(actor);
	*
	* console.log(output);
	* // logs { count: 42 }
	* ```
	*/
	function toPromise(actor) {
		return new Promise((resolve, reject) => {
			actor.subscribe({
				complete: () => {
					resolve(actor.getSnapshot().output);
				},
				error: reject
			});
		});
	}
	/**
	* Given actor `logic`, a `snapshot`, and an `event`, returns a tuple of the
	* `nextSnapshot` and `actions` to execute.
	*
	* This is a pure function that does not execute `actions`.
	*/
	function transition(logic, snapshot, event) {
		const executableActions = [];
		const actorScope = createInertActorScope(logic);
		actorScope.actionExecutor = (action) => {
			executableActions.push(action);
		};
		return [logic.transition(snapshot, event, actorScope), executableActions];
	}
	/**
	* Given actor `logic` and optional `input`, returns a tuple of the
	* `nextSnapshot` and `actions` to execute from the initial transition (no
	* previous state).
	*
	* This is a pure function that does not execute `actions`.
	*/
	function initialTransition(logic, ...[input]) {
		const executableActions = [];
		const actorScope = createInertActorScope(logic);
		actorScope.actionExecutor = (action) => {
			executableActions.push(action);
		};
		return [logic.getInitialSnapshot(actorScope, input), executableActions];
	}
	/**
	* Given a state `machine`, a `snapshot`, and an `event`, returns an array of
	* microsteps, where each microstep is a tuple of `[snapshot, actions]`.
	*
	* This is a pure function that does not execute `actions`.
	*/
	function getMicrosteps(machine, snapshot, event) {
		const actorScope = createInertActorScope(machine);
		const { microsteps } = dist_xstateGuards.macrostep(snapshot, event, actorScope, []);
		return microsteps;
	}
	/**
	* Given a state `machine` and optional `input`, returns an array of microsteps
	* from the initial transition, where each microstep is a tuple of `[snapshot,
	* actions]`.
	*
	* This is a pure function that does not execute `actions`.
	*/
	function getInitialMicrosteps(machine, ...[input]) {
		const actorScope = createInertActorScope(machine);
		const initEvent = dist_xstateGuards.createInitEvent(input);
		const internalQueue = [];
		const preInitialSnapshot = machine._getPreInitialState(actorScope, initEvent, internalQueue);
		const first = dist_xstateGuards.initialMicrostep(machine.root, preInitialSnapshot, actorScope, initEvent, internalQueue);
		const { microsteps } = dist_xstateGuards.macrostep(first[0], initEvent, actorScope, internalQueue);
		return [first, ...microsteps];
	}
	/**
	* Gets all potential next transitions from the current state.
	*
	* Returns all transitions that are available from the current state, including:
	*
	* - All transitions from atomic states (leaf states in the current state
	*   configuration)
	* - All transitions from ancestor states (parent states that may handle events)
	* - All guarded transitions (regardless of whether their guards would pass)
	* - Always (eventless) transitions
	* - After (delayed) transitions
	*
	* The order of transitions is deterministic:
	*
	* 1. Atomic states are processed in document order
	* 2. For each atomic state, transitions are collected from the state itself first,
	*    then its ancestors
	* 3. Within each state node, transitions are in the order they appear in the state
	*    definition
	*
	* @param state - The current machine snapshot
	* @returns Array of transition definitions from the current state, in
	*   deterministic order
	*/
	function getNextTransitions(state) {
		const potentialTransitions = [];
		const atomicStates = state._nodes.filter(dist_xstateGuards.isAtomicStateNode);
		const visited = /* @__PURE__ */ new Set();
		for (const stateNode of atomicStates) for (const s of [stateNode].concat(dist_xstateGuards.getProperAncestors(stateNode, void 0))) {
			if (visited.has(s.id)) continue;
			visited.add(s.id);
			for (const [, transitions] of s.transitions) potentialTransitions.push(...transitions);
			if (s.always) potentialTransitions.push(...s.always);
		}
		return potentialTransitions;
	}
	var defaultWaitForOptions = { timeout: Infinity };
	/**
	* Subscribes to an actor ref and waits for its emitted value to satisfy a
	* predicate, and then resolves with that value. Will throw if the desired state
	* is not reached after an optional timeout. (defaults to Infinity).
	*
	* @example
	*
	* ```js
	* const state = await waitFor(someService, (state) => {
	*   return state.hasTag('loaded');
	* });
	*
	* state.hasTag('loaded'); // true
	* ```
	*
	* @param actorRef The actor ref to subscribe to
	* @param predicate Determines if a value matches the condition to wait for
	* @param options
	* @returns A promise that eventually resolves to the emitted value that matches
	*   the condition
	*/
	function waitFor(actorRef, predicate, options) {
		const resolvedOptions = {
			...defaultWaitForOptions,
			...options
		};
		return new Promise((res, rej) => {
			const { signal } = resolvedOptions;
			if (signal?.aborted) {
				rej(signal.reason);
				return;
			}
			let done = false;
			const handle = resolvedOptions.timeout === Infinity ? void 0 : setTimeout(() => {
				dispose();
				rej(/* @__PURE__ */ new Error(`Timeout of ${resolvedOptions.timeout} ms exceeded`));
			}, resolvedOptions.timeout);
			const dispose = () => {
				clearTimeout(handle);
				done = true;
				sub?.unsubscribe();
				if (abortListener) signal.removeEventListener("abort", abortListener);
			};
			function checkEmitted(emitted) {
				if (predicate(emitted)) {
					dispose();
					res(emitted);
				}
			}
			/**
			* If the `signal` option is provided, this will be the listener for its
			* `abort` event
			*/
			let abortListener;
			let sub;
			checkEmitted(actorRef.getSnapshot());
			if (done) return;
			if (signal) {
				abortListener = () => {
					dispose();
					rej(signal.reason);
				};
				signal.addEventListener("abort", abortListener);
			}
			sub = actorRef.subscribe({
				next: checkEmitted,
				error: (err) => {
					dispose();
					rej(err);
				},
				complete: () => {
					dispose();
					rej(/* @__PURE__ */ new Error(`Actor terminated without satisfying predicate`));
				}
			});
			if (done) sub.unsubscribe();
		});
	}
	exports.createEmptyActor = dist_xstateActors.createEmptyActor;
	exports.fromCallback = dist_xstateActors.fromCallback;
	exports.fromEventObservable = dist_xstateActors.fromEventObservable;
	exports.fromObservable = dist_xstateActors.fromObservable;
	exports.fromPromise = dist_xstateActors.fromPromise;
	exports.fromTransition = dist_xstateActors.fromTransition;
	exports.Actor = dist_xstateGuards.Actor;
	exports.__unsafe_getAllOwnEventDescriptors = dist_xstateGuards.getAllOwnEventDescriptors;
	exports.and = dist_xstateGuards.and;
	exports.cancel = dist_xstateGuards.cancel;
	exports.createActor = dist_xstateGuards.createActor;
	exports.getStateNodes = dist_xstateGuards.getStateNodes;
	exports.interpret = dist_xstateGuards.interpret;
	exports.isMachineSnapshot = dist_xstateGuards.isMachineSnapshot;
	exports.matchesState = dist_xstateGuards.matchesState;
	exports.not = dist_xstateGuards.not;
	exports.or = dist_xstateGuards.or;
	exports.pathToStateValue = dist_xstateGuards.pathToStateValue;
	exports.raise = dist_xstateGuards.raise;
	exports.spawnChild = dist_xstateGuards.spawnChild;
	exports.stateIn = dist_xstateGuards.stateIn;
	exports.stop = dist_xstateGuards.stop;
	exports.stopChild = dist_xstateGuards.stopChild;
	exports.toObserver = dist_xstateGuards.toObserver;
	exports.StateMachine = StateMachine.StateMachine;
	exports.StateNode = StateMachine.StateNode;
	exports.assign = assign.assign;
	exports.SpecialTargets = log.SpecialTargets;
	exports.emit = log.emit;
	exports.enqueueActions = log.enqueueActions;
	exports.forwardTo = log.forwardTo;
	exports.log = log.log;
	exports.sendParent = log.sendParent;
	exports.sendTo = log.sendTo;
	exports.SimulatedClock = SimulatedClock;
	exports.assertEvent = assertEvent;
	exports.createMachine = createMachine;
	exports.getInitialMicrosteps = getInitialMicrosteps;
	exports.getInitialSnapshot = getInitialSnapshot;
	exports.getMicrosteps = getMicrosteps;
	exports.getNextSnapshot = getNextSnapshot;
	exports.getNextTransitions = getNextTransitions;
	exports.initialTransition = initialTransition;
	exports.mapState = mapState;
	exports.setup = setup;
	exports.toPromise = toPromise;
	exports.transition = transition;
	exports.waitFor = waitFor;
}));
//#endregion
//#region ../../node_modules/.pnpm/@xstate+react@6.1.0_@types+react@19.2.18_react@19.2.8_xstate@5.32.6/node_modules/@xstate/react/dist/xstate-react.cjs.mjs
var import_xstate_react_cjs = (/* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	var React = require_react();
	var useIsomorphicLayoutEffect = require_use_isomorphic_layout_effect_cjs();
	var xstate = require_xstate_cjs();
	var withSelector = require_with_selector();
	require_shim();
	function _interopDefault(e) {
		return e && e.__esModule ? e : { "default": e };
	}
	function _interopNamespace(e) {
		if (e && e.__esModule) return e;
		var n = Object.create(null);
		if (e) Object.keys(e).forEach(function(k) {
			if (k !== "default") {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function() {
						return e[k];
					}
				});
			}
		});
		n["default"] = e;
		return Object.freeze(n);
	}
	var React__namespace = /*#__PURE__*/ _interopNamespace(React);
	var useIsomorphicLayoutEffect__default = /*#__PURE__*/ _interopDefault(useIsomorphicLayoutEffect);
	var forEachActor = (actorRef, callback) => {
		callback(actorRef);
		const children = actorRef.getSnapshot().children;
		if (children) Object.values(children).forEach((child) => {
			forEachActor(child, callback);
		});
	};
	function stopRootWithRehydration(actorRef) {
		const persistedSnapshots = [];
		forEachActor(actorRef, (ref) => {
			persistedSnapshots.push([ref, ref.getSnapshot()]);
			ref.observers = /* @__PURE__ */ new Set();
		});
		const systemSnapshot = actorRef.system.getSnapshot?.();
		actorRef.stop();
		actorRef.system._snapshot = systemSnapshot;
		persistedSnapshots.forEach(([ref, snapshot]) => {
			ref._processingStatus = 0;
			ref._snapshot = snapshot;
		});
	}
	function useIdleActorRef(logic, ...[options]) {
		let [[currentConfig, actorRef], setCurrent] = React.useState(() => {
			const actorRef = xstate.createActor(logic, options);
			return [logic.config, actorRef];
		});
		if (logic.config !== currentConfig) {
			const newActorRef = xstate.createActor(logic, {
				...options,
				snapshot: actorRef.getPersistedSnapshot({ __unsafeAllowInlineActors: true })
			});
			setCurrent([logic.config, newActorRef]);
			actorRef = newActorRef;
		}
		useIsomorphicLayoutEffect__default["default"](() => {
			actorRef.logic.implementations = logic.implementations;
		});
		return actorRef;
	}
	function useActorRef(machine, ...[options, observerOrListener]) {
		const actorRef = useIdleActorRef(machine, options);
		React.useEffect(() => {
			if (!observerOrListener) return;
			const sub = actorRef.subscribe(xstate.toObserver(observerOrListener));
			return () => {
				sub.unsubscribe();
			};
		}, [observerOrListener]);
		React.useEffect(() => {
			actorRef.start();
			return () => {
				stopRootWithRehydration(actorRef);
			};
		}, [actorRef]);
		return actorRef;
	}
	function defaultCompare(a, b) {
		return a === b;
	}
	function useSelector(actor, selector, compare = defaultCompare) {
		const subscribe = React.useCallback((handleStoreChange) => {
			if (!actor) return () => {};
			const { unsubscribe } = actor.subscribe({
				next: handleStoreChange,
				error: handleStoreChange
			});
			return unsubscribe;
		}, [actor]);
		const boundGetSnapshot = React.useCallback(() => {
			const snapshot = actor?.getSnapshot();
			if (snapshot && "status" in snapshot && snapshot.status === "error") throw snapshot.error;
			return snapshot;
		}, [actor]);
		return withSelector.useSyncExternalStoreWithSelector(subscribe, boundGetSnapshot, boundGetSnapshot, selector, compare);
	}
	function createActorContext(actorLogic, actorOptions) {
		const ReactContext = /*#__PURE__*/ React__namespace.createContext(null);
		const OriginalProvider = ReactContext.Provider;
		function Provider({ children, logic: providedLogic = actorLogic, machine, options: providedOptions }) {
			if (machine) throw new Error(`The "machine" prop has been deprecated. Please use "logic" instead.`);
			const actor = useActorRef(providedLogic, {
				...actorOptions,
				...providedOptions
			});
			return /*#__PURE__*/ React__namespace.createElement(OriginalProvider, {
				value: actor,
				children
			});
		}
		Provider.displayName = `ActorProvider`;
		function useContext() {
			const actor = React__namespace.useContext(ReactContext);
			if (!actor) throw new Error(`You used a hook from "${Provider.displayName}" but it's not inside a <${Provider.displayName}> component.`);
			return actor;
		}
		function useSelector$1(selector, compare) {
			return useSelector(useContext(), selector, compare);
		}
		return {
			Provider,
			useActorRef: useContext,
			useSelector: useSelector$1
		};
	}
	exports.createActorContext = createActorContext;
})))();
//#endregion
export { require_xstate_cjs as n, import_xstate_react_cjs as t };
