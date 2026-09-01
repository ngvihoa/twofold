export const ROLE_DEFS = {
  villager: { name: "Dân làng", faction: "village" },
  wolf: { name: "Ma sói", faction: "werewolf" },
  seer: { name: "Tiên tri", faction: "village" },
  guard: { name: "Bảo vệ", faction: "village" },
  witch: { name: "Phù thủy", faction: "village" },
  shooter: { name: "Xạ thủ", faction: "village" },
  avenger: { name: "Kẻ báo thù", faction: "village" },
  priest: { name: "Mục sư", faction: "village" },
  substitute: { name: "Kẻ Thế Mạng", faction: "werewolf" },
};

export const BASE_DECK = [
  "villager", "wolf", "wolf", "seer", "guard",
  "witch", "shooter", "avenger", "priest", "substitute",
];

export const SPECIAL_CARD = {
  key: "bloodmoon",
  name: "Huyết Nguyệt",
  unlockRound: 6,
  cooldownRounds: 2,
};

const otherSeat = (seat) => seat === "A" ? "B" : "A";

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

function shuffledDeck(seed, seat) {
  const random = randomFromSeed(`${seed}:${seat}`);
  const deck = [...BASE_DECK];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck.map((role, index) => ({
    id: `${seat}${index + 1}`,
    instanceId: `${seat}:${index + 1}`,
    owner: seat,
    role,
    alive: true,
    revealed: false,
    shielded: false,
    seerInspected: null,
    dayExhausted: false,
    voteCooldown: 0,
    purgeLockedRound: -1,
    uses: {
      guard: role === "guard" ? Infinity : 0,
      seer: role === "seer" ? Infinity : 0,
      revive: role === "witch" ? 1 : 0,
      poison: role === "witch" ? 1 : 0,
      bullet: role === "shooter" ? 1 : 0,
      holyWater: role === "priest" ? 1 : 0,
      sacrifice: role === "substitute" ? 1 : 0,
    },
  }));
}

export function createGame(seed = "twofold-01") {
  return {
    seed,
    round: 1,
    phase: "setup-A",
    firstSeat: "A",
    players: {
      A: { board: shuffledDeck(seed, "A"), setupLocked: false, eliminationSpent: false, bloodMoonReadyRound: SPECIAL_CARD.unlockRound, council: null, defense: null, purge: null, lastGuardTarget: null, revengeTarget: null, night: null, finalGuess: null, notes: [] },
      B: { board: shuffledDeck(seed, "B"), setupLocked: false, eliminationSpent: false, bloodMoonReadyRound: SPECIAL_CARD.unlockRound, council: null, defense: null, purge: null, lastGuardTarget: null, revengeTarget: null, night: null, finalGuess: null, notes: [] },
    },
    councilBatch: null,
    result: null,
    log: ["Hai bên bí mật xếp thứ tự 10 lá trước khi lên bàn."],
  };
}

const clone = (state) => structuredClone(state);

function addLog(state, message) {
  state.log.push(message);
  state.log = state.log.slice(-10);
}

function assertSeat(seat) {
  if (!['A', 'B'].includes(seat)) throw new Error("Seat phải là A hoặc B.");
}

function cardById(state, id) {
  const seat = id?.slice(0, 1)?.toUpperCase();
  assertSeat(seat);
  const card = ["A", "B"].flatMap((owner) => state.players[owner].board).find((item) => item.id === id.toUpperCase());
  if (!card) throw new Error(`Không tìm thấy lá ${id}.`);
  return card;
}

function livingCards(state, seat) {
  return state.players[seat].board.filter((card) => card.alive);
}

function councilVotePower(cards) {
  return cards.reduce((total, card) => total + (card.role === "villager" ? 2 : 1), 0);
}

export function availableRoleGuesses(state, targetSeat) {
  assertSeat(targetSeat);
  const remaining = BASE_DECK.reduce((counts, role) => ({ ...counts, [role]: (counts[role] || 0) + 1 }), {});
  for (const card of state.players[targetSeat].board) {
    if (card.revealed) remaining[card.role] = Math.max(0, remaining[card.role] - 1);
  }
  return Object.keys(ROLE_DEFS).filter((role) => remaining[role] > 0);
}

function reveal(card) {
  card.revealed = true;
}

function eliminate(state, card, cause) {
  if (!card.alive) return;
  const owner = state.players[card.owner];
  const revengeTarget = card.role === "avenger" ? owner.revengeTarget : null;
  if (card.role === "avenger") owner.revengeTarget = null;
  card.alive = false;
  card.shielded = false;
  reveal(card);
  addLog(state, `${card.id} chết do ${cause}. Role: ${ROLE_DEFS[card.role].name}.`);
  if (revengeTarget) {
    const target = cardById(state, revengeTarget);
    if (target.alive && target.shielded) addLog(state, `${target.id} được khiên chặn báo thù của ${card.id}.`);
    else if (target.alive) eliminate(state, target, `báo thù của ${card.id}`);
  }
}

function revealAll(state) {
  for (const card of ["A", "B"].flatMap((seat) => state.players[seat].board)) reveal(card);
}

function finishMatch(state, result) {
  state.phase = "ended";
  state.result = result;
  revealAll(state);
  addLog(state, result.winner ? `${result.winner} thắng: ${result.reason}.` : `Hòa: ${result.reason}.`);
}

function checkWinner(state) {
  const aliveA = livingCards(state, "A").length;
  const aliveB = livingCards(state, "B").length;
  if (aliveA && aliveB) return false;
  const result = !aliveA && !aliveB
    ? { winner: null, reason: "Hai board cùng hết bài" }
    : { winner: aliveA ? "A" : "B", reason: `${aliveA ? "B" : "A"} hết bài` };
  finishMatch(state, result);
  return true;
}

function maybeEnterFinalDuel(state) {
  if (livingCards(state, "A").length === 1 && livingCards(state, "B").length === 1) {
    state.phase = "final-duel";
    addLog(state, "Mỗi bên còn một lá. Final Duel bắt đầu.");
    return true;
  }
  return false;
}

function validateSource(state, seat, sourceId, role) {
  const source = cardById(state, sourceId);
  if (!source.alive || source.owner !== seat) throw new Error("Source không hợp lệ hoặc đã chết.");
  if (source.role !== role) throw new Error(`${source.id} không phải ${ROLE_DEFS[role].name}.`);
  if (source.purgeLockedRound === state.round) throw new Error(`${source.id} đang bị Khóa mạch và không thể dùng kỹ năng trong vòng này.`);
  return source;
}

function submitSetup(state, action) {
  const expected = state.phase === "setup-A" ? "A" : state.phase === "setup-B" ? "B" : null;
  if (!expected || action.seat !== expected) throw new Error(`Đang là lượt xếp đội hình của ${expected || "không ai"}.`);
  const player = state.players[action.seat];
  const currentIds = player.board.map((card) => card.id).sort();
  const submittedIds = [...action.order].map((id) => id.toUpperCase());
  if (submittedIds.length !== 10 || new Set(submittedIds).size !== 10 || submittedIds.slice().sort().join("|") !== currentIds.join("|")) {
    throw new Error("Đội hình phải chứa đúng 10 lá hiện có, không trùng vị trí.");
  }
  const byId = new Map(player.board.map((card) => [card.id, card]));
  player.board = submittedIds.map((id, index) => ({ ...byId.get(id), id: `${action.seat}${index + 1}` }));
  player.setupLocked = true;
  addLog(state, `${action.seat} đã khóa thứ tự đội hình.`);
  if (action.seat === "A") state.phase = "setup-B";
  else {
    state.phase = "day-A";
    addLog(state, "Hai đội hình đã lên bàn. Ban ngày Vòng 1 bắt đầu; chưa có Hội đồng.");
  }
}

export function purgeRule(round) {
  return ["cut", "swap", "reveal", "lock"][(round - 6) % 4];
}

function finishPurge(state) {
  state.players.A.purge = null;
  state.players.B.purge = null;
  if (checkWinner(state)) return;
  if (maybeEnterFinalDuel(state)) return;
  state.phase = "day-A";
  addLog(state, `Thanh trừng Vòng ${state.round} hoàn tất. Bên A bắt đầu Ban ngày.`);
}

function resolvePurge(state) {
  const choices = [state.players.A.purge, state.players.B.purge];
  const rule = purgeRule(state.round);

  if (rule === "swap") {
    const selectedIds = choices.flatMap((choice) => [choice.target, choice.swapTarget]);
    if (new Set(selectedIds).size !== selectedIds.length) {
      addLog(state, "Đảo chiến tuyến xung đột mục tiêu; toàn bộ batch fizzle và không card nào đổi vị trí.");
      finishPurge(state);
      return;
    }
    const positionChanges = new Map();
    const previousPositions = new Map();
    for (const choice of choices) {
      const ownCard = cardById(state, choice.target);
      const enemyCard = cardById(state, choice.swapTarget);
      previousPositions.set(ownCard.instanceId, ownCard.id);
      previousPositions.set(enemyCard.instanceId, enemyCard.id);
      positionChanges.set(ownCard.instanceId, enemyCard.id);
      positionChanges.set(enemyCard.instanceId, ownCard.id);
    }
    const notePositionChanges = new Map([...positionChanges].map(([instanceId, nextId]) => [previousPositions.get(instanceId), nextId]));
    for (const card of ["A", "B"].flatMap((seat) => state.players[seat].board)) {
      if (positionChanges.has(card.instanceId)) card.id = positionChanges.get(card.instanceId);
    }
    for (const seat of ["A", "B"]) {
      state.players[seat].notes = state.players[seat].notes.map((note) => note.replace(/[AB]\d+/g, (id) => notePositionChanges.get(id) || id));
    }
    addLog(state, "Đảo chiến tuyến resolve đồng thời; bốn card đổi vị trí nhưng identity, owner và role không đổi.");
    finishPurge(state);
    return;
  }

  for (const choice of choices) {
    if (choice.target === null) continue;
    const card = cardById(state, choice.target);
    if (rule === "cut") eliminate(state, card, `Cắt bỏ Vòng ${state.round}`);
    if (rule === "reveal") reveal(card);
    if (rule === "lock") card.purgeLockedRound = state.round;
  }
  if (rule === "reveal") addLog(state, "Ép lộ diện đã công khai các target được chọn.");
  if (rule === "lock") addLog(state, "Khóa mạch đã vô hiệu skill và quyền Vote của các target trong vòng hiện tại.");
  finishPurge(state);
}

function submitPurge(state, action) {
  if (state.phase !== "purge") throw new Error("Hiện không phải pha Thanh trừng.");
  assertSeat(action.seat);
  if (state.players[action.seat].purge) throw new Error(`${action.seat} đã khóa Thanh trừng.`);
  const rule = purgeRule(state.round);

  if (rule === "reveal" && !livingCards(state, action.seat).some((card) => !card.revealed)) {
    if (action.target) throw new Error("Không còn lá ẩn để Ép lộ diện.");
    state.players[action.seat].purge = { rule, target: null };
    addLog(state, `${action.seat} không còn lá ẩn và đã khóa lựa chọn rỗng.`);
  } else {
    if (!action.target) throw new Error("Thanh trừng bắt buộc chọn một target hợp lệ.");
    const target = cardById(state, action.target);
    if (!target.alive || target.owner !== action.seat) throw new Error("Mục tiêu Thanh trừng phải là lá sống bên mình.");
    if (rule === "reveal" && target.revealed) throw new Error("Ép lộ diện cần một lá đang ẩn.");
    if (rule === "swap") {
      const enemy = cardById(state, action.swapTarget);
      if (!enemy.alive || enemy.owner !== otherSeat(action.seat)) throw new Error("Đảo chiến tuyến cần một lá đối thủ còn sống.");
      state.players[action.seat].purge = { rule, target: target.id, swapTarget: enemy.id };
    } else {
      state.players[action.seat].purge = { rule, target: target.id };
    }
    addLog(state, `${action.seat} đã khóa lựa chọn Thanh trừng.`);
  }
  if (rule === "swap" && !state.players[otherSeat(action.seat)].purge) {
    const reservedIds = new Set([state.players[action.seat].purge.target, state.players[action.seat].purge.swapTarget]);
    const responder = otherSeat(action.seat);
    const hasOwnChoice = livingCards(state, responder).some((card) => !reservedIds.has(card.id));
    const hasEnemyChoice = livingCards(state, action.seat).some((card) => !reservedIds.has(card.id));
    if (!hasOwnChoice || !hasEnemyChoice) {
      addLog(state, `${responder} không còn lựa chọn không xung đột; batch Đảo chiến tuyến tự fizzle.`);
      finishPurge(state);
      return;
    }
  }
  if (state.players.A.purge && state.players.B.purge) resolvePurge(state);
}

function finishCouncil(state) {
  state.players.A.council = null;
  state.players.B.council = null;
  state.councilBatch = null;
  if (checkWinner(state)) return;
  if (maybeEnterFinalDuel(state)) return;
  state.phase = "night-plan";
  addLog(state, "Hội đồng đã hoàn tất. Hai bên bí mật khóa lệnh đêm.");
}

function resolveCouncilBatch(state) {
  const pendingDeaths = [];
  for (const outcome of state.councilBatch.outcomes) {
    const target = cardById(state, outcome.target);
    if (outcome.reaction.use) {
      const substitute = cardById(state, outcome.reaction.source);
      substitute.uses.sacrifice -= 1;
      reveal(substitute);
      pendingDeaths.push({ target: substitute, cause: `chết thay ${target.id}` });
      addLog(state, `${substitute.id} lộ diện và chấp nhận chết thay ${target.id}; ${target.id} sống nhưng vẫn lộ role.`);
    } else {
      pendingDeaths.push({ target, cause: `Hội đồng của ${outcome.attackerSeat}` });
      addLog(state, `${outcome.attackerSeat} đạt ${outcome.votePower} phiếu và Treo cổ ${target.id}.`);
    }
  }
  for (const item of pendingDeaths) eliminate(state, item.target, item.cause);
  finishCouncil(state);
}

function prepareCouncilResolution(state) {
  const outcomes = [];
  const oldCooldownCards = [];
  for (const seat of ["A", "B"]) {
    for (const card of state.players[seat].board) {
      if (card.voteCooldown > 0) oldCooldownCards.push(card);
    }
  }

  for (const seat of ["A", "B"]) {
    const submission = state.players[seat].council;
    if (submission.kind === "pass") {
      addLog(state, `${seat} bỏ qua Hội đồng.`);
      continue;
    }
    const voters = submission.voters.map((id) => cardById(state, id));
    const validVotes = voters.filter((card) => card.alive && card.owner === seat && ROLE_DEFS[card.role].faction === "village" && !card.dayExhausted && card.voteCooldown === 0 && card.purgeLockedRound !== state.round);
    for (const voter of validVotes) reveal(voter);
    const target = cardById(state, submission.target);
    const votePower = councilVotePower(validVotes);
    const correct = votePower >= 3 && target.alive && target.owner === otherSeat(seat) && (target.revealed || target.role === submission.guess);

    if (correct) {
      const defenderSeat = otherSeat(seat);
      reveal(target);
      outcomes.push({ attackerSeat: seat, defenderSeat, target: target.id, votePower, reaction: null });
      addLog(state, `${seat} đạt ${votePower} phiếu và buộc tội đúng ${target.id}. Role target đã lộ; Hội đồng chờ reaction kín.`);
    } else {
      for (const voter of validVotes) voter.voteCooldown = 1;
      addLog(state, `${seat} buộc tội thất bại với ${votePower} phiếu hợp lệ.`);
    }
  }

  for (const card of oldCooldownCards) card.voteCooldown = Math.max(0, card.voteCooldown - 1);
  if (!outcomes.length) return finishCouncil(state);
  state.councilBatch = { outcomes };
  state.phase = "council-reaction";
  addLog(state, "Án Treo cổ hợp lệ đang ở reaction window trung tính.");
}

function submitCouncilReaction(state, action) {
  if (state.phase !== "council-reaction" || !state.councilBatch) throw new Error("Hiện không phải reaction window của Hội đồng.");
  assertSeat(action.seat);
  const outcome = state.councilBatch.outcomes.find((item) => item.defenderSeat === action.seat);
  if (!outcome) throw new Error(`${action.seat} không có án Treo cổ cần phản ứng.`);
  if (outcome.reaction !== null) throw new Error(`${action.seat} đã khóa phản ứng Hội đồng.`);

  if (action.use) {
    const substitute = state.players[action.seat].board.find((card) => card.role === "substitute" && card.alive && card.uses.sacrifice > 0);
    if (!substitute) throw new Error("Không còn Kẻ Thế Mạng hợp lệ.");
    if (substitute.id === outcome.target) throw new Error("Kẻ Thế Mạng không thể chết thay cho chính mình.");
    outcome.reaction = { use: true, source: substitute.id };
  } else {
    outcome.reaction = { use: false };
  }
  addLog(state, `${action.seat} đã khóa phản ứng Hội đồng.`);
  if (state.councilBatch.outcomes.every((item) => item.reaction !== null)) resolveCouncilBatch(state);
}

function submitCouncil(state, action) {
  if (state.phase !== "council") throw new Error("Hiện không phải pha Hội đồng.");
  if (state.round < 2) throw new Error("Hội đồng chỉ mở từ Vòng 2.");
  assertSeat(action.seat);
  if (state.players[action.seat].council) throw new Error(`${action.seat} đã khóa Hội đồng.`);

  if (action.pass || action.kind === "pass") {
    state.players[action.seat].council = { kind: "pass" };
  } else {
    if (state.players[action.seat].eliminationSpent) throw new Error("Quyền loại bỏ của vòng đã dùng.");
    const target = cardById(state, action.target);
    if (!target.alive || target.owner !== otherSeat(action.seat)) throw new Error("Target Hội đồng không hợp lệ.");
    const guess = target.revealed ? target.role : action.guess;
    if (!target.revealed && !ROLE_DEFS[guess]) throw new Error("Role đoán không hợp lệ.");
    if (!target.revealed && !availableRoleGuesses(state, otherSeat(action.seat)).includes(guess)) throw new Error("Role này không còn trong các khả năng chưa lộ.");
    if (!Array.isArray(action.voters) || action.voters.length < 1 || action.voters.length > 3 || new Set(action.voters).size !== action.voters.length) {
      throw new Error("Hội đồng chỉ nhận tối đa ba role Dân khác nhau.");
    }
    const voters = [];
    for (const id of action.voters) {
      const voter = cardById(state, id);
      if (!voter.alive || voter.owner !== action.seat) throw new Error(`${id} không thể bỏ phiếu.`);
      if (ROLE_DEFS[voter.role].faction !== "village") throw new Error(`${id} không thuộc phe Dân nên không thể lập Hội đồng.`);
      if (voter.dayExhausted) throw new Error(`${id} đã dùng kỹ năng trong vòng này nên không thể tham gia Hội đồng.`);
      if (voter.voteCooldown > 0) throw new Error(`${id} đang bị khóa vote.`);
      if (voter.purgeLockedRound === state.round) throw new Error(`${id} đang bị Khóa mạch và không thể tham gia Vote trong vòng này.`);
      voters.push(voter);
    }
    if (councilVotePower(voters) < 3) throw new Error("Cần đủ 3 phiếu để lập Hội đồng.");
    state.players[action.seat].council = { kind: "accuse", target: target.id, guess, targetWasRevealed: target.revealed, voters: action.voters.map((id) => id.toUpperCase()) };
  }
  addLog(state, `${action.seat} đã khóa lựa chọn Hội đồng.`);
  if (state.players.A.council && state.players.B.council) prepareCouncilResolution(state);
}

function advanceDay(state, seat) {
  if (checkWinner(state)) return;
  if (maybeEnterFinalDuel(state)) return;
  state.phase = seat === "A" ? "day-B" : state.round >= 2 ? "council" : "night-plan";
  if (state.phase === "council") addLog(state, "Ban ngày đã hoàn tất. Hội đồng mở khi đạt đủ 3 phiếu phe Dân.");
  if (state.phase === "night-plan") addLog(state, "Hai bên bí mật khóa lệnh đêm. Mục tiêu chưa công khai.");
}

function submitDay(state, action) {
  const expected = state.phase === "day-A" ? "A" : state.phase === "day-B" ? "B" : null;
  if (!expected || action.seat !== expected) throw new Error(`Đang là lượt Ban ngày của ${expected || "không ai"}.`);
  const player = state.players[action.seat];

  if (action.kind === "pass") {
    addLog(state, `${action.seat} bỏ lượt Ban ngày.`);
    advanceDay(state, action.seat);
    return;
  }

  if (action.kind === "shoot") {
    if (player.eliminationSpent) throw new Error("Quyền loại bỏ của vòng đã dùng.");
    const source = validateSource(state, action.seat, action.source, "shooter");
    if (source.dayExhausted) throw new Error("Xạ thủ đã tham gia bỏ phiếu trong vòng này.");
    if (source.uses.bullet < 1) throw new Error("Xạ thủ đã hết đạn.");
    const target = cardById(state, action.target);
    if (!target.alive || target.owner !== otherSeat(action.seat) || !target.revealed) throw new Error("Xạ thủ chỉ bắn được role đối thủ đã lộ.");
    const opponentRevealCount = state.players[otherSeat(action.seat)].board.filter((card) => card.revealed).length;
    if (opponentRevealCount < 2) throw new Error("Xạ thủ chưa kích hoạt. Đối thủ cần có ít nhất hai role đã lộ.");
    source.uses.bullet -= 1;
    source.dayExhausted = true;
    player.eliminationSpent = true;
    reveal(source);
    eliminate(state, target, `phát bắn từ Xạ thủ ẩn của ${action.seat}`);
    advanceDay(state, action.seat);
    return;
  }

  if (action.kind === "mark") {
    const source = validateSource(state, action.seat, action.source, "avenger");
    if (source.dayExhausted) throw new Error("Kẻ báo thù đã tham gia bỏ phiếu trong vòng này.");
    const target = cardById(state, action.target);
    if (!target.alive || target.owner !== otherSeat(action.seat)) throw new Error("Mục tiêu báo thù không hợp lệ.");
    reveal(source);
    source.dayExhausted = true;
    player.revengeTarget = target.id;
    addLog(state, `${source.id} công khai đánh dấu ${target.id}. Nếu chết trước bình minh, mục tiêu sẽ chết theo.`);
    advanceDay(state, action.seat);
    return;
  }

  if (action.kind === "purify") {
    if (player.eliminationSpent) throw new Error("Quyền loại bỏ của vòng đã dùng.");
    const source = validateSource(state, action.seat, action.source, "priest");
    if (source.dayExhausted) throw new Error("Mục sư đã tham gia bỏ phiếu trong vòng này.");
    if (source.uses.holyWater < 1) throw new Error("Mục sư đã dùng nước thánh.");
    const target = cardById(state, action.target);
    if (!target.alive || target.owner !== otherSeat(action.seat)) throw new Error("Mục tiêu thanh tẩy không hợp lệ.");
    source.uses.holyWater -= 1;
    source.dayExhausted = true;
    player.eliminationSpent = true;
    reveal(source);
    if (ROLE_DEFS[target.role].faction === "werewolf") eliminate(state, target, `nước thánh của ${source.id}`);
    else eliminate(state, source, `thanh tẩy nhầm ${target.id}`);
    advanceDay(state, action.seat);
    return;
  }

  if (action.kind === "revive") {
    const source = validateSource(state, action.seat, action.source, "witch");
    if (source.dayExhausted) throw new Error("Phù thủy đã tham gia bỏ phiếu trong vòng này.");
    if (source.uses.revive < 1) throw new Error("Phù thủy đã dùng hồi sinh.");
    const target = cardById(state, action.target);
    if (target.alive || target.owner !== action.seat) throw new Error("Chỉ hồi sinh được lá đã chết bên mình.");
    source.uses.revive -= 1;
    source.dayExhausted = true;
    reveal(source);
    target.alive = true;
    addLog(state, `${action.seat} dùng Phù thủy hồi sinh ${target.id}. Role hồi sinh vẫn công khai.`);
    advanceDay(state, action.seat);
    return;
  }

  throw new Error("Day action không được hỗ trợ.");
}

function resolveDefenses(state) {
  for (const seat of ["A", "B"]) {
    const targetId = state.players[seat].defense;
    if (!targetId) {
      addLog(state, `${seat} không đặt khiên.`);
      continue;
    }
    const guard = state.players[seat].board.find((card) => card.alive && card.role === "guard" && card.uses.guard > 0 && card.purgeLockedRound !== state.round);
    if (!guard) throw new Error(`${seat} không còn Bảo vệ hợp lệ.`);
    guard.uses.guard -= 1;
    const target = cardById(state, targetId);
    target.shielded = true;
    state.players[seat].lastGuardTarget = target.instanceId;
    addLog(state, `${seat} đã khóa một target phòng thủ; vị trí vẫn được giữ kín.`);
  }
  state.phase = "night-resolution";
  addLog(state, "Hai bên đã khóa Phòng thủ; target vẫn kín cho tới khi có outcome công khai.");
}

function submitDefense(state, action) {
  if (state.phase !== "dusk-defense") throw new Error("Hiện không phải pha đặt khiên.");
  assertSeat(action.seat);
  if (state.players[action.seat].defense !== null) throw new Error(`${action.seat} đã khóa Defense Order.`);
  if (action.pass) {
    state.players[action.seat].defense = "PASS";
  } else {
    const target = cardById(state, action.target);
    if (!target.alive || target.owner !== action.seat) throw new Error("Chỉ bảo vệ được lá sống bên mình.");
    if (state.players[action.seat].lastGuardTarget === target.instanceId) throw new Error("Không được bảo vệ cùng một lá hai vòng liên tiếp.");
    const guard = state.players[action.seat].board.find((card) => card.alive && card.role === "guard" && card.uses.guard > 0);
    if (!guard || guard.purgeLockedRound === state.round) throw new Error("Không còn Bảo vệ hợp lệ.");
    if (target.id === guard.id) throw new Error("Bảo vệ không được tự bảo vệ.");
    state.players[action.seat].defense = target.id;
  }
  addLog(state, `${action.seat} đã khóa Defense Order.`);
  if (state.players.A.defense !== null && state.players.B.defense !== null) {
    for (const seat of ["A", "B"]) if (state.players[seat].defense === "PASS") state.players[seat].defense = "";
    resolveDefenses(state);
  }
}

function validateNightAction(state, action) {
  if (action.kind === "pass") return;
  if (action.kind === "attack") {
    validateSource(state, action.seat, action.source, "wolf");
    if (state.players[action.seat].eliminationSpent) throw new Error("Quyền loại bỏ của vòng đã dùng.");
  } else if (action.kind === "inspect") {
    const source = validateSource(state, action.seat, action.source, "seer");
    if (source.uses.seer < 1) throw new Error("Tiên tri đã hết lượt soi.");
    const target = cardById(state, action.target);
    if (target.seerInspected === "light") throw new Error("Lá phe sáng này đã được soi và không thể soi lại.");
  } else if (action.kind === "poison") {
    const source = validateSource(state, action.seat, action.source, "witch");
    if (source.dayExhausted) throw new Error("Phù thủy đã dùng kỹ năng trong vòng này.");
    if (source.uses.poison < 1) throw new Error("Phù thủy đã dùng độc.");
    if (state.players[action.seat].eliminationSpent) throw new Error("Quyền loại bỏ của vòng đã dùng.");
  } else if (action.kind === "bloodmoon") {
    if (state.round < SPECIAL_CARD.unlockRound) throw new Error(`${SPECIAL_CARD.name} chỉ mở từ Vòng ${SPECIAL_CARD.unlockRound}.`);
    if (state.players[action.seat].bloodMoonReadyRound > state.round) throw new Error(`${SPECIAL_CARD.name} hồi lại ở Vòng ${state.players[action.seat].bloodMoonReadyRound}.`);
    if (state.players[action.seat].eliminationSpent) throw new Error("Quyền loại bỏ của vòng đã dùng.");
  } else {
    throw new Error("Night action không được hỗ trợ.");
  }
  const target = cardById(state, action.target);
  if (!target.alive || target.owner !== otherSeat(action.seat)) throw new Error("Night target không hợp lệ.");
  if (action.kind === "bloodmoon" && !target.revealed) throw new Error(`${SPECIAL_CARD.name} chỉ đánh được role đã lộ.`);
}

function stageNight(state) {
  state.phase = "dusk-defense";
  addLog(state, "Hai lệnh đêm đã khóa kín source và target. Hai bên chọn vị trí đặt khiên từ thông tin công khai.");
}

function resolveNight(state) {
  const pendingDeaths = [];
  for (const seat of ["A", "B"]) {
    const action = state.players[seat].night;
    if (action.kind === "pass") {
      addLog(state, `${seat} bỏ Main Order ban đêm.`);
      continue;
    }
    const target = cardById(state, action.target);

    if (action.kind === "bloodmoon") {
      state.players[seat].eliminationSpent = true;
      state.players[seat].bloodMoonReadyRound = state.round + SPECIAL_CARD.cooldownRounds;
      if (target.shielded) addLog(state, `${target.id} được khiên chặn đòn ${SPECIAL_CARD.name} của ${seat}.`);
      else pendingDeaths.push({ target, cause: `${SPECIAL_CARD.name} của ${seat}` });
      continue;
    }

    const source = cardById(state, action.source);

    if (action.kind === "inspect") {
      source.uses.seer -= 1;
      if (target.seerInspected === "dark") {
        reveal(source);
        if (target.shielded) addLog(state, `${target.id} được khiên chặn đòn kết liễu của Tiên tri ${seat}.`);
        else pendingDeaths.push({ target, cause: `Tiên tri kết liễu ${target.id}` });
      } else {
        target.seerInspected = ROLE_DEFS[target.role].faction === "werewolf" ? "dark" : "light";
        state.players[seat].notes.push(`V${state.round}: ${target.id} là ${ROLE_DEFS[target.role].name}.`);
      }
      continue;
    }

    state.players[seat].eliminationSpent = true;
    if (action.kind === "poison") source.uses.poison -= 1;
    if (target.shielded) {
      addLog(state, `${target.id} được khiên cứu khỏi một hiệu ứng loại bỏ ban đêm; loại lệnh vẫn được giữ kín.`);
    } else {
      pendingDeaths.push({ target, cause: action.kind === "attack" ? `Ma sói của ${seat}` : `độc của ${seat}` });
    }
  }

  for (const item of pendingDeaths) eliminate(state, item.target, item.cause);
  for (const seat of ["A", "B"]) {
    const player = state.players[seat];
    player.defense = null;
    player.night = null;
    player.eliminationSpent = false;
    if (player.revengeTarget) {
      addLog(state, `Dấu báo thù của ${seat} hết hiệu lực tại bình minh.`);
      player.revengeTarget = null;
    }
    for (const card of player.board) {
      card.shielded = false;
      card.dayExhausted = false;
    }
  }
  if (checkWinner(state)) return;
  state.round += 1;
  state.phase = state.round >= 6 ? "purge" : "day-A";
  addLog(state, `Bình minh Vòng ${state.round}.`);
  if (state.round === SPECIAL_CARD.unlockRound) addLog(state, `${SPECIAL_CARD.name} thức tỉnh cho cả hai bên; dùng lại sau mỗi ${SPECIAL_CARD.cooldownRounds} vòng.`);
  if (state.round < 2) addLog(state, `Vòng ${state.round} chưa mở treo cổ. Bên A bắt đầu lượt Ban ngày.`);
  maybeEnterFinalDuel(state);
}

function submitNight(state, action) {
  if (state.phase !== "night-plan") throw new Error("Hiện không phải pha khóa lệnh đêm.");
  assertSeat(action.seat);
  if (state.players[action.seat].night) throw new Error(`${action.seat} đã khóa Main Order.`);
  validateNightAction(state, action);
  state.players[action.seat].night = { ...action };
  addLog(state, `${action.seat} đã khóa Main Order ban đêm.`);
  if (state.players.A.night && state.players.B.night) stageNight(state);
}

function submitNightResolution(state) {
  if (state.phase !== "night-resolution") throw new Error("Đêm chưa sẵn sàng xử lý.");
  resolveNight(state);
}

function submitFinalGuess(state, action) {
  if (state.phase !== "final-duel") throw new Error("Hiện không phải Final Duel.");
  assertSeat(action.seat);
  if (!ROLE_DEFS[action.guess]) throw new Error("Role đoán không hợp lệ.");
  if (state.players[action.seat].finalGuess) throw new Error(`${action.seat} đã khóa dự đoán Final Duel.`);
  state.players[action.seat].finalGuess = action.guess;
  addLog(state, `${action.seat} đã khóa dự đoán Final Duel.`);
  if (!state.players.A.finalGuess || !state.players.B.finalGuess) return;

  const cardA = livingCards(state, "A")[0];
  const cardB = livingCards(state, "B")[0];
  const correctA = state.players.A.finalGuess === cardB.role;
  const correctB = state.players.B.finalGuess === cardA.role;
  const result = correctA && correctB
    ? { winner: null, reason: "Hai bên cùng đoán đúng Final Duel" }
    : correctA || correctB
      ? { winner: correctA ? "A" : "B", reason: "Đoán đúng role cuối" }
      : { winner: null, reason: "Hai bên cùng đoán sai Final Duel" };
  finishMatch(state, result);
}

export function dispatch(currentState, action) {
  if (action.type === "match.rematch") {
    if (currentState.phase !== "ended") throw new Error("Chỉ có thể đấu lại sau khi ván đấu kết thúc.");
    return createGame(action.seed || `${currentState.seed}-rematch`);
  }
  if (currentState.phase === "ended") throw new Error("Ván đấu đã kết thúc.");
  const state = clone(currentState);
  if (action.type === "setup.submit") submitSetup(state, action);
  else if (action.type === "purge.submit") submitPurge(state, action);
  else if (action.type === "council.submit") submitCouncil(state, action);
  else if (action.type === "council.react") submitCouncilReaction(state, action);
  else if (action.type === "day.submit") submitDay(state, action);
  else if (action.type === "defense.submit") submitDefense(state, action);
  else if (action.type === "night.submit") submitNight(state, action);
  else if (action.type === "night.resolve") submitNightResolution(state);
  else if (action.type === "final.submit") submitFinalGuess(state, action);
  else throw new Error("Action type không hợp lệ.");
  return state;
}

export function publicView(state) {
  const board = {};
  const cardsByPosition = ["A", "B"].flatMap((owner) => state.players[owner].board);
  for (const seat of ["A", "B"]) {
    board[seat] = cardsByPosition
      .filter((card) => card.id.startsWith(seat))
      .sort((left, right) => Number(left.id.slice(1)) - Number(right.id.slice(1)))
      .map((card) => ({
      id: card.id,
      instanceId: card.instanceId,
      owner: card.owner,
      alive: card.alive,
      role: card.revealed ? ROLE_DEFS[card.role].name : "?",
      faction: card.revealed ? ROLE_DEFS[card.role].faction : "?",
      shielded: false,
      staged: false,
      purgeLocked: card.purgeLockedRound === state.round,
      canVote: card.alive && card.revealed && ROLE_DEFS[card.role].faction === "village" && !card.dayExhausted && card.voteCooldown === 0 && card.purgeLockedRound !== state.round,
      votePower: card.alive && card.revealed && ROLE_DEFS[card.role].faction === "village" && !card.dayExhausted && card.voteCooldown === 0 && card.purgeLockedRound !== state.round ? card.role === "villager" ? 2 : 1 : 0,
    }));
  }
  return {
    round: state.round,
    phase: state.phase,
    elimination: { A: state.players.A.eliminationSpent ? "used" : "ready", B: state.players.B.eliminationSpent ? "used" : "ready" },
    special: {
      A: { unlocked: state.round >= SPECIAL_CARD.unlockRound, ready: state.round >= state.players.A.bloodMoonReadyRound, readyRound: state.players.A.bloodMoonReadyRound },
      B: { unlocked: state.round >= SPECIAL_CARD.unlockRound, ready: state.round >= state.players.B.bloodMoonReadyRound, readyRound: state.players.B.bloodMoonReadyRound },
    },
    alive: { A: livingCards(state, "A").length, B: livingCards(state, "B").length },
    purge: state.round >= 6 ? { active: state.phase === "purge", rule: purgeRule(state.round) } : null,
    board,
    result: state.result,
    log: [...state.log],
  };
}

export function privateView(state, seat) {
  assertSeat(seat);
  return {
    seat,
    hand: state.players[seat].board.map((card) => ({
      id: card.id,
      instanceId: card.instanceId,
      owner: card.owner,
      role: ROLE_DEFS[card.role].name,
      alive: card.alive,
      revealed: card.revealed,
      shielded: card.shielded,
      purgeLocked: card.purgeLockedRound === state.round,
      uses: card.uses,
    })),
    notes: [...state.players[seat].notes],
  };
}

export function chatSnapshot(state) {
  const view = publicView(state);
  const lines = [`[TWOFOLD · V${view.round} · ${view.phase.toUpperCase()}]`];
  for (const seat of ["A", "B"]) {
    const cards = ["A", "B"].flatMap((position) => view.board[position]).filter((card) => card.owner === seat);
    const revealed = cards
      .filter((card) => card.role !== "?")
      .map((card) => `${card.id}=${card.role}${card.alive ? "" : "†"}`);
    const shields = cards.filter((card) => card.shielded).map((card) => card.id);
    lines.push(`${seat}: ${view.alive[seat]}/10 sống · loại bỏ ${view.elimination[seat]} · lộ ${revealed.join(", ") || "—"}${shields.length ? ` · khiên ${shields.join(", ")}` : ""}`);
  }
  lines.push(`Gần nhất: ${view.log.slice(-3).join(" / ")}`);
  if (view.special.A.unlocked) lines.push(`${SPECIAL_CARD.name}: A ${view.special.A.ready ? "sẵn sàng" : `hồi V${view.special.A.readyRound}`} · B ${view.special.B.ready ? "sẵn sàng" : `hồi V${view.special.B.readyRound}`}`);
  if (view.result) lines.push(`Kết quả: ${view.result.winner || "HÒA"} — ${view.result.reason}`);
  return lines.join("\n");
}
