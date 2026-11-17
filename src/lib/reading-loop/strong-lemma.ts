/** A passage word belongs to a class lemma only when the text’s own Strong’s number says so. */

import { foldFinals, lettersOnly } from "@/lib/hebrew";
import { formFitsLemma } from "@/lib/tanakh-pool";
import type { Pos, VocabItem } from "@/lib/vocab";
import map from "@/lib/reading-loop/strong-map.json";

type Row = [string, 0 | 1];
type Table = Record<string, Row[]>;

const grammarTable = map.bbh as unknown as Table;
const scriptureTable = map.iibs as unknown as Table;

function pointed(s: string): string {
  return foldFinals(String(s ?? "").normalize("NFC").replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C3-\u05C6]/g, ""));
}

/**
 * Strong’s number from a lemma field (`H5046`, `c/1961`, `5921 a`).
 * A morph code (`HR/Sp1cp`, `HVhp3ms`) is not a number. The person digit is not H1.
 */
export function strongNo(raw: string | undefined): number {
  const head = String(raw ?? "").split("|")[0]?.trim() ?? "";
  if (!head) return 0;
  const match = head.match(/^(?:[A-Za-z]+\/)*H?(\d+)(?:\s+[a-z])?$/);
  if (!match) return 0;
  const n = Number(match[1]);
  return n >= 1 && n <= 8674 ? n : 0;
}

/** A tag is either `strong|morph` or a morph with no Strong’s number. */
export function splitReadingTag(tag: string | undefined): { strong: string; morph: string } {
  const raw = String(tag ?? "");
  const pipe = raw.indexOf("|");
  const head = (pipe >= 0 ? raw.slice(0, pipe) : raw).trim();
  const tail = pipe >= 0 ? raw.slice(pipe + 1).trim() : "";
  if (strongNo(head)) return { strong: head, morph: tail };
  return { strong: "", morph: tail || head };
}

/** Open-scriptures morph. A pronominal suffix and the Aramaic article are not the word. */
export function morphKind(morph: string | undefined): "" | "verb" | "name" | "noun" | "pron" | "prep" | "particle" | "gentilic" {
  const parts = String(morph ?? "").split("/").filter(Boolean);
  if (!parts.length) return "";
  const cores = parts.map((part) => {
    const mark = part[1];
    if ((part.startsWith("H") || part.startsWith("A")) && mark && mark !== mark.toLowerCase()) return part.slice(1);
    return part;
  });
  const core = [...cores].reverse().find((part) => part && !part.startsWith("S") && part !== "Td") ?? cores[0] ?? "";
  if (!core) return "";
  if (core.includes("V")) return "verb";
  if (/Np/.test(core)) return "name";
  if (/Ng/.test(core)) return "gentilic";
  if (core.startsWith("N") || core.startsWith("A")) return "noun";
  if (core.startsWith("P")) return "pron";
  if (core.startsWith("R")) return "prep";
  return "particle";
}

export function posFitsReadingKind(kind: string, pos: Pos): boolean {
  if (!kind) return true;
  if (kind === "verb") return pos === "verb";
  if (kind === "name") return pos === "name";
  if (kind === "noun") return pos === "noun" || pos === "adj" || pos === "gentilic";
  if (kind === "gentilic") return pos === "gentilic" || pos === "noun" || pos === "adj";
  if (kind === "pron") return pos === "pron";
  if (kind === "prep") return pos === "prep";
  return pos === "particle" || pos === "pron";
}

function headForms(item: VocabItem): string[] {
  const raw = [item.hebrew, ...(item.hebrewAlts ?? [])];
  const out: string[] = [];
  for (const he of raw) {
    for (const part of String(he).split(" / ")) {
      const piece = part.trim();
      if (piece) out.push(piece);
    }
  }
  return out;
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
  return pool.some((item) => item.id.startsWith("iibs-")) ? scriptureTable : grammarTable;
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
  const all = (tableFor(pool)[String(n)] ?? [])
    .map(([id, lex]) => ({ item: byId.get(id), lex: lex === 1 }))
    .filter((row): row is { item: VocabItem; lex: boolean } => Boolean(row.item));
  let rows = all.filter((row) => posFitsReadingKind(kind, row.item.pos));
  // One coursebook card says “Levi, Levite.” The person stays a name. A Levite line still uses that card.
  if (!rows.length && kind === "gentilic") {
    rows = all.filter((row) => row.item.pos === "name" && row.item.gloss.toLowerCase().includes("levite"));
  }
  if (!rows.length) return undefined;
  // H853, H854, and H855 share both אֵת cards. With no morph, do not guess.
  if (!kind && rows.length > 1) return undefined;
  if (rows.length === 1) return rows[0].item;
  const surf = pointed(surface);
  const exact = rows.filter((row) => headForms(row.item).some((he) => pointed(he) === surf));
  if (exact.length === 1) return exact[0].item;
  const lexHits = rows.filter((row) => row.lex);
  if (lexHits.length === 1) return lexHits[0].item;
  const fit = rows.filter((row) => formFitsLemma(surface, row.item));
  if (!fit.length) {
    const surfaceC = lettersOnly(surface);
    const sub = rows.filter((row) => headForms(row.item).some((he) => {
      const head = lettersOnly(he);
      return head.length >= 2 && isSubsequence(head, surfaceC);
    }));
    if (!sub.length) return undefined;
    sub.sort((a, b) => {
      const alen = Math.max(...headForms(a.item).map((he) => lettersOnly(he).length));
      const blen = Math.max(...headForms(b.item).map((he) => lettersOnly(he).length));
      return blen - alen || b.item.freq - a.item.freq;
    });
    return sub[0]?.item;
  }
  const ranked = fit.slice().sort((a, b) => b.item.freq - a.item.freq || Number(b.lex) - Number(a.lex));
  return ranked[0]?.item;
}
