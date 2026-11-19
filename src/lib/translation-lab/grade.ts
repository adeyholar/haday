import { ADONAI_NOTE } from "@/lib/translation-lab/credits";
import {
  chunkById,
  chunkWords,
  hasDivineName,
  maqafGroups,
  type LabChunk,
  type LabParticle,
  type LabPath,
  type LabRole,
  type LabStep,
  type LabVerse,
  GEN_1_3,
} from "@/lib/translation-lab/verse";

export type ChunkMark = {
  id: string;
  roles: readonly LabRole[];
  particles: readonly string[];
};

function sameParticles(marked: readonly string[], expected: readonly LabParticle[]): boolean {
  if (marked.length !== expected.length) return false;
  const have = [...marked].sort();
  const need = [...expected].sort();
  return have.every((item, index) => item === need[index]);
}

/** Last OSHB stem letter. Prefixes such as the conjunction stay in front of it. */
export function stemLetter(morph: string): string {
  const blocks = morph
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  const block = blocks[blocks.length - 1] ?? "";
  const body = block.startsWith("H") || block.startsWith("A") ? block.slice(1) : block;
  const parts = body
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  const stem = parts[parts.length - 1] ?? "";
  return stem[0] ?? "";
}

/** A noun role cannot sit on a verb stem, and a verb role cannot sit on a noun stem. */
export function roleFitsMorph(role: LabRole, morph: string): boolean {
  const stem = stemLetter(morph);
  switch (role) {
    case "verb":
      return stem === "V";
    case "subject":
    case "object":
      return stem === "N";
    case "particle":
      return stem !== "" && stem !== "V" && stem !== "N";
    default: {
      const exhaustive: never = role;
      return exhaustive;
    }
  }
}

function rolesFitWords(roles: readonly LabRole[], morphs: readonly string[]): boolean {
  return roles.length === morphs.length && roles.every((role, index) => roleFitsMorph(role, morphs[index] ?? ""));
}

/** Role per word, plus particles. A key that fights the morph is a miss. */
export function gradeChunks(marks: readonly ChunkMark[], verse: LabVerse = GEN_1_3): { ok: boolean; missed: string[] } {
  const missed: string[] = [];
  for (const chunk of verse.chunks) {
    const morphs = chunkWords(chunk, verse).map((word) => word.morph);
    const mark = marks.find((item) => item.id === chunk.id);
    const keyOk = rolesFitWords(chunk.roles, morphs);
    const markOk =
      keyOk &&
      !!mark &&
      rolesFitWords(mark.roles, morphs) &&
      mark.roles.length === chunk.roles.length &&
      mark.roles.every((role, index) => role === chunk.roles[index]) &&
      sameParticles(mark.particles, chunk.particles);
    if (!markOk) missed.push(chunk.id);
  }
  return { ok: missed.length === 0, missed };
}

/** The chunk literal, plus any extra literal forms. Smooth waits for a later lab. */
export function acceptedGlosses(chunk: LabChunk): readonly string[] {
  return [chunk.literal, ...chunk.also];
}

export function sayAccepted(chunk: LabChunk, choice: string): boolean {
  const text = choice.trim();
  return acceptedGlosses(chunk).some((gloss) => gloss === text);
}

export function gradeSay(chunkId: string, choice: string, verse: LabVerse = GEN_1_3): boolean {
  const chunk = chunkById(chunkId, verse);
  if (!chunk) return false;
  return sayAccepted(chunk, choice);
}

function choiceSeed(id: string): number {
  let seed = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    seed ^= id.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

/** Three tiles. The order is fixed per chunk, and the literal is not always in the middle. */
export function sayChoices(chunk: LabChunk): [string, string, string] {
  const tiles = [chunk.literal, chunk.wrong[0], chunk.wrong[1]];
  let seed = choiceSeed(chunk.id);
  for (let i = tiles.length - 1; i > 0; i -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const swap = tiles[i] ?? chunk.literal;
    tiles[i] = tiles[j] ?? swap;
    tiles[j] = swap;
  }
  const [first, second, third] = tiles;
  if (first === undefined || second === undefined || third === undefined) {
    return [chunk.literal, chunk.wrong[0], chunk.wrong[1]];
  }
  return [first, second, third];
}

export function gradeAssemble(order: readonly string[], verse: LabVerse = GEN_1_3): boolean {
  const accepted = verse.chunks.map((chunk) => chunk.literal);
  return accepted.length === order.length && accepted.every((tile, index) => tile === order[index]);
}

export function assembleTiles(verse: LabVerse = GEN_1_3): { id: string; label: string }[] {
  return [...verse.chunks].reverse().map((chunk) => ({ id: chunk.id, label: chunk.literal }));
}

export function lookReadings(verse: LabVerse = GEN_1_3): { ylt: string; web: string; jps: string; note: string | null } {
  return {
    ylt: verse.readings.ylt,
    web: verse.readings.web,
    jps: verse.readings.jps,
    note: hasDivineName(verse.text) ? ADONAI_NOTE : null,
  };
}

/** Published English waits for Look. */
export function publishedEnglishVisible(step: LabStep): boolean {
  return step === "look";
}

/** Both paths keep the class gloss behind a tap. */
export function glossVisible(path: LabPath, englishTapped: boolean): boolean {
  switch (path) {
    case "bbh":
    case "iibs":
      return englishTapped;
    default: {
      const exhaustive: never = path;
      return exhaustive;
    }
  }
}

/** /iibs/lab hides the Say tiles until a tap. /listen/lab shows them. */
export function sayChoicesVisible(path: LabPath, revealed: boolean): boolean {
  switch (path) {
    case "iibs":
      return revealed;
    case "bbh":
      return true;
    default: {
      const exhaustive: never = path;
      return exhaustive;
    }
  }
}

/** /iibs/lab hides Look until a tap. /listen/lab shows it once the step is Look. */
export function lookEnglishVisible(path: LabPath, step: LabStep, revealed: boolean): boolean {
  if (!publishedEnglishVisible(step)) return false;
  switch (path) {
    case "iibs":
      return revealed;
    case "bbh":
      return true;
    default: {
      const exhaustive: never = path;
      return exhaustive;
    }
  }
}

/** A wrong tile must not be a YLT or WEB reading, or the JPS line. */
export function isPublishedReading(choice: string, verse: LabVerse = GEN_1_3): boolean {
  const text = choice.trim();
  const published = [verse.readings.ylt, verse.readings.web, verse.readings.jps];
  return published.some((line) => line === text);
}

export function chunksFollowMaqaf(verse: LabVerse = GEN_1_3): boolean {
  const groups = maqafGroups(verse).map((group) => group.map((word) => word.n).join(","));
  const chunks = verse.chunks.map((chunk) => chunk.words.join(","));
  return groups.length === chunks.length && groups.every((group, index) => group === chunks[index]);
}
