import { describe, expect, it } from 'vitest';
import {
  CardRole,
  PlayerId,
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
    (snapshot.events as unknown[]).push({ type: 'external-event' });

    expect(engine.getState().round).toBe(1);
    expect(engine.getState().events).toHaveLength(0);
  });

  it('keeps authoritative player views private', () => {
    const engine = new GameEngine('engine-view-test');
    engine.dispatch({ type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_A });
    engine.dispatch({ type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_B });

    const authoritative = engine.getAuthoritativePlayerView(PlayerId.PLAYER_A);
    expect(authoritative.self.board[0].role.id).toBe(CardRole.VILLAGER);
    expect(authoritative.opponent.board[0].role).toBeNull();
  });
});
