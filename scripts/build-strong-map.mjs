/**
 * Build the Strong’s → class-lemma map used by passage drills.
 * Run: node scripts/build-strong-map.mjs
 *
 * Provenance: the verse tags are the Open Scriptures Hebrew Bible morphology
 * (OSHB, CC BY 4.0). The lexicon headwords are the Open Scriptures Strong’s
 * Hebrew lexicon (CC BY-SA). The class lists are the Grammar Path vocabulary
 * and the Scripture Path lesson lists. This file only joins those three.
 * It does not copy their glosses into the map.
 */
import { writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { VOCAB } = await jiti.import(join(root, "src/lib/vocab.ts"));
const { iibsPathItems } = await jiti.import(join(root, "src/lib/iibs-weeks.ts"));
const { foldFinals } = await jiti.import(join(root, "src/lib/hebrew.ts"));
const { strongNo, morphKind, posFitsReadingKind } = await jiti.import(join(root, "src/lib/reading-loop/strong-lemma.ts"));

function pointed(s) {
  return foldFinals(String(s ?? "").normalize("NFC").replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C3-\u05C6]/g, ""));
}

function headwords(item) {
  const raw = [item.hebrew, ...(item.hebrewAlts ?? [])];
  const out = [];
  for (const he of raw) {
    for (const part of String(he).split(" / ")) {
      const piece = part.trim();
      if (piece) out.push(piece);
    }
  }
  return out;
}

const lex = new Map();
const lexDir = join(root, "public/lexicon/strongs-hebrew");
for (const fn of readdirSync(lexDir)) {
  const data = JSON.parse(readFileSync(join(lexDir, fn), "utf8"));
  for (const [id, row] of Object.entries(data)) {
    const n = strongNo(id);
    if (n && row && typeof row === "object" && "w" in row && row.w) lex.set(n, pointed(row.w));
  }
}

const occurrences = [];
const strongDir = join(root, "public/tanakh/strongs");
const bookDir = join(root, "public/tanakh/books");
for (const fn of readdirSync(strongDir).filter((name) => name.endsWith(".json"))) {
  const tags = JSON.parse(readFileSync(join(strongDir, fn), "utf8"));
  const book = JSON.parse(readFileSync(join(bookDir, fn), "utf8"));
  for (const [ch, verses] of Object.entries(book.chapters)) {
    for (const verse of verses) {
      const row = tags[ch]?.[String(verse.v)] ?? [];
      verse.words.forEach((surface, i) => {
        const [sid, morph] = String(row[i] || "").split("|");
        const n = strongNo(sid);
        if (!n) return;
        occurrences.push({ n, surface: pointed(surface), kind: morphKind(morph || "") });
      });
    }
  }
}

function build(pool) {
  const byPoint = new Map();
  for (const item of pool) {
    for (const he of headwords(item)) {
      const key = pointed(he);
      if ([...key].length < 2) continue;
      const list = byPoint.get(key) ?? [];
      list.push(item);
      byPoint.set(key, list);
    }
  }
  /** @type {Map<number, Map<string, 0 | 1>>} */
  const map = new Map();
  function add(n, id, lexHit) {
    // H1145 is Benjamite, בֶּן־יְמִינִי. One token is spelled אִישׁ, so the whole number was filed under “man.”
    if (n === 1145) return;
    const row = map.get(n) ?? new Map();
    row.set(id, row.get(id) === 1 || lexHit ? 1 : 0);
    map.set(n, row);
  }
  for (const [n, form] of lex) {
    for (const item of byPoint.get(form) ?? []) add(n, item.id, 1);
    const letters = form.replace(/[\u05B0-\u05BC\u05C1\u05C2\u05C7]/g, "");
    if (letters === "יהוה") {
      for (const item of pool) {
        if (item.pos === "name" && pointed(item.hebrew).replace(/[\u05B0-\u05BC\u05C1\u05C2\u05C7]/g, "") === "יהוה") add(n, item.id, 1);
      }
    }
  }
  for (const occ of occurrences) {
    for (const item of byPoint.get(occ.surface) ?? []) {
      if (!posFitsReadingKind(occ.kind, item.pos)) continue;
      add(occ.n, item.id, 0);
    }
  }
  const out = {};
  for (const [n, row] of [...map.entries()].sort((a, b) => a[0] - b[0])) {
    out[String(n)] = [...row.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([id, lexHit]) => [id, lexHit]);
  }
  return out;
}

const payload = { bbh: build(VOCAB), iibs: build(iibsPathItems()) };
const dest = join(root, "src/lib/reading-loop/strong-map.json");
writeFileSync(dest, JSON.stringify(payload));
console.log(
  "wrote",
  dest,
  "bbh",
  Object.keys(payload.bbh).length,
  "iibs",
  Object.keys(payload.iibs).length,
  "bytes",
  Buffer.byteLength(JSON.stringify(payload)),
);
