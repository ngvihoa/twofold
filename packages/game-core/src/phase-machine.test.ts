import { describe, expect, it } from 'vitest';
import { PlayerId } from '@twofold/shared-types';
import {
  InvalidPhaseTransitionError,
  createInitialPhaseMachineState,
  transitionPhase,
  type PhaseMachineState,
} from './phase-machine';

function completeRound(state: PhaseMachineState): PhaseMachineState {
  let next = transitionPhase(state, {
    type: 'DAY_ACTION_COMPLETED',
    playerId: PlayerId.PLAYER_A,
  });
  next = transitionPhase(next, {
    type: 'DAY_ACTION_COMPLETED',
    playerId: PlayerId.PLAYER_B,
  });
  if (next.phase.type === 'COUNCIL_PLAN') {
    next = transitionPhase(next, { type: 'COUNCIL_ORDERS_LOCKED' });
    next = transitionPhase(next, { type: 'COUNCIL_RESOLVED' });
  }
  next = transitionPhase(next, { type: 'NIGHT_ORDERS_LOCKED' });
  next = transitionPhase(next, { type: 'DEFENSE_ORDERS_LOCKED' });
  next = transitionPhase(next, { type: 'NIGHT_RESOLVED' });
  return transitionPhase(next, { type: 'DAWN_COMPLETED' });
}

describe('ruleset v0.2 phase machine', () => {
  it('starts at Setup in round one', () => {
    expect(createInitialPhaseMachineState()).toEqual({
      round: 1,
      phase: { type: 'SETUP' },
    });
  });

  it('skips Council in round one and opens it from round two', () => {
    let state = transitionPhase(createInitialPhaseMachineState(), {
      type: 'SETUP_COMPLETED',
    });
    state = completeRound(state);

    expect(state).toEqual({ round: 2, phase: { type: 'DAY_A' } });
    state = transitionPhase(state, {
      type: 'DAY_ACTION_COMPLETED',
      playerId: PlayerId.PLAYER_A,
    });
    state = transitionPhase(state, {
      type: 'DAY_ACTION_COMPLETED',
      playerId: PlayerId.PLAYER_B,
    });
    expect(state.phase).toEqual({ type: 'COUNCIL_PLAN' });
  });

  it('follows the deterministic pass spine and opens Purge in round six', () => {
    let state = transitionPhase(createInitialPhaseMachineState(), {
      type: 'SETUP_COMPLETED',
    });

    while (state.round < 6) state = completeRound(state);

    expect(state).toEqual({ round: 6, phase: { type: 'PURGE_PLAN' } });
    state = transitionPhase(state, { type: 'PURGE_ORDERS_LOCKED' });
    state = transitionPhase(state, { type: 'PURGE_RESOLVED' });
    expect(state).toEqual({ round: 6, phase: { type: 'DAY_A' } });
  });

  it('rejects an event or actor that is invalid for the current phase', () => {
    const dayA = transitionPhase(createInitialPhaseMachineState(), {
      type: 'SETUP_COMPLETED',
    });

    expect(() =>
      transitionPhase(dayA, {
        type: 'DAY_ACTION_COMPLETED',
        playerId: PlayerId.PLAYER_B,
      })
    ).toThrow(InvalidPhaseTransitionError);
    expect(() => transitionPhase(dayA, { type: 'NIGHT_ORDERS_LOCKED' })).toThrow(
      'Không thể xử lý NIGHT_ORDERS_LOCKED khi game đang ở phase DAY_A.'
    );
  });

  it('can enter Final Duel from an active phase and then end the game', () => {
    const dayA = transitionPhase(createInitialPhaseMachineState(), {
      type: 'SETUP_COMPLETED',
    });
    const finalDuel = transitionPhase(dayA, { type: 'FINAL_DUEL_REQUIRED' });
    const ended = transitionPhase(finalDuel, { type: 'GAME_ENDED' });

    expect(finalDuel).toEqual({ round: 1, phase: { type: 'FINAL_DUEL' } });
    expect(ended).toEqual({ round: 1, phase: { type: 'ENDED' } });
  });
});
