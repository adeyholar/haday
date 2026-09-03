import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, FastForward, Pause, Play, Repeat, Rewind, SkipBack, SkipForward } from "lucide-react";
import { hebrewClusters } from "@/lib/hebrew-phones";
import { Button } from "@/components/ui/button";
import { ListenMenu } from "@/components/listen-menu";
import { Panel } from "@/components/panel";
import { playGrade } from "@/lib/sfx";
import {
  AUDIO_CREDIT,
  READ_RATES,
  audioFor,
  audioWindow,
  clusterAtMeta,
  formatPlayTime,
  gradeFromVerses,
  loadReadingProgress,
  mediaClockTime,
  progressId,
  saveReadingResult,
  sliceVerses,
  verseAtStarts,
  verseStartFrom,
  versesFromDump,
  withEstimatedTiming,
  wordAtStarts,
  type ChapterAudio,
  type GradeItem,
  type MediaClock,
  type ReadingVerse,
} from "@/lib/reading";
import {
  armAutoplay,
  isFullChapter,
  isSingleChapter,
  nextPlayLoc,
  passageLabel,
  passageSearch,
  playingLabel,
  prevPlayLoc,
  resolvePassage,
  sameLoc,
  takeAutoplay,
  verseWindow,
  versesInChapter,
  type ReadSearch,
} from "@/lib/passage";
import {
  bookMeta,
  chapterAudioSrc,
  fetchTanakhBook,
  localTanakhSrc,
  nextChapter,
  prevChapter,
  saveLastRead,
  type BookId,
} from "@/lib/tanakh-canon";

type Mode = "follow" | "grade";

export function TanakhReading({
  book,
  chapter,
  search,
}: {
  book: BookId;
  chapter: number;
  search: ReadSearch;
}) {
  const meta = bookMeta(book);
  const navigate = useNavigate();
  const passage = useMemo(() => resolvePassage(book, chapter, search), [book, chapter, search]);
  const vw = verseWindow(passage);
  const [verses, setVerses] = useState<ReadingVerse[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [audioErr, setAudioErr] = useState(false);
  const [mode, setMode] = useState<Mode>("follow");
  const [i, setI] = useState(0);
  const [wordI, setWordI] = useState(0);
  const [clusterI, setClusterI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [tnow, setTnow] = useState(0);
  const [tdur, setTdur] = useState(0);
  const [loop, setLoop] = useState(Boolean(search.loop));
  const [quiz, setQuiz] = useState<GradeItem[] | null>(null);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [hits, setHits] = useState(0);
  const [seen, setSeen] = useState(0);
  const [done, setDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clockRef = useRef<MediaClock>({ media: 0, wall: 0, rate: 1 });
  const seekingRef = useRef(false);
  const finishingRef = useRef(false);
  const iRef = useRef(0);
  const wordRef = useRef(0);
  const clusterRef = useRef(0);
  const versesRef = useRef(verses);
  const rateRef = useRef(rate);
  const loopRef = useRef(loop);
  const passageRef = useRef(passage);
  const audioMetaRef = useRef<ChapterAudio>(audioFor(book, chapter));
  const [audioMeta, setAudioMeta] = useState<ChapterAudio>(() => audioFor(book, chapter));
  const verse = verses[i];
  const pid = isFullChapter(passage) ? progressId(book, chapter) : `${book}.${chapter}.${vw.from}-${vw.to}`;
  const rec = loadReadingProgress()[pid];
  const aligned = Boolean(audioFor(book, chapter).verses.length);
  const win = audioWindow(audioMeta, vw.from, vw.to, tdur);
  iRef.current = i;
  versesRef.current = verses;
  rateRef.current = rate;
  loopRef.current = loop;
  passageRef.current = passage;
  audioMetaRef.current = audioMeta;

  function applyRate(el: HTMLAudioElement, n: number) {
    const next = n > 0 ? n : 1;
    el.playbackRate = next;
    el.defaultPlaybackRate = next;
    el.preservesPitch = true;
    clockRef.current = { media: el.currentTime, wall: performance.now(), rate: next };
  }

  function elAudio(): HTMLAudioElement | null {
    return audioRef.current;
  }

  function syncClock(el: HTMLAudioElement) {
    clockRef.current = {
      media: el.currentTime,
      wall: performance.now(),
      rate: el.playbackRate || rateRef.current,
    };
  }

  function onTime() {
    const el = elAudio();
    const list = versesRef.current;
    const curMeta = audioMetaRef.current;
    if (!el || !list.length) return;
    const t = mediaClockTime(el.currentTime, el.paused, clockRef.current, performance.now(), el.duration || 0);
    const first = list[0];
    const last = list[list.length - 1];
    const window = audioWindow(curMeta, first?.verse ?? 1, last?.verse ?? 1, el.duration || tdur);
    if (!seekingRef.current) {
      setTnow(t);
      if (el.duration) setTdur(el.duration);
    }
    if (!el.paused && !finishingRef.current && window.end > window.start + 0.2 && t >= window.end - 0.05) {
      finishRange();
      return;
    }
    const vn = verseAtStarts(curMeta.verses, t);
    let next = list.findIndex((row) => row.verse === vn);
    if (next < 0) {
      if (first && vn < first.verse) next = 0;
      else next = Math.max(0, list.length - 1);
    }
    const item = list[next];
    if (item && next !== iRef.current) {
      iRef.current = next;
      setI(next);
    }
    if (item) {
      const w = wordAtStarts(curMeta.words?.[item.verse - 1] ?? [], t);
      if (w !== wordRef.current) {
        wordRef.current = w;
        setWordI(w);
      }
      const surface = item.words[w] ?? "";
      const c = clusterAtMeta(curMeta, item.verse, w, t, surface);
      if (c !== clusterRef.current) {
        clusterRef.current = c;
        setClusterI(c);
      }
    }
  }

  function goLoc(loc: { book: BookId; chapter: number }, auto: boolean) {
    const live = { ...passageRef.current, loop: loopRef.current };
    if (auto) armAutoplay();
    halt();
    void navigate({
      to: "/listen/read/$book/$ch",
      params: { book: loc.book, ch: String(loc.chapter) },
      search: passageSearch({ ...live, book: loc.book, chapter: loc.chapter }),
    });
  }

  function finishRange() {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const live = { ...passageRef.current, loop: loopRef.current };
    const here = { book, chapter };
    const next = nextPlayLoc(live);
    if (next && !sameLoc(next, here)) {
      goLoc(next, true);
      return;
    }
    const el = elAudio();
    const list = versesRef.current;
    const first = list[0];
    const last = list[list.length - 1];
    const window = audioWindow(audioMetaRef.current, first?.verse ?? 1, last?.verse ?? 1, el?.duration || tdur);
    if (live.loop && el) {
      el.currentTime = window.start;
      syncClock(el);
      setTnow(window.start);
      iRef.current = 0;
      setI(0);
      void el.play().then(() => {
        finishingRef.current = false;
        setPlaying(true);
      }).catch(() => {
        finishingRef.current = false;
        setPlaying(false);
      });
      return;
    }
    if (el) {
      el.pause();
      el.currentTime = window.start;
      syncClock(el);
      setTnow(window.start);
    }
    setPlaying(false);
    finishingRef.current = false;
  }

  function onEnded() {
    finishRange();
  }

  async function playFrom(index: number, kick: boolean) {
    const item = versesRef.current[index];
    const curMeta = audioMetaRef.current;
    const el = elAudio();
    if (!item || !el) return;
    finishingRef.current = false;
    const src = curMeta.src || chapterAudioSrc(book, chapter);
    if (!el.src || !(el.src.endsWith(src) || el.src.includes(src))) {
      el.src = src;
    }
    applyRate(el, rateRef.current);
    const start = verseStartFrom(curMeta, item.verse);
    try {
      if (kick || Math.abs(el.currentTime - start) > 0.35 || el.paused) {
        el.currentTime = start;
        syncClock(el);
      }
      await el.play();
      applyRate(el, rateRef.current);
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  function halt() {
    const el = elAudio();
    if (el) el.pause();
    setPlaying(false);
  }

  function seekTo(t: number) {
    const el = elAudio();
    if (!el) return;
    const list = versesRef.current;
    const first = list[0];
    const last = list[list.length - 1];
    const window = audioWindow(audioMetaRef.current, first?.verse ?? vw.from, last?.verse ?? vw.to, el.duration || tdur);
    const lo = window.start;
    const hi = window.end > lo ? window.end : el.duration || tdur || t;
    el.currentTime = Math.max(lo, Math.min(hi || t, t));
    syncClock(el);
    setTnow(el.currentTime);
    onTime();
  }

  function nudge(sec: number) {
    const el = elAudio();
    if (!el) return;
    seekTo(el.currentTime + sec);
  }

  useEffect(() => {
    let cancelled = false;
    setLoadErr(null);
    setVerses([]);
    setI(0);
    iRef.current = 0;
    setWordI(0);
    wordRef.current = 0;
    setClusterI(0);
    clusterRef.current = 0;
    setMode("follow");
    setQuiz(null);
    setDone(false);
    setAudioErr(false);
    halt();
    saveLastRead(book, chapter);
    const seed = audioFor(book, chapter);
    audioMetaRef.current = seed;
    setAudioMeta(seed);
    const el = elAudio();
    if (el) {
      el.src = seed.src;
      applyRate(el, rateRef.current);
      setTnow(0);
      setTdur(seed.duration);
    }
    void fetchTanakhBook(book)
      .then((dump) => {
        if (cancelled) return;
        const rows = versesFromDump(dump, chapter);
        const shown = sliceVerses(rows, vw.from, vw.to);
        versesRef.current = shown;
        setVerses(shown);
        if (!shown.length) setLoadErr("This passage is empty.");
        const el = elAudio();
        const dur = el?.duration || audioMetaRef.current.duration;
        if (dur && !(audioMetaRef.current.verses.length && audioMetaRef.current.words?.length)) {
          const timed = withEstimatedTiming(audioMetaRef.current, rows, dur);
          audioMetaRef.current = timed;
          setAudioMeta(timed);
        }
        const start = verseStartFrom(audioMetaRef.current, shown[0]?.verse ?? vw.from);
        if (el) {
          el.currentTime = start;
          syncClock(el);
          setTnow(start);
        }
        if (takeAutoplay()) {
          window.setTimeout(() => {
            if (!cancelled) void playFrom(0, true);
          }, 40);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadErr("Could not load this chapter.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapter]);

  useEffect(() => {
    const el = elAudio();
    if (!el) return;
    const onUpdate = () => {
      const guess = mediaClockTime(el.currentTime, el.paused, clockRef.current, performance.now(), el.duration || 0);
      if (el.paused || Math.abs(el.currentTime - guess) > 0.6) syncClock(el);
      onTime();
    };
    const onSeeked = () => {
      syncClock(el);
      onTime();
    };
    const onMeta = () => {
      const dur = el.duration || 0;
      setTdur(dur);
      const next = withEstimatedTiming(audioMetaRef.current, versesRef.current, dur);
      audioMetaRef.current = next;
      setAudioMeta(next);
    };
    const onPlay = () => {
      applyRate(el, rateRef.current);
      setPlaying(true);
    };
    const onPause = () => {
      syncClock(el);
      if (!el.ended) setPlaying(false);
    };
    const onFail = () => setAudioErr(true);
    el.addEventListener("timeupdate", onUpdate);
    el.addEventListener("seeked", onSeeked);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("playing", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onFail);
    return () => {
      el.removeEventListener("timeupdate", onUpdate);
      el.removeEventListener("seeked", onSeeked);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("playing", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onFail);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, book, chapter]);

  useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (!el) return;
      el.pause();
      el.src = "";
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    let id = 0;
    const tick = () => {
      onTime();
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  function step(delta: number) {
    const next = iRef.current + delta;
    if (next >= verses.length) {
      finishRange();
      return;
    }
    if (next < 0) {
      const prev = prevPlayLoc({ ...passageRef.current, loop: loopRef.current });
      if (prev && !sameLoc(prev, { book, chapter })) {
        goLoc(prev, playing);
        return;
      }
      return;
    }
    iRef.current = next;
    setI(next);
    setWordI(0);
    wordRef.current = 0;
    setClusterI(0);
    clusterRef.current = 0;
    if (playing) void playFrom(next, true);
    else {
      const item = verses[next];
      const el = elAudio();
      const curMeta = audioMetaRef.current;
      if (item && el) {
        const src = curMeta.src;
        if (src && !el.src.includes(src)) el.src = src;
        el.currentTime = verseStartFrom(curMeta, item.verse);
        syncClock(el);
        onTime();
      }
    }
  }

  function startGrade() {
    halt();
    setMode("grade");
    setQuiz(gradeFromVerses(verses, 10));
    setQi(0);
    setPicked(null);
    setHits(0);
    setSeen(0);
    setDone(false);
  }

  function pickChoice(choice: string, item: GradeItem) {
    if (picked) return;
    const ok = choice === item.answer;
    playGrade(ok);
    setPicked(choice);
    const nextHits = hits + (ok ? 1 : 0);
    const nextSeen = seen + 1;
    setHits(nextHits);
    setSeen(nextSeen);
    window.setTimeout(() => {
      if (qi + 1 >= (quiz?.length ?? 0)) {
        const score = Math.round((nextHits / nextSeen) * 100);
        saveReadingResult(pid, score);
        setDone(true);
      } else {
        setQi((n) => n + 1);
        setPicked(null);
      }
    }, 700);
  }

  const pct = seen ? Math.round((hits / seen) * 100) : 0;
  const live = { ...passage, loop };
  const multi = !isSingleChapter(passage);
  const prevLoc = multi ? prevPlayLoc(live) : prevChapter(book, chapter);
  const nxtLoc = multi ? nextPlayLoc(live) : nextChapter(book, chapter);
  const local = Boolean(localTanakhSrc(book, chapter));

  function setLoopOn(on: boolean) {
    setLoop(on);
    loopRef.current = on;
    void navigate({
      to: "/listen/read/$book/$ch",
      params: { book, ch: String(chapter) },
      search: passageSearch({ ...passage, loop: on }),
      replace: true,
    });
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
          <Link to="/listen/read/$book" params={{ book }} className="hover:underline">
            {meta?.en ?? book}
          </Link>
          {` ${chapter}`}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">{playingLabel(passage)}</h1>
        <p className="he-word mt-1 text-xl text-ink" lang="he" dir="rtl">
          {meta?.he}
        </p>
        <p className="mt-3 text-muted">
          {multi
            ? `Playing ${passageLabel(passage)}. This chapter has ${verses.length || vw.to} verses. When it ends, the next chapter in the range starts.`
            : !isFullChapter(passage)
              ? `Recorded Hebrew for ${passageLabel(passage)} only — ${verses.length || vw.to - vw.from + 1} verse${
                  verses.length === 1 ? "" : "s"
                }. English stays on the page.`
              : "Recorded Hebrew chapter audio — the same Tanakh reading, not a computer voice. English stays on the page. 90% first-answer clears the chapter."}
        </p>
        {rec ? (
          <p className="mt-2 text-sm text-muted">
            Best {rec.best}%{rec.cleared ? " · cleared" : ""} · {rec.attempts} run{rec.attempts === 1 ? "" : "s"}
          </p>
        ) : null}
        {loadErr ? <p className="mt-2 text-sm text-danger">{loadErr}</p> : null}
        {audioErr ? (
          <p className="mt-2 text-sm text-danger">The recording could not be loaded. Try again when you have a connection.</p>
        ) : null}
        {!aligned && !audioErr ? (
          <p className="mt-2 text-sm text-muted">Word highlight follows the Hebrew letter-weight for this chapter.</p>
        ) : null}
        <VerseClipBar book={book} chapter={chapter} fromV={vw.from} toV={vw.to} loop={loop} />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("follow");
              setQuiz(null);
              setDone(false);
            }}
            className={`min-h-12 rounded-[var(--radius-md)] px-3 text-sm font-semibold shadow-[var(--shadow-border)] ${
              mode === "follow" ? "bg-ink text-parchment" : "bg-card text-ink"
            }`}
          >
            Follow along
          </button>
          <button
            type="button"
            onClick={startGrade}
            disabled={!verses.length}
            className={`min-h-12 rounded-[var(--radius-md)] px-3 text-sm font-semibold shadow-[var(--shadow-border)] ${
              mode === "grade" ? "bg-ink text-parchment" : "bg-card text-ink"
            }`}
          >
            Grade reading
          </button>
        </div>
      </Panel>

      {mode === "follow" && verse ? (
        <FollowCard
          audioRef={audioRef}
          verse={verse}
          i={i}
          wordI={wordI}
          clusterI={clusterI}
          total={verses.length}
          playing={playing}
          rate={rate}
          now={tnow}
          duration={tdur}
          windowStart={win.start}
          windowEnd={win.end > win.start ? win.end : tdur}
          loop={loop}
          preload={local ? "auto" : "metadata"}
          onToggle={() => {
            if (playing) halt();
            else void playFrom(i, true);
          }}
          onStep={step}
          onNudge={nudge}
          onSeek={(t) => seekTo(t)}
          onSeeking={(yes) => {
            seekingRef.current = yes;
          }}
          onRate={(n) => {
            setRate(n);
            rateRef.current = n;
            const node = elAudio();
            if (node) applyRate(node, n);
          }}
          onLoop={setLoopOn}
        />
      ) : null}

      {mode === "follow" && !verse && !loadErr ? (
        <Panel>
          <p className="text-muted">Loading {meta?.en ?? book} {chapter}…</p>
        </Panel>
      ) : null}

      {mode === "grade" && quiz && !done ? (
        <GradeCard item={quiz[qi]!} qi={qi} total={quiz.length} picked={picked} onPick={pickChoice} />
      ) : null}

      {mode === "grade" && done ? (
        <Panel className="text-center">
          <h2 className="font-display text-3xl font-bold text-ink">{pct >= 90 ? "Reading cleared" : "Need 90% to clear"}</h2>
          <p className="mt-3 text-muted">
            {hits}/{seen} · {pct}%
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button size="lg" onClick={startGrade}>
              Try again
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setMode("follow");
                setDone(false);
              }}
            >
              Back to follow along
            </Button>
          </div>
        </Panel>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {prevLoc ? (
          <Link
            to="/listen/read/$book/$ch"
            params={{ book: prevLoc.book, ch: String(prevLoc.chapter) }}
            search={multi ? passageSearch({ ...live, book: prevLoc.book, chapter: prevLoc.chapter }) : {}}
            className="flex min-h-12 items-center justify-start gap-1 rounded-[var(--radius-md)] bg-card px-3 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
          >
            <ChevronLeft className="size-4 shrink-0" />
            <span className="truncate">
              {prevLoc.book === book ? `Chapter ${prevLoc.chapter}` : `${bookMeta(prevLoc.book)?.en} ${prevLoc.chapter}`}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {nxtLoc ? (
          <Link
            to="/listen/read/$book/$ch"
            params={{ book: nxtLoc.book, ch: String(nxtLoc.chapter) }}
            search={multi ? passageSearch({ ...live, book: nxtLoc.book, chapter: nxtLoc.chapter }) : {}}
            className="flex min-h-12 items-center justify-end gap-1 rounded-[var(--radius-md)] bg-card px-3 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
          >
            <span className="truncate">
              {nxtLoc.book === book ? `Chapter ${nxtLoc.chapter}` : `${bookMeta(nxtLoc.book)?.en} ${nxtLoc.chapter}`}
            </span>
            <ChevronRight className="size-4 shrink-0" />
          </Link>
        ) : (
          <span />
        )}
      </div>

      <p className="mt-6 text-xs text-muted">{AUDIO_CREDIT}</p>
    </>
  );
}

function FollowCard({
  audioRef,
  verse,
  i,
  wordI,
  clusterI,
  total,
  playing,
  rate,
  now,
  duration,
  windowStart,
  windowEnd,
  loop,
  preload,
  onToggle,
  onStep,
  onNudge,
  onSeek,
  onSeeking,
  onRate,
  onLoop,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  verse: ReadingVerse;
  i: number;
  wordI: number;
  clusterI: number;
  total: number;
  playing: boolean;
  rate: number;
  now: number;
  duration: number;
  windowStart: number;
  windowEnd: number;
  loop: boolean;
  preload: "auto" | "metadata";
  onToggle: () => void;
  onStep: (d: number) => void;
  onNudge: (sec: number) => void;
  onSeek: (t: number) => void;
  onSeeking: (yes: boolean) => void;
  onRate: (n: number) => void;
  onLoop: (on: boolean) => void;
}) {
  const lo = windowStart;
  const hi = windowEnd > windowStart ? windowEnd : duration;
  const span = Math.max(0, hi - lo);
  const rel = Math.max(0, Math.min(span, now - lo));
  return (
    <>
      <div className="min-w-0 overflow-x-hidden rounded-[var(--radius-xl)] bg-card px-4 py-6 shadow-[var(--shadow-border)] sm:px-5 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{verse.ref}</p>
        <p className="he-verse mt-4 text-xl sm:text-2xl md:text-3xl" lang="he" dir="rtl">
          {verse.words.map((w, wi) => (
            <span key={`${verse.ref}-${wi}`} className={wi === wordI ? "he-spoken max-w-full" : "max-w-full text-ink"}>
              {hebrewClusters(w).map((part, pi) => (
                <span
                  key={`${verse.ref}-${wi}-${pi}`}
                  className={wi === wordI && pi === clusterI ? "rounded-sm bg-primary px-0.5 text-primary-foreground" : undefined}
                >
                  {part.glyph}
                </span>
              ))}
            </span>
          ))}
        </p>
        <p className="mt-4 max-w-full text-base leading-relaxed break-words text-ink">{verse.en}</p>
        <p className="mt-6 text-sm tabular-nums text-muted">
          {i + 1} / {total}
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius-xl)] bg-card px-4 py-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between text-sm font-semibold tabular-nums text-muted">
          <span>{formatPlayTime(rel)}</span>
          <span>{formatPlayTime(span || duration)}</span>
        </div>
        <input
          className="audio-seek mt-1"
          type="range"
          min={lo}
          max={hi || 1}
          step={0.1}
          value={Math.min(Math.max(now, lo), hi || now)}
          aria-label="Seek recording"
          onPointerDown={() => onSeeking(true)}
          onPointerUp={() => onSeeking(false)}
          onChange={(e) => {
            const t = Number(e.target.value);
            onSeeking(true);
            onSeek(t);
          }}
        />
        <audio
          ref={audioRef}
          className="mt-1 w-full"
          controls
          preload={preload}
          controlsList="nodownload noplaybackrate"
        />
        <div className="mt-3 grid grid-cols-5 gap-2">
          <Button type="button" variant="outline" size="lg" className="min-h-14" onClick={() => onNudge(-5)}>
            <Rewind className="size-5" />
            <span className="sr-only">Back 5 seconds</span>
          </Button>
          <Button type="button" variant="outline" size="lg" className="min-h-14" onClick={() => onStep(-1)}>
            <SkipBack className="size-5" />
            <span className="sr-only">Previous verse</span>
          </Button>
          <Button type="button" size="lg" className="min-h-14" onClick={onToggle}>
            {playing ? <Pause className="size-6" /> : <Play className="size-6 ms-0.5" />}
            <span className="sr-only">{playing ? "Pause" : "Play"}</span>
          </Button>
          <Button type="button" variant="outline" size="lg" className="min-h-14" onClick={() => onStep(1)}>
            <SkipForward className="size-5" />
            <span className="sr-only">Next verse</span>
          </Button>
          <Button type="button" variant="outline" size="lg" className="min-h-14" onClick={() => onNudge(5)}>
            <FastForward className="size-5" />
            <span className="sr-only">Forward 5 seconds</span>
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onLoop(!loop)}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] px-2 text-sm font-semibold shadow-[var(--shadow-border)] ${
              loop ? "bg-ink text-parchment" : "bg-surface text-ink"
            }`}
          >
            <Repeat className="size-4" />
            {loop ? "Loop on" : "Loop off"}
          </button>
          <p className="flex min-h-12 items-center justify-center text-center text-xs text-muted">
            {loop ? "Repeats this passage." : "Stops at the last verse."}
          </p>
        </div>
        <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-muted">Speed</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {READ_RATES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => onRate(r.value)}
              className={`min-h-12 rounded-[var(--radius-md)] px-2 text-sm font-semibold shadow-[var(--shadow-border)] ${
                rate === r.value ? "bg-ink text-parchment" : "bg-surface text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function VerseClipBar({
  book,
  chapter,
  fromV,
  toV,
  loop,
}: {
  book: BookId;
  chapter: number;
  fromV: number;
  toV: number;
  loop: boolean;
}) {
  const navigate = useNavigate();
  const max = versesInChapter(book, chapter);
  const [from, setFrom] = useState(String(fromV));
  const [to, setTo] = useState(String(toV));
  useEffect(() => {
    setFrom(String(fromV));
    setTo(String(toV));
  }, [fromV, toV]);

  function apply(e?: { preventDefault(): void }) {
    e?.preventDefault();
    const a = Math.min(max, Math.max(1, Number(from) || 1));
    const b = Math.min(max, Math.max(1, Number(to) || max));
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const whole = lo === 1 && hi === max;
    void navigate({
      to: "/listen/read/$book/$ch",
      params: { book, ch: String(chapter) },
      search: whole ? (loop ? { loop: true } : {}) : { v1: lo, v2: hi, ...(loop ? { loop: true } : {}) },
    });
  }

  return (
    <form className="mt-4 min-w-0 rounded-[var(--radius-md)] bg-surface p-3 shadow-[var(--shadow-border)]" onSubmit={apply}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">This chapter · verses</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="grid min-w-0 gap-1 text-xs font-semibold text-ink">
          From
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="min-h-12 min-w-0 w-full rounded-[var(--radius-sm)] bg-card px-3 text-base font-semibold text-ink shadow-[var(--shadow-border)]"
            aria-label="From verse"
          />
        </label>
        <label className="grid min-w-0 gap-1 text-xs font-semibold text-ink">
          To
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="min-h-12 min-w-0 w-full rounded-[var(--radius-sm)] bg-card px-3 text-base font-semibold text-ink shadow-[var(--shadow-border)]"
            aria-label="To verse"
          />
        </label>
      </div>
      <Button type="submit" size="lg" className="mt-2 w-full">
        Play this range
      </Button>
      <p className="mt-2 text-xs text-muted">
        {max} verses in this chapter. Set a range to memorize, or play 1–{max} for the whole chapter.
      </p>
    </form>
  );
}

function GradeCard({
  item,
  qi,
  total,
  picked,
  onPick,
}: {
  item: GradeItem;
  qi: number;
  total: number;
  picked: string | null;
  onPick: (choice: string, item: GradeItem) => void;
}) {
  return (
    <div className="min-w-0 overflow-x-hidden rounded-[var(--radius-xl)] bg-card px-4 py-6 shadow-[var(--shadow-border)] sm:px-5 sm:py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {item.verse.ref} · {qi + 1}/{total}
      </p>
      <p className="he-verse mt-4 text-xl sm:text-2xl" lang="he" dir="rtl">
        {item.verse.words.map((w, wi) => (
          <span key={`${item.id}-g-${wi}`} className="text-ink">
            {w}
          </span>
        ))}
      </p>
      <p className="mt-6 text-sm font-semibold text-ink">Which English is this verse?</p>
      <ul className="mt-3 grid gap-2">
        {item.choices.map((c) => {
          const show = Boolean(picked);
          const right = c === item.answer;
          return (
            <li key={c}>
              <button
                type="button"
                disabled={show}
                onClick={() => onPick(c, item)}
                className={`w-full rounded-[var(--radius-md)] px-4 py-3 text-start text-sm shadow-[var(--shadow-border)] ${
                  show && right ? "bg-good text-parchment" : show && picked === c ? "bg-danger text-parchment" : "bg-surface text-ink"
                }`}
              >
                {c}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
