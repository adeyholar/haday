export const LEVEL_IDS = ["L1", "L2", "L3", "L4", "L5", "L6", "L7"] as const;

export type LevelId = (typeof LEVEL_IDS)[number];

export type CellStatus = "attested-example" | "paradigm-standard";

export type CellAlternate = {
  form: string;
  status: CellStatus;
  exampleRef?: string;
  exampleWord?: string;
  exampleStrongs?: string;
  exampleRootClass?: string;
  exampleHasWawPrefix?: boolean;
  attestedTokenCount?: number;
};

export type StrongCell = {
  id: string;
  binyan: string;
  conjugation: string;
  pgn: string;
  form: string;
  translit: string | null;
  status: CellStatus;
  exampleRef?: string;
  exampleWord?: string;
  exampleStrongs?: string;
  exampleRootClass?: string;
  exampleHasWawPrefix?: boolean;
  attestedTokenCount?: number;
  alternates?: CellAlternate[];
};

export type StrongVerbFile = {
  root: string;
  rootNote?: string;
  cells: StrongCell[];
  noFormSlots?: { binyan: string; conjugation: string }[];
};

export type LevelRow = {
  id: string;
  title: string;
  phase: number;
  dataFile?: string;
  cells?: string[];
  cellCount?: number;
  parseItemCells?: string[];
  fillCellOnly?: string[];
  status?: string;
};

export type LevelsFile = {
  version: string;
  checkMix: { currentLevel: number; earlierLevels: number };
  levels: LevelRow[];
};

export type PlacementItem = {
  n: number;
  level: string;
  ref: string;
  word: string;
  cellId: string;
  pattern: string;
  correct: string;
  distractors: string[];
};

export type PlacementFile = {
  version: string;
  noEnglishGlosses?: boolean;
  items: PlacementItem[];
};

export type PlacementSource = "unset" | "quiz" | "skip" | "chairman";

export type SkipRecord = {
  at: string;
  lessonKey: string;
  itemId: string | null;
};

export type ParadigmProgress = {
  level: LevelId;
  placed: boolean;
  source: PlacementSource;
  boxes: Record<string, number>;
  skips: SkipRecord[];
  updatedAt: string;
};

export function isLevelId(value: string): value is LevelId {
  return (LEVEL_IDS as readonly string[]).includes(value);
}

export const EMPTY_PROGRESS: ParadigmProgress = {
  level: "L1",
  placed: false,
  source: "unset",
  boxes: {},
  skips: [],
  updatedAt: "",
};
