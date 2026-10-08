import { VOCAB } from "@/lib/vocab";

/** Where a path belongs. Null means do not count it (owner pages, legal, and the like). */
export function areaOf(path: string): { id: string; label: string } | null {
  const p = (path || "/").split("?")[0].replace(/\/+$/, "") || "/";
  if (p.startsWith("/admin") || p.startsWith("/api")) return null;
  const rules: { id: string; label: string; hit: boolean }[] = [
    { id: "week7", label: "Week 7 mock exam", hit: p.startsWith("/game/week7") },
    { id: "road", label: "Road exam", hit: p.startsWith("/game/road") },
    { id: "alefbet", label: "Aleph-bet mastery", hit: p.startsWith("/game/alefbet") },
    { id: "balloons", label: "Ocean letters", hit: p.startsWith("/game/balloons") },
    { id: "syllables", label: "Syllables", hit: p.startsWith("/game/syllables") },
    { id: "nouns", label: "Nouns", hit: p.startsWith("/game/nouns") },
    { id: "article", label: "Article and vav", hit: p.startsWith("/game/article") },
    { id: "grammar", label: "Grammar lessons", hit: p.startsWith("/game/lessons") || p.startsWith("/lessons") },
    { id: "custom", label: "Custom mix", hit: p.startsWith("/game/custom") },
    { id: "game-type", label: "Type the word", hit: p.startsWith("/game/type") },
    { id: "game", label: "Vocabulary game", hit: p === "/game" || /^\/game\/\d+/.test(p) },
    { id: "drill", label: "Drill", hit: p.startsWith("/drill") },
    { id: "weak", label: "Weak pool", hit: p.startsWith("/weak") },
    { id: "quiz", label: "Quiz", hit: p.startsWith("/quiz") || p.startsWith("/self-quiz") },
    { id: "write", label: "Write", hit: p.startsWith("/write") },
    { id: "type", label: "Type", hit: p === "/type" || p.startsWith("/type/") },
    { id: "rules", label: "Rules", hit: p.startsWith("/rules") },
    { id: "match", label: "Match", hit: p.startsWith("/match") },
    { id: "cards", label: "Study cards", hit: p.startsWith("/cards") },
    { id: "lexicon", label: "Lexicon", hit: p.startsWith("/browse") },
    { id: "alphabet", label: "Alef-bet lesson", hit: p.startsWith("/alphabet") },
    { id: "study", label: "Stations", hit: p.startsWith("/study") },
    { id: "pet", label: "Alive Pet", hit: p.startsWith("/listen/pet") },
    { id: "tanakh", label: "Tanakh", hit: p.startsWith("/listen/read") || p.startsWith("/finder") },
    { id: "listen", label: "Listen", hit: p.startsWith("/listen") },
    { id: "keep", label: "Zakhor", hit: p.startsWith("/keep") },
    { id: "challenge", label: "Ultimate Challenge", hit: p.startsWith("/challenge") },
    { id: "ask", label: "Ask HaDay", hit: p.startsWith("/ask") },
    { id: "home", label: "Home", hit: p === "/" },
    { id: "sign-in", label: "Sign in", hit: p.startsWith("/login") || p.startsWith("/reset-password") },
  ];
  return rules.find((rule) => rule.hit) ?? { id: "other", label: "Other pages" };
}

export function areaLabel(id: string): string {
  const known = areaOf(id === "home" ? "/" : `/${id}`);
  if (known && known.id === id) return known.label;
  const named: Record<string, string> = {
    home: "Home",
    week7: "Week 7 mock exam",
    road: "Road exam",
    alefbet: "Aleph-bet mastery",
    balloons: "Ocean letters",
    syllables: "Syllables",
    nouns: "Nouns",
    article: "Article and vav",
    grammar: "Grammar lessons",
    custom: "Custom mix",
    "game-type": "Type the word",
    game: "Vocabulary game",
    drill: "Drill",
    weak: "Weak pool",
    quiz: "Quiz",
    write: "Write",
    type: "Type",
    rules: "Rules",
    match: "Match",
    cards: "Study cards",
    lexicon: "Lexicon",
    alphabet: "Alef-bet lesson",
    study: "Stations",
    pet: "Alive Pet",
    tanakh: "Tanakh",
    listen: "Listen",
    keep: "Zakhor",
    challenge: "Ultimate Challenge",
    ask: "Ask HaDay",
    "sign-in": "Sign in",
    other: "Other pages",
  };
  return named[id] ?? id;
}

const CHAPTER: Record<number, string> = {
  1: "Alphabet",
  2: "Names",
  3: "Nouns",
  4: "More nouns",
  5: "Article and vav",
  6: "Prepositions",
  7: "Adjectives",
  8: "Pronouns",
  9: "Existence",
  10: "Construct",
  11: "Numbers",
  12: "Qal verbs",
  13: "More Qal",
  14: "Come and go",
  15: "Live and serve",
  16: "Redeem",
  17: "Love and judge",
  18: "Choose and seek",
  19: "Trust and work",
};

const TRACK: Record<string, string> = {
  prep: "Grammar · prepositions",
  adj: "Grammar · adjectives",
  pron: "Grammar · pronouns",
  exist: "Grammar · existence",
  construct: "Grammar · construct",
  numbers: "Grammar · numbers",
  verbs: "Grammar · verbs",
};

const chapterOf = new Map(VOCAB.map((item) => [item.id, item.chapter]));

export type UseBucket = { id: string; label: string; n: number; people: number };

export type StudentUse = {
  name: string;
  answers: number;
  words: number;
  top: string;
  sessions: number;
  streak: number;
};

type StageLike = { attempts?: number };
type UnitBag = { units?: Record<string, StageLike>; levels?: Record<string, StageLike> };
type CardLike = { hits?: number; misses?: number; reps?: number };

export type SavedRow = {
  name: string;
  cards: unknown;
  game: unknown;
  sessions: number;
  streak: number;
};

function attemptsOf(bag: UnitBag | undefined, key: "units" | "levels"): number {
  const rec = bag?.[key];
  if (!rec) return 0;
  return Object.values(rec).reduce((sum, stage) => sum + (Number(stage?.attempts) || 0), 0);
}

function add(map: Map<string, { label: string; n: number; people: number }>, id: string, label: string, n: number) {
  if (n <= 0) return;
  const cur = map.get(id) ?? { label, n: 0, people: 0 };
  cur.n += n;
  cur.people += 1;
  map.set(id, cur);
}

function personBuckets(cards: unknown, game: unknown): Map<string, { label: string; n: number }> {
  const own = new Map<string, { label: string; n: number }>();
  const bump = (id: string, label: string, n: number) => {
    if (n <= 0) return;
    const cur = own.get(id) ?? { label, n: 0 };
    cur.n += n;
    own.set(id, cur);
  };

  const cardRec = cards && typeof cards === "object" ? (cards as Record<string, CardLike>) : {};
  const byChapter = new Map<number, number>();
  for (const [id, card] of Object.entries(cardRec)) {
    const n = (Number(card?.hits) || 0) + (Number(card?.misses) || 0);
    if (n <= 0 && (Number(card?.reps) || 0) <= 0) continue;
    const chapter = chapterOf.get(id) ?? 0;
    byChapter.set(chapter, (byChapter.get(chapter) ?? 0) + Math.max(n, 1));
  }
  for (const [chapter, n] of byChapter) {
    const title = CHAPTER[chapter] ?? "Other words";
    bump(`ch-${chapter}`, `Vocabulary · ${title}`, n);
  }

  const snap = game && typeof game === "object" ? (game as Record<string, unknown>) : {};
  const chapters = snap.chapters as Record<string, { stages?: Record<string, StageLike> }> | undefined;
  let gameN = 0;
  for (const chapter of Object.values(chapters ?? {})) {
    for (const stage of Object.values(chapter.stages ?? {})) gameN += Number(stage?.attempts) || 0;
  }
  bump("game", "Vocabulary game", gameN);
  bump("alefbet", "Aleph-bet mastery", attemptsOf(snap.alefBet as UnitBag, "levels"));
  bump("syllables", "Syllables", attemptsOf(snap.syllables as UnitBag, "units"));
  bump("nouns", "Nouns", attemptsOf(snap.nouns as UnitBag, "units"));
  bump("article", "Article and vav", attemptsOf(snap.article as UnitBag, "units"));
  const lessons = snap.lessons as Record<string, UnitBag> | undefined;
  for (const [id, bag] of Object.entries(lessons ?? {})) {
    bump(`track-${id}`, TRACK[id] ?? `Grammar · ${id}`, attemptsOf(bag, "units"));
  }
  const balloons = snap.balloons as { attempts?: number } | undefined;
  bump("balloons", "Ocean letters", Number(balloons?.attempts) || 0);
  const typing = snap.typing as { gameRounds?: number; batchesPassed?: number } | undefined;
  bump("typing", "Typing", (Number(typing?.gameRounds) || 0) + (Number(typing?.batchesPassed) || 0));
  bump("challenge", "Ultimate Challenge", Number(snap.ultimateAttempts) || 0);
  return own;
}

export function tallySavedPractice(rows: SavedRow[]): { practice: UseBucket[]; students: StudentUse[] } {
  const totals = new Map<string, { label: string; n: number; people: number }>();
  const students: StudentUse[] = [];
  for (const row of rows) {
    const own = personBuckets(row.cards, row.game);
    let answers = 0;
    let words = 0;
    const cardRec = row.cards && typeof row.cards === "object" ? (row.cards as Record<string, CardLike>) : {};
    for (const card of Object.values(cardRec)) {
      const n = (Number(card?.hits) || 0) + (Number(card?.misses) || 0);
      const reps = Number(card?.reps) || 0;
      if (n <= 0 && reps <= 0) continue;
      words += 1;
      answers += n;
    }
    let top = "Not yet";
    let topN = 0;
    for (const [id, bucket] of own) {
      add(totals, id, bucket.label, bucket.n);
      if (bucket.n > topN) {
        topN = bucket.n;
        top = bucket.label;
      }
    }
    students.push({
      name: row.name.trim() || "Student",
      answers,
      words,
      top,
      sessions: row.sessions,
      streak: row.streak,
    });
  }
  students.sort((a, b) => b.answers - a.answers || b.words - a.words || a.name.localeCompare(b.name));
  const practice = [...totals.entries()]
    .map(([id, bucket]) => ({ id, label: bucket.label, n: bucket.n, people: bucket.people }))
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
  return { practice, students };
}
