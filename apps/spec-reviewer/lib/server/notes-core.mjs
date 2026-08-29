import { createHash, timingSafeEqual } from "node:crypto";

export const MAX_NOTE_LENGTH = 5000;
export const NOTE_STATUSES = ["todo", "in_progress", "cancelled"];

export function workspaceId(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenMatches(actual, expected) {
  if (!actual || !expected) return false;
  const actualDigest = Buffer.from(workspaceId(actual));
  const expectedDigest = Buffer.from(workspaceId(expected));
  return timingSafeEqual(actualDigest, expectedDigest);
}

export function validateUuid(value) {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseNoteInput(value, { requireRevision = false } = {}) {
  const id = value?.id;
  const body = typeof value?.body === "string" ? value.body.trim() : "";
  const roleId = value?.roleId == null || value.roleId === "" ? null : String(value.roleId).trim();
  const status = value?.status == null || value.status === "" ? "todo" : String(value.status);
  const revision = Number(value?.revision);

  if (!validateUuid(id)) throw new TypeError("ID note không hợp lệ.");
  if (!body || body.length > MAX_NOTE_LENGTH) {
    throw new TypeError(`Nội dung note phải có từ 1 đến ${MAX_NOTE_LENGTH} ký tự.`);
  }
  if (roleId && (!/^[a-z0-9-]+$/.test(roleId) || roleId.length > 100)) {
    throw new TypeError("Role của note không hợp lệ.");
  }
  if (!NOTE_STATUSES.includes(status)) throw new TypeError("Trạng thái note không hợp lệ.");
  if (requireRevision && (!Number.isInteger(revision) || revision < 1)) {
    throw new TypeError("Revision của note không hợp lệ.");
  }

  return { id, body, roleId, status, ...(requireRevision ? { revision } : {}) };
}

export function parseDeleteInput(value) {
  const id = value?.id;
  const revision = Number(value?.revision);
  if (!validateUuid(id)) throw new TypeError("ID note không hợp lệ.");
  if (!Number.isInteger(revision) || revision < 1) throw new TypeError("Revision của note không hợp lệ.");
  return { id, revision };
}

export function serializeNote(row) {
  return {
    id: row.id,
    roleId: row.role_id,
    body: row.body,
    status: NOTE_STATUSES.includes(row.status) ? row.status : "todo",
    revision: row.revision,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
  };
}
