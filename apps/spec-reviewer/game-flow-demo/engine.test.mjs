import assert from "node:assert/strict";
import test from "node:test";

import { createGame, dispatch, ROLE_DEFS } from "./engine.mjs";

function lockSetup(state, seat) {
  return dispatch(state, {
    type: "setup.submit",
    seat,
    order: state.players[seat].board.map((card) => card.id),
  });
}

function startRoundOne(state) {
  return state.phase === "match-intro"
    ? dispatch(state, { type: "round.begin" })
    : state;
}

function submitPasses(state, type, phase) {
  assert.equal(state.phase, phase);
  state = dispatch(state, { type, seat: "A", kind: "pass", pass: true });
  return dispatch(state, { type, seat: "B", kind: "pass", pass: true });
}

function reachRoundTwo(state) {
  state = startRoundOne(state);
  state = submitPasses(state, "day.submit", "day-A");
  state = submitPasses(state, "night.submit", "night-plan");
  state = submitPasses(state, "defense.submit", "dusk-defense");
  return dispatch(state, { type: "night.resolve" });
}

test("a Day elimination does not lock the player's Night elimination action", () => {
  let state = createGame("day-night-action-budget");
  state = lockSetup(state, "A");
  state = lockSetup(state, "B");
  state = startRoundOne(state);

  const priest = state.players.A.board.find((card) => card.role === "priest");
  const villageTarget = state.players.B.board.find(
    (card) => card.role !== "wolf" && card.role !== "wolfguard",
  );

  state = dispatch(state, {
    type: "day.submit",
    seat: "A",
    kind: "purify",
    source: priest.id,
    target: villageTarget.id,
  });
  assert.equal(state.players.A.eliminationSpent, true);

  state = dispatch(state, { type: "day.submit", seat: "B", kind: "pass" });
  assert.equal(state.phase, "night-plan");
  assert.equal(state.players.A.eliminationSpent, false);
  assert.equal(state.players.B.eliminationSpent, false);

  const wolf = state.players.A.board.find((card) => card.alive && card.role === "wolf");
  const nightTarget = state.players.B.board.find((card) => card.alive);
  assert.doesNotThrow(() => {
    state = dispatch(state, {
      type: "night.submit",
      seat: "A",
      kind: "attack",
      source: wolf.id,
      target: nightTarget.id,
    });
  });
  assert.equal(state.players.A.night.kind, "attack");
});

test("round two follows Day -> Council -> Night without looping", () => {
  let state = createGame("round-two-flow");
  state = lockSetup(state, "A");
  state = lockSetup(state, "B");
  state = reachRoundTwo(state);

  assert.equal(state.round, 2);
  assert.equal(state.phase, "day-A");
  state = submitPasses(state, "day.submit", "day-A");
  assert.equal(state.phase, "council");
  state = submitPasses(state, "council.submit", "council");
  assert.equal(state.phase, "night-plan");
});

test("Guard does not block Seer and night sources stay hidden until dawn", () => {
  let state = createGame("guard-seer-rules");
  state = lockSetup(state, "A");
  state = lockSetup(state, "B");
  state = startRoundOne(state);
  state.phase = "night-plan";

  const seer = state.players.A.board.find((card) => card.role === "seer");
  const guard = state.players.B.board.find((card) => card.role === "guard");
  const target = state.players.B.board.find((card) => card.role === "villager");
  state = dispatch(state, { type: "night.submit", seat: "A", kind: "inspect", source: seer.id, target: target.id });
  state = dispatch(state, { type: "night.submit", seat: "B", kind: "pass" });

  assert.equal(state.players.A.board.find((card) => card.id === seer.id).revealed, false);
  state = dispatch(state, { type: "defense.submit", seat: "A", pass: true });
  state = dispatch(state, { type: "defense.submit", seat: "B", source: guard.id, target: target.id });
  state = dispatch(state, { type: "night.resolve" });

  assert.match(state.players.A.notes.at(-1), new RegExp(`${target.id} là Dân làng`));
});

test("Purge lock disables skills and Vote for the current round", () => {
  let skillState = createGame("purge-lock-skill");
  skillState = lockSetup(skillState, "A");
  skillState = lockSetup(skillState, "B");
  const priest = skillState.players.A.board.find((card) => card.role === "priest");
  const enemy = skillState.players.B.board.find((card) => card.role === "wolf");
  skillState.round = 9;
  skillState.phase = "purge";
  skillState = dispatch(skillState, { type: "purge.submit", seat: "A", target: priest.id });
  skillState = dispatch(skillState, { type: "purge.submit", seat: "B", target: skillState.players.B.board[0].id });
  assert.equal(skillState.phase, "day-A");
  assert.throws(
    () => dispatch(skillState, { type: "day.submit", seat: "A", kind: "purify", source: priest.id, target: enemy.id }),
    /Khóa mạch/,
  );

  let voteState = createGame("purge-lock-vote");
  voteState = lockSetup(voteState, "A");
  voteState = lockSetup(voteState, "B");
  const villager = voteState.players.A.board.find((card) => card.role === "villager");
  voteState.round = 9;
  voteState.phase = "purge";
  voteState = dispatch(voteState, { type: "purge.submit", seat: "A", target: villager.id });
  voteState = dispatch(voteState, { type: "purge.submit", seat: "B", target: voteState.players.B.board[0].id });
  voteState = submitPasses(voteState, "day.submit", "day-A");
  const voters = [villager, ...voteState.players.A.board.filter((card) => card.role !== "villager" && ROLE_DEFS[card.role].faction === "village")].slice(0, 3);
  const voteTarget = voteState.players.B.board[0];
  assert.throws(
    () => dispatch(voteState, { type: "council.submit", seat: "A", kind: "accuse", target: voteTarget.id, guess: voteTarget.role, voters: voters.map((card) => card.id) }),
    /Khóa mạch/,
  );
});

test("the full phase loop reaches round ten through all four Purge rules", () => {
  let state = createGame("full-purge-cycle");
  state = lockSetup(state, "A");
  state = lockSetup(state, "B");
  state = startRoundOne(state);

  while (state.round < 10) {
    if (state.phase === "purge") {
      const rule = ["cut", "swap", "reveal", "lock"][(state.round - 6) % 4];
      const aliveA = state.players.A.board.filter((card) => card.alive);
      const aliveB = state.players.B.board.filter((card) => card.alive);
      const targetA = rule === "reveal" ? aliveA.find((card) => !card.revealed) : aliveA[0];
      const targetB = rule === "reveal" ? aliveB.find((card) => !card.revealed) : aliveB[rule === "swap" ? 1 : 0];
      state = dispatch(state, {
        type: "purge.submit",
        seat: "A",
        target: targetA.id,
        swapTarget: rule === "swap" ? aliveB[0].id : undefined,
      });
      state = dispatch(state, {
        type: "purge.submit",
        seat: "B",
        target: targetB.id,
        swapTarget: rule === "swap" ? aliveA[1].id : undefined,
      });
    }
    state = submitPasses(state, "day.submit", "day-A");
    if (state.phase === "council") state = submitPasses(state, "council.submit", "council");
    state = submitPasses(state, "night.submit", "night-plan");
    state = submitPasses(state, "defense.submit", "dusk-defense");
    state = dispatch(state, { type: "night.resolve" });
  }

  assert.equal(state.round, 10);
  assert.equal(state.phase, "purge");
  assert.equal(new Set(state.players.A.board.map((card) => card.instanceId)).size, 10);
  assert.equal(new Set(state.players.B.board.map((card) => card.instanceId)).size, 10);
});

test("Reveal Purge does not deadlock when a side has no hidden card", () => {
  let state = createGame("purge-reveal-empty");
  state.round = 8;
  state.phase = "purge";
  for (const card of state.players.A.board) card.revealed = true;
  for (const card of state.players.B.board) card.revealed = true;

  state = dispatch(state, { type: "purge.submit", seat: "A" });
  assert.equal(state.players.A.purge.target, null);
  state = dispatch(state, { type: "purge.submit", seat: "B" });

  assert.equal(state.phase, "day-A");
});
