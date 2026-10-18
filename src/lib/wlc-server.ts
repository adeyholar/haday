import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { createServerFn } from "@tanstack/react-start";
import { assertAdmin } from "@/lib/admin";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { ensureLearnerPath } from "@/lib/learner-path";
import { bookMeta, isBookId } from "@/lib/tanakh-canon";
import type { WlcChapter } from "@/lib/wlc";

export type WlcChapterRequest = { book: string; chapter: number };

function chapterPaths(book: string, chapter: number): string[] {
  const file = join(book, `${chapter}.json.gz`);
  return [
    join(process.cwd(), "data", "wlc", file),
    join(process.cwd(), ".output", "server", "wlc", file),
    join(process.cwd(), "wlc", file),
  ];
}

async function assertMayReadText(userId: string) {
  try {
    await assertAdmin(userId);
    return;
  } catch {
    /* A classmate on the Scripture Path may read. The Grammar Path may not. */
  }
  await ensureLearnerPath();
  const sql = await getSql();
  const rows = await sql<{ path: string }>`
    select path from learner_path where user_id = ${userId}
  `;
  if (rows[0]?.path !== "iibs") throw new Error("The Tanakh text opens on the Scripture Path.");
}

export const loadWlcChapter = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: WlcChapterRequest) => input)
  .handler(async ({ context, data }): Promise<WlcChapter> => {
    await assertMayReadText(context.userId);
    const meta = isBookId(data.book) ? bookMeta(data.book) : undefined;
    const chapter = Number(data.chapter);
    if (!meta || !Number.isInteger(chapter) || chapter < 1 || chapter > meta.chapters) {
      throw new Error("That chapter is not in the Tanakh.");
    }
    let raw: Buffer | null = null;
    for (const path of chapterPaths(meta.id, chapter)) {
      try {
        raw = await readFile(path);
        break;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      }
    }
    if (!raw) throw new Error("That chapter is not on this text yet.");
    return JSON.parse(gunzipSync(raw).toString("utf8")) as WlcChapter;
  });
