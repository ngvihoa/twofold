import { describe, expect, it } from 'vitest';
import { AbilityId, CardRole, PlayerId } from '@twofold/shared-types';
import { CardEffectKind, createInitialCard } from './cards';
import { appendGameEvents } from './game-events';
import { createInitialGameState } from './game-state';
import { createInitialPlayerState } from './players';

function createEventTestGame() {
  return createInitialGameState('event-test', 'event-seed', {
    [PlayerId.PLAYER_A]: createInitialPlayerState(PlayerId.PLAYER_A, [
      createInitialCard(PlayerId.PLAYER_A, 1, CardRole.WEREWOLF),
    ]),
    [PlayerId.PLAYER_B]: createInitialPlayerState(PlayerId.PLAYER_B, [
      createInitialCard(PlayerId.PLAYER_B, 1, CardRole.VILLAGER),
      createInitialCard(PlayerId.PLAYER_B, 2, CardRole.WITCH),
    ]),
  });
}

describe('ruleset v0.2 structured game events', () => {
  it('preserves source → effect → death/revive → Dawn completion order', () => {
    const game = createEventTestGame();
    const next = appendGameEvents(game, [
      {
        type: 'CARD_REVEALED',
        visibility: { type: 'PUBLIC' },
        cardId: 'A1',
      },
      {
        type: 'ABILITY_RESOLVED',
        visibility: { type: 'PUBLIC' },
        abilityId: AbilityId.WEREWOLF_ATTACK,
        sourceCardId: 'A1',
        targetCardId: 'B1',
      },
      {
        type: 'EFFECT_APPLIED',
        visibility: { type: 'PUBLIC' },
        targetCardId: 'B1',
        effectKind: CardEffectKind.PROTECTION,
      },
      {
        type: 'CARD_ELIMINATED',
        visibility: { type: 'PUBLIC' },
        cardId: 'B1',
        cause: {
          type: 'ABILITY',
          abilityId: AbilityId.WEREWOLF_ATTACK,
          sourceCardId: 'A1',
        },
      },
      {
        type: 'CARD_REVIVED',
        visibility: { type: 'PUBLIC' },
        cardId: 'B1',
        sourceCardId: 'B2',
      },
      {
        type: 'DAWN_PRESENTATION_COMPLETED',
        visibility: { type: 'PUBLIC' },
      },
    ]);

    expect(next.events.map((event) => event.type)).toEqual([
      'CARD_REVEALED',
      'ABILITY_RESOLVED',
      'EFFECT_APPLIED',
      'CARD_ELIMINATED',
      'CARD_REVIVED',
      'DAWN_PRESENTATION_COMPLETED',
    ]);
    expect(next.events.map((event) => event.sequence)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(next.events[0]).toMatchObject({
      id: 'event-test:event:1',
      round: 1,
      phase: 'SETUP',
    });
    expect(JSON.stringify(next.events)).not.toContain('duration');
    expect(next.outcomes.map((outcome) => outcome.type)).toEqual([
      'CARD_REVEALED',
      'CARD_ELIMINATED',
      'CARD_REVIVED',
    ]);
    expect(JSON.stringify(next.outcomes)).not.toContain('sourceCardId');
    expect(JSON.stringify(next.outcomes)).not.toContain('cause');
  });

  it('projects a blocked protection as card.saved without hidden action data', () => {
    const next = appendGameEvents(createEventTestGame(), [{
      type: 'EFFECT_BLOCKED',
      visibility: { type: 'PUBLIC' },
      targetCardId: 'B1',
      effectKind: CardEffectKind.PROTECTION,
    }]);

    expect(next.outcomes).toEqual([expect.objectContaining({
      type: 'CARD_SAVED',
      cardId: 'B1',
      instanceId: 'B:1',
      owner: PlayerId.PLAYER_B,
    })]);
    expect(JSON.stringify(next.outcomes)).not.toContain('effectKind');
  });

  it('requires Seer inspection results to be private', () => {
    const game = createEventTestGame();

    expect(() =>
      appendGameEvents(game, [
        {
          type: 'PRIVATE_INSPECTION_RESULT',
          visibility: { type: 'PUBLIC' },
          intelId: 'intel-a1-b1-round-1',
          targetCardId: 'B1',
          discoveredRole: CardRole.VILLAGER,
        },
      ])
    ).toThrow('PRIVATE_INSPECTION_RESULT phải có private visibility.');
  });
});
