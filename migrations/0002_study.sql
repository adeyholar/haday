-- Per-account SRS progress for Davar. One row per signed-in user.
create table if not exists study_progress (
  user_id        text primary key,
  cards          text not null default '{}',
  week           integer not null default 1,
  direction      text not null default 'he-en',
  focus          text not null default 'due',
  streak         integer not null default 0,
  last_study_day bigint not null default 0,
  sessions       integer not null default 0,
  updated_at     timestamptz not null default now()
);
