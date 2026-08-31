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

function passRound7PurgeToSwap(state) {
  let guard = 0;
  while (!(state.phase === 'purge' && state.round === 7) && guard++ < 200) {
    const phase = state.phase;
    if (phase === 'day-A') state = dispatch(state, { type: 'day.submit', seat: 'A', kind: 'pass' });
    else if (phase === 'day-B') state = dispatch(state, { type: 'day.submit', seat: 'B', kind: 'pass' });
    else if (phase === 'council') {
      const seat = state.players.A.council ? 'B' : 'A';
      state = dispatch(state, { type: 'council.submit', seat, kind: 'pass' });
    } else if (phase === 'night-plan') {
      const seat = state.players.A.night ? 'B' : 'A';
      state = dispatch(state, { type: 'night.submit', seat, kind: 'pass' });
    } else if (phase === 'dusk-defense') {
      const seat = state.players.A.defense !== null ? 'B' : 'A';
      state = dispatch(state, { type: 'defense.submit', seat, pass: true });
    } else if (phase === 'night-resolution') {
      state = dispatch(state, { type: 'night.resolve' });
    } else if (phase === 'purge') {
      const rule = ['cut', 'swap', 'reveal', 'lock'][(state.round - 6) % 4];
      const seat = state.players.A.purge ? 'B' : 'A';
      const other = seat === 'A' ? 'B' : 'A';
      const ownCards = state.players[seat].board.filter((card) => card.alive);
      const enemyCards = state.players[other].board.filter((card) => card.alive);
      // Giữ lá đầu còn sống cho các test Vòng 7.
      const ownCard = ownCards[ownCards.length - 1];
      const enemyCard = enemyCards[enemyCards.length - 1];
      state = dispatch(state, {
        type: 'purge.submit',
        seat,
        target: ownCard.id,
        swapTarget: rule === 'swap' ? enemyCard.id : undefined,
      });
    } else {
      throw new Error(`Unexpected phase ${phase}`);
    }
  }
  return state;
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

  it('skips an overlapping round-seven Purge SWAP instead of deadlocking the round', () => {
    let state = passRound7PurgeToSwap(finishSetup(createGame('adapter-swap-skip')));
    expect(state.phase).toBe('purge');
    expect(state.round).toBe(7);

    state = dispatch(state, {
      type: 'purge.submit',
      seat: 'A',
      target: 'A1',
      swapTarget: 'B1',
    });
    // Lệnh của B trùng cả hai lá A đã chọn -> bị bỏ qua thay vì throw.
    state = dispatch(state, {
      type: 'purge.submit',
      seat: 'B',
      target: 'B1',
      swapTarget: 'A1',
    });

    expect(state.phase).toBe('day-A');
    expect(state.players.A.purge).toBeNull();
    expect(state.players.B.purge).toBeNull();
    // Swap của A vẫn chạy trên snapshot đầu vòng.
    expect(state.players.A.board[0].instanceId).toBe('B:1');
    expect(state.players.B.board[0].instanceId).toBe('A:1');
    expect(state.log).toContain('A đã hoàn tất SWAP.');
    expect(state.log).toContain('B bỏ qua Đảo chiến tuyến (không còn cặp hợp lệ).');
  });

  it('accepts a skip order when the opponent took the only swap candidate', () => {
    let state = passRound7PurgeToSwap(finishSetup(createGame('adapter-swap-skip-last')));
    expect(state.phase).toBe('purge');
    expect(state.round).toBe(7);

    // Giả lập board suy biến: A chỉ còn một lá sống (A1).
    const core = state.__core;
    core.players.PLAYER_A.board = core.players.PLAYER_A.board.map((card, index) =>
      index === 0
        ? card
        : {
            ...card,
            occupant: {
              ...card.occupant,
              state: { ...card.occupant.state, life: 'DEAD' },
            },
          }
    );
    state = { ...state, __core: core };

    state = dispatch(state, {
      type: 'purge.submit',
      seat: 'A',
      target: 'A1',
      swapTarget: 'B9',
    });
    state = dispatch(state, {
      type: 'purge.submit',
      seat: 'B',
      target: null,
      swapTarget: null,
    });

    expect(state.phase).toBe('day-A');
    expect(state.players.A.board[0].instanceId).toBe('B:9');
    expect(state.players.B.board[8].instanceId).toBe('A:1');
    expect(state.log).toContain('B bỏ qua Đảo chiến tuyến (không còn cặp hợp lệ).');
  });
});
