/**
 * Build the Strong’s → class-lemma map used by passage drills.
 * Run: node scripts/build-strong-map.mjs
 *
 * Provenance: the verse tokens are the pinned data/wlc text (haday-hebrew-data
 * v1.2.0). Lemma and morph are the Open Scriptures Hebrew Bible morphology
 * (OSHB, CC BY 4.0) already on those tokens. The lexicon headwords are the
 * Open Scriptures Strong’s Hebrew lexicon (CC BY-SA). The class lists are the
 * Grammar Path vocabulary and the Scripture Path lesson lists. This file only
 * joins those. It does not copy their glosses into the map.
 */
import { writeFileSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { VOCAB } = await jiti.import(join(root, "src/lib/vocab.ts"));
const { iibsPathItems } = await jiti.import(join(root, "src/lib/iibs-weeks.ts"));
const { foldFinals, lettersOnly } = await jiti.import(join(root, "src/lib/hebrew.ts"));
const { strongNo, morphKind, posFitsReadingKind, hasReadingArticle } = await jiti.import(join(root, "src/lib/reading-loop/strong-lemma.ts"));

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
    if (n && row && typeof row === "object" && "w" in row && row.w) {
      lex.set(n, { w: pointed(row.w), src: row });
    }
  }
}

const occurrences = [];
const wlcDir = join(root, "data/wlc");
for (const book of readdirSync(wlcDir)) {
  const dir = join(wlcDir, book);
  if (!statSync(dir).isDirectory()) continue;
  for (const fn of readdirSync(dir).filter((name) => name.endsWith(".json.gz"))) {
    const chapter = JSON.parse(gunzipSync(readFileSync(join(dir, fn))).toString("utf8"));
    for (const verse of chapter.verses ?? []) {
      for (const word of verse.words ?? []) {
        if (word.kq_role === "qere") continue;
        const n = strongNo(word.lemma);
        if (!n) continue;
        occurrences.push({
          n,
          surface: pointed(word.surface),
          kind: morphKind(word.morph || ""),
          article: hasReadingArticle(word.morph || ""),
        });
      }
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
    return /[\s\u05BE]/.test(String(lex.get(n)?.src?.w || ""));
  }
  function cons(s) {
    return foldFinals(lettersOnly(s));
  }
  /** The lexicon’s “(fully) …” line, when that fuller form is more than one word. */
  function fullerName(n) {
    const text = `${lex.get(n)?.src?.r || ""} ${lex.get(n)?.src?.d || ""}`;
    const out = [];
    for (const match of text.matchAll(/\(fully\)\s*([\u0590-\u05FF][\u0590-\u05FF\u05BE\s]*)/g)) {
      const phrase = match[1].trim();
      if (/[\s\u05BE]/.test(phrase)) out.push(cons(phrase));
    }
    return out;
  }
  /** A place or person whose citation form is only the plural of another word. */
  function pluralName(n) {
    const src = lex.get(n)?.src;
    if (!src || /[\s\u05BE]/.test(src.w || "")) return false;
    const d = src.d || "";
    const proper = /^[A-Z]/.test(d) && /\b(place|Israelite|Israelitess|name of|son of|daughter)\b/i.test(d);
    return proper && /plural(?: masculine| feminine)? of H\d+/i.test(src.r || "");
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
  function lexiconHasPeople(n, head, item, article) {
    const lw = cons(lex.get(n)?.w || "");
    const h = foldFinals(head);
    if (!lw || !h) return false;
    if (item.gloss === "Benjamite") return compoundName(n) && lw.includes(h);
    if (item.gloss === "Levite") {
      if (lw.startsWith(h) && lw.slice(h.length) === "י") return true;
      return Boolean(article) && lw === h;
    }
    if (item.gloss === "Chaldean") return h.startsWith(lw) && (h.slice(lw.length) === "מ" || h.slice(lw.length) === "ימ");
    return lw === h;
  }
  /** A compound or a fused name is not the ordinary word inside it. */
  function partOfAnotherName(n, item) {
    const full = fullerName(n);
    const heads = headwords(item).map((he) => cons(he)).filter((he) => he.length >= 2);
    if (full.length) return !heads.some((he) => full.includes(he));
    if (pluralName(n) && item.pos !== "name" && item.pos !== "gentilic") return true;
    const lw = cons(lex.get(n)?.w || "");
    if (!lw || heads.some((he) => he === lw)) return false;
    if (compoundName(n)) return true;
    return heads.some((he) => lw.length >= he.length + 2 && (lw.startsWith(he) || lw.endsWith(he)));
  }
  function formOfLexicon(surface, n) {
    const lw = cons(lex.get(n)?.w || "");
    const s = cons(surface);
    if (!lw || !s) return false;
    if (s === lw || s.includes(lw) || lw.includes(s)) return true;
    // A mater, a feminine ending, or one changed letter is still this word (אַהֲרֹן / אַהֲרוֹן, אַתָּה / אַתֶּם).
    const bare = (t) => [...t].filter((ch) => ch !== "ו" && ch !== "י").join("");
    const a = bare(s);
    const b = bare(lw);
    if (a && b && (a === b || a.includes(b) || b.includes(a) || isSubseq(a, b) || isSubseq(b, a) || editDistance(a, b) <= 2)) return true;
    // פַּדַּן אֲרָם cites אֲרָם. The citation is this name, not a different word.
    const src = lex.get(n)?.src;
    return cons(`${src?.r || ""} ${src?.d || ""} ${src?.k || ""}`).includes(s);
  }
  function isSubseq(short, long) {
    let i = 0;
    for (const ch of long) if (ch === short[i]) i += 1;
    return i === short.length;
  }
  function editDistance(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[a.length][b.length];
  }
  function add(n, item, lexHit, viaSurface) {
    if (partOfAnotherName(n, item)) {
      const lw = cons(lex.get(n)?.w || "");
      const people = item.pos === "gentilic" && viaSurface && headwords(item).some((he) => lw.includes(cons(he)));
      if (!people) return;
    }
    const id = item.id;
    const row = map.get(n) ?? new Map();
    row.set(id, row.get(id) === 1 || lexHit ? 1 : 0);
    map.set(n, row);
  }
  for (const [n, entry] of lex) {
    const form = entry.w;
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
      // הִגִּיד does not contain נָגַד, so verbs are exempt. Another noun is still filed when this
      // strong’s own class word fits the same morph (שָׁלֵם must not be drilled as לֵבָב). בַּל is not
      // filed on לְאֹם: that entry has no particle.
      if (item.pos !== "verb" && occ.kind !== "verb" && !formOfLexicon(occ.surface, occ.n)) {
        const own = byPoint.get(lex.get(occ.n)?.w || "") ?? [];
        const rival = own.some((other) => other.id !== item.id && posFitsReadingKind(occ.kind, other.pos));
        if (!rival) continue;
      }
      if (item.pos === "gentilic" && (occ.kind !== "gentilic" || !headwords(item).some((he) => lexiconHasPeople(occ.n, lettersOnly(he), item, occ.article)))) continue;
      add(occ.n, item, 0, true);
    }
    // הַלֵּוִי and וְלַכַּשְׂדִּים are not the bare headword. The people-word is still the whole word after ו, ה, or a preposition.
    if (occ.kind === "gentilic") {
      const surfaceC = lettersOnly(occ.surface);
      let best = 0;
      const hits = [];
      for (const row of gentilics) {
        for (const head of row.heads) {
          if (!surfaceHasPeople(surfaceC, head) || !lexiconHasPeople(occ.n, head, row.item, occ.article)) continue;
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
