import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { spokenEnglish, primaryGloss, modernLatin, listenPlaylist, chapterRange, nextListenIndex, prevListenIndex } =
  await jiti.import("/workspace/src/lib/listen.ts");
const { vocabClip } = await jiti.import("/workspace/src/lib/vocab-clips.ts");

test("Hebrew name then English translation", () => {
  assert.equal(spokenEnglish("Abraham"), "Abraham");
  assert.equal(modernLatin("ʾabrāhām").toLowerCase().includes("braham"), true);
});

test("English line is the full gloss, not letter spelling", () => {
  assert.equal(spokenEnglish("heaven, sky"), "Heaven, sky");
  assert.equal(primaryGloss("heaven, sky"), "heaven");
  assert.equal(spokenEnglish("YHWH"), "YHWH");
});

test("chapter loop stays inside the chapter and wraps", () => {
  const list = listenPlaylist();
  const ch = 5;
  const { start, end } = chapterRange(list, ch);
  assert.ok(end > start, "chapter 5 has more than one lemma");
  assert.equal(list[start].chapter, ch);
  assert.equal(list[end].chapter, ch);
  assert.equal(nextListenIndex(list, end, "chapter"), start);
  assert.equal(prevListenIndex(list, start, "chapter"), end);
  assert.equal(nextListenIndex(list, start, "chapter"), start + 1);
  assert.equal(nextListenIndex(list, end, "off"), end + 1);
  assert.equal(nextListenIndex(list, list.length - 1, "off"), null);
  assert.equal(nextListenIndex(list, list.length - 1, "all"), 0);
});

test("Eliran clips are citation consonants, not prefixes", () => {
  const letters = (s) => [...s].filter((ch) => ch >= "א" && ch <= "ת").join("");
  const abraham = vocabClip("abraham");
  assert.ok(abraham);
  assert.equal(abraham.source, "eliran");
  assert.equal(letters(abraham.he), "אברהם");
  assert.equal(abraham.ch, 17);
  const elohim = vocabClip("elohim");
  assert.ok(elohim);
  assert.equal(letters(elohim.he), "אלהים");
  const yam = vocabClip("yam");
  assert.ok(yam);
  assert.equal(letters(yam.he), "ים");
  assert.equal(vocabClip("ha"), undefined);
  assert.equal(vocabClip("we"), undefined);
  assert.equal(vocabClip("be"), undefined);
});
