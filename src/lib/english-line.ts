export const NO_ENGLISH = "No English for this verse";

export const TRANSLATION_OPTIONS = ["YLT", "WEB"] as const;

export type TranslationId = "ylt" | "web";

export type EnglishTarget = { ref: string; part?: string };

export type VerseMapEntry = {
  ylt?: EnglishTarget[];
  web?: EnglishTarget[];
  status?: string;
};

export type EnglishLine = {
  ref: string;
  text: string;
  part?: string;
  alsoCovers?: string;
};

export type EnglishSlot =
  | { state: "none"; message: typeof NO_ENGLISH }
  | { state: "text"; lines: EnglishLine[] };

export function hebrewRefLabel(key: string): string {
  const [book, chapter, verse] = key.split(".");
  return `${book} ${chapter}:${verse}`;
}

export function asEnglishSlot(value: unknown): EnglishSlot {
  if (value && typeof value === "object" && "state" in value) {
    const slot = value as EnglishSlot;
    if (slot.state === "none") return { state: "none", message: NO_ENGLISH };
    if (slot.state === "text" && Array.isArray(slot.lines)) return slot;
  }
  if (typeof value === "string" && value.trim()) return { state: "text", lines: [{ ref: "", text: value }] };
  return { state: "none", message: NO_ENGLISH };
}

export function englishPlain(value: unknown): string {
  const slot = asEnglishSlot(value);
  if (slot.state === "none") return "";
  return slot.lines.map((line) => line.text).join(" ");
}

/** Other Hebrew verses that share this English ref when the verse is only a part. */
export function coversFor(
  hebrewKey: string,
  englishRef: string,
  part: string | undefined,
  index: ReadonlyMap<string, VerseMapEntry>,
): string[] {
  if (!part) return [];
  const others: string[] = [];
  for (const [key, entry] of index) {
    if (key === hebrewKey) continue;
    const targets = [...(entry.ylt ?? []), ...(entry.web ?? [])];
    if (targets.some((target) => target.ref === englishRef && target.part && target.part !== part)) {
      others.push(hebrewRefLabel(key));
    }
  }
  return others;
}

export function englishSlot(
  side: TranslationId,
  entry: VerseMapEntry | undefined,
  texts: Readonly<Record<string, string>>,
  alsoFor: (englishRef: string, part: string) => string[] = () => [],
): EnglishSlot {
  if (!entry || entry.status === "needs-review") return { state: "none", message: NO_ENGLISH };
  const targets = entry[side] ?? [];
  if (targets.length === 0) return { state: "none", message: NO_ENGLISH };
  const lines: EnglishLine[] = [];
  for (const target of targets) {
    const text = texts[target.ref];
    if (!text) continue;
    const line: EnglishLine = { ref: target.ref, text };
    if (target.part) {
      line.part = target.part;
      const covers = alsoFor(target.ref, target.part);
      if (covers.length) line.alsoCovers = covers.join(", ");
    }
    lines.push(line);
  }
  if (lines.length === 0) return { state: "none", message: NO_ENGLISH };
  return { state: "text", lines };
}
