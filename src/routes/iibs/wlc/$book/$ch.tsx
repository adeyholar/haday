import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { WlcReading } from "@/components/wlc-desk";
import { ScriptureTabs } from "@/components/iibs-door";
import { bookMeta, isBookId, parseChapter } from "@/lib/tanakh-canon";
import { loadWlcChapter } from "@/lib/wlc-server";
import type { WlcChapter } from "@/lib/wlc";

export const Route = createFileRoute("/iibs/wlc/$book/$ch")({
  component: WlcChapterPage,
});

function WlcChapterPage() {
  const { book, ch } = Route.useParams();
  const navigate = useNavigate();
  const meta = isBookId(book) ? bookMeta(book) : undefined;
  const chapterNo = meta ? parseChapter(ch, meta.chapters) : null;
  const [chapter, setChapter] = useState<WlcChapter | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!meta || chapterNo == null) return;
    let cancelled = false;
    setChapter(null);
    setError("");
    loadWlcChapter({ data: { book: meta.id, chapter: chapterNo } })
      .then((next) => {
        if (!cancelled) setChapter(next);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not open the chapter.");
      });
    return () => {
      cancelled = true;
    };
  }, [chapterNo, meta]);

  if (!meta || chapterNo == null) {
    return (
      <p className="text-sm text-danger">
        That chapter is not in the Tanakh. <Link to="/iibs/wlc">Back to the books.</Link>
      </p>
    );
  }
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!chapter) return <p className="text-sm text-muted">Opening the chapter.</p>;

  const prev = chapterNo > 1 ? chapterNo - 1 : null;
  const next = chapterNo < meta.chapters ? chapterNo + 1 : null;
  const go = (n: number) => {
    navigate({ to: "/iibs/wlc/$book/$ch", params: { book: meta.id, ch: String(n) } });
  };

  return (
    <>
      <ScriptureTabs active="lab" />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Reading Lab</p>
          <h1 className="font-display text-3xl font-bold text-ink">
            {meta.en} {chapterNo}
          </h1>
          <p className="he-word text-xl text-muted" dir="rtl" lang="he">
            {meta.he}
          </p>
        </div>
        <Link to="/iibs/wlc" className="inline-flex min-h-11 items-center font-semibold text-primary">
          Books
        </Link>
      </div>
      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {prev ? (
          <button
            type="button"
            onClick={() => go(prev)}
            className="flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-card px-3 font-semibold text-ink shadow-[var(--shadow-border)]"
          >
            Prev
          </button>
        ) : (
          <span />
        )}
        <label className="sr-only" htmlFor="wlc-chapter">
          Chapter
        </label>
        <select
          id="wlc-chapter"
          className="min-h-11 rounded-[var(--radius-md)] bg-surface px-3 text-base font-semibold text-ink shadow-[var(--shadow-border)]"
          value={String(chapterNo)}
          onChange={(event) => go(Number(event.target.value))}
        >
          {Array.from({ length: meta.chapters }, (_, index) => (
            <option key={index + 1} value={String(index + 1)}>
              {index + 1}
            </option>
          ))}
        </select>
        {next ? (
          <button
            type="button"
            onClick={() => go(next)}
            className="flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-ink px-3 font-semibold text-parchment"
          >
            Next
          </button>
        ) : (
          <span />
        )}
      </div>
      <WlcReading chapter={chapter} />
    </>
  );
}
