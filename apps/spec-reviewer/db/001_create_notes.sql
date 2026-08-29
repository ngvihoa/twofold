create table if not exists notes (
  id uuid primary key,
  workspace_id text not null,
  role_id text,
  body text not null check (char_length(body) between 1 and 5000),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'cancelled')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists notes_workspace_updated_idx
  on notes (workspace_id, updated_at desc);

create index if not exists notes_workspace_status_idx
  on notes (workspace_id, status, updated_at desc);
