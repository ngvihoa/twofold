import {
  Card as LegacyCard,
  CardRole,
  CardStatus,
  PlayerId,
  TurnPhase,
  PlayerGameView,
  PublicCard,
  EventLogEntry,
  WinReason,
} from '@twofold/shared-types';
import { STANDARD_DECK } from './roles';
import {
  CardEffectKind,
  type GameCard,
  createInitialCard,
  hasCardEffect,
  isCardAlive,
  isCardRevealed,
} from './cards';
import {
  type PlayerState,
  createInitialPlayerState,
} from './players';
import {
  type GameState,
  createInitialGameState,
} from './game-state';
import { getActivePhasePlayer, type GamePhaseState } from './phase-machine';
import { serializePlayerView, type GamePlayerView } from './player-view';
import {
  dispatchPlayerAction,
  type PlayerGameAction,
} from './rule-pipeline';

/** GameState v0.2 kèm public log tạm phục vụ adapter contract v0.1. */
export interface MasterGameState extends GameState {
  /**
   * @deprecated Chỉ giữ để tương thích contract v0.1; `events` mới là history
   * authoritative. Field này sẽ bị xóa sau migration shared-types/web v0.2.
   */
  readonly logs: readonly EventLogEntry[];
}

/** Adapter tạm cho shared-types/web v0.1; authoritative card state vẫn ở game-core. */
function toLegacyCardStatus(card: GameCard): CardStatus {
  if (!isCardAlive(card)) return CardStatus.DEAD;
  if (hasCardEffect(card, CardEffectKind.PROTECTION)) return CardStatus.PROTECTED;
  return isCardRevealed(card) ? CardStatus.REVEALED : CardStatus.HIDDEN;
}

function toLegacyCard(card: GameCard): LegacyCard {
  return {
    id: card.id,
    index: card.position - 1,
    owner: card.owner,
    role: card.occupant.role.id,
    status: toLegacyCardStatus(card),
    skillUsedDay: false,
    skillUsedNight: false,
    skillUsedTotal: 0,
  };
}

/**
 * Chiếu result reason v0.2 về contract v0.1.
 *
 * Legacy `shared-types` chưa có Final Duel reason, nên adapter trả `null` thay
 * vì gán sai sang `ELIMINATION`. Authoritative player view vẫn giữ reason v0.2.
 */
function toLegacyWinReason(
  reason: NonNullable<GameState['result']>['reason'] | null
): WinReason | null {
  return reason !== null && Object.values(WinReason).includes(reason as WinReason)
    ? (reason as WinReason)
    : null;
}

/** Chiếu phase v0.2 về enum v0.1 cho web trong thời gian migration. */
function toLegacyTurnPhase(phase: GamePhaseState): TurnPhase {
  switch (phase.type) {
    case 'SETUP':
      return TurnPhase.SETUP;
    case 'DAY_A':
    case 'DAY_B':
    case 'COUNCIL_PLAN':
    case 'COUNCIL_RESOLUTION':
    case 'FINAL_DUEL':
      return TurnPhase.DAY;
    case 'NIGHT_PLAN':
    case 'DUSK_DEFENSE':
    case 'NIGHT_RESOLUTION':
      return TurnPhase.NIGHT;
    case 'DAWN':
      return TurnPhase.DAWN;
    case 'PURGE_PLAN':
    case 'PURGE_RESOLUTION':
      return TurnPhase.CALAMITY;
    case 'ENDED':
      return TurnPhase.ENDED;
  }
}

export class GameEngine {
  private state: MasterGameState;

  constructor(roomId: string, defaultRolesA?: CardRole[], defaultRolesB?: CardRole[]) {
    const rolesA = defaultRolesA || this.getDefaultDeck();
    const rolesB = defaultRolesB || this.getDefaultDeck();

    const players: Record<PlayerId, PlayerState> = {
      [PlayerId.PLAYER_A]: createInitialPlayerState(
        PlayerId.PLAYER_A,
        rolesA.map((role, index) =>
          createInitialCard(PlayerId.PLAYER_A, index + 1, role)
        )
      ),
      [PlayerId.PLAYER_B]: createInitialPlayerState(
        PlayerId.PLAYER_B,
        rolesB.map((role, index) =>
          createInitialCard(PlayerId.PLAYER_B, index + 1, role)
        )
      ),
    };
    this.state = {
      ...createInitialGameState(roomId, roomId, players),
      logs: [
        {
          id: `log_${Date.now()}_0`,
          round: 1,
          phase: TurnPhase.SETUP,
          timestamp: Date.now(),
          actor: null,
          message: 'Trận đấu bắt đầu! Hai người chơi đang khóa thứ tự Setup.',
          isPublic: true,
        },
      ],
    };
  }

  public getDefaultDeck(): CardRole[] {
    return [...STANDARD_DECK];
  }

  /**
   * Trả snapshot độc lập để caller không thể mutate authoritative state ngoài
   * `dispatch(PlayerGameAction)`.
   */
  public getState(): MasterGameState {
    return structuredClone(this.state);
  }

  /** Tạo player view v0.2 đã lọc theo quyền biết của viewer. */
  public getAuthoritativePlayerView(playerId: PlayerId): GamePlayerView {
    return serializePlayerView(this.state, playerId);
  }

  /**
   * Tạo góc nhìn riêng tư và bảo mật cho từng người chơi (Anti-cheat)
   */
  public getPlayerView(playerId: PlayerId, opponentConnected = true): PlayerGameView {
    const opponentId =
      playerId === PlayerId.PLAYER_A ? PlayerId.PLAYER_B : PlayerId.PLAYER_A;
    const myCards = this.state.players[playerId].board.map(toLegacyCard);
    const opponentCards = this.state.players[opponentId].board;

    const publicOpponentCards: PublicCard[] = opponentCards.map((c) => ({
      id: c.id,
      index: c.position - 1,
      owner: c.owner,
      status: toLegacyCardStatus(c),
      role: isCardRevealed(c) ? c.occupant.role.id : null,
    }));

    return {
      roomId: this.state.gameId,
      playerId,
      opponentConnected,
      currentPhase: toLegacyTurnPhase(this.state.phase),
      activeTurnPlayer: getActivePhasePlayer(this.state.phase),
      roundNumber: this.state.round,
      myCards,
      opponentCards: publicOpponentCards,
      logs: [...this.state.logs],
      winner: this.state.result?.winner ?? null,
      winReason: toLegacyWinReason(this.state.result?.reason ?? null),
    };
  }

  /** Gửi player action qua validation/resolution pipeline duy nhất của game. */
  public dispatch(action: PlayerGameAction): void {
    this.state = {
      ...dispatchPlayerAction(this.state, action),
      logs: this.state.logs,
    };
  }
}
