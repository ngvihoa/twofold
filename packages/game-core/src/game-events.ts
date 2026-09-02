import {
  AbilityId,
  CardRole,
  PlayerId,
  type PublicGameOutcomeV2,
} from '@twofold/shared-types';
import { CardEffectKind, type CardId, type GameCard } from './cards';
import type { GameState } from './game-state';
import type { GamePhaseState } from './phase-machine';
import type { PlayerSpecialAbilityId, PurgeOrder } from './players';
import { getRoleDefinition } from './roles';

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
  | { readonly type: 'REVENGE'; readonly sourceCardId: CardId }
  | { readonly type: 'HIDDEN_NIGHT' };

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
      readonly type: 'COUNCIL_ACCUSATION_RESOLVED';
      readonly playerId: PlayerId;
      readonly targetCardId: CardId;
      readonly voterIds: readonly CardId[];
      readonly guessedRole: CardRole | null;
      readonly votePower: number;
      readonly succeeded: boolean;
    }
  | { readonly type: 'COUNCIL_PASSED'; readonly playerId: PlayerId }
  | { readonly type: 'DEFENSE_SKIPPED'; readonly playerId: PlayerId }
  | {
      readonly type: 'SUBSTITUTE_SACRIFICED';
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
  | {
      readonly type: 'FINAL_DUEL_RESOLVED';
      readonly cardAId: CardId;
      readonly cardBId: CardId;
      readonly guessA: CardRole;
      readonly guessB: CardRole;
      readonly correctA: boolean;
      readonly correctB: boolean;
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

  const outcomes = projectPublicOutcomes(state, appended);
  return {
    ...state,
    events: [...state.events, ...appended],
    outcomes: [...state.outcomes, ...outcomes],
  };
}

/**
 * Project authoritative resolution events thành public allowlist P0.10.
 * Projection cố ý loại source/cause, hidden action kind và Purge target.
 */
function projectPublicOutcomes(
  state: GameState,
  events: readonly GameEvent[]
): readonly PublicGameOutcomeV2[] {
  const outcomes: PublicGameOutcomeV2[] = [];
  type WithoutEnvelope<T> = T extends unknown
    ? Omit<T, 'id' | 'sequence' | 'round' | 'phase'>
    : never;
  const append = (
    sourceSequence: number,
    payload: WithoutEnvelope<PublicGameOutcomeV2>
  ) => {
    outcomes.push({
      ...payload,
      id: `${state.gameId}:outcome:${sourceSequence}`,
      sequence: sourceSequence,
      round: state.round,
      phase: state.phase.type,
    } as PublicGameOutcomeV2);
  };

  for (const event of events) {
    if (event.visibility.type !== 'PUBLIC') continue;
    switch (event.type) {
      case 'CARD_REVEALED': {
        const card = findCard(state, event.cardId);
        append(event.sequence, { type: 'CARD_REVEALED', ...revealedCardPayload(card) });
        break;
      }
      case 'CARD_ELIMINATED': {
        const card = findCard(state, event.cardId);
        const revealed = card.occupant.state.visibility === 'REVEALED';
        append(event.sequence, {
          type: 'CARD_ELIMINATED',
          cardId: card.id,
          instanceId: card.occupant.id,
          owner: card.owner,
          role: revealed ? card.occupant.role.id : null,
          faction: revealed
            ? getRoleDefinition(card.occupant.role.id).faction
            : null,
        });
        break;
      }
      case 'EFFECT_BLOCKED': {
        if (event.effectKind !== CardEffectKind.PROTECTION) break;
        const card = findCard(state, event.targetCardId);
        append(event.sequence, {
          type: 'CARD_SAVED',
          cardId: card.id,
          instanceId: card.occupant.id,
          owner: card.owner,
        });
        break;
      }
      case 'CARD_REVIVED': {
        const card = findCard(state, event.cardId);
        append(event.sequence, { type: 'CARD_REVIVED', ...revealedCardPayload(card) });
        break;
      }
      case 'COUNCIL_ACCUSATION_RESOLVED':
        append(event.sequence, {
          type: 'COUNCIL_RESOLVED',
          playerId: event.playerId,
          targetCardId: event.targetCardId,
          guessedRole: event.guessedRole,
          votePower: event.votePower,
          succeeded: event.succeeded,
        });
        break;
      case 'COUNCIL_PASSED':
        append(event.sequence, { type: 'COUNCIL_PASSED', playerId: event.playerId });
        break;
    }
  }

  const purgeEvents = events.filter(
    (event): event is Extract<GameEvent, { type: 'PURGE_RESOLVED' }> =>
      event.type === 'PURGE_RESOLVED' && event.visibility.type === 'PUBLIC'
  );
  const purge = purgeEvents.at(-1);
  if (purge) {
    append(purge.sequence, {
      type: 'PURGE_RESOLVED',
      rule: purge.rule,
      status:
        purge.rule === 'SWAP' && purgeEvents.every((event) => event.targetCardId === null)
          ? 'FIZZLED'
          : 'RESOLVED',
    });
  }
  return outcomes;
}

function findCard(state: GameState, cardId: CardId): GameCard {
  for (const player of Object.values(state.players)) {
    const card = player.board.find((candidate) => candidate.id === cardId);
    if (card) return card;
  }
  throw new Error(`Không tìm thấy card ${cardId} khi project public outcome.`);
}

function revealedCardPayload(card: GameCard) {
  return {
    cardId: card.id,
    instanceId: card.occupant.id,
    owner: card.owner,
    role: card.occupant.role.id,
    faction: getRoleDefinition(card.occupant.role.id).faction,
  };
}

/** Kiểm tra event có được phép xuất hiện trong view của player hay không. */
export function isGameEventVisibleTo(event: GameEvent, playerId: PlayerId): boolean {
  return (
    event.visibility.type === 'PUBLIC' || event.visibility.playerId === playerId
  );
}
