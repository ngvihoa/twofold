import assert from "node:assert/strict";
import test from "node:test";

import { chooseBotCouncilAction } from "./bot-policy.mjs";
import { createGame, ROLE_DEFS } from "./engine.mjs";

test("bot passes Council after spending its elimination action during Day", () => {
  const state = createGame("bot-council-after-shoot");
  state.round = 2;
  state.phase = "council";
  state.players.B.eliminationSpent = true;
  state.players.A.board[0].revealed = true;

  const action = chooseBotCouncilAction(state, ROLE_DEFS);

  assert.deepEqual(action, { type: "council.submit", seat: "B", kind: "pass" });
});

test("bot does not reuse a Day-exhausted card as a Council voter", () => {
  const state = createGame("bot-council-day-exhausted-voter");
  state.round = 2;
  state.phase = "council";
  const target = state.players.A.board.find((card) => card.alive && card.revealed) || state.players.A.board[0];
  target.revealed = true;
  for (const card of state.players.B.board) {
    if (ROLE_DEFS[card.role].faction === "village") card.dayExhausted = true;
  }

  const action = chooseBotCouncilAction(state, ROLE_DEFS);

  assert.deepEqual(action, { type: "council.submit", seat: "B", kind: "pass" });
});
