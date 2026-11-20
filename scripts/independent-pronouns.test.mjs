import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { INDEPENDENT_PRONOUNS, independentPronounItems } = await jiti.import(
  new URL("../src/lib/independent-pronouns.ts", import.meta.url).pathname,
);
const { VOCAB, itemsForWeek, quizChoices } = await jiti.import(new URL("../src/lib/vocab.ts", import.meta.url).pathname);
const { hydrateDrillRuns, pronounDrillKey } = await jiti.import(new URL("../src/lib/etch.ts", import.meta.url).pathname);
const { GRAMMAR_TRACKS } = await jiti.import(new URL("../src/lib/grammar-tracks.ts", import.meta.url).pathname);

const root = new URL("../", import.meta.url);

test("independent pronouns are eleven persons, and behold stays a particle", () => {
  assert.equal(INDEPENDENT_PRONOUNS.length, 11);
  const ids = INDEPENDENT_PRONOUNS.map((row) => row.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(!ids.includes("hen"));
  assert.deepEqual(ids, ["ani", "anoki", "attah", "at", "hu", "hi", "anahnu", "attem", "atten", "hem", "hennah"]);
  const glosses = INDEPENDENT_PRONOUNS.map((row) => row.gloss);
  assert.equal(new Set(glosses).size, glosses.length);
  const hen = VOCAB.find((item) => item.id === "hen");
  assert.equal(hen.pos, "particle");
  assert.equal(hen.gloss.includes("behold"), true);
  assert.equal(VOCAB.some((item) => item.id === "atten" || item.id === "hennah"), false);
  const week5 = itemsForWeek(5).map((item) => item.id);
  assert.equal(week5.includes("atten"), false);
  assert.equal(week5.includes("hennah"), false);
});

test("the pronoun quiz can tell the persons apart", () => {
  const pool = independentPronounItems();
  assert.equal(pool.length, 11);
  assert.equal(pool.every((item) => item.pos === "pron"), true);
  for (const item of pool) {
    const choices = quizChoices(item, pool);
    assert.equal(choices.length, 4, item.id);
    assert.ok(choices.includes(item.gloss), item.id);
    assert.equal(new Set(choices).size, choices.length, item.id);
  }
  const attah = pool.find((item) => item.id === "attah");
  const at = pool.find((item) => item.id === "at");
  assert.notEqual(attah.gloss, at.gloss);
  assert.equal(pool.find((item) => item.id === "hennah").hebrew, "הֵנָּה");
});

test("the pronoun drill keeps its own place", () => {
  assert.equal(pronounDrillKey("due"), "pronouns:due");
  assert.equal(pronounDrillKey("weak"), "pronouns:weak");
  const place = { seed: 1, ids: ["ani"], index: 2, reviews: [], hits: 0, checks: 0, fingerprint: "p" };
  assert.equal(hydrateDrillRuns({ "pronouns:due": place })["pronouns:due"]?.index, 2);
  assert.equal(hydrateDrillRuns({ "pronouns:nope": place })["pronouns:nope"], undefined);
});

test("quiz and drill are on every module", () => {
  const files = [
    "src/routes/lessons/index.tsx",
    "src/routes/lessons/$track/index.tsx",
    "src/routes/lessons/$track/$unit.tsx",
    "src/routes/game/lessons/index.tsx",
    "src/routes/game/lessons/$track/index.tsx",
    "src/routes/game/lessons/$track/$unit.tsx",
    "src/routes/study/index.tsx",
    "src/routes/study/term2/index.tsx",
    "src/routes/study/term2/$chapter.tsx",
    "src/routes/iibs/study/$level.tsx",
    "src/routes/iibs/study/$level/$week.tsx",
    "src/components/iibs-door.tsx",
  ];
  for (const file of files) {
    const src = readFileSync(new URL(file, root), "utf8");
    assert.match(src, /IndependentPronounLinks/, file);
  }
  const hub = readFileSync(new URL("src/components/path-hub.tsx", root), "utf8");
  assert.match(hub, /pronouns: "quiz"/);
  assert.match(hub, /pronouns: "drill"/);
  assert.equal(hub.match(/pronouns: "quiz"/g).length, 2);
  const door = readFileSync(new URL("src/components/iibs-door.tsx", root), "utf8");
  assert.equal(door.match(/<IndependentPronounLinks/g).length, 2);
  const pron = GRAMMAR_TRACKS.find((track) => track.id === "pron");
  assert.match(pron.units[0].quiz.map((q) => q.he).join(" "), /אַתְּ/);
  assert.match(pron.units[0].quiz.map((q) => q.he).join(" "), /הֵנָּה/);
});
