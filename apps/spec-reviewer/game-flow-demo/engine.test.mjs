import assert from "node:assert/strict";
import test from "node:test";

import { createGame, dispatch } from "./engine.mjs";

function lockSetup(state, seat) {
  return dispatch(state, {
    type: "setup.submit",
    seat,
    order: state.players[seat].board.map((card) => card.id),
  });
}

test("a Day elimination does not lock the player's Night elimination action", () => {
  let state = createGame("day-night-action-budget");
  state = lockSetup(state, "A");
  state = lockSetup(state, "B");

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
