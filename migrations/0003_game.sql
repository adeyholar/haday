-- Additive game-mode progress (chapter unlocks, stage stars) on the existing per-user row.
alter table study_progress
  add column if not exists game text not null default '{}';
