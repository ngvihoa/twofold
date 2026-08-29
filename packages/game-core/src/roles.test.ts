import { describe, expect, it } from 'vitest';
import { AbilityId, CardRole, Faction } from '@twofold/shared-types';
import { GameEngine } from './engine';
import { ROLE_DEFINITIONS, STANDARD_DECK } from './roles';

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

    expect(engine.getState().cardsA.map((card) => card.role)).toEqual(STANDARD_DECK);
    expect(engine.getState().cardsB.map((card) => card.role)).toEqual(STANDARD_DECK);
    expect(engine.getDefaultDeck()).not.toBe(STANDARD_DECK);
  });
});
