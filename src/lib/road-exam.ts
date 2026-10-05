import { closeItems, shuffle, type VocabItem } from "@/lib/vocab";

export const ROAD_LETTERS = ["A", "B", "C", "D"] as const;
export type RoadLetter = (typeof ROAD_LETTERS)[number];

export type RoadChoice = {
  letter: RoadLetter;
  gloss: string;
  correct: boolean;
};

export type RoadCard = {
  key: string;
  item: VocabItem;
  choices: RoadChoice[];
};

const SAY: Record<string, RoadLetter> = {
  a: "A",
  ay: "A",
  aye: "A",
  eh: "A",
  hey: "A",
  b: "B",
  be: "B",
  bee: "B",
  c: "C",
  see: "C",
  sea: "C",
  cee: "C",
  d: "D",
  de: "D",
  dee: "D",
};

export function glossHead(gloss: string): string {
  return gloss.split(/[,;]/)[0]?.trim() || gloss.trim();
}

/** Hear "A", "bee", "it's C" — not a sentence about something else. */
export function parseRoadLetter(heard: string): RoadLetter | null {
  return parseRoadHeard(heard, []);
}

const FILLER = new Set(["um", "uh", "er", "ah", "hmm", "please", "its", "it", "is", "option", "letter", "choice"]);

function roadText(heard: string): string {
  return heard
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

/** Whole-phrase match. Returns the end index in `text`, or -1. */
function phraseEnd(text: string, phrase: string): number {
  if (!phrase) return -1;
  const hay = ` ${text} `;
  const at = hay.lastIndexOf(` ${phrase} `);
  if (at < 0) return -1;
  return at + phrase.length;
}

/** A one- or two-letter gloss counts only when that is what they said. */
function tightGloss(text: string, gloss: string): boolean {
  const words = text.split(" ").filter((word) => !FILLER.has(word));
  return words.join(" ") === gloss;
}

/**
 * The English word on the button, or A B C D.
 * The later one wins, so "father, B" is B and "B, father" is father.
 * A longer name beats a short word inside the same phrase ("Abraham and" is Abraham).
 */
export function parseRoadHeard(
  heard: string,
  choices: { letter: RoadLetter; gloss: string }[],
): RoadLetter | null {
  const text = roadText(heard);
  if (!text) return null;

  let glossHit: { letter: RoadLetter; end: number; len: number } | null = null;
  for (const choice of choices) {
    const gloss = roadText(choice.gloss);
    if (!gloss) continue;
    if (gloss.length <= 2 && !tightGloss(text, gloss)) continue;
    const end = phraseEnd(text, gloss);
    if (end < 0) continue;
    if (!glossHit || gloss.length > glossHit.len || (gloss.length === glossHit.len && end > glossHit.end)) {
      glossHit = { letter: choice.letter, end, len: gloss.length };
    }
  }

  let letterHit: { letter: RoadLetter; end: number } | null = null;
  let cursor = 0;
  for (const word of text.split(" ")) {
    const letter = SAY[word];
    const end = cursor + word.length;
    if (letter) letterHit = { letter, end };
    cursor = end + 1;
  }

  if (glossHit && letterHit) return letterHit.end > glossHit.end ? letterHit.letter : glossHit.letter;
  return glossHit?.letter ?? letterHit?.letter ?? null;
}

export function roadChoices(item: VocabItem, pool: VocabItem[]): RoadChoice[] {
  const correct = glossHead(item.gloss);
  const used = new Set([correct.toLowerCase()]);
  const picks: VocabItem[] = [];
  const consider = [...closeItems(item, pool, 12), ...shuffle(pool)];
  for (const other of consider) {
    if (other.id === item.id) continue;
    const gloss = glossHead(other.gloss);
    const key = gloss.toLowerCase();
    if (!gloss || used.has(key)) continue;
    used.add(key);
    picks.push(other);
    if (picks.length >= 3) break;
  }
  const rows = shuffle([item, ...picks]);
  return rows.map((vocab, i) => ({
    letter: ROAD_LETTERS[i] ?? "D",
    gloss: glossHead(vocab.gloss),
    correct: vocab.id === item.id,
  }));
}

export function buildRoadDeck(pool: VocabItem[]): RoadCard[] {
  return shuffle(pool).map((item, n) => ({
    key: `${item.id}:${n}`,
    item,
    choices: roadChoices(item, pool),
  }));
}

/** A miss is heard again at the back of the deck until that word is correct. */
export function parkMiss<T extends { key: string }>(queue: T[], card: T): T[] {
  const stem = card.key.replace(/:back(?::\d+)?$/, "");
  const used = new Set(queue.map((row) => row.key));
  let n = 1;
  let key = `${stem}:back:${n}`;
  while (used.has(key)) {
    n += 1;
    key = `${stem}:back:${n}`;
  }
  return [...queue, { ...card, key }];
}

export type RoadSlot = {
  key: string;
  id: string;
  choices: RoadChoice[];
};

/** One open road circle. The deck ends only after every miss has been correct. */
export type RoadRun = {
  order: RoadSlot[];
  index: number;
  heard: number;
  held: number;
};

export function packRoadRun(queue: RoadCard[], index: number, heard: number, held: number): RoadRun | null {
  if (!queue.length || index < 0 || index >= queue.length) return null;
  return {
    order: queue.map((card) => ({
      key: card.key,
      id: card.item.id,
      choices: card.choices.map((choice) => ({
        letter: choice.letter,
        gloss: choice.gloss,
        correct: choice.correct,
      })),
    })),
    index,
    heard: Math.max(0, Math.floor(heard) || 0),
    held: Math.max(0, Math.floor(held) || 0),
  };
}

function isRoadLetter(v: unknown): v is RoadLetter {
  return ROAD_LETTERS.includes(v as RoadLetter);
}

function slotChoices(raw: unknown): RoadChoice[] | null {
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  const choices: RoadChoice[] = [];
  const letters = new Set<string>();
  let correct = 0;
  for (const row of raw) {
    if (!row || typeof row !== "object") return null;
    const choice = row as Partial<RoadChoice>;
    if (!isRoadLetter(choice.letter) || typeof choice.gloss !== "string" || !choice.gloss.trim()) return null;
    if (letters.has(choice.letter)) return null;
    letters.add(choice.letter);
    if (choice.correct) correct += 1;
    choices.push({ letter: choice.letter, gloss: choice.gloss, correct: Boolean(choice.correct) });
  }
  if (correct !== 1) return null;
  return choices;
}

export function hydrateRoadRun(raw: unknown): RoadRun | null {
  if (!raw || typeof raw !== "object") return null;
  const run = raw as Partial<RoadRun>;
  if (!Array.isArray(run.order) || run.order.length === 0) return null;
  const order: RoadSlot[] = [];
  for (const row of run.order) {
    if (!row || typeof row !== "object") return null;
    const slot = row as Partial<RoadSlot>;
    if (typeof slot.key !== "string" || !slot.key || typeof slot.id !== "string" || !slot.id) return null;
    const choices = slotChoices(slot.choices);
    if (!choices) return null;
    order.push({ key: slot.key, id: slot.id, choices });
  }
  const index = Number(run.index);
  if (!Number.isInteger(index) || index < 0 || index >= order.length) return null;
  return {
    order,
    index,
    heard: Math.max(0, Math.floor(Number(run.heard)) || 0),
    held: Math.max(0, Math.floor(Number(run.held)) || 0),
  };
}

/** Rebuild the circle from saved ids. A missing word drops the whole run. */
export function unpackRoadRun(
  run: RoadRun | null | undefined,
  pool: VocabItem[],
): { queue: RoadCard[]; index: number; heard: number; held: number } | null {
  const clean = hydrateRoadRun(run);
  if (!clean) return null;
  const byId = new Map(pool.map((item) => [item.id, item]));
  const queue: RoadCard[] = [];
  for (const slot of clean.order) {
    const item = byId.get(slot.id);
    if (!item) return null;
    queue.push({ key: slot.key, item, choices: slot.choices });
  }
  return { queue, index: clean.index, heard: clean.heard, held: clean.held };
}

