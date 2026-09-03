-- Anonymous and signed-in site visitors (no emails). One row per browser id.
create table if not exists site_visitors (
  id text primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  hits integer not null default 0,
  last_path text not null default '/',
  signed_in boolean not null default false,
  device text not null default ''
);

create index if not exists site_visitors_last_seen on site_visitors (last_seen desc);
