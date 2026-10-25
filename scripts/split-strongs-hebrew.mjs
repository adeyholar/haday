/** Split public/lexicon/strongs-hebrew.json into 500-entry ranges. Run when that file changes. */
import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public/lexicon/strongs-hebrew.json");
const outDir = join(root, "public/lexicon/strongs-hebrew");
const chunk = 500;
const max = 8674;

const book = JSON.parse(readFileSync(source, "utf8"));
const buckets = new Map();
for (const [id, row] of Object.entries(book)) {
  const n = Number(id.slice(1));
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
console.log(`wrote ${buckets.size} chunks, ${Object.keys(book).length} entries`);
