import { CardRole, PlayerId } from '@twofold/shared-types';
import { STANDARD_DECK } from './roles';
import { createInitialCard } from './cards';
import {
  type PlayerState,
  createInitialPlayerState,
} from './players';
import { type GameState, createInitialGameState } from './game-state';
import { serializePlayerView, type GamePlayerView } from './player-view';
import {
  dispatchPlayerAction,
  type PlayerGameAction,
} from './rule-pipeline';

export class GameEngine {
  private state: GameState;

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
    this.state = createInitialGameState(roomId, roomId, players);
  }

  public getDefaultDeck(): CardRole[] {
    return [...STANDARD_DECK];
  }

  /**
   * Trả snapshot độc lập để caller không thể mutate authoritative state ngoài
   * `dispatch(PlayerGameAction)`.
   */
  public getState(): GameState {
    return structuredClone(this.state);
  }

  /** Tạo player view v0.2 đã lọc theo quyền biết của viewer. */
  public getAuthoritativePlayerView(playerId: PlayerId): GamePlayerView {
    return serializePlayerView(this.state, playerId);
  }

  /** Gửi player action qua validation/resolution pipeline duy nhất của game. */
  public dispatch(action: PlayerGameAction): void {
    const next = dispatchPlayerAction(this.state, action);
    this.state = { ...next, version: this.state.version + 1 };
  }
}
