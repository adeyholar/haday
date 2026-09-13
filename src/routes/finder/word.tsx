import { useEffect, useState } from "react";
import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { StudyMenu } from "@/components/study-menu";
import { dealWordPassages } from "@/lib/finder-deal";
import { parseWordSearch, WORD_PAGE, WORD_SCOPES } from "@/lib/finder-search";
import { isBookId, bookMeta } from "@/lib/tanakh-canon";
import { parseRef } from "@/lib/tanakh-query";
import { markQueryInVerse } from "@/lib/tanakh-word";
import { classLemmaForWord, englishKeysForWord, hasGlossInEnglish } from "@/lib/word-card";
import { shortGloss } from "@/lib/tanakh-learn-note";
import { EnglishVerse } from "@/components/english-verse";
import { cn } from "@/lib/cn";
import type { WordPassageResult } from "@/lib/tanakh-query-server";

export const Route = createFileRoute("/finder/word")({
  validateSearch: parseWordSearch,
  component: FinderWordPage,
});

function cite(ref: string): string {
  const loc = parseRef(ref);
  const name = bookMeta(loc.book)?.en ?? loc.book;
  return `${name} ${loc.ch}:${loc.v}`;
}

function FinderWordPage() {
  const { q, scope, page } = Route.useSearch();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WordPassageResult | null>(null);

  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    setBusy(true);
    setError(null);
    const offset = (page - 1) * WORD_PAGE;
    void dealWordPassages(q, scope, offset, WORD_PAGE)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not search.");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, scope, page]);

  if (!q) return <Navigate to="/finder" />;

  const lemma = classLemmaForWord(q);
  const pages = result ? Math.max(1, Math.ceil(result.total / WORD_PAGE)) : 1;
  const from = result ? result.offset + 1 : 0;
  const to = result ? result.offset + result.items.length : 0;

  return (
    <>
      <StudyMenu />
      <Panel className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Find a Hebrew word</p>
            <h1 className="he-word mt-1 text-4xl font-bold text-ink" dir="rtl" lang="he">
              {q}
            </h1>
            {lemma ? (
              <p className="mt-1 text-sm text-ink">
                Class vocab · Ch. {lemma.chapter}: {shortGloss(lemma.gloss)}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-muted">
              {busy
                ? "Searching the Tanakh…"
                : result
                  ? `${result.total.toLocaleString()} verse${result.total === 1 ? "" : "s"}`
                  : ""}
            </p>
          </div>
          <Link to="/finder" className="text-sm font-semibold text-primary">
            New search
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {WORD_SCOPES.map((s) => (
            <Link
              key={s.id}
              to="/finder/word"
              search={{ q, scope: s.id, page: 1 }}
              className={cn(
                "flex min-h-11 items-center rounded-[var(--radius-md)] px-4 text-sm font-semibold shadow-[var(--shadow-border)]",
                scope === s.id ? "bg-ink text-parchment" : "bg-surface text-ink",
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        {!busy && result && result.total === 0 ? (
          <p className="mt-4 text-sm text-muted">No verse in this range uses that spelling.</p>
        ) : null}

        <ul className="mt-5 space-y-3">
          {result?.items.map((row) => {
            const loc = parseRef(row.ref);
            const keys = englishKeysForWord(q);
            const enHit = hasGlossInEnglish(row.en, keys);
            return (
              <li
                key={row.ref}
                className="rounded-[var(--radius-lg)] bg-parchment px-4 py-4 text-start shadow-[var(--shadow-border)]"
              >
                <p className="text-sm font-semibold text-ink">{cite(row.ref)}</p>
                <p className="he-verse he-word mt-2 text-xl leading-relaxed text-ink" dir="rtl" lang="he">
                  {markQueryInVerse(row.he, q).map((tok, i) => (
                    <span key={`${tok.word}-${i}`} className={tok.hit ? "he-spoken" : undefined}>
                      {tok.word}{" "}
                    </span>
                  ))}
                </p>
                <EnglishVerse en={row.en} keys={keys} className="mt-2 text-sm leading-relaxed text-ink" />
                {!enHit && lemma ? (
                  <p className="mt-1 text-xs text-muted">Class gloss: {shortGloss(lemma.gloss)}</p>
                ) : null}
                {isBookId(loc.book) ? (
                  <Link
                    to="/listen/read/$book/$ch"
                    params={{ book: loc.book, ch: loc.ch }}
                    search={{ v1: Number(loc.v) }}
                    className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary"
                  >
                    Open in Tanakh
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>

        {result && result.total > WORD_PAGE ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {from}–{to} of {result.total.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <Link
                to="/finder/word"
                search={{ q, scope, page: Math.max(1, page - 1) }}
                className={cn(
                  "flex min-h-11 items-center rounded-[var(--radius-md)] px-4 text-sm font-semibold shadow-[var(--shadow-border)]",
                  page <= 1 ? "pointer-events-none opacity-40" : "bg-surface text-ink",
                )}
              >
                Previous
              </Link>
              <Link
                to="/finder/word"
                search={{ q, scope, page: Math.min(pages, page + 1) }}
                className={cn(
                  "flex min-h-11 items-center rounded-[var(--radius-md)] px-4 text-sm font-semibold shadow-[var(--shadow-border)]",
                  page >= pages ? "pointer-events-none opacity-40" : "bg-ink text-parchment",
                )}
              >
                Next
              </Link>
            </div>
          </div>
        ) : null}

        {result && result.total > 0 ? (
          <Link
            to="/finder/deck"
            search={{ q, n: 10 }}
            className="mt-4 flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-surface px-4 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
          >
            Deal 10 of these as cards
          </Link>
        ) : null}

        <Link
          to="/finder"
          className="mt-3 flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-card px-4 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
        >
          Back to Tanakh cards
        </Link>
      </Panel>
    </>
  );
}
