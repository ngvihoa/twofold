import { neon } from "@neondatabase/serverless";
import {
  parseDeleteInput,
  parseNoteInput,
  serializeNote,
  tokenMatches,
  workspaceId,
} from "../lib/server/notes-core.mjs";

const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: jsonHeaders });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new TypeError("JSON body không hợp lệ.");
  }
}

function requireConfiguration() {
  if (!process.env.DATABASE_URL || !process.env.NOTES_WORKSPACE_TOKEN) {
    throw new Error("Notes API chưa được cấu hình.");
  }
}

async function handleRequest(request) {
  try {
    requireConfiguration();
    const token = request.headers.get("x-workspace-token") || "";
    if (!tokenMatches(token, process.env.NOTES_WORKSPACE_TOKEN)) {
      return json({ error: "Workspace token không hợp lệ." }, 401);
    }

    const sql = neon(process.env.DATABASE_URL);
    const currentWorkspaceId = workspaceId(token);

    if (request.method === "GET") {
      const rows = await sql`
        select id, role_id, body, status, revision, created_at, updated_at, deleted_at
        from notes
        where workspace_id = ${currentWorkspaceId}
        order by updated_at desc
      `;
      return json({ notes: rows.map(serializeNote) });
    }

    if (request.method === "POST") {
      const note = parseNoteInput(await readJson(request));
      const rows = await sql`
        insert into notes (id, workspace_id, role_id, body, status)
        values (${note.id}, ${currentWorkspaceId}, ${note.roleId}, ${note.body}, ${note.status})
        on conflict (id) do nothing
        returning id, role_id, body, status, revision, created_at, updated_at, deleted_at
      `;
      if (!rows.length) {
        const existing = await sql`
          select id, role_id, body, status, revision, created_at, updated_at, deleted_at
          from notes where id = ${note.id} and workspace_id = ${currentWorkspaceId}
        `;
        return existing.length ? json({ note: serializeNote(existing[0]) }) : json({ error: "ID note đã tồn tại." }, 409);
      }
      return json({ note: serializeNote(rows[0]) }, 201);
    }

    if (request.method === "PATCH") {
      const note = parseNoteInput(await readJson(request), { requireRevision: true });
      const rows = await sql`
        update notes
        set role_id = ${note.roleId}, body = ${note.body}, status = ${note.status}, revision = revision + 1, updated_at = now()
        where id = ${note.id}
          and workspace_id = ${currentWorkspaceId}
          and revision = ${note.revision}
          and deleted_at is null
        returning id, role_id, body, status, revision, created_at, updated_at, deleted_at
      `;
      if (!rows.length) return json({ error: "Note đã thay đổi trên thiết bị khác.", code: "REVISION_CONFLICT" }, 409);
      return json({ note: serializeNote(rows[0]) });
    }

    if (request.method === "DELETE") {
      const note = parseDeleteInput(await readJson(request));
      const rows = await sql`
        update notes
        set deleted_at = now(), revision = revision + 1, updated_at = now()
        where id = ${note.id}
          and workspace_id = ${currentWorkspaceId}
          and revision = ${note.revision}
          and deleted_at is null
        returning id, role_id, body, status, revision, created_at, updated_at, deleted_at
      `;
      if (!rows.length) return json({ error: "Note đã thay đổi trên thiết bị khác.", code: "REVISION_CONFLICT" }, 409);
      return json({ note: serializeNote(rows[0]) });
    }

    return new Response(null, { status: 405, headers: { allow: "GET, POST, PATCH, DELETE" } });
  } catch (error) {
    if (error instanceof TypeError) return json({ error: error.message }, 400);
    console.error("notes-api", error);
    return json({ error: "Không thể xử lý note lúc này." }, 500);
  }
}

export default { fetch: handleRequest };
