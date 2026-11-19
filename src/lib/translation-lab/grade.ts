import { ADONAI_NOTE } from "@/lib/translation-lab/credits";
import {
  chunkById,
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
  role: LabRole;
  particles: readonly string[];
};

function sameParticles(marked: readonly string[], expected: readonly LabParticle[]): boolean {
  if (marked.length !== expected.length) return false;
  const have = [...marked].sort();
  const need = [...expected].sort();
  return have.every((item, index) => item === need[index]);
}

/** Role and particles. A miss comes back. A right chunk stays put. */
export function gradeChunks(marks: readonly ChunkMark[], verse: LabVerse = GEN_1_3): { ok: boolean; missed: string[] } {
  const missed: string[] = [];
  for (const chunk of verse.chunks) {
    const mark = marks.find((item) => item.id === chunk.id);
    if (!mark || mark.role !== chunk.role || !sameParticles(mark.particles, chunk.particles)) missed.push(chunk.id);
  }
  return { ok: missed.length === 0, missed };
}

/** Literal and smooth are both accepted. The two wrong senses are not. */
export function sayAccepted(chunk: LabChunk, choice: string): boolean {
  const text = choice.trim();
  return text === chunk.literal || text === chunk.smooth;
}

export function gradeSay(chunkId: string, choice: string, verse: LabVerse = GEN_1_3): boolean {
  const chunk = chunkById(chunkId, verse);
  if (!chunk) return false;
  return sayAccepted(chunk, choice);
}

/** Three tiles: the literal gloss and the two sourced wrong senses. */
export function sayChoices(chunk: LabChunk): [string, string, string] {
  return [chunk.wrong[0], chunk.literal, chunk.wrong[1]];
}

export function acceptedOrders(verse: LabVerse = GEN_1_3): string[][] {
  return [verse.chunks.map((chunk) => chunk.literal), verse.chunks.map((chunk) => chunk.smooth)];
}

export function gradeAssemble(order: readonly string[], verse: LabVerse = GEN_1_3): boolean {
  return acceptedOrders(verse).some(
    (accepted) => accepted.length === order.length && accepted.every((tile, index) => tile === order[index]),
  );
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

/** Published English waits for Look. A Grammar Path gloss waits for a tap. */
export function publishedEnglishVisible(step: LabStep): boolean {
  return step === "look";
}

export function glossVisible(path: LabPath, englishTapped: boolean): boolean {
  if (path === "bbh") return englishTapped;
  return true;
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
