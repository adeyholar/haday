import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { chapterFromAlign, fetchBookAlign, READ_RATES } from "@/lib/reading";
import { chapterAudioSrc, type BookId } from "@/lib/tanakh-canon";
import { followSpot, type FollowSpot } from "@/lib/wlc-follow";
import { useDockHeight } from "@/lib/use-follow-scroll";
import type { WlcVerse } from "@/lib/wlc";

export function WlcPlayer({
  book,
  chapter,
  verses,
  onSpot,
  onPrevChapter,
  onNextChapter,
  canPrev = false,
  canNext = false,
  onEngage,
}: {
  book: BookId;
  chapter: number;
  verses: WlcVerse[];
  onSpot: (spot: FollowSpot | null) => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  /** Play was pressed. The page uses this to follow the line again. */
  onEngage?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const versesRef = useRef(verses);
  const startsRef = useRef<{ verses: number[]; words?: number[][] }>({ verses: [] });
  const spotRef = useRef<string>("");
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [missing, setMissing] = useState(false);
  const [verseNo, setVerseNo] = useState(1);
  const dockRef = useRef<HTMLDivElement>(null);
  const verseNoRef = useRef(1);

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  useEffect(() => {
    const el = audioRef.current;
    let cancelled = false;
    setPlaying(false);
    setMissing(false);
    verseNoRef.current = 1;
    setVerseNo(1);
    spotRef.current = "";
    onSpot(null);
    if (el) {
      el.pause();
      el.src = chapterAudioSrc(book, chapter);
    }
    void fetchBookAlign(book).then((align) => {
      if (cancelled) return;
      const timed = chapterFromAlign(book, chapter, align);
      startsRef.current = { verses: timed.verses ?? [], words: timed.words };
      if (el && timed.src) el.src = timed.src;
      if (!timed.aligned) setMissing(true);
    });
    return () => {
      cancelled = true;
      el?.pause();
    };
    // The spot callback is owned by the page and only paints the mark.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapter]);

  function paint(time: number) {
    const spot = followSpot(versesRef.current, startsRef.current.verses, startsRef.current.words, time);
    const key = spot ? `${spot.verse}:${spot.word ?? "v"}` : "";
    if (spot && spot.verse + 1 !== verseNoRef.current) {
      verseNoRef.current = spot.verse + 1;
      setVerseNo(verseNoRef.current);
    }
    if (key === spotRef.current) return;
    spotRef.current = key;
    onSpot(spot);
  }

  async function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (!el.paused) {
      el.pause();
      setPlaying(false);
      return;
    }
    try {
      el.playbackRate = rate;
      await el.play();
      setPlaying(true);
      setMissing(false);
      onEngage?.();
    } catch {
      setPlaying(false);
      setMissing(true);
    }
  }

  useDockHeight(dockRef);

  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== " " || event.repeat) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || target.isContentEditable) return;
      }
      event.preventDefault();
      void toggleRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="read-dock" ref={dockRef}>
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-1 px-2 py-0.5" role="group" aria-label="Play and reading speed">
        <button
          type="button"
          className="inline-flex size-11 shrink-0 items-center justify-center text-sm font-semibold text-ink disabled:text-muted"
          aria-label="Previous chapter"
          disabled={!canPrev}
          onClick={onPrevChapter}
        >
          ‹
        </button>
        <button
          type="button"
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-sm font-semibold ${playing ? "bg-primary text-primary-foreground" : "text-ink"}`}
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => void toggle()}
        >
          {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
          {playing ? "Pause" : "Play"}
        </button>
        <span className="mx-0.5 h-6 w-px shrink-0 bg-border" aria-hidden="true" />
        {READ_RATES.map((row) => (
          <button
            key={row.value}
            type="button"
            className={`min-h-11 rounded-[var(--radius-sm)] px-2.5 text-sm font-semibold ${rate === row.value ? "bg-ink text-parchment" : "text-muted"}`}
            aria-pressed={rate === row.value}
            onClick={() => {
              setRate(row.value);
              if (audioRef.current) audioRef.current.playbackRate = row.value;
            }}
          >
            {row.label}
          </button>
        ))}
        <span className="px-1 text-xs font-semibold tabular-nums text-muted">
          Verse {verseNo} of {Math.max(1, verses.length)}
        </span>
        <button
          type="button"
          className="inline-flex size-11 shrink-0 items-center justify-center text-sm font-semibold text-ink disabled:text-muted"
          aria-label="Next chapter"
          disabled={!canNext}
          onClick={onNextChapter}
        >
          ›
        </button>
      </div>
      {missing ? <span className="px-3 pb-1 text-sm text-muted">The recording did not load.</span> : null}
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(event) => paint(event.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          spotRef.current = "";
          onSpot(null);
        }}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
    </div>
  );
}
