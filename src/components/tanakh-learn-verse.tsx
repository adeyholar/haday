import { findEnglishHitRange, findHitRange } from "@/lib/hebrew";
import { learnNugget } from "@/lib/tanakh-learn-nugget";
import {
  learnVerseExplain,
  type LearnKind,
  type LearnSample,
  type LearnVerse,
} from "@/lib/tanakh-learn-note";

export function TanakhLearnVerse({
  verse,
  kind,
  samples = [],
}: {
  verse: LearnVerse;
  kind: LearnKind;
  samples?: LearnSample[];
}) {
  const heRange = findHitRange(verse.he, verse.hit);
  const explained = learnVerseExplain(verse, kind, samples);
  const nugget = learnNugget(kind, verse);
  const enRange = findEnglishHitRange(verse.en, {
    hitEn: verse.hitEn,
    gloss: explained.lemmaGloss,
  });

  return (
    <li className="rounded-[var(--radius-md)] bg-surface px-3 py-3">
      <p className="text-sm font-semibold text-muted">{verse.ref}</p>
      <p className="he-word mt-3 text-2xl leading-relaxed" dir="rtl" lang="he">
        {heRange ? (
          <>
            {verse.he.slice(0, heRange.start)}
            <mark className="he-hit">{verse.he.slice(heRange.start, heRange.end)}</mark>
            {verse.he.slice(heRange.end)}
          </>
        ) : (
          verse.he
        )}
      </p>
      <p className="mt-2 text-sm text-muted" lang="en" dir="ltr">
        {enRange ? (
          <>
            {verse.en.slice(0, enRange.start)}
            <mark className="he-hit">{verse.en.slice(enRange.start, enRange.end)}</mark>
            {verse.en.slice(enRange.end)}
          </>
        ) : (
          verse.en
        )}
      </p>
      <p className="mt-3 text-sm text-ink">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Lemma</span>
        <span className="he-word ms-2 text-xl" dir="rtl" lang="he">
          {explained.lemmaHe}
        </span>
        {explained.lemmaGloss ? <span> · {explained.lemmaGloss}</span> : null}
        {explained.lemmaTranslit ? <span className="text-muted"> · {explained.lemmaTranslit}</span> : null}
      </p>
      <p className="mt-1 text-sm text-muted">{explained.note}</p>
      <p className="mt-3 border-s-2 border-primary ps-3 text-sm text-ink">{nugget}</p>
    </li>
  );
}
