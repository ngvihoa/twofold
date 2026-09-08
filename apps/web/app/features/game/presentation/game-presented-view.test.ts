import {
  CardRole,
  Faction,
  GamePlayerViewV2Schema,
  PlayerId,
  type GamePresentationEventV2,
} from '@twofold/shared-types';
import {
  STANDARD_DECK,
  createInitialCard,
  createInitialGameState,
  createInitialPlayerState,
  serializePlayerView,
} from '@twofold/game-core';
import { describe, expect, it } from 'vitest';
import { applyCardOutcomeToPresentedView } from './game-presented-view';

function createView() {
  const players = {
    [PlayerId.PLAYER_A]: createInitialPlayerState(
      PlayerId.PLAYER_A,
      STANDARD_DECK.map((role, index) =>
        createInitialCard(PlayerId.PLAYER_A, index + 1, role)
      )
    ),
    [PlayerId.PLAYER_B]: createInitialPlayerState(
      PlayerId.PLAYER_B,
      STANDARD_DECK.map((role, index) =>
        createInitialCard(PlayerId.PLAYER_B, index + 1, role)
      )
    ),
  };
  return GamePlayerViewV2Schema.parse(
    serializePlayerView(createInitialGameState('presented', 'seed', players), PlayerId.PLAYER_A)
  );
}

function envelope(sequence: number) {
  return { id: `event:${sequence}`, sequence, round: 2, phase: 'DAY_A' as const };
}

describe('presented game view', () => {
  it('reveals and eliminates a card in separate presentation beats', () => {
    const initial = createView();
    const authoritative = {
      ...initial,
      phase: { type: 'NIGHT_PLAN' as const },
      opponent: {
        ...initial.opponent,
        board: initial.opponent.board.map((card) =>
          card.id === 'B1'
            ? {
                ...card,
                role: CardRole.WEREWOLF,
                state: { life: 'DEAD' as const, visibility: 'REVEALED' as const },
              }
            : card
        ),
      },
    };
    const reveal = {
      ...envelope(1),
      type: 'CARD_REVEALED',
      cardId: 'B1',
      instanceId: 'B:1',
      owner: PlayerId.PLAYER_B,
      role: CardRole.WEREWOLF,
      faction: Faction.WEREWOLF,
    } satisfies GamePresentationEventV2;
    const eliminated = {
      ...envelope(2),
      type: 'CARD_ELIMINATED',
      cardId: 'B1',
      instanceId: 'B:1',
      owner: PlayerId.PLAYER_B,
      role: CardRole.WEREWOLF,
      faction: Faction.WEREWOLF,
    } satisfies GamePresentationEventV2;

    const afterReveal = applyCardOutcomeToPresentedView(initial, authoritative, reveal);
    expect(afterReveal.opponent.board[0]).toMatchObject({
      role: CardRole.WEREWOLF,
      state: { life: 'ALIVE', visibility: 'REVEALED' },
    });
    expect(afterReveal.phase).toEqual(initial.phase);

    const afterElimination = applyCardOutcomeToPresentedView(
      afterReveal,
      authoritative,
      eliminated
    );
    expect(afterElimination.opponent.board[0].state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(afterElimination.phase).toEqual(initial.phase);
  });
});
