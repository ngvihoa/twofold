import { describe, expect, it } from 'vitest';
import { AbilityId, CardRole, PlayerId, WinReason } from '@twofold/shared-types';
import { createInitialCard } from './cards';
import { FinalDuelResultReason, createInitialGameState } from './game-state';
import { createInitialPlayerState } from './players';
import { dispatchPlayerAction } from './rule-pipeline';

function createMatch(rolesA: readonly CardRole[], rolesB: readonly CardRole[]) {
  return createInitialGameState('full-match', 'full-match-seed', {
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
  });
}

function lockSetupAndPassDay(state: ReturnType<typeof createMatch>) {
  let next = dispatchPlayerAction(state, {
    type: 'SETUP_LOCK',
    playerId: PlayerId.PLAYER_A,
  });
  next = dispatchPlayerAction(next, {
    type: 'SETUP_LOCK',
    playerId: PlayerId.PLAYER_B,
  });
  next = dispatchPlayerAction(next, {
    type: 'DAY_SUBMIT',
    playerId: PlayerId.PLAYER_A,
    action: { type: 'PASS' },
  });
  return dispatchPlayerAction(next, {
    type: 'DAY_SUBMIT',
    playerId: PlayerId.PLAYER_B,
    action: { type: 'PASS' },
  });
}

describe('ruleset v0.2 full-match integration', () => {
  it('runs from Setup through simultaneous Night deaths to Final Duel draw', () => {
    let state = lockSetupAndPassDay(
      createMatch(
        [CardRole.WEREWOLF, CardRole.VILLAGER],
        [CardRole.WEREWOLF, CardRole.VILLAGER]
      )
    );
    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: {
        type: 'USE_ABILITY',
        sourceId: 'A1',
        abilityId: AbilityId.WEREWOLF_ATTACK,
        targetId: 'B2',
      },
    });
    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: {
        type: 'USE_ABILITY',
        sourceId: 'B1',
        abilityId: AbilityId.WEREWOLF_ATTACK,
        targetId: 'A2',
      },
    });
    state = dispatchPlayerAction(state, {
      type: 'DEFENSE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'PASS' },
    });
    state = dispatchPlayerAction(state, {
      type: 'DEFENSE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });

    expect(state.phase).toEqual({ type: 'FINAL_DUEL' });
    state = dispatchPlayerAction(state, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      guess: CardRole.WEREWOLF,
    });
    state = dispatchPlayerAction(state, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      guess: CardRole.WEREWOLF,
    });

    expect(state.phase).toEqual({ type: 'ENDED' });
    expect(state.result).toEqual({
      winner: null,
      reason: FinalDuelResultReason.DRAW,
    });
    expect(state.events.map((event) => event.type)).toContain('FINAL_DUEL_RESOLVED');
  });

  it('runs from Setup to elimination without entering Final Duel', () => {
    let state = lockSetupAndPassDay(
      createMatch(
        [CardRole.WEREWOLF, CardRole.VILLAGER],
        [CardRole.VILLAGER]
      )
    );
    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: {
        type: 'USE_ABILITY',
        sourceId: 'A1',
        abilityId: AbilityId.WEREWOLF_ATTACK,
        targetId: 'B1',
      },
    });
    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });
    state = dispatchPlayerAction(state, {
      type: 'DEFENSE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'PASS' },
    });
    state = dispatchPlayerAction(state, {
      type: 'DEFENSE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });

    expect(state.phase).toEqual({ type: 'ENDED' });
    expect(state.result).toEqual({
      winner: PlayerId.PLAYER_A,
      reason: WinReason.ELIMINATION,
    });
    expect(state.events.some((event) => event.type === 'FINAL_DUEL_RESOLVED')).toBe(
      false
    );
  });
});
