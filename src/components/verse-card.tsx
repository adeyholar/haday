import { findEnglishHitRange, findHitRange } from "@/lib/hebrew";
import { verseFor } from "@/lib/verses";
import { tanakhVerseFor } from "@/lib/tanakh-pool";
import type { VocabItem } from "@/lib/vocab";

function MarkedLine({
  text,
  range,
  className,
  lang,
  dir,
}: {
  text: string;
  range: { start: number; end: number } | null;
  className?: string;
  lang?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <p className={className} lang={lang} dir={dir}>
      {range ? (
        <>
          {text.slice(0, range.start)}
          <mark className="he-hit">{text.slice(range.start, range.end)}</mark>
          {text.slice(range.end)}
        </>
      ) : (
        text
      )}
    </p>
  );
}

export function VerseCard({ item, showEnglish = true }: { item: VocabItem; showEnglish?: boolean }) {
  const verse = item?.id ? verseFor(item.id) ?? tanakhVerseFor(item.id) : undefined;
  if (!verse?.he) return null;
  const range = findHitRange(verse.he, verse.hit ?? "");
  const enRange = showEnglish
    ? findEnglishHitRange(verse.en, {
        hitEn: verse.hitEn,
        gloss: item.gloss,
        alts: item.alts,
      })
    : null;

  return (
    <figure className="mt-4 rounded-[var(--radius-lg)] bg-surface/80 px-4 py-3 text-start shadow-[var(--shadow-border)]">
      <figcaption className="text-xs font-semibold uppercase tracking-wide text-muted">
        In the Tanakh · {verse.ref}
      </figcaption>
      {!showEnglish && (
        <p className="mt-1 text-xs font-normal text-muted">Hebrew only — tap the card to reveal English.</p>
      )}
      <MarkedLine className="he-word mt-2 text-xl leading-relaxed" lang="he" dir="rtl" text={verse.he} range={range} />
      {showEnglish && <MarkedLine className="mt-2 text-sm text-muted" lang="en" dir="ltr" text={verse.en} range={enRange} />}
    </figure>
  );
}
