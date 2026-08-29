import {
  createNote,
  deleteNote,
  getWorkspaceToken,
  setWorkspaceToken,
  subscribeNotes,
  syncNotes,
  updateNote,
} from "/lib/note-store.js?v=20260829-3";

const $ = (selector, scope = document) => scope.querySelector(selector);
const state = { roles: [], notes: [], search: "", roleFilter: "all", statusFilter: "all" };
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });
const STATUSES = [
  { id: "todo", label: "Todo" },
  { id: "in_progress", label: "In progress" },
  { id: "cancelled", label: "Cancelled" },
];

function roleFor(id) {
  return state.roles.find((role) => role.id === id);
}

function fillRoleSelect(select, includeFilters = false) {
  state.roles.toSorted((a, b) => a.name.localeCompare(b.name, "vi")).forEach((role) => {
    const option = document.createElement("option");
    option.value = role.id;
    option.textContent = `${role.code} | ${role.name}`;
    select.append(option);
  });
  if (includeFilters) select.value = state.roleFilter;
}

function filteredNotes() {
  const query = state.search.trim().toLocaleLowerCase("vi");
  return state.notes.filter((note) => {
    const role = roleFor(note.roleId);
    const matchesRole = state.roleFilter === "all"
      || (state.roleFilter === "general" ? !note.roleId : note.roleId === state.roleFilter);
    const matchesStatus = state.statusFilter === "all" || note.status === state.statusFilter;
    const haystack = `${note.body} ${role?.name || ""} ${role?.code || ""}`.toLocaleLowerCase("vi");
    return matchesRole && matchesStatus && (!query || haystack.includes(query));
  });
}

function noteCard(note) {
  const role = roleFor(note.roleId);
  const article = document.createElement("article");
  article.className = "note-card";
  article.dataset.noteId = note.id;

  const meta = document.createElement("div");
  meta.className = "note-card-meta";
  const context = role ? document.createElement("a") : document.createElement("span");
  if (role) context.href = `/?role=${encodeURIComponent(role.id)}`;
  context.textContent = role ? `${role.code} | ${role.name}` : note.roleId ? "Role không còn tồn tại" : "Note chung";
  const time = document.createElement("time");
  time.dateTime = note.updatedAt;
  time.textContent = dateFormatter.format(new Date(note.updatedAt));
  meta.append(context, time);

  const workflow = document.createElement("div");
  workflow.className = "note-card-workflow";
  const statusLabel = document.createElement("label");
  statusLabel.htmlFor = `note-status-${note.id}`;
  statusLabel.textContent = "Trạng thái";
  const statusSelect = document.createElement("select");
  statusSelect.id = `note-status-${note.id}`;
  statusSelect.className = `note-status-select status-${note.status}`;
  statusSelect.dataset.noteStatus = note.id;
  STATUSES.forEach((status) => {
    const option = document.createElement("option");
    option.value = status.id;
    option.textContent = status.label;
    option.selected = note.status === status.id;
    statusSelect.append(option);
  });
  workflow.append(statusLabel, statusSelect);

  const body = document.createElement("p");
  body.className = "note-card-body";
  body.textContent = note.body;

  const actions = document.createElement("div");
  actions.className = "note-card-actions";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "text-button";
  edit.dataset.editNote = note.id;
  edit.textContent = "Sửa";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "text-button note-delete";
  remove.dataset.deleteNote = note.id;
  remove.textContent = "Xóa";
  actions.append(edit, remove);
  article.append(meta, workflow, body, actions);
  return article;
}

function renderNotes() {
  const current = filteredNotes();
  $("#notes-count").textContent = state.notes.length;
  $("#notes-empty").hidden = current.length > 0;
  $("#notes-list").replaceChildren(...current.map(noteCard));
  $("#export-notes").disabled = state.notes.length === 0;
}

async function loadRoles() {
  const response = await fetch("/data/roles.json");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  state.roles = await response.json();
  fillRoleSelect($("#note-role"));
  fillRoleSelect($("#notes-role-filter"), true);
}

function acceptSharedToken() {
  const params = new URLSearchParams(location.hash.slice(1));
  const token = params.get("workspace");
  if (!token) return;
  setWorkspaceToken(token);
  history.replaceState(null, "", `${location.pathname}${location.search}`);
}

acceptSharedToken();
const savedToken = getWorkspaceToken();
if (savedToken) $("#workspace-token").placeholder = `Đã lưu ••••${savedToken.slice(-4)}`;

subscribeNotes(({ notes, sync, pending }) => {
  state.notes = notes;
  renderNotes();
  $("#sync-status").dataset.status = sync.status;
  $("#sync-status").textContent = `${sync.message}${pending ? ` Còn ${pending} thay đổi chờ gửi.` : ""}`;
});

$("#workspace-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = new FormData(event.currentTarget).get("workspaceToken").trim();
  if (token) setWorkspaceToken(token);
  event.currentTarget.reset();
  const activeToken = getWorkspaceToken();
  $("#workspace-token").placeholder = activeToken ? `Đã lưu ••••${activeToken.slice(-4)}` : "Dán token dùng chung";
  await syncNotes();
});

$("#note-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const feedback = $("#note-feedback");
  try {
    await createNote({ body: data.get("body"), roleId: data.get("roleId") || null, status: data.get("status") });
    event.currentTarget.reset();
    feedback.textContent = getWorkspaceToken() ? "Đã lưu note." : "Đã lưu trên thiết bị; nhập token để đồng bộ.";
  } catch (error) {
    feedback.textContent = error.message;
  }
});

$("#notes-list").addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-note]");
  const deleteButton = event.target.closest("[data-delete-note]");
  if (editButton) {
    const note = state.notes.find((item) => item.id === editButton.dataset.editNote);
    if (!note) return;
    const body = prompt("Sửa nội dung note", note.body);
    if (body == null || body.trim() === note.body) return;
    await updateNote(note.id, { body, roleId: note.roleId });
  } else if (deleteButton) {
    const note = state.notes.find((item) => item.id === deleteButton.dataset.deleteNote);
    if (!note || !confirm("Xóa note này? Note vẫn có thể được khôi phục từ database.")) return;
    await deleteNote(note.id);
  }
});

$("#notes-list").addEventListener("change", async (event) => {
  const select = event.target.closest("[data-note-status]");
  if (!select) return;
  const note = state.notes.find((item) => item.id === select.dataset.noteStatus);
  if (!note || note.status === select.value) return;
  select.disabled = true;
  try {
    await updateNote(note.id, { status: select.value });
  } finally {
    select.disabled = false;
  }
});

$("#notes-search").addEventListener("input", (event) => { state.search = event.target.value; renderNotes(); });
$("#notes-role-filter").addEventListener("change", (event) => { state.roleFilter = event.target.value; renderNotes(); });
$("#notes-status-filter").addEventListener("change", (event) => { state.statusFilter = event.target.value; renderNotes(); });

$("#export-notes").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.notes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `twofold-notes-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

$("#theme-toggle").addEventListener("click", () => {
  const root = document.documentElement;
  const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.dataset.theme = current === "dark" ? "light" : "dark";
  localStorage.setItem("twofold-theme", root.dataset.theme);
});

const savedTheme = localStorage.getItem("twofold-theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

loadRoles().then(renderNotes).catch((error) => {
  console.error(error);
  $("#note-feedback").textContent = "Chưa tải được danh sách role.";
});
syncNotes();
setInterval(() => { if (!document.hidden) syncNotes(); }, 30_000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) syncNotes(); });
