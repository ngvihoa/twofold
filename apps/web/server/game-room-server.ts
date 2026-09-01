import { GameEngine, RuleValidationError } from '@twofold/game-core';
import {
  GamePlayerViewV2Schema,
  PlayerId,
  ServerWsMessageSchema,
  type ClientWsMessage,
  type PlayerGameAction,
  type ServerWsMessage,
} from '@twofold/shared-types';

/** Socket port tối thiểu để room server không phụ thuộc crossws hay browser API. */
export interface GameServerPeer {
  readonly id: string;
  send(message: ServerWsMessage): void;
  close(code: number, reason: string): void;
}

interface PlayerSession {
  readonly id: string;
  readonly roomId: string;
  readonly playerId: PlayerId;
  readonly playerName: string;
  peer: GameServerPeer | null;
}

interface GameRoom {
  readonly id: string;
  readonly engine: GameEngine;
  readonly sessions: Map<PlayerId, PlayerSession>;
}

export interface GameRoomServerOptions {
  readonly createEngine?: (roomId: string) => GameEngine;
  readonly createSessionId?: () => string;
}

const PLAYER_ORDER = [PlayerId.PLAYER_A, PlayerId.PLAYER_B] as const;

/**
 * In-memory authoritative room/session coordinator cho WebSocket vertical slice.
 *
 * Class chỉ quản lý ownership của connection và fan-out filtered snapshot.
 * Mọi gameplay command vẫn được chuyển nguyên vẹn vào `GameEngine.dispatch()`.
 */
export class GameRoomServer {
  private readonly rooms = new Map<string, GameRoom>();
  private readonly sessions = new Map<string, PlayerSession>();
  private readonly sessionByPeerId = new Map<string, string>();
  private readonly createEngine: (roomId: string) => GameEngine;
  private readonly createSessionId: () => string;

  constructor(options: GameRoomServerOptions = {}) {
    this.createEngine = options.createEngine ?? ((roomId) => new GameEngine(roomId));
    this.createSessionId = options.createSessionId ?? (() => crypto.randomUUID());
  }

  /** Nhận một message đã validate từ gateway và dispatch theo session hiện tại. */
  handleMessage(peer: GameServerPeer, message: ClientWsMessage): void {
    switch (message.type) {
      case 'JOIN_ROOM':
        this.joinRoom(peer, message.payload);
        return;
      case 'PING':
        this.send(peer, { type: 'PONG', payload: message.payload });
        return;
      case 'SUBMIT_ACTION':
        this.submitAction(peer, message.payload);
        return;
      case 'SURRENDER':
      case 'REMATCH_REQUEST':
        this.reject(peer, 'NOT_IMPLEMENTED', `${message.type} chưa thuộc vertical slice hiện tại.`);
        return;
    }
  }

  /** Tách peer khỏi session nhưng giữ token để client có thể reconnect. */
  disconnect(peerId: string): void {
    const sessionId = this.sessionByPeerId.get(peerId);
    if (!sessionId) return;
    this.sessionByPeerId.delete(peerId);
    const session = this.sessions.get(sessionId);
    if (session?.peer?.id === peerId) session.peer = null;
  }

  /** Số room hiện có, phục vụ diagnostics và deterministic tests. */
  get roomCount(): number {
    return this.rooms.size;
  }

  private joinRoom(
    peer: GameServerPeer,
    payload: Extract<ClientWsMessage, { type: 'JOIN_ROOM' }>['payload']
  ): void {
    if (this.sessionByPeerId.has(peer.id)) {
      this.sendError(peer, 'ALREADY_JOINED', 'Connection này đã join room.');
      return;
    }

    if (payload.reconnectSessionId) {
      this.reconnect(peer, payload.roomId, payload.reconnectSessionId);
      return;
    }

    const room = this.getOrCreateRoom(payload.roomId);
    const playerId = PLAYER_ORDER.find((candidate) => !room.sessions.has(candidate));
    if (!playerId) {
      this.sendError(peer, 'ROOM_FULL', `Room ${payload.roomId} đã đủ hai người chơi.`);
      peer.close(4003, 'Room full');
      return;
    }

    const session: PlayerSession = {
      id: this.createUniqueSessionId(),
      roomId: room.id,
      playerId,
      playerName: payload.playerName,
      peer,
    };
    room.sessions.set(playerId, session);
    this.sessions.set(session.id, session);
    this.sessionByPeerId.set(peer.id, session.id);
    this.acknowledgeJoin(session);
    this.broadcastViews(room);
  }

  private reconnect(peer: GameServerPeer, roomId: string, sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.roomId !== roomId) {
      this.sendError(peer, 'INVALID_SESSION', 'Reconnect session không tồn tại trong room này.');
      return;
    }

    if (session.peer && session.peer.id !== peer.id) {
      this.sessionByPeerId.delete(session.peer.id);
      session.peer.close(4001, 'Session reconnected from another socket');
    }
    session.peer = peer;
    this.sessionByPeerId.set(peer.id, session.id);
    this.acknowledgeJoin(session);
    this.broadcastViews(this.requireRoom(roomId));
  }

  private submitAction(peer: GameServerPeer, action: PlayerGameAction): void {
    const session = this.getSessionForPeer(peer);
    if (!session) {
      this.sendError(peer, 'JOIN_REQUIRED', 'Phải JOIN_ROOM trước khi gửi action.');
      return;
    }
    if (action.playerId !== session.playerId) {
      this.reject(peer, 'PLAYER_MISMATCH', 'Action playerId không khớp session hiện tại.');
      return;
    }

    const room = this.requireRoom(session.roomId);
    try {
      room.engine.dispatch(action);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action không hợp lệ.';
      this.reject(
        peer,
        error instanceof RuleValidationError ? 'RULE_VALIDATION' : 'ACTION_FAILED',
        message
      );
      return;
    }
    this.broadcastViews(room);
  }

  private getOrCreateRoom(roomId: string): GameRoom {
    const current = this.rooms.get(roomId);
    if (current) return current;
    const room: GameRoom = {
      id: roomId,
      engine: this.createEngine(roomId),
      sessions: new Map(),
    };
    this.rooms.set(roomId, room);
    return room;
  }

  private createUniqueSessionId(): string {
    let sessionId = this.createSessionId();
    while (this.sessions.has(sessionId)) sessionId = this.createSessionId();
    return sessionId;
  }

  private getSessionForPeer(peer: GameServerPeer): PlayerSession | null {
    const sessionId = this.sessionByPeerId.get(peer.id);
    return sessionId ? this.sessions.get(sessionId) ?? null : null;
  }

  private requireRoom(roomId: string): GameRoom {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Không tìm thấy room ${roomId}.`);
    return room;
  }

  private acknowledgeJoin(session: PlayerSession): void {
    if (!session.peer) return;
    this.send(session.peer, {
      type: 'ROOM_JOINED',
      payload: {
        roomId: session.roomId,
        assignedPlayerId: session.playerId,
        sessionId: session.id,
      },
    });
  }

  private broadcastViews(room: GameRoom): void {
    room.sessions.forEach((session) => {
      if (!session.peer) return;
      this.send(session.peer, {
        type: 'GAME_STATE_UPDATE',
        payload: GamePlayerViewV2Schema.parse(
          room.engine.getAuthoritativePlayerView(session.playerId)
        ),
      });
    });
  }

  private reject(peer: GameServerPeer, code: string, message: string): void {
    this.send(peer, { type: 'ACTION_REJECTED', payload: { code, message } });
  }

  private sendError(peer: GameServerPeer, code: string, message: string): void {
    this.send(peer, { type: 'ERROR', payload: { code, message } });
  }

  private send(peer: GameServerPeer, message: ServerWsMessage): void {
    peer.send(ServerWsMessageSchema.parse(message));
  }
}

/** Process-local room server; production cần sticky single instance hoặc shared store. */
export const gameRoomServer = new GameRoomServer();
