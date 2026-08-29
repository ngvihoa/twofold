import assert from "node:assert/strict";
import test from "node:test";

class MemoryStorage {
  #values = new Map();

  getItem(key) {
    return this.#values.has(key) ? this.#values.get(key) : null;
  }

  setItem(key, value) {
    this.#values.set(key, String(value));
  }

  removeItem(key) {
    this.#values.delete(key);
  }
}

globalThis.localStorage = new MemoryStorage();
globalThis.window = { addEventListener() {} };

const { createNote, createUuid, deleteNote, listNotes, updateNote } = await import("../lib/note-store.js");

test("UUID fallback works when randomUUID is unavailable", () => {
  const id = createUuid({ getRandomValues: (bytes) => bytes.fill(7) });
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("note store supports local CRUD while no workspace token is configured", async () => {
  const created = await createNote({ body: "  Review kỹ năng ban đêm  ", roleId: "phu-thuy" });
  assert.equal(listNotes().length, 1);
  assert.equal(listNotes()[0].body, "Review kỹ năng ban đêm");
  assert.equal(listNotes()[0].status, "todo");

  await updateNote(created.id, { body: "Review cả hai kỹ năng", roleId: "phu-thuy", status: "in_progress" });
  assert.equal(listNotes()[0].body, "Review cả hai kỹ năng");
  assert.equal(listNotes()[0].status, "in_progress");

  await deleteNote(created.id);
  assert.deepEqual(listNotes(), []);
});
