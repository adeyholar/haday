import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { WlcReading, type SheetSize, type SheetTone } from "@/components/wlc-desk";
import { ScriptureTabs } from "@/components/iibs-door";
import { bookMeta, isBookId, parseChapter } from "@/lib/tanakh-canon";
import { loadWlcChapter } from "@/lib/wlc-server";
import type { WlcChapter } from "@/lib/wlc";

const SHEET_KEY = "haday.wlc.sheet";
const SIZE_KEY = "haday.wlc.size";

const SIZES: { id: SheetSize; label: string }[] = [
  { id: "tight", label: "Tight" },
  { id: "small", label: "Small" },
  { id: "page", label: "Page" },
  { id: "large", label: "Large" },
];

export const Route = createFileRoute("/iibs/wlc/$book/$ch")({
  component: WlcChapterPage,
});

function readSheet(): SheetTone {
  try {
    return window.localStorage.getItem(SHEET_KEY) === "dim" ? "dim" : "light";
  } catch {
    return "light";
  }
}

function readSize(): SheetSize {
  try {
    const saved = window.localStorage.getItem(SIZE_KEY);
    if (saved === "tight" || saved === "small" || saved === "page" || saved === "large") return saved;
  } catch {
    /* keep the page size */
  }
  return "page";
}

function SheetSizeControl({ size, onChange }: { size: SheetSize; onChange: (size: SheetSize) => void }) {
  const face = (on: boolean) =>
    `min-h-11 px-2.5 text-sm font-semibold ${on ? "bg-ink text-parchment" : "text-muted"}`;
  return (
    <div className="flex rounded-[var(--radius-md)] bg-card p-0.5 shadow-[var(--shadow-border)]" role="group" aria-label="Type size in the frame">
      {SIZES.map((row) => (
        <button key={row.id} type="button" className={face(size === row.id)} aria-pressed={size === row.id} onClick={() => onChange(row.id)}>
          {row.label}
        </button>
      ))}
    </div>
  );
}

function SheetLamp({ tone, onChange }: { tone: SheetTone; onChange: (tone: SheetTone) => void }) {
  const face = (on: boolean) =>
    `min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold ${on ? "bg-ink text-parchment" : "text-muted"}`;
  return (
    <div className="flex rounded-[var(--radius-md)] bg-card p-0.5 shadow-[var(--shadow-border)]" role="group" aria-label="Manuscript sheet">
      <button type="button" className={face(tone === "light")} aria-pressed={tone === "light"} onClick={() => onChange("light")}>
        Light
      </button>
      <button type="button" className={face(tone === "dim")} aria-pressed={tone === "dim"} onClick={() => onChange("dim")}>
        Dim
      </button>
    </div>
  );
}

function WlcChapterPage() {
  const { book, ch } = Route.useParams();
  const navigate = useNavigate();
  const meta = isBookId(book) ? bookMeta(book) : undefined;
  const chapterNo = meta ? parseChapter(ch, meta.chapters) : null;
  const [chapter, setChapter] = useState<WlcChapter | null>(null);
  const [error, setError] = useState("");
  const [tone, setTone] = useState<SheetTone>("light");
  const [size, setSize] = useState<SheetSize>("page");

  useEffect(() => {
    setTone(readSheet());
    setSize(readSize());
  }, []);

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

  const prev = chapterNo > 1 ? chapterNo - 1 : null;
  const next = chapterNo < meta.chapters ? chapterNo + 1 : null;
  const go = (n: number) => {
    navigate({ to: "/iibs/wlc/$book/$ch", params: { book: meta.id, ch: String(n) } });
  };
  const chooseSize = (next: SheetSize) => {
    setSize(next);
    try {
      window.localStorage.setItem(SIZE_KEY, next);
    } catch {
      /* the type still changes for this visit */
    }
  };
  const choose = (nextTone: SheetTone) => {
    setTone(nextTone);
    try {
      window.localStorage.setItem(SHEET_KEY, nextTone);
    } catch {
      /* the sheet still changes for this visit */
    }
  };

  return (
    <div className="wlc-stage">
      <div className="shrink-0">
        <ScriptureTabs active="lab" />
      </div>
      <div className="mb-3 flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Reading Lab</p>
          <h1 className="font-display text-3xl font-bold leading-none text-ink">
            {meta.en} {chapterNo}
          </h1>
          <p className="he-word text-xl text-muted" dir="rtl" lang="he">
            {meta.he}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link to="/iibs/wlc" className="inline-flex min-h-11 items-center font-semibold text-primary">
            Books
          </Link>
          <SheetSizeControl size={size} onChange={chooseSize} />
          <SheetLamp tone={tone} onChange={choose} />
        </div>
      </div>
      <div className="mb-3 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
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
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {!chapter && !error ? <p className="text-sm text-muted">Opening the chapter.</p> : null}
      {chapter ? <WlcReading chapter={chapter} tone={tone} size={size} /> : null}
    </div>
  );
}
