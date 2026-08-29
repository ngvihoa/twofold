import { AbilityId, CardRole, PlayerId } from '@twofold/shared-types';
import { createInitialRoleState, type RoleState } from './roles';

export type CardPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type CardId = `${'A' | 'B'}${CardPosition}`;

export type CardRuntimeState =
  | {
      readonly life: 'ALIVE';
      readonly visibility: 'HIDDEN' | 'REVEALED';
    }
  | {
      readonly life: 'DEAD';
      readonly visibility: 'REVEALED';
    };

export enum CardEffectKind {
  PROTECTION = 'PROTECTION',
  REVENGE_MARK = 'REVENGE_MARK',
  COUNCIL_LOCK = 'COUNCIL_LOCK',
}

export enum CardEffectRule {
  FAILED_COUNCIL = 'FAILED_COUNCIL',
}

export type CardEffectSource =
  | {
      readonly type: 'ABILITY';
      readonly abilityId: AbilityId;
      readonly cardId: CardId;
      readonly playerId: PlayerId;
    }
  | {
      readonly type: 'RULE';
      readonly rule: CardEffectRule;
    };

export type CardEffectExpiryPhase = 'NIGHT_RESOLUTION' | 'COUNCIL_RESOLUTION';

export type CardEffectExpiry =
  | {
      readonly type: 'AFTER_PHASE';
      readonly phase: CardEffectExpiryPhase;
      readonly round: number;
    }
  | { readonly type: 'WHEN_TRIGGERED' }
  | { readonly type: 'PERMANENT' };

/**
 * Một effect đang tồn tại trên target card. Source cho biết effect được tạo
 * bởi ability hay game rule; nhiều effect có thể cùng tồn tại trên một card.
 */
export interface CardEffectState {
  readonly id: string;
  readonly kind: CardEffectKind;
  readonly source: CardEffectSource;
  readonly appliedRound: number;
  readonly expires: CardEffectExpiry;
}

export interface GameCard {
  readonly id: CardId;
  readonly position: CardPosition;
  readonly owner: PlayerId;
  readonly role: RoleState;
  readonly state: CardRuntimeState;
  readonly effects: readonly CardEffectState[];
}

export type CardEvent =
  | { readonly type: 'REVEAL' }
  | { readonly type: 'ELIMINATE' }
  | { readonly type: 'REVIVE' }
  | { readonly type: 'APPLY_EFFECT'; readonly effect: CardEffectState }
  | { readonly type: 'REMOVE_EFFECT'; readonly effectId: string }
  | { readonly type: 'CLEAR_EFFECTS' };

const CARD_PREFIX: Record<PlayerId, 'A' | 'B'> = {
  [PlayerId.PLAYER_A]: 'A',
  [PlayerId.PLAYER_B]: 'B',
};

function toCardPosition(position: number): CardPosition {
  if (!Number.isInteger(position) || position < 1 || position > 10) {
    throw new RangeError('Card position phải là số nguyên từ 1 đến 10.');
  }
  return position as CardPosition;
}

export function createInitialCard(
  owner: PlayerId,
  position: number,
  role: CardRole
): GameCard {
  const validPosition = toCardPosition(position);
  return {
    id: `${CARD_PREFIX[owner]}${validPosition}`,
    position: validPosition,
    owner,
    role: createInitialRoleState(role),
    state: { life: 'ALIVE', visibility: 'HIDDEN' },
    effects: [],
  };
}

export function transitionCard(card: GameCard, event: CardEvent): GameCard {
  switch (event.type) {
    case 'REVEAL':
      if (card.state.visibility === 'REVEALED') return card;
      return { ...card, state: { life: 'ALIVE', visibility: 'REVEALED' } };

    case 'ELIMINATE':
      if (card.state.life === 'DEAD') return card;
      return {
        ...card,
        state: { life: 'DEAD', visibility: 'REVEALED' },
        effects: [],
      };

    case 'REVIVE':
      if (card.state.life === 'ALIVE') return card;
      return {
        ...card,
        state: { life: 'ALIVE', visibility: 'REVEALED' },
        effects: [],
      };

    case 'APPLY_EFFECT':
      if (card.state.life === 'DEAD') {
        throw new Error('Không thể áp dụng effect lên card đã chết.');
      }
      if (card.effects.some((effect) => effect.id === event.effect.id)) {
        throw new Error(`Effect ID ${event.effect.id} đã tồn tại trên ${card.id}.`);
      }
      return { ...card, effects: [...card.effects, event.effect] };

    case 'REMOVE_EFFECT':
      return {
        ...card,
        effects: card.effects.filter((effect) => effect.id !== event.effectId),
      };

    case 'CLEAR_EFFECTS':
      if (card.effects.length === 0) return card;
      return { ...card, effects: [] };
  }
}

export function isCardAlive(card: GameCard): boolean {
  return card.state.life === 'ALIVE';
}

export function isCardRevealed(card: GameCard): boolean {
  return card.state.visibility === 'REVEALED';
}

export function hasCardEffect(card: GameCard, kind: CardEffectKind): boolean {
  return card.effects.some((effect) => effect.kind === kind);
}
