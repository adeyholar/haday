export const TYPE_RANKS = ["Ink", "Pen", "Quill", "Ready Scribe"] as const;
export type TypeRank = (typeof TYPE_RANKS)[number];

export type TypingProgress = {
  batchesPassed: number;
  gameRounds: number;
  bestStudyAcc: number;
  bestGameAcc: number;
};

export function emptyTyping(): TypingProgress {
  return { batchesPassed: 0, gameRounds: 0, bestStudyAcc: 0, bestGameAcc: 0 };
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
  };
}
