import assert from "node:assert/strict";
import test from "node:test";

import { createGame, dispatch, privateView, publicView, ROLE_DEFS } from "./engine.mjs";

function cardWithRole(state, seat, role) {
  return state.players[seat].board.find((card) => card.role === role);
}

function allCards(state) {
  return ["A", "B"].flatMap((seat) => state.players[seat].board);
}

function villageVoters(state, seat) {
  const villager = cardWithRole(state, seat, "villager");
  const others = state.players[seat].board.filter(
    (card) => card.id !== villager.id && ROLE_DEFS[card.role].faction === "village",
  );
  return [villager, ...others.slice(0, 2)];
}

function stateVillageRole(state, seat, excludedIds = []) {
  return state.players[seat].board.find(
    (card) => card.alive && !excludedIds.includes(card.id) && ROLE_DEFS[card.role].faction === "village",
  );
}

function resolveNight(state, actionA, actionB, defenseA = { pass: true }, defenseB = { pass: true }) {
  let next = dispatch(state, { type: "night.submit", seat: "A", ...actionA });
  next = dispatch(next, { type: "night.submit", seat: "B", ...actionB });
  next = dispatch(next, { type: "defense.submit", seat: "A", ...defenseA });
  next = dispatch(next, { type: "defense.submit", seat: "B", ...defenseB });
  return dispatch(next, { type: "night.resolve" });
}

function submitCorrectCouncil(state, attackerSeat, target, voters) {
  return dispatch(state, {
    type: "council.submit",
    seat: attackerSeat,
    kind: "accuse",
    target: target.id,
    guess: target.role,
    voters: voters.map((card) => card.id),
  });
}

test("Round 2 opens Council after both Day turns and Council advances to Night", () => {
  let state = createGame("council-flow");
  state.round = 2;
  state.phase = "day-A";

  state = dispatch(state, { type: "day.submit", seat: "A", kind: "pass" });
  state = dispatch(state, { type: "day.submit", seat: "B", kind: "pass" });
  assert.equal(state.phase, "council");

  state = dispatch(state, { type: "council.submit", seat: "A", kind: "pass" });
  state = dispatch(state, { type: "council.submit", seat: "B", kind: "pass" });
  assert.equal(state.phase, "night-plan");
});

test("Villager plus one Village role reaches the three-vote Council threshold", () => {
  let state = createGame("villager-vote");
  state.round = 2;
  state.phase = "council";
  const voters = villageVoters(state, "A").slice(0, 2);
  const target = cardWithRole(state, "B", "wolf");

  state = dispatch(state, {
    type: "council.submit",
    seat: "A",
    kind: "accuse",
    target: target.id,
    guess: "wolf",
    voters: voters.map((card) => card.id),
  });
  state = dispatch(state, { type: "council.submit", seat: "B", kind: "pass" });
  state = dispatch(state, { type: "council.react", seat: "B", use: false });

  assert.equal(state.players.B.board.find((card) => card.id === target.id).alive, false);
  assert.match(state.log.join("\n"), /đạt 3 phiếu/);
  const publicVillager = publicView(state).board.A.find((card) => card.id === voters[0].id);
  assert.equal(publicVillager.votePower, 2);
});

test("Council rejects a voter set whose total power is below three", () => {
  const state = createGame("insufficient-vote-power");
  state.round = 2;
  state.phase = "council";
  const villager = cardWithRole(state, "A", "villager");
  const target = cardWithRole(state, "B", "wolf");

  assert.throws(
    () => dispatch(state, {
      type: "council.submit",
      seat: "A",
      kind: "accuse",
      target: target.id,
      guess: "wolf",
      voters: [villager.id],
    }),
    /Cần đủ 3 phiếu/,
  );
});

test("Three non-Villager Village roles also reach the Council threshold", () => {
  let state = createGame("three-standard-voters");
  state.round = 2;
  state.phase = "council";
  const voters = state.players.A.board
    .filter((card) => card.role !== "villager" && ROLE_DEFS[card.role].faction === "village")
    .slice(0, 3);
  const target = cardWithRole(state, "B", "wolf");

  state = dispatch(state, {
    type: "council.submit",
    seat: "A",
    kind: "accuse",
    target: target.id,
    guess: "wolf",
    voters: voters.map((card) => card.id),
  });
  state = dispatch(state, { type: "council.submit", seat: "B", kind: "pass" });
  state = dispatch(state, { type: "council.react", seat: "B", use: false });

  assert.equal(state.players.B.board.find((card) => card.id === target.id).alive, false);
  assert.match(state.log.join("\n"), /đạt 3 phiếu/);
});

test("Council publishes a typed resolved outcome only after both seats lock", () => {
  let state = createGame("typed-council-outcome");
  state.round = 2;
  state.phase = "council";
  const voters = villageVoters(state, "A").slice(0, 2);
  const target = cardWithRole(state, "B", "wolf");

  state = submitCorrectCouncil(state, "A", target, voters);
  assert.equal(publicView(state).events.length, 0);

  state = dispatch(state, { type: "council.submit", seat: "B", kind: "pass" });
  const outcome = publicView(state).events.find((event) => event.type === "council.resolved" && event.attackerSeat === "A");
  assert.deepEqual(outcome, {
    sequence: outcome.sequence,
    type: "council.resolved",
    round: 2,
    attackerSeat: "A",
    target: target.id,
    guess: "wolf",
    votePower: 3,
    success: true,
  });
});

test("Guard has no charge countdown and cannot protect itself", () => {
  const state = createGame("guard-self");
  state.phase = "dusk-defense";
  const guard = cardWithRole(state, "A", "guard");

  assert.equal(guard.uses.guard, Infinity);
  assert.throws(
    () => dispatch(state, { type: "defense.submit", seat: "A", source: guard.id, target: guard.id }),
    /không được tự bảo vệ/,
  );
});

test("Guard does not block a first Seer inspection", () => {
  const state = createGame("seer-shield");
  state.phase = "night-plan";
  const seer = cardWithRole(state, "A", "seer");
  const target = cardWithRole(state, "B", "villager");

  const resolved = resolveNight(
    state,
    { kind: "inspect", source: seer.id, target: target.id },
    { kind: "pass" },
    { pass: true },
    { source: cardWithRole(state, "B", "guard").id, target: target.id },
  );

  assert.match(resolved.players.A.notes.join("\n"), new RegExp(`${target.id} là Dân làng`));
  assert.equal(resolved.players.B.board.find((card) => card.id === target.id).seerInspected, "light");
});

test("Seer cannot inspect a known light card again", () => {
  const state = createGame("seer-light-repeat");
  state.phase = "night-plan";
  const seer = cardWithRole(state, "A", "seer");
  const target = cardWithRole(state, "B", "villager");
  target.seerInspected = "light";

  assert.throws(
    () => dispatch(state, { type: "night.submit", seat: "A", kind: "inspect", source: seer.id, target: target.id }),
    /không thể soi lại/,
  );
});

test("A second Seer inspection kills a dark card unless Guard blocks the execution", () => {
  const unshielded = createGame("seer-dark-kill");
  unshielded.phase = "night-plan";
  const seer = cardWithRole(unshielded, "A", "seer");
  const darkTarget = cardWithRole(unshielded, "B", "wolf");
  darkTarget.seerInspected = "dark";

  const killed = resolveNight(
    unshielded,
    { kind: "inspect", source: seer.id, target: darkTarget.id },
    { kind: "pass" },
  );
  assert.equal(killed.players.B.board.find((card) => card.id === darkTarget.id).alive, false);

  const shielded = createGame("seer-dark-shield");
  shielded.phase = "night-plan";
  const shieldedSeer = cardWithRole(shielded, "A", "seer");
  const shieldedTarget = cardWithRole(shielded, "B", "wolf");
  const guard = cardWithRole(shielded, "B", "guard");
  shieldedTarget.seerInspected = "dark";

  const survived = resolveNight(
    shielded,
    { kind: "inspect", source: shieldedSeer.id, target: shieldedTarget.id },
    { kind: "pass" },
    { pass: true },
    { source: guard.id, target: shieldedTarget.id },
  );
  assert.equal(survived.players.B.board.find((card) => card.id === shieldedTarget.id).alive, true);
  assert.match(survived.log.join("\n"), /chặn đòn kết liễu của Tiên tri/);
});

test("Night sources stay hidden during defense and after normal night actions", () => {
  let state = createGame("hidden-night-sources");
  state.phase = "night-plan";
  const seer = cardWithRole(state, "A", "seer");
  const inspectTarget = cardWithRole(state, "B", "villager");
  const wolf = cardWithRole(state, "B", "wolf");
  const attackTarget = cardWithRole(state, "A", "villager");

  state = dispatch(state, { type: "night.submit", seat: "A", kind: "inspect", source: seer.id, target: inspectTarget.id });
  state = dispatch(state, { type: "night.submit", seat: "B", kind: "attack", source: wolf.id, target: attackTarget.id });

  assert.equal(state.phase, "dusk-defense");
  assert.equal(state.players.A.board.find((card) => card.id === seer.id).revealed, false);
  assert.equal(state.players.B.board.find((card) => card.id === wolf.id).revealed, false);
  assert.equal(publicView(state).board.A.some((card) => card.staged), false);
  assert.equal(publicView(state).board.B.some((card) => card.staged), false);

  state = dispatch(state, { type: "defense.submit", seat: "A", pass: true });
  state = dispatch(state, { type: "defense.submit", seat: "B", pass: true });
  state = dispatch(state, { type: "night.resolve" });

  assert.equal(state.players.A.board.find((card) => card.id === seer.id).revealed, false);
  assert.equal(state.players.B.board.find((card) => card.id === wolf.id).revealed, false);
});

test("Guard target stays private until a blocked outcome is published", () => {
  let state = createGame("private-guard-target");
  state.phase = "night-plan";
  const guard = cardWithRole(state, "A", "guard");
  const target = cardWithRole(state, "A", "villager");

  state = dispatch(state, { type: "night.submit", seat: "A", kind: "pass" });
  state = dispatch(state, { type: "night.submit", seat: "B", kind: "pass" });
  state = dispatch(state, { type: "defense.submit", seat: "A", source: guard.id, target: target.id });
  state = dispatch(state, { type: "defense.submit", seat: "B", pass: true });

  const publicState = publicView(state);
  const publicTarget = publicState.board.A.find((card) => card.id === target.id);
  const privateTarget = privateView(state, "A").hand.find((card) => card.id === target.id);
  assert.equal(publicTarget.shielded, false);
  assert.doesNotMatch(publicState.log.join("\n"), new RegExp(`khiên tại ${target.id}`));
  assert.equal(privateTarget.shielded, true);
});

test("normal Seer inspection leaves no public action-kind or target trace", () => {
  const state = createGame("private-seer-inspection");
  state.phase = "night-plan";
  const seer = cardWithRole(state, "A", "seer");
  const target = cardWithRole(state, "B", "villager");

  const resolved = resolveNight(
    state,
    { kind: "inspect", source: seer.id, target: target.id },
    { kind: "pass" },
  );
  const publicLog = publicView(resolved).log.join("\n");
  const privateNotes = privateView(resolved, "A").notes.join("\n");

  assert.doesNotMatch(publicLog, /Tiên tri/);
  assert.doesNotMatch(publicLog, new RegExp(target.id));
  assert.match(privateNotes, new RegExp(`${target.id} là Dân làng`));
  assert.equal(privateView(resolved, "B").notes.length, 0);
});

test("a successful shield publishes the saved position but not the blocked attack kind", () => {
  const state = createGame("private-blocked-night-kind");
  state.phase = "night-plan";
  const guard = cardWithRole(state, "A", "guard");
  const target = cardWithRole(state, "A", "villager");
  const wolf = cardWithRole(state, "B", "wolf");

  const resolved = resolveNight(
    state,
    { kind: "pass" },
    { kind: "attack", source: wolf.id, target: target.id },
    { source: guard.id, target: target.id },
    { pass: true },
  );
  const publicLog = publicView(resolved).log.join("\n");

  assert.match(publicLog, new RegExp(`${target.id}.*khiên`));
  assert.doesNotMatch(publicLog, /cắn|độc|Ma sói|Phù thủy/);
});

test("a blocked night elimination publishes a typed saved outcome without source or kind", () => {
  const state = createGame("typed-night-save");
  state.phase = "night-plan";
  const guard = cardWithRole(state, "A", "guard");
  const target = cardWithRole(state, "A", "villager");
  const wolf = cardWithRole(state, "B", "wolf");

  const resolved = resolveNight(
    state,
    { kind: "pass" },
    { kind: "attack", source: wolf.id, target: target.id },
    { source: guard.id, target: target.id },
    { pass: true },
  );
  const saved = publicView(resolved).events.find((event) => event.type === "card.saved");
  assert.deepEqual(saved, {
    sequence: 0,
    type: "card.saved",
    round: 1,
    position: target.id,
    instanceId: target.instanceId,
    owner: "A",
  });
  assert.equal(Object.hasOwn(saved, "source"), false);
  assert.equal(Object.hasOwn(saved, "kind"), false);
  assert.equal(Object.hasOwn(saved, "role"), false);
});

test("Seer reveals at Dawn when an execution resolves even if Guard blocks it", () => {
  let state = createGame("seer-execution-reveal");
  state.phase = "night-plan";
  const seer = cardWithRole(state, "A", "seer");
  const target = cardWithRole(state, "B", "wolf");
  const guard = cardWithRole(state, "B", "guard");
  target.seerInspected = "dark";

  state = dispatch(state, { type: "night.submit", seat: "A", kind: "inspect", source: seer.id, target: target.id });
  state = dispatch(state, { type: "night.submit", seat: "B", kind: "pass" });
  assert.equal(state.players.A.board.find((card) => card.id === seer.id).revealed, false);

  state = dispatch(state, { type: "defense.submit", seat: "A", pass: true });
  state = dispatch(state, { type: "defense.submit", seat: "B", source: guard.id, target: target.id });
  state = dispatch(state, { type: "night.resolve" });

  assert.equal(state.players.B.board.find((card) => card.id === target.id).alive, true);
  assert.equal(state.players.A.board.find((card) => card.id === seer.id).revealed, true);
});

test("Kẻ Thế Mạng may accept a private Council reaction and die for a revealed target", () => {
  let state = createGame("substitute-accepts");
  state.round = 2;
  state.phase = "council";
  const target = cardWithRole(state, "B", "wolf");
  const substitute = cardWithRole(state, "B", "substitute");
  const voters = villageVoters(state, "A").slice(0, 2);

  state = submitCorrectCouncil(state, "A", target, voters);
  state = dispatch(state, { type: "council.submit", seat: "B", kind: "pass" });

  assert.equal(state.phase, "council-reaction");
  assert.equal(state.players.B.board.find((card) => card.id === target.id).alive, true);
  assert.equal(state.players.B.board.find((card) => card.id === target.id).revealed, true);

  state = dispatch(state, { type: "council.react", seat: "B", use: true });

  assert.equal(state.players.B.board.find((card) => card.id === target.id).alive, true);
  assert.equal(state.players.B.board.find((card) => card.id === substitute.id).alive, false);
  assert.equal(state.players.B.board.find((card) => card.id === substitute.id).revealed, true);
  assert.equal(state.players.B.board.find((card) => card.id === substitute.id).uses.sacrifice, 0);
  assert.equal(state.phase, "night-plan");
});

test("Kẻ Thế Mạng keeps its charge when declining and cannot save itself", () => {
  let declined = createGame("substitute-declines");
  declined.round = 2;
  declined.phase = "council";
  const target = cardWithRole(declined, "B", "wolf");
  const substitute = cardWithRole(declined, "B", "substitute");
  declined = submitCorrectCouncil(declined, "A", target, villageVoters(declined, "A").slice(0, 2));
  declined = dispatch(declined, { type: "council.submit", seat: "B", kind: "pass" });
  declined = dispatch(declined, { type: "council.react", seat: "B", use: false });

  assert.equal(declined.players.B.board.find((card) => card.id === target.id).alive, false);
  assert.equal(declined.players.B.board.find((card) => card.id === substitute.id).alive, true);
  assert.equal(declined.players.B.board.find((card) => card.id === substitute.id).uses.sacrifice, 1);

  let selfTargeted = createGame("substitute-self-target");
  selfTargeted.round = 2;
  selfTargeted.phase = "council";
  const selfSubstitute = cardWithRole(selfTargeted, "B", "substitute");
  selfTargeted = submitCorrectCouncil(selfTargeted, "A", selfSubstitute, villageVoters(selfTargeted, "A").slice(0, 2));
  selfTargeted = dispatch(selfTargeted, { type: "council.submit", seat: "B", kind: "pass" });
  assert.throws(
    () => dispatch(selfTargeted, { type: "council.react", seat: "B", use: true }),
    /không thể chết thay cho chính mình/,
  );
});

test("Shooter reveals after using its Day skill", () => {
  let state = createGame("shooter-reveal");
  state.phase = "day-A";
  const shooter = cardWithRole(state, "A", "shooter");
  const targets = state.players.B.board.slice(0, 2);
  targets.forEach((card) => { card.revealed = true; });

  state = dispatch(state, {
    type: "day.submit",
    seat: "A",
    kind: "shoot",
    source: shooter.id,
    target: targets[0].id,
  });

  assert.equal(state.players.A.board.find((card) => card.id === shooter.id).revealed, true);
});

test("Day resolution publishes typed reveal and elimination outcomes", () => {
  let state = createGame("typed-day-outcomes");
  state.phase = "day-A";
  const shooter = cardWithRole(state, "A", "shooter");
  const targets = state.players.B.board.slice(0, 2);
  targets.forEach((card) => { card.revealed = true; });

  state = dispatch(state, { type: "day.submit", seat: "A", kind: "shoot", source: shooter.id, target: targets[0].id });
  assert.deepEqual(
    publicView(state).events.map((event) => ({ type: event.type, position: event.position, role: event.role })),
    [
      { type: "card.revealed", position: shooter.id, role: "shooter" },
      { type: "card.eliminated", position: targets[0].id, role: targets[0].role },
    ],
  );
});

test("Witch cannot revive and poison in the same round", () => {
  let state = createGame("witch-once-per-round");
  state.phase = "day-A";
  const witch = cardWithRole(state, "A", "witch");
  const ally = cardWithRole(state, "A", "villager");
  const enemy = cardWithRole(state, "B", "villager");
  ally.alive = false;
  ally.revealed = true;

  state = dispatch(state, {
    type: "day.submit",
    seat: "A",
    kind: "revive",
    source: witch.id,
    target: ally.id,
  });
  state.phase = "night-plan";

  assert.throws(
    () => dispatch(state, { type: "night.submit", seat: "A", kind: "poison", source: witch.id, target: enemy.id }),
    /đã dùng kỹ năng trong vòng này/,
  );
});

test("Witch revival publishes a typed revived outcome", () => {
  let state = createGame("typed-revive-outcome");
  state.phase = "day-A";
  const witch = cardWithRole(state, "A", "witch");
  const target = state.players.A.board.find((card) => card.id !== witch.id);
  target.alive = false;
  target.revealed = true;

  state = dispatch(state, { type: "day.submit", seat: "A", kind: "revive", source: witch.id, target: target.id });
  const revived = publicView(state).events.find((event) => event.type === "card.revived");
  assert.deepEqual(revived, {
    sequence: 1,
    type: "card.revived",
    round: 1,
    position: target.id,
    instanceId: target.instanceId,
    owner: "A",
    role: target.role,
    faction: ROLE_DEFS[target.role].faction,
  });
});

test("a card that used a Day skill cannot also vote in Council during the same round", () => {
  let state = createGame("day-skill-then-council-vote");
  state.round = 2;
  state.phase = "day-A";
  const avenger = cardWithRole(state, "A", "avenger");
  const villager = cardWithRole(state, "A", "villager");
  const markTarget = cardWithRole(state, "B", "villager");
  const councilTarget = cardWithRole(state, "B", "wolf");

  state = dispatch(state, {
    type: "day.submit",
    seat: "A",
    kind: "mark",
    source: avenger.id,
    target: markTarget.id,
  });
  state = dispatch(state, { type: "day.submit", seat: "B", kind: "pass" });

  const exhaustedPublicCard = publicView(state).board.A.find((card) => card.id === avenger.id);
  assert.equal(exhaustedPublicCard.canVote, false);
  assert.equal(exhaustedPublicCard.votePower, 0);

  assert.throws(
    () => dispatch(state, {
      type: "council.submit",
      seat: "A",
      kind: "accuse",
      target: councilTarget.id,
      guess: councilTarget.role,
      voters: [villager.id, avenger.id],
    }),
    /đã dùng kỹ năng trong vòng này/,
  );
});

test("Round 9 Lock does not disable Kẻ Thế Mạng death reaction", () => {
  let state = createGame("lock-keeps-substitute-reaction");
  state.round = 9;
  state.phase = "council";
  const target = cardWithRole(state, "B", "wolf");
  const substitute = cardWithRole(state, "B", "substitute");
  substitute.purgeLockedRound = state.round;

  state = submitCorrectCouncil(state, "A", target, villageVoters(state, "A").slice(0, 2));
  state = dispatch(state, { type: "council.submit", seat: "B", kind: "pass" });
  state = dispatch(state, { type: "council.react", seat: "B", use: true });

  assert.equal(state.players.B.board.find((card) => card.id === target.id).alive, true);
  assert.equal(state.players.B.board.find((card) => card.id === substitute.id).alive, false);
});

test("Guard blocks Avenger death reaction while the shield is active", () => {
  const state = createGame("revenge-shield");
  state.phase = "night-plan";
  const avenger = cardWithRole(state, "A", "avenger");
  const revengeTarget = cardWithRole(state, "B", "villager");
  const wolf = cardWithRole(state, "B", "wolf");
  const guard = cardWithRole(state, "B", "guard");
  state.players.A.revengeTarget = revengeTarget.id;

  const resolved = resolveNight(
    state,
    { kind: "pass" },
    { kind: "attack", source: wolf.id, target: avenger.id },
    { pass: true },
    { source: guard.id, target: revengeTarget.id },
  );

  assert.equal(resolved.players.B.board.find((card) => card.id === revengeTarget.id).alive, true);
  assert.match(resolved.log.join("\n"), /chặn báo thù/);
});

test("locked Night actions both resolve when their sources die in the same batch", () => {
  const state = createGame("simultaneous-night-last-sources");
  state.phase = "night-plan";
  const wolfA = cardWithRole(state, "A", "wolf");
  const wolfB = cardWithRole(state, "B", "wolf");
  for (const card of state.players.A.board) card.alive = card.id === wolfA.id;
  for (const card of state.players.B.board) card.alive = card.id === wolfB.id;

  const resolved = resolveNight(
    state,
    { kind: "attack", source: wolfA.id, target: wolfB.id },
    { kind: "attack", source: wolfB.id, target: wolfA.id },
  );

  assert.equal(resolved.players.A.board.find((card) => card.id === wolfA.id).alive, false);
  assert.equal(resolved.players.B.board.find((card) => card.id === wolfB.id).alive, false);
  assert.deepEqual(resolved.result, { winner: null, reason: "Hai board cùng hết bài" });
});

test("Round 6 Cut resolves both final choices before declaring a draw", () => {
  let state = createGame("purge-cut-last-cards-draw");
  state.round = 6;
  state.phase = "purge";
  const lastA = state.players.A.board[0];
  const lastB = state.players.B.board[0];
  for (const card of state.players.A.board) card.alive = card.id === lastA.id;
  for (const card of state.players.B.board) card.alive = card.id === lastB.id;

  state = dispatch(state, { type: "purge.submit", seat: "A", target: lastA.id });
  state = dispatch(state, { type: "purge.submit", seat: "B", target: lastB.id });

  assert.equal(state.phase, "ended");
  assert.deepEqual(state.result, { winner: null, reason: "Hai board cùng hết bài" });
});

test("reviving Kẻ Thế Mạng preserves reveal state and spent reaction", () => {
  let state = createGame("revive-spent-substitute");
  state.phase = "day-A";
  const witch = cardWithRole(state, "A", "witch");
  const substitute = cardWithRole(state, "A", "substitute");
  substitute.alive = false;
  substitute.revealed = true;
  substitute.uses.sacrifice = 0;

  state = dispatch(state, {
    type: "day.submit",
    seat: "A",
    kind: "revive",
    source: witch.id,
    target: substitute.id,
  });

  const revived = state.players.A.board.find((card) => card.id === substitute.id);
  assert.equal(revived.alive, true);
  assert.equal(revived.revealed, true);
  assert.equal(revived.uses.sacrifice, 0);
});

test("Dawn of Round 6 enters mandatory Purge before Day", () => {
  const state = createGame("purge-round-six");
  state.round = 5;
  state.phase = "night-plan";

  const next = resolveNight(state, { kind: "pass" }, { kind: "pass" });

  assert.equal(next.round, 6);
  assert.equal(next.phase, "purge");
  assert.equal(next.players.A.purge, null);
  assert.equal(next.players.B.purge, null);
});

test("Dawn enters Final Duel instead of Purge when each owner has one living card", () => {
  const state = createGame("final-duel-before-purge");
  state.round = 6;
  state.phase = "night-plan";
  for (const seat of ["A", "B"]) {
    for (const card of state.players[seat].board.slice(1)) card.alive = false;
  }

  const next = resolveNight(state, { kind: "pass" }, { kind: "pass" });

  assert.equal(next.round, 7);
  assert.equal(next.phase, "final-duel");
});

test("a Day elimination that leaves one card per owner enters Final Duel immediately", () => {
  let state = createGame("final-duel-after-day");
  state.round = 3;
  state.phase = "day-A";
  const shooter = cardWithRole(state, "A", "shooter");
  const targets = state.players.B.board.slice(0, 2);
  for (const card of state.players.A.board) card.alive = card.id === shooter.id;
  for (const card of state.players.B.board) {
    card.alive = targets.some((target) => target.id === card.id);
    if (card.alive) card.revealed = true;
  }

  state = dispatch(state, {
    type: "day.submit",
    seat: "A",
    kind: "shoot",
    source: shooter.id,
    target: targets[0].id,
  });

  assert.equal(state.phase, "final-duel");
  assert.equal(state.result, null);
});

test("Final Duel guesses lock once and reveal every role at match result", () => {
  let state = createGame("final-duel-lock-and-reveal");
  state.phase = "final-duel";
  const lastA = state.players.A.board[0];
  const lastB = state.players.B.board[0];
  for (const card of state.players.A.board) {
    card.alive = card.id === lastA.id;
    card.revealed = false;
  }
  for (const card of state.players.B.board) {
    card.alive = card.id === lastB.id;
    card.revealed = false;
  }

  state = dispatch(state, { type: "final.submit", seat: "A", guess: lastB.role });
  assert.throws(
    () => dispatch(state, { type: "final.submit", seat: "A", guess: "villager" }),
    /đã khóa dự đoán/,
  );
  state = dispatch(state, { type: "final.submit", seat: "B", guess: lastA.role });

  assert.equal(state.phase, "ended");
  assert.equal([...publicView(state).board.A, ...publicView(state).board.B].every((card) => card.role !== "?"), true);
});

test("normal match end reveals all roles and rematch returns to fresh setup", () => {
  let state = createGame("match-end-reveal-rematch");
  state.phase = "day-A";
  const shooter = cardWithRole(state, "A", "shooter");
  const lastB = state.players.B.board[0];
  for (const card of state.players.B.board) {
    card.alive = card.id === lastB.id;
    card.revealed = card.id === lastB.id;
  }
  state.players.B.board[1].revealed = true;

  state = dispatch(state, {
    type: "day.submit",
    seat: "A",
    kind: "shoot",
    source: shooter.id,
    target: lastB.id,
  });

  assert.equal(state.phase, "ended");
  assert.equal([...publicView(state).board.A, ...publicView(state).board.B].every((card) => card.role !== "?"), true);
  const endedEvent = publicView(state).events.at(-1);
  assert.deepEqual(endedEvent, {
    sequence: endedEvent.sequence,
    type: "match.ended",
    round: 1,
    winner: "A",
    reason: "B hết bài",
  });

  const rematch = dispatch(state, { type: "match.rematch", seed: "match-rematch-02" });
  assert.equal(rematch.phase, "setup-A");
  assert.equal(rematch.seed, "match-rematch-02");
  assert.equal(rematch.result, null);
  assert.equal(rematch.players.A.board.every((card) => card.alive && !card.revealed), true);
  assert.equal(rematch.players.B.board.every((card) => card.alive && !card.revealed), true);
});

test("Council resolution that leaves one card per owner enters Final Duel", () => {
  let state = createGame("final-duel-after-council");
  state.round = 2;
  state.phase = "council";
  const targetB = cardWithRole(state, "B", "wolf");
  const lastB = state.players.B.board.find((card) => card.id !== targetB.id);
  const lastA = cardWithRole(state, "A", "wolf");

  state = submitCorrectCouncil(state, "A", targetB, villageVoters(state, "A").slice(0, 2));
  state = dispatch(state, { type: "council.submit", seat: "B", kind: "pass" });
  for (const card of state.players.A.board) card.alive = card.id === lastA.id;
  for (const card of state.players.B.board) card.alive = card.id === targetB.id || card.id === lastB.id;
  state = dispatch(state, { type: "council.react", seat: "B", use: false });

  assert.equal(state.phase, "final-duel");
  assert.equal(state.result, null);
});

test("Final Duel resolves both-correct, one-correct and both-wrong outcomes", () => {
  const scenarios = [
    { guesses: (a, b) => [b.role, a.role], winner: null, reason: /cùng đoán đúng/ },
    { guesses: (a) => ["villager", a.role], winner: "B", reason: /Đoán đúng role cuối/ },
    { guesses: () => ["villager", "villager"], winner: null, reason: /cùng đoán sai/ },
  ];

  for (const [index, scenario] of scenarios.entries()) {
    let state = createGame(`final-duel-outcome-${index}`);
    state.phase = "final-duel";
    const lastA = cardWithRole(state, "A", "wolf");
    const lastB = cardWithRole(state, "B", "wolf");
    for (const card of state.players.A.board) card.alive = card.id === lastA.id;
    for (const card of state.players.B.board) card.alive = card.id === lastB.id;
    const [guessA, guessB] = scenario.guesses(lastA, lastB);

    state = dispatch(state, { type: "final.submit", seat: "A", guess: guessA });
    state = dispatch(state, { type: "final.submit", seat: "B", guess: guessB });

    assert.equal(state.result.winner, scenario.winner);
    assert.match(state.result.reason, scenario.reason);
  }
});

test("Round 6 Cut removes both chosen allied cards in one Purge batch", () => {
  let state = createGame("purge-cut");
  state.round = 6;
  state.phase = "purge";
  const targetA = cardWithRole(state, "A", "villager");
  const targetB = cardWithRole(state, "B", "villager");

  state = dispatch(state, { type: "purge.submit", seat: "A", target: targetA.id });
  assert.equal(state.players.A.board.find((card) => card.id === targetA.id).alive, true);
  state = dispatch(state, { type: "purge.submit", seat: "B", target: targetB.id });

  assert.equal(state.players.A.board.find((card) => card.id === targetA.id).alive, false);
  assert.equal(state.players.B.board.find((card) => card.id === targetB.id).alive, false);
  assert.equal(state.phase, "day-A");
});

test("Round 7 Swap changes positions while card ownership and identity stay stable", () => {
  let state = createGame("purge-swap-ownership");
  state.round = 7;
  state.phase = "purge";
  const ownA = state.players.A.board[0];
  const enemyForA = state.players.B.board[0];
  const ownB = state.players.B.board[1];
  const enemyForB = state.players.A.board[1];
  const snapshot = [ownA, enemyForA, ownB, enemyForB].map((card) => ({ instanceId: card.instanceId, owner: card.owner, id: card.id }));
  state.players.A.notes.push(`V6: ${ownA.id} là ${ROLE_DEFS[ownA.role].name}.`);
  state.players.B.notes.push(`V6: ${enemyForA.id} là ${ROLE_DEFS[enemyForA.role].name}.`);

  state = dispatch(state, { type: "purge.submit", seat: "A", target: ownA.id, swapTarget: enemyForA.id });
  state = dispatch(state, { type: "purge.submit", seat: "B", target: ownB.id, swapTarget: enemyForB.id });

  for (const before of snapshot) {
    const after = allCards(state).find((card) => card.instanceId === before.instanceId);
    assert.ok(after);
    assert.equal(after.owner, before.owner);
  }
  assert.equal(allCards(state).find((card) => card.instanceId === ownA.instanceId).id, enemyForA.id);
  assert.equal(allCards(state).find((card) => card.instanceId === enemyForA.instanceId).id, ownA.id);
  assert.equal(allCards(state).find((card) => card.instanceId === ownB.instanceId).id, enemyForB.id);
  assert.equal(allCards(state).find((card) => card.instanceId === enemyForB.instanceId).id, ownB.id);
  assert.match(state.players.A.notes[0], new RegExp(`V6: ${enemyForA.id} là`));
  assert.match(state.players.B.notes[0], new RegExp(`V6: ${ownA.id} là`));
  assert.equal(state.phase, "day-A");
});

test("Round 7 Swap conflict fizzles the whole hidden batch", () => {
  let state = createGame("purge-swap-conflict");
  state.round = 7;
  state.phase = "purge";
  const ownA = state.players.A.board[0];
  const ownB = state.players.B.board[0];
  const positionsBefore = new Map(allCards(state).map((card) => [card.instanceId, card.id]));

  state = dispatch(state, { type: "purge.submit", seat: "A", target: ownA.id, swapTarget: ownB.id });
  state = dispatch(state, { type: "purge.submit", seat: "B", target: ownB.id, swapTarget: ownA.id });

  for (const card of allCards(state)) assert.equal(card.id, positionsBefore.get(card.instanceId));
  assert.match(state.log.join("\n"), /xung đột.*fizzle/);
  assert.equal(state.phase, "day-A");
});

test("Purge publishes one typed resolution only after the hidden batch resolves", () => {
  let state = createGame("purge-typed-resolution");
  state.round = 7;
  state.phase = "purge";
  const ownA = state.players.A.board[0];
  const ownB = state.players.B.board[0];

  state = dispatch(state, { type: "purge.submit", seat: "A", target: ownA.id, swapTarget: ownB.id });
  assert.equal(publicView(state).events.find((event) => event.type === "purge.resolved"), undefined);

  state = dispatch(state, { type: "purge.submit", seat: "B", target: ownB.id, swapTarget: ownA.id });
  assert.deepEqual(publicView(state).events.find((event) => event.type === "purge.resolved"), {
    sequence: 0,
    type: "purge.resolved",
    round: 7,
    rule: "swap",
    status: "fizzled",
  });
});

test("Round 7 Swap auto-fizzles when A has one card and B has no disjoint response", () => {
  let state = createGame("purge-swap-last-card-deadlock");
  state.round = 7;
  state.phase = "purge";
  const lastA = state.players.A.board[0];
  const livingB = state.players.B.board.slice(0, 2);
  for (const card of state.players.A.board.slice(1)) card.alive = false;
  for (const card of state.players.B.board.slice(2)) card.alive = false;

  state = dispatch(state, {
    type: "purge.submit",
    seat: "A",
    target: lastA.id,
    swapTarget: livingB[0].id,
  });

  assert.equal(state.phase, "day-A");
  assert.equal(state.players.A.purge, null);
  assert.equal(state.players.B.purge, null);
  assert.match(state.log.join("\n"), /không còn lựa chọn không xung đột.*fizzle/);
});

test("Guard consecutive-target cooldown follows card identity through Round 7 Swap", () => {
  let state = createGame("purge-swap-guard-cooldown");
  state.round = 7;
  state.phase = "purge";
  const guardedCard = state.players.A.board.find((card) => card.role !== "guard");
  const enemyForA = state.players.B.board[0];
  const ownB = state.players.B.board[1];
  const enemyForB = state.players.A.board.find((card) => card.instanceId !== guardedCard.instanceId);
  state.players.A.lastGuardTarget = guardedCard.instanceId;

  state = dispatch(state, { type: "purge.submit", seat: "A", target: guardedCard.id, swapTarget: enemyForA.id });
  state = dispatch(state, { type: "purge.submit", seat: "B", target: ownB.id, swapTarget: enemyForB.id });
  const movedGuardedCard = allCards(state).find((card) => card.instanceId === guardedCard.instanceId);
  state.phase = "dusk-defense";

  assert.throws(
    () => dispatch(state, { type: "defense.submit", seat: "A", pass: false, target: movedGuardedCard.id }),
    /hai vòng liên tiếp/,
  );
});

test("Round 8 Reveal exposes chosen hidden cards and Round 9 Lock blocks skill and Vote", () => {
  let revealState = createGame("purge-reveal");
  revealState.round = 8;
  revealState.phase = "purge";
  const revealA = cardWithRole(revealState, "A", "seer");
  const revealB = cardWithRole(revealState, "B", "wolf");
  revealState = dispatch(revealState, { type: "purge.submit", seat: "A", target: revealA.id });
  revealState = dispatch(revealState, { type: "purge.submit", seat: "B", target: revealB.id });
  assert.equal(revealState.players.A.board.find((card) => card.instanceId === revealA.instanceId).revealed, true);
  assert.equal(revealState.players.B.board.find((card) => card.instanceId === revealB.instanceId).revealed, true);

  let lockState = createGame("purge-lock");
  lockState.round = 9;
  lockState.phase = "purge";
  const lockedSeer = cardWithRole(lockState, "A", "seer");
  const lockB = cardWithRole(lockState, "B", "wolf");
  lockState = dispatch(lockState, { type: "purge.submit", seat: "A", target: lockedSeer.id });
  lockState = dispatch(lockState, { type: "purge.submit", seat: "B", target: lockB.id });
  lockState.phase = "night-plan";
  assert.throws(
    () => dispatch(lockState, { type: "night.submit", seat: "A", kind: "inspect", source: lockedSeer.id, target: lockB.id }),
    /Khóa mạch/,
  );

  let voteLockState = createGame("purge-vote-lock");
  voteLockState.round = 9;
  voteLockState.phase = "purge";
  const lockedVoter = cardWithRole(voteLockState, "A", "villager");
  const voteLockB = cardWithRole(voteLockState, "B", "wolf");
  voteLockState = dispatch(voteLockState, { type: "purge.submit", seat: "A", target: lockedVoter.id });
  voteLockState = dispatch(voteLockState, { type: "purge.submit", seat: "B", target: voteLockB.id });
  voteLockState.phase = "council";
  const otherVoter = stateVillageRole(voteLockState, "A", [lockedVoter.id]);
  assert.throws(
    () => dispatch(voteLockState, {
      type: "council.submit",
      seat: "A",
      kind: "accuse",
      target: voteLockB.id,
      guess: voteLockB.role,
      voters: [lockedVoter.id, otherVoter.id],
    }),
    /Khóa mạch/,
  );
});
