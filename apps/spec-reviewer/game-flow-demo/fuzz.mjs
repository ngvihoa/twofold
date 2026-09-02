import { fuzzGames, fuzzInvalidActions, fuzzReplays } from "./simulator.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const item = args.find((value) => value.startsWith(`--${name}=`));
  return item ? item.slice(name.length + 3) : fallback;
};
const positiveInteger = (name, fallback) => {
  const value = Number(option(name, fallback));
  if (!Number.isInteger(value) || value < 1) throw new Error(`--${name} phải là số nguyên dương.`);
  return value;
};
const nonNegativeInteger = (name, fallback) => {
  const value = Number(option(name, fallback));
  if (!Number.isInteger(value) || value < 0) throw new Error(`--${name} phải là số nguyên không âm.`);
  return value;
};

const count = positiveInteger("count", 500);
const invalidCount = nonNegativeInteger("invalid-count", 0);
const replayCount = nonNegativeInteger("replay-count", 0);
const maxSteps = positiveInteger("max-steps", 250);
const prefix = option("prefix", "p06-cli");
const startedAt = performance.now();
const runs = fuzzGames({ count, prefix, maxSteps });
const phases = new Set(runs.flatMap((run) => run.coverage.phases));
const actions = new Set(runs.flatMap((run) => run.coverage.actions));
const winners = runs.reduce((totals, run) => {
  const key = run.result.winner || "draw";
  totals[key] = (totals[key] || 0) + 1;
  return totals;
}, {});
const invalid = invalidCount > 0 ? fuzzInvalidActions({ count: invalidCount, prefix: `${prefix}-invalid`, maxSteps }) : null;
const replay = replayCount > 0 ? fuzzReplays({ count: replayCount, prefix: `${prefix}-replay`, maxSteps }) : null;

console.log(JSON.stringify({
  games: runs.length,
  prefix,
  maxSteps: Math.max(...runs.map((run) => run.steps)),
  maxRound: Math.max(...runs.map((run) => run.round)),
  winners,
  invalid,
  replay,
  coverage: { phases: [...phases].sort(), actions: [...actions].sort() },
  durationMs: Math.round(performance.now() - startedAt),
}, null, 2));
