import { describe, expect, it } from 'vitest';
import { AbilityId, CardRole, PlayerId } from '@twofold/shared-types';
import { createInitialCard, isCardAlive, transitionCard } from './cards';
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
      createInitialCard(PlayerId.PLAYER_A, 5, CardRole.SHOOTER),
      createInitialCard(PlayerId.PLAYER_A, 6, CardRole.PRIEST),
      createInitialCard(PlayerId.PLAYER_A, 7, CardRole.AVENGER),
    ]),
    [PlayerId.PLAYER_B]: createInitialPlayerState(PlayerId.PLAYER_B, [
      createInitialCard(PlayerId.PLAYER_B, 1, CardRole.VILLAGER),
      createInitialCard(PlayerId.PLAYER_B, 2, CardRole.GUARD),
      createInitialCard(PlayerId.PLAYER_B, 3, CardRole.SEER),
      createInitialCard(PlayerId.PLAYER_B, 4, CardRole.WEREWOLF),
    ]),
  });
}

function enterDay(state = createPipelineGame()): GameState {
  let next = dispatchPlayerAction(state, {
    type: 'SETUP_LOCK',
    playerId: PlayerId.PLAYER_A,
  });
  return dispatchPlayerAction(next, {
    type: 'SETUP_LOCK',
    playerId: PlayerId.PLAYER_B,
  });
}

function enterNight(state = createPipelineGame()): GameState {
  let next = enterDay(state);
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
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: { type: 'PASS' },
    });
    state = dispatchPlayerAction(state, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      action: { type: 'PASS' },
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
        type: 'DAY_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        action: { type: 'PASS' },
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

  it('validates Shooter activation, consumes bullet and kills a revealed target', () => {
    const initial = createPipelineGame();
    const boardB = initial.players[PlayerId.PLAYER_B].board.map((card, index) =>
      index < 2 ? transitionCard(card, { type: 'REVEAL' }) : card
    );
    let state = enterDay({
      ...initial,
      players: {
        ...initial.players,
        [PlayerId.PLAYER_B]: {
          ...initial.players[PlayerId.PLAYER_B],
          board: boardB,
        },
      },
    });

    state = dispatchPlayerAction(state, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: { type: 'SHOOT', sourceId: 'A5', targetId: 'B1' },
    });

    expect(state.phase).toEqual({ type: 'DAY_B' });
    expect(state.players[PlayerId.PLAYER_A].board[4].state.visibility).toBe('REVEALED');
    expect(state.players[PlayerId.PLAYER_B].board[0].state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(
      getRoleAbility(
        state.players[PlayerId.PLAYER_A].board[4].role,
        AbilityId.SHOOTER_SHOOT
      )?.remainingUses
    ).toBe(0);
  });

  it('revives an own hidden corpse without changing its visibility', () => {
    const initial = createPipelineGame();
    const deadHidden = transitionCard(initial.players[PlayerId.PLAYER_A].board[1], {
      type: 'ELIMINATE',
    });
    let state = enterDay({
      ...initial,
      players: {
        ...initial.players,
        [PlayerId.PLAYER_A]: {
          ...initial.players[PlayerId.PLAYER_A],
          board: initial.players[PlayerId.PLAYER_A].board.map((card) =>
            card.id === deadHidden.id ? deadHidden : card
          ),
        },
      },
    });

    state = dispatchPlayerAction(state, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: { type: 'REVIVE', sourceId: 'A4', targetId: 'A2' },
    });

    expect(state.players[PlayerId.PLAYER_A].board[1].state).toEqual({
      life: 'ALIVE',
      visibility: 'HIDDEN',
    });
    expect(
      getRoleAbility(
        state.players[PlayerId.PLAYER_A].board[3].role,
        AbilityId.WITCH_REVIVE
      )?.remainingUses
    ).toBe(0);
  });

  it('lets Priest kill a Werewolf and reveals the Day victim', () => {
    let state = enterDay();
    state = dispatchPlayerAction(state, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: { type: 'PURIFY', sourceId: 'A6', targetId: 'B4' },
    });

    expect(state.players[PlayerId.PLAYER_B].board[3].state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(state.players[PlayerId.PLAYER_A].board[5].state).toEqual({
      life: 'ALIVE',
      visibility: 'REVEALED',
    });
  });

  it('kills Priest instead when Purify targets a Village role', () => {
    let state = enterDay();
    state = dispatchPlayerAction(state, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: { type: 'PURIFY', sourceId: 'A6', targetId: 'B1' },
    });

    expect(state.players[PlayerId.PLAYER_A].board[5].state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(state.players[PlayerId.PLAYER_B].board[0].state).toEqual({
      life: 'ALIVE',
      visibility: 'HIDDEN',
    });
  });

  it('resolves an Avenger mark when its revealed source dies at Night', () => {
    let state = enterDay();
    state = dispatchPlayerAction(state, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: { type: 'MARK', sourceId: 'A7', targetId: 'B1' },
    });
    state = dispatchPlayerAction(state, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      action: { type: 'PASS' },
    });
    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'PASS' },
    });
    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: {
        type: 'USE_ABILITY',
        sourceId: 'B4',
        abilityId: AbilityId.WEREWOLF_ATTACK,
        targetId: 'A7',
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

    expect(state.players[PlayerId.PLAYER_A].board[6].state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(state.players[PlayerId.PLAYER_B].board[0].state).toEqual({
      life: 'DEAD',
      visibility: 'HIDDEN',
    });
    expect(
      state.events.some(
        (event) => event.type === 'CARD_ELIMINATED' && event.cause.type === 'REVENGE'
      )
    ).toBe(true);
  });
});
