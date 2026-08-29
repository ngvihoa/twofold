import { availableRoleGuesses, createGame, dispatch, privateView, publicView, ROLE_DEFS, SPECIAL_CARD } from "./engine.mjs?rev=round6-special-v1";

const ROLE_ART = {
  villager: "../assets/game/wwo-reference/dan-lang.png",
  wolf: "../assets/game/wwo-reference/ma-soi-thuong.png",
  seer: "../assets/game/wwo-reference/tien-tri.png",
  guard: "../assets/game/wwo-reference/bao-ve.png",
  witch: "../assets/game/wwo-reference/phu-thuy.webp",
  shooter: "../assets/game/wwo-reference/xa-thu.webp",
  avenger: "../assets/game/wwo-reference/ke-bao-thu.png",
  priest: "../assets/game/wwo-reference/muc-su.png",
  wolfguard: "../assets/game/wwo-reference/soi-ho-ve.webp",
};

const ROLE_PHASE = {
  villager: "day",
  wolf: "night",
  seer: "night",
  guard: "night",
  witch: "both",
  shooter: "day",
  avenger: "both",
  priest: "day",
  wolfguard: "day",
};

const ROLE_SKILLS = {
  villager: "Hội đồng · Có thể là một trong 3 người tham gia treo cổ; sẽ lộ diện khi Hội đồng xử lý.",
  wolf: "Ban đêm · Tấn công một lá đối thủ không được khiên che.",
  seer: "Ban đêm · Xem role thật của một lá đối thủ.",
  guard: "Chạng vạng · Đặt khiên lên một lá đồng minh, tối đa 3 lần.",
  witch: "Ngày hồi sinh một đồng minh · Đêm đầu độc một đối thủ.",
  shooter: "Ban ngày · Khi đối thủ đã lộ 2 role, bắn một lá đã lộ.",
  avenger: "Ban ngày · Đánh dấu mục tiêu; nếu chết trước bình minh, mục tiêu chết theo.",
  priest: "Ban ngày · Thanh tẩy một lần; giết Sói nhưng tự chết nếu chọn nhầm Dân.",
  wolfguard: "Hội đồng · Bí mật bảo kê một lá; lộ diện nếu chặn đúng án treo.",
};

const PHASE_LABEL = {
  "setup-A": "Xếp đội hình · bên A",
  "setup-B": "Xếp đội hình · bên B",
  purge: "Thanh trừng",
  council: "Hội đồng sáng",
  "day-A": "Ban ngày · lượt A",
  "day-B": "Ban ngày · lượt B",
  "night-plan": "Khóa lệnh đêm",
  "dusk-defense": "Chạng vạng · đặt khiên",
  "night-resolution": "Ban đêm · chờ phán xét",
  "final-duel": "Final Duel",
  ended: "Kết thúc",
};

const MOVE_META = {
  mark: ["✦", "Đánh dấu báo thù"],
  purify: ["☀", "Thanh tẩy"],
  shoot: ["✹", "Nổ súng"],
  revive: ["✚", "Hồi sinh"],
  defend: ["◈", "Đặt khiên"],
  protect: ["◈", "Bảo kê"],
  attack: ["◢", "Tấn công"],
  inspect: ["◉", "Soi role"],
  poison: ["◆", "Dùng độc"],
  accuse: ["⚖", "Buộc tội"],
  pass: ["—", "Bỏ lượt"],
  final: ["?", "Đoán role cuối"],
  bloodmoon: ["◐", "Huyết Nguyệt"],
};

const COMBAT_KINDS = new Set(["attack", "poison", "purify", "shoot", "bloodmoon"]);
const ACTION_EFFECT_KINDS = new Set([...COMBAT_KINDS, "inspect", "defend", "accuse"]);
const COMBAT_RESULTS = {
  kill: "HẠ GỤC",
  blocked: "BỊ CHẶN",
  backfire: "PHẢN ĐÒN",
  hit: "TRÚNG ĐÒN",
};

const app = document.querySelector("#app");
let state = createGame("codex-web-01");
let seat = "A";
let handVisible = true;
let feedback = "Chọn hành động của A để bắt đầu.";
let setupOrder = {
  A: state.players.A.board.map((card) => card.id),
  B: state.players.B.board.map((card) => card.id),
};
let draggedSetupId = null;
let botTimer = null;
let interaction = null;
let lastMove = null;
let moveTimer = null;
let resolutionTimer = null;
let dawnTimer = null;
let dawnActive = false;
let dawnPresentation = null;
let actionTimer = null;
let actionPresentation = null;
let travelingCardId = null;
let deferredCombatMoveId = null;
let moveSequence = 0;
let playedMoveId = null;
const deathReasons = new Map();

const otherSeat = (value) => value === "A" ? "B" : "A";
const ownPlayer = () => state.players[seat];
const privateCard = (id) => ownPlayer().board.find((card) => card.id === id);
const roleOptions = (keys = Object.keys(ROLE_DEFS)) => keys.map((key) => `<option value="${key}">${ROLE_DEFS[key].name}</option>`).join("");
const cardOptions = (cards) => cards.filter((card) => card.alive).map((card) => `<option value="${card.id}">${card.id}${card.revealed ? ` · ${ROLE_DEFS[card.role].name}` : ""}</option>`).join("");
const deadCardOptions = (cards) => cards.filter((card) => !card.alive).map((card) => `<option value="${card.id}">${card.id} · ${ROLE_DEFS[card.role].name}</option>`).join("");
const sourceFor = (role) => ownPlayer().board.find((card) => card.alive && card.role === role)?.id;
const botSourceFor = (role) => state.players.B.board.find((card) => card.alive && card.role === role);
const living = (boardSeat) => state.players[boardSeat].board.filter((card) => card.alive);

function botNeedsTurn() {
  if (state.phase === "setup-B" || state.phase === "day-B") return true;
  if (state.phase === "purge") return Boolean(state.players.A.purge) && !state.players.B.purge;
  if (state.phase === "council") return Boolean(state.players.A.council) && !state.players.B.council;
  if (state.phase === "dusk-defense") return state.players.A.defense !== null && state.players.B.defense === null;
  if (state.phase === "night-plan") return Boolean(state.players.A.night) && !state.players.B.night;
  if (state.phase === "final-duel") return Boolean(state.players.A.finalGuess) && !state.players.B.finalGuess;
  return false;
}

function botAction() {
  if (state.phase === "setup-B") return { type: "setup.submit", seat: "B", order: state.players.B.board.map((card) => card.id) };
  if (state.phase === "purge") {
    const own = living("B");
    const rule = ["cut", "swap", "reveal", "lock"][(state.round - 6) % 4];
    return { type: "purge.submit", seat: "B", target: own[state.round % own.length].id, swapTarget: rule === "swap" ? living("A")[state.round % living("A").length].id : undefined };
  }
  if (state.phase === "day-B") {
    const revealedEnemies = living("A").filter((card) => card.revealed);
    const shooter = botSourceFor("shooter");
    if (shooter?.uses.bullet > 0 && revealedEnemies.length >= 2 && !state.players.B.eliminationSpent) {
      return { type: "day.submit", seat: "B", kind: "shoot", source: shooter.id, target: revealedEnemies[0].id };
    }
    const witch = botSourceFor("witch");
    const deadAlly = state.players.B.board.find((card) => !card.alive);
    if (witch?.uses.revive > 0 && deadAlly) return { type: "day.submit", seat: "B", kind: "revive", source: witch.id, target: deadAlly.id };
    const knownWolf = [...state.players.B.notes].reverse().map((note) => note.match(/(A\d+) là Ma sói/)).find(Boolean)?.[1];
    const priest = botSourceFor("priest");
    if (priest?.uses.holyWater > 0 && knownWolf && state.players.A.board.find((card) => card.id === knownWolf)?.alive) {
      return { type: "day.submit", seat: "B", kind: "purify", source: priest.id, target: knownWolf };
    }
    const avenger = botSourceFor("avenger");
    if (avenger) {
      const targets = living("A");
      const target = targets[(state.round + targets.length - 1) % targets.length];
      return { type: "day.submit", seat: "B", kind: "mark", source: avenger.id, target: target.id };
    }
    return { type: "day.submit", seat: "B", kind: "pass" };
  }
  if (state.phase === "council") {
    const target = living("A").find((card) => card.revealed);
    const voters = living("B").filter((item) => ROLE_DEFS[item.role].faction === "village" && item.voteCooldown === 0).slice(0, 3).map((card) => card.id);
    if (target && voters.length === 3) return { type: "council.submit", seat: "B", kind: "accuse", target: target.id, guess: target.role, voters };
    return { type: "council.submit", seat: "B", kind: "pass" };
  }
  if (state.phase === "dusk-defense") {
    const guard = botSourceFor("guard");
    if (!guard?.uses.guard) return { type: "defense.submit", seat: "B", pass: true };
    const choices = living("B").filter((card) => card.id !== state.players.B.lastGuardTarget);
    const target = choices.find((card) => card.revealed) || choices[state.round % choices.length];
    return { type: "defense.submit", seat: "B", pass: false, source: guard.id, target: target.id };
  }
  if (state.phase === "night-plan") {
    const targets = living("A");
    const openTargets = targets.filter((card) => !card.shielded);
    const pool = openTargets.length ? openTargets : targets;
    const target = pool[state.round % pool.length];
    const wolf = botSourceFor("wolf");
    if (wolf && !state.players.B.eliminationSpent) return { type: "night.submit", seat: "B", kind: "attack", source: wolf.id, target: target.id };
    const revealedTargets = targets.filter((card) => card.revealed);
    if (state.round >= SPECIAL_CARD.unlockRound && state.players.B.bloodMoonReadyRound <= state.round && revealedTargets.length && !state.players.B.eliminationSpent) {
      return { type: "night.submit", seat: "B", kind: "bloodmoon", target: revealedTargets[state.round % revealedTargets.length].id };
    }
    const seer = botSourceFor("seer");
    if (seer?.uses.seer > 0) return { type: "night.submit", seat: "B", kind: "inspect", source: seer.id, target: target.id };
    return { type: "night.submit", seat: "B", kind: "pass" };
  }
  const guesses = Object.keys(ROLE_DEFS);
  return { type: "final.submit", seat: "B", guess: guesses[state.round % guesses.length] };
}

function runBotTurn() {
  botTimer = null;
  if (!botNeedsTurn()) return;
  try {
    const action = botAction();
    const beforeState = structuredClone(state);
    const nextState = dispatch(state, action);
    if (action.type === "setup.submit") {
      state = nextState;
    } else if (action.type === "purge.submit" && beforeState.phase === "purge" && nextState.phase !== "purge") {
      state = nextState;
      showMove(action, "B");
    } else if (action.type === "council.submit" && beforeState.phase === "council" && nextState.phase !== "council") {
      const councilSteps = [
        { actor: "A", action: beforeState.players.A.council ? { type: "council.submit", seat: "A", ...beforeState.players.A.council } : null },
        { actor: "B", action },
      ].filter((step) => step.action?.kind === "accuse");
      if (councilSteps.length) {
        startCouncilResolution(beforeState, nextState, councilSteps);
        return;
      }
      state = nextState;
    } else if (action.type === "night.submit" && beforeState.phase === "night-plan" && nextState.phase === "dusk-defense") {
      startNightStaging(beforeState, nextState);
      return;
    } else if (action.type === "day.submit") {
      startActionPresentation(action, "B", beforeState, nextState);
      return;
    } else {
      state = nextState;
      showMove(action, "B");
    }
    feedback = "BOT B đã khóa hành động.";
  } catch (error) {
    feedback = `BOT lỗi: ${error.message}`;
  }
  render();
}

function scheduleBot() {
  if (dawnActive || actionPresentation || lastMove || !botNeedsTurn() || botTimer) return;
  botTimer = setTimeout(runBotTurn, 2400);
}

function copyPresentationSource(action, resolvedState) {
  if (!action.source) return;
  const current = cardState(action.source, state);
  const resolved = cardState(action.source, resolvedState);
  if (current && resolved) current.revealed = resolved.revealed;
}

function newlyRevealed(cardId, beforeState, resolvedState) {
  if (!cardId) return false;
  const before = cardState(cardId, beforeState);
  const resolved = cardState(cardId, resolvedState);
  return Boolean(before && resolved && !before.revealed && resolved.revealed);
}

function renderWithCardTravel(cardId) {
  const origin = cardId ? document.querySelector(`[data-card-id="${cardId}"]`) : null;
  const originRect = origin?.getBoundingClientRect();
  const ghost = origin?.cloneNode(true);
  const deferredMoveId = lastMove?.target === cardId && ACTION_EFFECT_KINDS.has(lastMove.kind) ? lastMove.id : null;

  travelingCardId = originRect ? cardId : null;
  if (originRect && deferredMoveId) deferredCombatMoveId = deferredMoveId;
  render();
  travelingCardId = null;

  const destination = cardId ? document.querySelector(`[data-card-id="${cardId}"]`) : null;
  if (!originRect || !ghost || !destination) {
    if (deferredCombatMoveId === deferredMoveId) deferredCombatMoveId = null;
    return false;
  }
  const destinationRect = destination.getBoundingClientRect();
  document.querySelectorAll(".card-travel-ghost, .card-travel-path").forEach((item) => item.remove());
  ghost.querySelectorAll(".skill-tooltip, .action-hint, .target-hint, .selection-phase").forEach((item) => item.remove());
  ghost.classList.remove("actionable", "targetable", "selected-card", "presentation-enter", "presentation-pulse");
  ghost.classList.add("card-travel-ghost");
  Object.assign(ghost.style, {
    position: "fixed",
    zIndex: "90",
    left: `${originRect.left}px`,
    top: `${originRect.top}px`,
    width: `${originRect.width}px`,
    height: `${originRect.height}px`,
    margin: "0",
    pointerEvents: "none",
    transformOrigin: "top left",
  });
  document.body.append(ghost);

  const travelX = destinationRect.left - originRect.left;
  const travelY = destinationRect.top - originRect.top;
  const scaleX = destinationRect.width / originRect.width;
  const scaleY = destinationRect.height / originRect.height;
  const duration = 4200;
  const path = document.createElement("div");
  const pathStartX = originRect.left + originRect.width / 2;
  const pathStartY = originRect.top + originRect.height / 2;
  const pathEndX = destinationRect.left + destinationRect.width / 2;
  const pathEndY = destinationRect.top + destinationRect.height / 2;
  const pathDistance = Math.hypot(pathEndX - pathStartX, pathEndY - pathStartY);
  const pathAngle = Math.atan2(pathEndY - pathStartY, pathEndX - pathStartX) * 180 / Math.PI;
  path.className = "card-travel-path";
  Object.assign(path.style, {
    left: `${pathStartX}px`,
    top: `${pathStartY}px`,
    width: `${pathDistance}px`,
    transform: `rotate(${pathAngle}deg)`,
    animationDuration: `${duration}ms`,
  });
  document.body.append(path);
  ghost.style.setProperty("--travel-x", `${travelX}px`);
  ghost.style.setProperty("--travel-y", `${travelY}px`);
  ghost.style.setProperty("--travel-mid-x", `${travelX * .58}px`);
  ghost.style.setProperty("--travel-mid-y", `${travelY * .58}px`);
  ghost.style.setProperty("--travel-scale-x", scaleX);
  ghost.style.setProperty("--travel-scale-y", scaleY);
  ghost.style.setProperty("--travel-mid-scale-x", 1 + (scaleX - 1) * .58);
  ghost.style.setProperty("--travel-mid-scale-y", 1 + (scaleY - 1) * .58);
  ghost.style.animation = `card-ghost-travel ${duration}ms cubic-bezier(.45,0,.2,1) both`;
  setTimeout(() => {
    ghost.remove();
    path.remove();
    if (deferredCombatMoveId === deferredMoveId) {
      deferredCombatMoveId = null;
      requestAnimationFrame(playCombatEffect);
    }
  }, duration);
  return true;
}

function showPresentationMove(action, actor, options = {}) {
  showMove(action, actor, options);
  clearTimeout(moveTimer);
  moveTimer = null;
}

function startActionPresentation(action, actor, beforeState, resolvedState) {
  clearTimeout(actionTimer);
  state = structuredClone(beforeState);
  actionPresentation = {
    type: "action",
    stage: action.source ? "source" : "outcome",
    actor,
    action,
    beforeState: structuredClone(beforeState),
    resolvedState,
  };
  if (action.source) copyPresentationSource(action, resolvedState);
  else showPresentationMove(action, actor, { outcomeState: resolvedState });
  feedback = `Bên ${actor} đang trình diễn hành động. Thao tác tạm khóa.`;
  if (newlyRevealed(action.source, beforeState, resolvedState)) renderWithCardTravel(action.source);
  else render();
  actionTimer = setTimeout(advanceActionPresentation, action.source ? 4700 : 1500);
}

function advanceActionPresentation() {
  actionTimer = null;
  if (!actionPresentation || actionPresentation.type !== "action") return;
  if (actionPresentation.stage === "source") {
    const { action, actor, resolvedState } = actionPresentation;
    const beforeOutcome = structuredClone(state);
    copyResolvedCard(action.source, resolvedState);
    copyResolvedCard(action.target, resolvedState);
    actionPresentation.stage = "outcome";
    showPresentationMove(action, actor, { revealTarget: true, outcomeState: resolvedState });
    feedback = `Kết quả hành động của bên ${actor} đang được công bố.`;
    let targetTravels = false;
    if (newlyRevealed(action.target, beforeOutcome, resolvedState)) targetTravels = renderWithCardTravel(action.target);
    else render();
    actionTimer = setTimeout(advanceActionPresentation, targetTravels ? 8000 : 4200);
    return;
  }
  finishActionPresentation();
}

function startNightStaging(beforeState, resolvedState) {
  clearTimeout(actionTimer);
  state = structuredClone(beforeState);
  state.players.B.night = structuredClone(resolvedState.players.B.night);
  actionPresentation = {
    type: "night-staging",
    stage: "source",
    index: -1,
    steps: [
      { actor: "A", action: structuredClone(resolvedState.players.A.night) },
      { actor: "B", action: structuredClone(resolvedState.players.B.night) },
    ],
    beforeState: structuredClone(beforeState),
    resolvedState,
  };
  advanceNightStaging();
}

function advanceNightStaging() {
  clearTimeout(actionTimer);
  actionTimer = null;
  if (!actionPresentation || actionPresentation.type !== "night-staging") return;
  const nextIndex = actionPresentation.index + 1;
  if (nextIndex < actionPresentation.steps.length) {
    actionPresentation.index = nextIndex;
    const step = actionPresentation.steps[nextIndex];
    const beforeStep = structuredClone(state);
    copyPresentationSource(step.action, actionPresentation.resolvedState);
    showPresentationMove(step.action, step.actor);
    feedback = `Lệnh đêm của bên ${step.actor} đang bước lên sân (${nextIndex + 1}/2).`;
    if (newlyRevealed(step.action.source, beforeStep, actionPresentation.resolvedState)) renderWithCardTravel(step.action.source);
    else render();
    actionTimer = setTimeout(advanceNightStaging, 4800);
    return;
  }
  finishActionPresentation();
}

function startCouncilResolution(beforeState, resolvedState, steps) {
  clearTimeout(actionTimer);
  const sequence = steps.flatMap((step) => [
    ...step.action.voters.map((cardId, index) => ({ type: "voter", actor: step.actor, cardId, voterIndex: index, voterTotal: step.action.voters.length })),
    { type: "verdict", actor: step.actor, action: step.action },
  ]);
  actionPresentation = {
    type: "council-resolution",
    stage: "voter",
    index: -1,
    sequence,
    action: null,
    voterId: null,
    actor: "A",
    beforeState: structuredClone(beforeState),
    resolvedState,
  };
  state = structuredClone(beforeState);
  advanceCouncilResolution();
}

function advanceCouncilResolution() {
  clearTimeout(actionTimer);
  actionTimer = null;
  if (!actionPresentation || actionPresentation.type !== "council-resolution") return;
  const nextIndex = actionPresentation.index + 1;
  if (nextIndex >= actionPresentation.sequence.length) return finishActionPresentation();

  const beforeStep = structuredClone(state);
  const step = actionPresentation.sequence[nextIndex];
  actionPresentation.index = nextIndex;
  actionPresentation.actor = step.actor;
  if (step.type === "voter") {
    actionPresentation.stage = "voter";
    actionPresentation.voterId = step.cardId;
    actionPresentation.action = null;
    copyResolvedCard(step.cardId, actionPresentation.resolvedState);
    lastMove = null;
    feedback = `Hội đồng bên ${step.actor}: người bỏ phiếu ${step.voterIndex + 1}/${step.voterTotal} đang lộ diện.`;
    let voterTravels = false;
    if (newlyRevealed(step.cardId, beforeStep, actionPresentation.resolvedState)) voterTravels = renderWithCardTravel(step.cardId);
    else render();
    actionTimer = setTimeout(advanceCouncilResolution, voterTravels ? 4700 : 1800);
    return;
  }

  actionPresentation.stage = "outcome";
  actionPresentation.voterId = null;
  actionPresentation.action = step.action;
  copyResolvedCard(step.action.target, actionPresentation.resolvedState);
  showPresentationMove(step.action, step.actor, { revealTarget: true, outcomeState: actionPresentation.resolvedState });
  feedback = `Hội đồng bên ${step.actor} đang công bố phán quyết treo cổ.`;
  let targetTravels = false;
  if (newlyRevealed(step.action.target, beforeStep, actionPresentation.resolvedState)) targetTravels = renderWithCardTravel(step.action.target);
  else render();
  actionTimer = setTimeout(advanceCouncilResolution, targetTravels ? 8400 : 4700);
}

function finishActionPresentation() {
  if (!actionPresentation) return;
  state = actionPresentation.resolvedState;
  actionPresentation = null;
  clearTimeout(actionTimer);
  actionTimer = null;
  clearTimeout(moveTimer);
  moveTimer = null;
  lastMove = null;
  feedback = "Trình diễn đã hoàn tất. Bạn có thể tiếp tục.";
  render();
}

function runNightResolution() {
  resolutionTimer = null;
  if (state.phase !== "night-resolution" || dawnPresentation) return;
  const beforeState = structuredClone(state);
  const ownAction = structuredClone(state.players.A.night);
  const opponentAction = structuredClone(state.players.B.night);
  try {
    const resolvedState = dispatch(state, { type: "night.resolve" });
    const moves = [
      { action: ownAction, actor: "A" },
      { action: opponentAction, actor: "B" },
    ].filter(({ action }) => action && moveKind(action) !== "pass");
    dawnPresentation = {
      stage: "opening",
      index: -1,
      moves,
      beforeState,
      resolvedState,
    };
    state = beforeState;
    dawnActive = true;
    lastMove = null;
    clearTimeout(moveTimer);
    moveTimer = null;
    clearTimeout(dawnTimer);
    dawnTimer = setTimeout(advanceDawnPresentation, 1700);
    feedback = "Bình minh đang hé lộ. Mọi thao tác tạm khóa.";
  } catch (error) {
    feedback = `Lỗi xử lý đêm: ${error.message}`;
  }
  render();
}

function copyResolvedCard(cardId, resolvedState) {
  if (!cardId) return;
  const current = cardState(cardId, state);
  const resolved = cardState(cardId, resolvedState);
  if (!current || !resolved) return;
  current.alive = resolved.alive;
  current.revealed = resolved.revealed;
  current.uses = structuredClone(resolved.uses);
}

function applyDawnMove({ action }, presentation) {
  copyResolvedCard(action.source, presentation.resolvedState);
  copyResolvedCard(action.target, presentation.resolvedState);

  const targetBefore = cardState(action.target, presentation.beforeState);
  if (targetBefore?.role !== "avenger" || cardState(action.target, presentation.resolvedState)?.alive) return;
  const revengeTarget = presentation.beforeState.players[action.target[0]].revengeTarget;
  if (!revengeTarget || cardState(revengeTarget, presentation.resolvedState)?.alive) return;
  copyResolvedCard(revengeTarget, presentation.resolvedState);
  deathReasons.set(revengeTarget, {
    short: "BỊ KÉO THEO BÁO THÙ",
    detail: `${action.target} bị hạ và kích hoạt lời nguyền báo thù lên ${revengeTarget}.`,
  });
}

function advanceDawnPresentation() {
  dawnTimer = null;
  if (!dawnPresentation) return;

  const nextIndex = dawnPresentation.index + 1;
  if (nextIndex < dawnPresentation.moves.length) {
    dawnPresentation.index = nextIndex;
    dawnPresentation.stage = "reveal";
    const move = dawnPresentation.moves[nextIndex];
    const beforeMove = structuredClone(state);
    applyDawnMove(move, dawnPresentation);
    showPresentationMove(move.action, move.actor, {
      revealTarget: true,
      outcomeState: dawnPresentation.resolvedState,
    });
    feedback = `Bình minh đang công bố kết quả ${nextIndex + 1}/${dawnPresentation.moves.length}.`;
    const travelId = [move.action.target, move.action.source]
      .find((cardId) => newlyRevealed(cardId, beforeMove, dawnPresentation.resolvedState));
    let cardTravels = false;
    if (travelId) cardTravels = renderWithCardTravel(travelId);
    else render();
    dawnTimer = setTimeout(advanceDawnPresentation, cardTravels ? 8000 : 4200);
    return;
  }

  state = dawnPresentation.resolvedState;
  dawnPresentation.stage = "complete";
  lastMove = null;
  clearTimeout(moveTimer);
  moveTimer = null;
  feedback = "Trời đã sáng. Bàn đấu đã cập nhật xong.";
  render();
  dawnTimer = setTimeout(() => {
    dawnActive = false;
    dawnPresentation = null;
    dawnTimer = null;
    render();
  }, 1900);
}

function scheduleNightResolution() {
  if (state.phase !== "night-resolution" || resolutionTimer || dawnPresentation || lastMove) return;
  resolutionTimer = setTimeout(runNightResolution, 3200);
}

function moveKind(action) {
  if (action.pass || action.kind === "pass") return "pass";
  if (action.type === "defense.submit") return "defend";
  if (action.type === "final.submit") return "final";
  return action.kind || "pass";
}

function publicCardLabel(id) {
  if (!id) return "Không có mục tiêu";
  const card = publicView(state).board[id[0]]?.find((item) => item.id === id);
  return card?.role && card.role !== "?" ? `${id} · ${card.role}` : id;
}

function cardState(id, stateRef = state) {
  return id ? stateRef.players[id[0]]?.board.find((card) => card.id === id) : null;
}

function deathReasonFor(kind, outcome, action) {
  if (kind === "purify" && outcome === "backfire") return {
    short: "CHỌN NHẦM PHE DÂN",
    detail: `Thanh tẩy nhầm ${action.target}: mục tiêu không thuộc phe Sói, Mục sư tự hy sinh.`,
  };
  if (kind === "purify") return { short: "TRÚNG NƯỚC THÁNH", detail: `Bị Mục sư thanh tẩy vì thuộc phe Sói.` };
  if (kind === "shoot") return { short: "BỊ XẠ THỦ BẮN", detail: "Bị Xạ thủ bắn hạ trong Ban ngày." };
  if (kind === "attack") return { short: "BỊ MA SÓI CẮN", detail: "Bị Ma sói tấn công và không có khiên bảo vệ." };
  if (kind === "poison") return { short: "TRÚNG ĐỘC", detail: "Bị Phù thủy đầu độc trong đêm." };
  if (kind === "bloodmoon") return { short: "BỊ HUYẾT NGUYỆT HẠ", detail: `Bị ${SPECIAL_CARD.name} kết liễu khi không có khiên bảo vệ.` };
  return null;
}

function moveExplanationFor(kind, outcome, action) {
  if (kind === "attack") return outcome === "blocked"
    ? `${action.target} sống sót vì đã có khiên; Ma sói vẫn lộ diện do đã ra đòn.`
    : `Ma sói lộ diện vì đã tấn công ${action.target}.`;
  if (kind === "poison") return outcome === "blocked"
    ? `${action.target} sống sót vì đã có khiên; Phù thủy vẫn lộ diện do đã dùng độc.`
    : `Phù thủy lộ diện vì đã dùng độc lên ${action.target}.`;
  if (kind === "inspect") return `Tiên tri soi kín ${action.target}; kết quả chỉ được ghi vào ghi chú riêng của người ra lệnh.`;
  if (kind === "defend") return `Bảo vệ dựng khiên công khai tại ${action.target}; role của mục tiêu và Bảo vệ vẫn được giữ kín.`;
  if (kind === "accuse") return `${action.voters?.join(", ") || "Ba nhân vật"} cùng bỏ phiếu treo ${action.target}.`;
  if (kind === "bloodmoon" && outcome === "blocked") return `${action.target} sống sót vì đã có khiên bảo vệ.`;
  return null;
}

function showMove(action, actor, { revealTarget = false, outcomeState = state } = {}) {
  const kind = moveKind(action);
  const hiddenNightTarget = action.type === "night.submit" && !revealTarget && action.target;
  const sourceVisible = action.source && (actor === seat || publicView(state).board[actor]?.find((card) => card.id === action.source)?.role !== "?");
  const resolvedCombat = COMBAT_KINDS.has(kind) && action.target && !hiddenNightTarget;
  const targetDied = resolvedCombat && !cardState(action.target, outcomeState)?.alive;
  const sourceDied = resolvedCombat && action.source && !cardState(action.source, outcomeState)?.alive;
  const councilSucceeded = kind === "accuse" && action.target && !cardState(action.target, outcomeState)?.alive;
  const outcome = !resolvedCombat
    ? null
    : targetDied
      ? "kill"
      : kind === "purify" && sourceDied
        ? "backfire"
        : "blocked";
  const killerKnown = Boolean(actor !== seat && targetDied && sourceVisible);
  const mysteryKiller = Boolean(actor !== seat && targetDied && !sourceVisible);
  const deathReason = resolvedCombat && (targetDied || sourceDied) ? deathReasonFor(kind, outcome, action) : null;
  const explanation = hiddenNightTarget ? null : moveExplanationFor(kind, outcome, action);
  if (targetDied && deathReason) deathReasons.set(action.target, deathReason);
  if (sourceDied && deathReason) deathReasons.set(action.source, deathReason);
  if (kind === "revive" && action.target) deathReasons.delete(action.target);
  lastMove = {
    id: ++moveSequence,
    actor,
    kind,
    source: sourceVisible ? action.source : null,
    sourceLabel: kind === "bloodmoon"
      ? mysteryKiller ? `Kẻ giấu mặt · ${SPECIAL_CARD.name}` : SPECIAL_CARD.name
      : sourceVisible
      ? actor === seat && privateCard(action.source) ? `${action.source} · ${ROLE_DEFS[privateCard(action.source).role].name}` : publicCardLabel(action.source)
      : action.source ? "Lá ẩn" : actor === "B" && kind !== "pass" ? "Lá ẩn" : "Hệ thống",
    target: hiddenNightTarget ? null : action.target || null,
    hiddenTarget: Boolean(hiddenNightTarget),
    targetLabel: hiddenNightTarget ? "Mục tiêu bí mật" : publicCardLabel(action.target),
    voters: action.voters ? [...action.voters] : [],
    targetDied,
    sourceDied,
    councilSucceeded,
    outcome,
    killerKnown,
    mysteryKiller,
    deathReason,
    explanation,
  };
  clearTimeout(moveTimer);
  moveTimer = setTimeout(() => {
    lastMove = null;
    render();
  }, 4700);
}

function actionForOwnCard(card) {
  if (!card?.alive || !activeForSeat() || state.phase.startsWith("setup-")) return null;
  if (interaction && interaction.kind !== "accuse") return null;
  if (state.phase.startsWith("day-")) {
    if (card.role === "avenger") return { kind: "mark", label: "Đánh dấu báo thù" };
    if (card.role === "priest" && card.uses.holyWater > 0 && !state.players.A.eliminationSpent) return { kind: "purify", label: "Thanh tẩy" };
    if (card.role === "shooter" && card.uses.bullet > 0 && living("B").filter((item) => item.revealed).length >= 2 && !state.players.A.eliminationSpent) return { kind: "shoot", label: "Bắn" };
    if (card.role === "witch" && card.uses.revive > 0 && state.players.A.board.some((item) => !item.alive)) return { kind: "revive", label: "Hồi sinh" };
  }
  if (state.phase === "dusk-defense" && card.role === "guard" && card.uses.guard > 0) return { kind: "defend", label: "Đặt khiên" };
  if (state.phase === "night-plan") {
    if (card.role === "wolf" && !state.players.A.eliminationSpent) return { kind: "attack", label: "Tấn công" };
    if (card.role === "seer" && card.uses.seer > 0) return { kind: "inspect", label: "Soi role" };
    if (card.role === "witch" && card.uses.poison > 0 && !state.players.A.eliminationSpent) return { kind: "poison", label: "Dùng độc" };
  }
  if (state.phase === "council" && interaction?.kind === "accuse" && ROLE_DEFS[card.role].faction === "village" && card.voteCooldown === 0) return { kind: "vote", label: "Tham gia treo cổ" };
  return null;
}

const votePower = (voterIds = []) => voterIds.reduce((total, id) => {
  const card = privateCard(id);
  return total + (card?.role === "villager" ? 2 : 1);
}, 0);

function directTargetIds() {
  if (!interaction) return new Set();
  if (interaction.kind === "purge") return new Set(living("A").map((card) => card.id));
  if (interaction.kind === "purge-swap") return new Set(living("B").map((card) => card.id));
  if (["mark", "purify", "attack", "inspect", "poison"].includes(interaction.kind)) return new Set(living("B").map((card) => card.id));
  if (interaction.kind === "bloodmoon") return new Set(living("B").filter((card) => card.revealed).map((card) => card.id));
  if (interaction.kind === "shoot") return new Set(living("B").filter((card) => card.revealed).map((card) => card.id));
  if (interaction.kind === "revive") return new Set(state.players.A.board.filter((card) => !card.alive).map((card) => card.id));
  if (interaction.kind === "defend" || interaction.kind === "protect") return new Set(living("A").map((card) => card.id));
  if (interaction.kind === "accuse" && interaction.voters.length === 3) return new Set(living("B").map((card) => card.id));
  return new Set();
}

function presentationClassFor(cardId) {
  if (travelingCardId === cardId) return "card-travel-arrival";
  if (!actionPresentation) return "";
  if (actionPresentation.type === "council-resolution" && actionPresentation.stage === "voter" && actionPresentation.voterId === cardId) return "presentation-pulse presentation-source";
  const step = actionPresentation.type === "night-staging"
    ? actionPresentation.steps[actionPresentation.index]
    : { action: actionPresentation.action };
  const action = step?.action;
  if (!action) return "";
  const isSource = actionPresentation.stage === "source" && action.source === cardId;
  const resolvedCard = cardState(cardId, actionPresentation.resolvedState);
  const isOutcome = actionPresentation.stage === "outcome"
    && (action.target === cardId || action.source === cardId && resolvedCard && !resolvedCard.alive);
  if (!isSource && !isOutcome) return "";
  const beforeCard = cardState(cardId, actionPresentation.beforeState);
  const entersCenter = Boolean(resolvedCard?.revealed && !beforeCard?.revealed);
  if (!entersCenter) return `presentation-pulse presentation-${isSource ? "source" : "outcome"}`;
  return `presentation-enter presentation-${isSource ? "source" : "outcome"} from-${cardId[0].toLowerCase()}`;
}

function cardMarkup(card, isOwn, setupIndex = -1) {
  const isSetup = setupIndex >= 0;
  const secret = isOwn ? privateCard(card.id) : null;
  const isRevealed = card.role !== "?";
  const roleKey = secret?.role || (card.role !== "?" ? Object.entries(ROLE_DEFS).find(([, value]) => value.name === card.role)?.[0] : null);
  const roleName = secret ? ROLE_DEFS[secret.role].name : card.role;
  const known = Boolean(roleKey);
  const faction = known ? ROLE_DEFS[roleKey].faction : "unknown";
  const phase = ROLE_PHASE[roleKey] || "hidden";
  const phaseMark = phase === "day" ? "☀" : phase === "night" ? "☾" : phase === "both" ? "☀☾" : "◇";
  const shownName = known ? roleName : "Bí danh";
  const directAction = isOwn ? actionForOwnCard(secret) : null;
  const disabledReason = !isSetup && card.alive && ((roleKey === "seer" && secret?.seerInspected === "light") || (roleKey === "guard" && state.players[seat]?.lastGuardTarget === card.id));
  const targetable = !disabledReason && directTargetIds().has(card.id);
  const selectedSource = interaction?.source === card.id;
  const selected = selectedSource || interaction?.target === card.id || interaction?.voters?.includes(card.id);
  const selectionPhase = selectedSource && state.phase === "night-plan"
    ? "ĐÃ CHỌN · ĐÊM"
    : selectedSource && state.phase.startsWith("day-")
      ? "ĐÃ CHỌN · NGÀY"
      : null;
  const deathReason = deathReasons.get(card.id);
  const status = !card.alive
    ? deathReason?.short || "Đã chết"
    : disabledReason
      ? roleKey === "seer" ? "Đã soi · Không thể soi lại" : "Đã bảo vệ đêm trước"
      : isRevealed
      ? `Đã lộ${card.votePower ? " · Có thể vote" : ""}`
      : isOwn ? "Đang ẩn" : "Đang sống";
  const moveSource = lastMove?.source === card.id;
  const moveTarget = lastMove?.target === card.id;
  const presentationClass = presentationClassFor(card.id);
  return `<article class="role-card faction-${faction} phase-${phase} ${isSetup ? "setup-card" : ""} ${disabledReason ? " disabled-target" : ""} ${directAction ? "actionable" : ""} ${targetable ? "targetable" : ""} ${selected ? "selected-card" : ""} ${moveSource ? "move-source" : ""} ${moveTarget ? "move-target" : ""} ${presentationClass} ${card.staged ? "staged" : ""} ${card.alive ? "" : "dead"} ${isRevealed ? "revealed" : "hidden-role"} ${card.shielded ? "shielded" : ""}" data-card-id="${card.id}" ${isSetup ? `draggable="true" data-setup-card="${card.id}"` : ""} ${directAction ? `data-direct-source="${card.id}" data-direct-kind="${directAction.kind}"` : ""} ${targetable ? `data-direct-target="${card.id}"` : ""}>
    <div class="card-shell">
      <header class="card-head"><strong class="role-name" title="${shownName}">${shownName}</strong><span class="phase-rune" title="Pha kỹ năng">${phaseMark}</span></header>
      <div class="art-window">
        ${known ? `<img class="role-art" src="${ROLE_ART[roleKey]}" alt="" />` : `<div class="card-back"><span>TF</span></div>`}
        ${isRevealed ? `<span class="reveal-badge" title="Role này đã công khai với đối thủ">◉ ĐÃ LỘ</span>` : ""}
        ${card.staged ? `<span class="staged-badge" title="Nguồn lệnh đêm đã khóa">LỆNH ĐÊM</span>` : ""}
        ${card.shielded ? `<span class="shield" title="Đang được bảo vệ">◈</span>` : ""}
        ${!card.alive && deathReason ? `<span class="death-cause-badge" title="${deathReason.detail}">† ${deathReason.short}</span>` : ""}
      </div>
      <footer class="card-foot"><span class="card-id">${card.id}</span><span class="card-status">${status}</span></footer>
    </div>
    ${directAction && !isSetup ? `<span class="action-hint">${directAction.label}</span>` : ""}
    ${targetable && !isSetup ? `<span class="target-hint">CHỌN MỤC TIÊU</span>` : ""}
    ${selectionPhase ? `<span class="selection-phase">${selectionPhase}</span>` : ""}
    ${isSetup ? `<div class="setup-controls"><button type="button" data-setup-move="-1" data-setup-id="${card.id}" aria-label="Đưa ${shownName} sang trái">‹</button><strong>${setupIndex + 1}</strong><button type="button" data-setup-move="1" data-setup-id="${card.id}" aria-label="Đưa ${shownName} sang phải">›</button></div>` : ""}
    ${known && !isSetup ? `<div class="skill-tooltip"><strong>${shownName}</strong><span>${ROLE_SKILLS[roleKey]}</span>${!card.alive && deathReason ? `<em class="death-tooltip">Chết vì: ${deathReason.detail}</em>` : directAction ? `<em>Nhấp để ${directAction.label.toLowerCase()}</em>` : ""}</div>` : ""}
  </article>`;
}

function boardMarkup(boardSeat, label) {
  const view = publicView(state);
  const own = boardSeat === seat && handVisible;
  const cards = view.board[boardSeat];
  const setupActive = state.phase === `setup-${seat}` && boardSeat === seat;
  const visibleCards = setupActive ? setupOrder[seat].map((id) => cards.find((card) => card.id === id)) : cards;
  const boardPosition = boardSeat === seat ? "own" : "opponent";
  const hint = setupActive ? "Kéo thả hoặc dùng ‹ › để xếp" : "Role lộ diện được đưa vào giữa bàn";
  const slotMarkup = (card, index) => !setupActive && card.role !== "?"
    ? `<div class="lifted-slot ${card.alive ? "" : "dead"}"><span>${card.id}</span><strong>${card.role}</strong><small>TRÊN BÀN ĐẤU</small></div>`
    : cardMarkup(card, own, setupActive ? index : -1);
  return `<section class="board board-${boardSeat.toLowerCase()} board-${boardPosition} ${setupActive ? "board-setup" : ""}">
    <div class="board-title"><h2>${label} · Bên ${boardSeat}</h2><span>${hint}</span></div>
    ${boardSeat === seat && !handVisible
      ? `<div class="privacy"><div><p>Tay bài đang được che</p><button type="button" data-reveal-hand>Hiện bài bên ${seat}</button></div></div>`
      : `<div class="card-row">${visibleCards.map(slotMarkup).join("")}</div>`}
  </section>`;
}

function revealedLaneMarkup(boardSeat) {
  const cards = state.phase.startsWith("setup-") ? [] : publicView(state).board[boardSeat].filter((card) => card.role !== "?");
  return `<section class="revealed-lane lane-${boardSeat.toLowerCase()}" aria-label="Role ${boardSeat} đã lộ">
    <div class="revealed-cards">${cards.map((card) => `<div class="revealed-slot" style="grid-column:${Number(card.id.slice(1))}">${cardMarkup(card, boardSeat === seat)}</div>`).join("")}</div>
  </section>`;
}

function moveReplayMarkup() {
  if (!lastMove) return "";
  const [icon, label] = MOVE_META[lastMove.kind] || ["◆", lastMove.kind];
  return `<div class="move-replay move-${lastMove.actor.toLowerCase()}" aria-live="polite">
    ${dawnPresentation?.stage === "reveal" ? `<span class="dawn-replay-progress">BÌNH MINH · KẾT QUẢ ${dawnPresentation.index + 1}/${dawnPresentation.moves.length}</span>` : ""}
    ${actionPresentation?.type === "night-staging" ? `<span class="dawn-replay-progress turn-replay-progress">LỆNH ĐÊM · ${actionPresentation.index + 1}/2 · A → B</span>` : actionPresentation?.type === "action" ? `<span class="dawn-replay-progress turn-replay-progress">BÊN ${actionPresentation.actor} · ĐANG GIẢI QUYẾT</span>` : ""}
    <span class="move-actor">${lastMove.actor === seat ? "BẠN" : "BOT B"}</span>
    <span class="move-card">${lastMove.sourceLabel}</span>
    <span class="move-icon">${icon}</span>
    <span class="move-card target">${lastMove.target || lastMove.hiddenTarget ? lastMove.targetLabel : label}</span>
    <strong>${label}</strong>
    ${lastMove.outcome ? `<span class="move-result result-${lastMove.outcome}">${COMBAT_RESULTS[lastMove.outcome]}</span>` : ""}
    ${lastMove.deathReason ? `<span class="move-reason"><b>VÌ SAO?</b> ${lastMove.deathReason.detail}</span>` : lastMove.explanation ? `<span class="move-reason move-explanation"><b>DIỄN GIẢI</b> ${lastMove.explanation}</span>` : ""}
  </div>`;
}

function playCombatEffect() {
  if (!lastMove?.target || !ACTION_EFFECT_KINDS.has(lastMove.kind) || playedMoveId === lastMove.id || deferredCombatMoveId === lastMove.id) return;
  const layer = document.querySelector(".combat-fx-layer");
  const target = document.querySelector(`[data-card-id="${lastMove.target}"]`);
  if (!layer || !target) return;

  const source = lastMove.source ? document.querySelector(`[data-card-id="${lastMove.source}"]`) : null;
  const targetRect = target.getBoundingClientRect();
  const sourceRect = source?.getBoundingClientRect();
  const startX = sourceRect ? sourceRect.left + sourceRect.width / 2 : targetRect.left + targetRect.width / 2;
  const startY = sourceRect ? sourceRect.top + sourceRect.height / 2 : Math.max(72, targetRect.top - 120);
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;
  const reasonX = lastMove.sourceDied && sourceRect ? startX : endX;
  const reasonY = lastMove.sourceDied && sourceRect ? startY : endY;
  const travelX = endX - startX;
  const travelY = endY - startY;
  const distance = Math.hypot(travelX, travelY);
  const angle = Math.atan2(travelY, travelX) * 180 / Math.PI;
  const [icon] = MOVE_META[lastMove.kind] || ["◆"];
  const result = COMBAT_RESULTS[lastMove.outcome] || COMBAT_RESULTS.hit;

  playedMoveId = lastMove.id;
  document.body.dataset.lastEffect = lastMove.kind;
  layer.style.setProperty("--start-x", `${startX}px`);
  layer.style.setProperty("--start-y", `${startY}px`);
  layer.style.setProperty("--end-x", `${endX}px`);
  layer.style.setProperty("--end-y", `${endY}px`);
  layer.style.setProperty("--reason-x", `${reasonX}px`);
  layer.style.setProperty("--reason-y", `${reasonY}px`);
  layer.style.setProperty("--travel-x", `${travelX}px`);
  layer.style.setProperty("--travel-y", `${travelY}px`);
  layer.style.setProperty("--distance", `${distance}px`);
  layer.style.setProperty("--angle", `${angle}deg`);

  if (lastMove.kind === "inspect") {
    source?.classList.add("fx-seer-source");
    target.classList.add("fx-inspected");
    layer.innerHTML = `<div class="seer-beam"></div><div class="seer-lens"><span>◉</span><strong>TIÊN TRI ĐANG SOI</strong><small>${lastMove.targetLabel}</small></div><div class="seer-scanline"></div>`;
    return;
  }

  if (lastMove.kind === "defend") {
    source?.classList.add("fx-guard-source");
    target.classList.add("fx-defended");
    layer.innerHTML = `<div class="shield-dome"><i></i><span>◈</span><strong>KHIÊN ĐÃ ĐẶT</strong><small>${lastMove.targetLabel}</small></div><div class="shield-ripple"></div>`;
    return;
  }

  if (lastMove.kind === "accuse") {
    target.classList.add("fx-condemned");
    lastMove.voters.forEach((id) => document.querySelector(`[data-card-id="${id}"]`)?.classList.add("fx-voter"));
    layer.innerHTML = `<div class="vote-council"><span>3 PHIẾU ĐÃ KHÓA</span><strong>${lastMove.voters.join(" · ")}</strong></div>${lastMove.councilSucceeded ? `<div class="gallows-rope"><i></i><span>⚖</span><strong>PHÁN QUYẾT TREO CỔ</strong><small>${lastMove.targetLabel}</small></div>` : `<div class="council-failed"><span>⚖</span><strong>BUỘC TỘI KHÔNG THÀNH</strong><small>${lastMove.targetLabel} sống sót</small></div>`}`;
    return;
  }

  source?.classList.add("fx-attacker");
  if (lastMove.killerKnown && source) source.classList.add("fx-known-killer");
  target.classList.add(lastMove.outcome === "blocked" ? "fx-blocked" : "fx-hit");
  if (lastMove.targetDied) target.classList.add("fx-killed");
  if (lastMove.sourceDied && source) source.classList.add("fx-killed");

  const killerCue = lastMove.killerKnown && source
    ? `<div class="killer-caption known"><span>HUNG THỦ</span><strong>${lastMove.sourceLabel}</strong></div>`
    : lastMove.mysteryKiller
      ? `<div class="mystery-assailant"><span class="mystery-mark">?</span><strong>BỊ KẺ GIẤU MẶT HÃM HẠI</strong><small>Danh tính kẻ ra tay chưa được công khai</small></div>`
      : "";
  const reasonCue = lastMove.deathReason
    ? `<div class="combat-death-reason"><span>${lastMove.deathReason.short}</span><strong>${lastMove.deathReason.detail}</strong></div>`
    : "";
  const skillCue = lastMove.kind === "shoot"
    ? `<div class="muzzle-flash"><i></i><strong>ĐOÀNG!</strong></div>`
    : lastMove.kind === "purify"
      ? `<div class="holy-sigil"><i>✦</i><strong>THANH TẨY ${lastMove.targetLabel}</strong></div>`
      : "";
  layer.innerHTML = `<div class="combat-trail fx-${lastMove.kind}"></div>
    <div class="combat-projectile fx-${lastMove.kind}"><span>${icon}</span></div>
    <div class="combat-impact outcome-${lastMove.outcome || "hit"}"><i></i><strong>${result}</strong></div>
    ${skillCue}${killerCue}${reasonCue}`;
}

function activeForSeat() {
  if (dawnActive || actionPresentation) return false;
  if (state.phase.startsWith("setup-")) return state.phase === `setup-${seat}`;
  if (state.phase === "purge") return true;
  if (state.phase === "council" || state.phase === "purge" || state.phase === "dusk-defense" || state.phase === "night-plan" || state.phase === "final-duel") return true;
  return state.phase === `day-${seat}`;
}

function alreadyLocked() {
  if (state.phase.startsWith("setup-")) return ownPlayer().setupLocked;
  if (state.phase === "purge") return state.players[seat].purge !== null;
  if (state.phase === "council") return Boolean(ownPlayer().council);
  if (state.phase === "dusk-defense") return ownPlayer().defense !== null;
  if (state.phase === "night-plan") return Boolean(ownPlayer().night);
  if (state.phase === "final-duel") return Boolean(ownPlayer().finalGuess);
  return false;
}

function actionKinds() {
  if (state.phase === "purge") return [["purge", "Thanh trừng"]];
  if (state.phase === "council") {
    const kinds = [["pass", "Bỏ qua"], ["accuse", "Chọn 3 role để treo cổ"]];
    if (sourceFor("wolfguard") && privateCard(sourceFor("wolfguard")).uses.rescue > 0) kinds.push(["protect", "Sói Hộ Vệ bảo kê"]);
    return kinds;
  }
  if (state.phase.startsWith("day-")) {
    const kinds = [["pass", "Bỏ lượt"]];
    const revealedEnemy = state.players[otherSeat(seat)].board.filter((card) => card.alive && card.revealed).length;
    if (sourceFor("shooter") && revealedEnemy >= 2) kinds.push(["shoot", "Xạ thủ bắn"]);
    if (sourceFor("witch") && ownPlayer().board.some((card) => !card.alive)) kinds.push(["revive", "Phù thủy hồi sinh"]);
    if (sourceFor("avenger")) kinds.push(["mark", "Kẻ báo thù đánh dấu"]);
    if (sourceFor("priest") && privateCard(sourceFor("priest")).uses.holyWater > 0) kinds.push(["purify", "Mục sư thanh tẩy"]);
    return kinds;
  }
  if (state.phase === "dusk-defense") return [["pass", "Không đặt khiên"], ["defend", "Bảo vệ một lá"]];
  if (state.phase === "night-plan") {
    const kinds = [["pass", "Bỏ main order"]];
    if (sourceFor("wolf")) kinds.push(["attack", "Ma sói tấn công"]);
    if (sourceFor("seer")) kinds.push(["inspect", "Tiên tri soi"]);
    if (sourceFor("witch")) kinds.push(["poison", "Phù thủy dùng độc"]);
    return kinds;
  }
  if (state.phase === "final-duel") return [["final", "Đoán role cuối"]];
  return [];
}

function actionFields() {
  const enemy = state.players[otherSeat(seat)].board;
  const own = ownPlayer().board;
  if (state.phase === "purge") return `<label class="field"><span>Lá của phe mình</span><select name="purgeTarget">${cardOptions(own)}</select></label><label class="field"><span>Lá đối thủ để đổi vị trí</span><select name="purgeSwapTarget">${cardOptions(enemy)}</select></label>`;
  if (state.phase === "council") return `
    <label class="field conditional" data-for="accuse"><span>Mục tiêu</span><select name="target">${cardOptions(enemy)}</select></label>
    <label class="field conditional" data-for="accuse"><span>Đoán role còn lại</span><select name="guess">${roleOptions(availableRoleGuesses(state, otherSeat(seat)))}</select></label>
    <fieldset class="voter-field conditional" data-for="accuse"><legend>Chọn đúng 3 role Dân đang sống · lá úp sẽ lộ khi Hội đồng xử lý</legend><div class="voters">${own.filter((card) => card.alive && ROLE_DEFS[card.role].faction === "village").map((card) => `<label><input type="checkbox" name="voter" value="${card.id}" /> ${card.id}</label>`).join("")}</div></fieldset>
    <label class="field conditional" data-for="protect"><span>Lá muốn bảo kê</span><select name="protectTarget">${cardOptions(own)}</select></label>`;
  if (state.phase.startsWith("day-")) return `
    <label class="field conditional" data-for="shoot"><span>Mục tiêu đã lộ</span><select name="shootTarget">${cardOptions(enemy.filter((card) => card.revealed))}</select></label>
    <label class="field conditional" data-for="revive"><span>Lá muốn hồi sinh</span><select name="reviveTarget">${deadCardOptions(own)}</select></label>
    <label class="field conditional" data-for="mark purify"><span>Mục tiêu bên ${otherSeat(seat)}</span><select name="dayTarget">${cardOptions(enemy)}</select></label>`;
  if (state.phase === "dusk-defense") return `<label class="field conditional" data-for="defend"><span>Vị trí đặt khiên</span><select name="defendTarget">${cardOptions(own)}</select></label>`;
  if (state.phase === "night-plan") return `<label class="field conditional" data-for="attack inspect poison"><span>Mục tiêu bí mật bên ${otherSeat(seat)}</span><select name="nightTarget">${cardOptions(enemy)}</select></label>`;
  if (state.phase === "final-duel") return `<label class="field conditional" data-for="final"><span>Role dự đoán</span><select name="finalGuess">${roleOptions()}</select></label>`;
  return "";
}

function controlMarkup() {
  if (state.phase === "ended") return `<section class="control-panel"><h2>${state.result?.winner ? `Bên ${state.result.winner} thắng` : "Ván hòa"}</h2><p>${state.result?.reason}</p><button class="primary" type="button" data-reset>Chơi lại</button></section>`;
  if (!activeForSeat()) return `<section class="control-panel bot-wait"><span class="bot-orbit" aria-hidden="true"></span><h2>BOT B đang suy nghĩ</h2><p>Đối thủ tự chọn hành động dựa trên thông tin hợp lệ của nó.</p></section>`;
  if (alreadyLocked()) return `<section class="control-panel bot-wait"><span class="bot-orbit" aria-hidden="true"></span><h2>Đã khóa lựa chọn</h2><p>BOT B đang tính lượt đáp lại.</p></section>`;
  if (state.phase.startsWith("setup-")) return `<section class="control-panel setup-panel"><p class="step-label">Bước 1 · Sắp xếp bộ bài</p><h2>Xếp vị trí các lá bài theo thứ tự bạn muốn</h2><p>Thứ tự từ trái sang phải sẽ trở thành ${seat}1–${seat}10 và được giữ cố định trong suốt trận. Kéo thả hoặc dùng ‹ › để đổi vị trí.</p><button class="primary" type="button" data-lock-setup>Khóa thứ tự 10 lá</button><p class="feedback">${feedback}</p></section>`;
  const kinds = actionKinds();
  return `<section class="control-panel">
    <h2>Quyết định của bên ${seat}</h2>
    <p>Role nguồn được hệ thống tự chọn và chỉ lộ khi luật yêu cầu.</p>
    <form class="action-form" id="action-form">
      <label class="field"><span>Hành động</span><select name="kind">${kinds.map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select></label>
      ${actionFields()}
      <button class="primary" type="submit">Khóa lựa chọn</button>
      <p class="feedback" aria-live="polite">${feedback}</p>
    </form>
  </section>`;
}

function historyMarkup() {
  const own = privateView(state, seat);
  return `<aside class="history-panel"><h2>Diễn biến công khai</h2><ol class="history-list">${state.log.slice(-6).reverse().map((item) => `<li>${item}</li>`).join("")}</ol>${own.notes.length && handVisible ? `<div class="notes"><strong>Ghi chú riêng:</strong><br>${own.notes.join("<br>")}</div>` : ""}</aside>`;
}

function battlefieldActionMarkup() {
  if (state.phase.startsWith("setup-") || state.phase === "ended") return controlMarkup();
  if (dawnActive) {
    const presentation = dawnPresentation;
    if (presentation?.stage === "complete") return `<div class="battle-action dawn-reveal dawn-complete"><span class="dawn-sun">☀</span><p class="battle-step">Bình minh hoàn tất</p><strong>Trời đã sáng</strong><p>Bàn đấu đã cập nhật xong. Lượt tiếp theo sẽ mở ngay sau tín hiệu này.</p></div>`;
    if (presentation?.stage === "reveal") return `<div class="battle-action dawn-reveal dawn-step"><span class="dawn-lock">THAO TÁC ĐANG KHÓA</span><p class="battle-step">Kết quả ${presentation.index + 1}/${presentation.moves.length}</p><strong>Đang công bố từng lệnh</strong><p>Các lệnh đã được khóa đồng thời; đây là thứ tự trình bày để bạn theo dõi nguyên nhân và kết quả.</p></div>`;
    return `<div class="battle-action dawn-reveal dawn-opening"><span class="dawn-sun">◒</span><span class="dawn-lock">THAO TÁC ĐANG KHÓA</span><p class="battle-step">Chuyển giao ngày đêm</p><strong>Bình minh đang hé lộ</strong><p>${presentation?.moves.length || 0} lệnh đêm sẽ lần lượt được công bố. Khoan hành động cho tới khi trời sáng hẳn.</p></div>`;
  }
  if (actionPresentation) {
    if (actionPresentation.type === "council-resolution") {
      const sequenceStep = actionPresentation.sequence[actionPresentation.index];
      if (actionPresentation.stage === "voter") return `<div class="battle-action turn-presentation presentation-${actionPresentation.actor.toLowerCase()}"><span class="dawn-lock">THAO TÁC ĐANG KHÓA</span><p class="battle-step">Hội đồng bên ${actionPresentation.actor}</p><strong>${sequenceStep?.voterIndex + 1}/${sequenceStep?.voterTotal} người bỏ phiếu đang lộ diện</strong><p>${actionPresentation.voterId} đang từ từ bước lên sân. Phán quyết chỉ diễn ra sau khi đủ ba người.</p></div>`;
      return `<div class="battle-action turn-presentation presentation-${actionPresentation.actor.toLowerCase()}"><span class="dawn-lock">THAO TÁC ĐANG KHÓA</span><p class="battle-step">Đủ 3 phiếu · Hội đồng bên ${actionPresentation.actor}</p><strong>Đang công bố phán quyết treo cổ</strong><p>Ba người bỏ phiếu đã hiện diện; mục tiêu và kết quả được xử lý ở nhịp cuối.</p></div>`;
    }
    if (actionPresentation.type === "night-staging") {
      const step = actionPresentation.steps[actionPresentation.index];
      return `<div class="battle-action turn-presentation presentation-night"><span class="dawn-lock">THAO TÁC ĐANG KHÓA</span><p class="battle-step">Lệnh đêm ${actionPresentation.index + 1}/2 · A → B</p><strong>Bên ${step?.actor || "A"} đang bước lên sân</strong><p>Từng nguồn lệnh được di chuyển và lộ riêng. Bên B chỉ xuất hiện sau khi hoạt cảnh của A kết thúc.</p></div>`;
    }
    const stage = actionPresentation.stage === "source" ? "Đang đưa nhân vật lên sân" : "Đang công bố kết quả";
    return `<div class="battle-action turn-presentation presentation-${actionPresentation.actor.toLowerCase()}"><span class="dawn-lock">THAO TÁC ĐANG KHÓA</span><p class="battle-step">Bên ${actionPresentation.actor} đang hành động</p><strong>${stage}</strong><p>Nguồn lệnh di chuyển trước; mục tiêu, lộ bài và thương vong chỉ xuất hiện ở nhịp kế tiếp.</p></div>`;
  }
  if (state.phase === "night-resolution") return `<div class="battle-action night-verdict"><span class="verdict-moon">☾</span><strong>Lệnh đã lên sân</strong><p>Nguồn và vị trí có khiên đang hiển thị. Mục tiêu vẫn bí mật; bình minh phán xét sau 3,2 giây.</p></div>`;
  if (botNeedsTurn() || !activeForSeat() || alreadyLocked()) return `<div class="battle-action bot-battle"><span class="bot-orbit" aria-hidden="true"></span><strong>BOT B đang cân nhắc</strong><p>Bạn có khoảng 1,7 giây để nhìn trạng thái bàn trước khi bot đi.</p></div>`;
  if (state.phase === "purge") return `<div class="battle-action purge-panel"><p class="battle-step">Thanh trừng · Vòng ${state.round}</p><strong>${["Cắt bỏ", "Đảo chiến tuyến", "Ép lộ diện", "Khóa mạch"][(state.round - 6) % 4]}</strong><p>Hai bên bắt buộc chọn. Màu đỏ báo hiệu bàn đấu đã bước vào giai đoạn thanh trừng.</p></div>`;
  if (interaction?.kind === "purge" || interaction?.kind === "purge-swap") return `<div class="battle-action purge-panel"><p class="battle-step">Thanh trừng · Vòng ${state.round}</p><strong>${["Cắt bỏ", "Đảo chiến tuyến", "Ép lộ diện", "Khóa mạch"][(state.round - 6) % 4]}</strong><p>${interaction.kind === "purge-swap" ? "Chọn một lá đối thủ để đổi vị trí." : "Chọn một lá phe mình. Hai bên bắt buộc hoàn tất lựa chọn."}</p><button class="battle-cancel" type="button" data-direct-cancel>Hủy chọn</button></div>`;
  if (state.phase === "purge") {
    const purgeRule = ["Cắt bỏ", "Đảo chiến tuyến", "Ép lộ diện", "Khóa mạch"][(state.round - 6) % 4];
    return `<div class="battle-action purge-panel"><p class="battle-step">Thanh trừng · Vòng ${state.round}</p><strong>${purgeRule}</strong><p>Chọn một lá phe mình. ${purgeRule === "Đảo chiến tuyến" ? "Sau đó chọn lá đối thủ để đổi vị trí." : "Hai bên bắt buộc hoàn tất lựa chọn."}</p></div>`;
  }
  if (state.phase === "council") { {
      const guesses = availableRoleGuesses(state, otherSeat(seat));
      return `<div class="battle-action"><p class="battle-step">Bước 3 · Đoán role còn lại của ${interaction.target}</p><div class="role-guess-grid">${guesses.map((key) => `<button type="button" data-direct-guess="${key}">${ROLE_DEFS[key].name}</button>`).join("")}</div><p>Những role đã lộ đủ số lượng trên sân được tự động loại trừ.</p><button class="battle-cancel" type="button" data-direct-cancel>Chọn lại</button></div>`;
    }
    if (interaction?.kind === "accuse") {
      const power = votePower(interaction.voters);
      return `<div class="battle-action"><p class="battle-step">${power === 3 ? "Bước 2 · Chọn một lá đối thủ" : "Bước 1 · Chọn 3 role Dân còn sống"}</p><strong>${power}/3 nhân vật đã chọn</strong><p>${power === 3 ? "Card đã lộ sẽ xử lý ngay; card úp mới cần đoán role." : "Có thể chọn cả card đang úp phía dưới; chúng sẽ lộ khi Hội đồng xử lý."}</p><button class="battle-cancel" type="button" data-direct-cancel>Hủy buộc tội</button></div>`;
    }
    if (interaction?.kind === "protect") return `<div class="battle-action"><p class="battle-step">Chọn lá bên mình cần bảo kê</p><strong>Sói Hộ Vệ đang chờ lệnh</strong><button class="battle-cancel" type="button" data-direct-cancel>Hủy</button></div>`;
    const wolfguard = sourceFor("wolfguard") && privateCard(sourceFor("wolfguard")).uses.rescue > 0;
    return `<div class="battle-action"><p class="battle-step">Hành động phụ · vẫn giữ lượt Ban ngày</p><strong>Lập Hội đồng treo cổ</strong><p>Cần đúng 3 role Dân còn sống; card đang úp vẫn chọn được và sẽ lộ khi xử lý.</p><div class="battle-buttons"><button type="button" data-council-mode="accuse">Chọn 3 người</button>${wolfguard ? `<button type="button" data-council-mode="protect">Bảo kê</button>` : ""}<button type="button" data-direct-pass>Bỏ qua</button></div></div>`;
  }
  if (state.phase === "final-duel") return `<div class="battle-action"><p class="battle-step">Final Duel</p><strong>Đoán role cuối của BOT</strong><div class="role-guess-grid">${Object.entries(ROLE_DEFS).map(([key, role]) => `<button type="button" data-final-guess="${key}">${role.name}</button>`).join("")}</div></div>`;
  if (interaction) {
    if (interaction.kind === "bloodmoon") return `<div class="battle-action special-order"><p class="battle-step">Card đặc biệt · ${SPECIAL_CARD.name}</p><strong>Chọn một role đối thủ đã lộ</strong><p>Đòn này dùng Main Order, bị khiên chặn và hồi lại sau ${SPECIAL_CARD.cooldownRounds} vòng.</p><button class="battle-cancel" type="button" data-direct-cancel>Hủy chọn</button></div>`;
    const source = state.players.A.board.find((card) => card.id === interaction.source);
    return `<div class="battle-action"><p class="battle-step">Đã chọn ${source ? ROLE_DEFS[source.role].name : "hành động"}</p><strong>Chọn lá đang sáng làm mục tiêu</strong><p>${ROLE_SKILLS[source?.role] || ""}</p><button class="battle-cancel" type="button" data-direct-cancel>Hủy chọn</button></div>`;
  }
  const special = state.round >= SPECIAL_CARD.unlockRound && state.phase === "night-plan"
    ? `<button class="special-action-card ${state.players.A.bloodMoonReadyRound <= state.round ? "ready" : "cooldown"}" type="button" ${state.players.A.bloodMoonReadyRound <= state.round ? "data-special-action" : "disabled"}><span>ROUND 6+</span><strong>◐ ${SPECIAL_CARD.name}</strong><small>${state.players.A.bloodMoonReadyRound <= state.round ? "Sẵn sàng · đánh role đã lộ" : `Hồi lại Vòng ${state.players.A.bloodMoonReadyRound}`}</small></button>`
    : "";
  const phasePrompt = state.phase.startsWith("day-")
    ? { className: "prompt-day", step: "Bước 2 · Trời đang sáng", title: "Chọn nhân vật đang phát sáng để dùng kỹ năng", detail: "Nhấp nhân vật nguồn, sau đó chọn lá mục tiêu đang sáng trên bàn." }
    : state.phase === "night-plan"
      ? { className: "prompt-night", step: "Trời đã tối · Khóa lệnh đêm", title: "Chọn nhân vật phát sáng để dùng kỹ năng ban đêm", detail: "Nguồn lệnh sẽ bước lên sân; mục tiêu vẫn được giữ bí mật đến bình minh." }
      : { className: "prompt-dusk", step: "Chạng vạng · Đặt khiên", title: "Chọn Bảo vệ đang phát sáng hoặc bỏ lượt", detail: "Khiên công khai vị trí được bảo vệ nhưng không làm lộ role của lá đó." };
  return `<div class="battle-action turn-prompt ${phasePrompt.className}"><p class="battle-step">${phasePrompt.step}</p><strong>${phasePrompt.title}</strong><p>${phasePrompt.detail}</p>${special}<button class="battle-pass" type="button" data-direct-pass>Bỏ lượt</button></div>`;
}

function roundTitle() {
  if (dawnPresentation?.stage === "complete") return `VÒNG ${state.round} · TRỜI ĐÃ SÁNG`;
  if (dawnPresentation?.stage === "reveal") return `BÌNH MINH · KẾT QUẢ ${dawnPresentation.index + 1}/${dawnPresentation.moves.length}`;
  if (dawnActive) return `VÒNG ${state.round} · BÌNH MINH ĐANG HÉ LỘ`;
  if (actionPresentation?.type === "night-staging") return `VÒNG ${state.round} · LỆNH ĐÊM ${actionPresentation.index + 1}/2 · A → B`;
  if (actionPresentation) return `VÒNG ${state.round} · BÊN ${actionPresentation.actor} ĐANG HÀNH ĐỘNG`;
  if (state.phase === "council") return `VÒNG ${state.round} · HỘI ĐỒNG TREO CỔ`;
  if (state.phase === "day-A") return `VÒNG ${state.round} · BAN NGÀY — LƯỢT CỦA BẠN`;
  if (state.phase === "day-B") return `VÒNG ${state.round} · BAN NGÀY — BOT HÀNH ĐỘNG`;
  if (state.phase === "dusk-defense") return `VÒNG ${state.round} · CHẠNG VẠNG — ĐẶT KHIÊN`;
  if (state.phase === "night-plan") return `VÒNG ${state.round} · KHÓA LỆNH ĐÊM`;
  if (state.phase === "night-resolution") return `VÒNG ${state.round} · BAN ĐÊM — CHỜ PHÁN XÉT`;
  if (state.phase === "final-duel") return `VÒNG ${state.round} · FINAL DUEL`;
  return PHASE_LABEL[state.phase];
}

function visualScene() {
  if (dawnActive) return "dawn";
  if (state.phase === "purge") return "purge";
  if (state.phase === "dusk-defense") return "dusk";
  if (state.phase === "night-plan" || state.phase === "night-resolution") return "night";
  return "day";
}

function arenaMarkup() {
  const view = publicView(state);
  const hasRevealedCards = [...view.board.A, ...view.board.B].some((card) => card.role !== "?");
  const isSetup = state.phase.startsWith("setup-");
  return `<section class="arena">
    ${boardMarkup(otherSeat(seat), "Đối thủ")}
    <div class="center-table ${hasRevealedCards ? "" : "center-empty"} ${isSetup ? "setup-center" : ""}">${revealedLaneMarkup(otherSeat(seat))}${revealedLaneMarkup(seat)}${isSetup ? `<div class="setup-center-command">${controlMarkup()}</div>` : ""}</div>
    ${boardMarkup(seat, "Tay của bạn")}
  </section>`;
}

function commandDockMarkup() {
  if (state.phase.startsWith("setup-")) return "";
  return `<section class="command-dock" aria-label="Hướng dẫn và thao tác">
    <div class="table-action-stack">${battlefieldActionMarkup()}${moveReplayMarkup()}</div>
  </section>`;
}

function render() {
  const targeting = interaction && (state.phase.startsWith("day-") || state.phase === "night-plan") ? " targeting-active" : "";
  const dawnStage = dawnPresentation ? ` dawn-stage-${dawnPresentation.stage}` : "";
  document.body.className = `duel-only scene-${visualScene()}${dawnStage}${targeting}`;
  const topbar = `<header class="topbar"><div class="brand"><span class="brand-mark">TF</span>TWOFOLD</div><span class="round">Local playtest · Vòng ${state.round}</span><span class="phase-chip">${roundTitle()}</span><div class="seat-toggle"><span class="human-seat">A · BẠN</span><span class="bot-seat ${botNeedsTurn() ? "thinking" : ""}"><i></i>B · BOT</span></div><button class="reset" type="button" data-reset>Reset</button></header>`;
  const arena = arenaMarkup();
  const history = historyMarkup();
  const body = `<div class="play-grid">${arena}<div class="side-rail">${history}${commandDockMarkup()}</div></div>`;
  app.innerHTML = `<div class="shell">${topbar}${body}<div class="combat-fx-layer" aria-hidden="true"></div></div>`;
  syncConditionalFields();
  requestAnimationFrame(playCombatEffect);
  if (!dawnActive) scheduleBot();
  scheduleNightResolution();
}

function syncConditionalFields() {
  const form = document.querySelector("#action-form");
  if (!form) return;
  const kind = form.elements.kind.value;
  form.querySelectorAll(".conditional").forEach((field) => {
    field.hidden = !field.dataset.for.split(" ").includes(kind);
  });
}

function submitAction(form) {
  const data = new FormData(form);
  const kind = data.get("kind");
  let action;
  if (state.phase === "purge") action = { type: "purge.submit", seat, target: data.get("purgeTarget"), swapTarget: data.get("purgeSwapTarget") };
  else if (state.phase === "council") action = kind === "pass"
    ? { type: "council.submit", seat, kind }
    : kind === "protect"
      ? { type: "council.submit", seat, kind, source: sourceFor("wolfguard"), target: data.get("protectTarget") }
      : { type: "council.submit", seat, kind, target: data.get("target"), guess: data.get("guess"), voters: data.getAll("voter") };
  else if (state.phase.startsWith("day-")) action = kind === "pass"
    ? { type: "day.submit", seat, kind }
    : kind === "shoot"
      ? { type: "day.submit", seat, kind, source: sourceFor("shooter"), target: data.get("shootTarget") }
      : kind === "revive"
        ? { type: "day.submit", seat, kind, source: sourceFor("witch"), target: data.get("reviveTarget") }
        : { type: "day.submit", seat, kind, source: sourceFor(kind === "mark" ? "avenger" : "priest"), target: data.get("dayTarget") };
  else if (state.phase === "dusk-defense") action = kind === "pass"
    ? { type: "defense.submit", seat, pass: true }
    : { type: "defense.submit", seat, pass: false, source: sourceFor("guard"), target: data.get("defendTarget") };
  else if (state.phase === "night-plan") action = kind === "pass"
    ? { type: "night.submit", seat, kind }
    : { type: "night.submit", seat, kind, source: sourceFor(kind === "attack" ? "wolf" : kind === "inspect" ? "seer" : "witch"), target: data.get("nightTarget") };
  else action = { type: "final.submit", seat, guess: data.get("finalGuess") };

  try {
    const beforeState = structuredClone(state);
    const nextState = dispatch(state, action);
    if (action.type === "day.submit") {
      interaction = null;
      handVisible = true;
      startActionPresentation(action, seat, beforeState, nextState);
      return;
    }
    state = nextState;
    if (action.type !== "night.submit" && action.type !== "council.submit") showMove(action, seat);
    feedback = "Lựa chọn hợp lệ và đã khóa.";
    handVisible = true;
  } catch (error) {
    feedback = error.message;
  }
  render();
}

function commitDirectAction(action) {
  try {
    const beforeState = structuredClone(state);
    const nextState = dispatch(state, action);
    if (action.type === "day.submit") {
      interaction = null;
      handVisible = true;
      startActionPresentation(action, "A", beforeState, nextState);
      return;
    }
    state = nextState;
    if (action.type !== "night.submit" && action.type !== "council.submit") showMove(action, "A");
    interaction = null;
    feedback = action.type === "night.submit"
      ? "Lệnh đêm của A đã khóa bí mật. Chờ B chọn xong để trình diễn A → B."
      : "Hành động đã khóa. BOT B đang suy nghĩ.";
  } catch (error) {
    feedback = error.message;
  }
  handVisible = true;
  render();
}

function chooseDirectTarget(target) {
  if (!interaction || !directTargetIds().has(target)) return;
  if (interaction.kind === "accuse") {
    const voters = [...interaction.voters];
    const targetCard = state.players.B.board.find((card) => card.id === target);
    if (targetCard?.revealed) return commitDirectAction({ type: "council.submit", seat: "A", kind: "accuse", target, voters });
    interaction.target = target;
    return render();
  }
  if (interaction.kind === "purge") {
    interaction.target = target;
    const rule = ["cut", "swap", "reveal", "lock"][(state.round - 6) % 4];
    if (rule !== "swap") return commitDirectAction({ type: "purge.submit", seat: "A", target });
    interaction.kind = "purge-swap";
    return render();
  }
  if (interaction.kind === "purge-swap") return commitDirectAction({ type: "purge.submit", seat: "A", target: interaction.target, swapTarget: target });
  if (interaction.kind === "protect") return commitDirectAction({ type: "council.submit", seat: "A", kind: "protect", source: interaction.source, target });
  if (interaction.kind === "defend") return commitDirectAction({ type: "defense.submit", seat: "A", pass: false, source: interaction.source || sourceFor("guard"), target });
  if (state.phase.startsWith("day-")) return commitDirectAction({ type: "day.submit", seat: "A", kind: interaction.kind, source: interaction.source, target });
  return commitDirectAction({ type: "night.submit", seat: "A", kind: interaction.kind, source: interaction.source, target });
}

function directPass() {
  interaction = null;
  if (state.phase === "council") return commitDirectAction({ type: "council.submit", seat: "A", kind: "pass" });
  if (state.phase.startsWith("day-")) return commitDirectAction({ type: "day.submit", seat: "A", kind: "pass" });
  if (state.phase === "dusk-defense") return commitDirectAction({ type: "defense.submit", seat: "A", pass: true });
  if (state.phase === "night-plan") return commitDirectAction({ type: "night.submit", seat: "A", kind: "pass" });
}

document.addEventListener("click", (event) => {
  const directTarget = event.target.closest("[data-direct-target]");
  if (directTarget) return chooseDirectTarget(directTarget.dataset.directTarget);
  const directSource = event.target.closest("[data-direct-source]");
  if (directSource) {
    const source = directSource.dataset.directSource;
    const kind = directSource.dataset.directKind;
    if (kind === "vote") {
      interaction.voters ||= [];
      interaction.voters = interaction.voters.includes(source)
        ? interaction.voters.filter((id) => id !== source)
        : interaction.voters.length < 3 ? [...interaction.voters, source] : interaction.voters;
    } else interaction = { source, kind };
    return render();
  }
  if (event.target.closest("[data-direct-cancel]")) {
    interaction = null;
    return render();
  }
  if (event.target.closest("[data-special-action]")) {
    interaction = { kind: "bloodmoon", source: null };
    return render();
  }
  if (event.target.closest("[data-direct-pass]")) return directPass();
  if (state.phase === "purge") {
    const rule = ["cut", "swap", "reveal", "lock"][(state.round - 6) % 4];
    interaction = { kind: "purge", rule, target: null, swapTarget: null };
    return render();
  }
  const councilMode = event.target.closest("[data-council-mode]")?.dataset.councilMode;
  if (councilMode === "accuse") {
    interaction = { kind: "accuse", voters: [], target: null };
    return render();
  }
  if (councilMode === "protect") {
    interaction = { kind: "protect", source: sourceFor("wolfguard") };
    return render();
  }
  const directGuess = event.target.closest("[data-direct-guess]")?.dataset.directGuess;
  if (directGuess) return commitDirectAction({ type: "council.submit", seat: "A", kind: "accuse", target: interaction.target, guess: directGuess, voters: interaction.voters });
  const finalGuess = event.target.closest("[data-final-guess]")?.dataset.finalGuess;
  if (finalGuess) return commitDirectAction({ type: "final.submit", seat: "A", guess: finalGuess });
  if (event.target.closest("[data-reveal-hand]")) {
    handVisible = true;
    return render();
  }
  if (event.target.closest("[data-reset]")) {
    state = createGame(`codex-web-${Date.now()}`);
    setupOrder = { A: state.players.A.board.map((card) => card.id), B: state.players.B.board.map((card) => card.id) };
    seat = "A";
    handVisible = true;
    interaction = null;
    lastMove = null;
    clearTimeout(moveTimer);
    moveTimer = null;
    clearTimeout(resolutionTimer);
    resolutionTimer = null;
    clearTimeout(dawnTimer);
    dawnTimer = null;
    dawnActive = false;
    dawnPresentation = null;
    clearTimeout(actionTimer);
    actionTimer = null;
    actionPresentation = null;
    travelingCardId = null;
    deferredCombatMoveId = null;
    document.querySelectorAll(".card-travel-ghost, .card-travel-path").forEach((item) => item.remove());
    playedMoveId = null;
    delete document.body.dataset.lastEffect;
    moveSequence = 0;
    deathReasons.clear();
    clearTimeout(botTimer);
    botTimer = null;
    feedback = "Ván mới đã sẵn sàng.";
    return render();
  }
  const moveButton = event.target.closest("[data-setup-move]");
  if (moveButton) {
    const order = setupOrder[seat];
    const from = order.indexOf(moveButton.dataset.setupId);
    const to = Math.max(0, Math.min(order.length - 1, from + Number(moveButton.dataset.setupMove)));
    [order[from], order[to]] = [order[to], order[from]];
    return render();
  }
  if (event.target.closest("[data-lock-setup]")) {
    try {
      state = dispatch(state, { type: "setup.submit", seat, order: setupOrder[seat] });
      feedback = `Đội hình ${seat} đã khóa.`;
      handVisible = true;
    } catch (error) {
      feedback = error.message;
    }
    return render();
  }
});

document.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-setup-card]");
  if (!card) return;
  draggedSetupId = card.dataset.setupCard;
  card.classList.add("is-dragging");
});

document.addEventListener("dragover", (event) => {
  if (event.target.closest("[data-setup-card]")) event.preventDefault();
});

document.addEventListener("drop", (event) => {
  const target = event.target.closest("[data-setup-card]");
  if (!target || !draggedSetupId) return;
  event.preventDefault();
  const order = setupOrder[seat];
  const from = order.indexOf(draggedSetupId);
  const to = order.indexOf(target.dataset.setupCard);
  order.splice(to, 0, order.splice(from, 1)[0]);
  draggedSetupId = null;
  render();
});

document.addEventListener("dragend", () => {
  draggedSetupId = null;
  document.querySelectorAll(".is-dragging").forEach((card) => card.classList.remove("is-dragging"));
});

document.addEventListener("change", (event) => {
  if (event.target.matches("#action-form [name=kind]")) syncConditionalFields();
});

document.addEventListener("submit", (event) => {
  if (!event.target.matches("#action-form")) return;
  event.preventDefault();
  submitAction(event.target);
});

render();
