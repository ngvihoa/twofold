import {
  ServerWsMessageSchema,
  type ServerWsMessage,
} from '@twofold/shared-types';
import type { Message, Peer } from 'crossws';
import { describe, expect, it } from 'vitest';
import { GameRoomServer } from './game-room-server';
import { createGameWebSocketHooks } from './game-websocket';

class FakeCrosswsPeer {
  readonly payloads: ServerWsMessage[] = [];

  constructor(readonly id: string) {}

  send(data: unknown): void {
    this.payloads.push(ServerWsMessageSchema.parse(JSON.parse(String(data))));
  }

  close(): void {}
}

function asPeer(peer: FakeCrosswsPeer): Peer {
  return peer as unknown as Peer;
}

function asMessage(value: string): Message {
  return { text: () => value } as Message;
}

describe('/api/ws gateway hooks', () => {
  it('validates JSON and joins two peers through the v0.2 contract', async () => {
    let sequence = 0;
    const roomServer = new GameRoomServer({
      createSessionId: () => `session-${++sequence}`,
    });
    const hooks = createGameWebSocketHooks(roomServer);
    const peerA = new FakeCrosswsPeer('peer-a');
    const peerB = new FakeCrosswsPeer('peer-b');

    await hooks.message?.(asPeer(peerA), asMessage('{invalid'));
    expect(peerA.payloads.at(-1)).toMatchObject({
      type: 'ERROR',
      payload: { code: 'INVALID_MESSAGE' },
    });

    await hooks.message?.(
      asPeer(peerA),
      asMessage(JSON.stringify({
        type: 'JOIN_ROOM',
        payload: { roomId: 'LIVE-ROOM', playerName: 'Alice' },
      }))
    );
    await hooks.message?.(
      asPeer(peerB),
      asMessage(JSON.stringify({
        type: 'JOIN_ROOM',
        payload: { roomId: 'LIVE-ROOM', playerName: 'Bob' },
      }))
    );

    for (const peer of [peerA, peerB]) {
      expect(peer.payloads).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'ROOM_JOINED' }),
        expect.objectContaining({ type: 'GAME_STATE_UPDATE' }),
      ]));
    }
  });

  it('accepts only the same-origin /api/ws endpoint', async () => {
    const hooks = createGameWebSocketHooks(new GameRoomServer());
    await hooks.upgrade?.(new Request('http://localhost/api/ws', {
      headers: { origin: 'http://localhost' },
    }));

    await expectUpgradeFailure(
      () => hooks.upgrade?.(new Request('http://localhost/not-ws')),
      404
    );
    await expectUpgradeFailure(
      () => hooks.upgrade?.(new Request('http://localhost/api/ws', {
        headers: { origin: 'https://attacker.example' },
      })),
      403
    );
    await expectUpgradeFailure(
      () => hooks.upgrade?.(new Request('http://localhost/api/ws', {
        headers: { origin: 'invalid-origin' },
      })),
      403
    );
  });
});

async function expectUpgradeFailure(
  upgrade: () => unknown,
  expectedStatus: number
): Promise<void> {
  try {
    await upgrade();
  } catch (error) {
    expect(error).toMatchObject({ status: expectedStatus });
    return;
  }
  throw new Error(`Expected WebSocket upgrade to fail with ${expectedStatus}.`);
}
