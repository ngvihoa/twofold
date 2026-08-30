import { describe, expect, it } from 'vitest';
import { AbilityId, CardRole, Faction, PlayerId } from '@twofold/shared-types';
import { GameEngine } from './engine';
import {
  ROLE_DEFINITIONS,
  STANDARD_DECK,
  createInitialRoleState,
  getRoleAbility,
  transitionRole,
} from './roles';

describe('ruleset v0.2 roles and deck', () => {
  it('defines metadata for every shared role', () => {
    expect(Object.keys(ROLE_DEFINITIONS).sort()).toEqual(Object.values(CardRole).sort());
    expect(ROLE_DEFINITIONS[CardRole.WOLF_GUARD]).toMatchObject({
      faction: Faction.WEREWOLF,
      abilities: [AbilityId.WOLF_GUARD_RESCUE],
    });
  });

  it('uses the ten-card deck from the game-flow demo', () => {
    expect(STANDARD_DECK).toHaveLength(10);
    expect(STANDARD_DECK.filter((role) => role === CardRole.VILLAGER)).toHaveLength(1);
    expect(STANDARD_DECK.filter((role) => role === CardRole.WEREWOLF)).toHaveLength(2);
    expect(new Set(STANDARD_DECK)).toEqual(new Set(Object.values(CardRole)));
  });

  it('initializes both boards from the standard deck without sharing the deck array', () => {
    const engine = new GameEngine('role-deck-test');

    expect(
      engine.getState().players[PlayerId.PLAYER_A].board.map((card) => card.role.id)
    ).toEqual(STANDARD_DECK);
    expect(
      engine.getState().players[PlayerId.PLAYER_B].board.map((card) => card.role.id)
    ).toEqual(STANDARD_DECK);
    expect(engine.getDefaultDeck()).not.toBe(STANDARD_DECK);
  });

  it('owns Guard target memory and permits the same target after a skipped round', () => {
    const initial = createInitialRoleState(CardRole.GUARD);
    const usedInRoundThree = transitionRole(initial, {
      type: 'ABILITY_USED',
      abilityId: AbilityId.GUARD_PROTECT,
      targetId: 'A1',
      round: 3,
    });

    expect(getRoleAbility(usedInRoundThree, AbilityId.GUARD_PROTECT)).toEqual({
      abilityId: AbilityId.GUARD_PROTECT,
      lastTarget: { cardId: 'A1', round: 3 },
    });
    expect(() =>
      transitionRole(usedInRoundThree, {
        type: 'ABILITY_USED',
        abilityId: AbilityId.GUARD_PROTECT,
        targetId: 'A1',
        round: 4,
      })
    ).toThrow('Không được bảo vệ cùng một target ở hai vòng liên tiếp.');

    expect(() =>
      transitionRole(usedInRoundThree, {
        type: 'ABILITY_USED',
        abilityId: AbilityId.GUARD_PROTECT,
        targetId: 'A1',
        round: 5,
      })
    ).not.toThrow();
  });

  it('consumes remaining uses for limited abilities', () => {
    const seer = createInitialRoleState(CardRole.SEER);
    const afterInspect = transitionRole(seer, {
      type: 'ABILITY_USED',
      abilityId: AbilityId.SEER_INSPECT,
      targetId: 'B1',
      round: 1,
    });

    expect(getRoleAbility(afterInspect, AbilityId.SEER_INSPECT)).toEqual({
      abilityId: AbilityId.SEER_INSPECT,
      remainingUses: 2,
    });
  });
});
