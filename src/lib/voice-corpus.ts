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

function stripCantillation(s: string): string {
  return s.normalize("NFC").replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C3-\u05C7]/g, "").trim();
}

function englishLine(s: string): string {
  const first = s.replace(/;/g, ",").split(",")[0]?.trim() ?? s;
  if (!first) return s.trim();
  if (first === first.toUpperCase()) return first;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** Closed list the synthesizer reads. Letters, vowels, names, BBH lemmas. */
export function voiceCorpus(): VoiceCorpusItem[] {
  const out: VoiceCorpusItem[] = [];
  const seen = new Set<string>();

  function add(item: VoiceCorpusItem) {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    out.push(item);
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
      speakHe: v.mark,
      speakEn: v.name,
      aliases: [],
    });
  }

  for (const item of bbhVocab()) {
    const ch = GAME_CHAPTER_TITLES[item.chapter] ?? `Chapter ${item.chapter}`;
    add({
      id: item.id,
      kind: "vocab",
      group: `Ch. ${item.chapter} · ${ch}`,
      glyph: item.hebrew,
      speakHe: stripCantillation(item.hebrew),
      speakEn: englishLine(item.gloss),
      aliases: [],
    });
  }

  for (let ch = 1; ch <= 19; ch++) {
    const title = GAME_CHAPTER_TITLES[ch] ?? "";
    add({
      id: `announce-${ch}`,
      kind: "vocab",
      group: "Chapter cues",
      glyph: String(ch),
      speakHe: "",
      speakEn: `Chapter ${ch}. ${title}`.trim(),
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
    "# Feed this to a neural voice (Hebrew + English) or read it in the Voice bank.",
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
