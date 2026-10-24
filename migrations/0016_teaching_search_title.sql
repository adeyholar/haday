-- Optional search title for a post. Empty means the page title is the post title.
alter table teachings add column if not exists search_title text not null default '';
