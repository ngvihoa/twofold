const FACTIONS = [
  { id: "village", label: "Dân Làng", color: "var(--village)" },
  { id: "werewolf", label: "Ma sói", color: "var(--werewolf)" },
  { id: "solo-vote", label: "Solo bỏ phiếu", color: "var(--solo-vote)" },
  { id: "solo-killer", label: "Solo giết người", color: "var(--solo-killer)" },
  { id: "special", label: "Đặc biệt", color: "var(--special)" },
];

const $ = (selector, scope = document) => scope.querySelector(selector);
const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi");
const initials = (name) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

let roles = [];
let selected;
try {
  selected = new Set(JSON.parse(localStorage.getItem("twofold-role-shortlist") || "[]"));
} catch {
  selected = new Set();
}

function canShowArtwork(role) {
  return role.stage === "main" && Boolean(role.image);
}

function artworkMarkup(role) {
  if (!canShowArtwork(role)) return `<span class="selected-role-placeholder" aria-hidden="true">${escapeHtml(initials(role.name))}</span>`;
  return `<img src="${escapeHtml(role.image)}" alt="Minh họa role ${escapeHtml(role.name)}" loading="lazy" decoding="async" />`;
}

function gameplayMarkup(role) {
  const rows = [
    ["Lộ sau", `${role.revealAfter} vòng`],
    ["Ban ngày", role.daySkill],
    ["Ban đêm", role.nightSkill],
  ].filter(([label, value]) => label === "Lộ sau" || (value && normalize(value) !== "khong co."));

  return `<dl class="selected-role-gameplay">${rows.map(([label, value]) => `
    <div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`;
}

function hasActiveSkill(value) {
  return Boolean(value) && normalize(value) !== "khong co.";
}

function phaseMeta(role) {
  const day = hasActiveSkill(role.daySkill);
  const night = hasActiveSkill(role.nightSkill);
  return {
    day,
    night,
    className: day && night ? "phase-both" : day ? "phase-day" : night ? "phase-night" : "phase-passive",
    label: day && night ? "Ngày và đêm" : day ? "Ban ngày" : night ? "Ban đêm" : "Nội tại",
  };
}

function phaseIndicatorMarkup(role) {
  const phase = phaseMeta(role);
  if (!phase.day && !phase.night) {
    return `<div class="phase-indicator phase-indicator-passive" aria-label="Pha kỹ năng: Nội tại"><span>◆ Nội tại</span></div>`;
  }

  return `<div class="phase-indicator" aria-label="Pha kỹ năng: ${escapeHtml(phase.label)}">
    ${phase.day ? `<span class="phase-label-day" aria-label="Ban ngày">☀ Ngày</span>` : ""}
    ${phase.night ? `<span class="phase-label-night" aria-label="Ban đêm">☾ Đêm</span>` : ""}
  </div>`;
}

function roleCard(role) {
  const faction = FACTIONS.find((item) => item.id === role.factionId);
  const phase = phaseMeta(role);
  return `
    <article class="selected-role-card ${phase.className}" data-selected-role="${role.id}" style="--faction-color:${faction?.color || "var(--accent)"}">
      <div class="selected-role-art">${artworkMarkup(role)}</div>
      <div class="selected-role-copy">
        <p class="selected-role-code">${escapeHtml(role.code)}</p>
        <h3>${escapeHtml(role.name)}</h3>
        <p class="selected-role-meta">${escapeHtml(role.stageLabel)} | ${escapeHtml(role.fitLabel)}</p>
        ${phaseIndicatorMarkup(role)}
        ${gameplayMarkup(role)}
        <button class="selected-role-remove" type="button" data-remove-role="${role.id}">Bỏ khỏi danh sách</button>
      </div>
    </article>`;
}

function saveSelection() {
  localStorage.setItem("twofold-role-shortlist", JSON.stringify([...selected]));
}

function selectedRoles() {
  return [...selected].map((id) => roles.find((role) => role.id === id)).filter(Boolean);
}

function render() {
  const current = selectedRoles();
  $("#selected-count").textContent = current.length;
  $("#selection-empty").hidden = current.length > 0;
  $("#selected-role-groups").hidden = current.length === 0;
  $("#clear-selection").disabled = current.length === 0;
  $("#copy-selection").disabled = current.length === 0;

  $("#selected-role-groups").innerHTML = FACTIONS.map((faction) => ({
    ...faction,
    roles: current.filter((role) => role.factionId === faction.id),
  })).filter((group) => group.roles.length).map((group) => `
    <section class="selected-role-group" aria-labelledby="selected-${group.id}">
      <div class="group-header">
        <h2 id="selected-${group.id}">${escapeHtml(group.label)}</h2>
        <span>${group.roles.length} role</span>
      </div>
      <div class="selected-role-grid">${group.roles.map(roleCard).join("")}</div>
    </section>`).join("");
}

async function loadRoles() {
  try {
    const response = await fetch("data/roles.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    roles = await response.json();
    const validIds = new Set(roles.map((role) => role.id));
    [...selected].filter((id) => !validIds.has(id)).forEach((id) => selected.delete(id));
    saveSelection();
    render();
  } catch (error) {
    console.error(error);
    $("#selection-error").hidden = false;
  } finally {
    $("#selection-loading").hidden = true;
  }
}

document.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-role]");
  if (!removeButton) return;
  selected.delete(removeButton.dataset.removeRole);
  saveSelection();
  render();
});

$("#clear-selection").addEventListener("click", () => {
  if (!selected.size || !confirm("Bỏ toàn bộ role đã chọn?")) return;
  selected.clear();
  saveSelection();
  render();
});

$("#copy-selection").addEventListener("click", async () => {
  const text = selectedRoles().map((role, index) => `${index + 1}. ${role.code} | ${role.name} (${role.fitLabel})`).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    $("#selection-feedback").textContent = "Đã sao chép danh sách.";
  } catch {
    $("#selection-feedback").textContent = "Trình duyệt chưa cho phép sao chép.";
  }
});

$("#theme-toggle").addEventListener("click", () => {
  const root = document.documentElement;
  const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.dataset.theme = current === "dark" ? "light" : "dark";
  localStorage.setItem("twofold-theme", root.dataset.theme);
});

const savedTheme = localStorage.getItem("twofold-theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
loadRoles();
