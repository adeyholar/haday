-- Per-account handwriting samples. Used to grade a learner’s own letter forms.
create table if not exists hand_style (
  user_id    text primary key,
  bank       text not null default '{}',
  updated_at timestamptz not null default now()
);
