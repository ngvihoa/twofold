import { describe, expect, it } from 'vitest';
import {
  beginRound,
  createGame,
  dispatch,
  privateView,
  publicView,
} from './core-adapter.mjs';

function finishSetup(state, orderA = state.players.A.board.map((card) => card.id)) {
  let next = dispatch(state, { type: 'setup.submit', seat: 'A', order: orderA });
  next = dispatch(next, {
    type: 'setup.submit',
    seat: 'B',
    order: next.players.B.board.map((card) => card.id),
  });
  return beginRound(next);
}

function passDay(state) {
  let next = dispatch(state, { type: 'day.submit', seat: 'A', kind: 'pass' });
  return dispatch(next, { type: 'day.submit', seat: 'B', kind: 'pass' });
}

function passNight(state) {
  let next = dispatch(state, { type: 'night.submit', seat: 'A', kind: 'pass' });
  next = dispatch(next, { type: 'night.submit', seat: 'B', kind: 'pass' });
  next = dispatch(next, { type: 'defense.submit', seat: 'A', pass: true });
  return dispatch(next, { type: 'defense.submit', seat: 'B', pass: true });
}

describe('spec-reviewer game-core adapter', () => {
  it('reorders physical card instances before Setup lock', () => {
    const initial = createGame('adapter-setup');
    const reversedSlots = initial.players.A.board.map((card) => card.id).reverse();
    const expectedFirstInstance = initial.players.A.board.at(-1).instanceId;
    const afterA = dispatch(initial, {
      type: 'setup.submit',
      seat: 'A',
      order: reversedSlots,
    });

    expect(afterA.phase).toBe('setup-B');
    expect(afterA.players.A.board[0].instanceId).toBe(expectedFirstInstance);
    expect(afterA.__core.players.PLAYER_A.setup.status).toBe('LOCKED');
  });

  it('keeps Night outcome in core while the UI plays its Dawn presentation', () => {
    let state = finishSetup(createGame('adapter-night'));
    state = passDay(state);
    expect(state.phase).toBe('night-plan');

    state = passNight(state);
    expect(state.phase).toBe('night-resolution');
    expect(state.__pendingCore).not.toBeNull();
    expect(state.__core.phase.type).toBe('DUSK_DEFENSE');

    state = dispatch(state, { type: 'night.resolve' });
    expect(state.__pendingCore).toBeNull();
    expect(state.round).toBe(2);
    expect(state.phase).toBe('day-A');
    expect(state.__core.events.at(-1).type).toBe('DAWN_PRESENTATION_COMPLETED');
    expect(state.log).toContain('A không đặt khiên.');
    expect(state.log).toContain('B không đặt khiên.');
  });

  it('maps one legacy Council choice into independent accusation and reaction slots', () => {
    let state = finishSetup(createGame('adapter-council'));
    state = passDay(state);
    state = dispatch(passNight(state), { type: 'night.resolve' });
    state = passDay(state);
    expect(state.phase).toBe('council');

    state = dispatch(state, { type: 'council.submit', seat: 'A', kind: 'pass' });
    expect(state.__core.players.PLAYER_A.submissions.council).toEqual({
      accusation: { type: 'PASS' },
      reaction: { type: 'PASS' },
    });
    state = dispatch(state, { type: 'council.submit', seat: 'B', kind: 'pass' });
    expect(state.phase).toBe('night-plan');
    expect(state.log).toContain('A bỏ qua Hội đồng.');
    expect(state.log).toContain('B bỏ qua Hội đồng.');
  });

  it('projects hidden opponent roles publicly and own roles privately', () => {
    const state = createGame('adapter-views');
    expect(publicView(state).board.B[0].role).toBe('?');
    expect(privateView(state, 'A').hand[0].role).not.toBe('?');
  });
});
