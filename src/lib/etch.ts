import { lettersOnly } from "@/lib/hebrew";
import { verseFor, type VerseEx } from "@/lib/verses";
import { tanakhVerseFor, isInflected } from "@/lib/tanakh-pool";
import { closeItems, shuffle, type VocabItem } from "@/lib/vocab";
import { vocabArtSrc } from "@/lib/vocab-art";
import { hydrateCard, isWeak, weaknessScore, type CardState } from "@/lib/srs";
import type { GameSnapshot } from "@/lib/game";
import { shuffleOffFirst } from "@/lib/quiz-draw";
import type { FocusMode } from "@/lib/store";

export const ETCH_LEN = 12;
/** Ways each word is asked in one Drill sitting. Verse is a seventh when the word has a line. */
export const ETCH_PASSES = 6;
export const GUESS_MS = 400;

export type EtchKind = "meet" | "contrast" | "produce" | "verse" | "keep";
export type EtchCue = "he" | "en" | "picture" | "audio" | "consonants" | "spell";

export type EtchTask = {
  key: string;
  kind: EtchKind;
  cue: EtchCue;
  item: VocabItem;
  choices: VocabItem[];
  verse?: VerseEx;
};

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

export function contrastChoices(item: VocabItem, pool: VocabItem[], n = 4): VocabItem[] {
  const close = closeItems(item, pool, n - 1);
  const set = [item, ...close];
  if (set.length < 2) return set;
  return shuffleOffFirst(shuffle(set), (x) => x.id === item.id);
}

function drillOrder(pool: VocabItem[], cards: Record<string, CardState>, focus: FocusMode | undefined, now: number): VocabItem[] {
  const weak = pool
    .filter((item) => isWeak(hydrateCard(cards[item.id], now)))
    .sort((a, b) => weaknessScore(hydrateCard(cards[b.id], now)) - weaknessScore(hydrateCard(cards[a.id], now)));
  if (focus === "weak" && weak.length) return weak;
  const weakIds = new Set(weak.map((item) => item.id));
  const due = shuffle(
    pool.filter((item) => {
      if (weakIds.has(item.id)) return false;
      const card = cards[item.id];
      return !card || hydrateCard(card, now).due <= now;
    }),
  );
  const front = new Set<string>([...weakIds, ...due.map((item) => item.id)]);
  const rest = shuffle(pool.filter((item) => !front.has(item.id)));
  return [...weak, ...due, ...rest];
}

/**
 * Every word in the set, once per method, methods in blocks so the cue keeps changing.
 * Weak cards lead. Verse is added only when the lemma has a line.
 */
export function buildEtchSitting(
  pool: VocabItem[],
  cards: Record<string, CardState>,
  _game?: GameSnapshot,
  now = Date.now(),
  focus?: FocusMode,
): EtchTask[] {
  if (!pool.length) return [];
  const words = drillOrder(pool, cards, focus, now);
  const tasks: EtchTask[] = [];
  let n = 0;

  function add(kind: EtchKind, item: VocabItem, cue: EtchCue, extra?: Partial<EtchTask>) {
    const needChoices = kind === "contrast";
    tasks.push({
      key: `${kind}:${cue}:${item.id}:${n++}`,
      kind,
      cue,
      item,
      choices: extra?.choices ?? (needChoices ? contrastChoices(item, pool) : []),
      verse: extra?.verse,
    });
  }

  const passes: Array<(item: VocabItem) => void> = [
    (item) => add("meet", item, "he"),
    (item) => add("contrast", item, "en", { choices: contrastChoices(item, pool) }),
    (item) => add("produce", item, "he"),
    (item) => add("produce", item, "audio"),
    (item) => add("produce", item, "consonants"),
    (item) => add("produce", item, "spell"),
    (item) => {
      const verse = verseForLemma(item);
      if (verse) add("verse", item, "he", { verse });
    },
  ];

  for (const pass of passes) {
    for (const item of shuffle(words)) pass(item);
  }
  return tasks;
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
    if (cue === "spell") return "English is showing. Type the Hebrew, points included.";
    if (cue === "consonants") return "Consonants only. Type the English gloss.";
    if (cue === "picture") return "Picture only. Type the English gloss.";
    if (cue === "audio") return "Listen. Type the English gloss.";
    return "Type the English gloss. No list.";
  }
  if (kind === "verse") return "Tap the class lemma in the verse. The answer is still the book form.";
  return "An older word. Opposite direction.";
}
