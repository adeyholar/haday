import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { learnVerseExplain } = await jiti.import("/workspace/src/lib/tanakh-learn-note.ts");

test("article verse names citation lemma יָם not הַיָּם", () => {
  const e = learnVerseExplain(
    {
      ref: "Exod 14:21",
      he: "וַיֵּט מֹשֶׁה אֶת יָדוֹ עַל הַיָּם",
      en: "Moses stretched out his hand over the sea.",
      hit: "הַיָּם",
      hitEn: "sea",
    },
    "article",
    [{ word: "הַיָּם", gloss: "the sea", tag: "הַ + dagesh", note: "Yod takes the dagesh. Citation lemma is still יָם." }],
  );
  assert.equal(e.lemmaHe, "יָם");
  assert.match(e.lemmaGloss.toLowerCase(), /sea/);
  assert.match(e.note, /יָם/);
});

test("bare noun stays the citation lemma", () => {
  const e = learnVerseExplain(
    {
      ref: "Ps 24:8",
      he: "מִי זֶה מֶלֶךְ הַכָּבוֹד",
      en: "Who is this king of glory?",
      hit: "מֶלֶךְ",
      hitEn: "king",
    },
    "article",
    [],
  );
  assert.match(e.lemmaHe, /מֶ.?לֶךְ/);
  assert.match(e.lemmaGloss.toLowerCase(), /king/);
  assert.match(e.note, /indefinite|citation/i);
});
