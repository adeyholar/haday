import { useEffect, useState } from "react";
import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { StudyMenu } from "@/components/study-menu";
import { dealFinderDeck } from "@/lib/finder-deal";
import { fetchTanakhBook, isBookId } from "@/lib/tanakh-canon";
import { hatufWhy, markFormInVerse, parseRef, prettyRef, type QueryForm } from "@/lib/tanakh-query";
import { parseFinderSearch } from "@/lib/finder-search";
import { englishKeysForWord } from "@/lib/word-card";
import { EnglishVerse } from "@/components/english-verse";
import type { TanakhQueryResult } from "@/lib/tanakh-query-server";

export const Route = createFileRoute("/finder/deck")({
  validateSearch: parseFinderSearch,
  component: FinderDeckPage,
});

function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : "";
  if (/ENOENT|not on this host|query-index/i.test(raw)) {
    return "The Tanakh card index is not on this host yet. After the next deploy, deal again.";
  }
  return raw || "Could not deal this deck.";
}

function FinderDeckPage() {
  const { q, n } = Route.useSearch();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TanakhQueryResult | null>(null);
  const [card, setCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [verse, setVerse] = useState<{ he: string; en: string } | null>(null);

  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    setBusy(true);
    setError(null);
    setResult(null);
    setCard(0);
    setFlipped(false);
    void dealFinderDeck(q, n)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, n]);

  const item: QueryForm | null = result?.items[card] ?? null;
  const loc = item?.r[0] ? parseRef(item.r[0]) : null;
  const canOpen = Boolean(loc && isBookId(loc.book));

  useEffect(() => {
    if (!flipped || !loc || !isBookId(loc.book)) {
      setVerse(null);
      return;
    }
    let cancelled = false;
    void fetchTanakhBook(loc.book).then((dump) => {
      if (cancelled) return;
      const row = dump.chapters[loc.ch]?.find((v) => v.v === Number(loc.v));
      setVerse(row ? { he: row.he, en: row.en } : null);
    });
    return () => {
      cancelled = true;
    };
  }, [flipped, loc?.book, loc?.ch, loc?.v]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight" && result) {
        e.preventDefault();
        setCard((c) => Math.min(result.items.length - 1, c + 1));
        setFlipped(false);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCard((c) => Math.max(0, c - 1));
        setFlipped(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result]);

  if (!q) return <Navigate to="/finder" />;

  if (busy) {
    return (
      <>
        <StudyMenu />
        <Panel className="mt-4">
          <p className="text-sm text-muted">Dealing the deck…</p>
        </Panel>
      </>
    );
  }

  if (error) {
    return (
      <>
        <StudyMenu />
        <Panel className="mt-4">
          <h1 className="font-display text-3xl font-bold text-ink">Tanakh cards</h1>
          <p className="mt-3 text-sm text-danger">{error}</p>
          <Link to="/finder" className="mt-4 inline-block font-semibold text-primary">
            Pick another grammar
          </Link>
        </Panel>
      </>
    );
  }

  if (!result || !item) {
    return (
      <>
        <StudyMenu />
        <Panel className="mt-4">
          <h1 className="font-display text-3xl font-bold text-ink">No cards</h1>
          <p className="mt-3 text-sm text-muted">Nothing in the Tanakh matched “{q}”.</p>
          <Link to="/finder" className="mt-4 inline-block font-semibold text-primary">
            Pick another grammar
          </Link>
        </Panel>
      </>
    );
  }

  const last = card + 1 >= result.items.length;

  return (
    <>
      <StudyMenu />
      <Panel className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Tanakh cards</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-ink">{result.label}</h1>
            <p className="text-sm text-muted">
              {card + 1} of {result.items.length}
              {result.total > result.items.length ? ` · ${result.total} forms in the corpus` : ""}
            </p>
          </div>
          <Link to="/finder" className="text-sm font-semibold text-primary">
            New deck
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="finder-flash mt-5 w-full rounded-[var(--radius-lg)] bg-parchment px-4 py-8 text-center shadow-[var(--shadow-border)]"
        >
          <p className="he-word text-5xl leading-tight text-ink sm:text-6xl" dir="rtl" lang="he">
            {item.w}
          </p>
          {!flipped ? (
            <p className="mt-6 text-sm font-semibold text-muted">
              {item.w.includes("־") ? "Tap to flip · why this is unaccented" : "Tap to flip · see the verse"}
            </p>
          ) : (
            <div className="mt-6 space-y-3 text-start">
              {hatufWhy(item.w) && (result.parsed.kind === "hatuf" || item.t.includes("hatuf")) ? (
                <p className="text-sm text-ink">{hatufWhy(item.w)}</p>
              ) : null}
              {result.parsed.kind === "fs" ? (
                <p className="text-sm text-ink">Feminine singular noun. The ָ ה or ת ending is on the highlighted word.</p>
              ) : null}
              <p className="text-xs text-muted">{item.n}× in the Tanakh</p>
              {loc ? <p className="text-sm font-semibold text-ink">{prettyRef(item.r[0] ?? "")}</p> : null}
              {verse ? (
                <>
                  <p className="he-verse he-word text-xl leading-relaxed text-ink" dir="rtl" lang="he">
                    {markFormInVerse(verse.he, item.w).map((tok, i) => (
                      <span key={`${tok.word}-${i}`} className={tok.hit ? "he-spoken" : undefined}>
                        {tok.word}
                      </span>
                    ))}
                  </p>
                  <EnglishVerse
                    en={verse.en}
                    keys={englishKeysForWord(item.w)}
                    className="text-sm leading-relaxed text-ink"
                  />
                </>
              ) : (
                <p className="text-sm text-muted">Loading the verse…</p>
              )}
            </div>
          )}
        </button>

        {flipped && canOpen && loc && isBookId(loc.book) ? (
          <Link
            to="/listen/read/$book/$ch"
            params={{ book: loc.book, ch: loc.ch }}
            search={{ v1: Number(loc.v) }}
            className="mt-3 flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-ink px-4 text-sm font-semibold text-parchment"
          >
            Open this verse in Tanakh
          </Link>
        ) : null}

        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={card === 0}
            onClick={() => {
              setCard((c) => Math.max(0, c - 1));
              setFlipped(false);
            }}
          >
            Back
          </Button>
          {last ? (
            <Link
              to="/finder"
              className="flex flex-1 items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              New grammar
            </Link>
          ) : (
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                if (!flipped) {
                  setFlipped(true);
                  return;
                }
                setCard((c) => c + 1);
                setFlipped(false);
              }}
            >
              {flipped ? "Next card" : "Flip"}
            </Button>
          )}
        </div>
      </Panel>
    </>
  );
}
