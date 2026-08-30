import { AbilityId, CardRole, PlayerId } from '@twofold/shared-types';
import type { CardEffectKind, CardId } from './cards';
import type { GameState } from './game-state';
import type { GamePhaseState } from './phase-machine';
import type { PlayerSpecialAbilityId, PurgeOrder } from './players';

/** Quyền nhìn thấy một structured event trong player view. */
export type GameEventVisibility =
  | { readonly type: 'PUBLIC' }
  | { readonly type: 'PRIVATE'; readonly playerId: PlayerId };

/** Nguyên nhân có cấu trúc của một card elimination. */
export type CardEliminationCause =
  | {
      readonly type: 'ABILITY';
      readonly abilityId: AbilityId;
      readonly sourceCardId: CardId;
    }
  | {
      readonly type: 'PLAYER_ABILITY';
      readonly abilityId: PlayerSpecialAbilityId;
      readonly playerId: PlayerId;
    }
  | { readonly type: 'COUNCIL'; readonly playerId: PlayerId }
  | { readonly type: 'PURGE'; readonly rule: PurgeOrder['rule'] }
  | { readonly type: 'REVENGE'; readonly sourceCardId: CardId };

/**
 * Payload domain của các event phục vụ presentation và private feedback.
 *
 * Tên event ở past tense vì chúng mô tả kết quả đã xảy ra, không phải command
 * yêu cầu state machine thực hiện hành động.
 */
export type GameEventPayload =
  | { readonly type: 'CARD_REVEALED'; readonly cardId: CardId }
  | {
      readonly type: 'ABILITY_RESOLVED';
      readonly abilityId: AbilityId | PlayerSpecialAbilityId;
      readonly sourceCardId: CardId | null;
      readonly targetCardId: CardId | null;
    }
  | {
      readonly type: 'EFFECT_APPLIED';
      readonly targetCardId: CardId;
      readonly effectKind: CardEffectKind;
    }
  | {
      readonly type: 'EFFECT_BLOCKED';
      readonly targetCardId: CardId;
      readonly effectKind: CardEffectKind;
    }
  | {
      readonly type: 'CARD_ELIMINATED';
      readonly cardId: CardId;
      readonly cause: CardEliminationCause;
    }
  | {
      readonly type: 'CARD_REVIVED';
      readonly cardId: CardId;
      readonly sourceCardId: CardId;
    }
  | {
      readonly type: 'PRIVATE_INSPECTION_RESULT';
      readonly intelId: string;
      readonly targetCardId: CardId;
      readonly discoveredRole: CardRole;
    }
  | {
      readonly type: 'COUNCIL_FAILED';
      readonly playerId: PlayerId;
      readonly voterIds: readonly [CardId, CardId, CardId];
    }
  | {
      readonly type: 'WOLF_GUARD_RESCUED';
      readonly sourceCardId: CardId;
      readonly targetCardId: CardId;
    }
  | {
      readonly type: 'PURGE_RESOLVED';
      readonly playerId: PlayerId;
      readonly rule: PurgeOrder['rule'];
      readonly targetCardId: CardId | null;
      readonly swapTargetCardId: CardId | null;
    }
  | { readonly type: 'DAWN_PRESENTATION_COMPLETED' };

/** Metadata deterministic gắn vào mỗi event khi append vào GameState. */
export interface GameEventEnvelope {
  readonly id: string;
  readonly sequence: number;
  readonly round: number;
  readonly phase: GamePhaseState['type'];
  readonly visibility: GameEventVisibility;
}

/** Một structured event hoàn chỉnh đã nằm trong authoritative event stream. */
export type GameEvent = GameEventEnvelope & GameEventPayload;

/** Event chưa có sequence/envelope, được resolution pipeline yêu cầu append. */
export type GameEventDraft = GameEventPayload & {
  readonly visibility: GameEventVisibility;
};

/**
 * Append một batch event theo đúng thứ tự truyền vào và gán sequence liên tục.
 *
 * Hàm không thêm timestamp hoặc animation duration. Presentation layer tự ánh
 * xạ event domain thành timing/motion phù hợp.
 *
 * @throws Khi `PRIVATE_INSPECTION_RESULT` không có private visibility.
 */
export function appendGameEvents<TState extends GameState>(
  state: TState,
  drafts: readonly GameEventDraft[]
): TState {
  let sequence = state.events.at(-1)?.sequence ?? 0;
  const appended = drafts.map((draft): GameEvent => {
    if (
      draft.type === 'PRIVATE_INSPECTION_RESULT' &&
      draft.visibility.type !== 'PRIVATE'
    ) {
      throw new Error('PRIVATE_INSPECTION_RESULT phải có private visibility.');
    }

    sequence += 1;
    return {
      ...draft,
      id: `${state.gameId}:event:${sequence}`,
      sequence,
      round: state.round,
      phase: state.phase.type,
    };
  });

  return { ...state, events: [...state.events, ...appended] };
}

/** Kiểm tra event có được phép xuất hiện trong view của player hay không. */
export function isGameEventVisibleTo(event: GameEvent, playerId: PlayerId): boolean {
  return (
    event.visibility.type === 'PUBLIC' || event.visibility.playerId === playerId
  );
}
