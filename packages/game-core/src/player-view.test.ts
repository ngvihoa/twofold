import { describe, expect, it } from 'vitest';
import { AbilityId, CardRole, PlayerId } from '@twofold/shared-types';
import {
  CardEffectKind,
  createInitialCard,
  transitionCard,
  type CardEffectState,
} from './cards';
import { createInitialGameState } from './game-state';
import { serializePlayerView } from './player-view';
import { createInitialPlayerState, type PlayerState } from './players';

function createViewTestGame() {
  const playerA = createInitialPlayerState(PlayerId.PLAYER_A, [
    createInitialCard(PlayerId.PLAYER_A, 1, CardRole.SEER),
    createInitialCard(PlayerId.PLAYER_A, 2, CardRole.GUARD),
  ]);
  const playerB = createInitialPlayerState(PlayerId.PLAYER_B, [
    createInitialCard(PlayerId.PLAYER_B, 1, CardRole.WEREWOLF),
  ]);
  return createInitialGameState('player-view-test', 'view-seed', {
    [PlayerId.PLAYER_A]: playerA,
    [PlayerId.PLAYER_B]: playerB,
  });
}

describe('ruleset v0.2 player view serializer', () => {
  it('shows every own role but hides an opponent role until reveal', () => {
    const game = createViewTestGame();
    const hiddenView = serializePlayerView(game, PlayerId.PLAYER_A);

    expect(hiddenView.self.board[0].role.id).toBe(CardRole.SEER);
    expect(hiddenView.opponent.board[0]).toMatchObject({
      state: { life: 'ALIVE', visibility: 'HIDDEN' },
      role: null,
    });

    const revealedOpponent = transitionCard(
      game.players[PlayerId.PLAYER_B].board[0],
      { type: 'REVEAL' }
    );
    const revealedGame = {
      ...game,
      players: {
        ...game.players,
        [PlayerId.PLAYER_B]: {
          ...game.players[PlayerId.PLAYER_B],
          board: [revealedOpponent],
        },
      },
    };

    expect(
      serializePlayerView(revealedGame, PlayerId.PLAYER_A).opponent.board[0].role
    ).toBe(CardRole.WEREWOLF);
  });

  it('does not reveal the role of a dead hidden opponent card', () => {
    const game = createViewTestGame();
    const deadHidden = transitionCard(game.players[PlayerId.PLAYER_B].board[0], {
      type: 'ELIMINATE',
    });
    const nextGame = {
      ...game,
      players: {
        ...game.players,
        [PlayerId.PLAYER_B]: {
          ...game.players[PlayerId.PLAYER_B],
          board: [deadHidden],
        },
      },
    };

    expect(serializePlayerView(nextGame, PlayerId.PLAYER_A).opponent.board[0]).toMatchObject(
      {
        state: { life: 'DEAD', visibility: 'HIDDEN' },
        role: null,
      }
    );
  });

  it('exposes only the opponent submission lock, not the Night Order payload', () => {
    const game = createViewTestGame();
    const playerA: PlayerState = {
      ...game.players[PlayerId.PLAYER_A],
      submissions: {
        ...game.players[PlayerId.PLAYER_A].submissions,
        night: {
          type: 'USE_ABILITY',
          sourceId: 'A1',
          abilityId: AbilityId.SEER_INSPECT,
          targetId: 'B1',
        },
      },
    };
    const nextGame = {
      ...game,
      players: { ...game.players, [PlayerId.PLAYER_A]: playerA },
    };
    const opponentView = serializePlayerView(nextGame, PlayerId.PLAYER_B).opponent;

    expect(opponentView.submissionLocks.night).toBe(true);
    expect('submissions' in opponentView).toBe(false);
  });

  it('keeps Seer intel private to its owner', () => {
    const game = createViewTestGame();
    const playerA: PlayerState = {
      ...game.players[PlayerId.PLAYER_A],
      privateIntel: [
        {
          id: 'intel-a1-b1-round-1',
          sourceAbilityId: AbilityId.SEER_INSPECT,
          sourceCardId: 'A1',
          targetCardId: 'B1',
          discoveredRole: CardRole.WEREWOLF,
          discoveredRound: 1,
        },
      ],
    };
    const nextGame = {
      ...game,
      players: { ...game.players, [PlayerId.PLAYER_A]: playerA },
    };

    expect(serializePlayerView(nextGame, PlayerId.PLAYER_A).self.privateIntel).toHaveLength(
      1
    );
    const playerBView = serializePlayerView(nextGame, PlayerId.PLAYER_B);
    expect(playerBView.self.privateIntel).toEqual([]);
    expect('privateIntel' in playerBView.opponent).toBe(false);
  });

  it('removes effect identity and source from serialized card effects', () => {
    const game = createViewTestGame();
    const protection: CardEffectState = {
      id: 'effect-guard-a5-target-b1-round-1',
      kind: CardEffectKind.PROTECTION,
      source: {
        type: 'ABILITY',
        abilityId: AbilityId.GUARD_PROTECT,
        cardId: 'A2',
        playerId: PlayerId.PLAYER_A,
      },
      appliedRound: 1,
      expires: { type: 'AFTER_PHASE', phase: 'NIGHT_RESOLUTION', round: 1 },
    };
    const affectedCard = transitionCard(game.players[PlayerId.PLAYER_B].board[0], {
      type: 'APPLY_EFFECT',
      effect: protection,
    });
    const nextGame = {
      ...game,
      players: {
        ...game.players,
        [PlayerId.PLAYER_B]: {
          ...game.players[PlayerId.PLAYER_B],
          board: [affectedCard],
        },
      },
    };
    const effectView = serializePlayerView(
      nextGame,
      PlayerId.PLAYER_A
    ).opponent.board[0].effects[0];

    expect(effectView).toEqual({
      kind: CardEffectKind.PROTECTION,
      appliedRound: 1,
      expires: { type: 'AFTER_PHASE', phase: 'NIGHT_RESOLUTION', round: 1 },
    });
    expect('id' in effectView).toBe(false);
    expect('source' in effectView).toBe(false);
  });
});
