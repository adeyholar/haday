-- Course-owner recordings of class lemmas. Alive Pet and Listen use these first.
create table if not exists voice_clip (
  id text primary key,
  vocab_id text not null,
  part text not null,
  mime text not null,
  audio_b64 text not null,
  recorded_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vocab_id, part)
);

create index if not exists voice_clip_vocab on voice_clip (vocab_id, part);
