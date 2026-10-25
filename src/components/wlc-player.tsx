import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { chapterFromAlign, fetchBookAlign } from "@/lib/reading";
import { chapterAudioSrc, type BookId } from "@/lib/tanakh-canon";
import { followSpot, type FollowSpot } from "@/lib/wlc-follow";
import { rateFromStorage, readRateLabel, nextReadRate, WLC_RATE_KEY } from "@/lib/wlc-prefs";
import { useDockHeight } from "@/lib/use-follow-scroll";
import type { WlcVerse } from "@/lib/wlc";

const NUDGE_SEC = 5;

export function WlcPlayer({
  book,
  chapter,
  verses,
  onSpot,
  onEngage,
}: {
  book: BookId;
  chapter: number;
  verses: WlcVerse[];
  onSpot: (spot: FollowSpot | null) => void;
  /** Play was pressed. The page uses this to follow the line again. */
  onEngage?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const versesRef = useRef(verses);
  const startsRef = useRef<{ verses: number[]; words?: number[][] }>({ verses: [] });
  const spotRef = useRef<string>("");
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const rateRef = useRef(1);
  const [missing, setMissing] = useState(false);
  const [verseNo, setVerseNo] = useState(1);
  const [now, setNow] = useState(0);
  const [duration, setDuration] = useState(0);
  const dockRef = useRef<HTMLDivElement>(null);
  const verseNoRef = useRef(1);
  const onEngageRef = useRef(onEngage);
  onEngageRef.current = onEngage;

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  useEffect(() => {
    try {
      const saved = rateFromStorage(window.localStorage.getItem(WLC_RATE_KEY));
      rateRef.current = saved;
      setRate(saved);
      if (audioRef.current) audioRef.current.playbackRate = saved;
    } catch {
      /* the recorded speed still plays */
    }
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    let cancelled = false;
    setPlaying(false);
    setMissing(false);
    setNow(0);
    setDuration(0);
    verseNoRef.current = 1;
    setVerseNo(1);
    spotRef.current = "";
    onSpot(null);
    if (el) {
      el.pause();
      el.playbackRate = rateRef.current;
      el.src = chapterAudioSrc(book, chapter);
    }
    void fetchBookAlign(book).then((align) => {
      if (cancelled) return;
      const timed = chapterFromAlign(book, chapter, align);
      startsRef.current = { verses: timed.verses ?? [], words: timed.words };
      if (el && timed.src) el.src = timed.src;
      if (el) el.playbackRate = rateRef.current;
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

  function rememberRate(next: number) {
    rateRef.current = next;
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
    try {
      window.localStorage.setItem(WLC_RATE_KEY, String(next));
    } catch {
      /* this visit still uses the speed */
    }
  }

  async function playFrom(time: number) {
    const el = audioRef.current;
    if (!el) return;
    const cap = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : time;
    const next = Math.max(0, Math.min(time, cap));
    el.currentTime = next;
    setNow(next);
    paint(next);
    if (!el.paused) return;
    try {
      el.playbackRate = rateRef.current;
      await el.play();
      setPlaying(true);
      setMissing(false);
      onEngageRef.current?.();
    } catch {
      setPlaying(false);
      setMissing(true);
    }
  }

  async function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (!el.paused) {
      el.pause();
      setPlaying(false);
      return;
    }
    await playFrom(el.currentTime || 0);
  }

  function jumpVerse(index: number) {
    const count = Math.max(versesRef.current.length, startsRef.current.verses.length, 1);
    const next = Math.min(count - 1, Math.max(0, index));
    verseNoRef.current = next + 1;
    setVerseNo(next + 1);
    void playFrom(startsRef.current.verses[next] ?? 0);
  }

  function stepVerse(delta: number) {
    const count = Math.max(versesRef.current.length, startsRef.current.verses.length, 1);
    const current = Math.min(count - 1, Math.max(0, verseNoRef.current - 1));
    const next = Math.min(count - 1, Math.max(0, current + delta));
    if (next === current && delta !== 0) return;
    jumpVerse(next);
  }

  function nudge(seconds: number) {
    const el = audioRef.current;
    if (!el) return;
    const cap = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : el.currentTime + seconds;
    const next = Math.max(0, Math.min(el.currentTime + seconds, cap));
    el.currentTime = next;
    setNow(next);
    paint(next);
  }

  useDockHeight(dockRef);

  const toggleRef = useRef(toggle);
  const nudgeRef = useRef(nudge);
  toggleRef.current = toggle;
  nudgeRef.current = nudge;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || target.isContentEditable) return;
      }
      if (event.key === " ") {
        event.preventDefault();
        void toggleRef.current();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        nudgeRef.current(-NUDGE_SEC);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nudgeRef.current(NUDGE_SEC);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const total = Math.max(1, verses.length);
  const rateLabel = readRateLabel(rate);
  const atStart = verseNo <= 1;
  const atEnd = verseNo >= total;

  return (
    <div className="read-dock" ref={dockRef}>
      <div className="read-dock-row">
        <div className="read-dock-sheet">
          <input
            className="audio-seek w-full"
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={Math.min(now, duration || now)}
            aria-label="Seek recording"
            onChange={(event) => {
              const time = Number(event.target.value);
              const el = audioRef.current;
              if (!el) return;
              el.currentTime = time;
              setNow(time);
              paint(time);
            }}
          />
          <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-1 py-0.5" role="group" aria-label="Play and reading speed">
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center text-sm font-semibold text-ink disabled:text-muted"
              aria-label="Previous verse"
              disabled={atStart}
              onClick={() => stepVerse(-1)}
            >
              ‹
            </button>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)] items-center gap-1">
              <button
                type="button"
                className={`col-start-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full ${playing ? "bg-primary text-primary-foreground" : "bg-ink text-parchment"}`}
                aria-label={playing ? "Pause" : "Play"}
                onClick={() => void toggle()}
              >
                {playing ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5" aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="col-start-1 row-start-1 inline-flex h-11 min-w-11 justify-self-end items-center justify-center rounded-[var(--radius-sm)] px-2 text-sm font-semibold tabular-nums text-ink"
                aria-label={`Reading speed, ${rateLabel}`}
                onClick={() => rememberRate(nextReadRate(rate))}
              >
                {rateLabel}
              </button>
              <label className="sr-only" htmlFor="wlc-verse">
                Verse
              </label>
              <select
                id="wlc-verse"
                className="col-start-3 row-start-1 h-11 w-full max-w-16 justify-self-start rounded-[var(--radius-sm)] bg-surface px-1 text-sm font-semibold text-ink"
                value={String(Math.min(verseNo, total))}
                aria-label={`Verse ${verseNo} of ${total}`}
                onChange={(event) => jumpVerse(Number(event.target.value) - 1)}
              >
                {Array.from({ length: total }, (_, index) => (
                  <option key={index + 1} value={String(index + 1)}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center text-sm font-semibold text-ink disabled:text-muted"
              aria-label="Next verse"
              disabled={atEnd}
              onClick={() => stepVerse(1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>
      {missing ? <span className="px-3 pb-1 text-sm text-muted">The recording did not load.</span> : null}
      <audio
        ref={audioRef}
        preload="none"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => {
          setNow(event.currentTarget.currentTime);
          paint(event.currentTarget.currentTime);
        }}
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
