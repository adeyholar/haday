import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { vocabLessons } = await jiti.import(join(root, "src/lib/iibs-vocab.ts"));
const { iibsWordId } = await jiti.import(join(root, "src/lib/iibs-weeks.ts"));
const { D_COURSEBOOK } = await jiti.import(join(root, "src/lib/iibs-d-coursebook.ts"));

function cleanGloss(gloss) {
  return gloss.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").replace(/\s+([,;])/g, "$1").trim();
}

function mismatches() {
  const lessons = vocabLessons("D");
  const out = [];
  assert.equal(D_COURSEBOOK.length, 300);
  assert.equal(lessons.reduce((n, row) => n + row.length, 0), 300);
  for (const book of D_COURSEBOOK) {
    const lesson = Number(book.slot.slice(7, 9));
    const place = Number(book.slot.slice(10, 12));
    const word = lessons[lesson - 1][place - 1];
    const site = word.hebrew.normalize("NFC");
    const course = book.hebrew.normalize("NFC");
    if (site === course) continue;
    const gloss = cleanGloss(word.gloss);
    out.push({
      lesson: `${lesson}.${String(place).padStart(2, "0")}`,
      id: gloss ? iibsWordId("D", word.hebrew, gloss) : "",
      site: word.hebrew,
      course: book.hebrew,
      page: String(book.page),
    });
  }
  return out;
}

test("the Level D pointing report lists every full-string mismatch", () => {
  const found = mismatches();
  const md = readFileSync(join(root, "docs/iibs-d-pointing-check.md"), "utf8");
  assert.match(md, new RegExp(`Still different: ${found.length}\\.`));
  const rows = md.split("\n").filter((line) => /^\| \d+\.\d+ \|/.test(line));
  assert.equal(rows.length, found.length);
  rows.forEach((line, index) => {
    const cell = line.split("|").map((part) => part.trim());
    const row = found[index];
    assert.equal(cell[1], row.lesson);
    assert.equal(cell[2], row.id);
    assert.equal(cell[3], row.site);
    assert.equal(cell[4], row.course);
    assert.equal(cell[5], row.page);
  });
});
