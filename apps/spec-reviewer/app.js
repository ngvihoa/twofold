const FACTIONS = [
  { id: "all", label: "Tất cả phe" },
  { id: "village", label: "Dân Làng", color: "var(--village)" },
  { id: "werewolf", label: "Ma sói", color: "var(--werewolf)" },
  { id: "solo-vote", label: "Solo bỏ phiếu", color: "var(--solo-vote)" },
  { id: "solo-killer", label: "Solo giết người", color: "var(--solo-killer)" },
  { id: "special", label: "Đặc biệt", color: "var(--special)" },
];

const FITS = [
  { id: "all", label: "Mọi mức" },
  { id: "core", label: "Đưa vào trước" },
  { id: "prototype", label: "Test sớm" },
  { id: "consider", label: "Đáng cân nhắc" },
  { id: "adapt", label: "Cần chuyển thể" },
  { id: "later", label: "Để sau" },
  { id: "event", label: "Chỉ sự kiện" },
];

const STAGES = [
  { id: "main", label: "Bộ chính" },
  { id: "round6", label: "Từ vòng 6" },
  { id: "hold", label: "Chưa dùng" },
  { id: "all", label: "Tất cả 92 role" },
];

const INITIAL_SUGGESTION_IDS = [
  "dan-lang",
  "tien-tri",
  "bao-ve",
  "phu-thuy",
  "ke-bao-thu",
  "ma-soi-thuong",
  "tho-san-quai-thu",
  "xa-thu",
  "soi-phap-su",
  "soi-ac-mong",
];

const FIT_ORDER = new Map(FITS.map((item, index) => [item.id, index]));
const state = { roles: [], stage: "main", faction: "all", fit: "all", mechanic: "all", search: "", sort: "recommended" };
const selected = new Set(JSON.parse(localStorage.getItem("twofold-role-shortlist") || "[]"));
let cardObserver;

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi");
const initials = (name) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const faction = (id) => FACTIONS.find((item) => item.id === id) || FACTIONS[0];
const fit = (id) => FITS.find((item) => item.id === id) || FITS[0];
const factionColor = (id) => faction(id).color || "var(--accent)";
const wikiUrl = (pageTitle) => `https://wwo-vietnamese.fandom.com/vi/wiki/${encodeURIComponent(pageTitle.replaceAll(" ", "_"))}`;
const canShowArtwork = (role) => role.stage === "main" && Boolean(role.image);

function imageMarkup(role, className = "") {
  if (!canShowArtwork(role)) return `<span class="${className} role-monogram" aria-hidden="true">${escapeHtml(initials(role.name))}</span>`;
  return `<img class="${className}" src="${escapeHtml(role.image)}" alt="Minh họa role ${escapeHtml(role.name)}" loading="lazy" decoding="async" />`;
}

function gameplayMarkup(role, compact = false) {
  const skillRows = [
    ["Kỹ năng ban ngày", role.daySkill],
    ["Kỹ năng ban đêm", role.nightSkill],
  ].filter(([, value]) => value && normalize(value) !== "khong co.");

  return `
    <dl class="role-gameplay${compact ? " role-gameplay-compact" : ""}">
      <div><dt>Lộ sau</dt><dd>${escapeHtml(role.revealAfter)} vòng</dd></div>
      ${skillRows.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
    </dl>`;
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

function announce(message) {
  let region = $("#app-announcer");
  if (!region) {
    region = document.createElement("div");
    region.id = "app-announcer";
    region.className = "sr-only";
    region.setAttribute("aria-live", "polite");
    document.body.append(region);
  }
  region.textContent = "";
  requestAnimationFrame(() => { region.textContent = message; });
}

function roleCard(role) {
  const isSelected = selected.has(role.id);
  const phase = phaseMeta(role);
  return `
    <article class="role-card ${phase.className}${canShowArtwork(role) ? "" : " no-image"}" data-role-id="${role.id}" style="--faction-color:${factionColor(role.factionId)}">
      <div class="role-card-image">
        ${imageMarkup(role)}
      </div>
      <div class="role-card-body">
        <div class="role-meta"><strong>${escapeHtml(role.code)}</strong><span class="fit-badge-inline">${escapeHtml(role.fitLabel)}</span></div>
        ${phaseIndicatorMarkup(role)}
        <h4>${escapeHtml(role.name)}</h4>
        <p class="role-description">${escapeHtml(role.description)}</p>
        ${gameplayMarkup(role)}
        <div class="mechanic-list">${role.mechanics.slice(0, 3).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
        <div class="card-actions">
          <button class="detail-button" type="button" data-open-role="${role.id}">Xem chi tiết</button>
          <button class="select-button" type="button" data-select-role="${role.id}" aria-pressed="${isSelected}">${isSelected ? "Đã chọn" : "Chọn"}</button>
        </div>
      </div>
    </article>`;
}

function alphaCard(role) {
  const phase = phaseMeta(role);
  return `
    <article class="alpha-card ${phase.className}" data-role-id="${role.id}" style="--faction-color:${factionColor(role.factionId)}">
      <button type="button" data-open-role="${role.id}" aria-label="Xem chi tiết ${escapeHtml(role.name)}">
        ${imageMarkup(role)}
        <div class="alpha-card-copy">
          <div class="alpha-card-heading"><span>${escapeHtml(role.code)}</span><h3>${escapeHtml(role.name)}</h3></div>
          ${phaseIndicatorMarkup(role)}
          <p class="alpha-card-reveal">Lộ sau ${escapeHtml(role.revealAfter)} vòng</p>
        </div>
      </button>
    </article>`;
}

function filteredRoles() {
  const query = normalize(state.search.trim());
  const matches = state.roles.filter((role) => {
    const haystack = normalize(`${role.code} ${role.name} ${role.description} ${role.daySkill} ${role.nightSkill} ${role.mechanics.join(" ")}`);
    return (state.stage === "all" || role.stage === state.stage)
      && (state.faction === "all" || role.factionId === state.faction)
      && (state.fit === "all" || role.fit === state.fit)
      && (state.mechanic === "all" || role.mechanics.includes(state.mechanic))
      && (!query || haystack.includes(query));
  });

  return matches.sort((a, b) => {
    if (state.sort === "name") return a.name.localeCompare(b.name, "vi");
    if (state.sort === "faction") return FACTIONS.findIndex((item) => item.id === a.factionId) - FACTIONS.findIndex((item) => item.id === b.factionId) || a.name.localeCompare(b.name, "vi");
    return (FIT_ORDER.get(a.fit) || 99) - (FIT_ORDER.get(b.fit) || 99) || a.name.localeCompare(b.name, "vi");
  });
}

function renderFilters() {
  const makeChips = (items, key) => items.map((item) => `
    <button class="filter-chip" type="button" data-filter="${key}" data-value="${escapeHtml(item.id)}" aria-pressed="${state[key] === item.id}">${escapeHtml(item.label)}</button>`).join("");
  $("#stage-filters").innerHTML = makeChips(STAGES, "stage");
  $("#faction-filters").innerHTML = makeChips(FACTIONS, "faction");
  $("#fit-filters").innerHTML = makeChips(FITS, "fit");
  const mechanics = [...new Set(state.roles.flatMap((role) => role.mechanics))].sort((a, b) => a.localeCompare(b, "vi"));
  $("#mechanic-filters").innerHTML = makeChips([{ id: "all", label: "Tất cả" }, ...mechanics.map((item) => ({ id: item, label: item }))], "mechanic");
}

function attachImageFallbacks(scope = document) {
  $$('img[src*="wikia"]', scope).forEach((image) => {
    image.addEventListener("error", () => {
      const card = image.closest("[data-role-id]");
      const roleId = card?.dataset.roleId;
      const roleName = image.alt.replace("Minh họa role ", "");
      const role = state.roles.find((item) => item.id === roleId) || state.roles.find((item) => item.name === roleName);
      const holder = image.parentElement;
      image.remove();
      if (role && holder) {
        holder.insertAdjacentHTML("afterbegin", `<span class="role-monogram" aria-hidden="true">${escapeHtml(initials(role.name))}</span>`);
        card?.classList.add("no-image");
      }
    }, { once: true });
  });
}

function observeCards() {
  cardObserver?.disconnect();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $$(".role-card").forEach((card) => card.classList.add("is-visible"));
    return;
  }
  cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        cardObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: "80px 0px", threshold: .08 });
  $$(".role-card").forEach((card) => cardObserver.observe(card));
}

function renderRoles() {
  const roles = filteredRoles();
  $("#visible-count").textContent = roles.length;
  $("#empty-state").hidden = roles.length > 0;
  $("#role-groups").hidden = roles.length === 0;

  const grouped = FACTIONS.slice(1).map((group) => ({ ...group, roles: roles.filter((role) => role.factionId === group.id) })).filter((group) => group.roles.length);
  $("#role-groups").innerHTML = grouped.map((group) => `
    <section class="role-group" aria-labelledby="group-${group.id}">
      <div class="group-header"><h3 id="group-${group.id}">${escapeHtml(group.label)}</h3><span>${group.roles.length} role</span></div>
      <div class="role-grid">${group.roles.map(roleCard).join("")}</div>
    </section>`).join("");
  attachImageFallbacks($("#role-groups"));
  observeCards();
}

function refreshResults() {
  renderFilters();
  const update = () => renderRoles();
  if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(update);
  else update();
}

function recommendationReason(role) {
  const reasons = {
    core: "Luật cốt lõi rõ, dễ tạo đối trọng và phù hợp để kiểm tra vòng chơi đầu tiên.",
    prototype: "Có tiềm năng tạo quyết định mạnh, nhưng cần một vòng test riêng để chốt giới hạn.",
    consider: "Mechanic dùng được trong 1v1. Cần so sánh với các role cùng nhóm trước khi chọn.",
    adapt: "Bản gốc phụ thuộc chat hoặc bỏ phiếu nhiều người. Nên viết lại điều kiện kích hoạt.",
    later: "Có nhiều trạng thái hoặc chuỗi tương tác. Để sau khi game engine cốt lõi đã ổn định.",
    event: "Thiết kế cho dịp đặc biệt và không tác động đáng kể đến core loop.",
  };
  return reasons[role.fit];
}

function openRole(roleId) {
  const role = state.roles.find((item) => item.id === roleId);
  if (!role) return;
  const isSelected = selected.has(role.id);
  $("#dialog-content").innerHTML = `
    <div class="dialog-role-layout" style="--faction-color:${factionColor(role.factionId)}" data-role-id="${role.id}">
      <div class="dialog-role-art">${canShowArtwork(role) ? imageMarkup(role) : `<div class="dialog-role-placeholder">${escapeHtml(initials(role.name))}</div>`}</div>
      <div class="dialog-role-copy">
        <p class="section-kicker">${escapeHtml(role.code)} | ${escapeHtml(faction(role.factionId).label)}</p>
        <h2 id="dialog-role-name">${escapeHtml(role.name)}</h2>
        <p class="dialog-description">${escapeHtml(role.description)}</p>
        ${gameplayMarkup(role)}
        <dl class="role-facts">
          <div><dt>Khuyến nghị</dt><dd>${escapeHtml(role.fitLabel)}</dd></div>
          <div><dt>Giai đoạn</dt><dd>${escapeHtml(role.stageLabel)}</dd></div>
          <div><dt>Hào quang</dt><dd>${escapeHtml(role.aura)}</dd></div>
          <div><dt>Nhóm wiki</dt><dd>${escapeHtml(role.wikiGroup)}</dd></div>
          <div><dt>Mechanic</dt><dd>${escapeHtml(role.mechanics.join(", "))}</dd></div>
        </dl>
        <p>${escapeHtml(role.scopeNote || recommendationReason(role))}</p>
        ${role.relation ? `<p><strong>Quan hệ role:</strong> ${escapeHtml(role.relation)}</p>` : ""}
        <div class="dialog-actions">
          <button class="button button-dark" type="button" data-select-role="${role.id}" aria-pressed="${isSelected}">${isSelected ? "Bỏ khỏi shortlist" : "Thêm vào shortlist"}</button>
          <a class="source-link" href="${wikiUrl(role.pageTitle)}" target="_blank" rel="noreferrer">Xem role trên wiki</a>
        </div>
      </div>
    </div>`;
  attachImageFallbacks($("#dialog-content"));
  $("#role-dialog").showModal();
}

function saveShortlist() {
  localStorage.setItem("twofold-role-shortlist", JSON.stringify([...selected]));
  $("#shortlist-count").textContent = selected.size;
  $("#shortlist-bar").hidden = selected.size === 0;
  renderShortlistPreview();
  if (state.roles.length) renderSuggestion();
  $$('[data-select-role]').forEach((button) => {
    const active = selected.has(button.dataset.selectRole);
    button.setAttribute("aria-pressed", active);
    if (button.closest(".dialog-role-copy")) button.textContent = active ? "Bỏ khỏi shortlist" : "Thêm vào shortlist";
    else button.textContent = active ? "Đã chọn" : "Chọn";
  });
}

function renderSuggestion() {
  const roles = [...selected].map((id) => state.roles.find((role) => role.id === id)).filter(Boolean);
  const groups = [
    {
      id: "day",
      label: "Day",
      note: "Ban ngày và nội tại",
      roles: roles.filter((role) => !phaseMeta(role).night),
    },
    {
      id: "night",
      label: "Night",
      note: "Kỹ năng ban đêm",
      roles: roles.filter((role) => {
        const phase = phaseMeta(role);
        return phase.night && !phase.day;
      }),
    },
    {
      id: "twoface",
      label: "2Face",
      note: "Kỹ năng cả hai pha",
      roles: roles.filter((role) => {
        const phase = phaseMeta(role);
        return phase.day && phase.night;
      }),
    },
  ];

  $("#alpha-stack").innerHTML = roles.length ? groups.map((group) => `
    <section class="suggestion-lane suggestion-lane-${group.id}" aria-labelledby="suggestion-${group.id}">
      <header class="suggestion-lane-header">
        <div><h3 id="suggestion-${group.id}">${group.label}</h3><p>${group.note}</p></div>
        <span>${group.roles.length}</span>
      </header>
      <div class="suggestion-lane-cards">
        ${group.roles.length ? group.roles.map(alphaCard).join("") : `<p class="suggestion-lane-empty">Chưa có role</p>`}
      </div>
    </section>`).join("") : `
    <div class="suggestion-empty">
      <h3>Chưa có role nào được chọn</h3>
      <p>Chọn role trong kho bên dưới hoặc khôi phục bộ gợi ý ban đầu.</p>
      <a class="button button-dark" href="#role-explorer">Chọn role</a>
    </div>`;
  attachImageFallbacks($("#alpha-stack"));
}

function renderShortlistPreview() {
  const roles = [...selected].map((id) => state.roles.find((role) => role.id === id)).filter(Boolean);
  $("#shortlist-preview").innerHTML = roles.map((role) => `
    <button class="shortlist-chip" type="button" data-remove-shortlist="${role.id}" aria-label="Bỏ ${escapeHtml(role.name)} khỏi danh sách" title="Bỏ ${escapeHtml(role.name)}">
      ${imageMarkup(role, "shortlist-chip-thumb")}
      <span>${escapeHtml(role.name)}</span>
    </button>`).join("");
  attachImageFallbacks($("#shortlist-preview"));
}

function toggleSelection(roleId) {
  const role = state.roles.find((item) => item.id === roleId);
  if (!role) return;
  if (selected.has(roleId)) {
    selected.delete(roleId);
    announce(`Đã bỏ ${role.name} khỏi shortlist`);
  } else {
    selected.add(roleId);
    announce(`Đã thêm ${role.name} vào shortlist`);
  }
  saveShortlist();
}

function resetFilters() {
  Object.assign(state, { stage: "main", faction: "all", fit: "all", mechanic: "all", search: "", sort: "recommended" });
  $("#role-search").value = "";
  $("#role-sort").value = "recommended";
  refreshResults();
}

async function loadRoles() {
  $("#loading-state").hidden = false;
  $("#error-state").hidden = true;
  try {
    const response = await fetch("data/roles.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.roles = await response.json();
    const validIds = new Set(state.roles.map((role) => role.id));
    [...selected].filter((id) => !validIds.has(id)).forEach((id) => selected.delete(id));
    $("#stat-main").textContent = state.roles.filter((role) => role.stage === "main").length;
    $("#stat-round6").textContent = state.roles.filter((role) => role.stage === "round6").length;
    $("#stat-hold").textContent = state.roles.filter((role) => role.stage === "hold").length;
    renderFilters();
    renderRoles();
    saveShortlist();
  } catch (error) {
    console.error(error);
    $("#error-state").hidden = false;
  } finally {
    $("#loading-state").hidden = true;
  }
}

document.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-filter]");
  const openButton = event.target.closest("[data-open-role]");
  const selectButton = event.target.closest("[data-select-role]");
  const removeButton = event.target.closest("[data-remove-shortlist]");
  if (filterButton) {
    state[filterButton.dataset.filter] = filterButton.dataset.value;
    refreshResults();
  } else if (openButton) openRole(openButton.dataset.openRole);
  else if (selectButton) toggleSelection(selectButton.dataset.selectRole);
  else if (removeButton) toggleSelection(removeButton.dataset.removeShortlist);
});

$("#role-search").addEventListener("input", (event) => { state.search = event.target.value; renderRoles(); });
$("#role-sort").addEventListener("change", (event) => { state.sort = event.target.value; renderRoles(); });
$("#clear-filters").addEventListener("click", resetFilters);
$("#empty-reset").addEventListener("click", resetFilters);
$("#retry-load").addEventListener("click", loadRoles);
$("[data-close-dialog]").addEventListener("click", () => $("#role-dialog").close());
$("#clear-shortlist").addEventListener("click", () => { selected.clear(); saveShortlist(); });
$("#reset-suggestion").addEventListener("click", () => {
  selected.clear();
  INITIAL_SUGGESTION_IDS.forEach((id) => {
    if (state.roles.some((role) => role.id === id)) selected.add(id);
  });
  saveShortlist();
  announce("Đã khôi phục bộ gợi ý ban đầu gồm 10 role.");
});

$("#theme-toggle").addEventListener("click", () => {
  const root = document.documentElement;
  const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.dataset.theme = current === "dark" ? "light" : "dark";
  localStorage.setItem("twofold-theme", root.dataset.theme);
});

for (const dialog of $$('dialog')) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

const savedTheme = localStorage.getItem("twofold-theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
loadRoles();
