import test from "node:test";
import assert from "node:assert/strict";
import { fuzzGames, fuzzInvalidActions, fuzzReplays, replayGame, simulateGame, stateDigest } from "./simulator.mjs";

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
