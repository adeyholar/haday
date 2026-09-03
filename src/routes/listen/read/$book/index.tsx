import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListenMenu } from "@/components/listen-menu";
import { Panel } from "@/components/panel";
import { PassagePicker } from "@/components/passage-picker";
import { loadReadingProgress, progressId } from "@/lib/reading";
import { TANAKH_BOOKS, bookMeta, isBookId, isLegacyGenesisParam, type BookId } from "@/lib/tanakh-canon";

export const Route = createFileRoute("/listen/read/$book/")({ component: BookHub });

function BookHub() {
  const { book: raw } = Route.useParams();
  if (raw === "all") return <Navigate to="/listen/read/$book" params={{ book: "Gen" }} />;
  if (isLegacyGenesisParam(raw)) {
    return <Navigate to="/listen/read/$book/$ch" params={{ book: "Gen", ch: raw }} />;
  }
  if (!isBookId(raw)) return <Navigate to="/listen/read" />;
  return <BookChapters book={raw} />;
}

function BookChapters({ book }: { book: BookId }) {
  const meta = bookMeta(book)!;
  const progress = useMemo(() => loadReadingProgress(), []);
  const navigate = useNavigate();
  const [jump, setJump] = useState("");
  const idx = TANAKH_BOOKS.findIndex((b) => b.id === book);
  const prevBook = idx > 0 ? TANAKH_BOOKS[idx - 1] : undefined;
  const nextBook = idx >= 0 ? TANAKH_BOOKS[idx + 1] : undefined;

  function openJump(e: FormEvent) {
    e.preventDefault();
    const n = Number(jump);
    if (!Number.isInteger(n) || n < 1 || n > meta.chapters) return;
    void navigate({ to: "/listen/read/$book/$ch", params: { book, ch: String(n) } });
  }

  return (
    <>
      <Panel className="mb-4">
        <ListenMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <Link to="/listen/read" className="hover:underline">
            Tanakh
          </Link>
          {" · "}
          {meta.section === "torah" ? "Torah" : meta.section === "neviim" ? "Nevi'im" : "Ketuvim"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">{meta.en}</h1>
        <p className="he-word mt-1 text-2xl text-ink" lang="he" dir="rtl">
          {meta.he}
        </p>
        <p className="mt-3 text-muted">
          {meta.chapters} chapter{meta.chapters === 1 ? "" : "s"} · {meta.verses.toLocaleString()} verses. Open a chapter
          to follow the Hebrew recording.
        </p>
        {meta.chapters > 12 ? (
          <form className="mt-4 flex gap-2" onSubmit={openJump}>
            <input
              type="number"
              min={1}
              max={meta.chapters}
              inputMode="numeric"
              placeholder={`1–${meta.chapters}`}
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              aria-label="Chapter number"
              className="min-h-12 w-28 rounded-[var(--radius-md)] bg-surface px-3 text-base font-semibold text-ink shadow-[var(--shadow-border)]"
            />
            <Button type="submit" size="lg">
              Open
            </Button>
          </form>
        ) : null}
        <Link
          to="/listen/read/$book/$ch"
          params={{ book, ch: "1" }}
          search={{ scope: "book" }}
          className="mt-4 flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-ink px-4 text-sm font-semibold text-parchment"
        >
          Play all {meta.chapters} chapters
        </Link>
      </Panel>

      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: meta.chapters }, (_, n) => n + 1).map((ch) => {
          const rec = progress[progressId(book, ch)];
          return (
            <Link
              key={ch}
              to="/listen/read/$book/$ch"
              params={{ book, ch: String(ch) }}
              className={`flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-md)] px-2 text-sm font-semibold ${
                rec?.cleared
                  ? "bg-good text-parchment"
                  : rec
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-ink shadow-[var(--shadow-border)]"
              }`}
            >
              {ch}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        {prevBook ? (
          <Link
            to="/listen/read/$book"
            params={{ book: prevBook.id }}
            className="flex min-h-12 items-center justify-start gap-1 rounded-[var(--radius-md)] bg-card px-3 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
          >
            <ChevronLeft className="size-4 shrink-0" />
            <span className="truncate">{prevBook.en}</span>
          </Link>
        ) : (
          <span />
        )}
        {nextBook ? (
          <Link
            to="/listen/read/$book"
            params={{ book: nextBook.id }}
            className="flex min-h-12 items-center justify-end gap-1 rounded-[var(--radius-md)] bg-card px-3 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
          >
            <span className="truncate">{nextBook.en}</span>
            <ChevronRight className="size-4 shrink-0" />
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div className="mt-6">
        <PassagePicker defaultBook={book} defaultChapter={1} />
      </div>
    </>
  );
}
