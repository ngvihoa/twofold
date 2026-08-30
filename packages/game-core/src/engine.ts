import {
  Card as LegacyCard,
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

export interface NightActionRecord {
  playerId: PlayerId;
  action: GameAction;
}

export interface MasterGameState {
  roomId: string;
  roundNumber: number;
  currentPhase: TurnPhase;
  activeTurnPlayer: PlayerId | null; // Cho pha Day (A -> B)
  players: Record<PlayerId, PlayerState>;
  nightActions: NightActionRecord[];
  logs: EventLogEntry[];
  winner: PlayerId | null;
  winReason: WinReason | null;
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
      players: {
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
      },
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

    const opponentId =
      actor === PlayerId.PLAYER_A ? PlayerId.PLAYER_B : PlayerId.PLAYER_A;
    const opponent = this.state.players[opponentId];
    const targetCard = opponent.board[targetIndex];

    if (!targetCard || !isCardAlive(targetCard)) {
      throw new Error('Mục tiêu không hợp lệ hoặc đã chết!');
    }

    const isCorrect = targetCard.role.id === guessedRole;

    if (isCorrect) {
      const eliminatedCard = transitionCard(targetCard, { type: 'ELIMINATE' });
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
    const aliveA = this.state.players[PlayerId.PLAYER_A].board.filter(isCardAlive).length;
    const aliveB = this.state.players[PlayerId.PLAYER_B].board.filter(isCardAlive).length;

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
    revealedCardId?: CardId,
    eliminatedCardId?: CardId
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
