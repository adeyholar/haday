import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { HAND_GOAL, type HandBank, type HandSample } from "@/lib/hand-style";

function parseBank(raw: string | null | undefined): HandBank {
  try {
    const parsed = JSON.parse(raw || "{}") as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: HandBank = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(v)) continue;
      const samples: HandSample[] = [];
      for (const s of v) {
        if (!s || typeof s !== "object") continue;
        const strokes = (s as HandSample).strokes;
        if (!Array.isArray(strokes) || !strokes.length) continue;
        samples.push({ strokes, t: Number((s as HandSample).t) || 0 });
      }
      if (samples.length) out[k] = samples.slice(0, HAND_GOAL);
    }
    return out;
  } catch {
    return {};
  }
}

export const loadHandBank = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<HandBank> => {
    const sql = await getSql();
    await sql.query(
      "create table if not exists hand_style (user_id text primary key, bank text not null default '{}', updated_at timestamptz not null default now())",
    );
    const rows = await sql<{ bank: string }>`
      select bank from hand_style where user_id = ${context.userId}
    `;
    return parseBank(rows[0]?.bank);
  });

export const saveHandBank = createServerFn({ method: "POST" })
  .validator((input: HandBank) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql.query(
      "create table if not exists hand_style (user_id text primary key, bank text not null default '{}', updated_at timestamptz not null default now())",
    );
    const bank = JSON.stringify(parseBank(JSON.stringify(data ?? {})));
    await sql`
      insert into hand_style (user_id, bank, updated_at)
      values (${context.userId}, ${bank}, now())
      on conflict (user_id) do update set bank = excluded.bank, updated_at = now()
    `;
    return { ok: true as const };
  });
