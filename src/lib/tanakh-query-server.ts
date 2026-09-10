import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertAdmin } from "@/lib/admin";
import {
  kindLabel,
  parseTanakhQuery,
  runTanakhQuery,
  type ParsedTanakhQuery,
  type QueryForm,
  type QueryKind,
} from "@/lib/tanakh-query";

type IndexFile = { v: number; tokens: number; forms: QueryForm[] };

let cache: IndexFile | null = null;

async function loadIndex(): Promise<IndexFile> {
  if (cache) return cache;
  const path = join(process.cwd(), "public/tanakh/query-index.json");
  const raw = await readFile(path, "utf8");
  cache = JSON.parse(raw) as IndexFile;
  return cache;
}

export type TanakhQueryResult = {
  parsed: ParsedTanakhQuery;
  label: string;
  total: number;
  tokens: number;
  items: QueryForm[];
};

export const searchTanakhIndex = createServerFn({ method: "POST" })
  .validator((input: { q: string; kind?: QueryKind; limit?: number; scope?: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<TanakhQueryResult> => {
    await assertAdmin(context.userId);
    const parsed = parseTanakhQuery(data.q || data.kind || "qamets qatan");
    if (data.kind) parsed.kind = data.kind;
    if (data.limit) parsed.limit = Math.min(200, Math.max(1, data.limit));
    if (data.scope) parsed.scope = data.scope as ParsedTanakhQuery["scope"];
    const index = await loadIndex();
    const { items, total } = runTanakhQuery(index.forms, parsed);
    return { parsed, label: kindLabel(parsed.kind), total, tokens: index.tokens, items };
  });
