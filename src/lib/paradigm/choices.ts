function mix(seed: string): () => number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h, 1664525) + 1013904223;
    return (h >>> 0) / 4294967296;
  };
}

export function seededOrder<T>(seed: string, items: T[]): T[] {
  const out = [...items];
  const rand = mix(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const swap = out[i];
    out[i] = out[j];
    out[j] = swap;
  }
  return out;
}

/** The correct chip is not stuck in the first seat. One showing keeps one order; a new deal seed reshuffles. */
export function shuffledChoices<T>(seed: string, correct: T, distractors: T[], count = 4): T[] {
  const pool = seededOrder(`${seed}:pool`, distractors.filter((item) => item !== correct)).slice(0, count - 1);
  return seededOrder(seed, [correct, ...pool]);
}
