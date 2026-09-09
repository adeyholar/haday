import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { firstNameOf, petQueue } = await jiti.import("/workspace/src/lib/pet.ts");
const { VOCAB } = await jiti.import("/workspace/src/lib/vocab.ts");

test("first name for greeting", () => {
  assert.equal(firstNameOf("Crown Ha’Day"), "Crown");
  assert.equal(firstNameOf(""), "");
});

test("pet queue prefers recorded weak lemmas", () => {
  const abraham = VOCAB.find((v) => v.id === "abraham");
  const isaac = VOCAB.find((v) => v.id === "isaac");
  const moses = VOCAB.find((v) => v.id === "moses");
  assert.ok(abraham && isaac && moses);
  const cards = {
    isaac: { ease: 1.3, interval: 0, due: 1, reps: 0, lapses: 2, last: 1, hits: 0, misses: 3, reveals: 2, recent: ["m"] },
  };
  const recorded = new Set(["isaac", "moses"]);
  const queue = petQueue([abraham, isaac, moses], cards, recorded, 3);
  assert.equal(queue[0].id, "isaac");
  assert.ok(queue.some((x) => x.id === "moses"));
});
