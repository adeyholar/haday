-- Which parts of the site people open. Counts only, no names.
create table if not exists site_area_hits (
  area text primary key,
  hits integer not null default 0,
  last_seen timestamptz not null default now()
);

create table if not exists site_area_people (
  area text not null,
  visitor_id text not null,
  hits integer not null default 0,
  last_seen timestamptz not null default now(),
  primary key (area, visitor_id)
);
