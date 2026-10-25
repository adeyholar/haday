import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { chapterFromAlign, fetchBookAlign, READ_RATES } from "@/lib/reading";
import { chapterAudioSrc, type BookId } from "@/lib/tanakh-canon";
import { followSpot, type FollowSpot } from "@/lib/wlc-follow";
import type { WlcVerse } from "@/lib/wlc";

export function WlcPlayer({
  book,
  chapter,
  verses,
  onSpot,
}: {
  book: BookId;
  chapter: number;
  verses: WlcVerse[];
  onSpot: (spot: FollowSpot | null) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const versesRef = useRef(verses);
  const startsRef = useRef<{ verses: number[]; words?: number[][] }>({ verses: [] });
  const spotRef = useRef<string>("");
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  useEffect(() => {
    const el = audioRef.current;
    let cancelled = false;
    setPlaying(false);
    setMissing(false);
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
    } catch {
      setPlaying(false);
      setMissing(true);
    }
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-[var(--radius-md)] bg-card p-0.5 shadow-[var(--shadow-border)]" role="group" aria-label="Reading speed">
        <button
          type="button"
          className={`inline-flex min-h-11 items-center gap-1.5 px-2.5 text-sm font-semibold ${playing ? "bg-ink text-parchment" : "text-ink"}`}
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => void toggle()}
        >
          {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
          {playing ? "Pause" : "Play"}
        </button>
        <span className="mx-0.5 w-px self-stretch bg-border" aria-hidden="true" />
        {READ_RATES.map((row) => (
          <button
            key={row.value}
            type="button"
            className={`min-h-11 px-2.5 text-sm font-semibold ${rate === row.value ? "bg-ink text-parchment" : "text-muted"}`}
            aria-pressed={rate === row.value}
            onClick={() => {
              setRate(row.value);
              if (audioRef.current) audioRef.current.playbackRate = row.value;
            }}
          >
            {row.label}
          </button>
        ))}
      </div>
      {missing ? <span className="text-sm text-muted">The recording did not load.</span> : null}
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
