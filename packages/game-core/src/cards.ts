import { AbilityId, CardRole, PlayerId } from '@twofold/shared-types';
import { createInitialRoleState, type RoleState } from './roles';

/** Vị trí cố định của một card trên board gồm 10 ô của player. */
export type CardPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * ID ổn định của một board slot trong trận: prefix `A`/`B` xác định player sở
 * hữu slot và phần số xác định vị trí 1–10, ví dụ `A1` hoặc `B10`.
 */
export type CardId = `${'A' | 'B'}${CardPosition}`;

/**
 * Danh tính bất biến của card vật lý được chia lúc đầu trận.
 *
 * Khác với `CardId` là ID của slot hiện tại, ID này đi theo occupant qua Purge
 * SWAP và được dùng cho memory/intel tồn tại qua nhiều vòng.
 */
export type CardInstanceId = `${'A' | 'B'}:${CardPosition}`;

/**
 * Lifecycle state cốt lõi của card, tách khỏi các effect tạm thời.
 *
 * `life` và `visibility` là hai trục độc lập: card bị loại khi đang úp có thể
 * ở trạng thái `DEAD + HIDDEN`, còn card đã lộ vẫn giữ visibility khi chết hoặc
 * được hồi sinh. Chỉ event `REVEAL` mới làm thay đổi visibility.
 */
export type CardRuntimeState =
  | {
      readonly life: 'ALIVE';
      readonly visibility: 'HIDDEN' | 'REVEALED';
    }
  | {
      readonly life: 'DEAD';
      readonly visibility: 'HIDDEN' | 'REVEALED';
    };

/** Phân loại các effect có thể cùng tồn tại và tác động lên một target card. */
export enum CardEffectKind {
  PROTECTION = 'PROTECTION',
  REVENGE_MARK = 'REVENGE_MARK',
  COUNCIL_LOCK = 'COUNCIL_LOCK',
  PURGE_LOCK = 'PURGE_LOCK',
  ROUND_EXHAUSTED = 'ROUND_EXHAUSTED',
}

/** Định danh game rule có thể trực tiếp tạo effect mà không qua ability. */
export enum CardEffectRule {
  FAILED_COUNCIL = 'FAILED_COUNCIL',
  PURGE_LOCK = 'PURGE_LOCK',
  DAY_ABILITY_USED = 'DAY_ABILITY_USED',
}

/**
 * Nguồn tạo ra một effect trên card.
 *
 * Ability source lưu đủ actor/source card để audit và resolve interaction;
 * rule source dùng cho effect do luật chung tạo ra, như khóa Council thất bại.
 */
export type CardEffectSource =
  | {
      readonly type: 'ABILITY';
      readonly abilityId: AbilityId;
      readonly instanceId: CardInstanceId;
      readonly playerId: PlayerId;
    }
  | {
      readonly type: 'RULE';
      readonly rule: CardEffectRule;
    };

/** Các resolution phase hiện có thể được dùng làm mốc hết hạn effect. */
export type CardEffectExpiryPhase = 'NIGHT_RESOLUTION' | 'COUNCIL_RESOLUTION';

/**
 * Chính sách hết hạn của effect: sau một resolution phase cụ thể, khi effect
 * được trigger/consume, hoặc tồn tại cho tới khi bị remove rõ ràng.
 */
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

/**
 * Authoritative state của một card vật lý đang chiếm một board slot.
 *
 * Card sở hữu lifecycle, role runtime state và danh sách effect đang tác động
 * lên chính nó. Các knowledge riêng của player không được lưu trong card.
 */
export interface CardInstanceState {
  readonly id: CardInstanceId;
  readonly role: RoleState;
  readonly state: CardRuntimeState;
  readonly effects: readonly CardEffectState[];
}

/**
 * Slot cố định trên board và card instance đang chiếm slot đó.
 *
 * `id`, `position`, `owner` thuộc slot và không đổi qua Purge SWAP. Toàn bộ
 * lifecycle/role/ability/effect nằm trong `occupant` và đi theo card vật lý.
 */
export interface GameCard {
  readonly id: CardId;
  readonly position: CardPosition;
  readonly owner: PlayerId;
  readonly occupant: CardInstanceState;
}

/**
 * Các event tổng quát mà card state machine chấp nhận.
 *
 * Ability-specific event không nằm ở đây: Rule Flow chuyển kết quả của ability
 * thành lifecycle event hoặc `APPLY_EFFECT`/`REMOVE_EFFECT` tương ứng.
 */
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

/** Validate một số runtime và thu hẹp nó thành `CardPosition`. */
function toCardPosition(position: number): CardPosition {
  if (!Number.isInteger(position) || position < 1 || position > 10) {
    throw new RangeError('Card position phải là số nguyên từ 1 đến 10.');
  }
  return position as CardPosition;
}

/**
 * Tạo card mới ở trạng thái sống, ẩn, chưa có effect và có `RoleState` tương
 * ứng với role được cấp.
 *
 * @throws Khi `position` không phải số nguyên từ 1 đến 10.
 */
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
    occupant: {
      id: `${CARD_PREFIX[owner]}:${validPosition}`,
      role: createInitialRoleState(role),
      state: { life: 'ALIVE', visibility: 'HIDDEN' },
      effects: [],
    },
  };
}

/**
 * Áp dụng một `CardEvent` theo kiểu immutable và trả về card state kế tiếp.
 * Lifecycle event chỉ thay đổi đúng trục nó đại diện: `REVEAL` giữ nguyên life,
 * còn `ELIMINATE`/`REVIVE` giữ nguyên visibility. Death/revive đồng thời dọn
 * effect cũ để effect của lifecycle trước không rò sang lifecycle mới.
 *
 * @throws Khi áp effect lên card đã chết hoặc dùng trùng effect ID.
 */
export function transitionCard(card: GameCard, event: CardEvent): GameCard {
  switch (event.type) {
    case 'REVEAL':
      if (card.occupant.state.visibility === 'REVEALED') return card;
      return {
        ...card,
        occupant: {
          ...card.occupant,
          state: { ...card.occupant.state, visibility: 'REVEALED' },
        },
      };

    case 'ELIMINATE':
      if (card.occupant.state.life === 'DEAD') return card;
      return {
        ...card,
        occupant: {
          ...card.occupant,
          state: { life: 'DEAD', visibility: card.occupant.state.visibility },
          effects: [],
        },
      };

    case 'REVIVE':
      if (card.occupant.state.life === 'ALIVE') return card;
      return {
        ...card,
        occupant: {
          ...card.occupant,
          state: { life: 'ALIVE', visibility: card.occupant.state.visibility },
          effects: [],
        },
      };

    case 'APPLY_EFFECT':
      if (card.occupant.state.life === 'DEAD') {
        throw new Error('Không thể áp dụng effect lên card đã chết.');
      }
      if (card.occupant.effects.some((effect) => effect.id === event.effect.id)) {
        throw new Error(`Effect ID ${event.effect.id} đã tồn tại trên ${card.id}.`);
      }
      return {
        ...card,
        occupant: {
          ...card.occupant,
          effects: [...card.occupant.effects, event.effect],
        },
      };

    case 'REMOVE_EFFECT':
      return {
        ...card,
        occupant: {
          ...card.occupant,
          effects: card.occupant.effects.filter(
            (effect) => effect.id !== event.effectId
          ),
        },
      };

    case 'CLEAR_EFFECTS':
      if (card.occupant.effects.length === 0) return card;
      return { ...card, occupant: { ...card.occupant, effects: [] } };
  }
}

/** Kiểm tra card còn sống dựa trên nhánh `life` của runtime state. */
export function isCardAlive(card: GameCard): boolean {
  return card.occupant.state.life === 'ALIVE';
}

/** Kiểm tra role của card đã được reveal công khai hay chưa. */
export function isCardRevealed(card: GameCard): boolean {
  return card.occupant.state.visibility === 'REVEALED';
}

/** Kiểm tra card hiện có ít nhất một effect thuộc `kind` được yêu cầu. */
export function hasCardEffect(card: GameCard, kind: CardEffectKind): boolean {
  return card.occupant.effects.some((effect) => effect.kind === kind);
}
