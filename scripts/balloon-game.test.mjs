import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const {
  BALLOON_START_LIVES,
  BALLOON_MAX_LIVES,
  BALLOON_WAVES,
  gainLife,
  lookalikesOf,
  pickDecoys,
  spawnCall,
  spokenLetterName,
} = await jiti.import("/workspace/src/lib/balloon-game.ts");

test("five waves, lives cap, spoken class names", () => {
  assert.equal(BALLOON_WAVES.length, 5);
  assert.equal(BALLOON_START_LIVES, 3);
  assert.equal(gainLife(3), 4);
  assert.equal(gainLife(6), BALLOON_MAX_LIVES);
  assert.equal(spokenLetterName(BALLOON_WAVES[0].letters[0]), "Alef");
  assert.match(spokenLetterName(BALLOON_WAVES[4].letters.find((l) => l.id === "mem-final")), /final/i);
});

test("spawn includes exactly one target and look-alike decoys on wave 4", () => {
  const wave = BALLOON_WAVES[3];
  const sprites = spawnCall(wave, 0);
  assert.equal(sprites.filter((b) => b.target).length, 1);
  assert.equal(sprites.length, 1 + wave.decoys);
  const target = sprites.find((b) => b.target);
  const decoys = pickDecoys(wave, target.letter, wave.decoys);
  assert.ok(decoys.every((d) => d.id !== target.letter.id));
  const twins = lookalikesOf("bet").map((l) => l.id);
  assert.ok(twins.includes("kaf"));
  assert.ok(lookalikesOf("shin").some((l) => l.id === "sin"));
});
