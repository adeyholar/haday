import { foldFinals, lettersOnly } from "@/lib/hebrew";
import { lemmaForSurface } from "@/lib/tanakh-pool";

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
};

function letters(s: string): string {
  return foldFinals(lettersOnly(s));
}

function shortGloss(raw: string): string {
  return raw.split(/[;,]/)[0]?.replace(/\s+/g, " ").trim() ?? "";
}

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

export function learnVerseExplain(
  verse: LearnVerse,
  kind: LearnKind,
  samples: LearnSample[] = [],
): { lemmaHe: string; lemmaGloss: string; lemmaTranslit?: string; note: string } {
  const lemma = lemmaForSurface(verse.hit);
  const sample = matchingSample(verse, samples);
  const lemmaHe = lemma?.hebrew ?? sample?.word ?? verse.hit;
  const lemmaGloss = shortGloss(lemma?.gloss ?? sample?.gloss ?? verse.hitEn ?? "");
  const lemmaTranslit = lemma?.translit;
  const named = lemmaGloss ? `${lemmaHe} “${lemmaGloss}”` : lemmaHe;

  if (verse.why) return { lemmaHe, lemmaGloss, lemmaTranslit, note: verse.why };

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
    note = `Name the ending on the marked form. Gender and number live there. Look it up as ${named} — the citation form in a Hebrew lexicon.`;
  }

  return { lemmaHe, lemmaGloss, lemmaTranslit, note };
}
