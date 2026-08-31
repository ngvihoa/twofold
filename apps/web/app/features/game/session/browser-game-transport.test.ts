import { PlayerId, type ClientWsMessage } from '@twofold/shared-types';
import { describe, expect, it } from 'vitest';
import {
  BrowserGameTransport,
  type GameWebSocket,
} from './browser-game-transport';
import type { GameTransportEvent } from './game-transport';

class FakeWebSocket implements GameWebSocket {
  readyState = 0;
  onopen: WebSocket['onopen'] = null;
  onmessage: WebSocket['onmessage'] = null;
  onclose: WebSocket['onclose'] = null;
  onerror: WebSocket['onerror'] = null;
  readonly sent: string[] = [];
  readonly closed: Array<{ code?: number; reason?: string }> = [];

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    this.sent.push(String(data));
  }

  close(code?: number, reason?: string): void {
    this.closed.push({ code, reason });
  }
}

describe('BrowserGameTransport', () => {
  it('emits parsed socket messages and serializes client messages', () => {
    const socket = new FakeWebSocket();
    const transport = new BrowserGameTransport('ws://game.test/socket', () => socket);
    const events: GameTransportEvent[] = [];
    transport.subscribe((event) => events.push(event));

    transport.connect();
    socket.readyState = 1;
    socket.onopen?.call(socket as unknown as WebSocket, {} as Event);
    socket.onmessage?.call(
      socket as unknown as WebSocket,
      {
        data: JSON.stringify({
          type: 'ROOM_JOINED',
          payload: {
            roomId: 'room-43',
            assignedPlayerId: PlayerId.PLAYER_A,
            sessionId: 'session-43',
          },
        }),
      } as MessageEvent
    );

    const message: ClientWsMessage = {
      type: 'PING',
      payload: { timestamp: 43 },
    };
    transport.send(message);

    expect(events).toEqual([
      { type: 'OPEN' },
      {
        type: 'MESSAGE', message: {
          type: 'ROOM_JOINED',
          payload: {
            roomId: 'room-43',
            assignedPlayerId: PlayerId.PLAYER_A,
            sessionId: 'session-43',
          },
        }
      },
    ]);
    expect(JSON.parse(socket.sent[0]) as unknown).toEqual(message);
  });

  it('rejects sends before open and closes explicitly', () => {
    const socket = new FakeWebSocket();
    const transport = new BrowserGameTransport('wss://game.test/socket', () => socket);
    transport.connect();

    expect(() =>
      transport.send({ type: 'PING', payload: { timestamp: 1 } })
    ).toThrow(/chưa open/u);

    transport.disconnect();
    expect(socket.closed).toEqual([{ code: 1000, reason: 'Client disconnect' }]);
  });
});
