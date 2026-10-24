-- Comments on a public blog post. A draft has none. Removing the post removes its comments.
create table if not exists blog_comments (
  id text primary key,
  slug text not null references teachings (slug) on delete cascade,
  user_id text not null,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists blog_comments_slug on blog_comments (slug, created_at asc);
