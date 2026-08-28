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

const otherSeat = (value) => value === "A" ? "B" : "A";
const ownPlayer = () => state.players[seat];
const privateCard = (id) => ownPlayer().board.find((card) => card.id === id);
const roleOptions = () => Object.entries(ROLE_DEFS).map(([key, role]) => `<option value="${key}">${role.name}</option>`).join("");
const cardOptions = (cards) => cards.filter((card) => card.alive).map((card) => `<option value="${card.id}">${card.id}${card.revealed ? ` · ${ROLE_DEFS[card.role].name}` : ""}</option>`).join("");
const deadCardOptions = (cards) => cards.filter((card) => !card.alive).map((card) => `<option value="${card.id}">${card.id} · ${ROLE_DEFS[card.role].name}</option>`).join("");
const sourceFor = (role) => ownPlayer().board.find((card) => card.alive && card.role === role)?.id;

function cardMarkup(card, isOwn) {
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
  return `<article class="role-card faction-${faction} phase-${phase} ${card.alive ? "" : "dead"} ${isRevealed ? "revealed" : "hidden-role"} ${card.shielded ? "shielded" : ""}">
    <div class="card-shell">
      <header class="card-head"><strong class="role-name" title="${shownName}">${shownName}</strong><span class="phase-rune" title="Pha kỹ năng">${phaseMark}</span></header>
      <div class="art-window">
        ${known ? `<img class="role-art" src="${ROLE_ART[roleKey]}" alt="" />` : `<div class="card-back"><span>TF</span></div>`}
        ${isRevealed ? `<span class="reveal-badge" title="Role này đã công khai với đối thủ">◉ ĐÃ LỘ</span>` : ""}
        ${card.shielded ? `<span class="shield" title="Đang được bảo vệ">◈</span>` : ""}
      </div>
      <footer class="card-foot"><span class="card-id">${card.id}</span><span class="card-status">${status}</span></footer>
    </div>
  </article>`;
}

function boardMarkup(boardSeat, label) {
  const view = publicView(state);
  const own = boardSeat === seat && handVisible;
  const cards = view.board[boardSeat];
  return `<section class="board board-${boardSeat.toLowerCase()}">
    <div class="board-title"><h2>${label} · Bên ${boardSeat}</h2><span>${cards.filter((card) => card.alive).length}/10 còn sống</span></div>
    ${boardSeat === seat && !handVisible
      ? `<div class="privacy"><div><p>Tay bài đang được che</p><button type="button" data-reveal-hand>Hiện bài bên ${seat}</button></div></div>`
      : `<div class="card-row">${cards.map((card) => cardMarkup(card, own)).join("")}</div>`}
  </section>`;
}

function activeForSeat() {
  if (state.phase === "council" || state.phase === "dusk-defense" || state.phase === "night-main" || state.phase === "final-duel") return true;
  return state.phase === `day-${seat}`;
}

function alreadyLocked() {
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
  if (!activeForSeat()) return `<section class="control-panel"><h2>Đang chờ bên còn lại</h2><p>Pha này thuộc lượt ${state.phase.endsWith("A") ? "A" : "B"}.</p><button class="primary" type="button" data-switch-seat="${otherSeat(seat)}">Chuyển sang bên ${otherSeat(seat)}</button></section>`;
  if (alreadyLocked()) return `<section class="control-panel"><h2>Lựa chọn đã khóa</h2><p>Đang chờ ${otherSeat(seat)} hoàn tất hành động bí mật.</p><button class="primary" type="button" data-switch-seat="${otherSeat(seat)}">Che bài và chuyển bên ${otherSeat(seat)}</button></section>`;
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
  const topbar = `<header class="topbar"><div class="brand"><span class="brand-mark">TF</span>TWOFOLD</div><span class="round">Local playtest · Vòng ${state.round}</span><span class="phase-chip">${PHASE_LABEL[state.phase]}</span><div class="seat-toggle"><button class="${seat === "A" ? "active" : ""}" data-switch-seat="A">A</button><button class="${seat === "B" ? "active" : ""}" data-switch-seat="B">B</button></div><button class="reset" type="button" data-reset>Reset</button></header>`;
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
    handVisible = false;
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
  const switcher = event.target.closest("[data-switch-seat]");
  if (switcher) {
    seat = switcher.dataset.switchSeat;
    handVisible = false;
    feedback = `Đang điều khiển bên ${seat}.`;
    return render();
  }
  if (event.target.closest("[data-reveal-hand]")) {
    handVisible = true;
    return render();
  }
  if (event.target.closest("[data-reset]")) {
    state = createGame(`codex-web-${Date.now()}`);
    seat = "A";
    handVisible = true;
    feedback = "Ván mới đã sẵn sàng.";
    return render();
  }
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
