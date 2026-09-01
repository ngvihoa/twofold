import { i as __toESM } from "../_runtime.mjs";
import { g as require_react, h as require_jsx_runtime, r as require_react_dom } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as Route$1 } from "./router-CPeOJWfG.mjs";
import { a as PlayerGameActionSchema, n as CardRole, o as PlayerId, r as ClientWsMessageSchema, s as ServerWsMessageSchema, t as AbilityId } from "./src-BW_uq4Lw.mjs";
import { T as ArrowLeft, _ as LoaderCircle, a as Sun, b as Eye, c as SkipForward, d as Save, f as RotateCcw, g as Lock, l as Shield, m as Moon, n as Trophy, o as Sparkles, r as TriangleAlert, s as Skull, t as Users, u as ShieldCheck, v as History, w as ArrowRight, x as EyeOff, y as GripVertical } from "../_libs/lucide-react.mjs";
import { t as import_xstate_react_cjs } from "../_libs/@xstate/react+[...].mjs";
import { t as import_xstate_cjs } from "../_libs/xstate.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-DQTXvpuu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = require_react_dom();
var SOCKET_OPEN = 1;
var SOCKET_CONNECTING = 0;
/**
* Resolve relative HTTP(S) config thành WebSocket URL dựa trên browser origin.
*
* @throws Khi dùng relative endpoint ngoài browser hoặc protocol không hợp lệ.
*/
function resolveGameWebSocketUrl(endpoint) {
	if (/^wss?:\/\//u.test(endpoint)) return endpoint;
	if (typeof window === "undefined") throw new Error("Relative game WebSocket endpoint chỉ resolve được trong browser.");
	const url = new URL(endpoint, window.location.href);
	url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
	return url.toString();
}
function parseInboundData(data) {
	if (typeof data !== "string") return data;
	try {
		return JSON.parse(data);
	} catch {
		return data;
	}
}
/** Native browser WebSocket implementation của `GameTransport`. */
var BrowserGameTransport = class {
	endpoint;
	createSocket;
	socket = null;
	listeners = /* @__PURE__ */ new Set();
	constructor(endpoint, createSocket = (url) => new WebSocket(url)) {
		this.endpoint = endpoint;
		this.createSocket = createSocket;
	}
	/** Mở một socket mới; bỏ qua nếu socket hiện tại đang connecting/open. */
	connect() {
		if (this.socket?.readyState === SOCKET_CONNECTING || this.socket?.readyState === SOCKET_OPEN) return;
		const socketUrl = resolveGameWebSocketUrl(this.endpoint);
		const socket = this.createSocket(socketUrl);
		this.socket = socket;
		socket.onopen = () => this.emit({ type: "OPEN" });
		socket.onmessage = ({ data }) => this.emit({
			type: "MESSAGE",
			message: parseInboundData(data)
		});
		socket.onerror = () => this.emit({
			type: "ERROR",
			error: /* @__PURE__ */ new Error(`Game WebSocket connection error (${socketUrl}).`)
		});
		socket.onclose = ({ reason }) => {
			if (this.socket === socket) this.socket = null;
			this.emit({
				type: "CLOSED",
				...reason ? { reason } : {}
			});
		};
	}
	/** Chủ động đóng socket; session machine quyết định có reconnect hay không. */
	disconnect() {
		const socket = this.socket;
		if (!socket) return;
		this.socket = null;
		socket.onopen = null;
		socket.onmessage = null;
		socket.onerror = null;
		socket.onclose = null;
		socket.close(1e3, "Client disconnect");
	}
	/**
	* Serialize và gửi một v0.2 client message.
	*
	* @throws Khi socket chưa ở trạng thái open.
	*/
	send(message) {
		if (this.socket?.readyState !== SOCKET_OPEN) throw new Error("Không thể gửi game message khi WebSocket chưa open.");
		this.socket.send(JSON.stringify(message));
	}
	/** Đăng ký listener và trả cleanup function tương ứng. */
	subscribe(listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}
	emit(event) {
		this.listeners.forEach((listener) => listener(event));
	}
};
var SESSION_KEY_PREFIX = "twofold:game-session:v1:";
function getBrowserSessionStorage() {
	if (typeof window === "undefined") return null;
	try {
		return window.sessionStorage;
	} catch {
		return null;
	}
}
function sessionKey(roomId) {
	return `${SESSION_KEY_PREFIX}${roomId}`;
}
/** Read a versioned reconnect token scoped to one room and browser tab. */
function readGameSessionId(roomId, storage = getBrowserSessionStorage()) {
	if (!storage) return null;
	try {
		const raw = storage.getItem(sessionKey(roomId));
		if (!raw) return null;
		const value = JSON.parse(raw);
		return value.version === 1 && typeof value.sessionId === "string" && value.sessionId.length > 0 ? value.sessionId : null;
	} catch {
		return null;
	}
}
/** Persist a reconnect token, or remove it when the server rejects the session. */
function writeGameSessionId(roomId, sessionId, storage = getBrowserSessionStorage()) {
	if (!storage) return;
	const key = sessionKey(roomId);
	try {
		if (sessionId === null) {
			storage.removeItem(key);
			return;
		}
		storage.setItem(key, JSON.stringify({
			version: 1,
			sessionId
		}));
	} catch {}
}
/** Context rỗng của một presentation actor chưa nhận snapshot. */
var INITIAL_CONTEXT = {
	lastSeenSequence: 0,
	lastPresentedSequence: 0,
	current: null,
	queue: []
};
/**
* Tìm event sequence lớn nhất trong một snapshot history.
*
* @param events - Structured events đã được server lọc cho viewer.
* @returns Sequence lớn nhất, hoặc `0` nếu history rỗng.
*/
function highestSequence(events) {
	let highest = 0;
	for (const event of events) highest = Math.max(highest, event.sequence);
	return highest;
}
/**
* Nối các event live chưa từng thấy vào cuối presentation queue.
*
* Hàm bỏ sequence cũ/trùng, sort batch mới theo sequence và không thay đổi
* `current`, nhờ đó snapshot đến giữa animation không cắt presentation hiện tại.
*
* @param context - Presentation context trước khi nhận snapshot.
* @param events - Full hoặc partial event history từ live snapshot.
* @returns Context mới với queue/cursor đã reconcile; trả lại context cũ nếu
* không có event mới.
*/
function appendFreshEvents(context, events) {
	const bySequence = /* @__PURE__ */ new Map();
	for (const event of events) if (event.sequence > context.lastSeenSequence && !bySequence.has(event.sequence)) bySequence.set(event.sequence, event);
	const freshEvents = [...bySequence.values()].sort((left, right) => left.sequence - right.sequence);
	if (freshEvents.length === 0) return context;
	return {
		...context,
		lastSeenSequence: freshEvents.at(-1)?.sequence ?? context.lastSeenSequence,
		queue: [...context.queue, ...freshEvents]
	};
}
/**
* Đánh dấu current event đã complete/skip và promote queue head tiếp theo.
*
* @param context - Context đang ở state `presenting`.
* @returns Context với `lastPresentedSequence` đã tiến và current mới, hoặc giữ
* nguyên nếu không có current event.
*/
function advancePresentation(context) {
	if (context.current === null) return context;
	const [next = null, ...remaining] = context.queue;
	return {
		...context,
		lastPresentedSequence: Math.max(context.lastPresentedSequence, context.current.sequence),
		current: next,
		queue: remaining
	};
}
/**
* UI-only event queue. It sequences already-filtered structured events and
* never owns or mutates authoritative gameplay state.
*
* Machine có hai state: `idle` khi không có animation và `presenting` khi
* `current` đang được UI xử lý. Root handlers (`HYDRATE`, `SKIP_ALL`, `RESET`)
* dùng được từ cả hai state; chúng chỉ chạy khi caller gửi event, không tự chạy
* lúc actor khởi tạo.
*/
var gamePresentationMachine = (0, import_xstate_cjs.setup)({
	types: {
		context: {},
		events: {}
	},
	guards: {
		hasQueuedEvents: ({ context }) => context.queue.length > 0,
		hasNextEvent: ({ context }) => context.queue.length > 0
	}
}).createMachine({
	id: "gamePresentation",
	initial: "idle",
	context: INITIAL_CONTEXT,
	on: {
		HYDRATE: {
			target: ".idle",
			actions: (0, import_xstate_cjs.assign)(({ context, event }) => {
				const baseline = Math.max(context.lastSeenSequence, highestSequence(event.events));
				return {
					lastSeenSequence: baseline,
					lastPresentedSequence: baseline,
					current: null,
					queue: []
				};
			})
		},
		SKIP_ALL: {
			target: ".idle",
			actions: (0, import_xstate_cjs.assign)(({ context }) => ({
				...context,
				lastPresentedSequence: Math.max(context.lastPresentedSequence, context.lastSeenSequence),
				current: null,
				queue: []
			}))
		},
		RESET: {
			target: ".idle",
			actions: (0, import_xstate_cjs.assign)(INITIAL_CONTEXT)
		}
	},
	states: {
		idle: {
			on: { INGEST: { actions: (0, import_xstate_cjs.assign)(({ context, event }) => appendFreshEvents(context, event.events)) } },
			always: {
				guard: "hasQueuedEvents",
				target: "presenting",
				actions: (0, import_xstate_cjs.assign)(({ context }) => {
					const [current = null, ...remaining] = context.queue;
					return {
						...context,
						current,
						queue: remaining
					};
				})
			}
		},
		presenting: { on: {
			INGEST: { actions: (0, import_xstate_cjs.assign)(({ context, event }) => appendFreshEvents(context, event.events)) },
			PRESENTATION_COMPLETED: [{
				guard: "hasNextEvent",
				actions: (0, import_xstate_cjs.assign)(({ context }) => advancePresentation(context))
			}, {
				target: "idle",
				actions: (0, import_xstate_cjs.assign)(({ context }) => advancePresentation(context))
			}],
			SKIP_CURRENT: [{
				guard: "hasNextEvent",
				actions: (0, import_xstate_cjs.assign)(({ context }) => advancePresentation(context))
			}, {
				target: "idle",
				actions: (0, import_xstate_cjs.assign)(({ context }) => advancePresentation(context))
			}]
		} }
	}
});
/**
* Derive presentation lane từ authoritative event phase.
*
* @param event - Current structured event, hoặc `null` khi actor idle.
* @returns Nhóm presentation mà UI nên render; không lưu state trùng với phase.
*/
function getPresentationKind(event) {
	if (event === null) return null;
	switch (event.phase) {
		case "DAY_A":
		case "DAY_B": return "DAY";
		case "COUNCIL_PLAN":
		case "COUNCIL_RESOLUTION": return "COUNCIL";
		case "DUSK_DEFENSE": return "DEFENSE";
		case "NIGHT_PLAN":
		case "NIGHT_RESOLUTION": return "NIGHT";
		case "DAWN": return "DAWN";
		case "PURGE_PLAN":
		case "PURGE_RESOLUTION": return "PURGE";
		case "FINAL_DUEL": return "FINAL_DUEL";
		case "SETUP":
		case "ENDED": return "GENERIC";
	}
}
/** @returns Structured event đang được UI trình bày, hoặc `null`. */
var selectCurrentPresentation = (snapshot) => snapshot.context.current;
/** @returns Presentation kind derive từ current event, hoặc `null`. */
var selectPresentationKind = (snapshot) => getPresentationKind(snapshot.context.current);
/** @returns Tổng số event còn phải trình bày, bao gồm `current`. */
var selectQueuedPresentationCount = (snapshot) => snapshot.context.queue.length + (snapshot.context.current === null ? 0 : 1);
/** React boundary cho presentation actor; UI nên subscribe qua selector hẹp. */
var GamePresentationActorContext = (0, import_xstate_react_cjs.createActorContext)(gamePresentationMachine);
/**
* Đồng bộ structured events đã lọc theo viewer vào presentation actor.
* Snapshot đầu tiên chỉ tạo baseline để reconnect không phát lại toàn bộ lịch sử;
* các snapshot sau mới được đưa vào animation queue.
*/
function GamePresentationSync({ gameId, events }) {
	const actor = GamePresentationActorContext.useActorRef();
	const hydratedGameId = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (hydratedGameId.current !== gameId) {
			actor.send({ type: "RESET" });
			actor.send({
				type: "HYDRATE",
				events
			});
			hydratedGameId.current = gameId;
			return;
		}
		actor.send({
			type: "INGEST",
			events
		});
	}, [
		actor,
		events,
		gameId
	]);
	return null;
}
/**
* Chuẩn hóa một thrown value chưa biết thành message cho session error.
*
* @param error - Giá trị được transport hoặc runtime throw.
* @returns Message gốc nếu là `Error`, ngược lại là biểu diễn chuỗi.
*/
function describeUnknownError(error) {
	return error instanceof Error ? error.message : String(error);
}
/**
* Chuyển server WebSocket message đã parse thành event nội bộ của machine.
*
* Việc đổi namespace sang `SERVER.*` giúp phân biệt wire message với event do
* React hoặc transport gửi vào session actor.
*
* @param message - Message v0.2 đã vượt qua `ServerWsMessageSchema`.
* @returns Event nội bộ giữ nguyên typed payload của server message.
*/
function toMachineEvent(message) {
	switch (message.type) {
		case "ROOM_JOINED": return {
			type: "SERVER.ROOM_JOINED",
			payload: message.payload
		};
		case "GAME_STATE_UPDATE": return {
			type: "SERVER.GAME_STATE_UPDATE",
			payload: message.payload
		};
		case "ACTION_REJECTED": return {
			type: "SERVER.ACTION_REJECTED",
			payload: message.payload
		};
		case "ERROR": return {
			type: "SERVER.ERROR",
			payload: message.payload
		};
		case "PONG": return {
			type: "SERVER.PONG",
			payload: message.payload
		};
	}
}
/**
* Callback actor làm cầu nối hai chiều giữa XState và `GameTransport`.
*
* Actor subscribe raw transport notifications, mở initial connection ngay khi
* XState start actor, validate mọi inbound message trước khi gửi về parent,
* đồng thời nhận command reconnect/disconnect/send. Cleanup luôn unsubscribe
* và đóng transport.
*/
var transportActor = (0, import_xstate_cjs.fromCallback)(({ input, receive, sendBack }) => {
	const unsubscribe = input.transport.subscribe((event) => {
		switch (event.type) {
			case "OPEN":
				sendBack({ type: "TRANSPORT.OPEN" });
				return;
			case "CLOSED":
				sendBack({
					type: "TRANSPORT.CLOSED",
					reason: event.reason
				});
				return;
			case "ERROR":
				sendBack({
					type: "TRANSPORT.ERROR",
					message: describeUnknownError(event.error)
				});
				return;
			case "MESSAGE": {
				const parsed = ServerWsMessageSchema.safeParse(event.message);
				if (!parsed.success) {
					sendBack({
						type: "PROTOCOL.ERROR",
						message: parsed.error.issues.map((issue) => issue.message).join("; ")
					});
					return;
				}
				sendBack(toMachineEvent(parsed.data));
			}
		}
	});
	try {
		input.transport.connect();
	} catch (error) {
		sendBack({
			type: "TRANSPORT.ERROR",
			message: describeUnknownError(error)
		});
	}
	receive((command) => {
		try {
			if (command.type === "CONNECT") input.transport.connect();
			if (command.type === "DISCONNECT") input.transport.disconnect();
			if (command.type === "SEND") input.transport.send(command.message);
		} catch (error) {
			sendBack({
				type: "TRANSPORT.ERROR",
				message: describeUnknownError(error)
			});
		}
	});
	return () => {
		unsubscribe();
		input.transport.disconnect();
	};
});
/**
* Authoritative client-session state machine cho một game room.
*
* Machine quản lý connection lifecycle, join/reconnect token, snapshot v0.2,
* pending submission và lỗi. Nó không resolve game rule và không tự chuyển
* gameplay phase; mỗi `GAME_STATE_UPDATE` thay toàn bộ `view` bằng snapshot
* server mới nhất.
*
* State lifecycle:
* `connecting -> connected -> reconnecting`, hoặc `closed` khi client chủ động
* disconnect. Child transport tự mở connection khi actor được XState start.
*/
var gameSessionMachine = (0, import_xstate_cjs.setup)({
	types: {
		context: {},
		events: {},
		input: {}
	},
	actors: { transportActor },
	guards: { canSubmit: ({ context }) => context.view !== null && context.pendingAction === null }
}).createMachine({
	id: "gameSession",
	initial: "connecting",
	context: ({ input }) => ({
		...input,
		assignedPlayerId: null,
		sessionId: input.reconnectSessionId ?? null,
		view: null,
		pendingAction: null,
		error: null
	}),
	invoke: {
		id: "transport",
		src: "transportActor",
		input: ({ context }) => ({ transport: context.transport })
	},
	on: {
		"TRANSPORT.OPEN": { actions: (0, import_xstate_cjs.sendTo)("transport", ({ context }) => ({
			type: "SEND",
			message: ClientWsMessageSchema.parse({
				type: "JOIN_ROOM",
				payload: {
					roomId: context.roomId,
					playerName: context.playerName,
					...context.sessionId ? { reconnectSessionId: context.sessionId } : {}
				}
			})
		})) },
		"SERVER.ROOM_JOINED": {
			target: ".connected",
			actions: [({ context, event }) => context.onSessionIdChange?.(event.payload.sessionId), (0, import_xstate_cjs.assign)({
				assignedPlayerId: ({ event }) => event.payload.assignedPlayerId,
				sessionId: ({ event }) => event.payload.sessionId,
				error: null
			})]
		},
		"SERVER.GAME_STATE_UPDATE": { actions: (0, import_xstate_cjs.assign)({
			view: ({ event }) => event.payload,
			pendingAction: null,
			error: null
		}) },
		"SERVER.ACTION_REJECTED": { actions: (0, import_xstate_cjs.assign)({
			pendingAction: null,
			error: ({ event }) => ({
				kind: "ACTION",
				code: event.payload.code,
				message: event.payload.message
			})
		}) },
		"SERVER.ERROR": [{
			guard: ({ context, event }) => event.payload.code === "INVALID_SESSION" && context.sessionId !== null,
			actions: [
				({ context }) => context.onSessionIdChange?.(null),
				(0, import_xstate_cjs.assign)({
					sessionId: null,
					error: null
				}),
				(0, import_xstate_cjs.sendTo)("transport", ({ context }) => ({
					type: "SEND",
					message: ClientWsMessageSchema.parse({
						type: "JOIN_ROOM",
						payload: {
							roomId: context.roomId,
							playerName: context.playerName
						}
					})
				}))
			]
		}, { actions: (0, import_xstate_cjs.assign)({ error: ({ event }) => ({
			kind: "PROTOCOL",
			code: event.payload.code,
			message: event.payload.message
		}) }) }],
		"SERVER.PONG": {},
		"PROTOCOL.ERROR": { actions: (0, import_xstate_cjs.assign)({ error: ({ event }) => ({
			kind: "PROTOCOL",
			message: event.message
		}) }) },
		"TRANSPORT.ERROR": {
			target: ".reconnecting",
			actions: (0, import_xstate_cjs.assign)({
				pendingAction: null,
				error: ({ event }) => ({
					kind: "TRANSPORT",
					message: event.message
				})
			})
		},
		"TRANSPORT.CLOSED": {
			target: ".reconnecting",
			actions: (0, import_xstate_cjs.assign)({ pendingAction: null })
		},
		DISCONNECT: {
			target: ".closed",
			actions: (0, import_xstate_cjs.sendTo)("transport", { type: "DISCONNECT" })
		},
		CLEAR_ERROR: { actions: (0, import_xstate_cjs.assign)({ error: null }) }
	},
	states: {
		connecting: {},
		connected: { on: { SUBMIT_ACTION: {
			guard: "canSubmit",
			actions: [(0, import_xstate_cjs.sendTo)("transport", ({ event }) => ({
				type: "SEND",
				message: ClientWsMessageSchema.parse({
					type: "SUBMIT_ACTION",
					payload: event.action
				})
			})), (0, import_xstate_cjs.assign)({
				pendingAction: ({ event }) => event.action,
				error: null
			})]
		} } },
		reconnecting: { on: { RECONNECT: {
			target: "connecting",
			actions: (0, import_xstate_cjs.sendTo)("transport", { type: "CONNECT" })
		} } },
		closed: { on: {
			"TRANSPORT.OPEN": {},
			"TRANSPORT.CLOSED": {},
			"TRANSPORT.ERROR": {},
			CONNECT: {
				target: "connecting",
				actions: (0, import_xstate_cjs.sendTo)("transport", { type: "CONNECT" })
			}
		} }
	}
});
/** @returns Connection state hiện tại của session actor. */
var selectConnection = (snapshot) => snapshot.value;
/** @returns Authoritative player view gần nhất, hoặc `null` trước snapshot đầu. */
var selectView = (snapshot) => snapshot.context.view;
/** @returns Action đang chờ server acknowledge, hoặc `null`. */
var selectPendingAction = (snapshot) => snapshot.context.pendingAction;
/** @returns Lỗi session gần nhất có thể hiển thị, hoặc `null`. */
var selectSessionError = (snapshot) => snapshot.context.error;
/**
* Xác định UI có thể gửi action mới hay không.
*
* @returns `true` chỉ khi đã connected, có authoritative view và không có
* action nào đang chờ acknowledgement.
*/
var selectCanSubmit = (snapshot) => snapshot.matches("connected") && snapshot.context.view !== null && snapshot.context.pendingAction === null;
/** Stable React actor boundary; consumers should subscribe with narrow selectors. */
var GameSessionActorContext = (0, import_xstate_react_cjs.createActorContext)(gameSessionMachine);
/** Wording có nghĩa cho phase; không để enum kỹ thuật rò ra giao diện. */
var GAME_PHASE_LABELS = {
	SETUP: "Chuẩn bị đội hình",
	DAY_A: "Ban ngày · Người chơi A hành động",
	DAY_B: "Ban ngày · Người chơi B hành động",
	COUNCIL_PLAN: "Hội đồng · Lập cáo buộc",
	COUNCIL_RESOLUTION: "Hội đồng · Công bố phán quyết",
	NIGHT_PLAN: "Ban đêm · Chọn hành động",
	DUSK_DEFENSE: "Phòng thủ ban đêm · Đặt khiên",
	NIGHT_RESOLUTION: "Ban đêm · Phân giải hành động",
	DAWN: "Bình minh · Công bố kết quả",
	PURGE_PLAN: "Thanh Trừng · Chọn mục tiêu",
	PURGE_RESOLUTION: "Thanh Trừng · Công bố kết quả",
	FINAL_DUEL: "Đối đầu cuối trận",
	ENDED: "Trận đấu kết thúc"
};
var GAME_PLAYER_LABELS = {
	[PlayerId.PLAYER_A]: "Người chơi A",
	[PlayerId.PLAYER_B]: "Người chơi B"
};
/** Tên vai trò dùng ở presentation; domain và wire contract vẫn giữ enum ổn định. */
var GAME_ROLE_LABELS = {
	[CardRole.VILLAGER]: "Dân làng",
	[CardRole.WEREWOLF]: "Ma sói",
	[CardRole.SEER]: "Tiên tri",
	[CardRole.GUARD]: "Bảo vệ",
	[CardRole.WITCH]: "Phù thủy",
	[CardRole.SHOOTER]: "Xạ thủ",
	[CardRole.AVENGER]: "Kẻ báo thù",
	[CardRole.PRIEST]: "Mục sư",
	[CardRole.WOLF_GUARD]: "Sói Hộ Vệ"
};
var GAME_ROLE_TOOLTIPS = {
	[CardRole.VILLAGER]: {
		faction: "Phe Dân làng",
		description: "Không có kỹ năng chủ động. Khi tham gia Hội đồng, lá này có trọng số 2 phiếu thay vì 1."
	},
	[CardRole.WEREWOLF]: {
		faction: "Phe Ma sói",
		description: "Ban đêm chọn một lá đối thủ để tấn công. Đòn đánh sẽ bị Khiên bảo hộ chặn."
	},
	[CardRole.SEER]: {
		faction: "Phe Dân làng",
		description: "Ban đêm soi một lá đối thủ và nhận kết quả riêng. Soi lại một lá phe Sói đã biết sẽ kết liễu mục tiêu; Khiên không chặn được soi."
	},
	[CardRole.GUARD]: {
		faction: "Phe Dân làng",
		description: "Ở Hoàng hôn, bảo vệ một lá khác bên mình khỏi tấn công, đầu độc hoặc Huyết Nguyệt. Không thể tự bảo vệ hay chọn cùng mục tiêu hai vòng liên tiếp."
	},
	[CardRole.WITCH]: {
		faction: "Phe Dân làng",
		description: "Ban ngày hồi sinh một đồng minh đã chết; ban đêm đầu độc một lá đối thủ. Mỗi kỹ năng được dùng 1 lần trong trận."
	},
	[CardRole.SHOOTER]: {
		faction: "Phe Dân làng",
		description: "Ban ngày bắn hạ một lá đối thủ đã lộ. Chỉ có 1 viên đạn và cần đối thủ có ít nhất hai vai trò đã công khai."
	},
	[CardRole.AVENGER]: {
		faction: "Phe Dân làng",
		description: "Ban ngày đánh dấu một lá đối thủ. Nếu Kẻ báo thù bị loại khi dấu còn hiệu lực, mục tiêu cũng bị kéo theo."
	},
	[CardRole.PRIEST]: {
		faction: "Phe Dân làng",
		description: "Thanh tẩy một lá đối thủ vào Ban ngày. Chọn đúng phe Sói sẽ loại mục tiêu; chọn nhầm phe Dân khiến Mục sư bị loại. Dùng 1 lần."
	},
	[CardRole.WOLF_GUARD]: {
		faction: "Phe Ma sói",
		description: "Phản ứng trong Hội đồng để cứu một lá bên mình khỏi phán quyết loại bỏ thành công. Dùng 1 lần trong trận."
	}
};
function formatGameRoleName(role) {
	return GAME_ROLE_LABELS[role];
}
function formatGamePhaseName(phase) {
	return GAME_PHASE_LABELS[phase];
}
function formatGamePlayerName(player) {
	return GAME_PLAYER_LABELS[player];
}
function getGameRoleTooltipContent(role) {
	return {
		name: formatGameRoleName(role),
		...GAME_ROLE_TOOLTIPS[role]
	};
}
var ABILITY_LABELS = {
	[AbilityId.WEREWOLF_ATTACK]: "Ma sói tấn công",
	[AbilityId.SEER_INSPECT]: "Tiên tri soi",
	[AbilityId.GUARD_PROTECT]: "Bảo vệ che chở",
	[AbilityId.WITCH_REVIVE]: "Phù thủy hồi sinh",
	[AbilityId.WITCH_POISON]: "Phù thủy dùng độc",
	[AbilityId.SHOOTER_SHOOT]: "Xạ thủ khai hỏa",
	[AbilityId.AVENGER_MARK]: "Kẻ báo thù đánh dấu",
	[AbilityId.PRIEST_PURIFY]: "Mục sư thanh tẩy",
	[AbilityId.WOLF_GUARD_RESCUE]: "Sói Hộ Vệ giải cứu",
	BLOOD_MOON: "Huyết Nguyệt"
};
var EFFECT_LABELS = {
	PROTECTION: "Khiên bảo hộ",
	REVENGE_MARK: "Dấu ấn báo thù",
	COUNCIL_LOCK: "Khóa Hội đồng",
	PURGE_LOCK: "Khóa Thanh Trừng"
};
var PURGE_LABELS = {
	CUT: "Đoạn Tuyệt",
	SWAP: "Hoán Đổi",
	REVEAL: "Vạch Mặt",
	LOCK: "Phong Tỏa"
};
var PLAYER_LABELS = {
	[PlayerId.PLAYER_A]: "Người chơi A",
	[PlayerId.PLAYER_B]: "Người chơi B"
};
/** Chuyển structured game event thành wording ngắn gọn cho history rail. */
function formatGameHistoryMessage(event) {
	switch (event.type) {
		case "CARD_REVEALED": return {
			title: `${formatCard(event.cardId)} đã lộ diện`,
			detail: "Danh tính của lá bài giờ đã được công khai trên bàn đấu."
		};
		case "ABILITY_RESOLVED": {
			const ability = ABILITY_LABELS[event.abilityId];
			return {
				title: event.sourceCardId ? `${formatCard(event.sourceCardId)} thi triển ${ability}` : `${ability} đã được kích hoạt`,
				detail: event.targetCardId ? `Mục tiêu là ${formatCardInline(event.targetCardId)}.` : "Mục tiêu hoặc kết quả được giữ kín với người xem."
			};
		}
		case "EFFECT_APPLIED": return {
			title: `${EFFECT_LABELS[event.effectKind]} phủ lên ${formatCardInline(event.targetCardId)}`,
			detail: "Hiệu ứng đã có hiệu lực và có thể thay đổi lần phân giải kế tiếp."
		};
		case "EFFECT_BLOCKED": return {
			title: `${EFFECT_LABELS[event.effectKind]} đã chặn đòn`,
			detail: `${formatCard(event.targetCardId)} thoát khỏi hiệu ứng vừa nhắm tới.`
		};
		case "CARD_ELIMINATED": return formatEliminationMessage(event);
		case "CARD_REVIVED": return {
			title: `${formatCard(event.cardId)} trở lại bàn đấu`,
			detail: `${formatCard(event.sourceCardId)} đã đưa lá bài này trở về từ cõi chết.`
		};
		case "PRIVATE_INSPECTION_RESULT": return {
			title: `Tiên tri nhìn thấu ${formatCardInline(event.targetCardId)}`,
			detail: `Kết quả bí mật: lá bài mang vai trò ${formatGameRoleName(event.discoveredRole)}.`
		};
		case "COUNCIL_ACCUSATION_RESOLVED": return {
			title: event.succeeded ? `Hội đồng kết tội ${formatCardInline(event.targetCardId)}` : `Cáo buộc ${formatCardInline(event.targetCardId)} thất bại`,
			detail: `${PLAYER_LABELS[event.playerId]} triệu tập ${formatCardList(event.voterIds)} để biểu quyết.`
		};
		case "COUNCIL_PASSED": return {
			title: `${PLAYER_LABELS[event.playerId]} không mở cáo buộc`,
			detail: "Hội đồng khép lại mà không có mục tiêu bị đưa ra xét xử."
		};
		case "DEFENSE_SKIPPED": return {
			title: `${PLAYER_LABELS[event.playerId]} bỏ qua phòng thủ`,
			detail: "Không lá bài nào được Bảo vệ che chở trong hoàng hôn này."
		};
		case "WOLF_GUARD_RESCUED": return {
			title: `Sói Hộ Vệ cứu ${formatCardInline(event.targetCardId)}`,
			detail: `${formatCard(event.sourceCardId)} đã can thiệp và vô hiệu hóa phán quyết Hội đồng.`
		};
		case "PURGE_RESOLVED": return formatPurgeMessage(event);
		case "FINAL_DUEL_RESOLVED": return {
			title: "Đấu tay đôi cuối trận đã phân định",
			detail: `${formatCard(event.cardAId)} đoán ${formatGameRoleName(event.guessA)} (${formatCorrectness(event.correctA)}); ${formatCard(event.cardBId)} đoán ${formatGameRoleName(event.guessB)} (${formatCorrectness(event.correctB)}).`
		};
		case "DAWN_PRESENTATION_COMPLETED": return {
			title: "Bình minh đã khép lại",
			detail: "Mọi kết quả trong đêm đã được công bố; vòng đấu chuẩn bị tiếp diễn."
		};
		default: return assertNever(event);
	}
}
function formatEliminationMessage(event) {
	const target = formatCard(event.cardId);
	switch (event.cause.type) {
		case "ABILITY": return {
			title: `${target} đã bị loại`,
			detail: `${formatCard(event.cause.sourceCardId)} kết liễu mục tiêu bằng ${ABILITY_LABELS[event.cause.abilityId]}.`
		};
		case "PLAYER_ABILITY": return {
			title: `${target} gục ngã dưới Huyết Nguyệt`,
			detail: `${PLAYER_LABELS[event.cause.playerId]} đã kích hoạt năng lực đặc biệt.`
		};
		case "COUNCIL": return {
			title: `${target} bị Hội đồng loại bỏ`,
			detail: `Phán quyết được khởi xướng bởi ${PLAYER_LABELS[event.cause.playerId].toLowerCase()}.`
		};
		case "PURGE": return {
			title: `${target} không sống sót qua Thanh Trừng`,
			detail: `Luật ${PURGE_LABELS[event.cause.rule]} đã loại lá bài khỏi bàn đấu.`
		};
		case "REVENGE": return {
			title: `${target} bị kéo theo bởi báo thù`,
			detail: `Dấu ấn từ ${formatCardInline(event.cause.sourceCardId)} đã được kích hoạt.`
		};
		default: return assertNever(event.cause);
	}
}
function formatPurgeMessage(event) {
	const actor = PLAYER_LABELS[event.playerId];
	switch (event.rule) {
		case "CUT": return {
			title: `${actor} chọn Đoạn Tuyệt`,
			detail: event.targetCardId ? `${formatCard(event.targetCardId)} bị chọn để rời bàn đấu.` : "Không có lá bài hợp lệ để loại bỏ."
		};
		case "SWAP": return {
			title: `${actor} thực hiện Hoán Đổi`,
			detail: event.targetCardId && event.swapTargetCardId ? `${formatCard(event.targetCardId)} đổi vị trí với ${formatCardInline(event.swapTargetCardId)}.` : "Không có cặp lá bài hợp lệ để hoán đổi."
		};
		case "REVEAL": return {
			title: `${actor} chọn Vạch Mặt`,
			detail: event.targetCardId ? `${formatCard(event.targetCardId)} buộc phải công khai danh tính.` : "Không còn lá bài ẩn hợp lệ để lật mở."
		};
		case "LOCK": return {
			title: `${actor} tung Phong Tỏa`,
			detail: event.targetCardId ? `${formatCard(event.targetCardId)} bị khóa bởi luật Thanh Trừng.` : "Không có mục tiêu hợp lệ để phong tỏa."
		};
		default: return assertNever(event.rule);
	}
}
function formatCard(cardId) {
	return `Lá ${cardId}`;
}
function formatCardInline(cardId) {
	return `lá ${cardId}`;
}
function formatCardList(cardIds) {
	return cardIds.map(formatCardInline).join(", ");
}
function formatCorrectness(correct) {
	return correct ? "đúng" : "sai";
}
function assertNever(value) {
	throw new Error(`Structured event chưa có history formatter: ${JSON.stringify(value)}`);
}
var DAY_ACTION_ABILITY = {
	SHOOT: AbilityId.SHOOTER_SHOOT,
	MARK: AbilityId.AVENGER_MARK,
	PURIFY: AbilityId.PRIEST_PURIFY,
	REVIVE: AbilityId.WITCH_REVIVE
};
/** Card đang sống theo lifecycle axis, độc lập visibility. */
function isLivingCard(card) {
	return card.state.life === "ALIVE";
}
/** Ability còn dùng được theo resource/effect đã xuất hiện trong filtered view. */
function hasAvailableAbility(card, abilityId) {
	if (!isLivingCard(card)) return false;
	if (card.effects.some((effect) => effect.kind === "PURGE_LOCK")) return false;
	const ability = card.role.abilities.find((candidate) => candidate.abilityId === abilityId);
	return Boolean(ability && (!("remainingUses" in ability) || ability.remainingUses > 0));
}
/** Lọc source card sở hữu một ability đang khả dụng. */
function getAbilitySources(view, abilityId) {
	return view.self.board.filter((card) => hasAvailableAbility(card, abilityId));
}
/** Rule Purge được xác định theo chu kỳ bắt đầu từ Vòng 6. */
function getPurgeRuleForRound(round) {
	if (!Number.isInteger(round) || round < 6) throw new Error("Purge rule chỉ tồn tại từ Vòng 6.");
	return [
		"CUT",
		"SWAP",
		"REVEAL",
		"LOCK"
	][(round - 6) % 4];
}
function parseAction(action) {
	return PlayerGameActionSchema.parse(action);
}
/** Tạo command bỏ lượt cho Day turn hiện tại. */
function createDayPassAction(playerId) {
	return parseAction({
		type: "DAY_SUBMIT",
		playerId,
		action: { type: "PASS" }
	});
}
/** Tạo command dùng role ability ban ngày từ source lên target. */
function createDayAbilityAction(playerId, type, sourceId, targetId) {
	return parseAction({
		type: "DAY_SUBMIT",
		playerId,
		action: {
			type,
			sourceId,
			targetId
		}
	});
}
/** Tạo Council accusation pass, độc lập với reaction order. */
function createCouncilPassAction(playerId) {
	return parseAction({
		type: "COUNCIL_ACCUSATION_SUBMIT",
		playerId,
		order: { type: "PASS" }
	});
}
/** Tạo cáo buộc Council với đúng ba voter khác nhau. */
function createCouncilAccusationAction(playerId, targetId, guessedRole, voterIds) {
	if (voterIds.length !== 3 || new Set(voterIds).size !== 3) throw new Error("Council accusation cần đúng ba voter khác nhau.");
	return parseAction({
		type: "COUNCIL_ACCUSATION_SUBMIT",
		playerId,
		order: {
			type: "ACCUSE",
			targetId,
			guessedRole,
			voterIds
		}
	});
}
/** Tạo Council reaction pass, không thay đổi accusation order. */
function createCouncilReactionPassAction(playerId) {
	return parseAction({
		type: "COUNCIL_REACTION_SUBMIT",
		playerId,
		order: { type: "PASS" }
	});
}
/** Tạo reaction cứu target bằng ability của Sói Hộ Vệ. */
function createCouncilReactionAction(playerId, sourceId, targetId) {
	return parseAction({
		type: "COUNCIL_REACTION_SUBMIT",
		playerId,
		order: {
			type: "WOLF_GUARD_RESCUE",
			sourceId,
			targetId
		}
	});
}
/** Tạo Night pass order cho player. */
function createNightPassAction(playerId) {
	return parseAction({
		type: "NIGHT_SUBMIT",
		playerId,
		order: { type: "PASS" }
	});
}
/** Tạo Night order dùng role ability từ source lên target. */
function createNightAbilityAction(playerId, abilityId, sourceId, targetId) {
	return parseAction({
		type: "NIGHT_SUBMIT",
		playerId,
		order: {
			type: "USE_ABILITY",
			abilityId,
			sourceId,
			targetId
		}
	});
}
/** Tạo Night order dùng special ability Blood Moon lên target. */
function createBloodMoonAction(playerId, targetId) {
	return parseAction({
		type: "NIGHT_SUBMIT",
		playerId,
		order: {
			type: "BLOOD_MOON",
			targetId
		}
	});
}
/** Tạo Defense pass order cho player. */
function createDefensePassAction(playerId) {
	return parseAction({
		type: "DEFENSE_SUBMIT",
		playerId,
		order: { type: "PASS" }
	});
}
/** Tạo Defense order bảo vệ target bằng Guard source. */
function createDefenseProtectAction(playerId, sourceId, targetId) {
	return parseAction({
		type: "DEFENSE_SUBMIT",
		playerId,
		order: {
			type: "PROTECT",
			sourceId,
			targetId
		}
	});
}
/** Bọc Purge order theo rule của round thành shared player command. */
function createPurgeAction(playerId, order) {
	return parseAction({
		type: "PURGE_SUBMIT",
		playerId,
		order
	});
}
/** Tạo dự đoán role trong Final Duel. */
function createFinalGuessAction(playerId, guess) {
	return parseAction({
		type: "FINAL_GUESS_SUBMIT",
		playerId,
		guess
	});
}
var GameInteractionContext = import_react.createContext(null);
/** Owns the prototype's click-through card selection flow for one phase. */
function PrototypeGameInteractionProvider({ view, pendingAction, error, canSubmit, onSubmit, children }) {
	const [interaction, setInteraction] = import_react.useState({ kind: "IDLE" });
	const submit = import_react.useCallback((action) => {
		if (!canSubmit) return;
		setInteraction({ kind: "IDLE" });
		onSubmit(action);
	}, [canSubmit, onSubmit]);
	const selectableCardIds = getSelectableCardIds(view, interaction, canSubmit);
	const selectedCardIds = getSelectedCardIds(interaction);
	const selectCard = import_react.useCallback((cardId) => {
		if (!selectableCardIds.has(cardId) || !canSubmit) return;
		switch (interaction.kind) {
			case "DAY_SOURCE":
				setInteraction({
					kind: "DAY_TARGET",
					actionType: interaction.actionType,
					sourceId: cardId
				});
				return;
			case "DAY_TARGET":
				submit(createDayAbilityAction(view.self.id, interaction.actionType, interaction.sourceId, cardId));
				return;
			case "NIGHT_SOURCE":
				setInteraction({
					kind: "NIGHT_TARGET",
					abilityId: interaction.abilityId,
					sourceId: cardId
				});
				return;
			case "NIGHT_TARGET":
				submit(createNightAbilityAction(view.self.id, interaction.abilityId, interaction.sourceId, cardId));
				return;
			case "BLOOD_MOON_TARGET":
				submit(createBloodMoonAction(view.self.id, cardId));
				return;
			case "DEFENSE_SOURCE":
				setInteraction({
					kind: "DEFENSE_TARGET",
					sourceId: cardId
				});
				return;
			case "DEFENSE_TARGET":
				submit(createDefenseProtectAction(view.self.id, interaction.sourceId, cardId));
				return;
			case "COUNCIL_VOTERS": {
				const selected = interaction.voterIds.includes(cardId) ? interaction.voterIds.filter((id) => id !== cardId) : interaction.voterIds.length < 3 ? [...interaction.voterIds, cardId] : interaction.voterIds;
				setInteraction({
					kind: "COUNCIL_VOTERS",
					voterIds: selected
				});
				return;
			}
			case "COUNCIL_TARGET":
				if (view.opponent.board.find((card) => card.id === cardId)?.state.visibility === "REVEALED") submit(createCouncilAccusationAction(view.self.id, cardId, null, interaction.voterIds));
				else setInteraction({
					kind: "COUNCIL_GUESS",
					voterIds: interaction.voterIds,
					targetId: cardId
				});
				return;
			case "REACTION_SOURCE":
				setInteraction({
					kind: "REACTION_TARGET",
					sourceId: cardId
				});
				return;
			case "REACTION_TARGET":
				submit(createCouncilReactionAction(view.self.id, interaction.sourceId, cardId));
				return;
			case "PURGE_OWN": {
				const rule = getPurgeRuleForRound(view.round);
				if (rule === "SWAP") {
					setInteraction({
						kind: "PURGE_OPPONENT",
						ownTargetId: cardId
					});
					return;
				}
				if (rule === "CUT") {
					submit(createPurgeAction(view.self.id, {
						rule,
						targetId: cardId
					}));
					return;
				}
				if (rule === "REVEAL") {
					submit(createPurgeAction(view.self.id, {
						rule,
						targetId: cardId
					}));
					return;
				}
				submit(createPurgeAction(view.self.id, {
					rule: "LOCK",
					targetId: cardId
				}));
				return;
			}
			case "PURGE_OPPONENT":
				submit(createPurgeAction(view.self.id, {
					rule: "SWAP",
					ownTargetId: interaction.ownTargetId,
					opponentTargetId: cardId
				}));
				return;
			case "IDLE":
			case "COUNCIL_GUESS": return;
		}
	}, [
		canSubmit,
		interaction,
		selectableCardIds,
		submit,
		view
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameInteractionContext.Provider, {
		value: {
			view,
			pendingAction,
			error,
			canSubmit,
			interaction,
			selectableCardIds,
			selectedCardIds,
			selectCard,
			setInteraction,
			submit
		},
		children
	});
}
/** Card-facing selection state shared by both board rows. */
function usePrototypeCardInteraction() {
	const context = useGameInteraction();
	return {
		selectableCardIds: context.selectableCardIds,
		selectedCardIds: context.selectedCardIds,
		selectCard: context.selectCard
	};
}
/** Compact phase prompt; all source/target picking happens directly on cards. */
function PrototypeGameActionPanel() {
	const context = useGameInteraction();
	const { view, pendingAction, error } = context;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-label": "Mệnh lệnh hiện tại",
		className: "mx-auto w-full max-w-3xl rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-xl shadow-black/20 backdrop-blur-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[9px] font-black uppercase tracking-[0.22em] text-amber-200",
					children: ["Vòng ", view.round]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-black text-white",
					children: formatGamePhaseName(view.phase.type)
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhaseControls, { context })]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				role: "alert",
				className: "mt-2 flex items-center justify-center gap-2 text-xs text-rose-100",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4" }),
					" ",
					error.code ?? error.kind,
					": ",
					error.message
				]
			}) : null,
			pendingAction ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 flex items-center justify-center gap-2 text-xs text-indigo-100",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
					" Server đang xác nhận ",
					pendingAction.type,
					"…"
				]
			}) : null
		]
	});
}
function PhaseControls({ context }) {
	const { view, interaction, canSubmit, submit, setInteraction } = context;
	const disabled = !canSubmit;
	const cancel = () => setInteraction({ kind: "IDLE" });
	if (interaction.kind !== "IDLE") {
		if (interaction.kind === "COUNCIL_GUESS") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex max-w-2xl flex-wrap items-center justify-center gap-1.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: `Đoán vai trò của ${interaction.targetId}` }),
				Object.values(CardRole).map((role) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
					label: formatGameRoleName(role),
					disabled,
					onClick: () => submit(createCouncilAccusationAction(view.self.id, interaction.targetId, role, interaction.voterIds))
				}, role)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CancelButton, { onClick: cancel })
			]
		});
		if (interaction.kind === "COUNCIL_VOTERS") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: `Chọn đúng 3 voter trên hàng của bạn · ${interaction.voterIds.length}/3` }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
					label: "Chọn mục tiêu",
					disabled: disabled || interaction.voterIds.length !== 3,
					onClick: () => setInteraction({
						kind: "COUNCIL_TARGET",
						voterIds: interaction.voterIds
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CancelButton, { onClick: cancel })
			]
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: interactionPrompt(interaction) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CancelButton, { onClick: cancel })]
		});
	}
	switch (view.phase.type) {
		case "DAY_A":
		case "DAY_B":
			if (view.activePlayer !== view.self.id) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Đang chờ lượt Ban ngày của đối thủ" });
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Chọn kỹ năng, sau đó nhấp source và target đang phát sáng" }),
					[
						["SHOOT", "Xạ thủ bắn"],
						["MARK", "Đánh dấu báo thù"],
						["PURIFY", "Thanh tẩy"],
						["REVIVE", "Hồi sinh"]
					].map(([actionType, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
						label,
						disabled: disabled || getAbilitySources(view, DAY_ACTION_ABILITY[actionType]).length === 0,
						onClick: () => setInteraction({
							kind: "DAY_SOURCE",
							actionType
						})
					}, actionType)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
						label: "Bỏ lượt",
						tone: "quiet",
						disabled,
						onClick: () => submit(createDayPassAction(view.self.id))
					})
				]
			});
		case "NIGHT_PLAN": {
			const actions = [
				[AbilityId.WEREWOLF_ATTACK, "Ma sói tấn công"],
				[AbilityId.SEER_INSPECT, "Tiên tri soi"],
				[AbilityId.WITCH_POISON, "Phù thủy dùng độc"]
			];
			const bloodMoon = view.self.specialAbilities.find((ability) => ability.abilityId === "BLOOD_MOON");
			const bloodMoonReady = Boolean(bloodMoon && view.round >= bloodMoon.unlockRound && view.round >= bloodMoon.readyRound);
			if (view.self.submissions.night) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Lệnh đêm đã khóa · đang chờ đối thủ" });
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Chọn nguồn lệnh rồi nhấp mục tiêu đối thủ" }),
					actions.map(([abilityId, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
						label,
						disabled: disabled || getAbilitySources(view, abilityId).length === 0,
						onClick: () => setInteraction({
							kind: "NIGHT_SOURCE",
							abilityId
						})
					}, abilityId)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
						label: "Blood Moon",
						disabled: disabled || !bloodMoonReady,
						onClick: () => setInteraction({ kind: "BLOOD_MOON_TARGET" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
						label: "Bỏ lượt",
						tone: "quiet",
						disabled,
						onClick: () => submit(createNightPassAction(view.self.id))
					})
				]
			});
		}
		case "DUSK_DEFENSE":
			if (view.self.submissions.defense) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Khiên đã khóa · đang chờ đối thủ" });
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Chọn Bảo vệ rồi nhấp một lá khác bên mình" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-3.5 w-3.5" }),
						label: "Đặt khiên",
						disabled: disabled || getAbilitySources(view, AbilityId.GUARD_PROTECT).length === 0,
						onClick: () => setInteraction({ kind: "DEFENSE_SOURCE" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
						label: "Không đặt khiên",
						tone: "quiet",
						disabled,
						onClick: () => submit(createDefensePassAction(view.self.id))
					})
				]
			});
		case "COUNCIL_PLAN":
			if (!view.self.submissions.council.accusation) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Lập Hội đồng bằng ba lá phe mình" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
						label: "Chọn 3 người",
						disabled,
						onClick: () => setInteraction({
							kind: "COUNCIL_VOTERS",
							voterIds: []
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
						label: "Bỏ qua Hội đồng",
						tone: "quiet",
						disabled,
						onClick: () => submit(createCouncilPassAction(view.self.id))
					})
				]
			});
			if (!view.self.submissions.council.reaction) {
				const canRescue = getAbilitySources(view, AbilityId.WOLF_GUARD_RESCUE).length > 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Phản ứng Sói Hộ Vệ độc lập với cáo buộc" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
							label: "Bảo kê",
							disabled: disabled || !canRescue,
							onClick: () => setInteraction({ kind: "REACTION_SOURCE" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
							label: "Không bảo kê",
							tone: "quiet",
							disabled,
							onClick: () => submit(createCouncilReactionPassAction(view.self.id))
						})
					]
				});
			}
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Hội đồng đã khóa · đang chờ đối thủ" });
		case "PURGE_PLAN": {
			if (view.self.submissions.purge) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Thanh trừng đã khóa · đang chờ đối thủ" });
			const rule = getPurgeRuleForRound(view.round);
			const ownTargets = getPurgeOwnTargets(view, rule);
			const canSkip = rule === "REVEAL" && ownTargets.length === 0 || rule === "SWAP" && (ownTargets.length === 0 || view.opponent.board.every((card) => !isLivingCard(card)));
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: `Thanh trừng ${rule} · chọn trực tiếp lá phát sáng` }), canSkip ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
					label: "Xác nhận không có mục tiêu",
					disabled,
					onClick: () => submit(rule === "SWAP" ? createPurgeAction(view.self.id, {
						rule,
						ownTargetId: null,
						opponentTargetId: null
					}) : createPurgeAction(view.self.id, {
						rule: "REVEAL",
						targetId: null
					}))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
					label: "Bắt đầu chọn",
					disabled,
					onClick: () => setInteraction({ kind: "PURGE_OWN" })
				})]
			});
		}
		case "FINAL_DUEL":
			if (view.self.submissions.finalGuess) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Dự đoán đã khóa · đang chờ kết quả" });
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex max-w-2xl flex-wrap items-center justify-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Đoán vai trò cuối của đối thủ" }), Object.values(CardRole).map((role) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
					label: formatGameRoleName(role),
					disabled,
					onClick: () => submit(createFinalGuessAction(view.self.id, role))
				}, role))]
			});
		case "COUNCIL_RESOLUTION":
		case "NIGHT_RESOLUTION":
		case "DAWN":
		case "PURGE_RESOLUTION": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Server đang công bố kết quả · thao tác tạm khóa" });
		case "SETUP": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Sắp xếp và khóa bộ bài ở khu vực Setup" });
		case "ENDED": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Prompt, { text: "Trận đấu đã kết thúc" });
	}
}
function getSelectableCardIds(view, interaction, canSubmit) {
	if (!canSubmit) return /* @__PURE__ */ new Set();
	switch (interaction.kind) {
		case "DAY_SOURCE": return cardIdSet(getAbilitySources(view, DAY_ACTION_ABILITY[interaction.actionType]));
		case "DAY_TARGET": return cardIdSet(interaction.actionType === "REVIVE" ? view.self.board.filter((card) => !isLivingCard(card)) : view.opponent.board.filter((card) => isLivingCard(card) && (interaction.actionType !== "SHOOT" || card.state.visibility === "REVEALED")));
		case "NIGHT_SOURCE": return cardIdSet(getAbilitySources(view, interaction.abilityId));
		case "NIGHT_TARGET": return cardIdSet(view.opponent.board.filter(isLivingCard));
		case "BLOOD_MOON_TARGET": return cardIdSet(view.opponent.board.filter((card) => isLivingCard(card) && card.state.visibility === "REVEALED"));
		case "DEFENSE_SOURCE": return cardIdSet(getAbilitySources(view, AbilityId.GUARD_PROTECT));
		case "DEFENSE_TARGET": {
			const guard = view.self.board.find((card) => card.id === interaction.sourceId)?.role.abilities.find((ability) => ability.abilityId === AbilityId.GUARD_PROTECT);
			const lastTarget = guard && "lastTarget" in guard ? guard.lastTarget?.instanceId : null;
			return cardIdSet(view.self.board.filter((card) => isLivingCard(card) && card.id !== interaction.sourceId && card.instanceId !== lastTarget));
		}
		case "COUNCIL_VOTERS": return cardIdSet(view.self.board.filter((card) => isLivingCard(card) && !card.effects.some((effect) => effect.kind === "COUNCIL_LOCK" || effect.kind === "PURGE_LOCK")));
		case "COUNCIL_TARGET": return cardIdSet(view.opponent.board.filter(isLivingCard));
		case "REACTION_SOURCE": return cardIdSet(getAbilitySources(view, AbilityId.WOLF_GUARD_RESCUE));
		case "REACTION_TARGET": return cardIdSet(view.self.board.filter(isLivingCard));
		case "PURGE_OWN": return cardIdSet(getPurgeOwnTargets(view, getPurgeRuleForRound(view.round)));
		case "PURGE_OPPONENT": return cardIdSet(view.opponent.board.filter(isLivingCard));
		case "IDLE":
		case "COUNCIL_GUESS": return /* @__PURE__ */ new Set();
	}
}
function getSelectedCardIds(interaction) {
	switch (interaction.kind) {
		case "DAY_TARGET":
		case "NIGHT_TARGET":
		case "DEFENSE_TARGET":
		case "REACTION_TARGET": return /* @__PURE__ */ new Set([interaction.sourceId]);
		case "COUNCIL_VOTERS":
		case "COUNCIL_TARGET": return new Set(interaction.voterIds);
		case "COUNCIL_GUESS": return /* @__PURE__ */ new Set([...interaction.voterIds, interaction.targetId]);
		case "PURGE_OPPONENT": return /* @__PURE__ */ new Set([interaction.ownTargetId]);
		default: return /* @__PURE__ */ new Set();
	}
}
function getPurgeOwnTargets(view, rule) {
	return view.self.board.filter((card) => isLivingCard(card) && (rule !== "REVEAL" || card.state.visibility === "HIDDEN"));
}
function cardIdSet(cards) {
	return new Set(cards.map((card) => card.id));
}
function useGameInteraction() {
	const context = import_react.useContext(GameInteractionContext);
	if (!context) throw new Error("Prototype game interaction requires its provider.");
	return context;
}
function interactionPrompt(interaction) {
	switch (interaction.kind) {
		case "DAY_SOURCE":
		case "NIGHT_SOURCE": return "Bước 1 · Chọn lá nguồn đang phát sáng";
		case "DAY_TARGET":
		case "NIGHT_TARGET": return `Bước 2 · ${interaction.sourceId} đã chọn, nhấp lá mục tiêu`;
		case "BLOOD_MOON_TARGET": return "Chọn một role đối thủ đã lộ";
		case "DEFENSE_SOURCE": return "Bước 1 · Chọn Bảo vệ đang phát sáng";
		case "DEFENSE_TARGET": return `Bước 2 · Chọn lá nhận khiên từ ${interaction.sourceId}`;
		case "COUNCIL_TARGET": return "Đủ 3 voter · chọn một lá đối thủ";
		case "REACTION_SOURCE": return "Chọn Sói Hộ Vệ đang phát sáng";
		case "REACTION_TARGET": return `Chọn lá được ${interaction.sourceId} bảo kê`;
		case "PURGE_OWN": return "Chọn một lá phe mình đang phát sáng";
		case "PURGE_OPPONENT": return `${interaction.ownTargetId} đã chọn · chọn lá đối thủ để SWAP`;
		default: return "";
	}
}
function Prompt({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
		className: "text-xs leading-relaxed text-white",
		children: text
	});
}
function ActionButton({ label, onClick, disabled, tone = "primary", icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		disabled,
		onClick,
		className: `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 ${tone === "primary" ? "border-amber-200/35 bg-amber-300/20 text-amber-50 hover:bg-amber-300/30" : "border-white/15 bg-black/15 text-slate-200 hover:bg-white/10"}`,
		children: [icon, label]
	});
}
function CancelButton({ onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-bold text-slate-200 hover:bg-white/10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-3 w-3" }), " Chọn lại"]
	});
}
var ROLE_ART = {
	[CardRole.VILLAGER]: "/characters/dan-lang.png",
	[CardRole.WEREWOLF]: "/characters/ma-soi-thuong.png",
	[CardRole.SEER]: "/characters/tien-tri.png",
	[CardRole.GUARD]: "/characters/bao-ve.png",
	[CardRole.WITCH]: "/characters/phu-thuy.webp",
	[CardRole.SHOOTER]: "/characters/xa-thu.webp",
	[CardRole.AVENGER]: "/characters/ke-bao-thu.png",
	[CardRole.PRIEST]: "/characters/muc-su.png",
	[CardRole.WOLF_GUARD]: "/characters/soi-ho-ve.webp"
};
var TOOLTIP_WIDTH = 288;
/** Render card theo visual prototype mà không suy diễn hidden role. */
function PrototypeGameCard(props) {
	const wrapperRef = import_react.useRef(null);
	const tooltipId = import_react.useId();
	const [tooltipPosition, setTooltipPosition] = import_react.useState(null);
	const { card } = props;
	const dead = card.state.life === "DEAD";
	const revealed = card.state.visibility === "REVEALED";
	const role = props.kind === "self" ? props.card.role.id : props.card.role;
	const roleName = role ? formatGameRoleName(role) : "Vai trò ẩn";
	const tooltip = role ? getGameRoleTooltipContent(role) : null;
	const protectedCard = card.effects.some((effect) => effect.kind === "PROTECTION");
	props.kind === "self" && props.card.role.abilities.filter((ability) => "remainingUses" in ability).map((ability) => `${ability.abilityId}: ${ability.remainingUses}`);
	const showTooltip = import_react.useCallback(() => {
		if (!tooltip || !wrapperRef.current) return;
		const rect = wrapperRef.current.getBoundingClientRect();
		const halfWidth = TOOLTIP_WIDTH / 2;
		const left = Math.min(window.innerWidth - halfWidth - 8, Math.max(152, rect.left + rect.width / 2));
		const placement = rect.top >= 180 ? "top" : "bottom";
		setTooltipPosition({
			left,
			top: placement === "top" ? rect.top - 10 : rect.bottom + 10,
			placement
		});
	}, [tooltip]);
	const hideTooltip = import_react.useCallback(() => setTooltipPosition(null), []);
	import_react.useEffect(() => {
		if (!tooltipPosition) return;
		const handleKeyDown = (event) => {
			if (event.key === "Escape") hideTooltip();
		};
		window.addEventListener("resize", hideTooltip);
		window.addEventListener("scroll", hideTooltip, true);
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("resize", hideTooltip);
			window.removeEventListener("scroll", hideTooltip, true);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [hideTooltip, tooltipPosition]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrapperRef,
		className: "relative min-w-0",
		role: !props.selectable && tooltip ? "group" : void 0,
		tabIndex: !props.selectable && tooltip ? 0 : void 0,
		"aria-label": !props.selectable && tooltip ? `${card.id} · ${roleName}` : void 0,
		"aria-describedby": !props.selectable && tooltip ? tooltipId : void 0,
		onPointerEnter: showTooltip,
		onPointerLeave: () => {
			if (!wrapperRef.current?.contains(document.activeElement)) hideTooltip();
		},
		onFocus: showTooltip,
		onBlur: (event) => {
			if (!event.currentTarget.contains(event.relatedTarget)) hideTooltip();
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				"data-card-id": card.id,
				"aria-label": `${card.id} · ${roleName}`,
				"aria-describedby": tooltip ? tooltipId : void 0,
				"aria-pressed": props.selected,
				disabled: !props.selectable,
				onClick: () => props.onSelect(card.id),
				className: `group relative flex min-h-36 w-full flex-col overflow-hidden rounded-lg border p-1.5 text-left shadow-lg shadow-black/25 transition-[transform,box-shadow,opacity,filter] ${props.selectable ? "cursor-pointer ring-2 ring-amber-200/80 hover:-translate-y-2 hover:brightness-110" : "cursor-default"} ${props.selected ? "z-10 -translate-y-1 ring-4 ring-cyan-200 shadow-cyan-200/40" : ""} ${dead ? "border-slate-700 bg-slate-950/80 opacity-45 grayscale" : props.kind === "self" ? "border-amber-600/60 bg-gradient-to-br from-amber-900/70 to-slate-950" : revealed ? "border-amber-400/80 bg-gradient-to-br from-amber-900/50 to-slate-950 shadow-amber-500/10" : "border-slate-600/70 bg-[radial-gradient(circle_at_center,_#1f2937_0_18%,_#0f172a_19%_38%,_#111827_39%)]"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: card.id }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1",
							children: [revealed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-3.5 w-3.5" }), dead ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skull, { className: "h-3.5 w-3.5 text-rose-400" }) : null]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative my-1.5 flex min-h-20 flex-1 overflow-hidden rounded border border-black/35 bg-black/20 text-center",
						children: [role ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: ROLE_ART[role],
							alt: `Minh họa ${roleName}`,
							loading: "lazy",
							decoding: "async",
							className: "h-full min-h-20 w-full object-cover object-top"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid min-h-20 w-full place-items-center bg-[radial-gradient(circle,#334155_0_18%,#172033_19%_40%,#101827_41%)] font-serif text-3xl text-slate-300",
							children: "TF"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1 pb-1 pt-5",
							children: [role ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "block truncate text-[10px] leading-tight text-amber-50",
								children: roleName
							}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[8px] text-slate-300",
								children: card.instanceId
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-1 text-[8px] text-slate-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded bg-slate-900/70 px-1.5 py-0.5",
									children: card.state.life
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded bg-slate-900/70 px-1.5 py-0.5",
									children: card.state.visibility
								}),
								protectedCard ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 rounded bg-emerald-950/70 px-1.5 py-0.5 text-emerald-300",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-3 w-3" }), " PROTECTION"]
								}) : null
							]
						})
					})
				]
			}),
			tooltip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				id: tooltipId,
				className: "sr-only",
				children: [
					tooltip.name,
					". ",
					tooltip.faction,
					". ",
					tooltip.description
				]
			}) : null,
			tooltip && tooltipPosition && typeof document !== "undefined" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				role: "tooltip",
				"aria-hidden": "true",
				className: "pointer-events-none fixed z-[100]",
				style: {
					left: tooltipPosition.left,
					top: tooltipPosition.top,
					transform: tooltipPosition.placement === "top" ? "translate(-50%, -100%)" : "translateX(-50%)"
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-card-tooltip": card.id,
					"data-placement": tooltipPosition.placement,
					className: `w-72 rounded-xl border border-amber-300/25 bg-slate-950/95 p-3 text-left shadow-2xl shadow-black/60 backdrop-blur-md ${tooltipPosition.placement === "top" ? "card-tooltip-enter-top" : "card-tooltip-enter-bottom"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-sm text-amber-100",
							children: tooltip.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400",
							children: tooltip.faction
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[11px] leading-relaxed text-slate-300",
						children: tooltip.description
					})]
				})
			}), document.body) : null
		]
	});
}
/**
* Render gameplay bằng information architecture của PO prototype.
*
* Đây là presentation tạm: opponent board và self board kẹp battlefield ở
* giữa, còn side rail giữ vị trí history. Snapshot v0.2 vẫn là nguồn dữ liệu
* duy nhất và component không resolve gameplay rule.
*/
function PrototypeGameBoard(props) {
	const phaseKey = `${props.view.round}:${props.view.phase.type}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeGameInteractionProvider, {
		view: props.view,
		pendingAction: props.pendingAction,
		error: props.error,
		canSubmit: props.canSubmit,
		onSubmit: props.onSubmit,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeGameArena, { view: props.view })
	}, phaseKey);
}
function PrototypeGameArena({ view }) {
	const scene = getPrototypeScene(view.phase.type);
	const selfAlive = countLivingCards(view.self.board);
	const opponentAlive = countLivingCards(view.opponent.board);
	const interaction = usePrototypeCardInteraction();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-prototype-layout": "arena-side-rail",
		"data-prototype-scene": scene,
		className: `relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4 ${getSceneClass(scene)}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeTopbar, {
			view,
			scene
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_19rem]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "grid min-w-0 grid-rows-[auto_minmax(17rem,1fr)_auto] gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeBoardSection, {
						title: `Đối thủ · ${view.opponent.id}`,
						hint: "Vai trò công khai được nhấn sáng",
						alive: opponentAlive,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skull, { className: "h-4 w-4 text-rose-400" }),
						children: view.opponent.board.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeGameCard, {
							kind: "opponent",
							card,
							selectable: interaction.selectableCardIds.has(card.id),
							selected: interaction.selectedCardIds.has(card.id),
							onSelect: interaction.selectCard
						}, card.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: `relative flex min-h-0 items-center justify-center overflow-y-auto rounded-xl border p-3 sm:p-5 ${getBattlefieldClass(scene)}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-x-6 top-1/2 border-t border-dashed border-white/10" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative z-10 w-full",
							children: [view.result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeResult, { view }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeGameActionPanel, {})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeBoardSection, {
						title: `Tay của bạn · ${view.self.id}`,
						hint: "Thông tin vai trò chỉ hiện với bạn",
						alive: selfAlive,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-4 w-4 text-sky-300" }),
						children: view.self.board.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeGameCard, {
							kind: "self",
							card,
							selectable: interaction.selectableCardIds.has(card.id),
							selected: interaction.selectedCardIds.has(card.id),
							onSelect: interaction.selectCard
						}, card.id))
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeHistoryRail, { events: view.events })]
		})]
	});
}
function PrototypeTopbar({ view, scene }) {
	const daylight = scene === "day" || scene === "dawn";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex flex-wrap items-center gap-3 border-b border-white/10 bg-black/15 px-2 pb-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid h-9 w-9 place-items-center rounded-full border border-slate-300 font-serif text-[10px] font-black tracking-tighter",
				children: "TF"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-black tracking-[0.18em] text-slate-100",
				children: "TWOFOLD"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[10px] text-slate-400",
				children: ["Prototype presentation · Vòng ", view.round]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-widest",
				children: [daylight ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "h-3.5 w-3.5 text-amber-300" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "h-3.5 w-3.5 text-indigo-300" }), formatGamePhaseName(view.phase.type)]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[9px] text-slate-400",
				children: view.activePlayer ? `Đang hành động · ${formatGamePlayerName(view.activePlayer)}` : "Hai bên cùng chọn / đang phân giải"
			})
		]
	});
}
function PrototypeBoardSection({ title, hint, alive, icon, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "min-w-0 rounded-xl border border-white/[0.07] bg-black/15 px-2 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mb-1 flex items-end justify-between gap-3 px-1 text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "flex items-center gap-2 font-black uppercase tracking-[0.12em] text-slate-200",
				children: [icon, title]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-right text-[9px] text-slate-400",
				children: [
					hint,
					" · ",
					alive,
					"/10 sống"
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto px-1 py-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid min-w-[680px] grid-cols-10 gap-1.5",
				children
			})
		})]
	});
}
function PrototypeResult({ view }) {
	if (!view.result) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto mb-3 flex max-w-2xl items-center justify-center gap-3 rounded-lg border border-amber-500/30 bg-amber-950/60 p-3 text-sm text-amber-100",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "h-5 w-5 text-amber-300" }),
			"Winner: ",
			view.result.winner ?? "DRAW",
			" · ",
			view.result.reason
		]
	});
}
function PrototypeHistoryRail({ events }) {
	const recentEvents = events.slice(-12).reverse();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "flex min-h-52 flex-col rounded-xl border border-white/10 bg-slate-950/80 p-4 lg:min-h-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "border-b border-white/10 pb-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "flex items-center gap-2 text-sm font-bold text-slate-100",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-4 w-4 text-amber-300" }), " Lịch sử trận đấu"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-[9px] leading-relaxed text-slate-500",
				children: "Những diễn biến gần nhất được ghi lại theo thứ tự thời gian."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto",
			children: recentEvents.length > 0 ? recentEvents.map((event) => {
				const message = formatGameHistoryMessage(event);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "border-l-2 border-slate-700 pl-2 text-[10px] leading-relaxed text-slate-400",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono text-slate-500",
							children: [
								"#",
								event.sequence,
								" · V",
								event.round
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "block text-slate-200",
							children: message.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-slate-400",
							children: message.detail
						})
					]
				}, event.id);
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "rounded-lg border border-dashed border-slate-800 p-3 text-center text-[10px] text-slate-500",
				children: "Chưa có structured event."
			})
		})]
	});
}
function countLivingCards(cards) {
	return cards.filter((card) => card.state.life === "ALIVE").length;
}
function getPrototypeScene(phase) {
	switch (phase) {
		case "PURGE_PLAN":
		case "PURGE_RESOLUTION": return "purge";
		case "DUSK_DEFENSE": return "dusk";
		case "NIGHT_PLAN":
		case "NIGHT_RESOLUTION": return "night";
		case "DAWN": return "dawn";
		default: return "day";
	}
}
function getSceneClass(scene) {
	switch (scene) {
		case "purge": return "bg-[radial-gradient(circle_at_50%_-10%,#ad4d59_0%,#552531_42%,#1d0d15_88%)]";
		case "dusk": return "bg-[radial-gradient(circle_at_50%_-10%,#a66475_0%,#51405f_42%,#171b31_88%)]";
		case "night": return "bg-[radial-gradient(circle_at_50%_-10%,#426fa8_0%,#213b68_42%,#0a1830_88%)]";
		case "dawn": return "bg-[radial-gradient(circle_at_50%_-10%,#efc16f_0%,#936c43_40%,#293947_88%)]";
		case "day": return "bg-[radial-gradient(circle_at_50%_-10%,#d5b36e_0%,#71613c_40%,#25313b_88%)]";
	}
}
function getBattlefieldClass(scene) {
	switch (scene) {
		case "purge": return "border-rose-200/20 bg-[radial-gradient(circle_at_center,rgba(221,84,93,.3)_0_18%,transparent_19%),linear-gradient(180deg,rgba(103,37,47,.76),rgba(39,15,23,.88))]";
		case "dusk": return "border-fuchsia-100/15 bg-[radial-gradient(circle_at_center,rgba(202,128,175,.24)_0_18%,transparent_19%),linear-gradient(180deg,rgba(85,62,95,.76),rgba(29,28,53,.88))]";
		case "night": return "border-blue-100/15 bg-[radial-gradient(circle_at_center,rgba(90,139,218,.28)_0_18%,transparent_19%),linear-gradient(180deg,rgba(39,67,113,.82),rgba(10,25,51,.9))]";
		case "dawn": return "border-amber-100/30 bg-[radial-gradient(circle_at_center,rgba(255,224,151,.42)_0_18%,transparent_19%),linear-gradient(180deg,rgba(141,104,65,.78),rgba(42,56,67,.88))]";
		case "day": return "border-amber-100/20 bg-[radial-gradient(circle_at_center,rgba(244,206,119,.32)_0_18%,transparent_19%),linear-gradient(180deg,rgba(111,96,60,.76),rgba(37,49,59,.88))]";
	}
}
var PRESENTATION_DURATION_MS = 2200;
var PRESENTATION_CLASS = {
	DAY: "border-amber-300/40 bg-amber-950/95 text-amber-50",
	COUNCIL: "border-violet-300/40 bg-violet-950/95 text-violet-50",
	DEFENSE: "border-sky-300/40 bg-sky-950/95 text-sky-50",
	NIGHT: "border-indigo-300/40 bg-indigo-950/95 text-indigo-50",
	DAWN: "border-orange-200/50 bg-orange-950/95 text-orange-50",
	PURGE: "border-rose-300/40 bg-rose-950/95 text-rose-50",
	FINAL_DUEL: "border-yellow-200/50 bg-slate-950/95 text-yellow-50",
	GENERIC: "border-slate-300/30 bg-slate-950/95 text-slate-50"
};
/** Phát tuần tự event hiện tại rồi báo actor chuyển sang event kế tiếp. */
function PrototypeGameEventPresentation() {
	const actor = GamePresentationActorContext.useActorRef();
	const current = GamePresentationActorContext.useSelector(selectCurrentPresentation);
	const kind = GamePresentationActorContext.useSelector(selectPresentationKind);
	const queuedCount = GamePresentationActorContext.useSelector(selectQueuedPresentationCount);
	(0, import_react.useEffect)(() => {
		if (current === null) return;
		const timeoutId = window.setTimeout(() => {
			actor.send({ type: "PRESENTATION_COMPLETED" });
		}, PRESENTATION_DURATION_MS);
		return () => window.clearTimeout(timeoutId);
	}, [actor, current]);
	if (current === null || kind === null) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeGameEventPresentationCard, {
		current,
		kind,
		queuedCount,
		onSkipCurrent: () => actor.send({ type: "SKIP_CURRENT" }),
		onSkipAll: () => actor.send({ type: "SKIP_ALL" })
	});
}
/** Markup thuần của một event để render test không cần khởi tạo actor React. */
function PrototypeGameEventPresentationCard({ current, kind, queuedCount, onSkipCurrent, onSkipAll }) {
	const message = formatGameHistoryMessage(current);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none fixed inset-x-3 top-4 z-50 flex justify-center sm:top-6",
		"aria-live": "polite",
		"aria-atomic": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			role: "status",
			"data-presentation-kind": kind,
			"data-presentation-sequence": current.sequence,
			className: `game-presentation-event pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md ${PRESENTATION_CLASS[kind]}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-current/20 bg-black/20",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PresentationIcon, { kind })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[9px] font-black uppercase tracking-[0.18em] opacity-60",
									children: ["Diễn biến mới · Vòng ", current.round]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "mt-0.5 block text-sm",
									children: message.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 text-xs leading-relaxed opacity-75",
									children: message.detail
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "rounded-lg border border-current/15 p-2 opacity-60 transition hover:bg-white/10 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
							onClick: onSkipCurrent,
							"aria-label": "Bỏ qua diễn biến hiện tại",
							title: "Bỏ qua",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, { className: "h-4 w-4" })
						})
					]
				}),
				queuedCount > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "mt-2 text-[9px] font-semibold uppercase tracking-wider opacity-55 transition hover:opacity-100",
					onClick: onSkipAll,
					children: [
						"Bỏ qua tất cả (",
						queuedCount,
						")"
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "game-presentation-progress absolute inset-x-0 bottom-0 h-0.5 bg-current/70" })
			]
		}, current.id)
	});
}
function PresentationIcon({ kind }) {
	const className = "h-4 w-4";
	switch (kind) {
		case "DAY": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className });
		case "COUNCIL": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className });
		case "DEFENSE": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className });
		case "NIGHT": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className });
		case "DAWN": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className });
		case "PURGE":
		case "FINAL_DUEL":
		case "GENERIC": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className });
	}
}
/**
* Validate một danh sách instance ID thành setup tuple đủ 10 lá, không trùng.
*
* @throws Khi số lượng khác 10 hoặc có instance ID trùng nhau.
*/
function toSetupOrder(ids) {
	if (ids.length !== 10) throw new Error("Setup order phải chứa đúng 10 card.");
	if (new Set(ids).size !== ids.length) throw new Error("Setup order không được chứa card instance trùng nhau.");
	return ids;
}
/** Tạo stable comparison key cho authoritative/draft order. */
function setupOrderKey(order) {
	return order.join("|");
}
/** Tạo local draft ban đầu từ private board đã được server sắp theo slot. */
function createSetupDraft(board) {
	const order = toSetupOrder(board.map((card) => card.instanceId));
	return {
		authoritativeKey: setupOrderKey(order),
		order
	};
}
/**
* Di chuyển một card trong draft bằng index, không mutate tuple đầu vào.
*
* Index ngoài phạm vi hoặc hai index giống nhau trả lại chính order hiện tại.
*/
function moveSetupCard(order, fromIndex, toIndex) {
	if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= order.length || toIndex < 0 || toIndex >= order.length) return order;
	const next = [...order];
	const [moved] = next.splice(fromIndex, 1);
	next.splice(toIndex, 0, moved);
	return toSetupOrder(next);
}
/**
* Reconcile local draft khi authoritative board order thay đổi.
*
* Snapshot mới có cùng order giữ nguyên object/draft để không xóa chỉnh sửa
* chưa lưu. Khi server xác nhận order khác, draft được thay bằng baseline mới.
*/
function reconcileSetupDraft(draft, authoritativeOrder) {
	const authoritativeKey = setupOrderKey(authoritativeOrder);
	return authoritativeKey === draft.authoritativeKey ? draft : {
		authoritativeKey,
		order: authoritativeOrder
	};
}
/** Tạo action v0.2 lưu setup order nhưng chưa khóa đội hình. */
function createSetupReorderAction(playerId, order) {
	return {
		type: "SETUP_REORDER",
		playerId,
		order: [...order]
	};
}
/** Tạo action v0.2 khóa authoritative setup hiện tại. */
function createSetupLockAction(playerId) {
	return {
		type: "SETUP_LOCK",
		playerId
	};
}
/** Authoritative Setup UI với local reorder draft tách khỏi server snapshot. */
function GameSetupPanel({ player, pendingAction, error, canSubmit, onSubmit }) {
	const authoritativeKey = setupOrderKey(player.board.map((card) => card.instanceId));
	const authoritativeOrder = import_react.useMemo(() => toSetupOrder(player.board.map((card) => card.instanceId)), [authoritativeKey]);
	const [draft, setDraft] = import_react.useState(() => createSetupDraft(player.board));
	import_react.useEffect(() => {
		setDraft((current) => reconcileSetupDraft(current, authoritativeOrder));
	}, [authoritativeOrder]);
	const cardByInstanceId = import_react.useMemo(() => new Map(player.board.map((card) => [card.instanceId, card])), [player.board]);
	const locked = player.setup.status === "LOCKED";
	const pendingSetup = pendingAction?.type === "SETUP_REORDER" || pendingAction?.type === "SETUP_LOCK";
	const editable = !locked && !pendingSetup;
	const dirty = setupOrderKey(draft.order) !== draft.authoritativeKey;
	const moveCard = import_react.useCallback((fromIndex, toIndex) => {
		if (!editable) return;
		setDraft((current) => ({
			...current,
			order: moveSetupCard(current.order, fromIndex, toIndex)
		}));
	}, [editable]);
	const saveOrder = () => {
		if (!canSubmit || !dirty || locked) return;
		onSubmit(createSetupReorderAction(player.id, draft.order));
	};
	const lockSetup = () => {
		if (!canSubmit || dirty || locked) return;
		onSubmit(createSetupLockAction(player.id));
	};
	if (locked) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "mx-auto flex w-full max-w-5xl flex-1 items-center justify-center p-4 sm:p-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "mx-auto mb-4 h-10 w-10 text-emerald-400" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold text-slate-100",
					children: "Đội hình đã khóa"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-slate-400",
					children: "Đang chờ đối thủ khóa đội hình. Phase tiếp theo sẽ do server cập nhật."
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "rounded-2xl border border-slate-800 bg-surface/70 p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-semibold uppercase tracking-widest text-indigo-400",
						children: ["Setup · Player ", player.id]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 text-xl font-bold text-slate-100",
						children: "Sắp xếp đội hình"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-slate-400",
						children: "Kéo thả hoặc dùng nút mũi tên. Lưu thứ tự trước khi khóa đội hình."
					})
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "alert",
				className: "flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 h-4 w-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: error.code ?? error.kind }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-rose-300/80",
					children: error.message
				})] })]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-3 sm:grid-cols-5",
				children: draft.order.map((instanceId, index) => {
					const card = cardByInstanceId.get(instanceId);
					if (!card) return null;
					const roleName = formatGameRoleName(card.role.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						"data-setup-card": instanceId,
						draggable: editable,
						onDragStart: (event) => {
							event.dataTransfer.effectAllowed = "move";
							event.dataTransfer.setData("text/twofold-card-index", String(index));
						},
						onDragOver: (event) => {
							if (editable) event.preventDefault();
						},
						onDrop: (event) => {
							event.preventDefault();
							const fromIndex = Number(event.dataTransfer.getData("text/twofold-card-index"));
							if (Number.isInteger(fromIndex)) moveCard(fromIndex, index);
						},
						className: "group flex min-h-44 flex-col rounded-xl border border-slate-700/70 bg-surface-highlight/40 p-3 transition-colors hover:border-indigo-500/60",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-xs text-slate-400",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono font-bold",
									children: ["Vị trí ", index + 1]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, {
									className: "h-4 w-4",
									"aria-hidden": "true"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-1 flex-col items-center justify-center gap-2 text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-bold text-indigo-200",
									children: roleName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-[10px] text-slate-500",
									children: instanceId
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": `Đưa ${roleName} sang trái`,
									onClick: () => moveCard(index, index - 1),
									disabled: !editable || index === 0,
									className: "flex justify-center rounded-lg border border-slate-700 bg-slate-900/60 p-2 text-slate-300 hover:border-indigo-500 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-30",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": `Đưa ${roleName} sang phải`,
									onClick: () => moveCard(index, index + 1),
									disabled: !editable || index === draft.order.length - 1,
									className: "flex justify-center rounded-lg border border-slate-700 bg-slate-900/60 p-2 text-slate-300 hover:border-indigo-500 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-30",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" })
								})]
							})
						]
					}, instanceId);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-800 bg-surface/70 p-4 sm:flex-row sm:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-slate-400",
					children: pendingSetup ? "Đang chờ server xác nhận…" : dirty ? "Thứ tự hiện tại chưa được lưu." : "Thứ tự đã khớp snapshot server."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: saveOrder,
						disabled: !canSubmit || !dirty || pendingSetup,
						className: "inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-950/50 px-5 py-3 text-sm font-bold text-indigo-200 hover:bg-indigo-900/60 disabled:cursor-not-allowed disabled:opacity-40",
						children: [pendingAction?.type === "SETUP_REORDER" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), "Lưu thứ tự"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: lockSetup,
						disabled: !canSubmit || dirty || pendingSetup,
						className: "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40",
						children: [pendingAction?.type === "SETUP_LOCK" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4" }), "Khóa đội hình"]
					})]
				})]
			})
		]
	});
}
/** Mount stable session/presentation actors for one gameplay route instance. */
function GameSessionRuntime(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameSessionActorContext.Provider, {
		options: { input: {
			roomId: props.roomId,
			playerName: props.playerName,
			transport: props.transport,
			...props.reconnectSessionId ? { reconnectSessionId: props.reconnectSessionId } : {},
			...props.onSessionIdChange ? { onSessionIdChange: props.onSessionIdChange } : {}
		} },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GamePresentationActorContext.Provider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameSessionContent, {}) })
	});
}
function GameSessionContent() {
	const actor = GameSessionActorContext.useActorRef();
	const connection = GameSessionActorContext.useSelector(selectConnection);
	const view = GameSessionActorContext.useSelector(selectView);
	const pendingAction = GameSessionActorContext.useSelector(selectPendingAction);
	const error = GameSessionActorContext.useSelector(selectSessionError);
	const canSubmit = GameSessionActorContext.useSelector(selectCanSubmit);
	const retryConnection = () => {
		actor.send({ type: connection === "reconnecting" ? "RECONNECT" : "CONNECT" });
	};
	const presentation = view ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GamePresentationSync, {
		gameId: view.gameId,
		events: view.events
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeGameEventPresentation, {})] }) : null;
	if (view === null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "mx-auto flex w-full max-w-xl flex-1 items-center justify-center p-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full rounded-2xl border border-slate-800 bg-surface/70 p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-semibold uppercase tracking-widest text-indigo-400",
					children: ["Game session · ", String(connection)]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-xl font-bold text-slate-100",
					children: "Đang chờ authoritative snapshot"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-slate-400",
					children: "Client sẽ render Setup sau khi server gửi `GAME_STATE_UPDATE` v0.2."
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					role: "alert",
					className: "mt-4 text-sm text-rose-300",
					children: [
						error.code ?? error.kind,
						": ",
						error.message
					]
				}) : null,
				connection === "reconnecting" || connection === "closed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: retryConnection,
					className: "mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500",
					children: "Kết nối lại"
				}) : null
			]
		})
	});
	if (view.phase.type === "SETUP") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [presentation, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameSetupPanel, {
		player: view.self,
		pendingAction,
		error,
		canSubmit,
		onSubmit: (action) => actor.send({
			type: "SUBMIT_ACTION",
			action
		})
	})] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [presentation, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrototypeGameBoard, {
		view,
		pendingAction,
		error,
		canSubmit,
		onSubmit: (action) => actor.send({
			type: "SUBMIT_ACTION",
			action
		})
	})] });
}
/** Compose route params, transport và authoritative game actor runtime. */
function GameRouteComponent() {
	const { id: roomId } = Route$1.useParams();
	const { name, reconnectSessionId } = Route$1.useSearch();
	const endpoint = "/api/ws";
	const effectiveSessionId = import_react.useMemo(() => reconnectSessionId ?? readGameSessionId(roomId), [reconnectSessionId, roomId]);
	const persistSessionId = import_react.useCallback((sessionId) => writeGameSessionId(roomId, sessionId), [roomId]);
	const transport = import_react.useMemo(() => new BrowserGameTransport(endpoint), [endpoint]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameSessionRuntime, {
		roomId,
		playerName: name,
		reconnectSessionId: effectiveSessionId ?? void 0,
		onSessionIdChange: persistSessionId,
		transport
	});
}
//#endregion
export { GameRouteComponent as component };
