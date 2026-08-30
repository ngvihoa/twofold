import { AbilityId, CardRole, PlayerId } from '@twofold/shared-types';
import type { CardId, GameCard } from './cards';

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
 * Lựa chọn đã khóa của player trong Council: bỏ qua hoặc buộc tội một target
 * bằng đúng ba voter và một role dự đoán.
 */
export type CouncilOrder =
  | { readonly type: 'PASS' }
  | {
      readonly type: 'ACCUSE';
      readonly targetId: CardId;
      readonly guessedRole: CardRole;
      readonly voterIds: readonly [CardId, CardId, CardId];
    };

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
 * Các submission đang chờ resolution của một player.
 *
 * `null` nghĩa là player chưa khóa lựa chọn cho slot tương ứng. Day action
 * không nằm ở đây vì được xử lý tuần tự và resolve ngay bởi phase machine.
 */
export interface PlayerSubmissionState {
  readonly council: CouncilOrder | null;
  readonly night: NightOrder | null;
  readonly defense: DefenseOrder | null;
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
 * Intel tách khỏi source và target card để kiến thức không mất khi Seer chết
 * và không vô tình biến thành thông tin reveal công khai của target.
 */
export interface PrivateIntelEntry {
  readonly id: string;
  readonly sourceAbilityId: AbilityId.SEER_INSPECT;
  readonly sourceCardId: CardId;
  readonly targetCardId: CardId;
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
