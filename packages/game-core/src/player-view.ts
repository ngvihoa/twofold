import {
  CardRole,
  PlayerId,
  type PrivateGameEventV2,
  type PublicGameOutcomeV2,
} from '@twofold/shared-types';
import {
  CardEffectKind,
  type CardEffectExpiry,
  type CardId,
  type CardInstanceId,
  type CardPosition,
  type CardRuntimeState,
  type GameCard,
} from './cards';
import type { GameResult, GameState } from './game-state';
import type { GameEvent } from './game-events';
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
  readonly version: number;
  readonly viewerId: PlayerId;
  readonly round: number;
  readonly phase: GamePhaseState;
  readonly activePlayer: PlayerId | null;
  readonly self: PrivatePlayerView;
  readonly opponent: OpponentPlayerView;
  readonly result: GameResult | null;
  readonly outcomes: readonly PublicGameOutcomeV2[];
  readonly privateEvents: readonly PrivateGameEventV2[];
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
    version: state.version,
    viewerId,
    round: state.round,
    phase: { ...state.phase },
    activePlayer: getActivePhasePlayer(state.phase),
    self: serializePrivatePlayer(self),
    opponent: serializeOpponentPlayer(opponent),
    result: state.result ? { ...state.result } : null,
    outcomes: structuredClone(state.outcomes),
    privateEvents: state.events.flatMap((event) =>
      projectPrivateEvent(event, viewerId)
    ),
  };
}

function projectPrivateEvent(
  event: GameEvent,
  viewerId: PlayerId
): readonly PrivateGameEventV2[] {
  if (event.visibility.type !== 'PRIVATE' || event.visibility.playerId !== viewerId) {
    return [];
  }
  const envelope = {
    id: event.id,
    sequence: event.sequence,
    round: event.round,
    phase: event.phase,
  };
  if (event.type === 'ABILITY_RESOLVED') {
    return [{
      ...envelope,
      type: event.type,
      abilityId: event.abilityId,
      sourceCardId: event.sourceCardId,
      targetCardId: event.targetCardId,
    }];
  }
  if (event.type === 'PRIVATE_INSPECTION_RESULT') {
    return [{
      ...envelope,
      type: event.type,
      intelId: event.intelId,
      targetCardId: event.targetCardId,
      discoveredRole: event.discoveredRole,
    }];
  }
  return [];
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
    effects: card.occupant.effects
      .filter((effect) => effect.kind !== CardEffectKind.PROTECTION)
      .map(serializeVisibleEffect),
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
      pendingTargetId: submissions.council.pendingTargetId,
    },
    night: submissions.night ? { ...submissions.night } : null,
    defense: submissions.defense ? { ...submissions.defense } : null,
    purge: submissions.purge ? { ...submissions.purge } : null,
    finalGuess: submissions.finalGuess,
  };
}
