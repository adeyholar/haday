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
  const words = heard
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  for (let i = words.length - 1; i >= 0; i--) {
    const hit = SAY[words[i]];
    if (hit) return hit;
  }
  return null;
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
