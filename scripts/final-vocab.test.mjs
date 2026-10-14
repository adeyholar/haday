import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { FINAL_VOCAB, startFinalVocab, takeFinalVocab, finalVocabGrade, finalVocabItem } = await jiti.import(
  join(root, "src/lib/final-vocab.ts"),
);
const { areaOf } = await jiti.import(join(root, "src/lib/use-report.ts"));

test("the final vocab list is the professor's 80 words, quizzed like Week 7", () => {
  assert.equal(FINAL_VOCAB.length, 80);
  const hebrew = new Set(FINAL_VOCAB.map((item) => item.hebrew));
  assert.equal(hebrew.size, 80);
  const built = finalVocabItem("f-01");
  assert.equal(built.hebrew, "בָּנָה");
  assert.equal(built.accept[0], "to build");
  const notJussive = FINAL_VOCAB.find((item) => item.hebrew === "אַל");
  const run = startFinalVocab(7);
  assert.equal(run.order.length, 80);
  const choices = run.choices[notJussive.id];
  assert.equal(choices.length, 4);
  assert.ok(choices.includes(notJussive.accept[0]));
  assert.ok(choices.includes("not (used in poetry)"));
  const miss = takeFinalVocab({ ...run, index: run.order.indexOf(notJussive.id) }, "tent");
  assert.equal(miss.ok, false);
  assert.equal(miss.run.order.at(-1), notJussive.id);
  assert.equal(miss.run.first[notJussive.id], false);
  const again = takeFinalVocab(miss.run, notJussive.accept[0]);
  assert.equal(again.run.first[notJussive.id], false);
  const hit = takeFinalVocab(startFinalVocab(3), FINAL_VOCAB.find((item) => item.id === startFinalVocab(3).order[0]).accept[0]);
  assert.equal(hit.ok, true);
  assert.equal(finalVocabGrade(hit.run).held, 1);
  assert.equal(areaOf("/game/final-vocab").id, "final-vocab");
  assert.equal(areaOf("/game/final").id, "final");
});
