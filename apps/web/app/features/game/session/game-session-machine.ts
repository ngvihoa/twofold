import {
  ClientWsMessageSchema,
  ServerWsMessageSchema,
  type ClientWsMessage,
  type GamePlayerViewV2,
  type PlayerGameAction,
  type PlayerId,
  type ServerWsMessage,
} from '@twofold/shared-types';
import {
  assign,
  fromCallback,
  sendTo,
  setup,
  type SnapshotFrom,
} from 'xstate';
import type { GameTransport } from './game-transport';

type MessagePayload<TType extends ServerWsMessage['type']> = Extract<
  ServerWsMessage,
  { type: TType }
>['payload'];

/** Dependency đầu vào cần thiết để tạo một game session actor. */
export interface GameSessionInput {
  /** Room mà client muốn join hoặc reconnect. */
  readonly roomId: string;
  /** Tên hiển thị gửi trong `JOIN_ROOM`. */
  readonly playerName: string;
  /** I/O port được inject; machine không phụ thuộc trực tiếp browser WebSocket. */
  readonly transport: GameTransport;
  /** Session cũ cần khôi phục, nếu client đã có reconnect token. */
  readonly reconnectSessionId?: string;
}

/** Lỗi gần nhất mà UI session có thể trình bày cho người chơi. */
export interface GameSessionError {
  /** Nguồn lỗi: action bị từ chối, protocol sai hoặc connection lỗi. */
  readonly kind: 'ACTION' | 'PROTOCOL' | 'TRANSPORT';
  /** Mã lỗi từ server nếu protocol có cung cấp. */
  readonly code?: string;
  /** Nội dung an toàn để presentation layer hiển thị. */
  readonly message: string;
}

/**
 * Context do session machine sở hữu.
 *
 * `view` luôn là snapshot server gần nhất; `pendingAction` chỉ biểu diễn trạng
 * thái chờ acknowledgement và không được dùng để optimistic-update game state.
 */
export interface GameSessionContext extends GameSessionInput {
  readonly assignedPlayerId: PlayerId | null;
  readonly sessionId: string | null;
  readonly view: GamePlayerViewV2 | null;
  readonly pendingAction: PlayerGameAction | null;
  readonly error: GameSessionError | null;
}

/**
 * Event union của parent session machine.
 *
 * Event không namespace như `CONNECT`/`SUBMIT_ACTION` đến từ UI; 
 * `TRANSPORT.*` đến từ I/O actor; 
 * `SERVER.*` là wire message đã parse và đổi namespace.
 */
type GameSessionEvent =
  | { readonly type: 'CONNECT' }
  | { readonly type: 'RECONNECT' }
  | { readonly type: 'DISCONNECT' }
  | { readonly type: 'CLEAR_ERROR' }
  | { readonly type: 'SUBMIT_ACTION'; readonly action: PlayerGameAction }
  | { readonly type: 'TRANSPORT.OPEN' }
  | { readonly type: 'TRANSPORT.CLOSED'; readonly reason?: string }
  | { readonly type: 'TRANSPORT.ERROR'; readonly message: string }
  | { readonly type: 'PROTOCOL.ERROR'; readonly message: string }
  | { readonly type: 'SERVER.ROOM_JOINED'; readonly payload: MessagePayload<'ROOM_JOINED'> }
  | { readonly type: 'SERVER.GAME_STATE_UPDATE'; readonly payload: MessagePayload<'GAME_STATE_UPDATE'> }
  | { readonly type: 'SERVER.ACTION_REJECTED'; readonly payload: MessagePayload<'ACTION_REJECTED'> }
  | { readonly type: 'SERVER.ERROR'; readonly payload: MessagePayload<'ERROR'> }
  | { readonly type: 'SERVER.PONG'; readonly payload: MessagePayload<'PONG'> };

/** Command parent machine gửi riêng cho child actor có ID `transport`. */
type TransportCommand =
  | { readonly type: 'CONNECT' }
  | { readonly type: 'DISCONNECT' }
  | { readonly type: 'SEND'; readonly message: ClientWsMessage };

/**
 * Chuẩn hóa một thrown value chưa biết thành message cho session error.
 *
 * @param error - Giá trị được transport hoặc runtime throw.
 * @returns Message gốc nếu là `Error`, ngược lại là biểu diễn chuỗi.
 */
function describeUnknownError(error: unknown): string {
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
function toMachineEvent(message: ServerWsMessage): GameSessionEvent {
  switch (message.type) {
    case 'ROOM_JOINED':
      return { type: 'SERVER.ROOM_JOINED', payload: message.payload };
    case 'GAME_STATE_UPDATE':
      return { type: 'SERVER.GAME_STATE_UPDATE', payload: message.payload };
    case 'ACTION_REJECTED':
      return { type: 'SERVER.ACTION_REJECTED', payload: message.payload };
    case 'ERROR':
      return { type: 'SERVER.ERROR', payload: message.payload };
    case 'PONG':
      return { type: 'SERVER.PONG', payload: message.payload };
  }
}

/**
 * Callback actor làm cầu nối hai chiều giữa XState và `GameTransport`.
 *
 * Actor subscribe raw transport notifications, validate mọi inbound message
 * trước khi gửi về parent machine, đồng thời nhận command connect/disconnect/
 * send từ parent. Cleanup luôn unsubscribe và đóng transport.
 */
const transportActor = fromCallback<TransportCommand, { transport: GameTransport }>(
  ({ input, receive, sendBack }) => {
    const unsubscribe = input.transport.subscribe((event) => {
      switch (event.type) {
        case 'OPEN':
          sendBack({ type: 'TRANSPORT.OPEN' });
          return;
        case 'CLOSED':
          sendBack({ type: 'TRANSPORT.CLOSED', reason: event.reason });
          return;
        case 'ERROR':
          sendBack({
            type: 'TRANSPORT.ERROR',
            message: describeUnknownError(event.error),
          });
          return;
        case 'MESSAGE': {
          const parsed = ServerWsMessageSchema.safeParse(event.message);
          if (!parsed.success) {
            sendBack({
              type: 'PROTOCOL.ERROR',
              message: parsed.error.issues.map((issue) => issue.message).join('; '),
            });
            return;
          }
          sendBack(toMachineEvent(parsed.data));
        }
      }
    });

    receive((command) => {
      try {
        if (command.type === 'CONNECT') input.transport.connect();
        if (command.type === 'DISCONNECT') input.transport.disconnect();
        if (command.type === 'SEND') input.transport.send(command.message);
      } catch (error) {
        sendBack({
          type: 'TRANSPORT.ERROR',
          message: describeUnknownError(error),
        });
      }
    });

    return () => {
      unsubscribe();
      input.transport.disconnect();
    };
  }
);

/**
 * Authoritative client-session state machine cho một game room.
 *
 * Machine quản lý connection lifecycle, join/reconnect token, snapshot v0.2,
 * pending submission và lỗi. Nó không resolve game rule và không tự chuyển
 * gameplay phase; mỗi `GAME_STATE_UPDATE` thay toàn bộ `view` bằng snapshot
 * server mới nhất.
 *
 * State lifecycle:
 * `idle -> connecting -> connected -> reconnecting`, hoặc `closed` khi client
 * chủ động disconnect.
 */
export const gameSessionMachine = setup({
  types: {
    context: {} as GameSessionContext,
    events: {} as GameSessionEvent,
    input: {} as GameSessionInput,
  },
  actors: { transportActor },
  guards: {
    canSubmit: ({ context }) =>
      context.view !== null && context.pendingAction === null,
  },
}).createMachine({
  id: 'gameSession',
  initial: 'idle',
  context: ({ input }) => ({
    ...input,
    assignedPlayerId: null,
    sessionId: input.reconnectSessionId ?? null,
    view: null,
    pendingAction: null,
    error: null,
  }),
  invoke: {
    id: 'transport',
    src: 'transportActor',
    input: ({ context }) => ({ transport: context.transport }),
  },
  on: {
    'SERVER.ROOM_JOINED': {
      target: '.connected',
      actions: assign({
        assignedPlayerId: ({ event }) => event.payload.assignedPlayerId,
        sessionId: ({ event }) => event.payload.sessionId,
        error: null,
      }),
    },
    'SERVER.GAME_STATE_UPDATE': {
      actions: assign({
        view: ({ event }) => event.payload,
        pendingAction: null,
        error: null,
      }),
    },
    'SERVER.ACTION_REJECTED': {
      actions: assign({
        pendingAction: null,
        error: ({ event }) => ({
          kind: 'ACTION' as const,
          code: event.payload.code,
          message: event.payload.message,
        }),
      }),
    },
    'SERVER.ERROR': {
      actions: assign({
        error: ({ event }) => ({
          kind: 'PROTOCOL' as const,
          code: event.payload.code,
          message: event.payload.message,
        }),
      }),
    },
    'SERVER.PONG': {},
    'PROTOCOL.ERROR': {
      actions: assign({
        error: ({ event }) => ({
          kind: 'PROTOCOL' as const,
          message: event.message,
        }),
      }),
    },
    'TRANSPORT.ERROR': {
      target: '.reconnecting',
      actions: assign({
        pendingAction: null,
        error: ({ event }) => ({
          kind: 'TRANSPORT' as const,
          message: event.message,
        }),
      }),
    },
    'TRANSPORT.CLOSED': {
      target: '.reconnecting',
      actions: assign({ pendingAction: null }),
    },
    DISCONNECT: {
      target: '.closed',
      actions: sendTo('transport', { type: 'DISCONNECT' }),
    },
    CLEAR_ERROR: { actions: assign({ error: null }) },
  },
  states: {
    idle: {
      on: {
        CONNECT: {
          target: 'connecting',
          actions: sendTo('transport', { type: 'CONNECT' }),
        },
      },
    },
    connecting: {
      on: {
        'TRANSPORT.OPEN': {
          actions: sendTo('transport', ({ context }) => ({
            type: 'SEND',
            message: ClientWsMessageSchema.parse({
              type: 'JOIN_ROOM',
              payload: {
                roomId: context.roomId,
                playerName: context.playerName,
                ...(context.sessionId
                  ? { reconnectSessionId: context.sessionId }
                  : {}),
              },
            }),
          })),
        },
      },
    },
    connected: {
      on: {
        SUBMIT_ACTION: {
          guard: 'canSubmit',
          actions: [
            sendTo('transport', ({ event }) => ({
              type: 'SEND',
              message: ClientWsMessageSchema.parse({
                type: 'SUBMIT_ACTION',
                payload: event.action,
              }),
            })),
            assign({
              pendingAction: ({ event }) => event.action,
              error: null,
            }),
          ],
        },
      },
    },
    reconnecting: {
      on: {
        RECONNECT: {
          target: 'connecting',
          actions: sendTo('transport', { type: 'CONNECT' }),
        },
      },
    },
    closed: {
      on: {
        'TRANSPORT.CLOSED': {},
        'TRANSPORT.ERROR': {},
        CONNECT: {
          target: 'connecting',
          actions: sendTo('transport', { type: 'CONNECT' }),
        },
      },
    },
  },
});

export type GameSessionSnapshot = SnapshotFrom<typeof gameSessionMachine>;

/** @returns Connection state hiện tại của session actor. */
export const selectConnection = (snapshot: GameSessionSnapshot) => snapshot.value;

/** @returns Authoritative player view gần nhất, hoặc `null` trước snapshot đầu. */
export const selectView = (snapshot: GameSessionSnapshot) => snapshot.context.view;

/** @returns Phase từ authoritative view, hoặc `null` khi chưa có view. */
export const selectPhase = (snapshot: GameSessionSnapshot) =>
  snapshot.context.view?.phase ?? null;

/** @returns Action đang chờ server acknowledge, hoặc `null`. */
export const selectPendingAction = (snapshot: GameSessionSnapshot) =>
  snapshot.context.pendingAction;

/** @returns Lỗi session gần nhất có thể hiển thị, hoặc `null`. */
export const selectSessionError = (snapshot: GameSessionSnapshot) =>
  snapshot.context.error;

/**
 * Xác định UI có thể gửi action mới hay không.
 *
 * @returns `true` chỉ khi đã connected, có authoritative view và không có
 * action nào đang chờ acknowledgement.
 */
export const selectCanSubmit = (snapshot: GameSessionSnapshot) =>
  snapshot.matches('connected') &&
  snapshot.context.view !== null &&
  snapshot.context.pendingAction === null;
