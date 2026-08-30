import { PlayerId } from '@twofold/shared-types';

/**
 * Một state hợp lệ của phase machine v0.2.
 *
 * Mỗi phase là một nhánh riêng để transition được kiểm tra bằng discriminated
 * union thay vì phối hợp nhiều boolean như `isNight`, `isResolving`.
 */
export type GamePhaseState =
  | { readonly type: 'SETUP' }
  | { readonly type: 'DAY_A' }
  | { readonly type: 'DAY_B' }
  | { readonly type: 'COUNCIL_PLAN' }
  | { readonly type: 'COUNCIL_RESOLUTION' }
  | { readonly type: 'NIGHT_PLAN' }
  | { readonly type: 'DUSK_DEFENSE' }
  | { readonly type: 'NIGHT_RESOLUTION' }
  | { readonly type: 'DAWN' }
  | { readonly type: 'PURGE_PLAN' }
  | { readonly type: 'PURGE_RESOLUTION' }
  | { readonly type: 'FINAL_DUEL' }
  | { readonly type: 'ENDED' };

/** Round và phase là context tối thiểu cần thiết để phase machine chuyển state. */
export interface PhaseMachineState {
  readonly round: number;
  readonly phase: GamePhaseState;
}

/**
 * Event cấp phase sau khi action/submission tương ứng đã được validate hoặc
 * resolve. Payload gameplay không nằm ở đây và được xử lý bởi Rule Flow.
 */
export type PhaseMachineEvent =
  | { readonly type: 'SETUP_COMPLETED' }
  | { readonly type: 'DAY_ACTION_COMPLETED'; readonly playerId: PlayerId }
  | { readonly type: 'COUNCIL_ORDERS_LOCKED' }
  | { readonly type: 'COUNCIL_RESOLVED' }
  | { readonly type: 'NIGHT_ORDERS_LOCKED' }
  | { readonly type: 'DEFENSE_ORDERS_LOCKED' }
  | { readonly type: 'NIGHT_RESOLVED' }
  | { readonly type: 'DAWN_COMPLETED' }
  | { readonly type: 'PURGE_ORDERS_LOCKED' }
  | { readonly type: 'PURGE_RESOLVED' }
  | { readonly type: 'FINAL_DUEL_REQUIRED' }
  | { readonly type: 'GAME_ENDED' };

/** Lỗi cho biết event không được phép chạy từ phase hiện tại. */
export class InvalidPhaseTransitionError extends Error {
  constructor(phase: GamePhaseState['type'], event: PhaseMachineEvent['type']) {
    super(`Không thể xử lý ${event} khi game đang ở phase ${phase}.`);
    this.name = 'InvalidPhaseTransitionError';
  }
}

/** Tạo context ban đầu của phase machine tại Setup, Vòng 1. */
export function createInitialPhaseMachineState(): PhaseMachineState {
  return { round: 1, phase: { type: 'SETUP' } };
}

/**
 * Chuyển phase theo kiểu immutable.
 *
 * Council mở sau Day B từ Vòng 2. Dawn tăng round trước khi quyết định mở
 * Purge; từ Vòng 6, Purge luôn diễn ra trước Day A.
 *
 * @throws {InvalidPhaseTransitionError} Khi event không hợp lệ ở phase hiện tại.
 */
export function transitionPhase(
  state: PhaseMachineState,
  event: PhaseMachineEvent
): PhaseMachineState {
  if (event.type === 'GAME_ENDED') {
    if (state.phase.type === 'ENDED') {
      throw new InvalidPhaseTransitionError(state.phase.type, event.type);
    }
    return { ...state, phase: { type: 'ENDED' } };
  }

  if (event.type === 'FINAL_DUEL_REQUIRED') {
    if (state.phase.type === 'ENDED' || state.phase.type === 'FINAL_DUEL') {
      throw new InvalidPhaseTransitionError(state.phase.type, event.type);
    }
    return { ...state, phase: { type: 'FINAL_DUEL' } };
  }

  switch (state.phase.type) {
    case 'SETUP':
      if (event.type === 'SETUP_COMPLETED') {
        return { ...state, phase: { type: 'DAY_A' } };
      }
      break;

    case 'DAY_A':
      if (
        event.type === 'DAY_ACTION_COMPLETED' &&
        event.playerId === PlayerId.PLAYER_A
      ) {
        return { ...state, phase: { type: 'DAY_B' } };
      }
      break;

    case 'DAY_B':
      if (
        event.type === 'DAY_ACTION_COMPLETED' &&
        event.playerId === PlayerId.PLAYER_B
      ) {
        return {
          ...state,
          phase: { type: state.round >= 2 ? 'COUNCIL_PLAN' : 'NIGHT_PLAN' },
        };
      }
      break;

    case 'COUNCIL_PLAN':
      if (event.type === 'COUNCIL_ORDERS_LOCKED') {
        return { ...state, phase: { type: 'COUNCIL_RESOLUTION' } };
      }
      break;

    case 'COUNCIL_RESOLUTION':
      if (event.type === 'COUNCIL_RESOLVED') {
        return { ...state, phase: { type: 'NIGHT_PLAN' } };
      }
      break;

    case 'NIGHT_PLAN':
      if (event.type === 'NIGHT_ORDERS_LOCKED') {
        return { ...state, phase: { type: 'DUSK_DEFENSE' } };
      }
      break;

    case 'DUSK_DEFENSE':
      if (event.type === 'DEFENSE_ORDERS_LOCKED') {
        return { ...state, phase: { type: 'NIGHT_RESOLUTION' } };
      }
      break;

    case 'NIGHT_RESOLUTION':
      if (event.type === 'NIGHT_RESOLVED') {
        return { ...state, phase: { type: 'DAWN' } };
      }
      break;

    case 'DAWN':
      if (event.type === 'DAWN_COMPLETED') {
        const nextRound = state.round + 1;
        return {
          round: nextRound,
          phase: { type: nextRound >= 6 ? 'PURGE_PLAN' : 'DAY_A' },
        };
      }
      break;

    case 'PURGE_PLAN':
      if (event.type === 'PURGE_ORDERS_LOCKED') {
        return { ...state, phase: { type: 'PURGE_RESOLUTION' } };
      }
      break;

    case 'PURGE_RESOLUTION':
      if (event.type === 'PURGE_RESOLVED') {
        return { ...state, phase: { type: 'DAY_A' } };
      }
      break;

    case 'FINAL_DUEL':
    case 'ENDED':
      break;
  }

  throw new InvalidPhaseTransitionError(state.phase.type, event.type);
}

/** Trả về player đang có Day turn; các phase đồng thời trả về `null`. */
export function getActivePhasePlayer(phase: GamePhaseState): PlayerId | null {
  if (phase.type === 'DAY_A') return PlayerId.PLAYER_A;
  if (phase.type === 'DAY_B') return PlayerId.PLAYER_B;
  return null;
}
