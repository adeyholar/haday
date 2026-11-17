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
const { foldFinals, lettersOnly } = await jiti.import(join(root, "src/lib/hebrew.ts"));
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
  function compoundName(n) {
    return /[\s\u05BE]/.test(String(lex.get(n) || ""));
  }
  function cons(s) {
    return foldFinals(lettersOnly(s));
  }
  /** ו, ה, or one preposition may stand in front. A plural ending may follow. The people-word is not a piece of a longer stem. */
  function surfaceHasPeople(surface, head) {
    const s = foldFinals(surface);
    const h = foldFinals(head);
    if (!h || s.length < h.length) return false;
    let from = 0;
    while (from <= s.length - h.length) {
      const at = s.indexOf(h, from);
      if (at < 0) return false;
      const pre = s.slice(0, at);
      const post = s.slice(at + h.length);
      const preOk = pre.length <= 3 && [...pre].every((ch) => "והבכלמש".includes(ch));
      const postOk = post === "" || post === "י" || post === "ימ" || post === "ות" || post === "א";
      if (preOk && postOk) return true;
      from = at + 1;
    }
    return false;
  }
  function lexiconHasPeople(n, head, item) {
    const lw = cons(lex.get(n) || "");
    const h = foldFinals(head);
    if (!lw || !h) return false;
    if (item.gloss === "Benjamite") return compoundName(n) && lw.includes(h);
    if (item.gloss === "Levite") return lw.startsWith(h) && lw.slice(h.length) === "י";
    if (item.gloss === "Chaldean") return h.startsWith(lw) && (h.slice(lw.length) === "מ" || h.slice(lw.length) === "ימ");
    return lw === h;
  }
  /** A compound or a fused name is not the ordinary word inside it. H3816 is לְאֹם, not בַּל. */
  function partOfAnotherName(n, item) {
    const lw = cons(lex.get(n) || "");
    const heads = headwords(item).map((he) => cons(he)).filter((he) => he.length >= 2);
    if (!lw || heads.some((he) => he === lw)) return false;
    if (n === 3816) return true;
    if (compoundName(n)) return true;
    return heads.some((he) => lw.length >= he.length + 2 && (lw.startsWith(he) || lw.endsWith(he)));
  }
  function add(n, item, lexHit, viaSurface) {
    if (partOfAnotherName(n, item)) {
      const lw = cons(lex.get(n) || "");
      const people = item.pos === "gentilic" && viaSurface && headwords(item).some((he) => lw.includes(cons(he)));
      if (!people) return;
    }
    const id = item.id;
    const row = map.get(n) ?? new Map();
    row.set(id, row.get(id) === 1 || lexHit ? 1 : 0);
    map.set(n, row);
  }
  for (const [n, form] of lex) {
    for (const item of byPoint.get(form) ?? []) {
      if (item.pos === "gentilic" && (item.gloss === "Levite" || item.gloss === "Benjamite" || item.gloss === "Assyrian" || item.gloss === "Chaldean" || item.gloss === "Mede" || item.gloss === "Persian")) continue;
      add(n, item, 1, false);
    }
    const letters = form.replace(/[\u05B0-\u05BC\u05C1\u05C2\u05C7]/g, "");
    if (letters === "יהוה") {
      for (const item of pool) {
        if (item.pos === "name" && pointed(item.hebrew).replace(/[\u05B0-\u05BC\u05C1\u05C2\u05C7]/g, "") === "יהוה") add(n, item, 1, false);
      }
    }
  }
  const gentilics = [];
  for (const item of pool) {
    if (item.pos !== "gentilic") continue;
    const heads = headwords(item).map((he) => lettersOnly(he)).filter((he) => he.length >= 2);
    if (heads.length) gentilics.push({ item, heads });
  }
  for (const occ of occurrences) {
    for (const item of byPoint.get(occ.surface) ?? []) {
      if (!posFitsReadingKind(occ.kind, item.pos)) continue;
      if (item.pos === "gentilic" && (occ.kind !== "gentilic" || !headwords(item).some((he) => lexiconHasPeople(occ.n, lettersOnly(he), item)))) continue;
      add(occ.n, item, 0, true);
    }
    // הַלֵּוִי and וְלַכַּשְׂדִּים are not the bare headword. The people-word is still the whole word after ו, ה, or a preposition.
    if (occ.kind === "gentilic") {
      const surfaceC = lettersOnly(occ.surface);
      let best = 0;
      const hits = [];
      for (const row of gentilics) {
        for (const head of row.heads) {
          if (!surfaceHasPeople(surfaceC, head) || !lexiconHasPeople(occ.n, head, row.item)) continue;
          if (head.length > best) {
            best = head.length;
            hits.length = 0;
          }
          if (head.length === best) hits.push(row.item);
        }
      }
      for (const item of hits) add(occ.n, item, 0, true);
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
