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
  type CardId,
  type GameCard,
  createInitialCard,
  hasCardEffect,
  isCardAlive,
  isCardRevealed,
  transitionCard,
} from './cards';
import {
  type PlayerState,
  createInitialPlayerState,
  replacePlayerCard,
} from './players';
import {
  type GameState,
  type GameStateEvent,
  createInitialGameState,
  transitionGameState,
} from './game-state';
import { getActivePhasePlayer, type GamePhaseState } from './phase-machine';
import { serializePlayerView, type GamePlayerView } from './player-view';

/** GameState v0.2 kèm public log tạm phục vụ adapter contract v0.1. */
export interface MasterGameState extends GameState {
  logs: EventLogEntry[];
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
    role: card.role.id,
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

  public getState(): MasterGameState {
    return this.state;
  }

  /** Gửi một event cấp game/phase vào authoritative state machine. */
  public send(event: GameStateEvent): void {
    this.state = transitionGameState(this.state, event);
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
      role: isCardRevealed(c) ? c.role.id : null,
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
      logs: this.state.logs,
      winner: this.state.result?.winner ?? null,
      winReason: toLegacyWinReason(this.state.result?.reason ?? null),
    };
  }

  /**
   * Xử lý Treo cổ (Ban ngày): Đoán vai trò của 1 lá đối thủ
   */
  public handleHangAction(actor: PlayerId, targetIndex: number, guessedRole: CardRole): boolean {
    if (getActivePhasePlayer(this.state.phase) !== actor) {
      throw new Error('Không phải lượt Ban ngày của bạn!');
    }

    const opponentId =
      actor === PlayerId.PLAYER_A ? PlayerId.PLAYER_B : PlayerId.PLAYER_A;
    const opponent = this.state.players[opponentId];
    const targetCard = opponent.board[targetIndex];

    if (!targetCard || !isCardAlive(targetCard)) {
      throw new Error('Mục tiêu không hợp lệ hoặc đã chết!');
    }

    const isCorrect = targetCard.role.id === guessedRole;

    if (isCorrect) {
      // Treo cổ đoán đúng có rule lộ riêng; ELIMINATE tự nó không được làm lộ card.
      const revealedCard = transitionCard(targetCard, { type: 'REVEAL' });
      const eliminatedCard = transitionCard(revealedCard, { type: 'ELIMINATE' });
      this.state.players[opponentId] = replacePlayerCard(opponent, eliminatedCard);
      this.addLog(
        actor,
        `${actor === PlayerId.PLAYER_A ? 'Người chơi A' : 'Người chơi B'} đã Treo cổ chính xác lá số ${targetIndex + 1} (${guessedRole})! Lá bài bị loại.`,
        eliminatedCard.id,
        eliminatedCard.id
      );
    } else {
      this.addLog(
        actor,
        `${actor === PlayerId.PLAYER_A ? 'Người chơi A' : 'Người chơi B'} đoán sai vai trò lá số ${targetIndex + 1}! Không lá nào bị loại.`
      );
    }

    this.checkWinCondition();
    this.advanceDayTurn();
    return isCorrect;
  }

  /**
   * Chuyển lượt ban ngày: A -> B -> Chuyển sang Ban đêm
   */
  private advanceDayTurn(): void {
    if (this.state.result) return;

    if (this.state.phase.type === 'DAY_A') {
      this.send({ type: 'DAY_ACTION_COMPLETED', playerId: PlayerId.PLAYER_A });
      this.addLog(null, 'Ban ngày: Lượt của Người chơi B.');
    } else {
      this.send({ type: 'DAY_ACTION_COMPLETED', playerId: PlayerId.PLAYER_B });
      this.addLog(
        null,
        this.state.phase.type === 'COUNCIL_PLAN'
          ? 'Ban ngày hoàn tất. Hai bên bí mật khóa lựa chọn Hội đồng.'
          : 'Màn đêm buông xuống! Cả hai người chơi chọn hành động bí mật.'
      );
    }
  }

  /**
   * Kiểm tra điều kiện thắng / thua
   */
  public checkWinCondition(): PlayerId | null {
    const aliveA = this.state.players[PlayerId.PLAYER_A].board.filter(isCardAlive).length;
    const aliveB = this.state.players[PlayerId.PLAYER_B].board.filter(isCardAlive).length;

    if (aliveA === 0 && aliveB === 0) {
      // Cả 2 cùng hết bài -> Hòa hoặc xử lý theo rule
      this.send({
        type: 'GAME_ENDED',
        result: { winner: null, reason: WinReason.ELIMINATION },
      });
      return null;
    }

    if (aliveA === 0) {
      this.send({
        type: 'GAME_ENDED',
        result: { winner: PlayerId.PLAYER_B, reason: WinReason.ELIMINATION },
      });
      this.addLog(null, 'Người chơi B đã chiến thắng vì đối thủ hết bài trên sân!');
      return PlayerId.PLAYER_B;
    }

    if (aliveB === 0) {
      this.send({
        type: 'GAME_ENDED',
        result: { winner: PlayerId.PLAYER_A, reason: WinReason.ELIMINATION },
      });
      this.addLog(null, 'Người chơi A đã chiến thắng vì đối thủ hết bài trên sân!');
      return PlayerId.PLAYER_A;
    }

    return null;
  }

  private addLog(
    actor: PlayerId | null,
    message: string,
    revealedCardId?: CardId,
    eliminatedCardId?: CardId
  ): void {
    this.state.logs.push({
      id: `log_${Date.now()}_${this.state.logs.length}`,
      round: this.state.round,
      phase: toLegacyTurnPhase(this.state.phase),
      timestamp: Date.now(),
      actor,
      message,
      isPublic: true,
      revealedCardId,
      eliminatedCardId,
    });
  }
}
