import { describe, expect, it } from 'vitest';
import { CardRole, PlayerId } from '@twofold/shared-types';
import { createInitialCard, transitionCard } from './cards';
import {
  PlayerSpecialAbilityId,
  createInitialPlayerState,
  replacePlayerCard,
} from './players';

describe('ruleset v0.2 player state', () => {
  it('owns the board, phase submissions, special abilities and private intel', () => {
    const board = [createInitialCard(PlayerId.PLAYER_A, 1, CardRole.VILLAGER)];
    const player = createInitialPlayerState(PlayerId.PLAYER_A, board);

    expect(player).toMatchObject({
      id: PlayerId.PLAYER_A,
      setup: { status: 'ARRANGING' },
      submissions: {
        council: null,
        night: null,
        defense: null,
        purge: null,
        finalGuess: null,
      },
      specialAbilities: [
        {
          abilityId: PlayerSpecialAbilityId.BLOOD_MOON,
          unlockRound: 6,
          cooldownRounds: 2,
          readyRound: 6,
        },
      ],
      privateIntel: [],
    });
    expect(player.board).toEqual(board);
  });

  it('rejects cards owned by another player', () => {
    const foreignCard = createInitialCard(PlayerId.PLAYER_B, 1, CardRole.VILLAGER);

    expect(() => createInitialPlayerState(PlayerId.PLAYER_A, [foreignCard])).toThrow(
      'Board của PLAYER_A chứa card thuộc player khác.'
    );
  });

  it('replaces a card immutably inside its owning player board', () => {
    const initialCard = createInitialCard(PlayerId.PLAYER_A, 1, CardRole.VILLAGER);
    const player = createInitialPlayerState(PlayerId.PLAYER_A, [initialCard]);
    const deadCard = transitionCard(initialCard, { type: 'ELIMINATE' });
    const nextPlayer = replacePlayerCard(player, deadCard);

    expect(nextPlayer.board[0].state.life).toBe('DEAD');
    expect(player.board[0].state.life).toBe('ALIVE');
  });
});
