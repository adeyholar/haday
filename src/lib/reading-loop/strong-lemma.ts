/** A passage word belongs to a class lemma only when the text’s own Strong’s number says so. */

import { foldFinals, lettersOnly } from "@/lib/hebrew";
import { parseOshbLemma } from "@/lib/oshb-lemma";
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

function morphCore(part: string): string {
  const mark = part[1];
  if ((part.startsWith("H") || part.startsWith("A")) && mark && mark !== mark.toLowerCase()) return part.slice(1);
  return part;
}

/**
 * The Hebrew article. `Td` is הַ. `Rd` is a preposition that already contains it (לַ, בַּ).
 * A final `Td` is the Aramaic determined ending, not this article. A plain לְ is `R`, not `Rd`.
 */
export function hasReadingArticle(morph: string | undefined): boolean {
  const parts = String(morph ?? "").split("/").filter(Boolean);
  return parts.some((part, i) => {
    const core = morphCore(part);
    if (core === "Rd") return true;
    return core === "Td" && i < parts.length - 1;
  });
}

/** OSHB verb stem letter and the aspect letter after it. `Vq` is qal, `Vh` hiphil, `VN` niphal, `Vp` piel, `VP` pual, `VH` hophal. */
export function verbStem(morph: string | undefined): { stem: string; aspect: string } {
  const parts = String(morph ?? "").split("/").filter(Boolean);
  for (const raw of [...parts].reverse()) {
    const core = morphCore(raw);
    if (core.startsWith("V") && core.length >= 2) return { stem: core[1] ?? "", aspect: core[2] ?? "" };
  }
  return { stem: "", aspect: "" };
}

/** One content number, or every number when the lemma carries more than one. A packed `H639` tag is one number. */
export function contentNumbers(raw: string | undefined): number[] {
  const head = String(raw ?? "").split("|")[0]?.trim() ?? "";
  if (!head) return [];
  if (/^H\d+$/.test(head)) {
    const n = Number(head.slice(1));
    return n >= 1 && n <= 8674 ? [n] : [];
  }
  return parseOshbLemma(head).parts.map((part) => strongNo(part.strong)).filter((n) => n > 0);
}

/** Every content number on a qere list, not only the first word. */
export function qereContentNumbers(qere: { lemma?: string }[] | undefined): number[] {
  const out: number[] = [];
  for (const word of qere ?? []) out.push(...contentNumbers(word.lemma));
  return out;
}

/**
 * The qere numbers that count for this ketiv. A qere on the token counts every word.
 * An empty qere uses the adjacent ketiv, which is where this pin hangs a split reading.
 * Undefined when the word is not a ketiv.
 */
export function ketivQereNumbers(
  words: { kq_role?: string | null; qere?: { lemma?: string }[] }[],
  index: number,
): number[] | undefined {
  const word = words[index];
  if (!word || word.kq_role !== "ketiv") return undefined;
  const own = word.qere ?? [];
  if (own.length) return qereContentNumbers(own);
  const nums: number[] = [];
  const prev = index > 0 ? words[index - 1] : undefined;
  const next = index + 1 < words.length ? words[index + 1] : undefined;
  if (prev?.kq_role === "ketiv") nums.push(...qereContentNumbers(prev.qere));
  if (next?.kq_role === "ketiv") nums.push(...qereContentNumbers(next.qere));
  return nums;
}

function alsoCard(item: VocabItem): boolean {
  return /also/i.test(item.gloss) && !/anger|nostril|nose/i.test(item.gloss);
}

function card(pool: VocabItem[], id: string): VocabItem | undefined {
  return pool.find((item) => item.id === id);
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
 * A gentilic counts only when the surface still carries that people-word.
 */
export function lemmaForReading(
  surface: string,
  tag: string | undefined,
  morph: string | undefined,
  pool: VocabItem[],
  at?: { book: string; chapter: number; verse: number; qereNumbers?: number[] },
): VocabItem | undefined {
  const numbers = contentNumbers(tag);
  // Rule 1.6. A token that carries two Strong’s numbers is not one class lemma.
  if (numbers.length > 1) return undefined;
  // A ketiv keeps its lemma only when its one number is in the qere that counts.
  if (at && Object.prototype.hasOwnProperty.call(at, "qereNumbers")) {
    const qereNumbers = at.qereNumbers ?? [];
    if (numbers.length === 1 && !qereNumbers.includes(numbers[0])) return undefined;
  }
  const n = numbers[0] ?? 0;
  if (!n) return undefined;
  const scripture = pool.some((item) => item.id.startsWith("iibs-"));
  const stem = verbStem(morph);
  // H606 is Aramaic אֱנָשׁ. No Aramaic Strong’s number is a Hebrew card.
  if (n === 606) return undefined;
  // H3212 qal is הָלַךְ, the same card as H1980. Hiphil stays הוֹלִיךְ. Any other stem is none.
  if (n === 3212) {
    if (stem.stem === "q") return card(pool, scripture ? "iibs-a-1msybw9" : "halak");
    if (stem.stem === "h") return scripture ? card(pool, "iibs-c-1tp6utj") : undefined;
    return undefined;
  }
  // H5324 niphal is נִצַּב. Hiphil stays הִצִּיב. Hophal and the rest are none.
  if (n === 5324) {
    if (stem.stem === "N") return scripture ? card(pool, "iibs-c-11jl9et") : undefined;
    if (stem.stem === "h") return scripture ? card(pool, "iibs-c-1jg2v39") : undefined;
    return undefined;
  }
  // H3526 piel stays כִּבֵּס. Passive stems and the qal “fuller” participle do not.
  if (n === 3526 && stem.stem !== "p") return undefined;
  const byId = new Map(pool.map((item) => [item.id, item]));
  let kind = morphKind(morph);
  // Zechariah 8:23 יְהוּדִי is tagged as a name. In this verse it is a Jew.
  if (at?.book === "Zech" && at.chapter === 8 && at.verse === 23 && n === 3064 && lettersOnly(surface).includes("יהודי")) {
    kind = "gentilic";
  }
  // A personal name does not take the article. הַלֵּוִי is the Levite, whatever the tag says.
  if ((n === 3878 || n === 3881) && hasReadingArticle(morph)) kind = "gentilic";
  const all = (tableFor(pool)[String(n)] ?? [])
    .map(([id, lex]) => ({ item: byId.get(id), lex: lex === 1 }))
    .filter((row): row is { item: VocabItem; lex: boolean } => Boolean(row.item));
  let rows = all.filter((row) => posFitsReadingKind(kind, row.item.pos));
  // H1323 is daughter. The Zion card does not ride on that number.
  if (n === 1323) rows = rows.filter((row) => row.item.id !== "zion" && row.item.id !== "iibs-a-10um24x");
  // H637 is אַף “also”. H639 is אַף “anger”. Neither number may reach the other card.
  if (n === 637) rows = rows.filter((row) => alsoCard(row.item));
  if (n === 639) rows = rows.filter((row) => !alsoCard(row.item));
  if (rows.some((row) => row.item.pos === "gentilic")) {
    const surfaceC = lettersOnly(surface);
    rows = rows.filter((row) => row.item.pos !== "gentilic" || headForms(row.item).some((he) => {
      const head = lettersOnly(he);
      return head.length >= 2 && isSubsequence(head, surfaceC);
    }));
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
