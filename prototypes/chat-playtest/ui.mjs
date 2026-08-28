import { createGame, dispatch, privateView, publicView, ROLE_DEFS } from "./engine.mjs";

const VARIANTS = {
  A: "Bàn đối đầu",
  B: "Phòng điều khiển",
  C: "Tập trung quyết định",
};

const ROLE_ART = {
  villager: "../../assets/game/wwo-reference/dan-lang.png",
  wolf: "../../assets/game/wwo-reference/ma-soi-thuong.png",
  seer: "../../assets/game/wwo-reference/tien-tri.png",
  guard: "../../assets/game/wwo-reference/bao-ve.png",
  witch: "../../assets/game/wwo-reference/phu-thuy.webp",
  shooter: "../../assets/game/wwo-reference/xa-thu.webp",
  avenger: "../../assets/game/wwo-reference/ke-bao-thu.png",
  priest: "../../assets/game/wwo-reference/muc-su.png",
  wolfguard: "../../assets/game/wwo-reference/soi-ho-ve.webp",
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

const PHASE_LABEL = {
  "setup-A": "Xếp đội hình · bên A",
  "setup-B": "Xếp đội hình · bên B",
  council: "Hội đồng sáng",
  "day-A": "Ban ngày · lượt A",
  "day-B": "Ban ngày · lượt B",
  "dusk-defense": "Chạng vạng · đặt khiên",
  "night-main": "Ban đêm · main order",
  "final-duel": "Final Duel",
  ended: "Kết thúc",
};

const app = document.querySelector("#app");
let variant = new URLSearchParams(location.search).get("variant")?.toUpperCase() || "A";
if (!VARIANTS[variant]) variant = "A";
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

const otherSeat = (value) => value === "A" ? "B" : "A";
const ownPlayer = () => state.players[seat];
const privateCard = (id) => ownPlayer().board.find((card) => card.id === id);
const roleOptions = () => Object.entries(ROLE_DEFS).map(([key, role]) => `<option value="${key}">${role.name}</option>`).join("");
const cardOptions = (cards) => cards.filter((card) => card.alive).map((card) => `<option value="${card.id}">${card.id}${card.revealed ? ` · ${ROLE_DEFS[card.role].name}` : ""}</option>`).join("");
const deadCardOptions = (cards) => cards.filter((card) => !card.alive).map((card) => `<option value="${card.id}">${card.id} · ${ROLE_DEFS[card.role].name}</option>`).join("");
const sourceFor = (role) => ownPlayer().board.find((card) => card.alive && card.role === role)?.id;
const botSourceFor = (role) => state.players.B.board.find((card) => card.alive && card.role === role);
const living = (boardSeat) => state.players[boardSeat].board.filter((card) => card.alive);

function botNeedsTurn() {
  if (state.phase === "setup-B" || state.phase === "day-B") return true;
  if (state.phase === "council") return Boolean(state.players.A.council) && !state.players.B.council;
  if (state.phase === "dusk-defense") return state.players.A.defense !== null && state.players.B.defense === null;
  if (state.phase === "night-main") return Boolean(state.players.A.night) && !state.players.B.night;
  if (state.phase === "final-duel") return Boolean(state.players.A.finalGuess) && !state.players.B.finalGuess;
  return false;
}

function botAction() {
  if (state.phase === "setup-B") return { type: "setup.submit", seat: "B", order: state.players.B.board.map((card) => card.id) };
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
    const voters = [];
    let power = 0;
    for (const card of living("B").filter((item) => ROLE_DEFS[item.role].faction === "village" && item.voteCooldown === 0)) {
      voters.push(card.id);
      power += card.role === "villager" ? 2 : 1;
      if (power >= 3) break;
    }
    if (target && power >= 3) return { type: "council.submit", seat: "B", kind: "accuse", target: target.id, guess: target.role, voters };
    return { type: "council.submit", seat: "B", kind: "pass" };
  }
  if (state.phase === "dusk-defense") {
    const guard = botSourceFor("guard");
    if (!guard?.uses.guard) return { type: "defense.submit", seat: "B", pass: true };
    const choices = living("B").filter((card) => card.id !== state.players.B.lastGuardTarget);
    const target = choices.find((card) => card.revealed) || choices[state.round % choices.length];
    return { type: "defense.submit", seat: "B", pass: false, target: target.id };
  }
  if (state.phase === "night-main") {
    const targets = living("A");
    const openTargets = targets.filter((card) => !card.shielded);
    const pool = openTargets.length ? openTargets : targets;
    const target = pool[state.round % pool.length];
    const wolf = botSourceFor("wolf");
    if (wolf && !state.players.B.eliminationSpent) return { type: "night.submit", seat: "B", kind: "attack", source: wolf.id, target: target.id };
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
    state = dispatch(state, botAction());
    feedback = "BOT B đã khóa hành động.";
  } catch (error) {
    feedback = `BOT lỗi: ${error.message}`;
  }
  render();
}

function scheduleBot() {
  if (!botNeedsTurn() || botTimer) return;
  botTimer = setTimeout(runBotTurn, 520);
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
  const status = !card.alive
    ? "Đã chết"
    : isRevealed
      ? `Đã lộ${card.votePower ? ` · ${card.votePower} phiếu` : ""}`
      : isOwn ? "Đang ẩn" : "Đang sống";
  return `<article class="role-card faction-${faction} phase-${phase} ${isSetup ? "setup-card" : ""} ${card.alive ? "" : "dead"} ${isRevealed ? "revealed" : "hidden-role"} ${card.shielded ? "shielded" : ""}" ${isSetup ? `draggable="true" data-setup-card="${card.id}"` : ""}>
    <div class="card-shell">
      <header class="card-head"><strong class="role-name" title="${shownName}">${shownName}</strong><span class="phase-rune" title="Pha kỹ năng">${phaseMark}</span></header>
      <div class="art-window">
        ${known ? `<img class="role-art" src="${ROLE_ART[roleKey]}" alt="" />` : `<div class="card-back"><span>TF</span></div>`}
        ${isRevealed ? `<span class="reveal-badge" title="Role này đã công khai với đối thủ">◉ ĐÃ LỘ</span>` : ""}
        ${card.shielded ? `<span class="shield" title="Đang được bảo vệ">◈</span>` : ""}
      </div>
      <footer class="card-foot"><span class="card-id">${card.id}</span><span class="card-status">${status}</span></footer>
    </div>
    ${isSetup ? `<div class="setup-controls"><button type="button" data-setup-move="-1" data-setup-id="${card.id}" aria-label="Đưa ${shownName} sang trái">‹</button><strong>${setupIndex + 1}</strong><button type="button" data-setup-move="1" data-setup-id="${card.id}" aria-label="Đưa ${shownName} sang phải">›</button></div>` : ""}
  </article>`;
}

function boardMarkup(boardSeat, label) {
  const view = publicView(state);
  const own = boardSeat === seat && handVisible;
  const cards = view.board[boardSeat];
  const setupActive = state.phase === `setup-${seat}` && boardSeat === seat;
  const visibleCards = setupActive ? setupOrder[seat].map((id) => cards.find((card) => card.id === id)) : cards;
  const boardPosition = boardSeat === seat ? "own" : "opponent";
  const hint = setupActive ? "Kéo thả hoặc dùng ‹ › để xếp" : boardPosition === "own" ? "Bạn thấy đủ · lá tiến lên là đã lộ" : "Chỉ lá công khai mới lật mặt";
  return `<section class="board board-${boardSeat.toLowerCase()} board-${boardPosition} ${setupActive ? "board-setup" : ""}">
    <div class="board-title"><h2>${label} · Bên ${boardSeat}</h2><span>${hint}</span></div>
    ${boardSeat === seat && !handVisible
      ? `<div class="privacy"><div><p>Tay bài đang được che</p><button type="button" data-reveal-hand>Hiện bài bên ${seat}</button></div></div>`
      : `<div class="card-row">${visibleCards.map((card, index) => cardMarkup(card, own, setupActive ? index : -1)).join("")}</div>`}
  </section>`;
}

function activeForSeat() {
  if (state.phase.startsWith("setup-")) return state.phase === `setup-${seat}`;
  if (state.phase === "council" || state.phase === "dusk-defense" || state.phase === "night-main" || state.phase === "final-duel") return true;
  return state.phase === `day-${seat}`;
}

function alreadyLocked() {
  if (state.phase.startsWith("setup-")) return ownPlayer().setupLocked;
  if (state.phase === "council") return Boolean(ownPlayer().council);
  if (state.phase === "dusk-defense") return ownPlayer().defense !== null;
  if (state.phase === "night-main") return Boolean(ownPlayer().night);
  if (state.phase === "final-duel") return Boolean(ownPlayer().finalGuess);
  return false;
}

function actionKinds() {
  if (state.phase === "council") {
    const kinds = [["pass", "Bỏ qua"], ["accuse", "Buộc tội bằng 3 phiếu"]];
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
  if (state.phase === "night-main") {
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
  if (state.phase === "council") return `
    <label class="field conditional" data-for="accuse"><span>Mục tiêu</span><select name="target">${cardOptions(enemy)}</select></label>
    <label class="field conditional" data-for="accuse"><span>Đoán role</span><select name="guess">${roleOptions()}</select></label>
    <fieldset class="voter-field conditional" data-for="accuse"><legend>Chọn tối đa 3 lá, cần tổng 3 phiếu · Dân làng = 2</legend><div class="voters">${own.filter((card) => card.alive).map((card) => `<label><input type="checkbox" name="voter" value="${card.id}" /> ${card.id}</label>`).join("")}</div></fieldset>
    <label class="field conditional" data-for="protect"><span>Lá muốn bảo kê</span><select name="protectTarget">${cardOptions(own)}</select></label>`;
  if (state.phase.startsWith("day-")) return `
    <label class="field conditional" data-for="shoot"><span>Mục tiêu đã lộ</span><select name="shootTarget">${cardOptions(enemy.filter((card) => card.revealed))}</select></label>
    <label class="field conditional" data-for="revive"><span>Lá muốn hồi sinh</span><select name="reviveTarget">${deadCardOptions(own)}</select></label>
    <label class="field conditional" data-for="mark purify"><span>Mục tiêu bên ${otherSeat(seat)}</span><select name="dayTarget">${cardOptions(enemy)}</select></label>`;
  if (state.phase === "dusk-defense") return `<label class="field conditional" data-for="defend"><span>Vị trí đặt khiên</span><select name="defendTarget">${cardOptions(own)}</select></label>`;
  if (state.phase === "night-main") return `<label class="field conditional" data-for="attack inspect poison"><span>Mục tiêu bên ${otherSeat(seat)}</span><select name="nightTarget">${cardOptions(enemy)}</select></label>`;
  if (state.phase === "final-duel") return `<label class="field conditional" data-for="final"><span>Role dự đoán</span><select name="finalGuess">${roleOptions()}</select></label>`;
  return "";
}

function controlMarkup() {
  if (state.phase === "ended") return `<section class="control-panel"><h2>${state.result?.winner ? `Bên ${state.result.winner} thắng` : "Ván hòa"}</h2><p>${state.result?.reason}</p><button class="primary" type="button" data-reset>Chơi lại</button></section>`;
  if (!activeForSeat()) return `<section class="control-panel bot-wait"><span class="bot-orbit" aria-hidden="true"></span><h2>BOT B đang suy nghĩ</h2><p>Đối thủ tự chọn hành động dựa trên thông tin hợp lệ của nó.</p></section>`;
  if (alreadyLocked()) return `<section class="control-panel bot-wait"><span class="bot-orbit" aria-hidden="true"></span><h2>Đã khóa lựa chọn</h2><p>BOT B đang tính lượt đáp lại.</p></section>`;
  if (state.phase.startsWith("setup-")) return `<section class="control-panel setup-panel"><p class="step-label">Bước chuẩn bị</p><h2>Xếp 10 lá lên bàn</h2><p>Thứ tự này sẽ cố định thành vị trí ${seat}1–${seat}10. Đối thủ chỉ thấy mặt sau cho đến khi một lá bị lộ.</p><button class="primary" type="button" data-lock-setup>Khóa đội hình bên ${seat}</button><p class="feedback">${feedback}</p></section>`;
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

function arenaMarkup() {
  const view = publicView(state);
  const light = state.phase.includes("night") || state.phase.includes("dusk") ? "night" : "day";
  return `<section class="arena">
    ${boardMarkup(otherSeat(seat), "Đối thủ")}
    <div class="center-table"><div class="table-seal ${light}"><strong>${PHASE_LABEL[state.phase]}</strong><p>Vòng ${view.round} · Quyền loại bỏ A: ${view.elimination.A} · B: ${view.elimination.B}</p></div></div>
    ${boardMarkup(seat, "Tay của bạn")}
  </section>`;
}

function render() {
  document.body.className = `variant-${variant.toLowerCase()}`;
  document.querySelector("#variant-label").textContent = `${variant} — ${VARIANTS[variant]}`;
  const topbar = `<header class="topbar"><div class="brand"><span class="brand-mark">TF</span>TWOFOLD</div><span class="round">Local playtest · Vòng ${state.round}</span><span class="phase-chip">${PHASE_LABEL[state.phase]}</span><div class="seat-toggle"><span class="human-seat">A · BẠN</span><span class="bot-seat ${botNeedsTurn() ? "thinking" : ""}"><i></i>B · BOT</span></div><button class="reset" type="button" data-reset>Reset</button></header>`;
  const arena = arenaMarkup();
  const control = controlMarkup();
  const history = historyMarkup();
  const body = variant === "A"
    ? `<div class="play-grid">${arena}<div class="side-rail">${control}${history}</div></div>`
    : variant === "B"
      ? `<div class="play-grid">${arena}<div class="side-rail">${history}</div>${control}</div>`
      : `<div class="play-grid">${control}${arena}<div class="side-rail">${history}</div></div>`;
  app.innerHTML = `<div class="shell">${topbar}${body}</div>`;
  syncConditionalFields();
  scheduleBot();
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
  if (state.phase === "council") action = kind === "pass"
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
    : { type: "defense.submit", seat, pass: false, target: data.get("defendTarget") };
  else if (state.phase === "night-main") action = kind === "pass"
    ? { type: "night.submit", seat, kind }
    : { type: "night.submit", seat, kind, source: sourceFor(kind === "attack" ? "wolf" : kind === "inspect" ? "seer" : "witch"), target: data.get("nightTarget") };
  else action = { type: "final.submit", seat, guess: data.get("finalGuess") };

  try {
    state = dispatch(state, action);
    feedback = "Lựa chọn hợp lệ và đã khóa.";
    handVisible = true;
  } catch (error) {
    feedback = error.message;
  }
  render();
}

function switchVariant(direction) {
  const keys = Object.keys(VARIANTS);
  variant = keys[(keys.indexOf(variant) + direction + keys.length) % keys.length];
  const url = new URL(location.href);
  url.searchParams.set("variant", variant);
  history.replaceState({}, "", url);
  render();
}

document.addEventListener("click", (event) => {
  const direction = event.target.closest("[data-variant-direction]")?.dataset.variantDirection;
  if (direction) return switchVariant(Number(direction));
  if (event.target.closest("[data-reveal-hand]")) {
    handVisible = true;
    return render();
  }
  if (event.target.closest("[data-reset]")) {
    state = createGame(`codex-web-${Date.now()}`);
    setupOrder = { A: state.players.A.board.map((card) => card.id), B: state.players.B.board.map((card) => card.id) };
    seat = "A";
    handVisible = true;
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

document.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key) || event.target.matches("input, select, textarea, [contenteditable]")) return;
  switchVariant(event.key === "ArrowRight" ? 1 : -1);
});

render();
