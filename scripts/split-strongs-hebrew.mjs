/** Write the Hebrew Strong's chunks from the Open Scriptures dictionary.

The source is adeyholar/strongs (the Open Scriptures dictionary). The whole
book is not published; a card loads one range. Run this when the dictionary
changes. Set STRONGS_HEBREW to a local checkout of
hebrew/strongs-hebrew-dictionary.js to skip the download.
*/
import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE =
  "https://raw.githubusercontent.com/adeyholar/strongs/master/hebrew/strongs-hebrew-dictionary.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/lexicon/strongs-hebrew");
const chunk = 500;
const max = 8674;

function clip(value, n) {
  const text = String(value || "").replace(/\s+/g, " ").replaceAll("{", "").replaceAll("}", "").trim();
  if (text.length > n) return `${text.slice(0, n - 1).trimEnd()}…`;
  return text;
}

function compact(raw) {
  const book = {};
  for (const [key, row] of Object.entries(raw)) {
    if (!row || typeof row !== "object") continue;
    const num = String(key).replace(/\D/g, "");
    if (!num) continue;
    book[`H${Number(num)}`] = {
      w: clip(row.lemma, 80),
      x: clip(row.xlit || row.translit, 80),
      p: clip(row.pron || row.xlit || row.translit, 80),
      d: clip(row.strongs_def, 220),
      k: clip(row.kjv_def, 180),
      r: clip(row.derivation, 160),
    };
  }
  return book;
}

const text = process.env.STRONGS_HEBREW
  ? readFileSync(process.env.STRONGS_HEBREW, "utf8")
  : await fetch(SOURCE).then((res) => {
      if (!res.ok) throw new Error(`dictionary ${res.status}`);
      return res.text();
    });
const book = compact(JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)));
const buckets = new Map();
for (const [id, row] of Object.entries(book)) {
  const n = Number(id.slice(1));
  if (!Number.isInteger(n) || n < 1 || n > max) continue;
  const start = Math.floor((n - 1) / chunk) * chunk + 1;
  const end = Math.min(start + chunk - 1, max);
  const pad = (value) => String(value).padStart(4, "0");
  const name = `H${pad(start)}-H${pad(end)}.json`;
  if (!buckets.has(name)) buckets.set(name, {});
  buckets.get(name)[id] = row;
}

mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(outDir)) {
  if (name.endsWith(".json") && !buckets.has(name)) unlinkSync(join(outDir, name));
}
for (const [name, rows] of buckets) writeFileSync(join(outDir, name), JSON.stringify(rows));
console.log(`wrote ${buckets.size} chunks, ${Object.keys(book).length} entries from ${SOURCE}`);
