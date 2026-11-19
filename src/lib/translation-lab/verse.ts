import { lettersOnly } from "@/lib/hebrew";
import raw from "../../../data/translation-lab/gen-1-3.json";

export const LAB_PARTICLES = ["ו", "אֵת", "כִּי", "לֹא", "מִן", "בְּ"] as const;
export type LabParticle = (typeof LAB_PARTICLES)[number];
export type LabRole = "subject" | "verb" | "object" | "particle";
export type LabPath = "bbh" | "iibs";
export type LabStep = "read" | "chunk" | "say" | "assemble" | "look";

export type LabWord = {
  n: number;
  id: string;
  surface: string;
  trailer: string;
  lemma: string;
  morph: string;
  consonants: string;
};

export type LabChunk = {
  id: string;
  words: number[];
  /** One role per word, in word order. A maqqef group stays one chunk. */
  roles: LabRole[];
  particles: LabParticle[];
  literal: string;
  smooth: string;
  wrong: [string, string];
  wrongSource: [string, string];
};

export type LabReadings = { ylt: string; web: string; jps: string };

export type LabVerse = {
  ref: string;
  book: string;
  chapter: number;
  verse: number;
  oshb: string;
  dataset: string;
  text: string;
  words: LabWord[];
  chunks: LabChunk[];
  readings: LabReadings;
};

const MAQAF = "־";

function asVerse(input: typeof raw): LabVerse {
  return input as LabVerse;
}

export const GEN_1_3: LabVerse = asVerse(raw);

export function nfcHebrew(text: string): string {
  return text.normalize("NFC");
}

export function wordFace(word: LabWord): string {
  return nfcHebrew(word.surface);
}

/** OSHB groups. A maqqef trailer binds this word to the next. Never split one. */
export function maqafGroups(verse: LabVerse = GEN_1_3): LabWord[][] {
  const groups: LabWord[][] = [];
  for (let i = 0; i < verse.words.length; i += 1) {
    const word = verse.words[i];
    const next = verse.words[i + 1];
    if (word && next && word.trailer.includes(MAQAF)) {
      groups.push([word, next]);
      i += 1;
    } else if (word) {
      groups.push([word]);
    }
  }
  return groups;
}

export function chunkById(id: string, verse: LabVerse = GEN_1_3): LabChunk | undefined {
  return verse.chunks.find((chunk) => chunk.id === id);
}

export function chunkWords(chunk: LabChunk, verse: LabVerse = GEN_1_3): LabWord[] {
  return chunk.words.map((n) => {
    const word = verse.words.find((item) => item.n === n);
    if (!word) throw new Error(`Missing OSHB word ${verse.ref}#${n}`);
    return word;
  });
}

/** Hebrew of one chunk. A maqqef group is drawn with the maqqef, not a space. */
export function chunkHebrew(chunk: LabChunk, verse: LabVerse = GEN_1_3): string {
  const words = chunkWords(chunk, verse);
  return words
    .map((word, index) => wordFace(word) + (index < words.length - 1 ? word.trailer : ""))
    .join("");
}

export function verseHebrew(verse: LabVerse = GEN_1_3): string {
  return nfcHebrew(verse.text);
}

export function hasDivineName(hebrew: string): boolean {
  return lettersOnly(hebrew).includes("יהוה");
}
