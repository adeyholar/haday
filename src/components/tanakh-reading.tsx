import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Ellipsis, Pause, Play, Repeat, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { hebrewClusters } from "@/lib/hebrew-phones";
import { Button } from "@/components/ui/button";
import { StudyReturnBanner } from "@/components/study-return-banner";
import { EchoVerse, type EchoClock } from "@/components/echo-verse";
import { EnglishVerse } from "@/components/english-verse";
import { WordSheet, type WordPick } from "@/components/word-sheet";
import { placeWordBalloon, type WordBalloonPlace } from "@/lib/word-balloon";
import { ReadingLoopBar } from "@/components/reading-loop-bar";
import { chapterKnown } from "@/lib/reading-loop/known";
import { poolFor } from "@/lib/reading-loop/pool";
import { noteVerse, peekSession, readDimUnknown, writeDimUnknown, DAILY_GOAL, type ReadSession } from "@/lib/reading-loop/session";
import { useStudy } from "@/lib/store";
import { Panel } from "@/components/panel";
import { useDockHeight, useFollowScroll } from "@/lib/use-follow-scroll";
import { playGrade } from "@/lib/sfx";
import {
  AUDIO_CREDIT,
  READ_RATES,
  audioFor,
  audioWindow,
  chapterFromAlign,
  fetchBookAlign,
  formatPlayTime,
  gradeFromVerses,
  highlightAtMeta,
  loadReadingProgress,
  mediaClockTime,
  progressId,
  saveReadingResult,
  sliceVerses,
  verseAtStarts,
  verseStartFrom,
  verseEndFrom,
  versesFromDump,
  withEstimatedTiming,
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
  fromSearch,
  prevPlayLoc,
  resolvePassage,
  sameLoc,
  takeAutoplay,
  verseWindow,
  versesInChapter,
  type ReadSearch,
} from "@/lib/passage";
import { englishKeysForWord } from "@/lib/word-card";
import { fetchStrongTags, type StrongBook } from "@/lib/strongs";
import { splitStrongTag } from "@/lib/morph-parse";
import { phraseAt, playPulse, waitForSpeech, waitUntilSaid, type AfterBag } from "@/lib/read-after";
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

type Mode = "follow" | "after" | "grade";
type AfterPhase = "off" | "model" | "pulse" | "wait" | "done";

const VOL_KEY = "haday-read-vol";

function loadReadVolume(): number {
  try {
    const n = Number(localStorage.getItem(VOL_KEY));
    if (Number.isFinite(n)) return Math.min(1, Math.max(0, n));
  } catch {
    /* private mode */
  }
  return 1;
}

function saveReadVolume(n: number) {
  try {
    localStorage.setItem(VOL_KEY, String(n));
  } catch {
    /* private mode */
  }
}

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
  const [afterPhase, setAfterPhase] = useState<AfterPhase>("off");
  const [afterMic, setAfterMic] = useState(true);
  const [phrase, setPhrase] = useState<{ from: number; to: number } | null>(null);
  const [strongBook, setStrongBook] = useState<StrongBook>({});
  const strongChapter = strongBook[String(chapter)] ?? {};
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
  const chapterRowsRef = useRef<ReadingVerse[]>([]);
  const rateRef = useRef(rate);
  const loopRef = useRef(loop);
  const passageRef = useRef(passage);
  const audioMetaRef = useRef<ChapterAudio>(audioFor(book, chapter));
  const echoClockRef = useRef<EchoClock>(null);
  const afterBag = useRef<AfterBag>({ stop: true, said: false, replay: false });
  const afterCtx = useRef<AudioContext | null>(null);
  const modeRef = useRef<Mode>("follow");
  const [audioMeta, setAudioMeta] = useState<ChapterAudio>(() => audioFor(book, chapter));
  const verse = verses[i];
  const pid = isFullChapter(passage) ? progressId(book, chapter) : `${book}.${chapter}.${vw.from}-${vw.to}`;
  const rec = loadReadingProgress()[pid];
  const aligned = Boolean(audioMeta.aligned);
  const win = audioWindow(audioMeta, vw.from, vw.to, tdur);
  iRef.current = i;
  versesRef.current = verses;
  rateRef.current = rate;
  loopRef.current = loop;
  passageRef.current = passage;
  audioMetaRef.current = audioMeta;
  modeRef.current = mode;

  function applyRate(el: HTMLAudioElement, n: number) {
    const next = n > 0 ? n : 1;
    el.playbackRate = next;
    el.defaultPlaybackRate = next;
    el.preservesPitch = true;
    clockRef.current = { media: el.currentTime, wall: performance.now(), rate: next };
  }

  useEffect(() => {
    let cancelled = false;
    setStrongBook({});
    void fetchStrongTags(book).then((data) => {
      if (!cancelled) setStrongBook(data);
    });
    return () => {
      cancelled = true;
    };
  }, [book]);

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

  function paintVerseWords(item: ReadingVerse, t: number) {
    const { word, cluster } = highlightAtMeta(audioMetaRef.current, item.verse, t, item.words);
    if (word !== wordRef.current) {
      wordRef.current = word;
      setWordI(word);
    }
    if (cluster !== clusterRef.current) {
      clusterRef.current = cluster;
      setClusterI(cluster);
    }
  }

  function onEchoClock(clock: EchoClock) {
    echoClockRef.current = clock;
    if (clock === "off") {
      if (wordRef.current !== -1) {
        wordRef.current = -1;
        setWordI(-1);
      }
      if (clusterRef.current !== -1) {
        clusterRef.current = -1;
        setClusterI(-1);
      }
      return;
    }
    if (clock == null) {
      onTime();
      return;
    }
    const item = versesRef.current[iRef.current];
    if (item) paintVerseWords(item, clock);
  }

  function onTime() {
    const echo = echoClockRef.current;
    if (echo === "off") return;
    if (typeof echo === "number") {
      const item = versesRef.current[iRef.current];
      if (item) paintVerseWords(item, echo);
      return;
    }
    if (modeRef.current === "after") return;
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
    if (item) paintVerseWords(item, t);
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
    afterBag.current.stop = true;
    setAfterPhase("off");
    setPhrase(null);
    setMode("follow");
    setQuiz(null);
    setDone(false);
    setAudioErr(false);
    halt();
    saveLastRead(book, chapter);
    chapterRowsRef.current = [];
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
    void Promise.all([fetchTanakhBook(book), fetchBookAlign(book)])
      .then(([dump, align]) => {
        if (cancelled) return;
        const timed = chapterFromAlign(book, chapter, align);
        audioMetaRef.current = timed;
        setAudioMeta(timed);
        if (el && timed.src && !(el.src.endsWith(timed.src) || el.src.includes(timed.src))) {
          el.src = timed.src;
        }
        const rows = versesFromDump(dump, chapter);
        chapterRowsRef.current = rows;
        const shown = sliceVerses(rows, vw.from, vw.to);
        versesRef.current = shown;
        setVerses(shown);
        if (!shown.length) setLoadErr("This passage is empty.");
        const node = elAudio();
        const dur = node?.duration && node.duration > 2 ? node.duration : timed.duration;
        if (dur > 2 && !timed.aligned) {
          const guessed = withEstimatedTiming(timed, rows, dur);
          audioMetaRef.current = guessed;
          setAudioMeta(guessed);
        }
        const start = verseStartFrom(audioMetaRef.current, shown[0]?.verse ?? vw.from);
        if (node) {
          node.currentTime = start;
          syncClock(node);
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
      const base = chapterRowsRef.current.length ? chapterRowsRef.current : versesRef.current;
      if (dur > 2 && base.length) {
        const next = withEstimatedTiming(audioMetaRef.current, base, dur);
        audioMetaRef.current = next;
        setAudioMeta(next);
      }
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

  function jumpTo(index: number) {
    const list = versesRef.current;
    if (index < 0 || index >= list.length) return;
    iRef.current = index;
    setI(index);
    setWordI(0);
    wordRef.current = 0;
    setClusterI(0);
    clusterRef.current = 0;
    void playFrom(index, true);
  }

  function stopAfter() {
    afterBag.current.stop = true;
    const el = elAudio();
    if (el) el.pause();
    setPlaying(false);
    setAfterPhase("off");
    setPhrase(null);
  }

  function audioCtx(): AudioContext {
    if (!afterCtx.current) afterCtx.current = new AudioContext();
    return afterCtx.current;
  }

  function playWordSlice(
    start: number,
    end: number,
    bag: AfterBag,
    onTime?: (t: number) => void,
  ): Promise<void> {
    const el = elAudio();
    if (!el) return Promise.resolve();
    const src = audioMetaRef.current.src || "";
    if (src && !(el.src.endsWith(src) || el.src.includes(src))) el.src = src;
    el.volume = 1;
    return new Promise((resolve) => {
      let timer = 0;
      const finish = () => {
        el.removeEventListener("timeupdate", onTick);
        window.clearTimeout(timer);
        resolve();
      };
      const onTick = () => {
        onTime?.(el.currentTime);
        if (bag.stop || bag.replay) {
          el.pause();
          finish();
          return;
        }
        if (el.currentTime >= end - 0.04) {
          el.pause();
          finish();
        }
      };
      timer = window.setTimeout(() => {
        el.pause();
        finish();
      }, Math.max(450, (end - start) * 1000 + 280));
      el.addEventListener("timeupdate", onTick);
      try {
        el.currentTime = Math.max(0, start);
      } catch {
        /* not ready yet */
      }
      void el.play().then(() => setPlaying(true)).catch(() => finish());
    });
  }

  function startAfter(verseIndex: number, wordIndex: number) {
    afterBag.current.stop = true;
    const bag: AfterBag = { stop: false, said: false, replay: false };
    afterBag.current = bag;
    const askMic = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    const el = elAudio();
    if (el) {
      el.volume = 1;
      void el.play().catch(() => {
        /* the word play follows */
      });
    }
    const prime = askMic
      ? askMic({ audio: true })
          .then((live) => {
            for (const track of live.getTracks()) track.stop();
          })
          .catch(() => {
            /* the sitting still runs; I said it advances */
          })
      : Promise.resolve();
    setMode("after");
    setQuiz(null);
    setDone(false);
    setAfterPhase("model");
    void prime.then(() => {
      if (!bag.stop) void runAfter(bag, verseIndex, wordIndex);
    });
  }

  function closeMic(stream: MediaStream | null) {
    stream?.getTracks().forEach((track) => track.stop());
  }

  async function settleSpeaker() {
    const ctx = afterCtx.current;
    if (ctx && ctx.state === "running") {
      try {
        await ctx.suspend();
      } catch {
        /* ignore */
      }
    }
    await new Promise((resolve) => window.setTimeout(resolve, 220));
  }

  async function openMic(): Promise<MediaStream | null> {
    const askMic = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    if (!askMic) return null;
    try {
      return await askMic({ audio: true });
    } catch {
      return null;
    }
  }

  async function runAfter(bag: AfterBag, verseIndex: number, wordIndex: number) {
    let vi = verseIndex;
    let wi = wordIndex;
    let stream: MediaStream | null = null;
    let nudged = false;
    let heardMic = false;
    const paint = (verseI: number, word: number) => {
      iRef.current = verseI;
      wordRef.current = word;
      clusterRef.current = -1;
      setI(verseI);
      setWordI(word);
      setClusterI(-1);
    };
    try {
      while (!bag.stop) {
        const list = versesRef.current;
        const item = list[vi];
        if (!item) {
          setAfterPhase("done");
          setPlaying(false);
          break;
        }
        if (wi >= item.words.length) {
          vi += 1;
          wi = 0;
          continue;
        }
        paint(vi, wi);
        closeMic(stream);
        stream = null;
        if (heardMic) await settleSpeaker();
        const el = elAudio();
        if (el) el.volume = 1;
        setAfterPhase("model");
        const group = phraseAt(audioMetaRef.current, item.verse, item.words, wi, el?.duration || tdur);
        setPhrase({ from: group.from, to: group.to });
        const starts = audioMetaRef.current.words?.[Math.max(0, item.verse - 1)] ?? [];
        await playWordSlice(group.start, group.end, bag, (t) => {
          let sounding = group.from;
          for (let n = group.from; n <= group.to; n++) {
            const stamp = starts[n];
            if (stamp != null && stamp <= t + 0.04) sounding = n;
          }
          if (sounding !== wordRef.current) {
            wordRef.current = sounding;
            setWordI(sounding);
          }
        });
        if (bag.stop) break;
        if (bag.replay) {
          bag.replay = false;
          continue;
        }
        setPlaying(false);
        setAfterPhase("pulse");
        const ctx = audioCtx();
        if (ctx.state === "suspended") await ctx.resume();
        await playPulse(ctx);
        if (bag.stop) break;
        stream = await openMic();
        heardMic = heardMic || Boolean(stream);
        setAfterMic(Boolean(stream));
        setAfterPhase("wait");
        const heard = stream
          ? await waitForSpeech(ctx, stream, bag, 8000)
          : await waitUntilSaid(bag, 20000);
        if (bag.stop || heard === "stop") break;
        if (heard === "replay") continue;
        if (heard === "timeout") {
          if (!nudged) {
            nudged = true;
            continue;
          }
          const again = await waitUntilSaid(bag, 60000);
          if (again === "stop" || bag.stop) break;
          if (again === "replay") continue;
          if (again === "timeout") continue;
        }
        nudged = false;
        wi = group.to + 1;
        if (wi >= item.words.length) {
          vi += 1;
          wi = 0;
        }
      }
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      if (!bag.stop && afterBag.current === bag) setPlaying(false);
    }
  }

  function startGrade() {
    stopAfter();
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
      <StudyReturnBanner />
      <div className="mb-3 flex items-center gap-1.5">
        <h1 className="shrink-0 font-display text-lg font-bold text-ink">
          <Link to="/listen/read/$book" params={{ book }} search={fromSearch(passage.from)} className="hover:underline">
            {meta?.en ?? book} {chapter}
          </Link>
        </h1>
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-1" role="tablist" aria-label="Reading mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "follow"}
            aria-label="Follow along"
            onClick={() => {
              stopAfter();
              setMode("follow");
              setQuiz(null);
              setDone(false);
            }}
            className={`min-h-11 rounded-[var(--radius-md)] px-1 text-xs font-semibold ${
              mode === "follow" ? "bg-ink text-parchment" : "bg-card text-ink shadow-[var(--shadow-border)]"
            }`}
          >
            Follow
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "after"}
            aria-label="Read after me"
            onClick={() => startAfter(0, 0)}
            disabled={!verses.length}
            className={`min-h-11 rounded-[var(--radius-md)] px-1 text-xs font-semibold ${
              mode === "after" ? "bg-ink text-parchment" : "bg-card text-ink shadow-[var(--shadow-border)]"
            }`}
          >
            Repeat
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "grade"}
            aria-label="Grade reading"
            onClick={startGrade}
            disabled={!verses.length}
            className={`min-h-11 rounded-[var(--radius-md)] px-1 text-xs font-semibold ${
              mode === "grade" ? "bg-ink text-parchment" : "bg-card text-ink shadow-[var(--shadow-border)]"
            }`}
          >
            Grade
          </button>
        </div>
        <p className="shrink-0 text-xs font-semibold tabular-nums text-muted">
          {verse ? `${verse.verse} of ${versesInChapter(book, chapter)}` : ""}
        </p>
      </div>

      {(mode === "follow" || mode === "after") && verse ? (
        <FollowCard
          audioRef={audioRef}
          verse={verse}
          verses={verses}
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
          verseStart={verseStartFrom(audioMeta, verse.verse)}
          verseEnd={verseEndFrom(audioMeta, verse.verse, tdur)}
          audioSrc={audioMeta.src}
          loop={loop}
          preload={local ? "auto" : "metadata"}
          onToggle={() => {
            if (playing) halt();
            else void playFrom(i, true);
          }}
          onHalt={halt}
          onEchoClock={onEchoClock}
          onStep={step}
          onJump={jumpTo}
          onWord={mode === "after" ? (verseIndex, word) => startAfter(verseIndex, word) : undefined}
          hideTransport={mode === "after"}
          phrase={mode === "after" ? phrase : null}
          strongChapter={strongChapter}
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
          fromV={vw.from}
          toV={vw.to}
        />
      ) : null}

      {mode === "after" ? (
        <div className="read-dock">
          <p className="mx-auto max-w-3xl truncate px-3 pt-1 text-center text-xs font-semibold text-muted">
            {afterPhase === "done"
              ? "Sample finished"
              : afterPhase === "wait" || afterPhase === "pulse"
                ? "Your turn"
                : afterPhase === "model"
                  ? "Listen"
                  : "Read after me"}
          </p>
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-1 px-2 pb-1">
            {afterPhase === "done" || afterPhase === "off" ? (
              <button type="button" className="min-h-11 min-w-11 rounded-[var(--radius-md)] bg-ink px-3 text-xs font-semibold text-parchment" onClick={() => startAfter(0, 0)}>
                {afterPhase === "done" ? "Again" : "Start"}
              </button>
            ) : (
              <button
                type="button"
                className="min-h-11 min-w-11 rounded-[var(--radius-md)] bg-ink px-3 text-xs font-semibold text-parchment"
                onClick={() => {
                  afterBag.current.said = true;
                }}
              >
                I said it
              </button>
            )}
            <button
              type="button"
              className="min-h-11 rounded-[var(--radius-md)] bg-card px-3 text-xs font-semibold text-ink shadow-[var(--shadow-border)]"
              onClick={() => {
                afterBag.current.replay = true;
              }}
              disabled={afterPhase === "done" || afterPhase === "off"}
            >
              Hear it again
            </button>
            <button
              type="button"
              className="min-h-11 rounded-[var(--radius-md)] bg-card px-3 text-xs font-semibold text-ink shadow-[var(--shadow-border)]"
              onClick={stopAfter}
              disabled={afterPhase === "off" || afterPhase === "done"}
            >
              Stop
            </button>
          </div>
        </div>
      ) : null}

      {(mode === "follow" || mode === "after") && !verse && !loadErr ? (
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

        <p className="mt-3 text-muted">
          {multi
            ? `Playing ${passageLabel(passage)}. This chapter has ${verses.length || vw.to} verses. When it ends, the next chapter in the range starts.`
            : !isFullChapter(passage)
              ? `Recorded Hebrew for ${passageLabel(passage)} — all ${
                  verses.length || vw.to - vw.from + 1
                } ${
                  (verses.length || vw.to - vw.from + 1) === 1 ? "verse stays" : "verses stay"
                } on the page and play in one sitting.`
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
          <p className="mt-2 text-sm text-muted">Word highlight follows Hebrew syllable weight until this chapter is verse-timed.</p>
        ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {prevLoc ? (
          <Link
            to="/listen/read/$book/$ch"
            params={{ book: prevLoc.book, ch: String(prevLoc.chapter) }}
            search={multi ? passageSearch({ ...live, book: prevLoc.book, chapter: prevLoc.chapter }) : fromSearch(passage.from)}
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
            search={multi ? passageSearch({ ...live, book: nxtLoc.book, chapter: nxtLoc.chapter }) : fromSearch(passage.from)}
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

      <p className="mb-28 mt-6 text-xs text-muted">
        {AUDIO_CREDIT}{" "}
        <Link to="/credits" className="font-semibold text-primary underline-offset-4 hover:underline">
          Full credits
        </Link>
      </p>
    </>
  );
}

function FollowCard({
  audioRef,
  verse,
  verses,
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
  verseStart,
  verseEnd,
  audioSrc,
  loop,
  preload,
  onToggle,
  onHalt,
  onEchoClock,
  onStep,
  onJump,
  onWord,
  hideTransport,
  phrase,
  strongChapter,
  onNudge,
  onSeek,
  onSeeking,
  onRate,
  onLoop,
  fromV,
  toV,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  verse: ReadingVerse;
  verses: ReadingVerse[];
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
  verseStart: number;
  verseEnd: number;
  audioSrc: string;
  loop: boolean;
  preload: "auto" | "metadata";
  onToggle: () => void;
  onHalt: () => void;
  onEchoClock: (clock: EchoClock) => void;
  onStep: (d: number) => void;
  onJump: (index: number) => void;
  onWord?: (verseIndex: number, wordIndex: number) => void;
  hideTransport?: boolean;
  phrase?: { from: number; to: number } | null;
  strongChapter?: Record<string, string[]>;
  onNudge: (sec: number) => void;
  onSeek: (t: number) => void;
  onSeeking: (yes: boolean) => void;
  onRate: (n: number) => void;
  onLoop: (on: boolean) => void;
  fromV: number;
  toV: number;
}) {
  const lo = windowStart;
  const [vol, setVol] = useState(loadReadVolume);
  const lastVol = useRef(vol || 1);
  const [pick, setPick] = useState<WordPick | null>(null);
  const [balloon, setBalloon] = useState<WordBalloonPlace | null>(null);
  const wordEl = useRef<HTMLButtonElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const follow = useFollowScroll(verse.ref);
  const playingRef = useRef(playing);
  const resumeRef = useRef(follow.resume);
  const onToggleRef = useRef(onToggle);
  const onNudgeRef = useRef(onNudge);
  const hideTransportRef = useRef(hideTransport);
  playingRef.current = playing;
  resumeRef.current = follow.resume;
  onToggleRef.current = onToggle;
  onNudgeRef.current = onNudge;
  hideTransportRef.current = hideTransport;
  useDockHeight(dockRef, !hideTransport);
  const [more, setMore] = useState(false);
  const list = verses.length ? verses : [verse];
  const cards = useStudy((s) => s.cards);
  const [dim, setDim] = useState(false);
  const [session, setSession] = useState<ReadSession>({ day: "", today: 0, goal: DAILY_GOAL, last: null });
  const loopWords = useMemo(
    () => list.flatMap((row) => row.words.map((surface, wi) => ({ id: `${row.ref}:${wi}`, surface }))),
    [list],
  );
  const knownReport = useMemo(() => chapterKnown(loopWords, poolFor("bbh"), cards), [loopWords, cards]);
  const unknownKeys = useMemo(() => new Set(knownReport.unknownWordIds), [knownReport]);
  useEffect(() => {
    setDim(readDimUnknown());
    setSession(peekSession());
  }, []);
  useEffect(() => {
    const row = list[i] ?? verse;
    setSession(
      noteVerse({
        scope: "bbh",
        book: String(row.book),
        chapter: row.chapter,
        verse: row.verse,
        href: `/listen/read/${row.book}/${row.chapter}`,
      }),
    );
  }, [i, verse.book, verse.chapter, verse.verse]);
  useEffect(() => {
    setPick(null);
  }, [verse.ref]);
  useLayoutEffect(() => {
    if (!pick) {
      setBalloon(null);
      return;
    }
    let last: WordBalloonPlace | null = null;
    const measure = () => {
      const el = document.querySelector<HTMLElement>("[data-word-pick='1']");
      const rect = el?.getBoundingClientRect();
      if (!rect || rect.width < 1) return;
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
        setPick(null);
        return;
      }
      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const headerRaw = getComputedStyle(document.documentElement).getPropertyValue("--read-header");
      const header = headerRaw.trim().endsWith("rem") ? parseFloat(headerRaw) * rootPx : parseFloat(headerRaw) || 3.5 * rootPx;
      const navRaw = getComputedStyle(document.documentElement).getPropertyValue("--nav-h").trim();
      const nav = navRaw.endsWith("rem") ? parseFloat(navRaw) * rootPx : parseFloat(navRaw) || 3.5 * rootPx;
      const dock = document.querySelector(".read-dock")?.getBoundingClientRect();
      const floor = (dock && dock.top > 0 ? dock.top : window.innerHeight - nav) - 8;
      const next = placeWordBalloon({
        word: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
        viewportWidth: window.innerWidth,
        ceiling: header + 8,
        floor,
        rootFontPx: rootPx,
      });
      if (
        last &&
        last.side === next.side &&
        Math.abs(last.top - next.top) < 0.5 &&
        Math.abs(last.left - next.left) < 0.5 &&
        Math.abs(last.width - next.width) < 0.5 &&
        Math.abs(last.maxHeight - next.maxHeight) < 0.5 &&
        Math.abs(last.tail - next.tail) < 0.5
      ) {
        return;
      }
      last = next;
      setBalloon(next);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [pick]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const field =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if (field) return;
      if (!hideTransportRef.current && event.key === "ArrowLeft") {
        event.preventDefault();
        onNudgeRef.current(-5);
        return;
      }
      if (!hideTransportRef.current && event.key === "ArrowRight") {
        event.preventDefault();
        onNudgeRef.current(5);
        return;
      }
      if (event.key === " " && event.target instanceof HTMLElement && event.target.tagName === "BUTTON") return;
      if (event.key === " " && !event.repeat && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        event.preventDefault();
        if (!playingRef.current) resumeRef.current();
        onToggleRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  function cycleRate() {
    const at = READ_RATES.findIndex((row) => row.value === rate);
    const next = READ_RATES[(at + 1) % READ_RATES.length] ?? READ_RATES[0];
    onRate(next.value);
  }
  useEffect(() => {
    if (vol > 0) lastVol.current = vol;
    saveReadVolume(vol);
    const el = audioRef.current;
    if (!el) return;
    const apply = () => {
      el.volume = vol;
    };
    apply();
    el.addEventListener("loadedmetadata", apply);
    return () => el.removeEventListener("loadedmetadata", apply);
  }, [vol, audioRef]);
  const hi = windowEnd > windowStart ? windowEnd : duration;
  const span = Math.max(0, hi - lo);
  const rel = Math.max(0, Math.min(span, now - lo));
  const bookId = verse.book === "Gen" ? "Gen" : verse.book;
  const loopBack = `/listen/read/${bookId}/${verse.chapter}`;
  const focusWord = pick?.word ?? verse.words[wordI] ?? "";
  const enKeys = englishKeysForWord(focusWord);
  return (
    <>
      {hideTransport ? null : (
        <div className="read-dock" ref={dockRef}>
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 pt-1">
            <span className="w-10 shrink-0 text-xs tabular-nums text-muted">{formatPlayTime(rel)}</span>
            <input
              className="audio-seek min-w-0 flex-1"
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
            <span className="w-10 shrink-0 text-end text-xs tabular-nums text-muted">{formatPlayTime(span || duration)}</span>
          </div>
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-1 px-2 pb-1">
            <button type="button" className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-ink" aria-label="Previous verse" onClick={() => onStep(-1)}>
              <SkipBack className="size-5" />
            </button>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full bg-ink text-parchment"
              aria-label={playing ? "Pause" : "Play"}
              onClick={() => {
                if (!playing) follow.resume();
                onToggle();
              }}
            >
              {playing ? <Pause className="size-5" /> : <Play className="size-5 ms-0.5" />}
            </button>
            <button type="button" className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-ink" aria-label="Next verse" onClick={() => onStep(1)}>
              <SkipForward className="size-5" />
            </button>
            <button
              type="button"
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] px-2 text-sm font-semibold tabular-nums text-ink"
              aria-label={`Speed ${rate}×. Tap for the next speed.`}
              onClick={cycleRate}
            >
              {rate}×
            </button>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-ink"
              aria-label="More player controls"
              aria-expanded={more}
              onClick={() => setMore((open) => !open)}
            >
              <Ellipsis className="size-5" />
            </button>
          </div>
        </div>
      )}
      {hideTransport || !more ? null : (
        <div className="read-more mx-auto max-w-3xl px-3 py-3">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => onLoop(!loop)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm font-semibold ${
                loop ? "bg-ink text-parchment" : "bg-surface text-ink"
              }`}
            >
              <Repeat className="size-4" />
              {loop ? "Loop on" : "Loop off"}
            </button>
            <button type="button" className="min-h-11 rounded-[var(--radius-md)] bg-surface px-3 text-sm font-semibold text-ink" onClick={() => onNudge(-5)}>
              Back 5 seconds
            </button>
            <button type="button" className="min-h-11 rounded-[var(--radius-md)] bg-surface px-3 text-sm font-semibold text-ink" onClick={() => onNudge(5)}>
              Forward 5 seconds
            </button>
            <button type="button" className="min-h-11 rounded-[var(--radius-md)] bg-surface px-3 text-sm font-semibold text-ink" onClick={() => onJump(i)}>
              Replay verse
            </button>
          </div>
          <div className="mt-3 hidden items-center gap-3 md:flex">
            <button
              type="button"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-ink"
              aria-label={vol === 0 ? "Unmute" : "Mute"}
              onClick={() => setVol((v) => (v === 0 ? lastVol.current || 1 : 0))}
            >
              {vol === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
            <input
              className="audio-seek flex-1"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={vol}
              aria-label="Volume"
              onChange={(e) => setVol(Number(e.target.value))}
            />
          </div>
          <VerseClipBar book={verse.book as BookId} chapter={verse.chapter} fromV={fromV} toV={toV} loop={loop} />
        </div>
      )}
      {follow.showBack ? (
        <button type="button" className="read-back min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-parchment" onClick={follow.resume}>
          Back to the reader
        </button>
      ) : null}
      <div className="min-w-0 overflow-x-hidden rounded-[var(--radius-xl)] bg-card px-4 py-4 shadow-[var(--shadow-border)] sm:px-5">
        {hideTransport ? null : (
          <ReadingLoopBar
            scope="bbh"
            report={knownReport}
            session={session}
            dim={dim}
            onDim={(on) => {
              setDim(on);
              writeDimUnknown(on);
            }}
            refLabel={`${bookId}.${verse.chapter}`}
            back={loopBack}
          />
        )}
        <ol className="flex flex-col gap-6">
          {list.map((row, idx) => {
            const active = idx === i;
            return (
              <li
                key={row.ref}
                ref={(node) => {
                  if (active) follow.targetRef.current = node;
                }}
                className="read-line"
              >
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-wide text-muted"
                  onClick={() => (onWord ? onWord(idx, 0) : onJump(idx))}
                >
                  {row.ref}
                </button>
                <p
                  className={`he-verse mt-2 ${active ? "text-xl sm:text-2xl md:text-3xl" : "text-lg sm:text-xl"}`}
                  lang="he"
                  dir="rtl"
                >
                  {row.words.map((w, wi) =>
                    active ? (
                      <button
                        type="button"
                        key={`${row.ref}-${wi}`}
                        ref={wi === wordI ? wordEl : undefined}
                        className={`max-w-full rounded-sm bg-transparent px-0.5 py-1 text-start shadow-none ${
                          wi === wordI
                            ? "he-spoken"
                            : phrase && wi >= phrase.from && wi <= phrase.to
                              ? "he-phrase"
                              : "text-ink"
                        } ${pick?.index === wi && pick.verse === row.verse ? "he-tapped" : ""} ${
                          (strongChapter?.[String(row.verse)]?.[wi] ?? "") ? "underline decoration-dotted decoration-primary/50 underline-offset-4" : ""
                        } ${dim && unknownKeys.has(`${row.ref}:${wi}`) && wi !== wordI ? "ms-unknown" : ""}`}
                        data-word-pick={pick?.index === wi && pick.verse === row.verse ? "1" : undefined}
                        onClick={() => {
                          const tag = strongChapter?.[String(row.verse)]?.[wi] ?? "";
                          const { id: sid, morph } = splitStrongTag(tag);
                          if (onWord) {
                            onWord(idx, wi);
                            return;
                          }
                          if (pick?.index === wi && pick.verse === row.verse && !sid) {
                            setPick(null);
                            return;
                          }
                          setPick({
                            word: w,
                            index: wi,
                            book: bookId,
                            chapter: row.chapter,
                            verse: row.verse,
                            he: row.he,
                            en: row.en,
                            strong: sid || undefined,
                            morph: morph || undefined,
                          });
                        }}
                      >
                        {hebrewClusters(w).map((part, pi) => (
                          <span
                            key={`${row.ref}-${wi}-${pi}`}
                            className={
                              wi === wordI && (clusterI < 0 || pi === clusterI)
                                ? "rounded-sm bg-primary px-0.5 text-primary-foreground"
                                : undefined
                            }
                          >
                            {part.glyph}
                          </span>
                        ))}
                      </button>
                    ) : (
                      <button
                        type="button"
                        key={`${row.ref}-${wi}`}
                        className={`max-w-full rounded-sm bg-transparent px-0.5 py-1 text-start text-ink shadow-none ${
                          pick?.index === wi && pick.verse === row.verse ? "he-tapped" : ""
                        } ${dim && unknownKeys.has(`${row.ref}:${wi}`) ? "ms-unknown" : ""}`}
                        data-word-pick={pick?.index === wi && pick.verse === row.verse ? "1" : undefined}
                        onClick={() => {
                          const { id: sid, morph } = splitStrongTag(strongChapter?.[String(row.verse)]?.[wi] ?? "");
                          if (!onWord && sid) {
                            setPick({
                              word: w,
                              index: wi,
                              book: bookId,
                              chapter: row.chapter,
                              verse: row.verse,
                              he: row.he,
                              en: row.en,
                              strong: sid,
                              morph: morph || undefined,
                            });
                            return;
                          }
                          if (onWord) onWord(idx, wi);
                          else onJump(idx);
                        }}
                      >
                        {w}
                      </button>
                    ),
                  )}
                </p>
                <EnglishVerse
                  en={row.en}
                  keys={active ? enKeys : []}
                  className={`max-w-full break-words leading-relaxed ${
                    active ? "mt-2 text-base text-ink" : "mt-1 text-sm text-muted"
                  }`}
                />
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-muted">
          {hideTransport
            ? "Tap a word to start there. The marked words are the phrase you repeat after the pulse."
            : list.length >= 10
              ? "Every verse in this range is on the page. Tap a verse to read it. Highlight follows the reader."
              : "Tap a word. The card opens on that word."}
        </p>
        <p className="mt-6 text-sm tabular-nums text-muted">
          {i + 1} / {total}
        </p>
        {hideTransport ? null : (
          <EchoVerse src={audioSrc} start={verseStart} end={verseEnd} onHalt={onHalt} onClock={onEchoClock} />
        )}
      </div>
      {pick && balloon ? <WordSheet pick={pick} place={balloon} onClose={() => setPick(null)} /> : null}

      <audio ref={audioRef} className="sr-only" preload={preload} playsInline />
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
