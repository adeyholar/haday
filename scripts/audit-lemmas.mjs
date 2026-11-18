/**
 * Read-only lemma audit (LEMMA_RULES §8.1 a–h, row shape §8.2).
 * Each exception row has the surface, the OSHB tag (`lemma|morph`), and the
 * proposed class lemma. Writes nothing in the app. Exits non-zero when a
 * must-be-zero guard fires or the exception report differs from
 * docs/lemma-audit-baseline.json.
 * Pass --write to replace the baseline. That is not the CI path.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = join(root, "docs/lemma-audit-baseline.json");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { lemmaForReading, morphKind, contentNumbers, verbStem, ketivQereNumbers, hasReadingArticle } = await jiti.import(
  join(root, "src/lib/reading-loop/strong-lemma.ts"),
);
const { iibsPathItems } = await jiti.import(join(root, "src/lib/iibs-weeks.ts"));
const { VOCAB } = await jiti.import(join(root, "src/lib/vocab.ts"));
const map = JSON.parse(readFileSync(join(root, "src/lib/reading-loop/strong-map.json"), "utf8"));
const iibs = iibsPathItems();

const STEM = { q: ["(Q)"], N: ["(Ni)"], p: ["(Pi)"], P: ["(Pu)"], h: ["(Hi)"], H: ["(Ho)", "(Hoph)"], t: ["(Hith)"] };

function morphCore(part) {
  const mark = part[1];
  if ((part.startsWith("H") || part.startsWith("A")) && mark && mark !== mark.toLowerCase()) return part.slice(1);
  return part;
}

function bucketOfMorph(morph) {
  const kind = morphKind(morph);
  if (kind === "verb") return "verb";
  if (kind === "name") return "name";
  if (kind === "gentilic") return "gentilic";
  if (kind === "noun") {
    const parts = String(morph ?? "").split("/").filter(Boolean);
    const cores = parts.map(morphCore);
    const core = [...cores].reverse().find((part) => part && !part.startsWith("S") && part !== "Td") ?? "";
    if (core.startsWith("A")) return "adj";
    return "noun";
  }
  if (kind === "pron" || kind === "prep" || kind === "particle") return "particle";
  return "";
}

function bucketOfCard(item) {
  if (item.pos === "verb") return "verb";
  if (item.pos === "adj") return "adj";
  if (item.pos === "noun") return "noun";
  if (item.pos === "name") return "name";
  if (item.pos === "gentilic") return "gentilic";
  return "particle";
}

function hasNp(morph) {
  return String(morph ?? "").split("/").some((part) => morphCore(part).startsWith("Np"));
}

function hasNg(morph) {
  return String(morph ?? "").split("/").some((part) => morphCore(part).startsWith("Ng"));
}

function hireqYod(surface) {
  return /\u05B4\u05D9(?![\u05D0-\u05EA])/.test(surface);
}

const homes = new Map();
function homeNumbers(table, id) {
  const key = `${table === map.iibs ? "i" : "b"}:${id}`;
  const cached = homes.get(key);
  if (cached) return cached;
  const found = [];
  for (const [n, rows] of Object.entries(table)) {
    if ((rows || []).some((row) => row[0] === id && row[1] === 1)) found.push(Number(n));
  }
  homes.set(key, found);
  return found;
}

function appSurfaces() {
  const out = new Map();
  for (const name of readdirSync(join(root, "public/tanakh/books"))) {
    if (!name.endsWith(".json")) continue;
    const book = JSON.parse(readFileSync(join(root, "public/tanakh/books", name), "utf8"));
    for (const [ch, rows] of Object.entries(book.chapters)) {
      for (const row of rows) out.set(`${book.id}.${ch}.${row.v}`, row.words ?? []);
    }
  }
  return out;
}

const books = appSurfaces();
const report = { a: [], b: [], c: [], d: [], e: [], f: [], g: [], h: [] };

function oshbTag(word) {
  const lemma = word.lemma || "";
  const morph = word.morph || "";
  if (lemma && morph) return `${lemma}|${morph}`;
  return lemma || morph;
}

function proposedLemma(item) {
  if (!item) return "";
  const he = item.hebrew || "";
  const gloss = item.gloss || "";
  if (he && gloss) return `${he} (${gloss})`;
  return he || gloss;
}

function add(rule, ref, index, path, item, word) {
  report[rule].push({
    ref,
    index,
    surface: word.surface || "",
    tag: oshbTag(word),
    path,
    id: item?.id || "",
    proposed: proposedLemma(item),
  });
}

for (const book of readdirSync(join(root, "data/wlc"))) {
  const dir = join(root, "data/wlc", book);
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json.gz")) continue;
    const chapter = JSON.parse(gunzipSync(readFileSync(join(dir, name))));
    for (const verse of chapter.verses ?? []) {
      const parts = String(verse.ref || "").split(".");
      const shown = (verse.words ?? []).filter((word) => word.kq_role !== "qere");
      const app = books.get(verse.ref);
      shown.forEach((word, index) => {
        if (!app || app[index] !== (word.surface || "")) add("h", verse.ref, index, "grammar", null, word);
        const at = { book: parts[0], chapter: Number(parts[1]), verse: Number(parts[2]), index };
        const qereNumbers = ketivQereNumbers(shown, index);
        if (qereNumbers) at.qereNumbers = qereNumbers;
        const numbers = contentNumbers(word.lemma);
        const morph = word.morph || "";
        const buckets = bucketOfMorph(morph);
        for (const [path, pool, table] of [
          ["grammar", VOCAB, map.bbh],
          ["scripture", iibs, map.iibs],
        ]) {
          const item = lemmaForReading(word.surface, word.lemma, morph, pool, at);
          if (!numbers.length && item) add("c", verse.ref, index, path, item, word);
          if (!item) {
            if (hasNg(morph)) add("b", verse.ref, index, path, null, word);
            if (hireqYod(word.surface || "") && hasReadingArticle(morph)) add("f", verse.ref, index, path, null, word);
            continue;
          }
          if (hasNp(morph) && item.pos !== "name") add("a", verse.ref, index, path, item, word);
          if (hasNg(morph) && item.pos !== "gentilic") add("b", verse.ref, index, path, item, word);
          const card = bucketOfCard(item);
          const stem = verbStem(morph).stem;
          const text = `${item.stems || ""} ${item.gloss || ""}`;
          const listed = Object.values(STEM).flat().some((mark) => text.includes(mark));
          const stemMiss = listed && stem && !(STEM[stem] || []).some((mark) => text.includes(mark));
          if ((buckets && card && buckets !== card) || stemMiss) add("d", verse.ref, index, path, item, word);
          if ((numbers.includes(853) || numbers.includes(854)) && !buckets) add("e", verse.ref, index, path, item, word);
          if (hireqYod(word.surface || "") && hasReadingArticle(morph) && item.pos !== "gentilic") {
            add("f", verse.ref, index, path, item, word);
          }
          const n = numbers.length === 1 ? numbers[0] : 0;
          if (n) {
            const home = homeNumbers(table, item.id);
            if (home.length && !home.includes(n)) add("g", verse.ref, index, path, item, word);
          }
        }
      });
    }
  }
}

for (const rule of Object.keys(report)) {
  report[rule].sort((a, b) => a.ref.localeCompare(b.ref) || a.index - b.index || a.path.localeCompare(b.path));
}

const counts = Object.fromEntries(Object.entries(report).map(([rule, rows]) => [rule, rows.length]));
const write = process.argv.includes("--write");
if (write) {
  writeFileSync(baselinePath, JSON.stringify({ counts, report }, null, 2) + "\n");
  console.log("wrote", baselinePath, counts);
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
} catch {
  console.error("audit baseline missing:", baselinePath);
  process.exit(1);
}

const problems = [];
if (report.e.length) problems.push(`8.1 e must be zero, saw ${report.e.length}`);
if (report.h.length) problems.push(`8.1 h must be zero, saw ${report.h.length}`);
if ((baseline.report?.c || []).length === 0 && report.c.length) problems.push(`8.1 c must stay zero, saw ${report.c.length}`);
const got = JSON.stringify({ counts, report });
const want = JSON.stringify({ counts: baseline.counts, report: baseline.report });
if (got !== want) problems.push("exception report differs from docs/lemma-audit-baseline.json");
if (problems.length) {
  console.error(problems.join("\n"));
  console.error("live", counts);
  console.error("baseline", baseline.counts);
  process.exit(1);
}
console.log("lemma audit", counts);
