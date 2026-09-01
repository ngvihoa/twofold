import {
  ClientWsMessageSchema,
  ServerWsMessageSchema,
  type ServerWsMessage,
} from '@twofold/shared-types';
import type { Hooks, Peer } from 'crossws';
import {
  gameRoomServer,
  type GameRoomServer,
  type GameServerPeer,
} from './game-room-server';

export const GAME_WEBSOCKET_PATH = '/api/ws';

function toServerPeer(peer: Peer): GameServerPeer {
  return {
    id: peer.id,
    send(message: ServerWsMessage) {
      peer.send(JSON.stringify(ServerWsMessageSchema.parse(message)));
    },
    close(code: number, reason: string) {
      peer.close(code, reason);
    },
  };
}

function sendProtocolError(peer: Peer, message: string): void {
  const response: ServerWsMessage = {
    type: 'ERROR',
    payload: { code: 'INVALID_MESSAGE', message },
  };
  peer.send(JSON.stringify(ServerWsMessageSchema.parse(response)));
}

function assertGameWebSocketRequest(request: Request): void {
  const requestUrl = new URL(request.url);
  if (requestUrl.pathname !== GAME_WEBSOCKET_PATH) {
    throw new Response('Not Found', { status: 404 });
  }

  const origin = request.headers.get('origin');
  if (origin) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      throw new Response('WebSocket Origin không hợp lệ.', { status: 403 });
    }

    if (originHost !== requestUrl.host) {
      throw new Response('Cross-origin WebSocket bị từ chối.', { status: 403 });
    }
  }
}

/** Tạo crossws hooks cho Nitro native WebSocket route ở dev và production. */
export function createGameWebSocketHooks(
  roomServer: GameRoomServer = gameRoomServer
): Partial<Hooks> {
  return {
    upgrade(request) {
      assertGameWebSocketRequest(request);
    },
    message(peer, message) {
      let raw: unknown;
      try {
        raw = JSON.parse(message.text()) as unknown;
      } catch {
        sendProtocolError(peer, 'Message phải là JSON hợp lệ.');
        return;
      }

      const parsed = ClientWsMessageSchema.safeParse(raw);
      if (!parsed.success) {
        sendProtocolError(
          peer,
          parsed.error.issues.map((issue) => issue.message).join('; ')
        );
        return;
      }
      roomServer.handleMessage(toServerPeer(peer), parsed.data);
    },
    close(peer) {
      roomServer.disconnect(peer.id);
    },
  };
}

/** Shared hooks instance cho process hiện tại. */
export const gameWebSocketHooks = createGameWebSocketHooks();
