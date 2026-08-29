import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("Thiếu DATABASE_URL. Chạy `pnpm env:pull:spec` trước.");
}

const sql = neon(process.env.DATABASE_URL);

await sql`
  create table if not exists notes (
    id uuid primary key,
    workspace_id text not null,
    role_id text,
    body text not null check (char_length(body) between 1 and 5000),
    status text not null default 'todo',
    revision integer not null default 1 check (revision > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
  )
`;

await sql`alter table notes add column if not exists status text not null default 'todo'`;

const constraints = await sql`
  select 1 from pg_constraint where conname = 'notes_status_check'
`;
if (!constraints.length) {
  await sql`
    alter table notes
      add constraint notes_status_check
      check (status in ('todo', 'in_progress', 'cancelled'))
  `;
}

await sql`
  create index if not exists notes_workspace_updated_idx
    on notes (workspace_id, updated_at desc)
`;
await sql`
  create index if not exists notes_workspace_status_idx
    on notes (workspace_id, status, updated_at desc)
`;

console.log("Notes database is up to date: todo, in_progress, cancelled.");
