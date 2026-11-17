import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { chapterKnown, matchInPool } = await jiti.import(join(root, "src/lib/reading-loop/known.ts"));
const { lemmaForReading, morphKind, strongNo } = await jiti.import(join(root, "src/lib/reading-loop/strong-lemma.ts"));
const { passageDrillKey, isPassageDrillKey, passageDrillIds, savePassagePack, loadPassagePack } = await jiti.import(join(root, "src/lib/reading-loop/passage.ts"));
const { readingSpanHref, readingSpanLabel, readingSpanRef } = await jiti.import(join(root, "src/lib/passage.ts"));
const { lemmaForSurface } = await jiti.import(join(root, "src/lib/tanakh-pool.ts"));
const { noteVerse, peekSession, DAILY_GOAL } = await jiti.import(join(root, "src/lib/reading-loop/session.ts"));
const { gradeRealForm, realFormDeck, REAL_FORMS } = await jiti.import(join(root, "src/lib/reading-loop/real-forms.ts"));
const { morphLines, explainMorph } = await jiti.import(join(root, "src/lib/morph-parse.ts"));
const { hydrateDrillRuns } = await jiti.import(join(root, "src/lib/etch.ts"));
const { passageChoices, passageGlossHit, stepPassage, hydratePassageSittings, openPassageSitting } = await jiti.import(join(root, "src/lib/reading-loop/passage-quiz.ts"));
const { iibsPathItems } = await jiti.import(join(root, "src/lib/iibs-weeks.ts"));
const { glossMatches, VOCAB } = await jiti.import(join(root, "src/lib/vocab.ts"));
const { newCard, applyRating } = await jiti.import(join(root, "src/lib/srs.ts"));

const ab = VOCAB.find((item) => item.id === "ab");
const ben = VOCAB.find((item) => item.id === "ben");
assert.ok(ab && ben);

test("known share counts mastered class lemmas only", () => {
  const now = Date.now();
  let card = newCard(now);
  card = applyRating(card, "good", now);
  card = applyRating(card, "good", now + 1);
  card = applyRating(card, "easy", now + 2);
  card.reps = 4;
  card.interval = 8;
  const words = [
    { id: "w1", surface: "אָב" },
    { id: "w2", surface: "אָבִיךָ" },
    { id: "w3", surface: "בֵּן" },
    { id: "w4", surface: "xyz" },
  ];
  const report = chapterKnown(words, [ab, ben], { ab: card }, now + 3);
  assert.equal(report.found, 2);
  assert.equal(report.known, 1);
  assert.equal(report.pct, 50);
  assert.deepEqual(report.unknown.map((item) => item.id), ["ben"]);
  assert.deepEqual(report.unknownWordIds, ["w3"]);
  assert.equal(matchInPool("אָבִיךָ", [ab, ben])?.id, "ab");
});

test("a known lemma does not replace the lemmas the passage still needs", () => {
  assert.deepEqual(passageDrillIds("held", ["need-a", "need-b"]), ["need-a", "need-b"]);
  assert.deepEqual(passageDrillIds("need-b", ["need-a", "need-b", "need-b"]), ["need-b", "need-a"]);
  assert.deepEqual(passageDrillIds("held", []), ["held"]);
  assert.deepEqual(passageDrillIds("", ["need-a"]), ["need-a"]);
});

test("a passage multiple choice uses look-alike glosses, and a miss comes back once", () => {
  const items = iibsPathItems();
  const item = items.find((row) => row.pos === "verb" && row.gloss.length > 4);
  assert.ok(item);
  const choices = passageChoices(item, items);
  assert.equal(choices.length, 4);
  assert.equal(new Set(choices).size, 4);
  assert.ok(choices.includes(item.gloss));
  const wrong = choices.filter((choice) => choice !== item.gloss);
  for (const choice of wrong) assert.equal(glossMatches(item, choice), false);
  const neighbors = items.filter((row) => row.id !== item.id).slice(0, 3).map((row) => row.gloss).sort();
  assert.notDeepEqual([...wrong].sort(), neighbors);
  assert.equal(passageGlossHit(item, item.gloss), true);
  assert.equal(passageGlossHit(item, wrong[0]), false);
  const once = stepPassage(["a", "b"], false, new Set());
  assert.deepEqual(once.queue, ["b", "a"]);
  const afterHit = stepPassage(once.queue, true, once.retried);
  assert.deepEqual(afterHit.queue, ["a"]);
  const twice = stepPassage(afterHit.queue, false, afterHit.retried);
  assert.deepEqual(twice.queue, []);
});

test("an open passage sitting survives a reload and a sign-out", () => {
  const items = iibsPathItems();
  const one = items[0];
  const two = items[1];
  assert.ok(one && two);
  const raw = {
    "iibs:Gen.1": {
      scope: "iibs",
      ref: "Gen.1",
      label: "Genesis 1",
      back: "/iibs/wlc/Gen/1",
      ask: "choice",
      ids: [one.id, two.id],
      queue: [two.id],
      retried: [one.id],
      first: { [one.id]: false },
      at: 20,
    },
    "iibs:Exod.2": {
      ask: "gloss",
      ids: [one.id],
      queue: [one.id],
      at: 5,
      scope: "iibs",
      ref: "Exod.2",
      label: "Exodus 2",
      back: "",
      retried: [],
      first: {},
    },
    "nope": { ask: "choice", ids: [one.id], queue: [one.id] },
    "iibs:Lev.1": { ask: "choice", ids: ["missing-word"], queue: ["missing-word"], at: 99 },
  };
  const sittings = hydratePassageSittings(raw);
  assert.equal(sittings["nope"], undefined);
  assert.equal(sittings["iibs:Lev.1"], undefined);
  assert.deepEqual(sittings["iibs:Gen.1"].queue, [two.id]);
  assert.equal(sittings["iibs:Gen.1"].first[one.id], false);
  assert.equal(openPassageSitting(sittings)?.ref, "Gen.1");
  assert.equal(openPassageSitting(sittings, "iibs:Exod.2")?.ref, "Exod.2");
  assert.equal(openPassageSitting(sittings, "iibs:Num.1"), null);
});

test("passage pack keeps its own drill key", () => {
  assert.equal(passageDrillKey("iibs", "Gen.1"), "passage:iibs:Gen.1");
  assert.equal(isPassageDrillKey("passage:bbh:1Sam.3"), true);
  assert.equal(isPassageDrillKey("3:due"), false);
  const mem = new Map();
  const store = {
    getItem: (key) => mem.get(key) ?? null,
    setItem: (key, value) => mem.set(key, value),
  };
  savePassagePack({ scope: "bbh", ref: "Gen.1", label: "Genesis 1", ids: ["ab", "ben"], back: "/listen/read/Gen/1" }, store);
  const pack = loadPassagePack(store);
  assert.equal(pack.scope, "bbh");
  assert.deepEqual(pack.ids, ["ab", "ben"]);
  const place = { seed: 1, ids: ["ab"], index: 2, reviews: [], hits: 0, checks: 0, fingerprint: "a" };
  assert.equal(hydrateDrillRuns({ "passage:bbh:Gen.1": place })["passage:bbh:Gen.1"]?.index, 2);
  assert.equal(hydrateDrillRuns({ "passage:nope:Gen.1": place })["passage:nope:Gen.1"], undefined);
});

test("a verse counts once toward the daily goal", () => {
  const mem = new Map();
  const store = {
    getItem: (key) => mem.get(key) ?? null,
    setItem: (key, value) => mem.set(key, value),
  };
  const now = Date.parse("2026-11-01T12:00:00Z");
  const place = { scope: "bbh", book: "Gen", chapter: 1, verse: 1, href: "/listen/read/Gen/1" };
  const first = noteVerse(place, now, store);
  const again = noteVerse(place, now + 1000, store);
  const next = noteVerse({ ...place, verse: 2 }, now + 2000, store);
  assert.equal(first.today, 1);
  assert.equal(again.today, 1);
  assert.equal(next.today, 2);
  assert.equal(next.goal, DAILY_GOAL);
  assert.equal(next.last.verse, 2);
  assert.equal(peekSession(now + 3000, store).today, 2);
  assert.equal(peekSession(now + 86_400_000, store).today, 0);
});

test("real Qal forms grade the attested parse", () => {
  const form = REAL_FORMS.find((row) => row.id === "yishmor");
  assert.equal(gradeRealForm(form, "Qal imperfect 3ms"), true);
  assert.equal(gradeRealForm(form, "Qal perfect 3ms"), false);
  const deck = realFormDeck("perfect", 1);
  assert.ok(deck.length >= 6);
  assert.ok(deck.every((row) => row.aspect === "perfect"));
  assert.equal(realFormDeck("perfect", 1)[0].id, realFormDeck("perfect", 1)[0].id);
});

test("morph lines name stem and person without changing the sentence", () => {
  const code = "HVqp3ms";
  const lines = morphLines(code);
  assert.equal(lines.find((row) => row.label === "Stem")?.value, "Qal");
  assert.equal(lines.find((row) => row.label === "Form")?.value, "perfect");
  assert.equal(lines.find((row) => row.label === "Person")?.value, "3rd");
  assert.match(explainMorph(code), /Qal perfect/);
});

test("grammar unknowns are the class lemmas in these verses", () => {
  const asCard = (word) => lemmaForSurface(word.surface);
  const verse1 = ["בְּרֵאשִׁ֖ית", "בָּרָ֣א", "אֱלֹהִ֑ים", "אֵ֥ת", "הַשָּׁמַ֖יִם", "וְאֵ֥ת", "הָאָֽרֶץ"].map((surface, i) => ({
    id: `Gen 1:1:${i}`,
    surface,
  }));
  const here = chapterKnown(verse1, VOCAB, {}, Date.now(), asCard);
  assert.ok(here.unknown.some((item) => item.id === "rosh"));
  assert.ok(here.unknown.some((item) => item.id === "bara"));
  assert.equal(here.unknown.some((item) => item.id === "hayah"), false);
  assert.equal(chapterKnown(verse1, VOCAB, {}).unknown.some((item) => item.id === "rosh"), false);
  const told = chapterKnown([{ id: "Gen 1:3:4", surface: "וַֽיְהִי" }], VOCAB, {}, Date.now(), asCard);
  assert.deepEqual(told.unknown.map((item) => item.id), ["hayah"]);
  assert.equal(matchInPool("וַֽיְהִי", VOCAB), undefined);
  assert.equal(readingSpanLabel("Gen", 1, 1, 31), "Genesis 1");
  assert.equal(readingSpanRef("Gen", 1, 1, 31), "Gen.1");
  assert.equal(readingSpanHref("Gen", 1, 1, 31), "/listen/read/Gen/1");
  assert.equal(readingSpanLabel("Gen", 1, 1, 3), "Genesis 1:1–3");
  assert.equal(readingSpanRef("Gen", 1, 1, 3), "Gen.1.1.3");
  assert.equal(readingSpanHref("Gen", 1, 1, 3), "/listen/read/Gen/1?v1=1&v2=3");
  assert.equal(isPassageDrillKey(passageDrillKey("bbh", "Gen.1.1.3")), true);
  const mem = new Map();
  const store = {
    getItem: (key) => mem.get(key) ?? null,
    setItem: (key, value) => mem.set(key, value),
  };
  savePassagePack(
    { scope: "bbh", ref: "Gen.1.1.3", label: "Genesis 1:1–3", ids: ["hayah", "rosh"], back: "/listen/read/Gen/1?v1=1&v2=3" },
    store,
  );
  const pack = loadPassagePack(store);
  assert.equal(pack.ref, "Gen.1.1.3");
  assert.equal(pack.label, "Genesis 1:1–3");
  assert.equal(pack.back, "/listen/read/Gen/1?v1=1&v2=3");
  const place = { seed: 1, ids: ["hayah"], index: 1, reviews: [], hits: 0, checks: 0, fingerprint: "a" };
  assert.equal(hydrateDrillRuns({ "passage:bbh:Gen.1.1.3": place })["passage:bbh:Gen.1.1.3"]?.index, 1);
});

test("a passage lemma is the word in the verse, not a look-alike", () => {
  const iibs = iibsPathItems();
  const byStrong = (surface, tag, morph, pool) => lemmaForReading(surface, tag, morph, pool)?.id;
  assert.equal(morphKind("HVhv2ms/Sh"), "verb");
  assert.equal(morphKind("HNcfsc/Sp3mp"), "noun");
  assert.equal(morphKind("HR/Sp3fs"), "prep");
  assert.equal(byStrong("הַגִּידָה", "5046", "HVhv2ms/Sh", VOCAB), "higgid");
  assert.equal(byStrong("הִגִּ֖יד", "5046", "HVhp3ms", VOCAB), "higgid");
  assert.equal(byStrong("אֲמִתַּ֖י", "573", "HNp", VOCAB), undefined);
  assert.notEqual(byStrong("אֲמִתַּ֖י", "573", "HNp", iibs), iibs.find((item) => item.gloss.startsWith("firmness"))?.id);
  assert.equal(byStrong("יוֹנָ֥ה", "3124", "HNp", iibs), undefined);
  assert.equal(byStrong("הָעִ֥יר", "d/5892 b", "HTd/Ncfsa", VOCAB), "ir");
  assert.notEqual(byStrong("הָעִ֥יר", "d/5892 b", "HTd/Ncfsa", iibs), iibs.find((item) => item.hebrew === "הֵעִיר")?.id);
  assert.equal(byStrong("עָלֶ֑יהָ", "5921 a", "HR/Sp3fs", VOCAB), "al");
  assert.equal(byStrong("דְּבַר", "1697", "HNcmsc", VOCAB), "dabar");
  assert.equal(byStrong("בֶן", "1121 a", "HNcmsc", VOCAB), "ben");
  assert.equal(byStrong("וַֽיְהִי֙", "c/1961", "HC/Vqw3ms", VOCAB), "hayah");
  assert.equal(byStrong("ק֠וּם", "6965 b", "HVqv2ms", iibs), iibs.find((item) => item.hebrew === "קָם")?.id);
  const evil = byStrong("רָעָתָ֖ם", "7451 a", "HNcfsc/Sp3mp", VOCAB);
  assert.ok(evil === "ra" || evil === "raah-evil");
  assert.notEqual(lemmaForReading("בְּרֵאשִׁ֖ית", "H7225|HR/Ncfsa", "HR/Ncfsa", VOCAB)?.id, "rosh");
  const jonah = [
    { id: "tell", surface: "הִגִּ֖יד", strong: "5046", morph: "HVhp3ms" },
    { id: "name", surface: "אֲמִתַּ֖י", strong: "573", morph: "HNp" },
    { id: "city", surface: "הָעִ֥יר", strong: "d/5892 b", morph: "HTd/Ncfsa" },
  ];
  const report = chapterKnown(jonah, VOCAB, {}, Date.now(), (word, pool) => lemmaForReading(word.surface, word.strong, word.morph, pool));
  assert.deepEqual(report.unknown.map((item) => item.id).sort(), ["higgid", "ir"]);
  assert.deepEqual(report.unknownWordIds.sort(), ["city", "tell"]);
});

test("a morph code is not a Strong’s number, and the class list keeps the verse’s own word", () => {
  const iibs = iibsPathItems();
  assert.equal(strongNo("HR/Sp1cp"), 0);
  assert.equal(strongNo("HVhp3ms"), 0);
  assert.equal(strongNo("l"), 0);
  assert.equal(strongNo("H5046"), 5046);
  assert.equal(strongNo("c/1961"), 1961);
  assert.equal(strongNo("5921 a"), 5921);
  assert.equal(strongNo("d/5892 b"), 5892);
  assert.equal(strongNo("H5046|HVhp3ms"), 5046);
  assert.equal(lemmaForReading("לָ֖נוּ", "HR/Sp1cp", "HR/Sp1cp", VOCAB)?.id, undefined);
  assert.notEqual(lemmaForReading("לָ֖נוּ", "HR/Sp1cp", "HR/Sp1cp", VOCAB)?.id, "ab");
  const god = iibs.find((item) => item.hebrew === "אֱלֹהִים");
  assert.equal(god?.pos, "noun");
  assert.equal(lemmaForReading("אֱלֹהִ֑ים", "H430", "HNcmpa", iibs)?.id, god?.id);
  const what = iibs.find((item) => item.hebrew === "מָה" && item.gloss.startsWith("what"));
  assert.equal(what?.pos, "particle");
  assert.equal(lemmaForReading("מַה", "H4100", "HTi", iibs)?.id, what?.id);
  const perhaps = iibs.find((item) => item.hebrew === "אוּלַי");
  assert.equal(perhaps?.pos, "particle");
  assert.equal(lemmaForReading("אוּלַ֞י", "H194", "HD", iibs)?.id, perhaps?.id);
  const great = iibs.find((item) => item.hebrew.startsWith("גָּדוֹל"));
  assert.equal(lemmaForReading("הַגְּדוֹלָ֖ה", "H1419", "HTd/Aafsa", iibs)?.id, great?.id);
  const marker = iibs.find((item) => item.gloss.startsWith("direct object marker"));
  const withPrep = iibs.find((item) => item.hebrew === "אֵת" && item.gloss.startsWith("with"));
  const youFem = iibs.find((item) => item.hebrew === "אַתְּ");
  assert.ok(marker && withPrep);
  assert.equal(lemmaForReading("אֵ֥ת", "H853", "HTo", iibs)?.id, marker.id);
  assert.equal(lemmaForReading("וְאֵ֥ת", "H853", "HC/To", iibs)?.id, marker.id);
  assert.notEqual(lemmaForReading("אֵ֥ת", "H853", "HTo", iibs)?.id, withPrep.id);
  assert.notEqual(lemmaForReading("אֵ֥ת", "H853", "HTo", iibs)?.id, youFem?.id);
  assert.equal(lemmaForReading("אִתּוֹ", "H854", "HR/Sp3ms", iibs)?.id, withPrep.id);
  const hebrew = iibs.find((item) => item.hebrew === "עִבְרִי");
  assert.equal(hebrew?.pos, "gentilic");
  assert.equal(morphKind("HNgmsa"), "gentilic");
  assert.equal(lemmaForReading("עִבְרִ֣י", "H5680", "HNgmsa", iibs)?.id, hebrew?.id);
});

test("a gentilic people counts, and Levi the person stays a name", () => {
  const iibs = iibsPathItems();
  const egyptian = iibs.find((item) => item.hebrew === "מִצְרִי");
  const canaanite = iibs.find((item) => item.hebrew === "כְּנַעֲנִי");
  const philistine = iibs.find((item) => item.hebrew === "פְּלִשְׁתִּי");
  const jew = iibs.find((item) => item.hebrew === "יְהוּדִי");
  const levi = iibs.find((item) => item.hebrew === "לֵוִי");
  assert.equal(egyptian?.pos, "gentilic");
  assert.equal(canaanite?.pos, "gentilic");
  assert.equal(philistine?.pos, "gentilic");
  assert.equal(jew?.pos, "gentilic");
  assert.equal(levi?.pos, "name");
  assert.equal(lemmaForReading("מִצְרִ֔י", "H4713", "HNgmsa", iibs)?.id, egyptian?.id);
  assert.equal(lemmaForReading("וְהַכְּנַעֲנִ֖י", "H3669", "HC/Td/Ngmsa", iibs)?.id, canaanite?.id);
  assert.equal(lemmaForReading("פְלִשְׁתִּים", "H6430", "HNgmpa", iibs)?.id, philistine?.id);
  assert.equal(lemmaForReading("יְהוּדִ֔י", "H3064", "HNgmsa", iibs)?.id, jew?.id);
  assert.equal(lemmaForReading("הַלֵּוִי", "H3881", "HTd/Ngmsa", iibs)?.id, levi?.id);
  assert.equal(lemmaForReading("לֵוִ֔י", "H3878", "HNp", iibs)?.id, levi?.id);
  assert.equal(lemmaForReading("אֵ֥ת", "H853", "", iibs), undefined);
  assert.equal(lemmaForReading("אֵ֥ת", "H854", "", iibs), undefined);
  assert.equal(lemmaForReading("אֵת", "H855", "", iibs), undefined);
  assert.equal(lemmaForReading("אֵ֥ת", "H853", "HTo", iibs)?.gloss.startsWith("direct object marker"), true);
});

test("a Benjamite is not man, and the man in the same verse still is", () => {
  const iibs = iibsPathItems();
  const man = iibs.find((item) => item.hebrew === "אִישׁ");
  assert.equal(lemmaForReading("יְמִינִֽי", "H1145", "HNgmsa", iibs), undefined);
  assert.equal(lemmaForReading("אִ֥ישׁ", "H1145", "HNcmsa", iibs), undefined);
  assert.equal(lemmaForReading("יְמִינִֽי", "H1145", "HNgmsa", VOCAB), undefined);
  assert.equal(lemmaForReading("אִ֣ישׁ", "H376", "HNcmsa", iibs)?.id, man?.id);
  assert.equal(lemmaForReading("אִ֣ישׁ", "H376", "HNcmsa", VOCAB)?.id, "ish");
  const marker = lemmaForReading("אֹת֑וֹ", "H853", "HTo/Sp3ms", iibs);
  const withName = lemmaForReading("אֶת", "H854", "HR", iibs);
  assert.equal(marker?.gloss.startsWith("direct object marker"), true);
  assert.equal(withName?.gloss.startsWith("with"), true);
  assert.notEqual(marker?.id, withName?.id);
});
