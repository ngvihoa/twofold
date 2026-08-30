import { describe, expect, it } from 'vitest';
import { AbilityId, CardRole, PlayerId } from '@twofold/shared-types';
import { createInitialCard, isCardAlive } from './cards';
import { createInitialGameState, type GameState } from './game-state';
import { createInitialPlayerState } from './players';
import { dispatchPlayerAction, RuleValidationError } from './rule-pipeline';
import { getRoleAbility } from './roles';

function createPipelineGame(): GameState {
  return createInitialGameState('pipeline-test', 'pipeline-seed', {
    [PlayerId.PLAYER_A]: createInitialPlayerState(PlayerId.PLAYER_A, [
      createInitialCard(PlayerId.PLAYER_A, 1, CardRole.WEREWOLF),
      createInitialCard(PlayerId.PLAYER_A, 2, CardRole.VILLAGER),
      createInitialCard(PlayerId.PLAYER_A, 3, CardRole.GUARD),
      createInitialCard(PlayerId.PLAYER_A, 4, CardRole.WITCH),
    ]),
    [PlayerId.PLAYER_B]: createInitialPlayerState(PlayerId.PLAYER_B, [
      createInitialCard(PlayerId.PLAYER_B, 1, CardRole.VILLAGER),
      createInitialCard(PlayerId.PLAYER_B, 2, CardRole.GUARD),
      createInitialCard(PlayerId.PLAYER_B, 3, CardRole.SEER),
    ]),
  });
}

function enterNight(state = createPipelineGame()): GameState {
  let next = dispatchPlayerAction(state, {
    type: 'SETUP_LOCK',
    playerId: PlayerId.PLAYER_A,
  });
  next = dispatchPlayerAction(next, {
    type: 'SETUP_LOCK',
    playerId: PlayerId.PLAYER_B,
  });
  next = dispatchPlayerAction(next, {
    type: 'DAY_PASS',
    playerId: PlayerId.PLAYER_A,
  });
  return dispatchPlayerAction(next, {
    type: 'DAY_PASS',
    playerId: PlayerId.PLAYER_B,
  });
}

describe('ruleset v0.2 validation/resolution pipeline', () => {
  it('runs pass actions through Setup, Day, Night, Defense and Council', () => {
    let state = enterNight();
    expect(state.phase).toEqual({ type: 'NIGHT_PLAN' });

    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'PASS' },
    });
    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });
    expect(state.phase).toEqual({ type: 'DUSK_DEFENSE' });

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
    expect(state).toMatchObject({ round: 2, phase: { type: 'DAY_A' } });

    state = dispatchPlayerAction(state, {
      type: 'DAY_PASS',
      playerId: PlayerId.PLAYER_A,
    });
    state = dispatchPlayerAction(state, {
      type: 'DAY_PASS',
      playerId: PlayerId.PLAYER_B,
    });
    expect(state.phase).toEqual({ type: 'COUNCIL_PLAN' });

    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'PASS' },
    });
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });
    expect(state.phase).toEqual({ type: 'NIGHT_PLAN' });
  });

  it('rejects an action from the wrong phase or wrong source role', () => {
    const setup = createPipelineGame();
    expect(() =>
      dispatchPlayerAction(setup, {
        type: 'DAY_PASS',
        playerId: PlayerId.PLAYER_A,
      })
    ).toThrow(RuleValidationError);

    const night = enterNight();
    expect(() =>
      dispatchPlayerAction(night, {
        type: 'NIGHT_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: {
          type: 'USE_ABILITY',
          sourceId: 'A2',
          abilityId: AbilityId.WEREWOLF_ATTACK,
          targetId: 'B1',
        },
      })
    ).toThrow('A2 không sở hữu WEREWOLF_ATTACK.');
  });

  it('lets Guard block attack while Seer inspect bypasses protection', () => {
    let state = enterNight();
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
      order: {
        type: 'USE_ABILITY',
        sourceId: 'B3',
        abilityId: AbilityId.SEER_INSPECT,
        targetId: 'A1',
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
      order: { type: 'PROTECT', sourceId: 'B2', targetId: 'B1' },
    });

    expect(isCardAlive(state.players[PlayerId.PLAYER_B].board[0])).toBe(true);
    expect(state.players[PlayerId.PLAYER_B].privateIntel[0]).toMatchObject({
      targetCardId: 'A1',
      discoveredRole: CardRole.WEREWOLF,
    });
    expect(state.players[PlayerId.PLAYER_B].board[0].effects).toEqual([]);
    expect(
      getRoleAbility(
        state.players[PlayerId.PLAYER_B].board[1].role,
        AbilityId.GUARD_PROTECT
      )?.lastTarget
    ).toEqual({ cardId: 'B1', round: 1 });
    expect(
      getRoleAbility(
        state.players[PlayerId.PLAYER_B].board[2].role,
        AbilityId.SEER_INSPECT
      )?.remainingUses
    ).toBe(2);
    expect(state.events.map((event) => event.type)).toContain('EFFECT_BLOCKED');
    expect(state.events.map((event) => event.type)).toContain(
      'PRIVATE_INSPECTION_RESULT'
    );
    expect(state.events.at(-1)).toMatchObject({
      type: 'DAWN_PRESENTATION_COMPLETED',
      phase: 'DAWN',
    });
  });

  it('applies simultaneous Night death without revealing a hidden target', () => {
    let state = enterNight();
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

    expect(state.players[PlayerId.PLAYER_B].board[0].state).toEqual({
      life: 'DEAD',
      visibility: 'HIDDEN',
    });
    expect(state.events.find((event) => event.type === 'CARD_ELIMINATED')).toMatchObject(
      { cardId: 'B1' }
    );
  });

  it('consumes Witch poison even when Guard protection blocks it', () => {
    let state = enterNight();
    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: {
        type: 'USE_ABILITY',
        sourceId: 'A4',
        abilityId: AbilityId.WITCH_POISON,
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
      order: { type: 'PROTECT', sourceId: 'B2', targetId: 'B1' },
    });

    expect(isCardAlive(state.players[PlayerId.PLAYER_B].board[0])).toBe(true);
    expect(
      getRoleAbility(
        state.players[PlayerId.PLAYER_A].board[3].role,
        AbilityId.WITCH_POISON
      )?.remainingUses
    ).toBe(0);
  });
});
