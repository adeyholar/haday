-- Which door an account may open. Existing accounts are BBH.
-- New accounts get a row only when they choose.
create table if not exists learner_path (
  user_id text primary key,
  path text not null,
  cleared text,
  updated_at timestamptz not null default now()
);

create table if not exists app_flag (
  key text primary key,
  value text not null
);
