import { CardRole } from '@twofold/shared-types';
import { describe, expect, it } from 'vitest';
import {
  advanceMockCountdown,
  createMockSetupCards,
  swapMockSetupCards,
} from './room-flow';

describe('mock room UX flow', () => {
  const deck = [CardRole.VILLAGER, CardRole.WEREWOLF, CardRole.SEER];

  it('creates stable card identities for the current seat', () => {
    expect(createMockSetupCards('B', deck)).toEqual([
      { id: 'B1', role: CardRole.VILLAGER },
      { id: 'B2', role: CardRole.WEREWOLF },
      { id: 'B3', role: CardRole.SEER },
    ]);
  });

  it('swaps two setup positions without mutating card identity', () => {
    const cards = createMockSetupCards('A', deck);
    const swapped = swapMockSetupCards(cards, 0, 2);
    expect(swapped.map((card) => card.id)).toEqual(['A3', 'A2', 'A1']);
    expect(cards.map((card) => card.id)).toEqual(['A1', 'A2', 'A3']);
  });

  it('ignores invalid swaps and advances a three-second countdown', () => {
    const cards = createMockSetupCards('A', deck);
    expect(swapMockSetupCards(cards, -1, 2)).toBe(cards);
    expect(advanceMockCountdown(3)).toBe(2);
    expect(advanceMockCountdown(2)).toBe(1);
    expect(advanceMockCountdown(1)).toBeNull();
  });
});
