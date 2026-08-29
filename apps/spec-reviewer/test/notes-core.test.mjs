import assert from "node:assert/strict";
import test from "node:test";
import {
  parseDeleteInput,
  parseNoteInput,
  serializeNote,
  tokenMatches,
  workspaceId,
} from "../lib/server/notes-core.mjs";
import notesApi from "../api/notes.mjs";

const id = "c24aa140-1800-4b5d-a874-f4b1b0d575d6";

test("workspace token is compared through a stable digest", () => {
  assert.equal(workspaceId("twofold-secret"), workspaceId("twofold-secret"));
  assert.equal(tokenMatches("twofold-secret", "twofold-secret"), true);
  assert.equal(tokenMatches("wrong", "twofold-secret"), false);
  assert.equal(tokenMatches("", "twofold-secret"), false);
});

test("note input is normalized and validated", () => {
  assert.deepEqual(parseNoteInput({ id, body: "  Cần review lại  ", roleId: "phu-thuy" }), {
    id,
    body: "Cần review lại",
    roleId: "phu-thuy",
    status: "todo",
  });
  assert.throws(() => parseNoteInput({ id: "bad", body: "Note" }), /ID note/);
  assert.throws(() => parseNoteInput({ id, body: "   " }), /Nội dung note/);
  assert.throws(() => parseNoteInput({ id, body: "Note", roleId: "../role" }), /Role của note/);
  assert.equal(parseNoteInput({ id, body: "Note", status: "done" }).status, "done");
  assert.throws(() => parseNoteInput({ id, body: "Note", status: "archived" }), /Trạng thái note/);
});

test("updates and deletes require a positive revision", () => {
  assert.equal(parseNoteInput({ id, body: "Note", revision: 2 }, { requireRevision: true }).revision, 2);
  assert.deepEqual(parseDeleteInput({ id, revision: 3 }), { id, revision: 3 });
  assert.throws(() => parseDeleteInput({ id, revision: 0 }), /Revision/);
});

test("database rows are serialized for the browser", () => {
  const note = serializeNote({
    id,
    role_id: null,
    body: "Note chung",
    status: "in_progress",
    revision: 1,
    created_at: "2026-08-29T00:00:00Z",
    updated_at: "2026-08-29T01:00:00Z",
    deleted_at: null,
  });
  assert.equal(note.roleId, null);
  assert.equal(note.status, "in_progress");
  assert.equal(note.updatedAt, "2026-08-29T01:00:00.000Z");
  assert.equal(note.deletedAt, null);
});

test("notes API rejects an invalid workspace token before opening a database connection", async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousToken = process.env.NOTES_WORKSPACE_TOKEN;
  process.env.DATABASE_URL = "postgresql://unused.invalid/database";
  process.env.NOTES_WORKSPACE_TOKEN = "expected-token";
  try {
    const response = await notesApi.fetch(new Request("https://twofold.test/api/notes", {
      headers: { "x-workspace-token": "wrong-token" },
    }));
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Workspace token không hợp lệ." });
  } finally {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
    if (previousToken === undefined) delete process.env.NOTES_WORKSPACE_TOKEN;
    else process.env.NOTES_WORKSPACE_TOKEN = previousToken;
  }
});
