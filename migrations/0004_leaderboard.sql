-- Cached climb score for the class leaderboard (recomputed on each progress save).
alter table study_progress
  add column if not exists points integer not null default 0;
alter table study_progress
  add column if not exists level integer not null default 1;
