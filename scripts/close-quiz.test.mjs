import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { quizChoices, VOCAB } = await jiti.import("/workspace/src/lib/vocab.ts");
const { hardenQuizChoices } = await jiti.import("/workspace/src/lib/close-quiz.ts");
const { buildArticleQuiz } = await jiti.import("/workspace/src/lib/article.ts");

test("recognize choices put a close trap next to the lemma", () => {
  const ish = VOCAB.find((v) => v.id === "ish");
  const yam = VOCAB.find((v) => v.id === "yam");
  assert.ok(ish && yam);
  const family = quizChoices(ish, VOCAB);
  assert.equal(family.length, 4);
  assert.ok(family.includes(ish.gloss));
  assert.ok(
    family.some((g) => /woman|wife|man, mankind|father|brother|son|daughter/i.test(g)),
    `ish traps were too far: ${family.join(" | ")}`,
  );
  const sea = quizChoices(yam, VOCAB);
  assert.ok(sea.includes(yam.gloss));
  assert.ok(
    sea.some((g) => /water|heaven|sky/i.test(g)),
    `yam traps were too far: ${sea.join(" | ")}`,
  );
});

test("grammar giveaways are swapped for a near-miss of the same form", () => {
  const hard = hardenQuizChoices({
    q: "הַשַּׁעַר is…",
    he: "הַשַּׁעַר",
    choices: ["The gate — הַ + dagesh in ש", "Heaven", "A verb"],
    answer: "The gate — הַ + dagesh in ש",
  });
  assert.ok(hard.choices.includes("The gate — הַ + dagesh in ש"));
  assert.equal(hard.choices.length, 3);
  assert.ok(!hard.choices.includes("Heaven"));
  assert.ok(!hard.choices.includes("A verb"));
  assert.ok(hard.choices.some((c) => /הָ|הֶ|indefinite|conjunction/i.test(c)));
});

test("article play still has the keyed answer among three choices", () => {
  const round = buildArticleQuiz(2);
  assert.equal(round.length, 12);
  for (const q of round) {
    assert.ok(q.choices.includes(q.answer));
    assert.equal(new Set(q.choices).size, q.choices.length);
    assert.ok(q.choices.length >= 3);
  }
});
