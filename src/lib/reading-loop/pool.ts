import { iibsPathItems } from "@/lib/iibs-weeks";
import { VOCAB, type VocabItem } from "@/lib/vocab";
import type { StudyScope } from "@/lib/reading-loop/passage";

/** Grammar Path drills BBH lemmas. Scripture Path drills the level lists. */
export function poolFor(scope: StudyScope): VocabItem[] {
  return scope === "iibs" ? iibsPathItems() : VOCAB;
}
