import { PlayerId, type ClientWsMessage } from '@twofold/shared-types';
import {
  STANDARD_DECK,
  createInitialCard,
  createInitialGameState,
  createInitialPlayerState,
  serializePlayerView,
} from '@twofold/game-core';
import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';
import type { GameTransport, GameTransportEvent } from './game-transport';
import {
  gameSessionMachine,
  selectCanSubmit,
  selectPhase,
} from './game-session-machine';

class FakeGameTransport implements GameTransport {
  readonly sent: ClientWsMessage[] = [];
  connectCount = 0;
  disconnectCount = 0;
  private readonly listeners = new Set<(event: GameTransportEvent) => void>();

  connect() {
    this.connectCount += 1;
  }

  disconnect() {
    this.disconnectCount += 1;
  }

  send(message: ClientWsMessage) {
    this.sent.push(message);
  }

  subscribe(listener: (event: GameTransportEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: GameTransportEvent) {
    this.listeners.forEach((listener) => listener(event));
  }
}

function createView(round = 1) {
  const playerA = createInitialPlayerState(
    PlayerId.PLAYER_A,
    STANDARD_DECK.map((role, index) =>
      createInitialCard(PlayerId.PLAYER_A, index + 1, role)
    )
  );
  const playerB = createInitialPlayerState(
    PlayerId.PLAYER_B,
    STANDARD_DECK.map((role, index) =>
      createInitialCard(PlayerId.PLAYER_B, index + 1, role)
    )
  );
  const game = createInitialGameState('game-4-1', 'session-machine', {
    [PlayerId.PLAYER_A]: playerA,
    [PlayerId.PLAYER_B]: playerB,
  });
  return serializePlayerView({ ...game, round }, PlayerId.PLAYER_A);
}

function startSession(transport: FakeGameTransport) {
  const actor = createActor(gameSessionMachine, {
    input: {
      roomId: 'room-41',
      playerName: 'Alice',
      transport,
    },
  });
  actor.start();
  actor.send({ type: 'CONNECT' });
  return actor;
}

function joinSession(transport: FakeGameTransport) {
  const actor = startSession(transport);
  transport.emit({ type: 'OPEN' });
  transport.emit({
    type: 'MESSAGE',
    message: {
      type: 'ROOM_JOINED',
      payload: {
        roomId: 'room-41',
        assignedPlayerId: PlayerId.PLAYER_A,
        sessionId: 'session-41',
      },
    },
  });
  return actor;
}

describe('gameSessionMachine', () => {
  it('joins through the transport and replaces its authoritative snapshot', () => {
    const transport = new FakeGameTransport();
    const actor = joinSession(transport);

    expect(transport.connectCount).toBe(1);
    expect(transport.sent[0]).toEqual({
      type: 'JOIN_ROOM',
      payload: { roomId: 'room-41', playerName: 'Alice' },
    });
    expect(actor.getSnapshot().matches('connected')).toBe(true);

    transport.emit({
      type: 'MESSAGE',
      message: { type: 'GAME_STATE_UPDATE', payload: createView(1) },
    });
    const firstView = actor.getSnapshot().context.view;
    expect(selectPhase(actor.getSnapshot())).toEqual({ type: 'SETUP' });
    expect(selectCanSubmit(actor.getSnapshot())).toBe(true);

    transport.emit({
      type: 'MESSAGE',
      message: { type: 'GAME_STATE_UPDATE', payload: createView(2) },
    });
    expect(actor.getSnapshot().context.view?.round).toBe(2);
    expect(actor.getSnapshot().context.view).not.toBe(firstView);
    actor.stop();
  });

  it('sends a v0.2 action without optimistically mutating the snapshot', () => {
    const transport = new FakeGameTransport();
    const actor = joinSession(transport);
    transport.emit({
      type: 'MESSAGE',
      message: { type: 'GAME_STATE_UPDATE', payload: createView() },
    });
    const authoritativeView = actor.getSnapshot().context.view;

    actor.send({
      type: 'SUBMIT_ACTION',
      action: { type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_A },
    });

    expect(transport.sent.at(-1)).toEqual({
      type: 'SUBMIT_ACTION',
      payload: { type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_A },
    });
    expect(actor.getSnapshot().context.pendingAction?.type).toBe('SETUP_LOCK');
    expect(actor.getSnapshot().context.view).toBe(authoritativeView);
    expect(selectCanSubmit(actor.getSnapshot())).toBe(false);
    actor.stop();
  });

  it('clears a rejected action without changing the last server snapshot', () => {
    const transport = new FakeGameTransport();
    const actor = joinSession(transport);
    transport.emit({
      type: 'MESSAGE',
      message: { type: 'GAME_STATE_UPDATE', payload: createView() },
    });
    const authoritativeView = actor.getSnapshot().context.view;
    actor.send({
      type: 'SUBMIT_ACTION',
      action: { type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_A },
    });

    transport.emit({
      type: 'MESSAGE',
      message: {
        type: 'ACTION_REJECTED',
        payload: { code: 'INVALID_PHASE', message: 'Setup đã khóa.' },
      },
    });

    expect(actor.getSnapshot().context.pendingAction).toBeNull();
    expect(actor.getSnapshot().context.view).toBe(authoritativeView);
    expect(actor.getSnapshot().context.error).toEqual({
      kind: 'ACTION',
      code: 'INVALID_PHASE',
      message: 'Setup đã khóa.',
    });
    actor.stop();
  });

  it('rejoins with its session id and reconciles from the new snapshot', () => {
    const transport = new FakeGameTransport();
    const actor = joinSession(transport);
    transport.emit({
      type: 'MESSAGE',
      message: { type: 'GAME_STATE_UPDATE', payload: createView(1) },
    });

    transport.emit({ type: 'CLOSED', reason: 'network lost' });
    expect(actor.getSnapshot().matches('reconnecting')).toBe(true);
    actor.send({ type: 'RECONNECT' });
    transport.emit({ type: 'OPEN' });

    expect(transport.sent.at(-1)).toEqual({
      type: 'JOIN_ROOM',
      payload: {
        roomId: 'room-41',
        playerName: 'Alice',
        reconnectSessionId: 'session-41',
      },
    });

    transport.emit({
      type: 'MESSAGE',
      message: {
        type: 'ROOM_JOINED',
        payload: {
          roomId: 'room-41',
          assignedPlayerId: PlayerId.PLAYER_A,
          sessionId: 'session-41-next',
        },
      },
    });
    transport.emit({
      type: 'MESSAGE',
      message: { type: 'GAME_STATE_UPDATE', payload: createView(4) },
    });

    expect(transport.connectCount).toBe(2);
    expect(actor.getSnapshot().context.sessionId).toBe('session-41-next');
    expect(actor.getSnapshot().context.view?.round).toBe(4);
    actor.stop();
  });

  it('reports invalid server data without replacing the current snapshot', () => {
    const transport = new FakeGameTransport();
    const actor = joinSession(transport);
    transport.emit({
      type: 'MESSAGE',
      message: { type: 'GAME_STATE_UPDATE', payload: createView() },
    });
    const authoritativeView = actor.getSnapshot().context.view;

    transport.emit({
      type: 'MESSAGE',
      message: { type: 'GAME_STATE_UPDATE', payload: { round: 'invalid' } },
    });

    expect(actor.getSnapshot().context.view).toBe(authoritativeView);
    expect(actor.getSnapshot().context.error?.kind).toBe('PROTOCOL');
    actor.stop();
  });

  it('stays closed when the transport acknowledges an explicit disconnect', () => {
    const transport = new FakeGameTransport();
    const actor = joinSession(transport);

    actor.send({ type: 'DISCONNECT' });
    transport.emit({ type: 'CLOSED', reason: 'client disconnect' });

    expect(actor.getSnapshot().matches('closed')).toBe(true);
    expect(transport.disconnectCount).toBe(1);
    actor.stop();
  });
});
