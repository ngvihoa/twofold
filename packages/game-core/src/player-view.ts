import { CardRole, PlayerId } from '@twofold/shared-types';
import type {
  CardEffectExpiry,
  CardEffectKind,
  CardId,
  CardInstanceId,
  CardPosition,
  CardRuntimeState,
  GameCard,
} from './cards';
import type { GameResult, GameState } from './game-state';
import {
  isGameEventVisibleTo,
  type GameEvent,
} from './game-events';
import { getActivePhasePlayer, type GamePhaseState } from './phase-machine';
import type {
  PlayerSetupState,
  PlayerSpecialAbilityState,
  PlayerState,
  PlayerSubmissionState,
  PrivateIntelEntry,
} from './players';
import type { AbilityState, RoleState } from './roles';

/**
 * Phần effect được phép gửi ra player view.
 *
 * `id` và `source` bị loại vì effect ID có thể chứa source card, còn source của
 * Night action phải giữ kín cho tới event reveal tương ứng.
 */
export interface VisibleCardEffect {
  readonly kind: CardEffectKind;
  readonly appliedRound: number;
  readonly expires: CardEffectExpiry;
}

/** Card thuộc viewer: luôn bao gồm role và runtime ability state của chính họ. */
export interface PrivateCardView {
  readonly id: CardId;
  readonly instanceId: CardInstanceId;
  readonly position: CardPosition;
  readonly owner: PlayerId;
  readonly state: CardRuntimeState;
  readonly role: RoleState;
  readonly effects: readonly VisibleCardEffect[];
}

/**
 * Card của đối thủ: role chỉ xuất hiện khi visibility là `REVEALED`, kể cả khi
 * card đã chết.
 */
export interface PublicCardView {
  readonly id: CardId;
  readonly instanceId: CardInstanceId;
  readonly position: CardPosition;
  readonly owner: PlayerId;
  readonly state: CardRuntimeState;
  readonly role: CardRole | null;
  readonly effects: readonly VisibleCardEffect[];
}

/** Chỉ công khai việc đối thủ đã khóa slot, không công khai order payload. */
export interface PlayerSubmissionLocks {
  readonly councilAccusation: boolean;
  readonly councilReaction: boolean;
  readonly night: boolean;
  readonly defense: boolean;
  readonly purge: boolean;
  readonly finalGuess: boolean;
}

/** Toàn bộ dữ liệu riêng mà viewer được phép biết về chính mình. */
export interface PrivatePlayerView {
  readonly id: PlayerId;
  readonly board: readonly PrivateCardView[];
  readonly setup: PlayerSetupState;
  readonly submissions: PlayerSubmissionState;
  readonly specialAbilities: readonly PlayerSpecialAbilityState[];
  readonly privateIntel: readonly PrivateIntelEntry[];
}

/** Dữ liệu tối thiểu được phép biết về player đối thủ. */
export interface OpponentPlayerView {
  readonly id: PlayerId;
  readonly board: readonly PublicCardView[];
  readonly setupLocked: boolean;
  readonly submissionLocks: PlayerSubmissionLocks;
}

/** Snapshot authoritative đã được lọc theo quyền biết của một player. */
export interface GamePlayerView {
  readonly gameId: string;
  readonly viewerId: PlayerId;
  readonly round: number;
  readonly phase: GamePhaseState;
  readonly activePlayer: PlayerId | null;
  readonly self: PrivatePlayerView;
  readonly opponent: OpponentPlayerView;
  readonly result: GameResult | null;
  readonly events: readonly GameEvent[];
}

/**
 * Serialize master GameState thành snapshot riêng cho `viewerId`.
 *
 * Hàm không trả master state reference và không đưa opponent submission,
 * private intel, hidden role hoặc effect source vào kết quả.
 */
export function serializePlayerView(
  state: GameState,
  viewerId: PlayerId
): GamePlayerView {
  const opponentId =
    viewerId === PlayerId.PLAYER_A ? PlayerId.PLAYER_B : PlayerId.PLAYER_A;
  const self = state.players[viewerId];
  const opponent = state.players[opponentId];

  return {
    gameId: state.gameId,
    viewerId,
    round: state.round,
    phase: { ...state.phase },
    activePlayer: getActivePhasePlayer(state.phase),
    self: serializePrivatePlayer(self),
    opponent: serializeOpponentPlayer(opponent),
    result: state.result ? { ...state.result } : null,
    events: state.events
      .filter((event) => isGameEventVisibleTo(event, viewerId))
      .map(cloneGameEvent),
  };
}

function cloneGameEvent(event: GameEvent): GameEvent {
  if (event.type === 'CARD_ELIMINATED') {
    return {
      ...event,
      visibility: { ...event.visibility },
      cause: { ...event.cause },
    };
  }
  if (event.type === 'COUNCIL_ACCUSATION_RESOLVED') {
    return {
      ...event,
      visibility: { ...event.visibility },
      voterIds: [...event.voterIds],
    };
  }
  return {
    ...event,
    visibility: { ...event.visibility },
  };
}

function serializePrivatePlayer(player: PlayerState): PrivatePlayerView {
  return {
    id: player.id,
    board: player.board.map(serializePrivateCard),
    setup: { ...player.setup },
    submissions: cloneSubmissions(player.submissions),
    specialAbilities: player.specialAbilities.map((ability) => ({ ...ability })),
    privateIntel: player.privateIntel.map((intel) => ({ ...intel })),
  };
}

function serializeOpponentPlayer(player: PlayerState): OpponentPlayerView {
  return {
    id: player.id,
    board: player.board.map(serializePublicCard),
    setupLocked: player.setup.status === 'LOCKED',
    submissionLocks: {
      councilAccusation: player.submissions.council.accusation !== null,
      councilReaction: player.submissions.council.reaction !== null,
      night: player.submissions.night !== null,
      defense: player.submissions.defense !== null,
      purge: player.submissions.purge !== null,
      finalGuess: player.submissions.finalGuess !== null,
    },
  };
}

function serializePrivateCard(card: GameCard): PrivateCardView {
  return {
    id: card.id,
    instanceId: card.occupant.id,
    position: card.position,
    owner: card.owner,
    state: { ...card.occupant.state },
    role: cloneRoleState(card.occupant.role),
    effects: card.occupant.effects.map(serializeVisibleEffect),
  };
}

function serializePublicCard(card: GameCard): PublicCardView {
  return {
    id: card.id,
    instanceId: card.occupant.id,
    position: card.position,
    owner: card.owner,
    state: { ...card.occupant.state },
    role:
      card.occupant.state.visibility === 'REVEALED'
        ? card.occupant.role.id
        : null,
    effects: card.occupant.effects.map(serializeVisibleEffect),
  };
}

function serializeVisibleEffect(
  cardEffect: GameCard['occupant']['effects'][number]
): VisibleCardEffect {
  return {
    kind: cardEffect.kind,
    appliedRound: cardEffect.appliedRound,
    expires: { ...cardEffect.expires },
  };
}

function cloneRoleState(role: RoleState): RoleState {
  return {
    id: role.id,
    abilities: role.abilities.map(cloneAbilityState),
  };
}

function cloneAbilityState(ability: AbilityState): AbilityState {
  if ('lastTarget' in ability) {
    return {
      ...ability,
      lastTarget: ability.lastTarget ? { ...ability.lastTarget } : null,
    };
  }
  return { ...ability };
}

function cloneSubmissions(submissions: PlayerSubmissionState): PlayerSubmissionState {
  return {
    council: {
      accusation:
        submissions.council.accusation?.type === 'ACCUSE'
          ? {
              ...submissions.council.accusation,
              voterIds: [...submissions.council.accusation.voterIds],
            }
          : submissions.council.accusation
            ? { ...submissions.council.accusation }
            : null,
      reaction: submissions.council.reaction
        ? { ...submissions.council.reaction }
        : null,
    },
    night: submissions.night ? { ...submissions.night } : null,
    defense: submissions.defense ? { ...submissions.defense } : null,
    purge: submissions.purge ? { ...submissions.purge } : null,
    finalGuess: submissions.finalGuess,
  };
}
