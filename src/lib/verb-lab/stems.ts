/** Fixed stem ids. Labels and order change with the path. The chart forms do not. */

export const STEM_IDS = ["Qal", "Niphal", "Piel", "Pual", "Hitpael", "Hiphil", "Hophal"] as const;

export type StemId = (typeof STEM_IDS)[number];

export type VerbPath = "grammar" | "scripture";

export type StemFace = { en: string; he: string };

const GRAMMAR: Record<StemId, StemFace> = {
  Qal: { en: "Qal", he: "קַל" },
  Niphal: { en: "Niphal", he: "נִפְעַל" },
  Hiphil: { en: "Hiphil", he: "הִפְעִיל" },
  Hophal: { en: "Hophal", he: "הָפְעַל" },
  Piel: { en: "Piel", he: "פִּעֵל" },
  Pual: { en: "Pual", he: "פֻּעַל" },
  Hitpael: { en: "Hithpael", he: "הִתְפַּעֵל" },
};

const SCRIPTURE: Record<StemId, StemFace> = {
  Qal: { en: "Pa·al", he: "פָּעַל" },
  Niphal: { en: "Nif·al", he: "נִפְעַל" },
  Piel: { en: "Pi·el", he: "פִּעֵל" },
  Pual: { en: "Pu·al", he: "פֻּעַל" },
  Hiphil: { en: "Hif·il", he: "הִפְעִיל" },
  Hophal: { en: "Hoof·al", he: "הֻפְעַל" },
  Hitpael: { en: "Hit·pa·el", he: "הִתְפַּעֵל" },
};

/** Van Pelt order on the Grammar Path. The other textbook's order on the Scripture Path. */
export const PATH_ORDER: Record<VerbPath, readonly StemId[]> = {
  grammar: ["Qal", "Niphal", "Hiphil", "Hophal", "Piel", "Pual", "Hitpael"],
  scripture: ["Qal", "Niphal", "Piel", "Pual", "Hiphil", "Hophal", "Hitpael"],
};

/**
 * L1–L3 are Qal, column by column. L4–L7 follow that path's row order.
 * Pairs that share a step unlock together.
 */
export const PATH_GATE: Record<VerbPath, Record<StemId, number>> = {
  grammar: { Qal: 1, Niphal: 4, Hiphil: 5, Hophal: 5, Piel: 6, Pual: 6, Hitpael: 7 },
  scripture: { Qal: 1, Niphal: 4, Piel: 5, Pual: 5, Hiphil: 6, Hophal: 6, Hitpael: 7 },
};

/** Qal opens one column at a time across L1–L3. Other stems use the stem gate. */
export const QAL_COLUMN_LEVEL: Record<string, number> = {
  qatal: 1,
  yiqtol: 2,
  wayyiqtol: 2,
  jussive: 2,
  imperative: 3,
  "infinitive-construct": 3,
  "infinitive-absolute": 3,
  participle: 3,
  "participle-active": 3,
  "participle-passive": 3,
};

/** Every spelling a student might type. Search is not in this build; the Also called list uses these. */
export const STEM_ALIASES: Record<StemId, readonly string[]> = {
  Qal: ["Qal", "Pa·al", "Paal", "קַל", "פָּעַל"],
  Niphal: ["Niphal", "Nif·al", "Nifal", "נִפְעַל"],
  Piel: ["Piel", "Pi·el", "פִּעֵל"],
  Pual: ["Pual", "Pu·al", "פֻּעַל"],
  Hitpael: ["Hitpael", "Hithpael", "Hit·pa·el", "הִתְפַּעֵל"],
  Hiphil: ["Hiphil", "Hif·il", "Hifil", "הִפְעִיל"],
  Hophal: ["Hophal", "Hoof·al", "Hofal", "הָפְעַל", "הֻפְעַל"],
};

export const GRID_COLUMNS = [
  { id: "qatal", label: "qatal", sub: "perfect" },
  { id: "yiqtol", label: "yiqtol", sub: "imperfect" },
  { id: "wayyiqtol", label: "wayyiqtol", sub: "waw-consecutive" },
  { id: "imperative", label: "imperative", sub: "" },
  { id: "infinitive-construct", label: "infinitive construct", sub: "" },
  { id: "infinitive-absolute", label: "infinitive absolute", sub: "" },
  { id: "participle", label: "participle", sub: "" },
] as const;

export type GridColumnId = (typeof GRID_COLUMNS)[number]["id"];

/** Pual and Hophal have no imperative. These squares are never drawn, quizzed, or put in the due pile. */
export const NO_FORM_SQUARES = ["Pual.imperative", "Hophal.imperative"] as const;

export function isStemId(value: string): value is StemId {
  return (STEM_IDS as readonly string[]).includes(value);
}

export function isVerbPath(value: string): value is VerbPath {
  return value === "grammar" || value === "scripture";
}

export function stemFace(path: VerbPath, stem: StemId): StemFace {
  return path === "grammar" ? GRAMMAR[stem] : SCRIPTURE[stem];
}

export function stemOrder(path: VerbPath): readonly StemId[] {
  return PATH_ORDER[path];
}

function foldAlias(value: string): string {
  return value.normalize("NFC").replace(/[·׳']/g, "").toLowerCase();
}

export function stemByAlias(value: string): StemId | null {
  const folded = foldAlias(value.trim());
  if (!folded) return null;
  for (const stem of STEM_IDS) {
    if (STEM_ALIASES[stem].some((alias) => foldAlias(alias) === folded)) return stem;
  }
  return null;
}

export function alsoCalled(path: VerbPath, stem: StemId): string[] {
  const face = stemFace(path, stem);
  return STEM_ALIASES[stem].filter((alias) => alias !== face.en && alias !== face.he);
}

export function columnSlug(conjugation: string): string {
  return conjugation.replace(/ /g, "-");
}

export function squareId(stem: string, conjugation: string): string {
  return `${stem}.${columnSlug(conjugation)}`;
}

export function parseSquareId(id: string): { stem: StemId; column: string } | null {
  const dot = id.indexOf(".");
  if (dot <= 0) return null;
  const stem = id.slice(0, dot);
  const column = id.slice(dot + 1);
  if (!isStemId(stem) || !column) return null;
  return { stem, column };
}

export function isNoFormSquare(id: string): boolean {
  return (NO_FORM_SQUARES as readonly string[]).includes(id);
}

export function columnLevel(stem: StemId, column: string, path: VerbPath): number {
  if (stem === "Qal") return QAL_COLUMN_LEVEL[column] ?? PATH_GATE[path].Qal;
  return PATH_GATE[path][stem];
}

export function stemGate(path: VerbPath, stem: StemId): number {
  return PATH_GATE[path][stem];
}

/** Level 7 has opened every stem, so the “coming” line has nothing left to explain. */
export function anyStemDimmed(path: VerbPath, taught: number): boolean {
  return stemOrder(path).some((stem) => taught < stemGate(path, stem));
}

/** Scripture Path stems are already open practice. Grammar term 2 has every stem on the menu today. Term 1 has Qal. */
export function defaultTaughtLevel(path: VerbPath, term: 1 | 2): number {
  if (path === "scripture") return 7;
  return term === 2 ? 7 : 3;
}

/** A placement result can only open more. It does not close a stem the path already teaches. */
export function taughtLevel(path: VerbPath, term: 1 | 2, placed: number | null): number {
  const base = defaultTaughtLevel(path, term);
  if (placed == null || placed < 1) return base;
  return Math.max(base, Math.min(7, Math.round(placed)));
}

export function columnLabel(column: string): { label: string; sub: string } {
  if (column === "jussive") return { label: "jussive", sub: "" };
  if (column === "participle-active") return { label: "participle", sub: "active" };
  if (column === "participle-passive") return { label: "participle", sub: "passive" };
  const found = GRID_COLUMNS.find((item) => item.id === column);
  if (found) return { label: found.label, sub: found.sub };
  return { label: column.replace(/-/g, " "), sub: "" };
}

export function squaresInColumn(column: GridColumnId): readonly string[] {
  if (column === "yiqtol") return ["yiqtol", "jussive"];
  if (column === "participle") return ["participle", "participle-active", "participle-passive"];
  return [column];
}

const PGN_LABEL: Record<string, string> = {
  "3ms": "3 masc. sg.",
  "3fs": "3 fem. sg.",
  "2ms": "2 masc. sg.",
  "2fs": "2 fem. sg.",
  "1cs": "1 common sg.",
  "3cp": "3 common pl.",
  "3mp": "3 masc. pl.",
  "3fp": "3 fem. pl.",
  "2mp": "2 masc. pl.",
  "2fp": "2 fem. pl.",
  "1cp": "1 common pl.",
  ms: "masc. sg.",
  fs: "fem. sg.",
  mp: "masc. pl.",
  fp: "fem. pl.",
  "-": "—",
};

const PGN_ORDER = ["3ms", "3fs", "2ms", "2fs", "1cs", "3cp", "3mp", "3fp", "2mp", "2fp", "1cp", "ms", "fs", "mp", "fp", "-"];

export function pgnLabel(pgn: string): string {
  if (!pgn || pgn === "-") return "—";
  return PGN_LABEL[pgn] ?? pgn;
}

export function pgnRank(pgn: string): number {
  const at = PGN_ORDER.indexOf(pgn);
  return at === -1 ? PGN_ORDER.length : at;
}

export function squareTitle(path: VerbPath, id: string): string {
  const parsed = parseSquareId(id);
  if (!parsed) return id;
  const face = stemFace(path, parsed.stem);
  const column = columnLabel(parsed.column);
  const name = column.sub && parsed.column.startsWith("participle") ? `${column.label} · ${column.sub}` : column.label;
  return `${face.en} · ${name}`;
}

/** Active/passive pairs, in this path's row order. Hitpael stands alone. */
export function stemPairs(path: VerbPath): StemId[][] {
  const order = stemOrder(path);
  const partner: Partial<Record<StemId, StemId>> = { Qal: "Niphal", Piel: "Pual", Hiphil: "Hophal" };
  const groups: StemId[][] = [];
  for (let i = 0; i < order.length; i += 1) {
    const stem = order[i];
    if (!stem) continue;
    const next = partner[stem];
    if (next && order[i + 1] === next) {
      groups.push([stem, next]);
      i += 1;
    } else {
      groups.push([stem]);
    }
  }
  return groups;
}
