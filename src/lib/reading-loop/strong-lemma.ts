/** A passage word belongs to a class lemma only when the text’s own Strong’s number says so. */

import { foldFinals, lettersOnly } from "@/lib/hebrew";
import { formFitsLemma } from "@/lib/tanakh-pool";
import type { Pos, VocabItem } from "@/lib/vocab";
import map from "@/lib/reading-loop/strong-map.json";

type Row = [string, 0 | 1];
type Table = Record<string, Row[]>;

const BBH = map.bbh as unknown as Table;
const IIBS = map.iibs as unknown as Table;

function pointed(s: string): string {
  return foldFinals(String(s ?? "").normalize("NFC").replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C3-\u05C6]/g, ""));
}

/** Strong’s number from a WLC lemma (`c/1961`, `5892 b`) or a tag (`H5046|HVhp3ms`). */
export function strongNo(raw: string | undefined): number {
  const head = String(raw ?? "").split("|")[0] ?? "";
  const match = head.match(/(\d+)/);
  if (!match) return 0;
  const n = Number(match[1]);
  return n >= 1 && n <= 8674 ? n : 0;
}

/** Open-scriptures morph, ignoring a leading Hebrew/Aramaic mark. A pronominal suffix is not the word. */
export function morphKind(morph: string | undefined): "" | "verb" | "name" | "noun" | "pron" | "prep" | "particle" {
  const parts = String(morph ?? "").split("/").filter(Boolean);
  if (!parts.length) return "";
  const cores = parts.map((part) => ((part.startsWith("H") || part.startsWith("A")) && part.length > 1 ? part.slice(1) : part));
  // Rightmost piece that is not a pronominal suffix (S…) or the Aramaic article (Td).
  const core = [...cores].reverse().find((part) => part && !part.startsWith("S") && part !== "Td") ?? cores[0] ?? "";
  if (!core) return "";
  if (core.includes("V")) return "verb";
  if (/N[pg]/.test(core)) return "name";
  if (core.startsWith("N") || core.startsWith("A")) return "noun";
  if (core.startsWith("P")) return "pron";
  if (core.startsWith("R")) return "prep";
  return "particle";
}

function kindOk(kind: string, pos: Pos): boolean {
  if (!kind) return true;
  if (kind === "verb") return pos === "verb";
  if (kind === "name") return pos === "name";
  if (kind === "noun") return pos === "noun" || pos === "adj";
  if (kind === "pron") return pos === "pron";
  if (kind === "prep") return pos === "prep" || pos === "particle";
  return pos === "particle" || pos === "prep" || pos === "pron";
}

function isSubsequence(short: string, long: string): boolean {
  let i = 0;
  for (const ch of long) {
    if (ch === short[i]) i += 1;
    if (i >= short.length) return true;
  }
  return false;
}

function tableFor(pool: VocabItem[]): Table {
  return pool.some((item) => item.id.startsWith("iibs-")) ? IIBS : BBH;
}

/**
 * The class lemma this surface actually is. A proper name is not a common noun
 * with the same letters, and a shorter look-alike is not this word.
 * No Strong’s number means no guess.
 */
export function lemmaForReading(surface: string, tag: string | undefined, morph: string | undefined, pool: VocabItem[]): VocabItem | undefined {
  const n = strongNo(tag);
  if (!n) return undefined;
  const byId = new Map(pool.map((item) => [item.id, item]));
  const kind = morphKind(morph);
  const rows = (tableFor(pool)[String(n)] ?? [])
    .map(([id, lex]) => ({ item: byId.get(id), lex: lex === 1 }))
    .filter((row): row is { item: VocabItem; lex: boolean } => Boolean(row.item) && kindOk(kind, row.item!.pos));
  if (!rows.length) return undefined;
  if (rows.length === 1) return rows[0].item;
  const surf = pointed(surface);
  const exact = rows.filter((row) => {
    const forms = [row.item.hebrew, ...(row.item.hebrewAlts ?? [])];
    return forms.some((he) => pointed(he) === surf);
  });
  if (exact.length === 1) return exact[0].item;
  const lexHits = rows.filter((row) => row.lex);
  if (lexHits.length === 1) return lexHits[0].item;
  const fit = rows.filter((row) => formFitsLemma(surface, row.item));
  if (!fit.length) {
    const surfaceC = lettersOnly(surface);
    const sub = rows.filter((row) => {
      const head = lettersOnly(row.item.hebrew);
      return head.length >= 2 && isSubsequence(head, surfaceC);
    });
    if (!sub.length) return undefined;
    sub.sort((a, b) => lettersOnly(b.item.hebrew).length - lettersOnly(a.item.hebrew).length || b.item.freq - a.item.freq);
    return sub[0]?.item;
  }
  const ranked = fit.slice().sort((a, b) => b.item.freq - a.item.freq || Number(b.lex) - Number(a.lex));
  return ranked[0]?.item;
}
