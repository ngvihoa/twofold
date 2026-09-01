import { describe, expect, it } from 'vitest';
import {
  AbilityId,
  CardRole,
  PlayerId,
} from '@twofold/shared-types';
import {
  CardEffectKind,
  CardEffectRule,
  type CardEffectState,
  createInitialCard,
  hasCardEffect,
  transitionCard,
} from './cards';

const protectionEffect: CardEffectState = {
  id: 'effect-guard-a5-round-1',
  kind: CardEffectKind.PROTECTION,
  source: {
    type: 'ABILITY',
    abilityId: AbilityId.GUARD_PROTECT,
    instanceId: 'A:5',
    playerId: PlayerId.PLAYER_A,
  },
  appliedRound: 1,
  expires: { type: 'AFTER_PHASE', phase: 'NIGHT_RESOLUTION', round: 1 },
};

const revengeMarkEffect: CardEffectState = {
  id: 'effect-avenger-b8-round-1',
  kind: CardEffectKind.REVENGE_MARK,
  source: {
    type: 'ABILITY',
    abilityId: AbilityId.AVENGER_MARK,
    instanceId: 'B:8',
    playerId: PlayerId.PLAYER_B,
  },
  appliedRound: 1,
  expires: { type: 'AFTER_PHASE', phase: 'NIGHT_RESOLUTION', round: 1 },
};

const councilLockEffect: CardEffectState = {
  id: 'effect-council-lock-a1-round-3',
  kind: CardEffectKind.COUNCIL_LOCK,
  source: {
    type: 'RULE',
    rule: CardEffectRule.FAILED_COUNCIL,
  },
  appliedRound: 3,
  expires: { type: 'AFTER_PHASE', phase: 'COUNCIL_RESOLUTION', round: 4 },
};

describe('ruleset v0.2 card state', () => {
  it('creates a hidden alive card with role-specific ability state', () => {
    const guard = createInitialCard(PlayerId.PLAYER_A, 1, CardRole.GUARD);

    expect(guard).toEqual({
      id: 'A1',
      position: 1,
      owner: PlayerId.PLAYER_A,
      occupant: {
        id: 'A:1',
        role: {
          id: CardRole.GUARD,
          abilities: [{ abilityId: AbilityId.GUARD_PROTECT, lastTarget: null }],
        },
        state: { life: 'ALIVE', visibility: 'HIDDEN' },
        effects: [],
      },
    });
    expect(() => createInitialCard(PlayerId.PLAYER_A, 0, CardRole.VILLAGER)).toThrow(
      RangeError
    );
  });

  it('stores multiple ability effects independently from runtime state', () => {
    const initial = createInitialCard(PlayerId.PLAYER_A, 1, CardRole.VILLAGER);
    const revealed = transitionCard(initial, { type: 'REVEAL' });
    const protectedCard = transitionCard(revealed, {
      type: 'APPLY_EFFECT',
      effect: protectionEffect,
    });
    const cardWithTwoEffects = transitionCard(protectedCard, {
      type: 'APPLY_EFFECT',
      effect: revengeMarkEffect,
    });

    expect(cardWithTwoEffects.occupant.state).toEqual({
      life: 'ALIVE',
      visibility: 'REVEALED',
    });
    expect(cardWithTwoEffects.occupant.effects).toEqual([
      protectionEffect,
      revengeMarkEffect,
    ]);
    expect(hasCardEffect(cardWithTwoEffects, CardEffectKind.PROTECTION)).toBe(true);
    expect(initial.occupant.effects).toEqual([]);
  });

  it('represents a failed-council cooldown as a rule-sourced effect', () => {
    const initial = createInitialCard(PlayerId.PLAYER_A, 1, CardRole.VILLAGER);
    const lockedCard = transitionCard(initial, {
      type: 'APPLY_EFFECT',
      effect: councilLockEffect,
    });

    expect(hasCardEffect(lockedCard, CardEffectKind.COUNCIL_LOCK)).toBe(true);
    expect(lockedCard.occupant.effects[0]).toMatchObject({
      source: { type: 'RULE', rule: CardEffectRule.FAILED_COUNCIL },
      expires: { type: 'AFTER_PHASE', phase: 'COUNCIL_RESOLUTION', round: 4 },
    });
  });

  it('eliminates and revives a hidden card without revealing it', () => {
    const initial = createInitialCard(PlayerId.PLAYER_A, 1, CardRole.VILLAGER);
    const protectedCard = transitionCard(initial, {
      type: 'APPLY_EFFECT',
      effect: protectionEffect,
    });
    const deadCard = transitionCard(protectedCard, { type: 'ELIMINATE' });

    expect(deadCard.occupant.state).toEqual({ life: 'DEAD', visibility: 'HIDDEN' });
    expect(deadCard.occupant.effects).toEqual([]);
    expect(() =>
      transitionCard(deadCard, { type: 'APPLY_EFFECT', effect: protectionEffect })
    ).toThrow('Không thể áp dụng effect lên card đã chết.');

    const revivedCard = transitionCard(deadCard, { type: 'REVIVE' });
    expect(revivedCard.occupant.state).toEqual({
      life: 'ALIVE',
      visibility: 'HIDDEN',
    });
  });

  it('preserves public visibility through elimination and revival', () => {
    const initial = createInitialCard(PlayerId.PLAYER_A, 1, CardRole.VILLAGER);
    const revealedCard = transitionCard(initial, { type: 'REVEAL' });
    const deadCard = transitionCard(revealedCard, { type: 'ELIMINATE' });

    expect(deadCard.occupant.state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });

    const revivedCard = transitionCard(deadCard, { type: 'REVIVE' });
    expect(revivedCard.occupant.state).toEqual({
      life: 'ALIVE',
      visibility: 'REVEALED',
    });
  });

  it('reveals a dead hidden card without reviving it', () => {
    const initial = createInitialCard(PlayerId.PLAYER_A, 1, CardRole.VILLAGER);
    const deadCard = transitionCard(initial, { type: 'ELIMINATE' });
    const revealedCorpse = transitionCard(deadCard, { type: 'REVEAL' });

    expect(revealedCorpse.occupant.state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
  });

  it('rejects duplicate effect identities', () => {
    const initial = createInitialCard(PlayerId.PLAYER_A, 1, CardRole.VILLAGER);
    const protectedCard = transitionCard(initial, {
      type: 'APPLY_EFFECT',
      effect: protectionEffect,
    });

    expect(() =>
      transitionCard(protectedCard, { type: 'APPLY_EFFECT', effect: protectionEffect })
    ).toThrow(`Effect ID ${protectionEffect.id} đã tồn tại trên A1.`);
  });

});
