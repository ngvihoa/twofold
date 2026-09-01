alter table notes
  drop constraint if exists notes_status_check;

alter table notes
  add constraint notes_status_check
  check (status in ('todo', 'in_progress', 'cancelled', 'done'));
