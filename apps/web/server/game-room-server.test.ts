import { PlayerId, type ServerWsMessage } from '@twofold/shared-types';
import { describe, expect, it } from 'vitest';
import {
  GameRoomServer,
  type GameServerPeer,
} from './game-room-server';

class FakePeer implements GameServerPeer {
  readonly messages: ServerWsMessage[] = [];
  readonly closures: Array<{ code: number; reason: string }> = [];

  constructor(readonly id: string) {}

  send(message: ServerWsMessage): void {
    this.messages.push(message);
  }

  close(code: number, reason: string): void {
    this.closures.push({ code, reason });
  }
}

function createServer(): GameRoomServer {
  let sequence = 0;
  return new GameRoomServer({
    createSessionId: () => `session-${++sequence}`,
  });
}

function join(server: GameRoomServer, peer: FakePeer, roomId = 'ROOM-1'): string {
  server.handleMessage(peer, {
    type: 'JOIN_ROOM',
    payload: { roomId, playerName: peer.id },
  });
  const joined = peer.messages.find((message) => message.type === 'ROOM_JOINED');
  if (!joined || joined.type !== 'ROOM_JOINED') throw new Error('Missing ROOM_JOINED');
  return joined.payload.sessionId;
}

function latestSnapshot(
  peer: FakePeer
): Extract<ServerWsMessage, { type: 'GAME_STATE_UPDATE' }> {
  for (let index = peer.messages.length - 1; index >= 0; index -= 1) {
    const message = peer.messages[index];
    if (message.type === 'GAME_STATE_UPDATE') return message;
  }
  throw new Error('Missing GAME_STATE_UPDATE');
}

describe('GameRoomServer', () => {
  it('assigns A/B and sends a viewer-filtered v0.2 snapshot', () => {
    const server = createServer();
    const peerA = new FakePeer('peer-a');
    const peerB = new FakePeer('peer-b');

    join(server, peerA);
    join(server, peerB);

    const joinedA = peerA.messages.find((message) => message.type === 'ROOM_JOINED');
    const joinedB = peerB.messages.find((message) => message.type === 'ROOM_JOINED');
    expect(joinedA?.payload.assignedPlayerId).toBe(PlayerId.PLAYER_A);
    expect(joinedB?.payload.assignedPlayerId).toBe(PlayerId.PLAYER_B);
    expect(server.roomCount).toBe(1);

    const snapshotA = latestSnapshot(peerA);
    expect(snapshotA.payload.self.id).toBe(PlayerId.PLAYER_A);
    expect(snapshotA.payload.self.board.every((card) => card.role.id.length > 0)).toBe(true);
    expect(snapshotA.payload.opponent.board.every((card) => card.role === null)).toBe(true);
  });

  it('dispatches actions through game-core and broadcasts the resulting phase', () => {
    const server = createServer();
    const peerA = new FakePeer('peer-a');
    const peerB = new FakePeer('peer-b');
    join(server, peerA);
    join(server, peerB);

    server.handleMessage(peerA, {
      type: 'SUBMIT_ACTION',
      payload: { type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_A },
    });
    server.handleMessage(peerB, {
      type: 'SUBMIT_ACTION',
      payload: { type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_B },
    });

    for (const peer of [peerA, peerB]) {
      expect(latestSnapshot(peer).payload.phase.type).toBe('DAY_A');
    }
  });

  it('rejects action impersonation without mutating the room', () => {
    const server = createServer();
    const peerA = new FakePeer('peer-a');
    join(server, peerA);

    server.handleMessage(peerA, {
      type: 'SUBMIT_ACTION',
      payload: { type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_B },
    });

    expect(peerA.messages.at(-1)).toMatchObject({
      type: 'ACTION_REJECTED',
      payload: { code: 'PLAYER_MISMATCH' },
    });
  });

  it('reattaches an existing session and rejects a third seat', () => {
    const server = createServer();
    const peerA = new FakePeer('peer-a');
    const peerB = new FakePeer('peer-b');
    const sessionA = join(server, peerA);
    join(server, peerB);

    const peerC = new FakePeer('peer-c');
    server.handleMessage(peerC, {
      type: 'JOIN_ROOM',
      payload: { roomId: 'ROOM-1', playerName: 'peer-c' },
    });
    expect(peerC.messages.at(-1)).toMatchObject({
      type: 'ERROR',
      payload: { code: 'ROOM_FULL' },
    });
    expect(peerC.closures.at(-1)?.code).toBe(4003);

    server.disconnect(peerA.id);
    const reconnected = new FakePeer('peer-a-reconnected');
    server.handleMessage(reconnected, {
      type: 'JOIN_ROOM',
      payload: {
        roomId: 'ROOM-1',
        playerName: 'A again',
        reconnectSessionId: sessionA,
      },
    });
    expect(reconnected.messages[0]).toMatchObject({
      type: 'ROOM_JOINED',
      payload: {
        assignedPlayerId: PlayerId.PLAYER_A,
        sessionId: sessionA,
      },
    });
  });
});
