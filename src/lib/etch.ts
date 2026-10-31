import { lettersOnly } from "@/lib/hebrew";
import { verseFor, type VerseEx } from "@/lib/verses";
import { tanakhVerseFor, isInflected } from "@/lib/tanakh-pool";
import { closeItems, glossMatches, sharesSense, shuffle, type VocabItem } from "@/lib/vocab";
import { vocabArtSrc } from "@/lib/vocab-art";
import { hydrateCard, isWeak, weaknessScore, type CardState } from "@/lib/srs";
import type { GameSnapshot } from "@/lib/game";
import { shuffleOffFirst } from "@/lib/quiz-draw";
import type { FocusMode } from "@/lib/store";

export const ETCH_LEN = 12;
/** Ways each word is asked before the verse, which is added only when the word has a line. */
export const ETCH_PASSES = 9;
export const DRILL_GROUP = 5;
export const GUESS_MS = 400;

/** True when this tap is still the finger that left the previous card. */
export function tapCarriesOver(shownAt: number, now: number): boolean {
  return now - shownAt < GUESS_MS;
}

export type EtchKind = "study" | "meet" | "contrast" | "produce" | "verse" | "say" | "keep";
export type EtchCue = "he" | "en" | "picture" | "audio" | "consonants" | "spell";

export type EtchTask = {
  key: string;
  baseKey: string;
  kind: EtchKind;
  cue: EtchCue;
  item: VocabItem;
  choices: VocabItem[];
  verse?: VerseEx;
  group: number;
  /** How many times this card has already been sent back. */
  back: number;
};

export type DrillReview = { key: string; at: number; n: number };

export type DrillPlace = {
  seed: number;
  ids: string[];
  index: number;
  reviews: DrillReview[];
  hits: number;
  checks: number;
  fingerprint: string;
};

export type DrillRuns = Record<string, DrillPlace>;

/** Consonants for the no-vowel card. Shin and sin dots stay. Vowel points do not. */
export function consonantsOf(item: VocabItem): string {
  return item.hebrew
    .normalize("NFC")
    .replace(/[\u0591-\u05C0\u05C3-\u05C7]/g, "")
    .replace(/[^\u05D0-\u05EA\u05C1\u05C2]/g, "");
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

function randOf(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drillSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff) || 1;
}

export function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const left = a[i];
    const right = a[j];
    if (left === undefined || right === undefined) continue;
    a[i] = right;
    a[j] = left;
  }
  return a;
}

function seededOffFirst(items: VocabItem[], answerId: string, rand: () => number): VocabItem[] {
  const a = seededShuffle(items, rand);
  if (a.length < 2 || a[0]?.id !== answerId) return a;
  const j = 1 + Math.floor(rand() * (a.length - 1));
  const first = a[0];
  const swap = a[j];
  if (first && swap) {
    a[0] = swap;
    a[j] = first;
  }
  return a;
}

export function drillFingerprint(ids: string[]): string {
  let h = 2166136261;
  for (const id of ids) {
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 124;
  }
  return (h >>> 0).toString(36);
}

export function drillKey(week: number, focus: string | undefined): string {
  const weekN = Math.round(Number(week));
  const face = focus === "weak" ? "weak" : "due";
  return `${weekN}:${face}`;
}

function drillOrder(
  pool: VocabItem[],
  cards: Record<string, CardState>,
  focus: FocusMode | undefined,
  now: number,
  rand: () => number,
): VocabItem[] {
  const score = new Map(pool.map((item) => [item.id, weaknessScore(hydrateCard(cards[item.id], now))]));
  const weak = pool
    .filter((item) => isWeak(hydrateCard(cards[item.id], now)))
    .sort((a, b) => {
      const gap = (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0);
      if (gap !== 0) return gap;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
  // Weakest first, and not shuffled. A new round and every later group keep that rank.
  if (focus === "weak" && weak.length) return weak;
  const weakIds = new Set(weak.map((item) => item.id));
  const due = pool.filter((item) => {
    if (weakIds.has(item.id)) return false;
    const card = cards[item.id];
    return !card || hydrateCard(card, now).due <= now;
  });
  const front = new Set<string>([...weakIds, ...due.map((item) => item.id)]);
  const rest = pool.filter((item) => !front.has(item.id));
  return [...weak, ...seededShuffle(due, rand), ...seededShuffle(rest, rand)];
}

const CHECKS: Array<{ kind: EtchKind; cue: EtchCue }> = [
  { kind: "contrast", cue: "he" },
  { kind: "contrast", cue: "en" },
  { kind: "contrast", cue: "audio" },
  { kind: "produce", cue: "audio" },
  { kind: "produce", cue: "he" },
  { kind: "produce", cue: "consonants" },
  { kind: "produce", cue: "spell" },
  { kind: "say", cue: "en" },
];

function sitWords(words: VocabItem[], _pool: VocabItem[], rand: () => number): EtchTask[] {
  const tasks: EtchTask[] = [];
  let n = 0;
  function add(kind: EtchKind, item: VocabItem, cue: EtchCue, group: number, extra?: Partial<EtchTask>) {
    const baseKey = `${kind}:${cue}:${item.id}:${n}`;
    tasks.push({
      key: baseKey,
      baseKey,
      kind,
      cue,
      item,
      group,
      back: 0,
      choices: extra?.choices ?? [],
      verse: extra?.verse,
    });
    n += 1;
  }

  for (let g = 0; g < words.length; g += DRILL_GROUP) {
    const groupWords = words.slice(g, g + DRILL_GROUP);
    const group = Math.floor(g / DRILL_GROUP);
    const later: Array<{ item: VocabItem; kind: EtchKind; cue: EtchCue; verse?: VerseEx }> = [];
    groupWords.forEach((item) => {
      add("study", item, "he", group);
      const first = CHECKS[0];
      if (first) add(first.kind, item, first.cue, group);
      for (const way of CHECKS.slice(1)) later.push({ item, kind: way.kind, cue: way.cue });
      const verse = verseForLemma(item);
      if (verse) later.push({ item, kind: "verse", cue: "he", verse });
    });
    for (const way of seededShuffle(later, rand)) {
      add(way.kind, way.item, way.cue, group, way.verse ? { verse: way.verse } : undefined);
    }
  }
  return tasks;
}

/**
 * Groups of five. Weak words lead, weakest first, on a new round and on every later group.
 * The first card of a group is a study card. The second is a question.
 * The same seed and the same word order always deal the same cards.
 */
export function buildEtchSitting(
  pool: VocabItem[],
  cards: Record<string, CardState>,
  _game?: GameSnapshot,
  now = Date.now(),
  focus?: FocusMode,
  seed = drillSeed(),
): EtchTask[] {
  if (!pool.length) return [];
  return sitWords(drillOrder(pool, cards, focus, now, randOf(seed)), pool, randOf((seed ^ 0x9e3779b9) >>> 0 || 1));
}

export function buildEtchFromIds(pool: VocabItem[], ids: string[], seed: number): EtchTask[] {
  const byId = new Map(pool.map((item) => [item.id, item]));
  const words = ids.map((id) => byId.get(id)).filter((item): item is VocabItem => Boolean(item));
  return sitWords(words, pool, randOf((seed ^ 0x9e3779b9) >>> 0 || 1));
}

const choiceCache = new Map<string, VocabItem[]>();

function choiceKey(itemId: string, pool: VocabItem[], mode: string): string {
  return `${mode}:${itemId}:${pool.length}:${pool[0]?.id ?? ""}:${pool[pool.length - 1]?.id ?? ""}`;
}

/** Wrong buttons for “pick the English.” Skip a lemma that lists a sense of the answer. */
function englishMates(item: VocabItem, pool: VocabItem[], n: number): VocabItem[] {
  const ranked = closeItems(item, pool, Math.max(n * 6, 12)).filter((other) => !sharesSense(item, other));
  if (ranked.length >= n) return ranked.slice(0, n);
  const seen = new Set([item.id, ...ranked.map((other) => other.id)]);
  const rest = pool
    .filter((other) => !seen.has(other.id) && !sharesSense(item, other))
    .sort((a, b) => {
      const near = (v: VocabItem) => (v.chapter === item.chapter ? 0 : Math.abs(v.chapter - item.chapter) + (v.pos === item.pos ? 0 : 2));
      return near(a) - near(b);
    });
  return [...ranked, ...rest].slice(0, n);
}

/** Look-alikes for the card on screen. The same seed and word deal the same set. */
export function drillCardChoices(task: EtchTask, pool: VocabItem[], seed: number): VocabItem[] {
  const need = task.kind === "contrast" || task.kind === "study" || task.kind === "verse";
  if (!need) return [];
  if (task.choices.length > 1) return task.choices;
  const english = task.kind === "contrast" && task.cue === "he";
  const mode = english ? "en" : "close";
  const key = choiceKey(task.item.id, pool, mode);
  const cached = choiceCache.get(key);
  const mates = cached ?? (english ? englishMates(task.item, pool, 3) : closeItems(task.item, pool, 3));
  if (!cached) choiceCache.set(key, mates);
  const mixed = (seed ^ choiceMix(task.baseKey)) >>> 0 || 1;
  return seededOffFirst([task.item, ...mates], task.item.id, randOf(mixed));
}

function choiceMix(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h;
}

export function applyDrillReviews(base: EtchTask[], reviews: DrillReview[]): EtchTask[] {
  const out = base.map((task) => ({ ...task, choices: task.choices.slice() }));
  for (const review of reviews) {
    if (review.n < 1 || review.n > 2) continue;
    const source = base.find((task) => task.baseKey === review.key);
    if (!source) continue;
    const at = Math.max(0, Math.min(out.length, Math.round(review.at)));
    out.splice(at, 0, {
      ...source,
      choices: source.choices.slice(),
      key: `${source.baseKey}:back${review.n}`,
      back: review.n,
    });
  }
  return out;
}

/** A miss comes back a few cards later, then once more at the end of its group. */
export function queueDrillMiss(
  tasks: EtchTask[],
  index: number,
  task: EtchTask,
): { tasks: EtchTask[]; review: DrillReview | null } {
  const n = task.back + 1;
  if (n > 2) return { tasks, review: null };
  let end = tasks.length;
  for (let k = index + 1; k < tasks.length; k++) {
    if (tasks[k]?.group !== task.group) {
      end = k;
      break;
    }
  }
  const at = n === 1 ? Math.min(end, index + 1 + 3) : end;
  const again: EtchTask = { ...task, choices: task.choices.slice(), key: `${task.baseKey}:back${n}`, back: n };
  return {
    tasks: [...tasks.slice(0, at), again, ...tasks.slice(at)],
    review: { key: task.baseKey, at, n },
  };
}

/**
 * Continue only after at least one answer, and only while that card still exists.
 * A different word list, a finished sitting, or no place starts fresh.
 */
export function drillGate(
  place: DrillPlace | undefined,
  fingerprint: string,
  rebuiltLength: number,
): "changed" | "resume" | "fresh" {
  if (!place || !place.ids.length) return "fresh";
  if (place.fingerprint !== fingerprint) return "changed";
  if (place.index > 0 && place.index < rebuiltLength) return "resume";
  return "fresh";
}

export function drillProgress(tasks: EtchTask[], index: number): string {
  if (!tasks.length) return "card 0 of 0";
  const shown = Math.min(Math.max(index, 0), tasks.length - 1);
  const task = tasks[shown];
  const groups = new Set(tasks.map((item) => item.group)).size;
  const card = Math.min(index + 1, tasks.length);
  return `Group ${(task?.group ?? 0) + 1} of ${groups} · card ${card} of ${tasks.length}`;
}

/** Cards finished in this sitting, and how many remain. */
export function drillDistance(index: number, total: number): { done: number; total: number; left: number; pct: number } {
  const cards = Math.max(0, Math.round(total) || 0);
  const done = Math.min(cards, Math.max(0, Math.round(index) || 0));
  const left = cards - done;
  return { done, total: cards, left, pct: cards ? Math.round((done / cards) * 100) : 0 };
}

/** The week's list: words met, words mastered, and how many are still unmastered. */
export function vocabDistance(
  met: number,
  mastered: number,
  total: number,
): { met: number; mastered: number; total: number; left: number; pct: number } {
  const words = Math.max(0, Math.round(total) || 0);
  const seen = Math.min(words, Math.max(0, Math.round(met) || 0));
  const held = Math.min(words, Math.max(0, Math.round(mastered) || 0));
  return {
    met: seen,
    mastered: held,
    total: words,
    left: words - held,
    pct: words ? Math.round((held / words) * 100) : 0,
  };
}

export function hydrateDrillRuns(raw: unknown): DrillRuns {
  return takeDrillRuns(raw, (key) => /^\d+:(due|weak)$/.test(key));
}

/** Scripture Path sittings. The key is the level, the week, and the focus. */
export function hydrateIibsDrillRuns(raw: unknown): DrillRuns {
  return takeDrillRuns(raw, (key) => /^[A-E]:(?:[1-9]|[12]\d|30):(due|weak)$/.test(key));
}

function takeDrillRuns(raw: unknown, accept: (key: string) => boolean): DrillRuns {
  const out: DrillRuns = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!accept(key)) continue;
    if (!val || typeof val !== "object") continue;
    const row = val as Partial<DrillPlace>;
    const ids = Array.isArray(row.ids) ? row.ids.filter((id) => typeof id === "string").slice(0, 800) : [];
    if (!ids.length) continue;
    const reviews = Array.isArray(row.reviews)
      ? row.reviews
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const rec = item as Partial<DrillReview>;
            const n = Math.round(Number(rec.n));
            if (typeof rec.key !== "string" || (n !== 1 && n !== 2)) return null;
            return { key: rec.key.slice(0, 80), at: Math.max(0, Math.round(Number(rec.at) || 0)), n };
          })
          .filter((item): item is DrillReview => Boolean(item))
          .slice(0, 400)
      : [];
    out[key] = {
      seed: Math.round(Number(row.seed) || 1),
      ids,
      index: Math.max(0, Math.round(Number(row.index) || 0)),
      reviews,
      hits: Math.max(0, Math.round(Number(row.hits) || 0)),
      checks: Math.max(0, Math.round(Number(row.checks) || 0)),
      fingerprint: typeof row.fingerprint === "string" ? row.fingerprint.slice(0, 40) : "",
    };
  }
  return out;
}

/** Short English for a choice button. A sense that another button also owns is written in full. */
export function choiceLabel(item: VocabItem, board: VocabItem[]): string {
  const head = (gloss: string) => gloss.split(/[,;]/)[0]?.trim() || gloss.trim();
  const first = head(item.gloss);
  const shared = board.some((other) => {
    if (other.id === item.id) return false;
    return head(other.gloss) === first || glossMatches(other, first);
  });
  return shared ? item.gloss : first;
}

export function etchLabel(kind: EtchKind): string {
  if (kind === "study" || kind === "meet") return "Study";
  if (kind === "contrast") return "Which one";
  if (kind === "produce") return "Say it";
  if (kind === "say") return "Say it aloud";
  if (kind === "verse") return "Fill the line";
  return "Keep";
}

export function answerIsHebrew(task: { kind: EtchKind; cue: EtchCue }): boolean {
  return (
    (task.kind === "produce" && (task.cue === "spell" || task.cue === "en")) ||
    (task.kind === "contrast" && task.cue !== "he") ||
    (task.kind === "keep" && task.cue === "en") ||
    task.kind === "verse"
  );
}

export const SHOW_ME_NOTE = "Show me walks the next letter. It does not print the word.";

export function etchHint(kind: EtchKind, cue: EtchCue, showMe = false): string {
  let line = "An older word. Opposite direction.";
  if (kind === "study" || kind === "meet") line = "Type a guess and check it, or show the meaning and say if you knew it.";
  else if (kind === "contrast" && cue === "he") line = "The Hebrew is showing. Pick the English.";
  else if (kind === "contrast" && cue === "audio") line = "Listen, then pick the Hebrew.";
  else if (kind === "contrast") line = "Pick the Hebrew that matches the English.";
  else if (kind === "say") line = "The English is showing. Say the Hebrew. You can skip this if the phone cannot listen.";
  else if (kind === "produce" && cue === "spell") line = "English is showing. Type the Hebrew, points included.";
  else if (kind === "produce" && cue === "consonants") line = "Consonants only, no vowel points. The shin or sin dot stays. Type the English.";
  else if (kind === "produce" && cue === "picture") line = "Picture only. Type the English.";
  else if (kind === "produce" && cue === "audio") line = "Listen. Type the English.";
  else if (kind === "produce") line = "Type the English. No list.";
  else if (kind === "verse") line = "The word is missing from the line. Choose it, or type it.";
  if (showMe && answerIsHebrew({ kind, cue })) return `${line} ${SHOW_ME_NOTE}`;
  return line;
}
