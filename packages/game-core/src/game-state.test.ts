import { describe, expect, it } from 'vitest';
import { CardRole, PlayerId, WinReason } from '@twofold/shared-types';
import { createInitialCard } from './cards';
import { createInitialGameState, transitionGameState } from './game-state';
import { createInitialPlayerState } from './players';

function createTestGame() {
  return createInitialGameState('game-state-test', 'seed-01', {
    [PlayerId.PLAYER_A]: createInitialPlayerState(PlayerId.PLAYER_A, [
      createInitialCard(PlayerId.PLAYER_A, 1, CardRole.VILLAGER),
    ]),
    [PlayerId.PLAYER_B]: createInitialPlayerState(PlayerId.PLAYER_B, [
      createInitialCard(PlayerId.PLAYER_B, 1, CardRole.VILLAGER),
    ]),
  });
}

describe('ruleset v0.2 game state', () => {
  it('leaves Setup only after both players lock', () => {
    const initial = createTestGame();
    const playerALocked = transitionGameState(initial, {
      type: 'SETUP_LOCKED',
      playerId: PlayerId.PLAYER_A,
    });

    expect(playerALocked.phase).toEqual({ type: 'SETUP' });
    expect(playerALocked.players[PlayerId.PLAYER_A].setup.status).toBe('LOCKED');
    expect(initial.players[PlayerId.PLAYER_A].setup.status).toBe('ARRANGING');

    const bothLocked = transitionGameState(playerALocked, {
      type: 'SETUP_LOCKED',
      playerId: PlayerId.PLAYER_B,
    });
    expect(bothLocked.phase).toEqual({ type: 'DAY_A' });
  });

  it('stores result and moves to Ended through a game event', () => {
    const initial = createTestGame();
    const ended = transitionGameState(initial, {
      type: 'GAME_ENDED',
      result: { winner: PlayerId.PLAYER_A, reason: WinReason.ELIMINATION },
    });

    expect(ended.phase).toEqual({ type: 'ENDED' });
    expect(ended.result).toEqual({
      winner: PlayerId.PLAYER_A,
      reason: WinReason.ELIMINATION,
    });
  });
});
