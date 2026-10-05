import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import { speakHebrewWord, stopSpeech, unlockSpeech } from "@/lib/listen";
import {
  buildRoadDeck,
  parseRoadLetter,
  type RoadCard,
  type RoadLetter,
} from "@/lib/road-exam";
import { useStudy } from "@/lib/store";
import { itemsForWeek } from "@/lib/vocab";

export const Route = createFileRoute("/game/road")({ component: RoadExamPage });

type Phase = "speak" | "listen" | "feedback" | "done";

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function speechCtor(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function RoadExamPage() {
  const pool = useMemo(() => itemsForWeek(7), []);
  const rate = useStudy((s) => s.rate);
  const [queue, setQueue] = useState<RoadCard[]>([]);
  const [i, setI] = useState(0);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>("speak");
  const [tries, setTries] = useState(0);
  const [picked, setPicked] = useState<RoadLetter | null>(null);
  const [note, setNote] = useState("");
  const [heard, setHeard] = useState(0);
  const [held, setHeld] = useState(0);
  const [micOn, setMicOn] = useState(false);

  const phaseRef = useRef<Phase>("speak");
  const lock = useRef(false);
  const triesRef = useRef(0);
  const iRef = useRef(0);
  const taskRef = useRef<RoadCard | null>(null);
  const voice = useRef({ stop: false });
  const recRef = useRef<SpeechRec | null>(null);
  const listenGen = useRef(0);
  const opening = useRef<Promise<void> | null>(null);

  const task = queue[i] ?? null;
  const finished = started && queue.length > 0 && i >= queue.length;
  phaseRef.current = finished ? "done" : phase;
  triesRef.current = tries;
  iRef.current = i;
  taskRef.current = task;

  function stopRec() {
    listenGen.current += 1;
    const rec = recRef.current;
    recRef.current = null;
    if (!rec) return;
    rec.onresult = null;
    rec.onend = null;
    rec.onerror = null;
    try {
      rec.abort();
    } catch {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    }
  }

  function startRec() {
    stopRec();
    const Ctor = speechCtor();
    if (!Ctor) {
      setMicOn(false);
      return;
    }
    const gen = listenGen.current;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.onresult = (ev) => {
      if (gen !== listenGen.current || phaseRef.current !== "listen") return;
      for (let r = ev.resultIndex; r < ev.results.length; r++) {
        const alts = ev.results[r];
        for (let a = 0; a < alts.length; a++) {
          const letter = parseRoadLetter(alts[a].transcript);
          if (letter) {
            take(letter);
            return;
          }
        }
      }
    };
    rec.onerror = () => {
      if (gen !== listenGen.current) return;
      setMicOn(false);
    };
    rec.onend = () => {
      if (gen !== listenGen.current || phaseRef.current !== "listen") return;
      try {
        rec.start();
      } catch {
        setMicOn(false);
      }
    };
    recRef.current = rec;
    try {
      rec.start();
      setMicOn(true);
    } catch {
      setMicOn(false);
    }
  }

  function goNext(recycle: boolean) {
    const current = taskRef.current;
    const index = iRef.current;
    if (recycle && current && !current.key.endsWith(":back")) {
      setQueue((prev) => {
        const rest = prev.slice(index + 1);
        const at = rest.length ? 1 + Math.floor(Math.random() * rest.length) : 0;
        const again: RoadCard = { ...current, key: `${current.key}:back` };
        return [...prev.slice(0, index + 1), ...rest.slice(0, at), again, ...rest.slice(at)];
      });
    }
    setTries(0);
    setPicked(null);
    setNote("");
    setI(index + 1);
    lock.current = false;
  }

  function take(letter: RoadLetter) {
    const current = taskRef.current;
    if (!current || lock.current) return;
    if (phaseRef.current === "feedback" || phaseRef.current === "done") return;
    lock.current = true;
    phaseRef.current = "feedback";
    stopRec();
    voice.current.stop = true;
    stopSpeech();
    const right = current.choices.find((c) => c.correct);
    const ok = current.choices.some((c) => c.letter === letter && c.correct);
    if (ok) {
      setPicked(letter);
      setPhase("feedback");
      setNote("Correct");
      rate(current.item.id, "good");
      setHeard((n) => n + 1);
      setHeld((n) => n + 1);
      window.setTimeout(() => {
        if (phaseRef.current === "done") return;
        goNext(false);
      }, 700);
      return;
    }
    if (triesRef.current < 1) {
      setTries(1);
      triesRef.current = 1;
      setPhase("feedback");
      setNote("Try again");
      const key = current.key;
      window.setTimeout(() => {
        if (taskRef.current?.key !== key || phaseRef.current === "done") return;
        lock.current = false;
        phaseRef.current = "listen";
        setPhase("listen");
        setNote("");
        startRec();
      }, 1100);
      return;
    }
    setPicked(letter);
    setPhase("feedback");
    setNote(right ? `Not yet. It is ${right.letter}.` : "Not yet");
    rate(current.item.id, "again");
    setHeard((n) => n + 1);
    window.setTimeout(() => {
      if (phaseRef.current === "done") return;
      goNext(true);
    }, 1400);
  }

  useEffect(() => {
    if (!started || !task) return;
    lock.current = false;
    setTries(0);
    triesRef.current = 0;
    setPicked(null);
    setNote("");
    setPhase("speak");
    stopRec();
    const pending = opening.current;
    opening.current = null;
    const signal = pending ? voice.current : { stop: false };
    if (!pending) voice.current = signal;
    let replay: number | undefined;
    void (async () => {
      if (!pending) {
        unlockSpeech();
        await speakHebrewWord(task.item, 0.92, signal);
      } else {
        await pending;
      }
      if (signal.stop) return;
      phaseRef.current = "listen";
      setPhase("listen");
      startRec();
      replay = window.setTimeout(() => {
        if (signal.stop || phaseRef.current !== "listen") return;
        stopRec();
        phaseRef.current = "speak";
        setPhase("speak");
        void speakHebrewWord(task.item, 0.92, signal).then(() => {
          if (signal.stop || phaseRef.current === "feedback" || phaseRef.current === "done") return;
          phaseRef.current = "listen";
          setPhase("listen");
          startRec();
        });
      }, 12000);
    })();
    return () => {
      signal.stop = true;
      if (replay) window.clearTimeout(replay);
      stopRec();
    };
    // startRec closes over the latest card via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, task?.key]);

  useEffect(() => () => stopRec(), []);

  function begin() {
    unlockSpeech();
    const deck = buildRoadDeck(pool);
    const first = deck[0];
    if (first) {
      const signal = { stop: false };
      voice.current = signal;
      opening.current = speakHebrewWord(first.item, 0.92, signal);
    }
    const media = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    if (media) {
      void media({ audio: true })
        .then((stream) => {
          for (const track of stream.getTracks()) track.stop();
        })
        .catch(() => {
          /* taps still work */
        });
    }
    setQueue(deck);
    setI(0);
    setHeard(0);
    setHeld(0);
    setStarted(true);
  }

  if (!pool.length) {
    return (
      <Panel>
        <GameMenu />
        <p className="mt-4 text-muted">No midterm words in this set.</p>
      </Panel>
    );
  }

  if (!started) {
    return (
      <>
        <Panel className="mb-4">
          <GameMenu />
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">Road exam · Week 7</h1>
          <p className="mt-2 max-w-prose text-muted">
            {pool.length} midterm words, chapters 2–11. The app says the Hebrew. Glance at A–D and say the letter. First
            wrong is try again, on the screen only. Second wrong shows the letter and brings the word back once.
            No clap and no horn, so the microphone is not talked over.
          </p>
        </Panel>
        <Button type="button" size="lg" className="w-full text-xl" onClick={begin}>
          Start — speak, then listen for A B C D
        </Button>
        <p className="mt-3 text-sm text-muted">Tap a letter if the microphone will not take your voice.</p>
      </>
    );
  }

  if (finished || !task) {
    const pct = heard ? Math.round((held / heard) * 100) : 0;
    return (
      <>
        <Panel className="mb-4">
          <GameMenu />
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">Drive done</h1>
          <p className="mt-2 text-muted">
            {held} held of {heard} · {pct}%.
          </p>
        </Panel>
        <Button type="button" size="lg" className="w-full" onClick={begin}>
          Drive it again
        </Button>
      </>
    );
  }

  const showMark = phase === "feedback" && (picked !== null || note.startsWith("Not yet"));

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-ink">Road exam</h1>
          <p className="text-sm tabular-nums text-muted">
            {i + 1} / {queue.length}
            {micOn ? " · listening" : " · tap a letter"}
          </p>
        </div>
        <p className="mt-2 text-sm text-muted">
          {phase === "speak" ? "The word is on the screen, and it is being called." : phase === "listen" ? "Say A, B, C, or D." : note}
        </p>
        <p className="he-word mt-4 text-center text-6xl font-bold leading-tight text-ink sm:text-7xl" lang="he" dir="rtl">
          {task.item.hebrew}
        </p>
      </Panel>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {task.choices.map((choice) => {
          const on = picked === choice.letter;
          return (
            <li key={choice.letter}>
              <button
                type="button"
                onClick={() => take(choice.letter)}
                disabled={phase === "feedback"}
                className={cn(
                  "flex min-h-28 w-full items-center gap-4 rounded-[var(--radius-xl)] px-4 py-4 text-left shadow-[var(--shadow-border)]",
                  !showMark && "bg-card",
                  showMark && choice.correct && "bg-good text-white",
                  showMark && on && !choice.correct && "bg-bad text-white",
                  showMark && !on && !choice.correct && "bg-card text-muted",
                )}
              >
                <span className="font-display text-5xl font-bold leading-none">{choice.letter}</span>
                <span className="font-display text-2xl font-semibold leading-tight">{choice.gloss}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full"
        onClick={() => {
          if (phase === "feedback") return;
          voice.current.stop = true;
          stopSpeech();
          const signal = { stop: false };
          voice.current = signal;
          stopRec();
          setPhase("speak");
          void speakHebrewWord(task.item, 0.92, signal).then(() => {
            if (signal.stop) return;
            setPhase("listen");
            startRec();
          });
        }}
      >
        Say the word again
      </Button>
    </>
  );
}
