alter table notes
  add column if not exists status text not null default 'todo';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notes_status_check'
  ) then
    alter table notes
      add constraint notes_status_check
      check (status in ('todo', 'in_progress', 'cancelled'));
  end if;
end $$;

create index if not exists notes_workspace_status_idx
  on notes (workspace_id, status, updated_at desc);
