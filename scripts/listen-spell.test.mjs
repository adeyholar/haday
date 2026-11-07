import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": new URL("../src", import.meta.url).pathname } });
const { spokenEnglish, primaryGloss, modernLatin, listenPlaylist, chapterRange, nextListenIndex, prevListenIndex } =
  await jiti.import(new URL("../src/lib/listen.ts", import.meta.url).pathname);
const { vocabClip } = await jiti.import(new URL("../src/lib/vocab-clips.ts", import.meta.url).pathname);

test("a replay does not let the last sound cut the new one", () => {
  const src = readFileSync(new URL("../src/lib/listen.ts", import.meta.url).pathname, "utf8");
  const play = readFileSync(new URL("../src/components/etch-play.tsx", import.meta.url).pathname, "utf8");
  assert.match(src, /if \(mine !== clipGen\) return/);
  assert.match(src, /if \(mine === clipGen\)/);
  assert.equal(src.includes("el.duration : 2.4"), false);
  assert.match(play, /stopSpeech\(\);\s*unlockSpeech\(\);\s*void speakHebrewWord/);
});

test("the road player uses the Drill voice for one week", () => {
  const src = readFileSync(new URL("../src/lib/listen.ts", import.meta.url).pathname, "utf8");
  const page = readFileSync(new URL("../src/routes/listen/road.tsx", import.meta.url).pathname, "utf8");
  const deck = readFileSync(new URL("../src/components/road-deck.tsx", import.meta.url).pathname, "utf8");
  assert.match(src, /export async function speakRoadCard/);
  assert.match(src, /speakHebrewWord\(item, 0\.85, signal, \{ preferNeural: true \}\)/);
  assert.match(deck, /speakRoadCard/);
  assert.match(page, /On the road/);
  assert.match(deck, /Hatikvah/);
  assert.match(deck, /playRoadMusic/);
  assert.equal(page.includes("announce"), false);
  assert.equal(deck.includes("announce"), false);
});

test("the road list keeps going when a clip pauses or a lookup hangs", () => {
  const src = readFileSync(new URL("../src/lib/listen.ts", import.meta.url).pathname, "utf8");
  const deck = readFileSync(new URL("../src/components/road-deck.tsx", import.meta.url).pathname, "utf8");
  assert.match(src, /roadPauseIsUser/);
  assert.match(src, /let roadGap = false/);
  assert.match(src, /audioSession/);
  assert.match(src, /resumeTries < 2/);
  assert.match(src, /setTimeout\(\(\) => done\(false\), 2000\)/);
  assert.match(src, /promiseTimeout\(listVoiceIndex\(\), 2500\)/);
  assert.match(deck, /roadPauseIsUser\(\)/);
  assert.match(deck, /setRoadDriveWanted\(false\)/);
  assert.match(deck, /preferRoadPlayback\(\)/);
  assert.match(deck, /keepRoadMusicAlive/);
  assert.match(deck, /a failed word must not end the drive/);
  assert.match(src, /holdRoadMusic/);
  assert.match(src, /el\.currentTime > start \+ 0\.2/);
  assert.match(src, /heVoiceId !== item\.id/);
  const road = src.slice(src.indexOf("export async function speakRoadCard"));
  const neuralEn = road.indexOf('playNeuralVoice(voiceId, "en"');
  const adminEn = road.indexOf('playAdminVoice(voiceId, "en"');
  assert.ok(neuralEn >= 0 && adminEn > neuralEn, "road English tries the neural file before the admin bank");
  const hebrew = src.slice(src.indexOf("export async function speakHebrewWord"), src.indexOf("export async function speakCard"));
  assert.match(hebrew, /if \(opts\?\.preferNeural\)/);
  const admin = hebrew.indexOf("playAdminVoice");
  const neuralAfter = hebrew.indexOf("playNeuralVoice", admin);
  assert.ok(admin >= 0 && neuralAfter > admin, "drill still asks the teacher bank before the neural file");
});

test("the road music slider can go silent and stays under the word", async () => {
  const { musicVolume } = await jiti.import(new URL("../src/lib/road-music.ts", import.meta.url).pathname);
  assert.equal(musicVolume(0), 0);
  assert.ok(musicVolume(20) < musicVolume(50));
  assert.ok(musicVolume(50) < musicVolume(100));
  assert.ok(musicVolume(100) <= 0.35);
  const src = readFileSync(new URL("../src/lib/road-music.ts", import.meta.url).pathname, "utf8");
  assert.match(src, /createGain/);
  assert.match(src, /gain\.value = amount/);
});

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

test("mix loop walks selected chapters then wraps", () => {
  const list = listenPlaylist();
  const ch2 = chapterRange(list, 2);
  const ch4 = chapterRange(list, 4);
  const mix = [2, 4];
  assert.equal(nextListenIndex(list, ch2.end, "mix", mix), ch4.start);
  assert.equal(nextListenIndex(list, ch4.end, "mix", mix), ch2.start);
  assert.equal(prevListenIndex(list, ch2.start, "mix", mix), ch4.end);
  assert.equal(nextListenIndex(list, ch2.start, "mix", mix), ch2.start + 1);
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
  const isaac = vocabClip("isaac");
  assert.ok(isaac);
  assert.equal(letters(isaac.he), "יצחק");
  assert.equal(isaac.ch, 17);
  assert.equal(isaac.v, 19);
  const yam = vocabClip("yam");
  assert.ok(yam);
  assert.equal(letters(yam.he), "ים");
  assert.equal(vocabClip("ha"), undefined);
  assert.equal(vocabClip("we"), undefined);
  assert.equal(vocabClip("be"), undefined);
});
