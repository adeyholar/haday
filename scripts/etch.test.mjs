import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { buildEtchSitting, contrastChoices, tokenFitsLemma, verseTapTokens, consonantsOf, ETCH_PASSES } =
  await jiti.import("/workspace/src/lib/etch.ts");
const { VOCAB } = await jiti.import("/workspace/src/lib/vocab.ts");
const { applyRating, newCard } = await jiti.import("/workspace/src/lib/srs.ts");

test("every word is asked in every method", () => {
  const pool = VOCAB.filter((v) => v.chapter === 3);
  const sitting = buildEtchSitting(pool, {}, undefined, Date.now());
  assert.ok(pool.length > 2);
  for (const item of pool) {
    const mine = sitting.filter((t) => t.item.id === item.id);
    assert.ok(mine.length >= ETCH_PASSES, item.id);
    assert.ok(mine.some((t) => t.kind === "meet"));
    assert.ok(mine.some((t) => t.kind === "contrast"));
    assert.ok(mine.some((t) => t.kind === "produce" && t.cue === "spell"));
    assert.ok(mine.some((t) => t.kind === "produce" && t.cue === "audio"));
    assert.ok(mine.some((t) => t.kind === "produce" && t.cue === "consonants"));
  }
  assert.ok(sitting.length > pool.length * ETCH_PASSES - 1);
});

test("contrast board never seats the answer first and includes the lemma", () => {
  const pool = VOCAB.filter((v) => v.chapter <= 5);
  const em = pool.find((v) => v.id === "em");
  assert.ok(em);
  for (let i = 0; i < 20; i++) {
    const set = contrastChoices(em, pool);
    assert.ok(set.some((x) => x.id === "em"));
    if (set.length > 1) assert.notEqual(set[0].id, "em");
  }
});

test("verse tap tokens match the hit", () => {
  const toks = verseTapTokens("בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ");
  assert.ok(toks.length > 4);
  const erets = VOCAB.find((v) => v.id === "erets");
  assert.ok(erets);
  assert.equal(tokenFitsLemma("הָאָרֶץ", erets, "הָאָרֶץ"), true);
  assert.equal(tokenFitsLemma("בָּרָא", erets, "הָאָרֶץ"), false);
});

test("consonants drop niqqud", () => {
  const bayit = VOCAB.find((v) => v.id === "bayit");
  assert.ok(bayit);
  const c = consonantsOf(bayit);
  assert.ok(c.includes("ב"));
  assert.ok(!/[ְ-ֽ]/.test(c));
});

test("a second miss waits a day, not ten minutes", () => {
  const now = Date.now();
  const first = applyRating(newCard(now), "again", now);
  assert.ok(first.due - now < 15 * 60_000);
  const second = applyRating(first, "again", now);
  assert.ok(second.due - now >= 20 * 60 * 60_000);
});
