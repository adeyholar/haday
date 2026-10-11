import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { keepStudyCards } = await jiti.import(join(root, "src/lib/card-ids.ts"));

test("a save keeps a lemma, an aleph-bet card, and a Tanakh form", () => {
  const kept = keepStudyCards({
    abraham: { reps: 4, interval: 3 },
    "alef:letter:alef": { reps: 2, interval: 1 },
    "alef:vowel:qamets": { reps: 2, interval: 1 },
    "ch1-bet": { reps: 1 },
    "tv:abraham:0": { reps: 5, interval: 6 },
    "not-a-card": { reps: 9 },
    "tv:not-a-word:1": { reps: 9 },
    "alef:letter:nope": { reps: 9 },
  });
  const again = keepStudyCards(JSON.parse(JSON.stringify(kept)));
  assert.equal(again.abraham.reps, 4);
  assert.equal(again["alef:letter:alef"].reps, 2);
  assert.equal(again["alef:vowel:qamets"].reps, 2);
  assert.equal(again["ch1-bet"].reps, 1);
  assert.equal(again["tv:abraham:0"].reps, 5);
  assert.equal(again["not-a-card"], undefined);
  assert.equal(again["tv:not-a-word:1"], undefined);
  assert.equal(again["alef:letter:nope"], undefined);
});
