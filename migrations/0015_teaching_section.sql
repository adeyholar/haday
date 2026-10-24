-- Two blog sections. Teachings stay at /blogs. Guides live at /learning-hebrabbai.
-- The default is only for the backfill, then it is removed so a new row must name its section.
alter table teachings add column if not exists section text;
update teachings set section = 'teachings' where section is null or section = '';
alter table teachings alter column section set default 'teachings';
alter table teachings alter column section set not null;
alter table teachings alter column section drop default;
alter table teachings drop constraint if exists teachings_section_check;
alter table teachings add constraint teachings_section_check check (section in ('teachings', 'learning-hebrabbai'));
alter table teachings add column if not exists image_alt text not null default '';
create index if not exists teachings_section_public on teachings (section, draft, published_at desc);
