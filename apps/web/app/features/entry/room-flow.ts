import type { CardRole } from '@twofold/shared-types';

export type MockRoomStage = 'WAITING' | 'SETUP' | 'COUNTDOWN' | 'INTRO';

export interface MockSetupCard {
  readonly id: string;
  readonly role: CardRole;
}

export function createMockSetupCards(
  seat: 'A' | 'B',
  deck: readonly CardRole[]
): readonly MockSetupCard[] {
  return deck.map((role, index) => ({ id: `${seat}${index + 1}`, role }));
}

export function swapMockSetupCards(
  cards: readonly MockSetupCard[],
  firstIndex: number,
  secondIndex: number
): readonly MockSetupCard[] {
  if (
    firstIndex === secondIndex ||
    firstIndex < 0 ||
    secondIndex < 0 ||
    firstIndex >= cards.length ||
    secondIndex >= cards.length
  ) {
    return cards;
  }

  const next = [...cards];
  [next[firstIndex], next[secondIndex]] = [next[secondIndex], next[firstIndex]];
  return next;
}

export function advanceMockCountdown(value: number): number | null {
  return value <= 1 ? null : value - 1;
}
