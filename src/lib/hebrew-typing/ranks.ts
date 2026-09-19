export const TYPE_RANKS = ["Ink", "Pen", "Quill", "Ready Scribe"] as const;
export type TypeRank = (typeof TYPE_RANKS)[number];

export type TypingProgress = {
  batchesPassed: number;
  gameRounds: number;
  bestStudyAcc: number;
  bestGameAcc: number;
  strong: Record<string, number>;
  weak: Record<string, number>;
};

export function emptyTyping(): TypingProgress {
  return { batchesPassed: 0, gameRounds: 0, bestStudyAcc: 0, bestGameAcc: 0, strong: {}, weak: {} };
}

export function typingRank(p: TypingProgress): TypeRank {
  if (p.batchesPassed >= 15 || p.gameRounds >= 8) return "Ready Scribe";
  if (p.batchesPassed >= 8 || p.gameRounds >= 4) return "Quill";
  if (p.batchesPassed >= 3 || p.gameRounds >= 1) return "Pen";
  return "Ink";
}

export function hydrateTyping(raw: unknown): TypingProgress {
  const base = emptyTyping();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<TypingProgress>;
  return {
    batchesPassed: Math.max(0, Number(r.batchesPassed) || 0),
    gameRounds: Math.max(0, Number(r.gameRounds) || 0),
    bestStudyAcc: Math.max(0, Math.min(100, Number(r.bestStudyAcc) || 0)),
    bestGameAcc: Math.max(0, Math.min(100, Number(r.bestGameAcc) || 0)),
    strong: counts(r.strong),
    weak: counts(r.weak),
  };
}

function counts(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(v);
    if (k && n > 0) out[k] = Math.min(99, n);
  }
  return out;
}

export function applyMark(
  p: TypingProgress,
  id: string,
  mark: "strong" | "weak" | "ok",
): TypingProgress {
  if (mark === "ok" || !id) return p;
  const strong = { ...p.strong };
  const weak = { ...p.weak };
  if (mark === "strong") {
    strong[id] = (strong[id] ?? 0) + 1;
    delete weak[id];
  } else {
    weak[id] = (weak[id] ?? 0) + 1;
    delete strong[id];
  }
  return { ...p, strong, weak };
}
