import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const q = await jiti.import(join(root, "src/lib/qal-imperfect-builder.ts"));

const BOOK = {
  זכר: ["יִזְכֹּר", "תִּזְכֹּר", "תִּזְכֹּר", "תִּזְכְּרִי", "אֶזְכֹּר", "יִזְכְּרוּ", "תִּזְכֹּרְנָה", "תִּזְכְּרוּ", "תִּזְכֹּרְנָה", "נִזְכֹּר"],
  כתב: ["יִכְתֹּב", "תִּכְתֹּב", "תִּכְתֹּב", "תִּכְתְּבִי", "אֶכְתֹּב", "יִכְתְּבוּ", "תִּכְתֹּבְנָה", "תִּכְתְּבוּ", "תִּכְתֹּבְנָה", "נִכְתֹּב"],
  שמר: ["יִשְׁמֹר", "תִּשְׁמֹר", "תִּשְׁמֹר", "תִּשְׁמְרִי", "אֶשְׁמֹר", "יִשְׁמְרוּ", "תִּשְׁמֹרְנָה", "תִּשְׁמְרוּ", "תִּשְׁמֹרְנָה", "נִשְׁמֹר"],
  קבצ: ["יִקְבֹּץ", "תִּקְבֹּץ", "תִּקְבֹּץ", "תִּקְבְּצִי", "אֶקְבֹּץ", "יִקְבְּצוּ", "תִּקְבֹּצְנָה", "תִּקְבְּצוּ", "תִּקְבֹּצְנָה", "נִקְבֹּץ"],
};

test("the four class roots match the paradigm, and every root keeps a Tanakh verse", () => {
  assert.equal(q.ROOTS.length > 4, true);
  const classRoots = q.ROOTS.filter((verb) => verb.tier === 1);
  assert.deepEqual(classRoots.map((verb) => medialKey(verb.c)), ["זכר", "כתב", "שמר", "קבצ"]);
  for (const verb of classRoots) {
    const built = q.FORMS.map((form) => q.buildForm(verb, q.expectedChoice(form)));
    const book = BOOK[medialKey(verb.c)];
    assert.equal(built.length, 10);
    for (let i = 0; i < built.length; i++) {
      const accented = formNeedsAccent(q.FORMS[i]);
      if (accented) {
        assert.ok(built[i].includes("\u05B9"), `${verb.c} ${q.FORMS[i].k} keeps holem`);
        assert.ok(built[i].includes("\u05AB\u05B9"), `${verb.c} ${q.FORMS[i].k} accents the holem`);
      } else assert.equal(built[i].includes("\u05AB"), false);
      assert.equal(stripAccent(built[i]), book[i], `${verb.c} ${q.FORMS[i].k}`);
    }
  }
  for (const verb of q.ROOTS) {
    assert.ok(verb.where.includes(":"), verb.c);
    assert.ok(verb.en.length > 0, verb.c);
    assert.equal(q.verseParts(verb.he, verb.c).some((part) => part.hit), true, `${verb.c} ${verb.where}`);
    q.FORMS.forEach((form) => q.buildForm(verb, q.expectedChoice(form)));
  }
});

function medialKey(word) {
  return [...word].map((ch) => ({ ן: "נ", ך: "כ", ם: "מ", ף: "פ", ץ: "צ" })[ch] || ch).join("");
}

function formNeedsAccent(form) {
  return form.k === "3fp" || form.k === "2fp";
}

function stripAccent(word) {
  return [...word].filter((ch) => ch !== "\u05AB").join("");
}

test("a root is known only after three cleared rounds, and a miss brings it back", () => {
  let stats = q.emptyStats();
  const zakar = q.ROOTS[0];
  stats = q.recordRound(stats, zakar, 8);
  assert.equal(q.passCount(stats, zakar), 0);
  assert.equal(q.nextRoot(stats, zakar, true).c, zakar.c);
  stats = q.recordRound(stats, zakar, 9);
  stats = q.recordRound(stats, zakar, 10);
  assert.equal(q.rootKnown(stats, zakar), false);
  stats = q.recordRound(stats, zakar, 9);
  assert.equal(q.rootKnown(stats, zakar), true);
  const tanakh = q.ROOTS.find((verb) => verb.tier === 2);
  assert.equal(q.passesNeeded(tanakh), 1);
  let wide = q.emptyStats();
  wide = q.recordRound(wide, tanakh, 9);
  assert.equal(q.rootKnown(wide, tanakh), true);
  assert.equal(q.setKnown(stats), false);
  assert.equal(q.knownCount(stats), 1);
});

test("no prefix and no vowel are choices, and a blank menu is still open", () => {
  const verb = q.ROOTS[0];
  const form = q.FORMS[0];
  const chosen = { ...q.expectedChoice(form), pre: "none", v1: "none" };
  const row = q.gradeRow(verb, form, chosen);
  assert.equal(row.ok, false);
  assert.deepEqual(row.misses, ["pre", "v1"]);
  assert.equal(q.buildForm(verb, chosen).startsWith("י"), false);
  assert.equal(q.filled({ pre: "none", v1: "none", v2: "ho", v3: "none", end: "none", tone: "none" }), true);
  assert.equal(q.filled({ pre: "", v1: "sh", v2: "ho", v3: "none", end: "none", tone: "none" }), false);
});
