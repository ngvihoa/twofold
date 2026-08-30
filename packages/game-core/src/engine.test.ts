import { describe, expect, it } from 'vitest';
import {
  CardRole,
  CardStatus,
  PlayerGameViewSchema,
  PlayerId,
  type EventLogEntry,
} from '@twofold/shared-types';
import { GameEngine } from './engine';

describe('GameEngine authoritative facade', () => {
  it('routes setup actions through the rule pipeline and advances phase', () => {
    const engine = new GameEngine('engine-dispatch-test');

    engine.dispatch({ type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_A });
    expect(engine.getState().phase).toEqual({ type: 'SETUP' });

    engine.dispatch({ type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_B });
    expect(engine.getState().phase).toEqual({ type: 'DAY_A' });
  });

  it('does not mutate state when the pipeline rejects an invalid action', () => {
    const engine = new GameEngine('engine-validation-test');
    const before = engine.getState();

    expect(() =>
      engine.dispatch({
        type: 'DAY_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        action: { type: 'PASS' },
      })
    ).toThrow('Không phải Day turn của PLAYER_A.');
    expect(engine.getState()).toEqual(before);
  });

  it('returns an isolated snapshot instead of its internal state reference', () => {
    const engine = new GameEngine('engine-snapshot-test');
    const snapshot = engine.getState();

    (snapshot as { round: number }).round = 99;
    (snapshot.logs as EventLogEntry[]).push({
      id: 'external-log',
      round: 99,
      phase: snapshot.logs[0].phase,
      timestamp: 0,
      actor: null,
      message: 'External mutation',
      isPublic: true,
    });

    expect(engine.getState().round).toBe(1);
    expect(engine.getState().logs).toHaveLength(1);
  });

  it('keeps private views safe and the v0.1 projection schema-compatible', () => {
    const engine = new GameEngine('engine-view-test');
    engine.dispatch({ type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_A });
    engine.dispatch({ type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_B });

    const authoritative = engine.getAuthoritativePlayerView(PlayerId.PLAYER_A);
    expect(authoritative.self.board[0].role.id).toBe(CardRole.VILLAGER);
    expect(authoritative.opponent.board[0].role).toBeNull();

    const legacy = engine.getPlayerView(PlayerId.PLAYER_A);
    expect(legacy.opponentCards[0]).toMatchObject({
      id: 'B1',
      index: 0,
      status: CardStatus.HIDDEN,
      role: null,
    });
    expect(PlayerGameViewSchema.safeParse(legacy).success).toBe(true);
  });
});
