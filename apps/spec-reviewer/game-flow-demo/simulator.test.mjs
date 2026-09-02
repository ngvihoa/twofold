import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "./engine.mjs";
import { fuzzGames, fuzzInvalidActions, fuzzRecipientTranscripts, fuzzReplays, projectActionForRecipient, projectTranscript, recipientStateDigest, replayGame, simulateGame, stateDigest } from "./simulator.mjs";

test("seeded full-match simulator is deterministic", () => {
  const first = simulateGame("p06-deterministic");
  const second = simulateGame("p06-deterministic");
  assert.deepEqual(
    { steps: first.steps, round: first.round, result: first.result, trace: first.trace },
    { steps: second.steps, round: second.round, result: second.result, trace: second.trace },
  );
});

test("500 seeded BOT matches preserve state invariants and terminate", () => {
  const runs = fuzzGames({ count: 500, prefix: "p06-regression" });
  const phases = new Set(runs.flatMap((run) => run.coverage.phases));
  const actions = new Set(runs.flatMap((run) => run.coverage.actions));
  assert.equal(runs.length, 500);
  assert.ok(runs.every((run) => run.result));
  assert.ok(Math.max(...runs.map((run) => run.steps)) <= 250);
  assert.deepEqual(
    [...phases].sort(),
    ["council", "council-reaction", "day-A", "day-B", "dusk-defense", "ended", "final-duel", "night-plan", "night-resolution", "purge", "setup-A", "setup-B"].sort(),
  );
  for (const action of ["day.submit:shoot", "day.submit:revive", "day.submit:mark", "day.submit:purify", "night.submit:attack", "night.submit:inspect", "night.submit:poison", "night.submit:bloodmoon", "purge.submit:default"]) {
    assert.ok(actions.has(action), `Thiếu coverage ${action}`);
  }
});

test("invalid-action fuzz rejects atomically across reachable states", () => {
  const result = fuzzInvalidActions({ count: 200, prefix: "p07-invalid" });
  assert.equal(result.games, 200);
  assert.ok(result.rejections >= 5_000);
  assert.ok(result.phases.includes("ended"));
});

test("recorded action stream replays to the same final state digest", () => {
  const recorded = simulateGame("p08-replay");
  const replayed = replayGame(recorded.seed, recorded.events);
  assert.equal(replayed.digest, recorded.digest);
  assert.equal(replayed.digest, stateDigest(recorded.state));
});

test("replay reports the exact event whose expected state digest diverges", () => {
  const recorded = simulateGame("p08-divergence");
  const altered = structuredClone(recorded.events);
  const changedIndex = Math.floor(altered.length / 2);
  altered[changedIndex].digest = "fnv1a64:0000000000000000";
  assert.throws(
    () => replayGame(recorded.seed, altered),
    new RegExp(`Replay divergence tại event ${changedIndex}`),
  );
});

test("200 recorded matches replay without state digest divergence", () => {
  const result = fuzzReplays({ count: 200, prefix: "p08-replay-fuzz" });
  assert.equal(result.games, 200);
  assert.ok(result.events >= 5_000);
  assert.equal(result.divergences, 0);
});

test("recipient digest excludes hidden state the viewer cannot observe", () => {
  const first = createGame("p09-view-a");
  const second = createGame("p09-view-b");
  assert.notDeepEqual(first.players.A.board.map((card) => card.role), second.players.A.board.map((card) => card.role));
  assert.equal(recipientStateDigest(first, "public"), recipientStateDigest(second, "public"));
  assert.notEqual(recipientStateDigest(first, "A"), recipientStateDigest(second, "A"));
});

test("hidden commit envelopes expose payload only to the submitting seat", () => {
  const actions = [
    { type: "setup.submit", seat: "A", order: ["A1", "A2"] },
    { type: "purge.submit", seat: "A", target: "A1", swapTarget: "B1" },
    { type: "council.submit", seat: "A", kind: "accuse", target: "B1", guess: "wolf", voters: ["A1", "A2"] },
    { type: "council.react", seat: "A", use: true },
    { type: "night.submit", seat: "A", kind: "inspect", source: "A3", target: "B4" },
    { type: "defense.submit", seat: "A", target: "A5" },
    { type: "final.submit", seat: "A", guess: "seer" },
  ];
  for (const action of actions) {
    assert.deepEqual(projectActionForRecipient(action, "A"), action);
    assert.deepEqual(projectActionForRecipient(action, "B"), { type: action.type, seat: "A", committed: true });
    assert.deepEqual(projectActionForRecipient(action, "public"), { type: action.type, seat: "A", committed: true });
  }
});

test("projected transcript carries only recipient action payload and recipient digest", () => {
  const recorded = simulateGame("p09-transcript");
  const forA = projectTranscript(recorded.seed, recorded.events, "A");
  const forB = projectTranscript(recorded.seed, recorded.events, "B");
  const publicOnly = projectTranscript(recorded.seed, recorded.events, "public");
  const nightBIndex = recorded.events.findIndex((event) => event.action.type === "night.submit" && event.action.seat === "B");
  assert.ok(nightBIndex >= 0);
  assert.deepEqual(forA.events[nightBIndex].action, { type: "night.submit", seat: "B", committed: true });
  assert.deepEqual(forB.events[nightBIndex].action, recorded.events[nightBIndex].action);
  assert.deepEqual(publicOnly.events[nightBIndex].action, { type: "night.submit", seat: "B", committed: true });
  assert.equal(forA.digest, recipientStateDigest(recorded.state, "A"));
  assert.equal(forB.digest, recipientStateDigest(recorded.state, "B"));
  assert.equal(publicOnly.digest, recipientStateDigest(recorded.state, "public"));
  assert.ok(publicOnly.events.every((event) => !Object.hasOwn(event, "authoritativeDigest")));
});

test("50 full matches keep recipient transcript boundaries intact", () => {
  const result = fuzzRecipientTranscripts({ count: 50, prefix: "p09-recipient-fuzz" });
  assert.equal(result.games, 50);
  assert.ok(result.hiddenActions >= 1_000);
  assert.equal(result.leaks, 0);
});
