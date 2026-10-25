import { useEffect, useId, useState } from "react";
import { explainMorph } from "@/lib/morph-parse";
import { parseOshbLemma, prefixLabel } from "@/lib/oshb-lemma";
import { lookupStrong, type StrongEntry } from "@/lib/strongs";

function strongLabel(strong: string, aug: string | null): string {
  return aug ? `${strong} ${aug}` : strong;
}

function StrongBlock({ id, aug }: { id: string; aug: string | null }) {
  const [row, setRow] = useState<StrongEntry | null | undefined>(undefined);
  const [more, setMore] = useState(false);
  const moreId = useId();
  const label = strongLabel(id, aug);

  useEffect(() => {
    let cancelled = false;
    setRow(undefined);
    setMore(false);
    void lookupStrong(id).then((hit) => {
      if (!cancelled) setRow(hit);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <article className="mt-3 rounded-[var(--radius-md)] bg-surface px-3 py-3" aria-label={`Strong's ${label}`}>
      <p className="text-xs font-semibold tracking-[0.16em] text-primary">
        <span className="uppercase">Strong's</span> {label}
      </p>
      {row === undefined ? <p className="mt-2 text-sm text-muted">Opening the lexicon…</p> : null}
      {row === null ? <p className="mt-2 text-sm text-muted">No lexicon entry for {label}.</p> : null}
      {row ? (
        <>
          {row.word ? (
            <p className="he-word mt-2 text-3xl text-ink" dir="rtl" lang="he">
              {row.word}
            </p>
          ) : null}
          {row.translit ? <p className="mt-1 text-sm text-ink">{row.translit}</p> : null}
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Strong's (1894)</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{row.def || "—"}</p>
          {row.kjv ? (
            <>
              <button
                type="button"
                className="mt-2 min-h-11 font-semibold text-primary"
                aria-expanded={more}
                aria-controls={moreId}
                onClick={() => setMore((open) => !open)}
              >
                {more ? "Less" : "More"}
              </button>
              {more ? (
                <p id={moreId} className="mt-1 text-sm leading-relaxed text-muted">
                  KJV: {row.kjv}
                </p>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
      {/* L2 fills this slot from the Brown-Driver-Briggs chunks. No outside link. */}
      <div className="wlc-bdb-slot mt-3 border-t border-border pt-2" data-bdb-slot={label}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">BDB</p>
      </div>
    </article>
  );
}

/** Lexicon under the Reading Lab word card. Strong's now; BDB slot stays empty until the data lands. */
export function WlcLexicon({ lemma, morph }: { lemma: string; morph: string }) {
  const parsed = parseOshbLemma(lemma);
  const parsing = morph ? explainMorph(morph) : "";
  return (
    <section aria-label="Lexicon" className="mt-4 border-t border-border pt-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Lexicon</h2>
      {parsed.prefixes.length ? (
        <p className="mt-2 flex flex-wrap items-center gap-1 text-sm text-ink" aria-label="Prefixes">
          {parsed.prefixes.map((prefix, index) => (
            <span key={`${prefix}-${index}`} className="contents">
              {index ? (
                <span aria-hidden="true" className="text-muted">
                  ·
                </span>
              ) : null}
              <span className="rounded-full bg-surface px-2 py-1">{prefixLabel(prefix)}</span>
            </span>
          ))}
        </p>
      ) : null}
      {parsing ? (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Parsing</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{parsing}</p>
        </>
      ) : null}
      {parsed.parts.length ? (
        parsed.parts.map((part) => <StrongBlock key={strongLabel(part.strong, part.aug)} id={part.strong} aug={part.aug} />)
      ) : (
        <p className="mt-2 text-sm text-muted">No Strong's number on this word.</p>
      )}
    </section>
  );
}
