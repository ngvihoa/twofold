import { describe, expect, it } from 'vitest';
import {
  beginRound,
  createGame,
  dispatch,
  privateView,
  publicView,
} from './core-adapter.mjs';
import { botNeedsTurn, chooseBotAction } from './bot-policy.mjs';

function enterDayB(seed) {
  let state = createGame(seed);
  state = dispatch(state, {
    type: 'setup.submit',
    seat: 'A',
    order: state.players.A.board.map((card) => card.id),
  });
  state = dispatch(state, {
    type: 'setup.submit',
    seat: 'B',
    order: state.players.B.board.map((card) => card.id),
  });
  state = beginRound(state);
  return dispatch(state, { type: 'day.submit', seat: 'A', kind: 'pass' });
}

describe('spec-reviewer bot information boundary', () => {
  it('produces a valid action using only public state and private B view', () => {
    const state = enterDayB('bot-filtered-view');
    const publicState = publicView(state);
    const self = privateView(state, 'B');

    expect(publicState.board.A.every((card) => card.roleKey === null)).toBe(true);
    expect(self.hand.every((card) => card.id.startsWith('B'))).toBe(true);
    expect(botNeedsTurn(publicState, self)).toBe(true);

    const action = chooseBotAction(publicState, self);
    expect(() => dispatch(state, action)).not.toThrow();
  });

  it('cannot observe a hidden-role mutation on the opponent master projection', () => {
    const state = enterDayB('bot-hidden-invariant');
    const publicBefore = publicView(state);
    const selfBefore = privateView(state, 'B');
    const actionBefore = chooseBotAction(publicBefore, selfBefore);

    const mutated = structuredClone(state);
    for (const card of mutated.players.A.board) {
      card.role = card.role === 'wolf' ? 'villager' : 'wolf';
    }
    const publicAfter = publicView(mutated);
    const selfAfter = privateView(mutated, 'B');

    expect(publicAfter).toEqual(publicBefore);
    expect(selfAfter).toEqual(selfBefore);
    expect(chooseBotAction(publicAfter, selfAfter)).toEqual(actionBefore);
  });

  it('chooses Purge SWAP without receiving the opponent pending payload', () => {
    const publicState = {
      round: 7,
      phase: 'purge',
      submissionLocks: {
        A: { purge: true },
        B: { purge: false },
      },
      board: {
        A: [{ id: 'A1', alive: true, revealed: false, shielded: false }],
        B: [{ id: 'B1', alive: true, revealed: false, shielded: false }],
      },
      special: { B: { unlocked: true, ready: true } },
    };
    const self = {
      seat: 'B',
      hand: [
        {
          id: 'B1',
          instanceId: 'B:1',
          roleKey: 'villager',
          alive: true,
          revealed: false,
          voteCooldown: 0,
          purgeLockedRound: -1,
          uses: {},
        },
      ],
      lastGuardTarget: null,
      intel: [],
    };

    expect(botNeedsTurn(publicState, self)).toBe(true);
    expect(chooseBotAction(publicState, self)).toEqual({
      type: 'purge.submit',
      seat: 'B',
      target: 'B1',
      swapTarget: 'A1',
    });
    expect('pendingOrder' in publicState.submissionLocks.A).toBe(false);
  });
});
