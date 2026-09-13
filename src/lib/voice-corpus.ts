import { CONSONANTS, FINAL_FORMS, VOWELS } from "@/lib/alphabet";
import { bbhVocab, GAME_CHAPTER_TITLES } from "@/lib/vocab";

export type CorpusKind = "letter" | "vowel" | "vocab";

export type VoiceCorpusItem = {
  id: string;
  kind: CorpusKind;
  group: string;
  glyph: string;
  speakHe: string;
  speakEn: string;
  aliases: string[];
};

/** Traditional letter names in Hebrew — what Hila should say, not a lone glyph. */
const LETTER_HE_NAME: Record<string, string> = {
  alef: "אָלֶף",
  bet: "בֵּית",
  gimel: "גִּימֶל",
  dalet: "דָּלֶת",
  he: "הֵא",
  vav: "וָו",
  zayin: "זַיִן",
  het: "חֵית",
  tet: "טֵית",
  yod: "יוֹד",
  kaf: "כַּף",
  lamed: "לָמֶד",
  mem: "מֵם",
  nun: "נוּן",
  samekh: "סָמֶךְ",
  ayin: "עַיִן",
  pe: "פֵּא",
  tsade: "צָדֵי",
  qof: "קוֹף",
  resh: "רֵישׁ",
  shin: "שִׁין",
  sin: "שִׂין",
  tav: "תָּו",
  "kaf-final": "כַּף סוֹפִית",
  "mem-final": "מֵם סוֹפִית",
  "nun-final": "נוּן סוֹפִית",
  "pe-final": "פֵּא סוֹפִית",
  "tsade-final": "צָדֵי סוֹפִית",
};

/** Vowel names in Hebrew — never a pointed bet glyph. */
const VOWEL_HE_NAME: Record<string, string> = {
  qamets: "קָמֶץ",
  tsere: "צֵירֵי",
  holem: "חוֹלֶם",
  pathach: "פַּתָּח",
  seghol: "סֶגּוֹל",
  hireq: "חִירֶק",
  "qamets-hatuf": "קָמֶץ חָטוּף",
  qibbuts: "קִבּוּץ",
  shewa: "שְׁוָא",
  "hateph-pathach": "חֲטֶף פַּתָּח",
  "hateph-seghol": "חֲטֶף סֶגּוֹל",
  "hateph-qamets": "חֲטֶף קָמֶץ",
  "qamets-he": "קָמֶץ הֵא",
  "tsere-he": "צֵירֵי הֵא",
  "seghol-he": "סֶגּוֹל הֵא",
  "holem-he": "חוֹלֶם הֵא",
  "holem-waw": "חוֹלֶם וָו",
  shureq: "שׁוּרֶק",
  "tsere-yod": "צֵירֵי יוֹד",
  "seghol-yod": "סֶגּוֹל יוֹד",
  "hireq-yod": "חִירֶק יוֹד",
};

const HE_CHAPTER: Record<number, string> = {
  1: "אֶחָד",
  2: "שְׁנַיִם",
  3: "שָׁלוֹשׁ",
  4: "אַרְבַּע",
  5: "חָמֵשׁ",
  6: "שֵׁשׁ",
  7: "שֶׁבַע",
  8: "שְׁמוֹנֶה",
  9: "תֵּשַׁע",
  10: "עֶשֶׂר",
  11: "אַחַד עָשָׂר",
  12: "שְׁנֵים עָשָׂר",
  13: "שְׁלוֹשָׁה עָשָׂר",
  14: "אַרְבָּעָה עָשָׂר",
  15: "חֲמִשָּׁה עָשָׂר",
  16: "שִׁשָּׁה עָשָׂר",
  17: "שִׁבְעָה עָשָׂר",
  18: "שְׁמוֹנָה עָשָׂר",
  19: "תִּשְׁעָה עָשָׂר",
};

const EN_CHAPTER = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

export function chapterWordEn(n: number): string {
  return EN_CHAPTER[n] ?? String(n);
}

/** Hebrew TTS: pointed Hebrew only. No Latin, no digits, no cantillation. */
export function hebrewForTts(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C3-\u05C7]/g, "")
    .replace(/[A-Za-z0-9]/g, " ")
    .replace(/[^\u0590-\u05FF\s־]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function englishLine(s: string): string {
  const first = s.replace(/;/g, ",").split(",")[0]?.trim() ?? s;
  if (!first) return s.trim();
  const noDigit = first.replace(/\d+/g, (n) => EN_CHAPTER[Number(n)] ?? n).trim();
  const line = noDigit || first;
  if (line === line.toUpperCase()) return line;
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** Closed list the synthesizer reads. Letters, vowels, names, BBH lemmas. */
export function voiceCorpus(): VoiceCorpusItem[] {
  const out: VoiceCorpusItem[] = [];
  const seen = new Set<string>();

  function add(item: VoiceCorpusItem) {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    out.push({
      ...item,
      speakHe: hebrewForTts(item.speakHe),
    });
  }

  for (const l of [...CONSONANTS, ...FINAL_FORMS]) {
    add({
      id: l.id,
      kind: "letter",
      group: "Alphabet",
      glyph: l.letter,
      speakHe: LETTER_HE_NAME[l.id] ?? l.letter,
      speakEn: l.id.endsWith("-final") ? `Final ${l.name.replace(/^Final /i, "")}` : l.name,
      aliases: [`ch1-${l.id}`],
    });
  }

  for (const v of VOWELS) {
    add({
      id: v.id,
      kind: "vowel",
      group: "Vowels",
      glyph: v.mark,
      speakHe: VOWEL_HE_NAME[v.id] ?? v.name,
      speakEn: v.name,
      aliases: [],
    });
  }

  for (const item of bbhVocab()) {
    const ch = GAME_CHAPTER_TITLES[item.chapter] ?? `Chapter ${EN_CHAPTER[item.chapter] ?? item.chapter}`;
    add({
      id: item.id,
      kind: "vocab",
      group: `Ch. ${item.chapter} · ${ch}`,
      glyph: item.hebrew,
      speakHe: item.hebrew,
      speakEn: englishLine(item.gloss),
      aliases: [],
    });
  }

  for (let ch = 1; ch <= 19; ch++) {
    const title = GAME_CHAPTER_TITLES[ch] ?? "";
    const enNum = EN_CHAPTER[ch] ?? String(ch);
    add({
      id: `announce-${ch}`,
      kind: "vocab",
      group: "Chapter cues",
      glyph: String(ch),
      speakHe: hebrewForTts(`פֶּרֶק ${HE_CHAPTER[ch] ?? ""}`),
      speakEn: `Chapter ${enNum}. ${title}`.trim(),
      aliases: [],
    });
  }

  return out;
}

export function corpusIds(): Set<string> {
  const ids = new Set<string>();
  for (const item of voiceCorpus()) {
    ids.add(item.id);
    for (const a of item.aliases) ids.add(a);
  }
  return ids;
}

/** Plain text feed for a synthesizer or a recording session. */
export function corpusScript(items = voiceCorpus()): string {
  const lines = [
    "# HaDay voice corpus",
    "# id <tab> part <tab> text",
    "# Hebrew part is Hebrew-only. English part is English-only. Never mix in one prompt.",
    "",
  ];
  for (const item of items) {
    lines.push(`${item.id}\the\t${item.speakHe}`);
    lines.push(`${item.id}\ten\t${item.speakEn}`);
  }
  return lines.join("\n") + "\n";
}

export function resolveCorpusId(id: string, items = voiceCorpus()): string {
  if (items.some((x) => x.id === id)) return id;
  const hit = items.find((x) => x.aliases.includes(id));
  return hit?.id ?? id;
}

export function clipLookupIds(id: string): string[] {
  const items = voiceCorpus();
  const key = resolveCorpusId(id);
  const item = items.find((x) => x.id === key);
  return [...new Set([id, key, ...(item?.aliases ?? [])])];
}
