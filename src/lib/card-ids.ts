import { VOWELS, WRITE_LETTERS } from "@/lib/alphabet";
import { iibsLegacyId, iibsStudyIdSet } from "@/lib/iibs-weeks";
import { hydrateCard, type CardState } from "@/lib/srs";
import { VOCAB, alphabetVocab } from "@/lib/vocab";
import { term2ById } from "@/lib/vocab-s2";

const vocabIds = new Set(VOCAB.map((item) => item.id));
const known = new Set<string>([...vocabIds, ...alphabetVocab().map((item) => item.id)]);
const letters = new Set(WRITE_LETTERS.map((item) => item.id));
const vowels = new Set(VOWELS.map((item) => item.id));

/** A study card the class actually uses. Junk keys are refused. Aleph-bet and Tanakh forms are kept. */
export function isStudyCardId(id: string): boolean {
  if (known.has(id)) return true;
  if (id.startsWith("alef:letter:")) return letters.has(id.slice("alef:letter:".length));
  if (id.startsWith("alef:vowel:")) return vowels.has(id.slice("alef:vowel:".length));
  if (/^iibs-[a-e]-[0-9a-z]+$/.test(id)) return iibsStudyIdSet().has(id);
  if (id.startsWith("s2-")) return Boolean(term2ById(id));
  const form = /^tv:([a-z0-9-]+):(\d{1,4})$/.exec(id);
  return Boolean(form && vocabIds.has(form[1]));
}

export function keepStudyCards(cards: Record<string, Partial<CardState> | CardState> | null | undefined): Record<string, CardState> {
  const kept: Record<string, CardState> = {};
  if (!cards || typeof cards !== "object") return kept;
  for (const [id, card] of Object.entries(cards)) {
    const nextId = iibsLegacyId(id) ?? id;
    if (!isStudyCardId(nextId)) continue;
    const next = hydrateCard(card);
    const prev = kept[nextId];
    if (!prev || next.reps >= prev.reps) kept[nextId] = next;
  }
  return kept;
}
