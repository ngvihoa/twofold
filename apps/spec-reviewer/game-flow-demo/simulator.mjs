import { availableRoleGuesses, createGame, dispatch, purgeRule, publicView, ROLE_DEFS } from "./engine.mjs";

const PHASES = new Set([
  "setup-A", "setup-B", "purge", "day-A", "day-B", "council", "council-reaction",
  "night-plan", "dusk-defense", "night-resolution", "final-duel", "ended",
]);

const otherSeat = (seat) => seat === "A" ? "B" : "A";
const living = (state, seat) => state.players[seat].board.filter((card) => card.alive);

function hashSeed(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFromSeed(seed) {
  let value = hashSeed(seed) || 1;
  return () => {
    value += 0x6D2B79F5;
    let next = value;
    next = Math.imul(next ^ next >>> 15, next | 1);
    next ^= next + Math.imul(next ^ next >>> 7, next | 61);
    return ((next ^ next >>> 14) >>> 0) / 4294967296;
  };
}

function choose(random, values) {
  return values[Math.floor(random() * values.length)];
}

function skillSource(state, seat, role) {
  return state.players[seat].board.find((card) => card.alive && card.role === role && card.purgeLockedRound !== state.round);
}

function eligibleVoters(state, seat) {
  return state.players[seat].board.filter((card) => (
    card.alive
    && ROLE_DEFS[card.role].faction === "village"
    && !card.dayExhausted
    && card.voteCooldown === 0
    && card.purgeLockedRound !== state.round
  ));
}

function councilVoters(state, seat) {
  const candidates = eligibleVoters(state, seat).sort((left, right) => (
    Number(right.role === "villager") - Number(left.role === "villager")
  ));
  const voters = [];
  let power = 0;
  for (const card of candidates) {
    if (power >= 3 || voters.length >= 3) break;
    voters.push(card.id);
    power += card.role === "villager" ? 2 : 1;
  }
  return power >= 3 ? voters : [];
}

function choosePurgeAction(state, seat, random) {
  const rule = purgeRule(state.round);
  const own = living(state, seat);
  if (rule === "reveal") {
    const hidden = own.filter((card) => !card.revealed);
    return { type: "purge.submit", seat, target: hidden.length ? choose(random, hidden).id : null };
  }
  if (rule !== "swap") return { type: "purge.submit", seat, target: choose(random, own).id };

  const enemySeat = otherSeat(seat);
  const enemy = living(state, enemySeat);
  const existing = state.players[enemySeat].purge;
  const reserved = new Set(existing ? [existing.target, existing.swapTarget] : []);
  const ownChoices = own.filter((card) => !reserved.has(card.id));
  const enemyChoices = enemy.filter((card) => !reserved.has(card.id));
  if (!ownChoices.length || !enemyChoices.length) {
    throw new Error(`${seat} không có cặp Swap hợp lệ dù engine vẫn chờ action.`);
  }
  return {
    type: "purge.submit",
    seat,
    target: choose(random, ownChoices).id,
    swapTarget: choose(random, enemyChoices).id,
  };
}

function chooseDayAction(state, seat, random) {
  const player = state.players[seat];
  const enemySeat = otherSeat(seat);
  const enemies = living(state, enemySeat);
  const actions = [{ type: "day.submit", seat, kind: "pass" }];

  const shooter = skillSource(state, seat, "shooter");
  const revealedEnemies = enemies.filter((card) => card.revealed);
  if (shooter?.uses.bullet > 0 && !shooter.dayExhausted && !player.eliminationSpent && revealedEnemies.length >= 2) {
    actions.push({ type: "day.submit", seat, kind: "shoot", source: shooter.id, target: choose(random, revealedEnemies).id });
  }

  const witch = skillSource(state, seat, "witch");
  const deadAllies = player.board.filter((card) => !card.alive);
  if (witch?.uses.revive > 0 && !witch.dayExhausted && deadAllies.length) {
    actions.push({ type: "day.submit", seat, kind: "revive", source: witch.id, target: choose(random, deadAllies).id });
  }

  const priest = skillSource(state, seat, "priest");
  if (priest?.uses.holyWater > 0 && !priest.dayExhausted && !player.eliminationSpent && enemies.length) {
    actions.push({ type: "day.submit", seat, kind: "purify", source: priest.id, target: choose(random, enemies).id });
  }

  const avenger = skillSource(state, seat, "avenger");
  if (avenger && !avenger.dayExhausted && enemies.length) {
    actions.push({ type: "day.submit", seat, kind: "mark", source: avenger.id, target: choose(random, enemies).id });
  }
  return choose(random, actions);
}

function chooseCouncilAction(state, seat, random) {
  const voters = councilVoters(state, seat);
  if (!voters.length || state.players[seat].eliminationSpent) {
    return { type: "council.submit", seat, kind: "pass" };
  }
  const enemySeat = otherSeat(seat);
  const targets = living(state, enemySeat);
  const target = choose(random, targets);
  const possibleGuesses = availableRoleGuesses(state, enemySeat);
  const guess = target.revealed ? undefined : possibleGuesses.includes(target.role) ? target.role : choose(random, possibleGuesses);
  return { type: "council.submit", seat, kind: "accuse", target: target.id, guess, voters };
}

function chooseNightAction(state, seat, random) {
  const player = state.players[seat];
  const targets = living(state, otherSeat(seat));
  const actions = [{ type: "night.submit", seat, kind: "pass" }];

  const wolf = skillSource(state, seat, "wolf");
  if (wolf && !player.eliminationSpent) {
    actions.push({ type: "night.submit", seat, kind: "attack", source: wolf.id, target: choose(random, targets).id });
  }

  const witch = skillSource(state, seat, "witch");
  if (witch?.uses.poison > 0 && !witch.dayExhausted && !player.eliminationSpent) {
    actions.push({ type: "night.submit", seat, kind: "poison", source: witch.id, target: choose(random, targets).id });
  }

  const seer = skillSource(state, seat, "seer");
  const inspectTargets = targets.filter((card) => card.seerInspected !== "light");
  if (seer?.uses.seer > 0 && inspectTargets.length) {
    actions.push({ type: "night.submit", seat, kind: "inspect", source: seer.id, target: choose(random, inspectTargets).id });
  }

  const revealedTargets = targets.filter((card) => card.revealed);
  if (state.round >= 6 && player.bloodMoonReadyRound <= state.round && !player.eliminationSpent && revealedTargets.length) {
    actions.push({ type: "night.submit", seat, kind: "bloodmoon", target: choose(random, revealedTargets).id });
  }
  return choose(random, actions);
}

export function chooseSimulationAction(state, random) {
  if (state.phase === "setup-A" || state.phase === "setup-B") {
    const seat = state.phase.slice(-1);
    return { type: "setup.submit", seat, order: state.players[seat].board.map((card) => card.id) };
  }
  if (state.phase === "purge") {
    const seat = state.players.A.purge ? "B" : "A";
    return choosePurgeAction(state, seat, random);
  }
  if (state.phase === "day-A" || state.phase === "day-B") return chooseDayAction(state, state.phase.slice(-1), random);
  if (state.phase === "council") {
    const seat = state.players.A.council ? "B" : "A";
    return chooseCouncilAction(state, seat, random);
  }
  if (state.phase === "council-reaction") {
    const outcome = state.councilBatch.outcomes.find((item) => item.reaction === null);
    const substitute = state.players[outcome.defenderSeat].board.find((card) => card.alive && card.role === "substitute" && card.uses.sacrifice > 0);
    return { type: "council.react", seat: outcome.defenderSeat, use: Boolean(substitute && substitute.id !== outcome.target && random() >= 0.5) };
  }
  if (state.phase === "night-plan") {
    const seat = state.players.A.night ? "B" : "A";
    return chooseNightAction(state, seat, random);
  }
  if (state.phase === "dusk-defense") {
    const seat = state.players.A.defense === null ? "A" : "B";
    const guard = skillSource(state, seat, "guard");
    const targets = living(state, seat).filter((card) => card.id !== guard?.id && card.instanceId !== state.players[seat].lastGuardTarget);
    return guard && targets.length && random() >= 0.35
      ? { type: "defense.submit", seat, target: choose(random, targets).id }
      : { type: "defense.submit", seat, pass: true };
  }
  if (state.phase === "night-resolution") return { type: "night.resolve" };
  if (state.phase === "final-duel") {
    const seat = state.players.A.finalGuess ? "B" : "A";
    return { type: "final.submit", seat, guess: living(state, otherSeat(seat))[0].role };
  }
  throw new Error(`Không có simulation action cho phase ${state.phase}.`);
}

export function assertSimulationInvariants(state) {
  if (!PHASES.has(state.phase)) throw new Error(`Phase không hợp lệ: ${state.phase}.`);
  if (!Number.isInteger(state.round) || state.round < 1) throw new Error(`Round không hợp lệ: ${state.round}.`);
  const cards = ["A", "B"].flatMap((seat) => state.players[seat].board);
  if (cards.length !== 20) throw new Error(`Sai tổng số card identity: ${cards.length}.`);
  if (new Set(cards.map((card) => card.instanceId)).size !== 20) throw new Error("Trùng card instanceId.");
  if (new Set(cards.map((card) => card.id)).size !== 20) throw new Error("Trùng vị trí card.");
  for (const seat of ["A", "B"]) {
    const owned = state.players[seat].board;
    if (owned.length !== 10 || owned.some((card) => card.owner !== seat)) throw new Error(`Ownership ${seat} bị thay đổi.`);
    if (owned.some((card) => !card.alive && card.shielded)) throw new Error(`${seat} có card chết vẫn giữ khiên.`);
    for (const card of owned) {
      if (!/^([AB])([1-9]|10)$/.test(card.id)) throw new Error(`Position id không hợp lệ: ${card.id}.`);
      for (const value of Object.values(card.uses)) {
        if (typeof value !== "number" || value < 0) throw new Error(`${card.instanceId} có charge không hợp lệ.`);
      }
    }
  }
  const view = publicView(state);
  for (const seat of ["A", "B"]) {
    if (view.alive[seat] !== living(state, seat).length) throw new Error(`Public alive ${seat} lệch state.`);
  }
  if (state.phase === "final-duel" && (view.alive.A !== 1 || view.alive.B !== 1)) throw new Error("Final Duel không ở state 1–1.");
  if (state.phase === "ended") {
    if (!state.result) throw new Error("Match ended thiếu result.");
    if (cards.some((card) => !card.revealed)) throw new Error("Match ended chưa reveal toàn bộ role.");
  } else if (!view.alive.A || !view.alive.B) {
    throw new Error("Match chưa ended dù một board đã hết card.");
  }
}

export function simulateGame(seed, { maxSteps = 250 } = {}) {
  const random = randomFromSeed(`${seed}:policy`);
  let state = createGame(seed);
  const trace = [];
  const phases = new Set();
  const actions = new Set();
  for (let step = 0; step < maxSteps; step += 1) {
    assertSimulationInvariants(state);
    phases.add(state.phase);
    if (state.phase === "ended") {
      return { seed, steps: step, round: state.round, result: state.result, state, trace, coverage: { phases: [...phases], actions: [...actions] } };
    }
    const action = chooseSimulationAction(state, random);
    actions.add(`${action.type}:${action.kind || "default"}`);
    const before = JSON.stringify(state);
    try {
      state = dispatch(state, action);
    } catch (error) {
      throw new Error(`Seed ${seed}, step ${step}, V${state.round} ${state.phase}, action ${JSON.stringify(action)}: ${error.message}`, { cause: error });
    }
    trace.push({ step, round: state.round, phase: state.phase, action });
    if (trace.length > 20) trace.shift();
    if (JSON.stringify(state) === before) throw new Error(`Seed ${seed}, step ${step}: action không làm state tiến triển.`);
  }
  throw new Error(`Seed ${seed} vượt ${maxSteps} transition. Trace: ${JSON.stringify(trace)}`);
}

export function fuzzGames({ count = 500, prefix = "p06", maxSteps = 250 } = {}) {
  const summaries = [];
  for (let index = 0; index < count; index += 1) {
    const run = simulateGame(`${prefix}-${index}`, { maxSteps });
    summaries.push({ seed: run.seed, steps: run.steps, round: run.round, result: run.result, coverage: run.coverage });
  }
  return summaries;
}
