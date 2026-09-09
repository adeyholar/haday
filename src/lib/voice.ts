import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertAdmin } from "@/lib/admin";
import { corpusIds } from "@/lib/voice-corpus";

export type VoicePart = "he" | "en";

export type VoiceIndexRow = {
  vocabId: string;
  part: VoicePart;
  mime: string;
  updatedAt: string;
};

export type VoiceClipPayload = {
  vocabId: string;
  part: VoicePart;
  mime: string;
  b64: string;
};

const MAX_B64 = 380_000;
const VOCAB_IDS = corpusIds();

let tableReady: Promise<void> | null = null;

async function ensureVoiceTable() {
  tableReady ??= (async () => {
    const sql = await getSql();
    await sql.query(`
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
      )
    `);
    await sql.query("create index if not exists voice_clip_vocab on voice_clip (vocab_id, part)");
  })().catch((err) => {
    tableReady = null;
    throw err;
  });
  await tableReady;
}

function parsePart(raw: string): VoicePart | null {
  return raw === "he" || raw === "en" ? raw : null;
}

function parseMime(raw: string): string | null {
  const mime = raw.trim().toLowerCase().slice(0, 80);
  if (!mime.startsWith("audio/")) return null;
  if (!/^[a-z0-9./;+= -]+$/.test(mime)) return null;
  return mime;
}

function cleanB64(raw: string): string | null {
  const s = raw.replace(/^data:audio\/[^;]+;base64,/, "").replace(/\s/g, "");
  if (!s || s.length > MAX_B64) return null;
  if (!/^[A-Za-z0-9+/=]+$/.test(s)) return null;
  return s;
}

export const listVoiceIndex = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<VoiceIndexRow[]> => {
    await ensureVoiceTable();
    const sql = await getSql();
    const rows = await sql<{ vocab_id: string; part: string; mime: string; updated_at: string }>`
      select vocab_id, part, mime, updated_at::text as updated_at
      from voice_clip
      order by updated_at desc
    `;
    return rows
      .map((r) => {
        const part = parsePart(r.part);
        if (!part) return null;
        return { vocabId: r.vocab_id, part, mime: r.mime, updatedAt: r.updated_at };
      })
      .filter((r): r is VoiceIndexRow => Boolean(r));
  });

export const getVoiceClip = createServerFn({ method: "GET" })
  .validator((input: { vocabId: string; part: VoicePart }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data }): Promise<VoiceClipPayload | null> => {
    const vocabId = data.vocabId.trim();
    const part = parsePart(data.part);
    if (!vocabId || !part || !VOCAB_IDS.has(vocabId)) return null;
    await ensureVoiceTable();
    const sql = await getSql();
    const rows = await sql<{ vocab_id: string; part: string; mime: string; audio_b64: string }>`
      select vocab_id, part, mime, audio_b64
      from voice_clip
      where vocab_id = ${vocabId} and part = ${part}
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return { vocabId: row.vocab_id, part, mime: row.mime, b64: row.audio_b64 };
  });

export const saveVoiceClip = createServerFn({ method: "POST" })
  .validator((input: { vocabId: string; part: string; mime: string; b64: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true } | { ok: false; error: string }> => {
    await assertAdmin(context.userId);
    const vocabId = data.vocabId.trim();
    const part = parsePart(data.part);
    const mime = parseMime(data.mime);
    const b64 = cleanB64(data.b64);
    if (!vocabId || !VOCAB_IDS.has(vocabId)) return { ok: false, error: "Unknown lemma." };
    if (!part) return { ok: false, error: "Say Hebrew or English." };
    if (!mime) return { ok: false, error: "That recording type is not audio." };
    if (!b64) return { ok: false, error: "Recording is empty or too long. Keep it under six seconds." };
    await ensureVoiceTable();
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into voice_clip (id, vocab_id, part, mime, audio_b64, recorded_by)
      values (${id}, ${vocabId}, ${part}, ${mime}, ${b64}, ${context.userId})
      on conflict (vocab_id, part) do update
        set mime = excluded.mime,
            audio_b64 = excluded.audio_b64,
            recorded_by = excluded.recorded_by,
            updated_at = now()
    `;
    return { ok: true };
  });

export const deleteVoiceClip = createServerFn({ method: "POST" })
  .validator((input: { vocabId: string; part: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true } | { ok: false; error: string }> => {
    await assertAdmin(context.userId);
    const vocabId = data.vocabId.trim();
    const part = parsePart(data.part);
    if (!vocabId || !part) return { ok: false, error: "Missing clip." };
    await ensureVoiceTable();
    const sql = await getSql();
    await sql`delete from voice_clip where vocab_id = ${vocabId} and part = ${part}`;
    return { ok: true };
  });
