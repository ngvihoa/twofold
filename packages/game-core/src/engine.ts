import {
  Card,
  CardRole,
  CardStatus,
  PlayerId,
  TurnPhase,
  PlayerGameView,
  PublicCard,
  EventLogEntry,
  GameAction,
  ActionType,
  WinReason,
} from '@twofold/shared-types';
import { STANDARD_DECK } from './roles';

export interface NightActionRecord {
  playerId: PlayerId;
  action: GameAction;
}

export interface MasterGameState {
  roomId: string;
  roundNumber: number;
  currentPhase: TurnPhase;
  activeTurnPlayer: PlayerId | null; // Cho pha Day (A -> B)
  cardsA: Card[];
  cardsB: Card[];
  nightActions: NightActionRecord[];
  logs: EventLogEntry[];
  winner: PlayerId | null;
  winReason: WinReason | null;
}

export class GameEngine {
  private state: MasterGameState;

  constructor(roomId: string, defaultRolesA?: CardRole[], defaultRolesB?: CardRole[]) {
    const rolesA = defaultRolesA || this.getDefaultDeck();
    const rolesB = defaultRolesB || this.getDefaultDeck();

    this.state = {
      roomId,
      roundNumber: 1,
      currentPhase: TurnPhase.DAY,
      activeTurnPlayer: PlayerId.PLAYER_A, // Host A đi trước theo v0.1
      cardsA: rolesA.map((role, idx) => ({
        id: `A_${idx}`,
        index: idx,
        owner: PlayerId.PLAYER_A,
        role,
        status: CardStatus.HIDDEN,
        skillUsedDay: false,
        skillUsedNight: false,
        skillUsedTotal: 0,
      })),
      cardsB: rolesB.map((role, idx) => ({
        id: `B_${idx}`,
        index: idx,
        owner: PlayerId.PLAYER_B,
        role,
        status: CardStatus.HIDDEN,
        skillUsedDay: false,
        skillUsedNight: false,
        skillUsedTotal: 0,
      })),
      nightActions: [],
      logs: [
        {
          id: `log_${Date.now()}_0`,
          round: 1,
          phase: TurnPhase.DAY,
          timestamp: Date.now(),
          actor: null,
          message: 'Trận đấu bắt đầu! Vòng 1 - Ban ngày: Lượt của Người chơi A.',
          isPublic: true,
        },
      ],
      winner: null,
      winReason: null,
    };
  }

  public getDefaultDeck(): CardRole[] {
    return [...STANDARD_DECK];
  }

  public getState(): MasterGameState {
    return this.state;
  }

  /**
   * Tạo góc nhìn riêng tư và bảo mật cho từng người chơi (Anti-cheat)
   */
  public getPlayerView(playerId: PlayerId, opponentConnected = true): PlayerGameView {
    const isPlayerA = playerId === PlayerId.PLAYER_A;
    const myCards = isPlayerA ? this.state.cardsA : this.state.cardsB;
    const opponentCards = isPlayerA ? this.state.cardsB : this.state.cardsA;

    const publicOpponentCards: PublicCard[] = opponentCards.map((c) => ({
      id: c.id,
      index: c.index,
      owner: c.owner,
      status: c.status,
      role: c.status === CardStatus.REVEALED ? c.role : null,
    }));

    return {
      roomId: this.state.roomId,
      playerId,
      opponentConnected,
      currentPhase: this.state.currentPhase,
      activeTurnPlayer: this.state.activeTurnPlayer,
      roundNumber: this.state.roundNumber,
      myCards,
      opponentCards: publicOpponentCards,
      logs: this.state.logs,
      winner: this.state.winner,
      winReason: this.state.winReason,
    };
  }

  /**
   * Xử lý Treo cổ (Ban ngày): Đoán vai trò của 1 lá đối thủ
   */
  public handleHangAction(actor: PlayerId, targetIndex: number, guessedRole: CardRole): boolean {
    if (this.state.currentPhase !== TurnPhase.DAY || this.state.activeTurnPlayer !== actor) {
      throw new Error('Không phải lượt Ban ngày của bạn!');
    }

    const opponentCards = actor === PlayerId.PLAYER_A ? this.state.cardsB : this.state.cardsA;
    const targetCard = opponentCards[targetIndex];

    if (!targetCard || targetCard.status === CardStatus.DEAD) {
      throw new Error('Mục tiêu không hợp lệ hoặc đã chết!');
    }

    const isCorrect = targetCard.role === guessedRole;

    if (isCorrect) {
      targetCard.status = CardStatus.DEAD;
      this.addLog(
        actor,
        `${actor === PlayerId.PLAYER_A ? 'Người chơi A' : 'Người chơi B'} đã Treo cổ chính xác lá số ${targetIndex + 1} (${guessedRole})! Lá bài bị loại.`,
        targetCard.id,
        targetCard.id
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
    if (this.state.winner) return;

    if (this.state.activeTurnPlayer === PlayerId.PLAYER_A) {
      this.state.activeTurnPlayer = PlayerId.PLAYER_B;
      this.addLog(null, 'Ban ngày: Lượt của Người chơi B.');
    } else {
      // Cả A và B đã xong Ban ngày -> Chuyển sang Ban đêm
      this.state.currentPhase = TurnPhase.NIGHT;
      this.state.activeTurnPlayer = null;
      this.state.nightActions = [];
      this.addLog(null, 'Màn đêm buông xuống! Cả hai người chơi chọn hành động bí mật.');
    }
  }

  /**
   * Kiểm tra điều kiện thắng / thua
   */
  public checkWinCondition(): PlayerId | null {
    const aliveA = this.state.cardsA.filter((c) => c.status !== CardStatus.DEAD).length;
    const aliveB = this.state.cardsB.filter((c) => c.status !== CardStatus.DEAD).length;

    if (aliveA === 0 && aliveB === 0) {
      // Cả 2 cùng hết bài -> Hòa hoặc xử lý theo rule
      this.state.currentPhase = TurnPhase.ENDED;
      this.state.winReason = WinReason.ELIMINATION;
      return null;
    }

    if (aliveA === 0) {
      this.state.winner = PlayerId.PLAYER_B;
      this.state.winReason = WinReason.ELIMINATION;
      this.state.currentPhase = TurnPhase.ENDED;
      this.addLog(null, 'Người chơi B đã chiến thắng vì đối thủ hết bài trên sân!');
      return PlayerId.PLAYER_B;
    }

    if (aliveB === 0) {
      this.state.winner = PlayerId.PLAYER_A;
      this.state.winReason = WinReason.ELIMINATION;
      this.state.currentPhase = TurnPhase.ENDED;
      this.addLog(null, 'Người chơi A đã chiến thắng vì đối thủ hết bài trên sân!');
      return PlayerId.PLAYER_A;
    }

    return null;
  }

  private addLog(
    actor: PlayerId | null,
    message: string,
    revealedCardId?: string,
    eliminatedCardId?: string
  ): void {
    this.state.logs.push({
      id: `log_${Date.now()}_${this.state.logs.length}`,
      round: this.state.roundNumber,
      phase: this.state.currentPhase,
      timestamp: Date.now(),
      actor,
      message,
      isPublic: true,
      revealedCardId,
      eliminatedCardId,
    });
  }
}
