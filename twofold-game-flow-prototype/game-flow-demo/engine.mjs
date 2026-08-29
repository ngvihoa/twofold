export const ROLE_DEFS = {
  villager: { name: "Dân làng", faction: "village" },
  wolf: { name: "Ma sói", faction: "werewolf" },
  seer: { name: "Tiên tri", faction: "village" },
  guard: { name: "Bảo vệ", faction: "village" },
  witch: { name: "Phù thủy", faction: "village" },
  shooter: { name: "Xạ thủ", faction: "village" },
  avenger: { name: "Kẻ báo thù", faction: "village" },
  priest: { name: "Mục sư", faction: "village" },
  wolfguard: { name: "Sói Hộ Vệ", faction: "werewolf" },
};

export const BASE_DECK = [
  "villager", "wolf", "wolf", "seer", "guard",
  "witch", "shooter", "avenger", "priest", "wolfguard",
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
    role,
    alive: true,
    revealed: false,
    shielded: false,
    shieldedLastRound: -1,
    purgeLockedRound: -1,
    seerInspected: null,
    dayExhausted: false,
    voteCooldown: 0,
    uses: {
      guard: role === "guard" ? Infinity : 0,
      seer: role === "seer" ? Infinity : 0,
      revive: role === "witch" ? 1 : 0,
      poison: role === "witch" ? 1 : 0,
      bullet: role === "shooter" ? 1 : 0,
      holyWater: role === "priest" ? 1 : 0,
      rescue: role === "wolfguard" ? 1 : 0,
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
      A: { board: shuffledDeck(seed, "A"), setupLocked: false, eliminationSpent: false, bloodMoonReadyRound: SPECIAL_CARD.unlockRound, council: null, defense: null, purge: null, revengeTarget: null, night: null, finalGuess: null, notes: [] },
      B: { board: shuffledDeck(seed, "B"), setupLocked: false, eliminationSpent: false, bloodMoonReadyRound: SPECIAL_CARD.unlockRound, council: null, defense: null, purge: null, revengeTarget: null, night: null, finalGuess: null, notes: [] },
    },
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
  const card = state.players[seat].board.find((item) => item.id === id.toUpperCase());
  if (!card) throw new Error(`Không tìm thấy lá ${id}.`);
  return card;
}

function livingCards(state, seat) {
  return state.players[seat].board.filter((card) => card.alive);
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
  const owner = state.players[card.id.slice(0, 1)];
  const revengeTarget = card.role === "avenger" ? owner.revengeTarget : null;
  if (card.role === "avenger") owner.revengeTarget = null;
  card.alive = false;
  card.shielded = false;
  reveal(card);
  addLog(state, `${card.id} chết do ${cause}. Role: ${ROLE_DEFS[card.role].name}.`);
  if (revengeTarget) {
    const target = cardById(state, revengeTarget);
    if (target.alive) eliminate(state, target, `báo thù của ${card.id}`);
  }
}

function checkWinner(state) {
  const aliveA = livingCards(state, "A").length;
  const aliveB = livingCards(state, "B").length;
  if (aliveA && aliveB) return false;
  state.phase = "ended";
  if (!aliveA && !aliveB) state.result = { winner: null, reason: "Hai board cùng hết bài" };
  else state.result = { winner: aliveA ? "A" : "B", reason: `${aliveA ? "B" : "A"} hết bài` };
  addLog(state, state.result.winner ? `${state.result.winner} thắng: ${state.result.reason}.` : `Hòa: ${state.result.reason}.`);
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
  if (!source.alive || !source.id.startsWith(seat)) throw new Error("Source không hợp lệ hoặc đã chết.");
  if (source.role !== role) throw new Error(`${source.id} không phải ${ROLE_DEFS[role].name}.`);
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
    state.phase = "match-intro";
    addLog(state, "Hai đội hình đã lên bàn. Vòng 1 sắp bắt đầu; chưa có Hội đồng.");
  }
}

export function beginRound(state) {
  if (state.phase !== "match-intro") throw new Error("Chưa sẵn sàng bắt đầu Vòng 1.");
  const next = clone(state);
  next.phase = "day-A";
  addLog(next, "Bình minh đầu tiên. Bên A bắt đầu Ban ngày Vòng 1.");
  return next;
}

function purgeRule(round) {
  return ["cut", "swap", "reveal", "lock"][(round - 6) % 4];
}

function submitPurge(state, action) {
  if (state.phase !== "purge") throw new Error("Hiện không phải pha Thanh trừng.");
  assertSeat(action.seat);
  if (state.players[action.seat].purge) throw new Error(`${action.seat} đã khóa Thanh trừng.`);
  const rule = purgeRule(state.round);
  const target = cardById(state, action.target);
  if (!target.alive || !target.id.startsWith(action.seat) || target.purgeLockedRound === state.round) throw new Error("Mục tiêu Thanh trừng không hợp lệ.");
  if (rule === "cut") state.players[action.seat].purge = { rule, target: target.id };
  else if (rule === "reveal") {
    if (target.revealed) throw new Error("Ép lộ diện cần một lá đang ẩn.");
    state.players[action.seat].purge = { rule, target: target.id };
  } else if (rule === "lock") state.players[action.seat].purge = { rule, target: target.id };
  else {
    const enemy = cardById(state, action.swapTarget);
    if (!enemy.alive || !enemy.id.startsWith(otherSeat(action.seat))) throw new Error("Đảo chiến tuyến cần chọn một lá đối thủ còn sống.");
    state.players[action.seat].purge = { rule, target: target.id, swapTarget: enemy.id };
  }
  addLog(state, `${action.seat} đã khóa lựa chọn Thanh trừng.`);
  if (state.players.A.purge && state.players.B.purge) {
    for (const seat of ["A", "B"]) {
      const choice = state.players[seat].purge;
      const card = cardById(state, choice.target);
      if (choice.rule === "cut") eliminate(state, card, `Thanh trừng Vòng ${state.round}`);
      if (choice.rule === "reveal") reveal(card);
      if (choice.rule === "lock") card.purgeLockedRound = state.round;
      if (choice.rule === "swap") {
        const enemy = cardById(state, choice.swapTarget);
        const ownIndex = state.players[seat].board.indexOf(card);
        const enemyIndex = state.players[otherSeat(seat)].board.indexOf(enemy);
        const ownId = card.id;
        const enemyId = enemy.id;
        state.players[seat].board[ownIndex] = { ...enemy, id: ownId };
        state.players[otherSeat(seat)].board[enemyIndex] = { ...card, id: enemyId };
      }
    }
    state.players.A.purge = null;
    state.players.B.purge = null;
    if (!checkWinner(state)) state.phase = "day-A";
  }
}

function resolveCouncil(state) {
  const pendingDeaths = [];
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
    if (submission.kind === "protect") {
      addLog(state, `${seat} đã bí mật khóa một mục tiêu bảo kê.`);
      continue;
    }

    const voters = submission.voters.map((id) => cardById(state, id));
    const validVotes = voters.filter((card) => card.alive && card.id.startsWith(seat) && ROLE_DEFS[card.role].faction === "village" && card.voteCooldown === 0);
    for (const voter of validVotes) reveal(voter);
    const target = cardById(state, submission.target);
    const votePower = validVotes.reduce((total, voter) => total + (voter.role === "villager" ? 2 : 1), 0);
    const correct = votePower >= 3 && target.alive && target.id.startsWith(otherSeat(seat)) && (target.revealed || target.role === submission.guess);

    if (correct) {
      const defenderSeat = otherSeat(seat);
      const protection = state.players[defenderSeat].council;
      if (protection.kind === "protect" && protection.target === target.id) {
        const wolfguard = cardById(state, protection.source);
        wolfguard.uses.rescue -= 1;
        reveal(wolfguard);
        addLog(state, `${seat} đạt ${votePower} phiếu và buộc tội đúng, nhưng ${wolfguard.id} lộ diện để cứu ${target.id}.`);
      } else {
        pendingDeaths.push({ target, cause: `Hội đồng của ${seat}` });
        addLog(state, `${seat} đạt ${votePower} phiếu và buộc tội đúng ${target.id}.`);
      }
    } else {
      for (const voter of validVotes) voter.voteCooldown = 1;
      addLog(state, `${seat} buộc tội thất bại với ${votePower} phiếu hợp lệ.`);
    }
  }

  for (const card of oldCooldownCards) card.voteCooldown = Math.max(0, card.voteCooldown - 1);
  for (const item of pendingDeaths) eliminate(state, item.target, item.cause);
  state.players.A.council = null;
  state.players.B.council = null;
  if (!checkWinner(state)) state.phase = "day-A";
}

function submitCouncil(state, action) {
  if (state.phase === "purge") throw new Error("Thanh trừng cần được hoàn tất trước.");
  if (state.phase !== "council") throw new Error("Hiện không phải pha Hội đồng.");
  if (state.round < 2) throw new Error("Hội đồng chỉ mở từ Vòng 2.");
  assertSeat(action.seat);
  if (state.players[action.seat].council) throw new Error(`${action.seat} đã khóa Hội đồng.`);

  if (action.pass || action.kind === "pass") {
    state.players[action.seat].council = { kind: "pass" };
  } else if (action.kind === "protect") {
    const source = validateSource(state, action.seat, action.source, "wolfguard");
    if (source.uses.rescue < 1) throw new Error("Sói Hộ Vệ đã dùng quyền bảo kê.");
    const target = cardById(state, action.target);
    if (!target.alive || !target.id.startsWith(action.seat)) throw new Error("Chỉ bảo kê được lá sống bên mình.");
    state.players[action.seat].council = { kind: "protect", source: source.id, target: target.id };
  } else {
    if (state.players[action.seat].eliminationSpent) throw new Error("Quyền loại bỏ của vòng đã dùng.");
    const target = cardById(state, action.target);
    if (!target.alive || !target.id.startsWith(otherSeat(action.seat))) throw new Error("Target Hội đồng không hợp lệ.");
    const guess = target.revealed ? target.role : action.guess;
    if (!target.revealed && !ROLE_DEFS[guess]) throw new Error("Role đoán không hợp lệ.");
    if (!target.revealed && !availableRoleGuesses(state, otherSeat(action.seat)).includes(guess)) throw new Error("Role này không còn trong các khả năng chưa lộ.");
    if (action.voters.length !== 3 || new Set(action.voters).size !== 3) throw new Error("Cần đúng ba role đã lộ khác nhau để treo cổ.");
    for (const id of action.voters) {
      const voter = cardById(state, id);
      if (!voter.alive || !voter.id.startsWith(action.seat)) throw new Error(`${id} không thể bỏ phiếu.`);
      if (ROLE_DEFS[voter.role].faction !== "village") throw new Error(`${id} không thuộc phe Dân nên không thể lập Hội đồng.`);
      if (voter.voteCooldown > 0) throw new Error(`${id} đang bị khóa vote.`);
    }
    state.players[action.seat].council = { kind: "accuse", target: target.id, guess, targetWasRevealed: target.revealed, voters: action.voters.map((id) => id.toUpperCase()) };
  }
  addLog(state, `${action.seat} đã khóa lựa chọn Hội đồng.`);
  if (state.players.A.council && state.players.B.council) resolveCouncil(state);
}

function advanceDay(state, seat) {
  if (checkWinner(state)) return;
  state.phase = seat === "A" ? "day-B" : state.round >= 2 ? "council" : "night-plan";
  if (state.phase === "council") addLog(state, "Ban ngày đã hoàn tất. Hội đồng Vote mở với đúng 3 voter phe dân.");
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
    if (!target.alive || !target.id.startsWith(otherSeat(action.seat)) || !target.revealed) throw new Error("Xạ thủ chỉ bắn được role đối thủ đã lộ.");
    const opponentRevealCount = state.players[otherSeat(action.seat)].board.filter((card) => card.revealed).length;
    if (opponentRevealCount < 2) throw new Error("Xạ thủ chưa kích hoạt. Đối thủ cần có ít nhất hai role đã lộ.");
    source.uses.bullet -= 1;
    player.eliminationSpent = true;
    eliminate(state, target, `phát bắn từ Xạ thủ ẩn của ${action.seat}`);
    advanceDay(state, action.seat);
    return;
  }

  if (action.kind === "mark") {
    const source = validateSource(state, action.seat, action.source, "avenger");
    if (source.dayExhausted) throw new Error("Kẻ báo thù đã tham gia bỏ phiếu trong vòng này.");
    const target = cardById(state, action.target);
    if (!target.alive || !target.id.startsWith(otherSeat(action.seat))) throw new Error("Mục tiêu báo thù không hợp lệ.");
    reveal(source);
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
    if (!target.alive || !target.id.startsWith(otherSeat(action.seat))) throw new Error("Mục tiêu thanh tẩy không hợp lệ.");
    source.uses.holyWater -= 1;
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
    if (target.alive || !target.id.startsWith(action.seat)) throw new Error("Chỉ hồi sinh được lá đã chết bên mình.");
    source.uses.revive -= 1;
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
    const guard = state.players[seat].board.find((card) => card.alive && card.role === "guard" && card.uses.guard > 0);
    if (!guard) throw new Error(`${seat} không còn Bảo vệ hợp lệ.`);
    guard.uses.guard -= 1;
    const target = cardById(state, targetId);
    target.shielded = true;
    state.players[seat].lastGuardTarget = target.id;
    addLog(state, `${seat} công khai khiên tại ${target.id}. Role mục tiêu và Bảo vệ vẫn ẩn.`);
  }
  state.phase = "night-resolution";
  addLog(state, "Nguồn lệnh và vị trí có khiên đã lên sân. Đêm sẽ xử lý sau nhịp chờ.");
}

function submitDefense(state, action) {
  if (state.phase !== "dusk-defense") throw new Error("Hiện không phải pha đặt khiên.");
  assertSeat(action.seat);
  if (state.players[action.seat].defense !== null) throw new Error(`${action.seat} đã khóa Defense Order.`);
  if (action.pass) {
    state.players[action.seat].defense = "PASS";
  } else {
    const target = cardById(state, action.target);
    if (!target.alive || !target.id.startsWith(action.seat)) throw new Error("Chỉ bảo vệ được lá sống bên mình.");
    if (state.players[action.seat].lastGuardTarget === target.id) throw new Error("Không được bảo vệ cùng một lá hai đêm liên tiếp.");
    const guard = state.players[action.seat].board.find((card) => card.alive && card.role === "guard" && card.uses.guard > 0);
    if (target.id === guard?.id) throw new Error("Bảo vệ không được tự bảo vệ.");
    if (!guard) throw new Error("Không còn Bảo vệ hợp lệ.");
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
  if (!target.alive || !target.id.startsWith(otherSeat(action.seat))) throw new Error("Night target không hợp lệ.");
  if (action.kind === "bloodmoon" && !target.revealed) throw new Error(`${SPECIAL_CARD.name} chỉ đánh được role đã lộ.`);
}

function stageNight(state) {
  for (const seat of ["A", "B"]) {
    const action = state.players[seat].night;
    if (action.kind === "pass" || action.kind === "bloodmoon") continue;
    reveal(cardById(state, action.source));
  }
  state.phase = "dusk-defense";
  addLog(state, "Hai nguồn lệnh đêm bước lên sân; mục tiêu vẫn bí mật. Hai bên chọn vị trí đặt khiên.");
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
      if (target.seerInspected === "light") throw new Error("Lá phe sáng này đã được soi và không thể soi lại.");
      source.uses.seer -= 1;
      if (!target.shielded) {
        if (target.seerInspected === "dark") pendingDeaths.push({ target, cause: `Tiên tri kết liễu ${target.id}` });
        else {
          target.seerInspected = ROLE_DEFS[target.role].faction === "werewolf" ? "dark" : "light";
          state.players[seat].notes.push(`V${state.round}: ${target.id} là ${ROLE_DEFS[target.role].name}.`);
          addLog(state, `${seat} dùng Tiên tri. Kết quả được giữ riêng.`);
        }
      }
      continue;
    }

    reveal(source);
    state.players[seat].eliminationSpent = true;
    if (action.kind === "poison") source.uses.poison -= 1;
    if (target.shielded) addLog(state, `${target.id} được khiên chặn một đòn ${action.kind === "attack" ? "cắn" : "độc"}.`);
    else pendingDeaths.push({ target, cause: action.kind === "attack" ? `Ma sói của ${seat}` : `độc của ${seat}` });
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
  state.phase = state.round >= 6 ? "purge" : state.round >= 2 ? "council" : "day-A";
  addLog(state, `Bình minh Vòng ${state.round}.`);
  if (state.round === SPECIAL_CARD.unlockRound) addLog(state, `${SPECIAL_CARD.name} thức tỉnh cho cả hai bên; dùng lại sau mỗi ${SPECIAL_CARD.cooldownRounds} vòng.`);
  if (state.round < 3) addLog(state, `Vòng ${state.round} chưa mở treo cổ. Bên A bắt đầu lượt Ban ngày.`);
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
  state.players[action.seat].finalGuess = action.guess;
  addLog(state, `${action.seat} đã khóa dự đoán Final Duel.`);
  if (!state.players.A.finalGuess || !state.players.B.finalGuess) return;

  const cardA = livingCards(state, "A")[0];
  const cardB = livingCards(state, "B")[0];
  reveal(cardA);
  reveal(cardB);
  const correctA = state.players.A.finalGuess === cardB.role;
  const correctB = state.players.B.finalGuess === cardA.role;
  state.phase = "ended";
  if (correctA && correctB) state.result = { winner: null, reason: "Hai bên cùng đoán đúng Final Duel" };
  else if (correctA || correctB) state.result = { winner: correctA ? "A" : "B", reason: "Đoán đúng role cuối" };
  else state.result = { winner: null, reason: "Hai bên cùng đoán sai Final Duel" };
  addLog(state, state.result.winner ? `${state.result.winner} thắng Final Duel.` : `Hòa: ${state.result.reason}.`);
}

export function dispatch(currentState, action) {
  if (currentState.phase === "ended") throw new Error("Ván đấu đã kết thúc.");
  let state = clone(currentState);
  if (action.type === "round.begin") state = beginRound(state);
  else if (action.type === "setup.submit") submitSetup(state, action);
  else if (action.type === "purge.submit") submitPurge(state, action);
  else if (action.type === "council.submit") submitCouncil(state, action);
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
  for (const seat of ["A", "B"]) {
    board[seat] = state.players[seat].board.map((card) => ({
      id: card.id,
      alive: card.alive,
      role: card.revealed ? ROLE_DEFS[card.role].name : "?",
      faction: card.revealed ? ROLE_DEFS[card.role].faction : "?",
      shielded: card.shielded,
      staged: Boolean(state.players[seat].night?.source === card.id),
      canVote: card.alive && card.revealed && ROLE_DEFS[card.role].faction === "village" && card.voteCooldown === 0,
      votePower: card.alive && card.revealed && ROLE_DEFS[card.role].faction === "village" && card.voteCooldown === 0 ? 1 : 0,
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
      role: ROLE_DEFS[card.role].name,
      alive: card.alive,
      revealed: card.revealed,
      uses: card.uses,
    })),
    notes: [...state.players[seat].notes],
  };
}

export function chatSnapshot(state) {
  const view = publicView(state);
  const lines = [`[TWOFOLD · V${view.round} · ${view.phase.toUpperCase()}]`];
  for (const seat of ["A", "B"]) {
    const cards = view.board[seat];
    const revealed = cards
      .filter((card) => card.role !== "?")
      .map((card) => `${card.id}=${card.role}${card.alive ? "" : "†"}`);
    const shields = cards.filter((card) => card.shielded).map((card) => card.id);
    lines.push(`${seat}: ${cards.filter((card) => card.alive).length}/10 sống · loại bỏ ${view.elimination[seat]} · lộ ${revealed.join(", ") || "—"}${shields.length ? ` · khiên ${shields.join(", ")}` : ""}`);
  }
  lines.push(`Gần nhất: ${view.log.slice(-3).join(" / ")}`);
  if (view.special.A.unlocked) lines.push(`${SPECIAL_CARD.name}: A ${view.special.A.ready ? "sẵn sàng" : `hồi V${view.special.A.readyRound}`} · B ${view.special.B.ready ? "sẵn sàng" : `hồi V${view.special.B.readyRound}`}`);
  if (view.result) lines.push(`Kết quả: ${view.result.winner || "HÒA"} — ${view.result.reason}`);
  return lines.join("\n");
}
