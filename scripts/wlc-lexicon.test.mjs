import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the Reading Lab lexicon sits under the existing word card rows", () => {
  const desk = readFileSync(new URL("../src/components/wlc-desk.tsx", import.meta.url), "utf8");
  const card = desk.slice(desk.indexOf("function WordCard"), desk.indexOf("export function WlcReading"));
  const dlStart = card.indexOf("<dl");
  const dlEnd = card.indexOf("</dl>");
  const dl = card.slice(dlStart, dlEnd);
  const labels = ["Consonants", "Accent", "Meteg", "Stress", "Pause path", "Lemma", "Morph"];
  let at = 0;
  for (const label of labels) {
    const next = dl.indexOf(label, at);
    assert.ok(next > at, label);
    at = next;
  }
  assert.equal(card.slice(0, dlEnd).includes("Lexicon"), false);
  assert.ok(card.indexOf("<WlcLexicon") > dlEnd);
  assert.match(card, /lemma=\{word\.lemma\}/);
  assert.match(card, /morph=\{word\.morph\}/);

  const lexicon = readFileSync(new URL("../src/components/wlc-lexicon.tsx", import.meta.url), "utf8");
  assert.match(lexicon, /aria-label="Lexicon"/);
  assert.match(lexicon, /Strong's \(1894\)/);
  assert.match(lexicon, /Opening the lexicon…/);
  assert.match(lexicon, /No lexicon entry for/);
  assert.match(lexicon, /No Strong's number on this word/);
  assert.match(lexicon, /data-bdb-slot/);
  assert.match(lexicon, /explainMorph/);
  assert.match(lexicon, /aria-label="Prefixes"/);
  assert.doesNotMatch(lexicon, /https?:\/\//);
  assert.doesNotMatch(lexicon, /<a[\s>]/);
  assert.match(desk, /event\.key !== "Escape"/);
});
