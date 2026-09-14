import { lettersOnly } from "@/lib/hebrew";
import { verseFor, type VerseEx } from "@/lib/verses";
import { tanakhVerseFor, isInflected } from "@/lib/tanakh-pool";
import { closeItems, shuffle, type VocabItem } from "@/lib/vocab";
import { vocabArtSrc } from "@/lib/vocab-art";
import { hasMet, pickKeepRound } from "@/lib/keep";
import { hydrateCard, type CardState } from "@/lib/srs";
import type { GameSnapshot } from "@/lib/game";
import { shuffleOffFirst } from "@/lib/quiz-draw";

export const ETCH_LEN = 12;
export const GUESS_MS = 400;

export type EtchKind = "meet" | "contrast" | "produce" | "verse" | "keep";
export type EtchCue = "he" | "en" | "picture" | "audio" | "consonants";

export type EtchTask = {
  key: string;
  kind: EtchKind;
  cue: EtchCue;
  item: VocabItem;
  choices: VocabItem[];
  verse?: VerseEx;
};

const CUES: EtchCue[] = ["he", "en", "consonants", "picture", "audio"];

export function consonantsOf(item: VocabItem): string {
  return lettersOnly(item.hebrew);
}

export function verseForLemma(item: VocabItem): VerseEx | undefined {
  return verseFor(item.id) ?? tanakhVerseFor(item.id);
}

export function verseTapTokens(he: string): string[] {
  const out: string[] = [];
  for (const chunk of he.split(/\s+/)) {
    if (!chunk) continue;
    const bits = chunk.split(/[־–—]/).filter(Boolean);
    if (bits.length > 1) out.push(...bits);
    else out.push(chunk);
  }
  return out;
}

export function tokenFitsLemma(token: string, item: VocabItem, hit?: string): boolean {
  const t = lettersOnly(token);
  if (!t) return false;
  if (hit && lettersOnly(hit) === t) return true;
  if (lettersOnly(item.hebrew) === t) return true;
  if (isInflected(token, item.hebrew)) return true;
  return false;
}

export function canPicture(item: VocabItem): boolean {
  return Boolean(vocabArtSrc(item.id));
}

function pickCue(item: VocabItem, prefer: EtchCue, used: EtchCue[]): EtchCue {
  const tryList = [prefer, ...CUES.filter((c) => c !== prefer)];
  for (const cue of tryList) {
    if (cue === "picture" && !canPicture(item)) continue;
    if (used.filter((c) => c === cue).length >= 3 && tryList.length > 1) continue;
    return cue;
  }
  return "he";
}

export function contrastChoices(item: VocabItem, pool: VocabItem[], n = 4): VocabItem[] {
  const close = closeItems(item, pool, n - 1);
  const set = [item, ...close];
  if (set.length < 2) return set;
  return shuffleOffFirst(shuffle(set), (x) => x.id === item.id);
}

function takeUnique(from: VocabItem[], n: number, used: Set<string>): VocabItem[] {
  const out: VocabItem[] = [];
  for (const item of from) {
    if (used.has(item.id)) continue;
    out.push(item);
    used.add(item.id);
    if (out.length >= n) break;
  }
  return out;
}

/** One sitting: 2 meet, 3 contrast, 4 produce, 2 verse, 1 keep. */
export function buildEtchSitting(
  pool: VocabItem[],
  cards: Record<string, CardState>,
  game?: GameSnapshot,
  now = Date.now(),
): EtchTask[] {
  if (!pool.length) return [];
  const used = new Set<string>();
  const unseen = shuffle(pool.filter((item) => !hasMet(cards[item.id])));
  const seen = pool.filter((item) => hasMet(cards[item.id]));
  const weak = shuffle(
    seen.filter((item) => {
      const c = hydrateCard(cards[item.id], now);
      return c.misses > 0 || c.reveals > 0 || c.lapses > 0;
    }),
  );
  const rest = shuffle(pool);

  const meetItems = takeUnique(unseen.length ? unseen : weak.length ? weak : rest, 2, used);
  if (meetItems.length < 2) {
    for (const item of rest) {
      if (meetItems.length >= 2) break;
      if (meetItems.some((x) => x.id === item.id)) continue;
      meetItems.push(item);
    }
  }

  const contrastPool = shuffle(
    pool.filter((item) => closeItems(item, pool, 3).length >= 2),
  );
  const contrastItems = takeUnique(
    [...contrastPool.filter((x) => meetItems.some((m) => m.id === x.id)), ...contrastPool, ...rest],
    3,
    new Set(),
  );

  const produceSeed = [...meetItems, ...weak, ...rest];
  const produceItems: VocabItem[] = [];
  const produceUsed = new Set<string>();
  for (const item of produceSeed) {
    if (produceUsed.has(item.id)) continue;
    produceItems.push(item);
    produceUsed.add(item.id);
    if (produceItems.length >= 4) break;
  }

  const versePool = shuffle(pool.filter((item) => verseForLemma(item)));
  const verseItems = takeUnique(versePool.length ? versePool : rest, 2, new Set());

  const keepPick = pickKeepRound(cards, game, 8, now);
  const keepItem =
    keepPick.find((x) => !meetItems.some((m) => m.id === x.id)) ??
    keepPick[0] ??
    seen[0] ??
    rest[0];

  const cuesUsed: EtchCue[] = [];
  const tasks: EtchTask[] = [];
  let i = 0;

  function add(kind: EtchKind, item: VocabItem, prefer: EtchCue, extra?: Partial<EtchTask>) {
    const cue = pickCue(item, prefer, cuesUsed);
    cuesUsed.push(cue);
    const needChoices = kind === "contrast" || ((kind === "produce" || kind === "keep") && cue === "en");
    tasks.push({
      key: `${kind}:${item.id}:${i++}`,
      kind,
      cue,
      item,
      choices: extra?.choices ?? (needChoices ? contrastChoices(item, pool) : []),
      verse: extra?.verse,
    });
  }

  for (const item of meetItems.slice(0, 2)) add("meet", item, canPicture(item) ? "picture" : "he");
  for (const item of contrastItems.slice(0, 3)) {
    add("contrast", item, "en", { choices: contrastChoices(item, pool) });
  }
  const produceCues: EtchCue[] = ["he", "en", "consonants", "audio"];
  produceItems.slice(0, 4).forEach((item, n) => add("produce", item, produceCues[n] ?? "he"));
  for (const item of verseItems.slice(0, 2)) {
    add("verse", item, "he", { verse: verseForLemma(item) });
  }
  if (keepItem) add("keep", keepItem, "en");

  return tasks.slice(0, ETCH_LEN);
}

export function etchLabel(kind: EtchKind): string {
  if (kind === "meet") return "Meet";
  if (kind === "contrast") return "Which one";
  if (kind === "produce") return "Say it";
  if (kind === "verse") return "In the line";
  return "Keep";
}

export function etchHint(kind: EtchKind, cue: EtchCue): string {
  if (kind === "meet") return "Look, hear, then continue. No quiz yet.";
  if (kind === "contrast") return "Pick the lemma that matches the gloss. Twins sit together on purpose.";
  if (kind === "produce") {
    if (cue === "en") return "Type the Hebrew in your mind — tap the matching lemma.";
    if (cue === "consonants") return "Consonants only. Type the English gloss.";
    if (cue === "picture") return "Picture only. Type the English gloss.";
    if (cue === "audio") return "Listen. Type the English gloss.";
    return "Type the English gloss. No multiple choice.";
  }
  if (kind === "verse") return "Tap the class lemma in the verse. The answer is still the book form.";
  return "An older word. Opposite direction.";
}
