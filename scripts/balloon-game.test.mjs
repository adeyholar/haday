import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const {
  BALLOON_START_LIVES,
  BALLOON_MAX_LIVES,
  LETTER_WAVES,
  VOWEL_WAVES,
  bumpWeak,
  gainLife,
  lookalikesOf,
  pickDecoys,
  pickTarget,
  spawnCall,
  spokenLetterName,
  weakWeight,
} = await jiti.import("/workspace/src/lib/balloon-game.ts");

test("five letter waves and five vowel waves, lives cap, spoken class names", () => {
  assert.equal(LETTER_WAVES.length, 5);
  assert.equal(VOWEL_WAVES.length, 5);
  assert.equal(BALLOON_START_LIVES, 3);
  assert.equal(gainLife(3), 4);
  assert.equal(gainLife(6), BALLOON_MAX_LIVES);
  assert.equal(spokenLetterName(LETTER_WAVES[0].items[0]), "Alef");
  assert.match(spokenLetterName(LETTER_WAVES[4].items.find((l) => l.id === "mem-final")), /final/i);
  assert.ok(VOWEL_WAVES[0].items.some((g) => g.id === "qamets"));
  assert.ok(VOWEL_WAVES[0].items.some((g) => g.id === "pathach"));
  assert.ok(!VOWEL_WAVES[4].items.some((g) => g.id === "qamets-hatuf"));
});

test("spawn includes exactly one target and look-alike decoys on wave 4", () => {
  const wave = LETTER_WAVES[3];
  const sprites = spawnCall({ wave, combo: 0 });
  assert.equal(sprites.filter((b) => b.target).length, 1);
  assert.equal(sprites.length, 1 + wave.decoys);
  const target = sprites.find((b) => b.target);
  const decoys = pickDecoys(wave, target.item, wave.decoys);
  assert.ok(decoys.every((d) => d.id !== target.item.id));
  const twins = lookalikesOf("bet").map((l) => l.id);
  assert.ok(twins.includes("kaf"));
  assert.ok(lookalikesOf("shin").some((l) => l.id === "sin"));
  assert.ok(lookalikesOf("qamets").some((l) => l.id === "pathach"));
});

test("weak marks are more likely to be the target", () => {
  const wave = LETTER_WAVES[0];
  const weak = { bet: 6 };
  assert.ok(weakWeight(weak, "bet") > weakWeight(weak, "alef"));
  let bet = 0;
  for (let i = 0; i < 80; i++) {
    if (pickTarget(wave, undefined, weak).id === "bet") bet += 1;
  }
  assert.ok(bet > 20, `bet was target ${bet}/80 times`);
  const down = bumpWeak(weak, "bet", -1);
  assert.equal(down.bet, 5);
});
