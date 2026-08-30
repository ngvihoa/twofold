import { AbilityId, CardRole, PlayerId } from '@twofold/shared-types';
import type { CardId, CardInstanceId, GameCard } from './cards';

/**
 * Trạng thái submit setup của một player.
 *
 * `ARRANGING` cho phép sắp xếp board; sau `LOCKED`, thứ tự card phải được giữ
 * nguyên. State này chỉ tham gia flow khi game triển khai phase `SETUP`.
 */
export type PlayerSetupState =
  | { readonly status: 'ARRANGING' }
  | { readonly status: 'LOCKED' };

/**
 * Lựa chọn buộc tội đã khóa của player trong Council.
 *
 * Target đã lộ không cần dự đoán (`guessedRole: null`); target còn ẩn phải có
 * role dự đoán. Accusation độc lập với reaction để một player có thể dùng cả
 * hai trong cùng Council.
 */
export type CouncilOrder =
  | { readonly type: 'PASS' }
  | {
      readonly type: 'ACCUSE';
      readonly targetId: CardId;
      readonly guessedRole: CardRole | null;
      readonly voterIds: readonly [CardId, CardId, CardId];
    };

/** Reaction bí mật đã khóa trong Council, độc lập với accusation. */
export type CouncilReactionOrder =
  | { readonly type: 'PASS' }
  | {
      readonly type: 'WOLF_GUARD_RESCUE';
      readonly sourceId: CardId;
      readonly targetId: CardId;
    };

/** Hai slot Council độc lập; mỗi slot phải được khóa rõ ràng, kể cả `PASS`. */
export interface CouncilSubmissionState {
  readonly accusation: CouncilOrder | null;
  readonly reaction: CouncilReactionOrder | null;
}

/**
 * Main Order bí mật của player trong Night phase.
 *
 * Ability của card cần `sourceId`; Blood Moon là player ability nên không có
 * source card.
 */
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

/** Lựa chọn Defense đã khóa: bỏ qua hoặc dùng một Guard bảo vệ target. */
export type DefenseOrder =
  | { readonly type: 'PASS' }
  | {
      readonly type: 'PROTECT';
      readonly sourceId: CardId;
      readonly targetId: CardId;
    };

/**
 * Lựa chọn đã khóa trong Purge phase từ Vòng 6.
 *
 * Rule được giữ trong order để snapshot có thể tự mô tả cách resolve. `REVEAL`
 * cho phép target `null` khi player không còn card sống đang ẩn; `SWAP` cần một
 * card bên mình và một card đối thủ.
 */
export type PurgeOrder =
  | { readonly rule: 'CUT'; readonly targetId: CardId }
  | {
      readonly rule: 'SWAP';
      readonly ownTargetId: CardId;
      readonly opponentTargetId: CardId;
    }
  | { readonly rule: 'REVEAL'; readonly targetId: CardId | null }
  | { readonly rule: 'LOCK'; readonly targetId: CardId };

/**
 * Các submission đang chờ resolution của một player.
 *
 * `null` nghĩa là player chưa khóa lựa chọn cho slot tương ứng. Day action
 * không nằm ở đây vì được xử lý tuần tự và resolve ngay bởi phase machine.
 */
export interface PlayerSubmissionState {
  readonly council: CouncilSubmissionState;
  readonly night: NightOrder | null;
  readonly defense: DefenseOrder | null;
  readonly purge: PurgeOrder | null;
  readonly finalGuess: CardRole | null;
}

/** Định danh ability thuộc player, không cần source card trên board. */
export enum PlayerSpecialAbilityId {
  BLOOD_MOON = 'BLOOD_MOON',
}

/**
 * Runtime state của Blood Moon thuộc player thay vì một board card.
 * `readyRound` là round gần nhất ability có thể dùng lại sau cooldown.
 */
export type PlayerSpecialAbilityState = {
  readonly abilityId: PlayerSpecialAbilityId.BLOOD_MOON;
  readonly unlockRound: number;
  readonly cooldownRounds: number;
  readonly readyRound: number;
};

/**
 * Một kết quả điều tra chỉ player sở hữu mới được biết.
 *
 * Intel thuộc player để kiến thức không mất khi Seer chết. Source/target dùng
 * instance identity nên kiến thức đi theo card vật lý qua Purge SWAP;
 * `observedAtSlotId` chỉ ghi lại slot tại thời điểm điều tra để audit.
 */
export interface PrivateIntelEntry {
  readonly id: string;
  readonly sourceAbilityId: AbilityId.SEER_INSPECT;
  readonly sourceInstanceId: CardInstanceId;
  readonly targetInstanceId: CardInstanceId;
  readonly observedAtSlotId: CardId;
  readonly discoveredRole: CardRole;
  readonly discoveredRound: number;
}

/**
 * Authoritative state thuộc riêng một player trong trận.
 *
 * Player sở hữu board, setup state, pending submissions, player-level ability
 * và private knowledge. Connection/session data không thuộc state này.
 */
export interface PlayerState {
  readonly id: PlayerId;
  readonly board: readonly GameCard[];
  readonly setup: PlayerSetupState;
  readonly submissions: PlayerSubmissionState;
  readonly specialAbilities: readonly PlayerSpecialAbilityState[];
  readonly privateIntel: readonly PrivateIntelEntry[];
}

/**
 * Tạo state ban đầu cho player từ board đã được cấp.
 *
 * Board được copy để tránh chia sẻ array với caller; mọi card trên board phải
 * có cùng owner với player.
 *
 * @throws Khi board chứa card thuộc player khác.
 */
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
      council: { accusation: null, reaction: null },
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
  };
}

/**
 * Thay một card bằng state mới của chính card đó trong board theo kiểu immutable.
 * Dùng sau khi `transitionCard` resolve lifecycle/effect mà không mutate board cũ.
 *
 * @throws Khi card thuộc player khác hoặc không tồn tại trên board.
 */
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
