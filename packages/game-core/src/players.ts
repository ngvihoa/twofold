import { AbilityId, CardRole, PlayerId } from '@twofold/shared-types';
import type { CardId, GameCard } from './cards';

export type PlayerSetupState =
  | { readonly status: 'ARRANGING' }
  | { readonly status: 'LOCKED' };

export type CouncilOrder =
  | { readonly type: 'PASS' }
  | {
      readonly type: 'ACCUSE';
      readonly targetId: CardId;
      readonly guessedRole: CardRole;
      readonly voterIds: readonly [CardId, CardId, CardId];
    };

export type NightOrder =
  | { readonly type: 'PASS' }
  | {
      readonly type: 'USE_ABILITY';
      readonly sourceId: CardId;
      readonly abilityId:
        | AbilityId.WEREWOLF_ATTACK
        | AbilityId.SEER_INSPECT
        | AbilityId.WITCH_POISON;
      readonly targetId: CardId;
    }
  | { readonly type: 'BLOOD_MOON'; readonly targetId: CardId };

export type DefenseOrder =
  | { readonly type: 'PASS' }
  | {
      readonly type: 'PROTECT';
      readonly sourceId: CardId;
      readonly targetId: CardId;
    };

export interface PlayerSubmissionState {
  readonly council: CouncilOrder | null;
  readonly night: NightOrder | null;
  readonly defense: DefenseOrder | null;
  readonly finalGuess: CardRole | null;
}

export enum PlayerSpecialAbilityId {
  BLOOD_MOON = 'BLOOD_MOON',
}

export type PlayerSpecialAbilityState = {
  readonly abilityId: PlayerSpecialAbilityId.BLOOD_MOON;
  readonly unlockRound: number;
  readonly cooldownRounds: number;
  readonly readyRound: number;
};

export interface PrivateIntelEntry {
  readonly id: string;
  readonly sourceAbilityId: AbilityId.SEER_INSPECT;
  readonly sourceCardId: CardId;
  readonly targetCardId: CardId;
  readonly discoveredRole: CardRole;
  readonly discoveredRound: number;
}

export interface PlayerState {
  readonly id: PlayerId;
  readonly board: readonly GameCard[];
  readonly setup: PlayerSetupState;
  readonly submissions: PlayerSubmissionState;
  readonly specialAbilities: readonly PlayerSpecialAbilityState[];
  readonly privateIntel: readonly PrivateIntelEntry[];
}

export function createInitialPlayerState(
  id: PlayerId,
  board: readonly GameCard[]
): PlayerState {
  if (board.some((card) => card.owner !== id)) {
    throw new Error(`Board của ${id} chứa card thuộc player khác.`);
  }

  return {
    id,
    board: [...board],
    setup: { status: 'ARRANGING' },
    submissions: {
      council: null,
      night: null,
      defense: null,
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
  };
}

export function replacePlayerCard(player: PlayerState, card: GameCard): PlayerState {
  if (card.owner !== player.id) {
    throw new Error(`Không thể đặt ${card.id} vào board của ${player.id}.`);
  }

  const cardIndex = player.board.findIndex((candidate) => candidate.id === card.id);
  if (cardIndex < 0) throw new Error(`Không tìm thấy ${card.id} trên board của ${player.id}.`);

  const board = [...player.board];
  board[cardIndex] = card;
  return { ...player, board };
}
