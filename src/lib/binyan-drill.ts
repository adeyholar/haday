import {
  ROOTS,
  STEMS,
  conjLabel,
  openPattern,
  rootById,
  type ConjId,
  type StemId,
} from "@/lib/verbal-system";
import { BGDKPT, isSibilant } from "@/lib/verbal-marks";

/** Open practice. Ten first answers, and 90% opens the next set. It does not lock a level. */
export const BINYAN_ROUND = 10;
export const BINYAN_PASS = 90;

/** Qal, Piel, and Hiphil, then Niphal and Hithpael, then Pual and Hophal. */
export const BINYAN_SETS: readonly (readonly StemId[])[] = [
  ["qal", "piel", "hiphil"],
  ["niphal", "hithpael"],
  ["pual", "hophal"],
];

const DRILL_CONJ: readonly ConjId[] = ["perfect", "imperfect", "participle"];

/** Tav-prefix imperfects. They stay out of the drill until this pointing is signed. */
const TAV_PERSON = new Set(["3fs", "2ms", "2fs", "3fp", "2mp", "2fp"]);

export type BinyanMode = "verb-stem" | "stem-verb" | "same-root";

export type StemStat = { seen: number; first: number };

export type BinyanProgress = {
  set: number;
  stems: Partial<Record<StemId, StemStat>>;
};

export type StemCard = {
  id: StemId;
  en: string;
  he: string;
  mark: string;
  meaning: string;
};

/** The mark is the clue after a miss. It is not part of the question. */
export const STEM_CARDS: Record<StemId, StemCard> = {
  qal: {
    id: "qal",
    en: "Qal",
    he: "קַל",
    mark: "No prefix, and no doubling in the middle letter.",
    meaning: "The plain stem. He did it.",
  },
  niphal: {
    id: "niphal",
    en: "Niphal",
    he: "נִפְעַל",
    mark: "A nun, or the dagesh that nun leaves behind.",
    meaning: "Often passive. Sometimes he did it to himself.",
  },
  piel: {
    id: "piel",
    en: "Piel",
    he: "פִּעֵל",
    mark: "Dagesh in the middle letter.",
    meaning: "Intensive, or he made it so.",
  },
  pual: {
    id: "pual",
    en: "Pual",
    he: "פֻּעַל",
    mark: "Qibbuts, and the dagesh in the middle letter.",
    meaning: "The passive of Piel.",
  },
  hiphil: {
    id: "hiphil",
    en: "Hiphil",
    he: "הִפְעִיל",
    mark: "Hireq under the prefix.",
    meaning: "Causative. He caused it.",
  },
  hophal: {
    id: "hophal",
    en: "Hophal",
    he: "הֻפְעַל",
    mark: "A u or o vowel on the prefix.",
    meaning: "The passive of Hiphil.",
  },
  hithpael: {
    id: "hithpael",
    en: "Hithpael",
    he: "הִתְפַּעֵל",
    mark: "הִתְ, or יִתְ, or מִתְ.",
    meaning: "He did it to himself, or they did it to one another.",
  },
};

export type BinyanCard = {
  id: string;
  rootId: string;
  cite: string;
  gloss: string;
  stem: StemId;
  conj: ConjId;
  form: string;
  person: string;
};

/** The shapes the review found. The drill does not show them until they are signed. */
export function heldFromDrill(card: Pick<BinyanCard, "id" | "stem" | "conj" | "rootId" | "form">): boolean {
  const cell = card.id.split(":").at(-1) ?? "";
  if (card.conj === "imperfect" && TAV_PERSON.has(cell)) return true;
  const root = rootById(card.rootId);
  if (card.stem === "niphal" && root && BGDKPT.has(root.letters[1])) return true;
  if (card.stem === "hithpael" && root && isSibilant(root.letters[0])) return true;
  if (card.form.includes("ך")) return true;
  return false;
}

export type BinyanPrompt = {
  hebrew: string;
  line: string;
};

let pool: BinyanCard[] | null = null;

/** Strong roots only. Perfect, imperfect, and participle, from the stem engine. */
export function strongBinyanCards(): BinyanCard[] {
  if (pool) return pool;
  const cards: BinyanCard[] = [];
  for (const root of ROOTS) {
    if (root.cls !== "strong") continue;
    for (const stem of STEMS) {
      for (const conj of DRILL_CONJ) {
        const pattern = openPattern(root.id, stem.id, conj);
        if (!pattern) continue;
        for (const cell of pattern.cells) {
          if (!cell.form) continue;
          const card: BinyanCard = {
            id: `${root.id}:${stem.id}:${conj}:${cell.id}`,
            rootId: root.id,
            cite: root.cite,
            gloss: root.gloss,
            stem: stem.id,
            conj,
            form: cell.form,
            person: cell.label,
          };
          if (heldFromDrill(card)) continue;
          cards.push(card);
        }
      }
    }
  }
  pool = cards;
  return cards;
}

export function emptyBinyan(): BinyanProgress {
  return { set: 0, stems: {} };
}

export function stemsOpen(set: number): StemId[] {
  const index = clampSet(set);
  return BINYAN_SETS.slice(0, index + 1).flat();
}

export function binyanPassed(firstCorrect: number, total = BINYAN_ROUND): boolean {
  return total > 0 && Math.round((firstCorrect / total) * 100) >= BINYAN_PASS;
}

export function finishBinyanRound(progress: BinyanProgress, firstCorrect: number): BinyanProgress {
  const set = progress.set >= BINYAN_SETS.length - 1 || !binyanPassed(firstCorrect) ? progress.set : progress.set + 1;
  return { ...progress, set };
}

export function noteBinyanFirst(progress: BinyanProgress, stem: StemId, right: boolean): BinyanProgress {
  const prev = progress.stems[stem] ?? { seen: 0, first: 0 };
  return {
    ...progress,
    stems: {
      ...progress.stems,
      [stem]: { seen: prev.seen + 1, first: prev.first + (right ? 1 : 0) },
    },
  };
}

export function stemExamples(stem: StemId, cards = strongBinyanCards()): BinyanCard[] {
  const mine = cards.filter((card) => card.stem === stem);
  const picked: BinyanCard[] = [];
  for (const conj of DRILL_CONJ) {
    const found = mine.find((card) => card.conj === conj);
    if (found) picked.push(found);
  }
  return picked;
}

/** The question. The stem's mark is not in it. */
export function binyanPrompt(card: BinyanCard, mode: BinyanMode): BinyanPrompt {
  if (mode === "stem-verb") {
    const face = STEM_CARDS[card.stem];
    return { hebrew: face.he, line: face.en };
  }
  if (mode === "same-root") return { hebrew: card.form, line: `${card.cite} · ${card.gloss}` };
  return { hebrew: card.form, line: conjLabel(card.conj, true) };
}

export function binyanClue(card: Pick<BinyanCard, "stem" | "conj" | "rootId">): string {
  const face = STEM_CARDS[card.stem];
  return `${face.en}. ${clueFor(card)}`;
}

function clueFor(card: Pick<BinyanCard, "stem" | "conj" | "rootId">): string {
  const root = rootById(card.rootId);
  if (card.stem === "hithpael" && root && isSibilant(root.letters[0])) {
    return "The tav has traded places with the first letter.";
  }
  if (card.stem === "qal" && card.conj === "imperfect") return "A person prefix, and no doubling in the middle letter.";
  if (card.stem === "qal" && card.conj === "participle") return "Holem or shureq, and no person prefix.";
  if (card.stem === "hiphil" && card.conj === "imperfect") return "Patah under the prefix, and an i-vowel in the stem.";
  if (card.stem === "hiphil" && card.conj === "participle") return "Mem with patah, and an i-vowel in the stem.";
  if (card.stem === "hithpael" && card.conj === "imperfect") return "A person prefix, then tav with shewa.";
  if (card.stem === "hithpael" && card.conj === "participle") return "Mem with hireq, then tav with shewa.";
  if (card.stem === "hithpael" && card.conj === "perfect") return "He with hireq, then tav with shewa.";
  return STEM_CARDS[card.stem].mark;
}

export function dealBinyanRound(
  stems: readonly StemId[],
  rng: () => number = Math.random,
  cards = strongBinyanCards(),
): BinyanCard[] {
  const open = new Set(stems);
  return shuffle(cards.filter((card) => open.has(card.stem)), rng).slice(0, BINYAN_ROUND);
}

export type BinyanChoice = { id: string; hebrew: string; stem: StemId };

export function binyanChoices(
  card: BinyanCard,
  mode: BinyanMode,
  stems: readonly StemId[],
  rng: () => number = Math.random,
  cards = strongBinyanCards(),
): BinyanChoice[] {
  if (mode === "stem-verb") {
    const others = shuffle(
      cards.filter((item) => item.stem !== card.stem && stems.includes(item.stem) && item.form !== card.form),
      rng,
    );
    const picked: BinyanCard[] = [];
    const seen = new Set<StemId>();
    for (const item of others) {
      if (seen.has(item.stem)) continue;
      seen.add(item.stem);
      picked.push(item);
      if (picked.length === 3) break;
    }
    return shuffle(
      [card, ...picked].map((item) => ({ id: item.id, hebrew: item.form, stem: item.stem })),
      rng,
    );
  }
  const open = mode === "same-root" ? stemsOnRoot(card.rootId, stems, cards) : stems;
  return open.map((stem) => {
    const face = STEM_CARDS[stem];
    return { id: stem, hebrew: face.he, stem };
  });
}

export function choiceMatches(card: BinyanCard, choice: BinyanChoice, mode: BinyanMode): boolean {
  return mode === "stem-verb" ? choice.id === card.id : choice.stem === card.stem;
}

function stemsOnRoot(rootId: string, stems: readonly StemId[], cards: BinyanCard[]): StemId[] {
  const have = new Set(cards.filter((card) => card.rootId === rootId).map((card) => card.stem));
  return stems.filter((stem) => have.has(stem));
}

export function hydrateBinyan(raw: unknown): BinyanProgress {
  const base = emptyBinyan();
  if (!raw || typeof raw !== "object") return base;
  const row = raw as Partial<BinyanProgress>;
  const stems: BinyanProgress["stems"] = {};
  if (row.stems && typeof row.stems === "object") {
    for (const stem of STEMS) {
      const stat = row.stems[stem.id];
      if (!stat || typeof stat !== "object") continue;
      const seen = Math.max(0, Math.round(Number(stat.seen) || 0));
      const first = Math.max(0, Math.min(seen, Math.round(Number(stat.first) || 0)));
      if (seen > 0) stems[stem.id] = { seen, first };
    }
  }
  return { set: clampSet(Number(row.set) || 0), stems };
}

export function isStrongCard(card: BinyanCard): boolean {
  return rootById(card.rootId)?.cls === "strong" && DRILL_CONJ.includes(card.conj) && card.form.length > 0;
}

function clampSet(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(BINYAN_SETS.length - 1, Math.round(value));
}

function shuffle<T>(list: T[], rng: () => number): T[] {
  const next = list.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const hold = next[i];
    next[i] = next[j];
    next[j] = hold;
  }
  return next;
}
