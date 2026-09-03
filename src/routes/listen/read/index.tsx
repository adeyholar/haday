import { useLayoutEffect, useMemo, useState } from "react";
import { Link, createFileRoute, useRouterState } from "@tanstack/react-router";
import { ListenMenu } from "@/components/listen-menu";
import { Panel } from "@/components/panel";
import { PassagePicker } from "@/components/passage-picker";
import { bookClearedCount, loadReadingProgress } from "@/lib/reading";
import {
  SECTIONS,
  TANAKH_BOOKS,
  TANAKH_CHAPTERS,
  TANAKH_VERSES,
  bookMeta,
  booksIn,
  loadLastRead,
} from "@/lib/tanakh-canon";

export const Route = createFileRoute("/listen/read/")({ component: TanakhLibrary });

function TanakhLibrary() {
  const progress = useMemo(() => loadReadingProgress(), []);
  const last = useMemo(() => loadLastRead(), []);
  const lastBook = last ? bookMeta(last.book) : undefined;
  const [q, setQ] = useState("");
  const hash = useRouterState({ select: (s) => s.location.hash });
  const query = q.trim().toLowerCase();
  const filtered = query
    ? TANAKH_BOOKS.filter(
        (b) =>
          b.en.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query) ||
          b.he.includes(q.trim()),
      )
    : null;

  useLayoutEffect(() => {
    const id = hash.replace(/^#/, "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <>
      <Panel className="mb-4">
        <ListenMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Tanakh</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Every book, recorded Hebrew</h1>
        <p className="mt-3 text-muted">
          Torah, Prophets, and Writings — {TANAKH_BOOKS.length} books, {TANAKH_CHAPTERS} chapters,{" "}
          {TANAKH_VERSES.toLocaleString()} verses. Open any book below. The whole canon is here.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {last && lastBook ? (
            <Link
              to="/listen/read/$book/$ch"
              params={{ book: last.book, ch: String(last.chapter) }}
              className="flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-ink px-3 text-center text-sm font-semibold text-parchment"
            >
              Continue {lastBook.en} {last.chapter}
            </Link>
          ) : (
            <Link
              to="/listen/read/$book/$ch"
              params={{ book: "Gen", ch: "1" }}
              className="flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-ink px-3 text-center text-sm font-semibold text-parchment"
            >
              Start Genesis 1
            </Link>
          )}
          <Link
            to="/listen/read/$book/$ch"
            params={{ book: "Gen", ch: "1" }}
            search={{ scope: "all" }}
            className="flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-card px-3 text-center text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
          >
            Play all 39 books
          </Link>
        </div>
        <label className="mt-4 block">
          <span className="sr-only">Find a book</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a book"
            className="min-h-12 w-full rounded-[var(--radius-md)] bg-surface px-3 text-base font-semibold text-ink shadow-[var(--shadow-border)]"
          />
        </label>
      </Panel>

      {filtered ? (
        <section className="mb-6">
          <h2 className="mb-2 font-display text-2xl font-bold text-ink">
            {filtered.length ? "Matches" : "No matching book"}
          </h2>
          <BookGrid books={filtered} progress={progress} />
        </section>
      ) : (
        SECTIONS.map((sec) => (
          <section key={sec.id} id={sec.id} className="mb-6 scroll-mt-20">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl font-bold text-ink">{sec.en}</h2>
              <p className="he-word text-lg text-muted" lang="he" dir="rtl">
                {sec.he}
              </p>
            </div>
            <BookGrid books={booksIn(sec.id)} progress={progress} />
          </section>
        ))
      )}

      <PassagePicker defaultBook={last?.book ?? "Gen"} defaultChapter={last?.chapter ?? 1} />
    </>
  );
}

function BookGrid({
  books,
  progress,
}: {
  books: ReturnType<typeof booksIn>;
  progress: ReturnType<typeof loadReadingProgress>;
}) {
  if (!books.length) return null;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {books.map((b) => {
        const cleared = bookClearedCount(progress, b.id, b.chapters);
        return (
          <li key={b.id}>
            <Link
              to="/listen/read/$book"
              params={{ book: b.id }}
              className="block min-h-24 rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-border)]"
            >
              <p className="he-word text-xl text-ink" lang="he" dir="rtl">
                {b.he}
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">{b.en}</h3>
              <p className="mt-1 text-sm text-muted">
                {b.chapters} chapter{b.chapters === 1 ? "" : "s"} · {b.verses.toLocaleString()} verses
                {cleared ? ` · ${cleared} cleared` : ""}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
