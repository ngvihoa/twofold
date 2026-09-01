const CACHE_KEY = "twofold-notes:v1";
const OUTBOX_KEY = "twofold-notes-outbox:v1";
const TOKEN_KEY = "twofold-notes-workspace-token";
const API_URL = "/api/notes";
export const NOTE_STATUSES = ["todo", "in_progress", "cancelled", "done"];

const listeners = new Set();
const inFlightOperationIds = new Set();
let notes = readArray(CACHE_KEY).map(normalizeNote);
let outbox = readArray(OUTBOX_KEY).map((operation) => ({ ...operation, note: normalizeNote(operation.note) }));
let syncPromise;
let resyncRequested = false;
let syncState = { status: "idle", message: "" };

export function createUuid(randomSource = globalThis.crypto) {
  if (typeof randomSource?.randomUUID === "function") return randomSource.randomUUID();

  const bytes = new Uint8Array(16);
  if (typeof randomSource?.getRandomValues === "function") randomSource.getRandomValues(bytes);
  else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function normalizeNote(note) {
  return { ...note, status: NOTE_STATUSES.includes(note?.status) ? note.status : "todo" };
}

function persist() {
  localStorage.setItem(CACHE_KEY, JSON.stringify(notes));
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
}

function emit() {
  const snapshot = { notes: listNotes(), sync: { ...syncState }, pending: outbox.length };
  listeners.forEach((listener) => listener(snapshot));
}

function setSyncState(status, message = "") {
  syncState = { status, message };
  emit();
}

function upsertNote(note) {
  const index = notes.findIndex((item) => item.id === note.id);
  if (index === -1) notes.push(note);
  else notes[index] = note;
}

function removeQueuedOperation(operationId) {
  outbox = outbox.filter((item) => item.operationId !== operationId);
}

function queueCreate(note) {
  outbox = outbox.filter((item) => item.note.id !== note.id);
  outbox.push({ operationId: createUuid(), method: "POST", note });
}

function queueUpdate(note) {
  const createOperation = outbox.find((item) => item.note.id === note.id && item.method === "POST");
  if (createOperation && !inFlightOperationIds.has(createOperation.operationId)) {
    createOperation.note = note;
    return;
  }
  const existing = outbox.find((item) => item.note.id === note.id && item.method === "PATCH");
  if (existing && !inFlightOperationIds.has(existing.operationId)) existing.note = { ...note, revision: existing.note.revision };
  else outbox.push({ operationId: createUuid(), method: "PATCH", note });
}

function queueDelete(note) {
  const createOperation = outbox.find((item) => item.note.id === note.id && item.method === "POST");
  const wasLocalOnly = Boolean(createOperation && !inFlightOperationIds.has(createOperation.operationId));
  outbox = outbox.filter((item) => item.note.id !== note.id);
  if (!wasLocalOnly) outbox.push({ operationId: createUuid(), method: "DELETE", note });
  return wasLocalOnly;
}

function workspaceToken() {
  return localStorage.getItem(TOKEN_KEY)?.trim() || "";
}

async function apiRequest(method, body) {
  const response = await fetch(API_URL, {
    method,
    headers: {
      "content-type": "application/json",
      "x-workspace-token": workspaceToken(),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.code = result.code;
    throw error;
  }
  return result;
}

async function flushOutbox() {
  for (const operation of [...outbox]) {
    inFlightOperationIds.add(operation.operationId);
    const payload = operation.method === "DELETE"
      ? { id: operation.note.id, revision: operation.note.revision }
      : {
          id: operation.note.id,
          roleId: operation.note.roleId,
          body: operation.note.body,
          status: operation.note.status,
          ...(operation.method === "PATCH" ? { revision: operation.note.revision } : {}),
        };
    try {
      const result = await apiRequest(operation.method, payload);
      upsertNote(result.note);
      removeQueuedOperation(operation.operationId);
      outbox = outbox.map((queued) => queued.note.id === operation.note.id && queued.note.revision < result.note.revision
        ? { ...queued, note: { ...queued.note, revision: result.note.revision } }
        : queued);
      persist();
    } catch (error) {
      if (error.status === 409) {
        removeQueuedOperation(operation.operationId);
        persist();
      }
      throw error;
    } finally {
      inFlightOperationIds.delete(operation.operationId);
    }
  }
}

async function pullNotes() {
  const result = await apiRequest("GET");
  const pendingIds = new Set(outbox.map((item) => item.note.id));
  notes = [
    ...result.notes.filter((note) => !pendingIds.has(note.id)),
    ...notes.filter((note) => pendingIds.has(note.id)),
  ];
  persist();
}

export function listNotes() {
  return notes
    .filter((note) => !note.deletedAt)
    .toSorted((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function getSyncSnapshot() {
  return { notes: listNotes(), sync: { ...syncState }, pending: outbox.length };
}

export function subscribeNotes(listener) {
  listeners.add(listener);
  listener(getSyncSnapshot());
  return () => listeners.delete(listener);
}

export function getWorkspaceToken() {
  return workspaceToken();
}

export function setWorkspaceToken(token) {
  const normalized = token.trim();
  if (normalized) localStorage.setItem(TOKEN_KEY, normalized);
  else localStorage.removeItem(TOKEN_KEY);
  emit();
}

export async function createNote({ body, roleId = null, status = "todo" }) {
  const normalizedBody = body.trim();
  if (!normalizedBody || normalizedBody.length > 5000) throw new TypeError("Note phải có từ 1 đến 5000 ký tự.");
  if (!NOTE_STATUSES.includes(status)) throw new TypeError("Trạng thái note không hợp lệ.");
  const now = new Date().toISOString();
  const note = {
    id: createUuid(),
    roleId: roleId || null,
    body: normalizedBody,
    status,
    revision: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  upsertNote(note);
  queueCreate(note);
  persist();
  emit();
  await syncNotes();
  return note;
}

export async function updateNote(id, changes) {
  const current = notes.find((note) => note.id === id && !note.deletedAt);
  if (!current) throw new TypeError("Không tìm thấy note.");
  const body = changes.body ?? current.body;
  const roleId = changes.roleId === undefined ? current.roleId : changes.roleId;
  const status = changes.status ?? current.status;
  const normalizedBody = body.trim();
  if (!normalizedBody || normalizedBody.length > 5000) throw new TypeError("Note phải có từ 1 đến 5000 ký tự.");
  if (!NOTE_STATUSES.includes(status)) throw new TypeError("Trạng thái note không hợp lệ.");
  const note = { ...current, body: normalizedBody, roleId: roleId || null, status, updatedAt: new Date().toISOString() };
  upsertNote(note);
  queueUpdate(note);
  persist();
  emit();
  await syncNotes();
  return note;
}

export async function deleteNote(id) {
  const current = notes.find((note) => note.id === id && !note.deletedAt);
  if (!current) return;
  const wasLocalOnly = queueDelete(current);
  if (wasLocalOnly) notes = notes.filter((note) => note.id !== id);
  else upsertNote({ ...current, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  persist();
  emit();
  await syncNotes();
}

export async function syncNotes() {
  if (syncPromise) {
    resyncRequested = true;
    return syncPromise;
  }
  if (!workspaceToken()) {
    setSyncState("local", "Chưa có workspace token; thay đổi đang được giữ trên thiết bị này.");
    return false;
  }

  syncPromise = (async () => {
    setSyncState("syncing", "Đang đồng bộ...");
    let operationError;
    try {
      await flushOutbox();
    } catch (error) {
      operationError = error;
    }
    try {
      await pullNotes();
      if (operationError) throw operationError;
      setSyncState("synced", "Đã đồng bộ.");
      return true;
    } catch (error) {
      const message = error.status === 401
        ? "Workspace token không hợp lệ."
        : error.code === "REVISION_CONFLICT"
          ? "Note đã được sửa trên thiết bị khác; đã tải lại bản mới nhất."
          : "Chưa thể đồng bộ; thay đổi vẫn được giữ trên thiết bị này.";
      setSyncState("error", message);
      return false;
    }
  })().finally(() => {
    syncPromise = undefined;
    if (resyncRequested) {
      resyncRequested = false;
      queueMicrotask(() => syncNotes());
    }
  });

  return syncPromise;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => syncNotes());
  window.addEventListener("storage", (event) => {
    if (![CACHE_KEY, OUTBOX_KEY, TOKEN_KEY].includes(event.key)) return;
    notes = readArray(CACHE_KEY).map(normalizeNote);
    outbox = readArray(OUTBOX_KEY).map((operation) => ({ ...operation, note: normalizeNote(operation.note) }));
    emit();
  });
}
