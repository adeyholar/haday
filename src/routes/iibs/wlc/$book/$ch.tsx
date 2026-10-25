import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { WlcReading, type SheetSize, type SheetTone } from "@/components/wlc-desk";
import { WlcPlayer } from "@/components/wlc-player";
import { ScriptureTabs } from "@/components/iibs-door";
import { bookMeta, isBookId, parseChapter } from "@/lib/tanakh-canon";
import { defaultSheetSize, defaultSheetWidth, WLC_SIZE_KEY, WLC_WIDTH_KEY, type WlcSheetWidth } from "@/lib/wlc-prefs";
import { loadWlcChapter } from "@/lib/wlc-server";
import type { FollowSpot } from "@/lib/wlc-follow";
import type { WlcChapter } from "@/lib/wlc";

const chapterCache = new Map<string, WlcChapter>();

const SHEET_KEY = "haday.wlc.sheet";
const NOTE_KEY = "haday.wlc.note";

const SIZES: { id: SheetSize; label: string }[] = [
  { id: "tight", label: "Tight" },
  { id: "small", label: "Small" },
  { id: "page", label: "Page" },
  { id: "large", label: "Large" },
];

export const Route = createFileRoute("/iibs/wlc/$book/$ch")({
  // Ezra SIL carries the accents; fetch it with the page so the text does not
  // first paint in the fallback face (slow phones saw the swap).
  head: () => ({
    links: [{ rel: "preload", href: "/fonts/EzraSIL.woff", as: "font", type: "font/woff", crossOrigin: "anonymous" }],
  }),
  component: WlcChapterPage,
});

function readSheet(): SheetTone {
  try {
    const saved = window.localStorage.getItem(SHEET_KEY);
    if (saved === "dim" || saved === "light") return saved;
  } catch {
    /* fall through to the device */
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dim";
  return "light";
}

function readSize(): SheetSize {
  try {
    const saved = window.localStorage.getItem(WLC_SIZE_KEY);
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    return defaultSheetSize(saved, wide);
  } catch {
    return "page";
  }
}

function readWidth(): WlcSheetWidth {
  try {
    return defaultSheetWidth(window.localStorage.getItem(WLC_WIDTH_KEY));
  } catch {
    return "normal";
  }
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
  const [width, setWidth] = useState<WlcSheetWidth>("normal");
  const [aaOpen, setAaOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [spot, setSpot] = useState<FollowSpot | null>(null);
  const [resumeTick, setResumeTick] = useState(0);

  useEffect(() => {
    setTone(readSheet());
    setSize(readSize());
    setWidth(readWidth());
    try {
      if (window.localStorage.getItem(NOTE_KEY) !== "seen") {
        setNoteOpen(true);
        window.localStorage.setItem(NOTE_KEY, "seen");
      }
    } catch {
      /* the note can still be opened from the button */
    }
  }, []);

  useEffect(() => {
    if (!meta || chapterNo == null) return;
    const key = `${meta.id}:${chapterNo}`;
    const cached = chapterCache.get(key);
    if (cached) {
      setChapter(cached);
      return;
    }
    let cancelled = false;
    setChapter(null);
    setError("");
    loadWlcChapter({ data: { book: meta.id, chapter: chapterNo } })
      .then((next) => {
        chapterCache.set(`${next.book}:${next.chapter}`, next);
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
      window.localStorage.setItem(WLC_SIZE_KEY, next);
    } catch {
      /* the type still changes for this visit */
    }
  };
  const chooseWidth = (nextWidth: WlcSheetWidth) => {
    setWidth(nextWidth);
    try {
      window.localStorage.setItem(WLC_WIDTH_KEY, nextWidth);
    } catch {
      /* this visit still uses the width */
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
    <div className={width === "wide" ? "wlc-stage wlc-wide" : "wlc-stage"}>
      <div className="wlc-toolbar -mx-4 mb-2 overflow-x-auto px-2 py-0.5">
        <div className="flex w-max min-w-full items-center gap-1">
          <ScriptureTabs active="lab" compact />
          <Link to="/iibs/wlc" aria-label="Books" className="inline-flex h-11 shrink-0 items-center px-1 text-sm font-semibold text-primary">
            ‹ Books
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
            {meta.en} {chapterNo}{" "}
            <span className="he-word font-normal text-muted" dir="rtl" lang="he">
              {meta.he}
            </span>
          </h1>
          <label className="sr-only" htmlFor="wlc-chapter">
            Chapter
          </label>
          <select
            id="wlc-chapter"
            className="h-11 shrink-0 rounded-[var(--radius-md)] bg-surface px-2 text-base font-semibold text-ink"
            value={String(chapterNo)}
            onChange={(event) => go(Number(event.target.value))}
          >
            {Array.from({ length: meta.chapters }, (_, index) => (
              <option key={index + 1} value={String(index + 1)}>
                {index + 1}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Previous chapter"
            disabled={!prev}
            onClick={() => prev && go(prev)}
            className="inline-flex size-11 shrink-0 items-center justify-center font-semibold text-ink disabled:text-muted"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next chapter"
            disabled={!next}
            onClick={() => next && go(next)}
            className="inline-flex size-11 shrink-0 items-center justify-center font-semibold text-ink disabled:text-muted"
          >
            ›
          </button>
          <button
            type="button"
            aria-label="Type size and lamp"
            aria-expanded={aaOpen}
            onClick={() => setAaOpen((open) => !open)}
            className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center px-2 text-sm font-semibold text-ink"
          >
            Aa
          </button>
          <button
            type="button"
            aria-label="About this text"
            aria-expanded={noteOpen}
            onClick={() => setNoteOpen((open) => !open)}
            className="inline-flex size-11 shrink-0 items-center justify-center text-sm font-semibold text-ink"
          >
            ⓘ
          </button>
        </div>
      </div>
      {aaOpen ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <SheetSizeControl size={size} onChange={chooseSize} />
          <SheetLamp tone={tone} onChange={choose} />
          <div className="flex rounded-[var(--radius-md)] bg-card p-0.5 shadow-[var(--shadow-border)]" role="group" aria-label="Column width">
            {(
              [
                ["normal", "Normal"],
                ["wide", "Wide"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold ${width === id ? "bg-ink text-parchment" : "text-muted"}`}
                aria-pressed={width === id}
                onClick={() => chooseWidth(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <WlcPlayer
        book={meta.id}
        chapter={chapterNo}
        verses={chapter?.verses ?? []}
        onSpot={setSpot}
        onEngage={() => setResumeTick((tick) => tick + 1)}
      />
      {!chapter && !error ? <p className="text-sm text-muted">Opening the chapter.</p> : null}
      {chapter ? (
        <WlcReading chapter={chapter} tone={tone} size={size} showNote={noteOpen} spot={spot} resumeTick={resumeTick} />
      ) : null}
      {next ? (
        <button type="button" onClick={() => go(next)} className="mt-4 min-h-11 font-semibold text-primary">
          Next chapter ›
        </button>
      ) : null}
    </div>
  );
}
