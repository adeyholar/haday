import { LEARN_WHY, learnWhyKey } from "@/lib/tanakh-learn-why";
import { foldFinals, lettersOnly } from "@/lib/hebrew";
import { lemmaForSurface } from "@/lib/tanakh-pool";
import { verseFor } from "@/lib/verses";
import { VOCAB, type VocabItem } from "@/lib/vocab";

export type LearnKind = "article" | "noun" | "syllable";

export type LearnSample = {
  word: string;
  note?: string;
  gloss?: string;
  tag?: string;
  split?: string;
  ref?: string;
};

export type LearnVerse = {
  ref: string;
  he: string;
  en: string;
  hit: string;
  hitEn?: string;
  why?: string;
  /** Pin to a BBH lemma when the surface is inflected or a homograph. */
  vocabId?: string;
};

function letters(s: string): string {
  return foldFinals(lettersOnly(s));
}

function shortGloss(raw: string): string {
  return raw.split(/[;,]/)[0]?.replace(/\s+/g, " ").trim() ?? "";
}

export { shortGloss };

export function matchingSample(verse: LearnVerse, samples: LearnSample[] = []): LearnSample | undefined {
  const hit = letters(verse.hit);
  if (!hit) return undefined;
  return (
    samples.find((s) => letters(s.word) === hit) ||
    samples.find((s) => {
      const w = letters(s.word);
      return w.length >= 2 && (hit.endsWith(w) || w.endsWith(hit));
    }) ||
    samples.find((s) => s.ref === verse.ref)
  );
}

/** BBH lemmas that appear in this Hebrew line — same words students drill in Game. */
export function classVocabInText(he: string): VocabItem[] {
  const seen = new Set<string>();
  const out: VocabItem[] = [];
  for (const chunk of he.split(/[\s,;:.!?]+/)) {
    if (!chunk) continue;
    for (const part of chunk.split(/[־–—]/)) {
      const surface = part.replace(/[־–—]$/, "");
      if (letters(surface).length < 2) continue;
      const v = lemmaForSurface(surface);
      if (!v || seen.has(v.id)) continue;
      seen.add(v.id);
      out.push(v);
    }
  }
  return out.sort((a, b) => a.chapter - b.chapter || b.freq - a.freq);
}

function pinVocab(verse: LearnVerse): LearnVerse {
  if (verse.vocabId) return verse;
  const lemma = lemmaForSurface(verse.hit);
  return lemma ? { ...verse, vocabId: lemma.id } : verse;
}

/**
 * Unit verses, each pinned to class vocab when possible, plus the canonical
 * Tanakh verse for each sample lemma so the same BBH words keep showing up.
 */
export function learnUnitVerses(verses: LearnVerse[], samples: LearnSample[] = [], extraCap = 4): LearnVerse[] {
  const base = verses.map(pinVocab);
  const seen = new Set(base.map((v) => `${v.ref}|${letters(v.hit)}`));
  const extra: LearnVerse[] = [];
  for (const s of samples) {
    if (extra.length >= extraCap) break;
    const lemma = lemmaForSurface(s.word);
    if (!lemma) continue;
    const vx = verseFor(lemma.id);
    if (!vx?.he) continue;
    const key = `${vx.ref}|${letters(vx.hit)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    extra.push({ ...vx, vocabId: lemma.id });
  }
  return [...base, ...extra];
}

export function learnVerseExplain(
  verse: LearnVerse,
  kind: LearnKind,
  samples: LearnSample[] = [],
): {
  lemmaHe: string;
  lemmaGloss: string;
  lemmaTranslit?: string;
  note: string;
  chapter?: number;
  vocabId?: string;
} {
  const pinned = verse.vocabId ? VOCAB.find((v) => v.id === verse.vocabId) : undefined;
  const lemma = pinned ?? lemmaForSurface(verse.hit);
  const sample = matchingSample(verse, samples);
  const lemmaHe = lemma?.hebrew ?? sample?.word ?? verse.hit;
  const lemmaGloss = shortGloss(lemma?.gloss ?? sample?.gloss ?? verse.hitEn ?? "");
  const lemmaTranslit = lemma?.translit;
  const named = lemmaGloss ? `${lemmaHe} “${lemmaGloss}”` : lemmaHe;
  const passage = LEARN_WHY[learnWhyKey(kind, verse.ref, verse.hit)] ?? verse.why;

  const meta = {
    lemmaHe,
    lemmaGloss,
    lemmaTranslit,
    chapter: lemma?.chapter,
    vocabId: lemma?.id,
  };

  if (passage) return { ...meta, note: passage };

  const hitL = letters(verse.hit);
  const lemL = letters(lemmaHe);
  const prefixed = Boolean(hitL && lemL && hitL !== lemL && hitL.endsWith(lemL));

  let note = "";
  if (kind === "syllable") {
    const split = sample?.split ? `Split ${sample.split}. ` : "";
    note =
      split +
      (sample?.note ??
        "Count the vowels in the marked word. One vowel per syllable: open ends in a vowel, closed in a consonant.");
  } else if (kind === "article") {
    if (sample?.note) note = sample.note;
    else if (prefixed && hitL.startsWith("ה")) {
      note = `The marked word is the article on ${named}. Strip the ה and any doubling, then look the noun up in a lexicon as the citation form.`;
    } else if (prefixed && hitL.startsWith("ו")) {
      note = `The marked word is the conjunction וְ on ${named}. Strip the vav to find the citation form.`;
    } else if (lemma?.pos === "name") {
      note = `${named} is a proper name. Names are definite without הַ.`;
    } else {
      note = `${named} is the citation lemma here — no article. Hebrew has no “a,” so a bare noun is indefinite unless a name or a suffix makes it definite.`;
    }
  } else if (sample?.note) {
    note = sample.tag ? `${sample.tag}. ${sample.note}` : sample.note;
  } else {
    note = `${named} wears the ending you are learning. Name gender and number from that ending, then look the word up in the singular.`;
  }

  return { ...meta, note };
}
