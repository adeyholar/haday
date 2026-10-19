-- Owner-written teachings. A draft or a future date stays off the public page.
create table if not exists teachings (
  slug text primary key,
  title text not null,
  summary text not null,
  body text not null,
  path text not null,
  tags text not null default '',
  related text not null default '',
  image text not null default '',
  draft boolean not null default true,
  published_at timestamptz not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists teachings_public on teachings (draft, published_at desc);
