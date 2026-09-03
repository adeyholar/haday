-- Class feature suggestions. Signed-in classmates add; owner reviews status.
create table if not exists feature_ideas (
  id text primary key,
  user_id text not null,
  title text not null,
  body text not null,
  area text not null default 'app',
  status text not null default 'new',
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feature_ideas_status_created on feature_ideas (status, created_at desc);
create index if not exists feature_ideas_user on feature_ideas (user_id, created_at desc);
