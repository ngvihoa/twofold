import { PlayerId, WinReason } from '@twofold/shared-types';
import type { PlayerState } from './players';
import {
  type GamePhaseState,
  type PhaseMachineEvent,
  createInitialPhaseMachineState,
  transitionPhase,
} from './phase-machine';
import type { GameEvent } from './game-events';

/** Kết quả authoritative khi game kết thúc. */
export interface GameResult {
  readonly winner: PlayerId | null;
  readonly reason: WinReason;
}

/**
 * Authoritative state cấp cao nhất của một trận.
 *
 * Game state chỉ chứa domain data có thể serialize/replay. Connection, timer UI
 * và animation không thuộc state này.
 */
export interface GameState {
  readonly gameId: string;
  readonly seed: string;
  readonly round: number;
  readonly phase: GamePhaseState;
  readonly players: Record<PlayerId, PlayerState>;
  readonly result: GameResult | null;
  readonly events: readonly GameEvent[];
}

/** Event mà GameState chấp nhận; setup lock được xử lý trước phase transition. */
export type GameStateEvent =
  | { readonly type: 'SETUP_LOCKED'; readonly playerId: PlayerId }
  | Exclude<PhaseMachineEvent, { readonly type: 'SETUP_COMPLETED' | 'GAME_ENDED' }>
  | { readonly type: 'GAME_ENDED'; readonly result: GameResult };

/** Tạo GameState ban đầu ở Setup, Vòng 1 với hai player đã được khởi tạo. */
export function createInitialGameState(
  gameId: string,
  seed: string,
  players: Record<PlayerId, PlayerState>
): GameState {
  const initialPhase = createInitialPhaseMachineState();
  return {
    gameId,
    seed,
    round: initialPhase.round,
    phase: initialPhase.phase,
    players,
    result: null,
    events: [],
  };
}

/**
 * Áp dụng event lên GameState theo kiểu immutable.
 *
 * `SETUP_LOCKED` cập nhật player trước và chỉ rời Setup khi cả hai player đã
 * khóa. Các event khác được ủy quyền cho phase machine.
 */
export function transitionGameState<TState extends GameState>(
  state: TState,
  event: GameStateEvent
): TState {
  if (event.type === 'SETUP_LOCKED') {
    if (state.phase.type !== 'SETUP') {
      throw new Error(`Không thể khóa Setup khi game đang ở phase ${state.phase.type}.`);
    }

    const player = state.players[event.playerId];
    if (player.setup.status === 'LOCKED') {
      throw new Error(`${event.playerId} đã khóa Setup.`);
    }

    const players = {
      ...state.players,
      [event.playerId]: { ...player, setup: { status: 'LOCKED' as const } },
    };
    const nextState = { ...state, players };
    const setupCompleted = Object.values(players).every(
      (candidate) => candidate.setup.status === 'LOCKED'
    );

    return setupCompleted
      ? transitionWithPhase(nextState, { type: 'SETUP_COMPLETED' })
      : (nextState as TState);
  }

  if (event.type === 'GAME_ENDED') {
    const endedState = transitionWithPhase(state, { type: 'GAME_ENDED' });
    return { ...endedState, result: event.result };
  }

  return transitionWithPhase(state, event);
}

/** Áp dụng phase transition lên GameState mà vẫn bảo toàn các field mở rộng. */
function transitionWithPhase<TState extends GameState>(
  state: TState,
  event: PhaseMachineEvent
): TState {
  const next = transitionPhase({ round: state.round, phase: state.phase }, event);
  return { ...state, round: next.round, phase: next.phase };
}
