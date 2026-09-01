import { describe, expect, it } from 'vitest';
import { AbilityId, CardRole, PlayerId } from '@twofold/shared-types';
import {
  CardEffectKind,
  CardEffectRule,
  createInitialCard,
  isCardAlive,
  transitionCard,
} from './cards';
import {
  FinalDuelResultReason,
  createInitialGameState,
  type GameState,
} from './game-state';
import { serializePlayerView } from './player-view';
import { PlayerSpecialAbilityId, createInitialPlayerState } from './players';
import { dispatchPlayerAction, RuleValidationError } from './rule-pipeline';
import { getRoleAbility, transitionRole } from './roles';

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
      createInitialCard(PlayerId.PLAYER_A, 8, CardRole.SUBSTITUTE),
    ]),
    [PlayerId.PLAYER_B]: createInitialPlayerState(PlayerId.PLAYER_B, [
      createInitialCard(PlayerId.PLAYER_B, 1, CardRole.VILLAGER),
      createInitialCard(PlayerId.PLAYER_B, 2, CardRole.GUARD),
      createInitialCard(PlayerId.PLAYER_B, 3, CardRole.SEER),
      createInitialCard(PlayerId.PLAYER_B, 4, CardRole.WEREWOLF),
      createInitialCard(PlayerId.PLAYER_B, 5, CardRole.SUBSTITUTE),
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

function enterRoundTwoDay(state = createPipelineGame()): GameState {
  let next = enterNight(state);
  next = dispatchPlayerAction(next, {
    type: 'NIGHT_SUBMIT',
    playerId: PlayerId.PLAYER_A,
    order: { type: 'PASS' },
  });
  next = dispatchPlayerAction(next, {
    type: 'NIGHT_SUBMIT',
    playerId: PlayerId.PLAYER_B,
    order: { type: 'PASS' },
  });
  next = dispatchPlayerAction(next, {
    type: 'DEFENSE_SUBMIT',
    playerId: PlayerId.PLAYER_A,
    order: { type: 'PASS' },
  });
  next = dispatchPlayerAction(next, {
    type: 'DEFENSE_SUBMIT',
    playerId: PlayerId.PLAYER_B,
    order: { type: 'PASS' },
  });
  return next;
}

function enterCouncil(state = createPipelineGame()): GameState {
  let next = enterRoundTwoDay(state);
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

function enterBloodMoonNight(round = 6): GameState {
  const state = enterNight();
  const revealedTarget = transitionCard(
    state.players[PlayerId.PLAYER_B].board[0],
    { type: 'REVEAL' }
  );
  return {
    ...state,
    round,
    players: {
      ...state.players,
      [PlayerId.PLAYER_B]: {
        ...state.players[PlayerId.PLAYER_B],
        board: state.players[PlayerId.PLAYER_B].board.map((card) =>
          card.id === revealedTarget.id ? revealedTarget : card
        ),
      },
    },
  };
}

function enterPurge(round: number): GameState {
  return {
    ...enterDay(),
    round,
    phase: { type: 'PURGE_PLAN' },
  };
}

function enterFinalDuel(): GameState {
  const state = enterDay();
  return {
    ...state,
    phase: { type: 'FINAL_DUEL' },
    players: {
      ...state.players,
      [PlayerId.PLAYER_A]: {
        ...state.players[PlayerId.PLAYER_A],
        board: state.players[PlayerId.PLAYER_A].board.map((card, index) =>
          index === 0 ? card : transitionCard(card, { type: 'ELIMINATE' })
        ),
      },
      [PlayerId.PLAYER_B]: {
        ...state.players[PlayerId.PLAYER_B],
        board: state.players[PlayerId.PLAYER_B].board.map((card, index) =>
          index === 0 ? card : transitionCard(card, { type: 'ELIMINATE' })
        ),
      },
    },
  };
}

function passPendingCouncilReactions(state: GameState): GameState {
  let next = state;
  for (const playerId of [PlayerId.PLAYER_A, PlayerId.PLAYER_B]) {
    const council = next.players[playerId].submissions.council;
    if (next.phase.type !== 'COUNCIL_REACTION') break;
    if (council.pendingTargetId === null || council.reaction !== null) continue;
    next = dispatchPlayerAction(next, {
      type: 'COUNCIL_REACTION_SUBMIT',
      playerId,
      order: { type: 'PASS' },
    });
  }
  return next;
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
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'PASS' },
    });
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
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

  it('waits for both independent Council slots and resolves accusations simultaneously', () => {
    let state = enterCouncil();
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: {
        type: 'ACCUSE',
        targetId: 'B4',
        guessedRole: CardRole.WEREWOLF,
        voterIds: ['A2', 'A3'],
      },
    });
    expect(state.phase).toEqual({ type: 'COUNCIL_PLAN' });
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: {
        type: 'ACCUSE',
        targetId: 'A1',
        guessedRole: CardRole.WEREWOLF,
        voterIds: ['B1', 'B2'],
      },
    });

    expect(state.phase).toEqual({ type: 'COUNCIL_REACTION' });
    expect(isCardAlive(state.players[PlayerId.PLAYER_A].board[0])).toBe(true);
    expect(isCardAlive(state.players[PlayerId.PLAYER_B].board[3])).toBe(true);

    state = passPendingCouncilReactions(state);

    expect(state.phase).toEqual({ type: 'NIGHT_PLAN' });
    expect(state.players[PlayerId.PLAYER_A].board[0].occupant.state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(state.players[PlayerId.PLAYER_B].board[3].occupant.state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(state.players[PlayerId.PLAYER_A].board[1].occupant.state.visibility).toBe('REVEALED');
    expect(state.players[PlayerId.PLAYER_B].board[0].occupant.state.visibility).toBe('REVEALED');
  });

  it('consumes, reveals and eliminates Substitute when it accepts the reaction', () => {
    let state = enterCouncil();
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: {
        type: 'ACCUSE',
        targetId: 'B4',
        guessedRole: CardRole.WEREWOLF,
        voterIds: ['A2', 'A3', 'A4'],
      },
    });
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_REACTION_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: {
        type: 'SUBSTITUTE_SACRIFICE',
        sourceId: 'B5',
      },
    });

    expect(isCardAlive(state.players[PlayerId.PLAYER_B].board[3])).toBe(true);
    expect(state.players[PlayerId.PLAYER_B].board[4].occupant.state.visibility).toBe('REVEALED');
    expect(
      getRoleAbility(
        state.players[PlayerId.PLAYER_B].board[4].occupant.role,
        AbilityId.SUBSTITUTE_SACRIFICE
      )?.remainingUses
    ).toBe(0);
    expect(isCardAlive(state.players[PlayerId.PLAYER_B].board[4])).toBe(false);
    expect(state.events.map((event) => event.type)).toContain('SUBSTITUTE_SACRIFICED');
  });

  it('emits public council accusation outcome with voter context', () => {
    let state = enterCouncil();
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: {
        type: 'ACCUSE',
        targetId: 'B4',
        guessedRole: CardRole.WEREWOLF,
        voterIds: ['A2', 'A3', 'A4'],
      },
    });
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });
    state = passPendingCouncilReactions(state);

    const resolved = state.events.find(
      (event) => event.type === 'COUNCIL_ACCUSATION_RESOLVED'
    );
    expect(resolved).toMatchObject({
      playerId: PlayerId.PLAYER_A,
      targetCardId: 'B4',
      succeeded: true,
      visibility: { type: 'PUBLIC' },
    });
    expect(resolved?.voterIds).toEqual(['A2', 'A3', 'A4']);

    const types = state.events.map((event) => event.type);
    expect(types.indexOf('COUNCIL_ACCUSATION_RESOLVED')).toBeLessThan(
      types.indexOf('CARD_ELIMINATED')
    );
    expect(
      state.events.find(
        (event) => event.type === 'CARD_ELIMINATED' && event.cardId === 'B4'
      )?.cause
    ).toEqual({ type: 'COUNCIL', playerId: PlayerId.PLAYER_A });
  });

  it('marks failed accusations with voters and keeps passed councils public', () => {
    let state = enterCouncil();
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: {
        type: 'ACCUSE',
        targetId: 'B1',
        guessedRole: CardRole.WEREWOLF,
        voterIds: ['A2', 'A3', 'A4'],
      },
    });
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });

    const resolved = state.events.find(
      (event) => event.type === 'COUNCIL_ACCUSATION_RESOLVED'
    );
    expect(resolved).toMatchObject({
      playerId: PlayerId.PLAYER_A,
      targetCardId: 'B1',
      succeeded: false,
    });
    expect(resolved?.voterIds).toEqual(['A2', 'A3', 'A4']);
    expect(
      state.events
        .filter((event) => event.type === 'COUNCIL_PASSED')
        .map((event) => event.playerId)
    ).toEqual([PlayerId.PLAYER_B]);
  });

  it('keeps skipped defense choices private to their owners', () => {
    const state = enterRoundTwoDay();
    const skipped = state.events.filter((event) => event.type === 'DEFENSE_SKIPPED');
    expect(skipped.map((event) => event.playerId)).toEqual([
      PlayerId.PLAYER_A,
      PlayerId.PLAYER_B,
    ]);
    expect(skipped.map((event) => event.visibility)).toEqual([
      { type: 'PRIVATE', playerId: PlayerId.PLAYER_A },
      { type: 'PRIVATE', playerId: PlayerId.PLAYER_B },
    ]);
  });

  it('keeps a normal Seer inspection source and target private', () => {
    let state = enterNight();
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
        abilityId: AbilityId.SEER_INSPECT,
        sourceId: 'B3',
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
      order: { type: 'PASS' },
    });

    const seerEvents = state.events.filter(
      (event) =>
        event.type === 'ABILITY_RESOLVED' &&
        event.abilityId === AbilityId.SEER_INSPECT
    );
    expect(seerEvents.some((event) => event.visibility.type === 'PUBLIC')).toBe(false);
    expect(
      seerEvents.find((event) => event.visibility.type === 'PRIVATE')
    ).toMatchObject({
      sourceCardId: 'B3',
      targetCardId: 'A1',
    });

    const opponentView = serializePlayerView(state, PlayerId.PLAYER_A);
    const opponentSeerEvents = opponentView.events.filter(
      (event) =>
        event.type === 'ABILITY_RESOLVED' &&
        event.abilityId === AbilityId.SEER_INSPECT
    );
    expect(opponentSeerEvents).toHaveLength(0);
  });

  it('reveals Seer when executing a previously identified Werewolf', () => {
    const initial = enterNight();
    let state: GameState = {
      ...initial,
      players: {
        ...initial.players,
        [PlayerId.PLAYER_B]: {
          ...initial.players[PlayerId.PLAYER_B],
          privateIntel: [
            {
              id: 'intel:B3:A1:round:0',
              sourceAbilityId: AbilityId.SEER_INSPECT,
              sourceInstanceId: 'B:3',
              targetInstanceId: 'A:1',
              observedAtSlotId: 'A1',
              discoveredRole: CardRole.WEREWOLF,
              discoveredRound: 1,
            },
          ],
        },
      },
    };
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
        sourceId: 'B3',
        abilityId: AbilityId.SEER_INSPECT,
        targetId: 'A1',
      },
    });
    state = dispatchPlayerAction(state, {
      type: 'DEFENSE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'PROTECT', sourceId: 'A3', targetId: 'A1' },
    });
    state = dispatchPlayerAction(state, {
      type: 'DEFENSE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });

    expect(state.players[PlayerId.PLAYER_B].board[2].occupant.state.visibility).toBe(
      'REVEALED'
    );
    expect(isCardAlive(state.players[PlayerId.PLAYER_A].board[0])).toBe(false);
    expect(
      state.events.some(
        (event) => event.type === 'CARD_REVEALED' && event.cardId === 'B3'
      )
    ).toBe(true);
  });

  it('keeps Substitute hidden and unspent when it declines', () => {
    let state = enterCouncil();
    for (const action of [
      {
        type: 'COUNCIL_ACCUSATION_SUBMIT' as const,
        playerId: PlayerId.PLAYER_A,
        order: {
          type: 'ACCUSE' as const,
          targetId: 'B4' as const,
          guessedRole: CardRole.WEREWOLF,
          voterIds: ['A2', 'A3', 'A4'] as const,
        },
      },
      {
        type: 'COUNCIL_ACCUSATION_SUBMIT' as const,
        playerId: PlayerId.PLAYER_B,
        order: { type: 'PASS' as const },
      },
      {
        type: 'COUNCIL_REACTION_SUBMIT' as const,
        playerId: PlayerId.PLAYER_B,
        order: { type: 'PASS' as const },
      },
    ]) {
      state = dispatchPlayerAction(state, action);
    }

    expect(state.players[PlayerId.PLAYER_B].board[4].occupant.state.visibility).toBe('HIDDEN');
    expect(
      getRoleAbility(
        state.players[PlayerId.PLAYER_B].board[4].occupant.role,
        AbilityId.SUBSTITUTE_SACRIFICE
      )?.remainingUses
    ).toBe(1);
    expect(state.events.map((event) => event.type)).not.toContain('SUBSTITUTE_SACRIFICED');
  });

  it('prevents Substitute from saving itself', () => {
    let state = enterCouncil();
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: {
        type: 'ACCUSE',
        targetId: 'B5',
        guessedRole: CardRole.SUBSTITUTE,
        voterIds: ['A2', 'A3'],
      },
    });
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });

    expect(() =>
      dispatchPlayerAction(state, {
        type: 'COUNCIL_REACTION_SUBMIT',
        playerId: PlayerId.PLAYER_B,
        order: { type: 'SUBSTITUTE_SACRIFICE', sourceId: 'B5' },
      })
    ).toThrow('không thể chết thay cho chính mình');
  });

  it('allows Substitute reaction through a Purge lock', () => {
    let state = enterCouncil();
    const source = transitionCard(state.players[PlayerId.PLAYER_B].board[4], {
      type: 'APPLY_EFFECT',
      effect: {
        id: 'purge-lock:B5:round:2',
        kind: CardEffectKind.PURGE_LOCK,
        source: { type: 'RULE', rule: CardEffectRule.PURGE_LOCK },
        appliedRound: 2,
        expires: { type: 'AFTER_PHASE', phase: 'NIGHT_RESOLUTION', round: 2 },
      },
    });
    state = {
      ...state,
      players: {
        ...state.players,
        [PlayerId.PLAYER_B]: {
          ...state.players[PlayerId.PLAYER_B],
          board: state.players[PlayerId.PLAYER_B].board.map((card) =>
            card.id === source.id ? source : card
          ),
        },
      },
    };
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: {
        type: 'ACCUSE',
        targetId: 'B4',
        guessedRole: CardRole.WEREWOLF,
        voterIds: ['A2', 'A3'],
      },
    });
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_REACTION_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'SUBSTITUTE_SACRIFICE', sourceId: 'B5' },
    });

    expect(isCardAlive(state.players[PlayerId.PLAYER_B].board[3])).toBe(true);
    expect(isCardAlive(state.players[PlayerId.PLAYER_B].board[4])).toBe(false);
  });

  it('locks failed Council voters for the next Council only', () => {
    let state = enterCouncil();
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: {
        type: 'ACCUSE',
        targetId: 'B4',
        guessedRole: CardRole.VILLAGER,
        voterIds: ['A2', 'A3', 'A4'],
      },
    });
    for (const action of [
      {
        type: 'COUNCIL_ACCUSATION_SUBMIT' as const,
        playerId: PlayerId.PLAYER_B,
        order: { type: 'PASS' as const },
      },
    ]) {
      state = dispatchPlayerAction(state, action);
    }

    expect(state.players[PlayerId.PLAYER_A].board[1].occupant.effects).toEqual([
      expect.objectContaining({ kind: 'COUNCIL_LOCK' }),
    ]);

    for (const action of [
      { type: 'NIGHT_SUBMIT' as const, playerId: PlayerId.PLAYER_A, order: { type: 'PASS' as const } },
      { type: 'NIGHT_SUBMIT' as const, playerId: PlayerId.PLAYER_B, order: { type: 'PASS' as const } },
      { type: 'DEFENSE_SUBMIT' as const, playerId: PlayerId.PLAYER_A, order: { type: 'PASS' as const } },
      { type: 'DEFENSE_SUBMIT' as const, playerId: PlayerId.PLAYER_B, order: { type: 'PASS' as const } },
      { type: 'DAY_SUBMIT' as const, playerId: PlayerId.PLAYER_A, action: { type: 'PASS' as const } },
      { type: 'DAY_SUBMIT' as const, playerId: PlayerId.PLAYER_B, action: { type: 'PASS' as const } },
    ]) {
      state = dispatchPlayerAction(state, action);
    }

    expect(() =>
      dispatchPlayerAction(state, {
        type: 'COUNCIL_ACCUSATION_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: {
          type: 'ACCUSE',
          targetId: 'B4',
          guessedRole: CardRole.WEREWOLF,
          voterIds: ['A2', 'A3', 'A4'],
        },
      })
    ).toThrow('A2 đang bị khóa Council.');

    for (const action of [
      { type: 'COUNCIL_ACCUSATION_SUBMIT' as const, playerId: PlayerId.PLAYER_A, order: { type: 'PASS' as const } },
      { type: 'COUNCIL_ACCUSATION_SUBMIT' as const, playerId: PlayerId.PLAYER_B, order: { type: 'PASS' as const } },
    ]) {
      state = dispatchPlayerAction(state, action);
    }
    expect(state.players[PlayerId.PLAYER_A].board[1].occupant.effects).toEqual([]);
  });

  it('resolves an Avenger chain from a Council elimination', () => {
    let state = enterRoundTwoDay();
    state = dispatchPlayerAction(state, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: { type: 'MARK', sourceId: 'A7', targetId: 'B4' },
    });
    state = dispatchPlayerAction(state, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      action: { type: 'PASS' },
    });
    for (const action of [
      {
        type: 'COUNCIL_ACCUSATION_SUBMIT' as const,
        playerId: PlayerId.PLAYER_A,
        order: { type: 'PASS' as const },
      },
      {
        type: 'COUNCIL_ACCUSATION_SUBMIT' as const,
        playerId: PlayerId.PLAYER_B,
        order: {
          type: 'ACCUSE' as const,
          targetId: 'A7' as const,
          guessedRole: null,
          voterIds: ['B1', 'B2', 'B3'] as const,
        },
      },
      {
        type: 'COUNCIL_REACTION_SUBMIT' as const,
        playerId: PlayerId.PLAYER_A,
        order: { type: 'PASS' as const },
      },
    ]) {
      state = dispatchPlayerAction(state, action);
    }
    state = passPendingCouncilReactions(state);

    expect(isCardAlive(state.players[PlayerId.PLAYER_A].board[6])).toBe(false);
    expect(isCardAlive(state.players[PlayerId.PLAYER_B].board[3])).toBe(false);
    expect(
      state.events.some(
        (event) => event.type === 'CARD_ELIMINATED' && event.cause.type === 'REVENGE'
      )
    ).toBe(true);
  });

  it('prevents a Day skill source from voting or using another skill that round', () => {
    const initial = createPipelineGame();
    const deadVillager = transitionCard(initial.players[PlayerId.PLAYER_A].board[1], {
      type: 'ELIMINATE',
    });
    let state = enterRoundTwoDay({
      ...initial,
      players: {
        ...initial.players,
        [PlayerId.PLAYER_A]: {
          ...initial.players[PlayerId.PLAYER_A],
          board: initial.players[PlayerId.PLAYER_A].board.map((card) =>
            card.id === deadVillager.id ? deadVillager : card
          ),
        },
      },
    });
    state = dispatchPlayerAction(state, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: { type: 'REVIVE', sourceId: 'A4', targetId: 'A2' },
    });
    state = dispatchPlayerAction(state, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      action: { type: 'PASS' },
    });

    expect(() =>
      dispatchPlayerAction(state, {
        type: 'COUNCIL_ACCUSATION_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: {
          type: 'ACCUSE',
          targetId: 'B4',
          guessedRole: CardRole.WEREWOLF,
          voterIds: ['A2', 'A4'],
        },
      })
    ).toThrow('đã dùng kỹ năng trong vòng này');

    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'PASS' },
    });
    state = dispatchPlayerAction(state, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });
    expect(() =>
      dispatchPlayerAction(state, {
        type: 'NIGHT_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: {
          type: 'USE_ABILITY',
          sourceId: 'A4',
          abilityId: AbilityId.WITCH_POISON,
          targetId: 'B1',
        },
      })
    ).toThrow('đã dùng kỹ năng trong vòng này');
  });

  it('lets Guard protection block an Avenger reaction', () => {
    let state = enterRoundTwoDay();
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
    for (const playerId of [PlayerId.PLAYER_A, PlayerId.PLAYER_B]) {
      state = dispatchPlayerAction(state, {
        type: 'COUNCIL_ACCUSATION_SUBMIT',
        playerId,
        order: { type: 'PASS' },
      });
    }
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
      order: { type: 'PROTECT', sourceId: 'B2', targetId: 'B1' },
    });

    expect(isCardAlive(state.players[PlayerId.PLAYER_A].board[6])).toBe(false);
    expect(isCardAlive(state.players[PlayerId.PLAYER_B].board[0])).toBe(true);
    expect(
      state.events.some(
        (event) => event.type === 'EFFECT_BLOCKED' && event.targetCardId === 'B1'
      )
    ).toBe(true);
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
      targetInstanceId: 'A:1',
      observedAtSlotId: 'A1',
      discoveredRole: CardRole.WEREWOLF,
    });
    expect(state.players[PlayerId.PLAYER_B].board[0].occupant.effects).toEqual([]);
    expect(
      getRoleAbility(
        state.players[PlayerId.PLAYER_B].board[1].occupant.role,
        AbilityId.GUARD_PROTECT
      )?.lastTarget
    ).toEqual({ instanceId: 'B:1', round: 1 });
    expect(
      getRoleAbility(
        state.players[PlayerId.PLAYER_B].board[2].occupant.role,
        AbilityId.SEER_INSPECT
      )
    ).toEqual({ abilityId: AbilityId.SEER_INSPECT });
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

    expect(state.players[PlayerId.PLAYER_B].board[0].occupant.state).toEqual({
      life: 'DEAD',
      visibility: 'HIDDEN',
    });
    expect(state.events.find((event) => event.type === 'CARD_ELIMINATED')).toMatchObject(
      { cardId: 'B1' }
    );
  });

  it('rejects Blood Moon before unlock, during cooldown, or against a hidden target', () => {
    const early = enterBloodMoonNight(1);
    expect(() =>
      dispatchPlayerAction(early, {
        type: 'NIGHT_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: { type: 'BLOOD_MOON', targetId: 'B1' },
      })
    ).toThrow('Blood Moon chỉ mở từ Vòng 6.');

    const cooldownBase = enterBloodMoonNight(7);
    const cooldown = {
      ...cooldownBase,
      players: {
        ...cooldownBase.players,
        [PlayerId.PLAYER_A]: {
          ...cooldownBase.players[PlayerId.PLAYER_A],
          specialAbilities: [
            {
              abilityId: PlayerSpecialAbilityId.BLOOD_MOON,
              unlockRound: 6,
              cooldownRounds: 2,
              readyRound: 8,
            },
          ],
        },
      },
    };
    expect(() =>
      dispatchPlayerAction(cooldown, {
        type: 'NIGHT_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: { type: 'BLOOD_MOON', targetId: 'B1' },
      })
    ).toThrow('Blood Moon hồi lại ở Vòng 8.');

    const hidden = { ...enterNight(), round: 6 };
    expect(() =>
      dispatchPlayerAction(hidden, {
        type: 'NIGHT_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: { type: 'BLOOD_MOON', targetId: 'B1' },
      })
    ).toThrow('Blood Moon chỉ đánh được role đã lộ.');
  });

  it('resolves Blood Moon without a source card and starts its cooldown', () => {
    let state = enterBloodMoonNight();
    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'BLOOD_MOON', targetId: 'B1' },
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

    expect(state.players[PlayerId.PLAYER_B].board[0].occupant.state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(state.players[PlayerId.PLAYER_A].specialAbilities[0].readyRound).toBe(8);
    expect(
      state.players[PlayerId.PLAYER_A].board.every(
        (card) => card.occupant.state.visibility === 'HIDDEN'
      )
    ).toBe(true);
    expect(
      state.events.find(
        (event) =>
          event.type === 'ABILITY_RESOLVED' &&
          event.abilityId === PlayerSpecialAbilityId.BLOOD_MOON
      )
    ).toMatchObject({ sourceCardId: null, targetCardId: 'B1' });
    expect(
      state.events.find(
        (event) =>
          event.type === 'CARD_ELIMINATED' && event.cardId === 'B1'
      )
    ).toMatchObject({
      cause: { type: 'HIDDEN_NIGHT' },
    });
    expect(state.events.some((event) => event.type === 'CARD_REVEALED')).toBe(false);
  });

  it('consumes Blood Moon cooldown when Guard protection blocks it', () => {
    let state = enterBloodMoonNight();
    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'BLOOD_MOON', targetId: 'B1' },
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
    expect(state.players[PlayerId.PLAYER_A].specialAbilities[0].readyRound).toBe(8);
    expect(
      state.events.some(
        (event) => event.type === 'EFFECT_BLOCKED' && event.targetCardId === 'B1'
      )
    ).toBe(true);
  });

  it('includes Blood Moon in simultaneous Night deaths', () => {
    let state = enterBloodMoonNight();
    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'BLOOD_MOON', targetId: 'B1' },
    });
    state = dispatchPlayerAction(state, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: {
        type: 'USE_ABILITY',
        sourceId: 'B4',
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

    expect(isCardAlive(state.players[PlayerId.PLAYER_A].board[1])).toBe(false);
    expect(isCardAlive(state.players[PlayerId.PLAYER_B].board[0])).toBe(false);
  });

  it('resolves round-six Purge CUT simultaneously and reveals both victims', () => {
    let state = enterPurge(6);
    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { rule: 'CUT', targetId: 'A2' },
    });
    expect(state.phase).toEqual({ type: 'PURGE_PLAN' });
    expect(isCardAlive(state.players[PlayerId.PLAYER_A].board[1])).toBe(true);

    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { rule: 'CUT', targetId: 'B1' },
    });

    expect(state.phase).toEqual({ type: 'DAY_A' });
    expect(state.players[PlayerId.PLAYER_A].board[1].occupant.state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(state.players[PlayerId.PLAYER_B].board[0].occupant.state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(
      state.events.filter((event) => event.type === 'PURGE_RESOLVED')
    ).toHaveLength(2);
  });

  it('swaps four unique card slots from one round-seven snapshot', () => {
    let state = enterPurge(7);
    const guardSlot = state.players[PlayerId.PLAYER_B].board[1];
    const guardWithMemory = {
      ...guardSlot,
      occupant: {
        ...guardSlot.occupant,
        role: transitionRole(guardSlot.occupant.role, {
          type: 'ABILITY_USED',
          abilityId: AbilityId.GUARD_PROTECT,
          targetInstanceId: 'B:1',
          round: 6,
        }),
      },
    };
    state = {
      ...state,
      players: {
        ...state.players,
        [PlayerId.PLAYER_B]: {
          ...state.players[PlayerId.PLAYER_B],
          board: state.players[PlayerId.PLAYER_B].board.map((card) =>
            card.id === guardSlot.id ? guardWithMemory : card
          ),
          privateIntel: [
            {
              id: 'intel-b3-a1-round-6',
              sourceAbilityId: AbilityId.SEER_INSPECT,
              sourceInstanceId: 'B:3',
              targetInstanceId: 'A:1',
              observedAtSlotId: 'A1',
              discoveredRole: CardRole.WEREWOLF,
              discoveredRound: 6,
            },
          ],
        },
      },
    };
    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { rule: 'SWAP', ownTargetId: 'A1', opponentTargetId: 'B1' },
    });
    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { rule: 'SWAP', ownTargetId: 'B2', opponentTargetId: 'A2' },
    });

    expect(state.phase).toEqual({ type: 'DAY_A' });
    expect(state.players[PlayerId.PLAYER_A].board[0]).toMatchObject({
      id: 'A1',
      owner: PlayerId.PLAYER_A,
      position: 1,
      occupant: { id: 'B:1', role: { id: CardRole.VILLAGER } },
    });
    expect(state.players[PlayerId.PLAYER_B].board[0]).toMatchObject({
      id: 'B1',
      owner: PlayerId.PLAYER_B,
      position: 1,
      occupant: { id: 'A:1', role: { id: CardRole.WEREWOLF } },
    });
    expect(state.players[PlayerId.PLAYER_A].board[1].occupant.role.id).toBe(CardRole.GUARD);
    expect(state.players[PlayerId.PLAYER_B].board[1].occupant.role.id).toBe(CardRole.VILLAGER);
    expect(
      getRoleAbility(
        state.players[PlayerId.PLAYER_A].board[1].occupant.role,
        AbilityId.GUARD_PROTECT
      )?.lastTarget
    ).toEqual({ instanceId: 'B:1', round: 6 });
    expect(state.players[PlayerId.PLAYER_B].privateIntel[0]).toMatchObject({
      targetInstanceId: 'A:1',
      observedAtSlotId: 'A1',
    });
    expect(state.players[PlayerId.PLAYER_B].board[0].occupant.id).toBe(
      state.players[PlayerId.PLAYER_B].privateIntel[0].targetInstanceId
    );
  });

  it('fizzles the whole round-seven Purge SWAP batch when selections overlap', () => {
    let state = enterPurge(7);
    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { rule: 'SWAP', ownTargetId: 'A1', opponentTargetId: 'B1' },
    });
    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { rule: 'SWAP', ownTargetId: 'B1', opponentTargetId: 'A2' },
    });

    expect(state.phase).toEqual({ type: 'DAY_A' });
    expect(state.players[PlayerId.PLAYER_A].submissions.purge).toBeNull();
    expect(state.players[PlayerId.PLAYER_B].submissions.purge).toBeNull();
    expect(state.players[PlayerId.PLAYER_A].board[0].occupant.id).toBe('A:1');
    expect(state.players[PlayerId.PLAYER_B].board[0].occupant.id).toBe('B:1');
    expect(state.players[PlayerId.PLAYER_B].board[1].occupant.id).toBe('B:2');
    expect(state.players[PlayerId.PLAYER_A].board[1].occupant.id).toBe('A:2');
    const swapEvents = state.events.filter(
      (event) => event.type === 'PURGE_RESOLVED' && event.rule === 'SWAP'
    );
    expect(swapEvents).toHaveLength(2);
    expect(swapEvents).toEqual([
      expect.objectContaining({
        playerId: PlayerId.PLAYER_A,
        targetCardId: null,
        swapTargetCardId: null,
      }),
      expect.objectContaining({
        playerId: PlayerId.PLAYER_B,
        targetCardId: null,
        swapTargetCardId: null,
      }),
    ]);
  });

  it('rejects skipping round-seven Purge SWAP while a valid pair remains', () => {
    let state = enterPurge(7);
    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { rule: 'SWAP', ownTargetId: 'A1', opponentTargetId: 'B1' },
    });

    expect(() =>
      dispatchPlayerAction(state, {
        type: 'PURGE_SUBMIT',
        playerId: PlayerId.PLAYER_B,
        order: { rule: 'SWAP', ownTargetId: null, opponentTargetId: null },
      })
    ).toThrow('Purge SWAP vẫn còn cặp lá hợp lệ');
    expect(state.players[PlayerId.PLAYER_B].submissions.purge).toBeNull();
  });

  it('lets Purge SWAP skip when the only living opponent card is already taken', () => {
    let state = enterPurge(7);
    state = {
      ...state,
      players: {
        ...state.players,
        [PlayerId.PLAYER_A]: {
          ...state.players[PlayerId.PLAYER_A],
          board: state.players[PlayerId.PLAYER_A].board.map((card, index) =>
            index === 0 ? card : transitionCard(card, { type: 'ELIMINATE' })
          ),
        },
      },
    };
    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { rule: 'SWAP', ownTargetId: 'A1', opponentTargetId: 'B1' },
    });
    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { rule: 'SWAP', ownTargetId: null, opponentTargetId: null },
    });

    expect(state.phase).toEqual({ type: 'DAY_A' });
    // Swap của A vẫn chạy: A1 và B1 đổi chỗ cho nhau.
    expect(state.players[PlayerId.PLAYER_A].board[0]).toMatchObject({
      id: 'A1',
      occupant: { id: 'B:1' },
    });
    expect(state.players[PlayerId.PLAYER_B].board[0]).toMatchObject({
      id: 'B1',
      occupant: { id: 'A:1' },
    });
    const skippedSwap = state.events.find(
      (event) =>
        event.type === 'PURGE_RESOLVED' &&
        event.rule === 'SWAP' &&
        event.targetCardId === null
    );
    expect(skippedSwap).toMatchObject({ playerId: PlayerId.PLAYER_B });
  });

  it('reveals selected hidden cards in round eight and permits null only when none remain', () => {
    let state = enterPurge(8);
    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { rule: 'REVEAL', targetId: 'A1' },
    });
    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { rule: 'REVEAL', targetId: 'B1' },
    });
    expect(state.players[PlayerId.PLAYER_A].board[0].occupant.state.visibility).toBe('REVEALED');
    expect(state.players[PlayerId.PLAYER_B].board[0].occupant.state.visibility).toBe('REVEALED');

    const hiddenState = enterPurge(8);
    expect(() =>
      dispatchPlayerAction(hiddenState, {
        type: 'PURGE_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: { rule: 'REVEAL', targetId: null },
      })
    ).toThrow('Purge REVEAL cần chọn một card sống còn ẩn.');

    const revealBase = enterPurge(8);
    const allRevealed = {
      ...revealBase,
      players: Object.fromEntries(
        Object.entries(revealBase.players).map(([playerId, player]) => [
          playerId,
          {
            ...player,
            board: player.board.map((card) => transitionCard(card, { type: 'REVEAL' })),
          },
        ])
      ) as GameState['players'],
    };
    let nullState = dispatchPlayerAction(allRevealed, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { rule: 'REVEAL', targetId: null },
    });
    nullState = dispatchPlayerAction(nullState, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { rule: 'REVEAL', targetId: null },
    });
    expect(nullState.phase).toEqual({ type: 'DAY_A' });
  });

  it('keeps round-nine Purge LOCK through Council and removes it after Night', () => {
    let state = enterPurge(9);
    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { rule: 'LOCK', targetId: 'A6' },
    });
    state = dispatchPlayerAction(state, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { rule: 'LOCK', targetId: 'B4' },
    });

    expect(state.players[PlayerId.PLAYER_A].board[5].occupant.effects).toEqual([
      expect.objectContaining({ kind: CardEffectKind.PURGE_LOCK }),
    ]);
    expect(() =>
      dispatchPlayerAction(state, {
        type: 'DAY_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        action: { type: 'PURIFY', sourceId: 'A6', targetId: 'B4' },
      })
    ).toThrow('A6 đang bị Khóa mạch');

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
    expect(() =>
      dispatchPlayerAction(state, {
        type: 'COUNCIL_ACCUSATION_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: {
          type: 'ACCUSE',
          targetId: 'B1',
          guessedRole: CardRole.VILLAGER,
          voterIds: ['A2', 'A3', 'A6'],
        },
      })
    ).toThrow('A6 đang bị Khóa mạch');

    for (const action of [
      { type: 'COUNCIL_ACCUSATION_SUBMIT' as const, playerId: PlayerId.PLAYER_A, order: { type: 'PASS' as const } },
      { type: 'COUNCIL_ACCUSATION_SUBMIT' as const, playerId: PlayerId.PLAYER_B, order: { type: 'PASS' as const } },
      { type: 'NIGHT_SUBMIT' as const, playerId: PlayerId.PLAYER_A, order: { type: 'PASS' as const } },
      { type: 'NIGHT_SUBMIT' as const, playerId: PlayerId.PLAYER_B, order: { type: 'PASS' as const } },
      { type: 'DEFENSE_SUBMIT' as const, playerId: PlayerId.PLAYER_A, order: { type: 'PASS' as const } },
      { type: 'DEFENSE_SUBMIT' as const, playerId: PlayerId.PLAYER_B, order: { type: 'PASS' as const } },
    ]) {
      state = dispatchPlayerAction(state, action);
    }

    expect(state).toMatchObject({ round: 10, phase: { type: 'PURGE_PLAN' } });
    expect(state.players[PlayerId.PLAYER_A].board[5].occupant.effects).toEqual([]);
  });

  it('rejects a Purge rule that does not match the current round', () => {
    expect(() =>
      dispatchPlayerAction(enterPurge(6), {
        type: 'PURGE_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: { rule: 'LOCK', targetId: 'A1' },
      })
    ).toThrow('Vòng 6 yêu cầu Purge rule CUT');
  });

  it('keeps the first Final Duel guess private and rejects duplicate submission', () => {
    const state = dispatchPlayerAction(enterFinalDuel(), {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      guess: CardRole.VILLAGER,
    });

    expect(state.phase).toEqual({ type: 'FINAL_DUEL' });
    const playerBView = serializePlayerView(state, PlayerId.PLAYER_B);
    expect(playerBView.opponent.submissionLocks.finalGuess).toBe(true);
    expect('submissions' in playerBView.opponent).toBe(false);
    expect(state.events.some((event) => event.type === 'FINAL_DUEL_RESOLVED')).toBe(
      false
    );
    expect(() =>
      dispatchPlayerAction(state, {
        type: 'FINAL_GUESS_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        guess: CardRole.WEREWOLF,
      })
    ).toThrow('PLAYER_A đã khóa Final Duel Guess Order.');
  });

  it('awards Final Duel to the only player with a correct guess', () => {
    let state = enterFinalDuel();
    state = dispatchPlayerAction(state, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      guess: CardRole.VILLAGER,
    });
    state = dispatchPlayerAction(state, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      guess: CardRole.VILLAGER,
    });

    expect(state.phase).toEqual({ type: 'ENDED' });
    expect(state.result).toEqual({
      winner: PlayerId.PLAYER_A,
      reason: FinalDuelResultReason.VICTORY,
    });
    expect(state.players[PlayerId.PLAYER_A].board[0].occupant.state.visibility).toBe('REVEALED');
    expect(state.players[PlayerId.PLAYER_B].board[0].occupant.state.visibility).toBe('REVEALED');
    expect(state.players[PlayerId.PLAYER_A].submissions.finalGuess).toBeNull();
    expect(state.players[PlayerId.PLAYER_B].submissions.finalGuess).toBeNull();
    expect(state.events.at(-1)).toMatchObject({
      type: 'FINAL_DUEL_RESOLVED',
      guessA: CardRole.VILLAGER,
      guessB: CardRole.VILLAGER,
      correctA: true,
      correctB: false,
    });
  });

  it('draws Final Duel when both players guess correctly', () => {
    let state = enterFinalDuel();
    state = dispatchPlayerAction(state, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      guess: CardRole.VILLAGER,
    });
    state = dispatchPlayerAction(state, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      guess: CardRole.WEREWOLF,
    });

    expect(state.result).toEqual({
      winner: null,
      reason: FinalDuelResultReason.DRAW,
    });
    expect(state.events.at(-1)).toMatchObject({
      type: 'FINAL_DUEL_RESOLVED',
      correctA: true,
      correctB: true,
    });
  });

  it('draws Final Duel when both players guess incorrectly', () => {
    let state = enterFinalDuel();
    state = dispatchPlayerAction(state, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      guess: CardRole.GUARD,
    });
    state = dispatchPlayerAction(state, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      guess: CardRole.VILLAGER,
    });

    expect(state.result).toEqual({
      winner: null,
      reason: FinalDuelResultReason.DRAW,
    });
    expect(state.events.at(-1)).toMatchObject({
      type: 'FINAL_DUEL_RESOLVED',
      correctA: false,
      correctB: false,
    });
  });

  it('enters Final Duel from Day, Council, Night and Purge death boundaries', () => {
    const createSparseGame = (
      rolesA: readonly CardRole[],
      rolesB: readonly CardRole[]
    ): GameState =>
      createInitialGameState('final-boundary', 'final-boundary-seed', {
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

    let day = enterDay(
      createSparseGame(
        [CardRole.PRIEST],
        [CardRole.WEREWOLF, CardRole.VILLAGER]
      )
    );
    day = dispatchPlayerAction(day, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: { type: 'PURIFY', sourceId: 'A1', targetId: 'B1' },
    });
    expect(day.phase).toEqual({ type: 'FINAL_DUEL' });

    let night = enterNight(
      createSparseGame(
        [CardRole.WEREWOLF, CardRole.VILLAGER],
        [CardRole.WEREWOLF, CardRole.VILLAGER]
      )
    );
    for (const action of [
      {
        type: 'NIGHT_SUBMIT' as const,
        playerId: PlayerId.PLAYER_A,
        order: {
          type: 'USE_ABILITY' as const,
          sourceId: 'A1' as const,
          abilityId: AbilityId.WEREWOLF_ATTACK,
          targetId: 'B2' as const,
        },
      },
      {
        type: 'NIGHT_SUBMIT' as const,
        playerId: PlayerId.PLAYER_B,
        order: {
          type: 'USE_ABILITY' as const,
          sourceId: 'B1' as const,
          abilityId: AbilityId.WEREWOLF_ATTACK,
          targetId: 'A2' as const,
        },
      },
      { type: 'DEFENSE_SUBMIT' as const, playerId: PlayerId.PLAYER_A, order: { type: 'PASS' as const } },
      { type: 'DEFENSE_SUBMIT' as const, playerId: PlayerId.PLAYER_B, order: { type: 'PASS' as const } },
    ]) {
      night = dispatchPlayerAction(night, action);
    }
    expect(night.phase).toEqual({ type: 'FINAL_DUEL' });

    let purge = {
      ...enterDay(
        createSparseGame(
          [CardRole.WEREWOLF, CardRole.VILLAGER],
          [CardRole.WEREWOLF, CardRole.VILLAGER]
        )
      ),
      round: 6,
      phase: { type: 'PURGE_PLAN' as const },
    };
    purge = dispatchPlayerAction(purge, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { rule: 'CUT', targetId: 'A2' },
    });
    purge = dispatchPlayerAction(purge, {
      type: 'PURGE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { rule: 'CUT', targetId: 'B2' },
    });
    expect(purge.phase).toEqual({ type: 'FINAL_DUEL' });

    let council = enterDay(
      createSparseGame(
        [CardRole.AVENGER, CardRole.VILLAGER, CardRole.VILLAGER],
        [CardRole.AVENGER, CardRole.VILLAGER, CardRole.VILLAGER]
      )
    );
    council = { ...council, round: 2 };
    council = dispatchPlayerAction(council, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: { type: 'MARK', sourceId: 'A1', targetId: 'B2' },
    });
    council = dispatchPlayerAction(council, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      action: { type: 'MARK', sourceId: 'B1', targetId: 'A2' },
    });
    for (const action of [
      {
        type: 'COUNCIL_ACCUSATION_SUBMIT' as const,
        playerId: PlayerId.PLAYER_A,
        order: {
          type: 'ACCUSE' as const,
          targetId: 'B1' as const,
          guessedRole: null,
          voterIds: ['A2', 'A3'] as const,
        },
      },
      {
        type: 'COUNCIL_ACCUSATION_SUBMIT' as const,
        playerId: PlayerId.PLAYER_B,
        order: {
          type: 'ACCUSE' as const,
          targetId: 'A1' as const,
          guessedRole: null,
          voterIds: ['B2', 'B3'] as const,
        },
      },
    ]) {
      council = dispatchPlayerAction(council, action);
    }
    council = passPendingCouncilReactions(council);
    expect(council.phase).toEqual({ type: 'FINAL_DUEL' });
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
        state.players[PlayerId.PLAYER_A].board[3].occupant.role,
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
    expect(state.players[PlayerId.PLAYER_A].board[4].occupant.state.visibility).toBe(
      'REVEALED'
    );
    expect(state.players[PlayerId.PLAYER_B].board[0].occupant.state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(
      getRoleAbility(
        state.players[PlayerId.PLAYER_A].board[4].occupant.role,
        AbilityId.SHOOTER_SHOOT
      )?.remainingUses
    ).toBe(0);
    expect(
      state.events.some(
        (event) => event.type === 'CARD_REVEALED' && event.cardId === 'A5'
      )
    ).toBe(true);
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

    expect(state.players[PlayerId.PLAYER_A].board[1].occupant.state).toEqual({
      life: 'ALIVE',
      visibility: 'HIDDEN',
    });
    expect(
      getRoleAbility(
        state.players[PlayerId.PLAYER_A].board[3].occupant.role,
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

    expect(state.players[PlayerId.PLAYER_B].board[3].occupant.state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(state.players[PlayerId.PLAYER_A].board[5].occupant.state).toEqual({
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

    expect(state.players[PlayerId.PLAYER_A].board[5].occupant.state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(state.players[PlayerId.PLAYER_B].board[0].occupant.state).toEqual({
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

    expect(state.players[PlayerId.PLAYER_A].board[6].occupant.state).toEqual({
      life: 'DEAD',
      visibility: 'REVEALED',
    });
    expect(state.players[PlayerId.PLAYER_B].board[0].occupant.state).toEqual({
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
