-- Per-student paradigm level, Leitner boxes, and skip log. Flag paradigms_v1.
create table if not exists paradigm_progress (
  user_id text primary key,
  level text not null default 'L1',
  placed boolean not null default false,
  source text not null default 'unset',
  boxes text not null default '{}',
  skips text not null default '[]',
  updated_at timestamptz not null default now()
);
