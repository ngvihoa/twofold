import { describe, expect, it } from 'vitest';
import { CardRole, PlayerId } from '@twofold/shared-types';
import { createInitialCard, transitionCard } from './cards';
import { createInitialGameState } from './game-state';
import { createInitialPlayerState } from './players';
import { dispatchPlayerAction } from './rule-pipeline';
// The prototype is intentionally imported only by parity tests, never by core runtime.
import {
  createGame as createPrototypeGame,
  dispatch as dispatchPrototype,
} from '../../../apps/spec-reviewer/game-flow-demo/engine.mjs';

const PROTOTYPE_TO_CORE_ROLE: Record<string, CardRole> = {
  villager: CardRole.VILLAGER,
  wolf: CardRole.WEREWOLF,
  seer: CardRole.SEER,
  guard: CardRole.GUARD,
  witch: CardRole.WITCH,
  shooter: CardRole.SHOOTER,
  avenger: CardRole.AVENGER,
  priest: CardRole.PRIEST,
  wolfguard: CardRole.WOLF_GUARD,
};

describe('prototype to TypeScript core parity smoke tests', () => {
  it('matches Blood Moon kill and cooldown outcome', () => {
    let prototype = createPrototypeGame('parity-blood-moon');
    prototype.round = 6;
    prototype.phase = 'night-plan';
    const prototypeTarget = prototype.players.B.board[0];
    prototypeTarget.revealed = true;
    prototype = dispatchPrototype(prototype, {
      type: 'night.submit',
      seat: 'A',
      kind: 'bloodmoon',
      target: prototypeTarget.id,
    });
    prototype = dispatchPrototype(prototype, {
      type: 'night.submit',
      seat: 'B',
      kind: 'pass',
    });
    prototype = dispatchPrototype(prototype, {
      type: 'defense.submit',
      seat: 'A',
      pass: true,
    });
    prototype = dispatchPrototype(prototype, {
      type: 'defense.submit',
      seat: 'B',
      pass: true,
    });
    prototype = dispatchPrototype(prototype, { type: 'night.resolve' });

    const coreTarget = transitionCard(
      createInitialCard(
        PlayerId.PLAYER_B,
        1,
        PROTOTYPE_TO_CORE_ROLE[prototypeTarget.role]
      ),
      { type: 'REVEAL' }
    );
    let core = createInitialGameState('parity-blood-moon', 'parity-blood-moon', {
      [PlayerId.PLAYER_A]: createInitialPlayerState(PlayerId.PLAYER_A, [
        createInitialCard(PlayerId.PLAYER_A, 1, CardRole.VILLAGER),
      ]),
      [PlayerId.PLAYER_B]: createInitialPlayerState(PlayerId.PLAYER_B, [coreTarget]),
    });
    core = { ...core, round: 6, phase: { type: 'NIGHT_PLAN' } };
    core = dispatchPlayerAction(core, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'BLOOD_MOON', targetId: 'B1' },
    });
    core = dispatchPlayerAction(core, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });
    core = dispatchPlayerAction(core, {
      type: 'DEFENSE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'PASS' },
    });
    core = dispatchPlayerAction(core, {
      type: 'DEFENSE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });

    expect({
      alive:
        core.players[PlayerId.PLAYER_B].board[0].occupant.state.life ===
        'ALIVE',
      readyRound: core.players[PlayerId.PLAYER_A].specialAbilities[0].readyRound,
    }).toEqual({
      alive: prototype.players.B.board[0].alive,
      readyRound: prototype.players.A.bloodMoonReadyRound,
    });
  });

  it('matches the both-correct Final Duel draw outcome', () => {
    let prototype = createPrototypeGame('parity-final-duel');
    prototype.phase = 'final-duel';
    for (const seat of ['A', 'B'] as const) {
      prototype.players[seat].board.forEach((card: { alive: boolean }, index: number) => {
        card.alive = index === 0;
      });
    }
    const roleA = prototype.players.A.board[0].role;
    const roleB = prototype.players.B.board[0].role;
    prototype = dispatchPrototype(prototype, {
      type: 'final.submit',
      seat: 'A',
      guess: roleB,
    });
    prototype = dispatchPrototype(prototype, {
      type: 'final.submit',
      seat: 'B',
      guess: roleA,
    });

    let core = createInitialGameState('parity-final-duel', 'parity-final-duel', {
      [PlayerId.PLAYER_A]: createInitialPlayerState(PlayerId.PLAYER_A, [
        createInitialCard(PlayerId.PLAYER_A, 1, PROTOTYPE_TO_CORE_ROLE[roleA]),
      ]),
      [PlayerId.PLAYER_B]: createInitialPlayerState(PlayerId.PLAYER_B, [
        createInitialCard(PlayerId.PLAYER_B, 1, PROTOTYPE_TO_CORE_ROLE[roleB]),
      ]),
    });
    core = { ...core, phase: { type: 'FINAL_DUEL' } };
    core = dispatchPlayerAction(core, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      guess: PROTOTYPE_TO_CORE_ROLE[roleB],
    });
    core = dispatchPlayerAction(core, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      guess: PROTOTYPE_TO_CORE_ROLE[roleA],
    });

    expect(core.result?.winner).toBeNull();
    expect(prototype.result.winner).toBeNull();
    expect(core.phase.type).toBe('ENDED');
    expect(prototype.phase).toBe('ended');
  });
});
