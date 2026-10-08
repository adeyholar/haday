-- Class-wide Claude spend, plus per-student ask counts. No question text.
create table if not exists ask_meter (
  bucket text primary key,
  calls integer not null default 0,
  cents integer not null default 0
);
