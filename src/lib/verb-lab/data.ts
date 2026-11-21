import geminate from "../../../data/paradigms/weak-geminate.json";
import hollow from "../../../data/paradigms/weak-hollow.json";
import ialeph from "../../../data/paradigms/weak-ialeph.json";
import iguttural from "../../../data/paradigms/weak-iguttural.json";
import iiialeph from "../../../data/paradigms/weak-iiialeph.json";
import iiiguttural from "../../../data/paradigms/weak-iiiguttural.json";
import iiihe from "../../../data/paradigms/weak-iiihe.json";
import inun from "../../../data/paradigms/weak-inun.json";
import iwaw from "../../../data/paradigms/weak-iwaw.json";
import strongVerbFile from "../../../data/paradigms/strong-verb.json";

export const WEAK_CLASS_IDS = [
  "I-Nun",
  "I-Guttural",
  "I-Aleph",
  "III-Guttural",
  "III-Aleph",
  "III-He",
  "I-Waw/I-Yod",
  "Hollow",
  "Geminate",
] as const;

export type WeakClassId = (typeof WEAK_CLASS_IDS)[number];

export type ClassId = "strong" | WeakClassId;

export type ChartAlternate = {
  form: string;
  status: string;
  exampleRef?: string | null;
  exampleWord?: string | null;
  displayMark?: string;
  parseEligible?: boolean;
};

export type ChartCell = {
  id: string;
  binyan: string;
  conjugation: string;
  pgn: string;
  form: string;
  status: string;
  exampleRef?: string | null;
  exampleWord?: string | null;
  displayMark?: string;
  parseEligible?: boolean;
  alternates?: ChartAlternate[];
  subtype?: string;
  note?: string;
};

export type VerbChartFile = {
  root: string;
  rootNote?: string;
  notes?: Record<string, string>;
  cells: ChartCell[];
  noFormSlots?: { binyan: string; conjugation: string }[];
};

export type WeakClassMeta = {
  id: WeakClassId;
  subtitle: string;
};

/** English name, then the Peh / Ayin / Lamed name. Order is the teaching order. */
export const WEAK_CLASSES: readonly WeakClassMeta[] = [
  { id: "I-Nun", subtitle: "Peh-Nun" },
  { id: "I-Guttural", subtitle: "Peh-Guttural" },
  { id: "I-Aleph", subtitle: "Pe-Aleph" },
  { id: "III-Guttural", subtitle: "Lamed-Guttural" },
  { id: "III-Aleph", subtitle: "Lamed-Aleph" },
  { id: "III-He", subtitle: "Lamed-He" },
  { id: "I-Waw/I-Yod", subtitle: "Peh-Waw / Peh-Yod" },
  { id: "Hollow", subtitle: "Ayin-Vav / Ayin-Yod" },
  { id: "Geminate", subtitle: "Ayin-Ayin" },
];

export const CLASS_IDS: readonly ClassId[] = ["strong", ...WEAK_CLASS_IDS];

function asFile(value: unknown): VerbChartFile {
  return value as VerbChartFile;
}

export const VERB_FILES: Record<ClassId, VerbChartFile> = {
  strong: asFile(strongVerbFile),
  "I-Nun": asFile(inun),
  "I-Guttural": asFile(iguttural),
  "I-Aleph": asFile(ialeph),
  "III-Guttural": asFile(iiiguttural),
  "III-Aleph": asFile(iiialeph),
  "III-He": asFile(iiihe),
  "I-Waw/I-Yod": asFile(iwaw),
  Hollow: asFile(hollow),
  Geminate: asFile(geminate),
};

export function isClassId(value: string): value is ClassId {
  return (CLASS_IDS as readonly string[]).includes(value);
}

export function isWeakClassId(value: string): value is WeakClassId {
  return (WEAK_CLASS_IDS as readonly string[]).includes(value);
}

export const STANDARD_MARK = "standard form, not in the Bible";
