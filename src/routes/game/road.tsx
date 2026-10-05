import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GameMenu } from "@/components/game-menu";
import { GradeBanner } from "@/components/grade-banner";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import { speakHebrewWord, stopSpeech, unlockSpeech } from "@/lib/listen";
import {
  buildRoadDeck,
  packRoadRun,
  parkMiss,
  parseRoadLetter,
  unpackRoadRun,
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
  const saveRoadRun = useStudy((s) => s.saveRoadRun);
  const storedRun = useStudy((s) => s.game.roadRun);
  const resume = useMemo(() => unpackRoadRun(storedRun, pool), [storedRun, pool]);
  const [queue, setQueue] = useState<RoadCard[]>([]);
  const [i, setI] = useState(0);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>("speak");
  const [tries, setTries] = useState(0);
  const [picked, setPicked] = useState<RoadLetter | null>(null);
  const [missed, setMissed] = useState<RoadLetter | null>(null);
  const [note, setNote] = useState("");
  const [heard, setHeard] = useState(0);
  const [held, setHeld] = useState(0);
  const [micOn, setMicOn] = useState(false);

  const phaseRef = useRef<Phase>("speak");
  const lock = useRef(false);
  const triesRef = useRef(0);
  const iRef = useRef(0);
  const taskRef = useRef<RoadCard | null>(null);
  const queueRef = useRef<RoadCard[]>([]);
  const heardRef = useRef(0);
  const heldRef = useRef(0);
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

  function settle(recycle: boolean, counts: { heard: number; held: number }, delay: number) {
    const current = taskRef.current;
    const index = iRef.current;
    let nextQueue = queueRef.current;
    if (recycle && current) nextQueue = parkMiss(nextQueue, current);
    const nextIndex = index + 1;
    queueRef.current = nextQueue;
    if (nextIndex >= nextQueue.length) saveRoadRun(null);
    else saveRoadRun(packRoadRun(nextQueue, nextIndex, counts.heard, counts.held));
    window.setTimeout(() => {
      if (phaseRef.current === "done") return;
      setQueue(nextQueue);
      setTries(0);
      setPicked(null);
      setMissed(null);
      setNote("");
      setI(nextIndex);
      lock.current = false;
    }, delay);
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
      const nextHeard = heardRef.current + 1;
      const nextHeld = heldRef.current + 1;
      heardRef.current = nextHeard;
      heldRef.current = nextHeld;
      setHeard(nextHeard);
      setHeld(nextHeld);
      settle(false, { heard: nextHeard, held: nextHeld }, 1100);
      return;
    }
    if (triesRef.current < 1) {
      setMissed(letter);
      setTries(1);
      triesRef.current = 1;
      setPhase("feedback");
      setNote("Retry");
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
    setNote(right ? `Not quite. It is ${right.letter}.` : "Not quite");
    rate(current.item.id, "again");
    const nextHeard = heardRef.current + 1;
    heardRef.current = nextHeard;
    setHeard(nextHeard);
    settle(true, { heard: nextHeard, held: heldRef.current }, 1400);
  }

  useEffect(() => {
    if (!started || !task) return;
    lock.current = false;
    setTries(0);
    triesRef.current = 0;
    setPicked(null);
    setMissed(null);
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

  function begin(fresh: boolean) {
    unlockSpeech();
    const restored = fresh ? null : unpackRoadRun(useStudy.getState().game.roadRun, pool);
    const deck = restored ? restored.queue : buildRoadDeck(pool);
    const startAt = restored ? restored.index : 0;
    const startHeard = restored ? restored.heard : 0;
    const startHeld = restored ? restored.held : 0;
    const card = deck[startAt];
    if (card) {
      const signal = { stop: false };
      voice.current = signal;
      opening.current = speakHebrewWord(card.item, 0.92, signal);
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
    queueRef.current = deck;
    heardRef.current = startHeard;
    heldRef.current = startHeld;
    setQueue(deck);
    setI(startAt);
    setHeard(startHeard);
    setHeld(startHeld);
    setTries(0);
    setPicked(null);
    setMissed(null);
    setNote("");
    setStarted(true);
    saveRoadRun(packRoadRun(deck, startAt, startHeard, startHeld));
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
    const place = resume ? resume.index + 1 : 0;
    return (
      <>
        <Panel className="mb-4">
          <GameMenu />
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">Road exam · Week 7</h1>
          {resume ? (
            <p className="mt-2 max-w-prose text-muted">
              This circle is still open, on word {place} of {resume.queue.length}. It keeps going until every miss is
              correct. Leaving does not start you over.
            </p>
          ) : (
            <p className="mt-2 max-w-prose text-muted">
              {pool.length} midterm words, chapters 2–11. The app says the Hebrew. Glance at A–D and say the letter. First
              wrong shows Retry, turns that button red, and waits for a second try. Second wrong shows Not quite, turns the
              right letter green, and that word goes to the back of the deck — and back again if it is missed once more.
              A right letter turns that button green. The circle stays saved when you leave. It ends only when every miss
              has been correct. Then a new circle can start. Still no clap and no horn, so the microphone is not talked over.
            </p>
          )}
        </Panel>
        {resume ? (
          <Button type="button" size="lg" className="w-full text-xl" onClick={() => begin(false)}>
            Continue — word {place} of {resume.queue.length}
          </Button>
        ) : (
          <Button type="button" size="lg" className="w-full text-xl" onClick={() => begin(true)}>
            Start — speak, then listen for A B C D
          </Button>
        )}
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
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">Circle clear</h1>
          <p className="mt-2 text-muted">Every miss in this circle was corrected.</p>
          <p className="mt-2 text-muted">
            {held} held of {heard} · {pct}%.
          </p>
        </Panel>
        <Button type="button" size="lg" className="w-full" onClick={() => begin(true)}>
          Start a new circle
        </Button>
      </>
    );
  }

  const secondMiss = phase === "feedback" && note.startsWith("Not quite");
  const retrySign = !secondMiss && tries > 0 && phase !== "speak";

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
        <p className="mt-1 text-sm text-muted">This circle is saved. A miss stays in it until that word is correct.</p>
        <p className="mt-2 text-sm text-muted">
          {phase === "speak"
            ? "The word is on the screen, and it is being called."
            : phase === "listen"
              ? tries > 0
                ? "Retry. Say A, B, C, or D."
                : "Say A, B, C, or D."
              : note}
        </p>
        <p className="he-word mt-4 text-center text-6xl font-bold leading-tight text-ink sm:text-7xl" lang="he" dir="rtl">
          {task.item.hebrew}
        </p>
      </Panel>
      {retrySign ? (
        <div className="mb-3 rounded-[var(--radius-xl)] bg-card px-4 py-6 text-center shadow-[var(--shadow-border)]">
          <GradeBanner ok={false} label="Retry" />
          <p className="mt-3 text-base font-medium text-ink">Second try. The microphone is waiting.</p>
        </div>
      ) : null}
      {secondMiss ? (
        <div className="mb-3 rounded-[var(--radius-xl)] bg-card px-4 py-6 text-center shadow-[var(--shadow-border)]">
          <GradeBanner ok={false} label="Not quite" />
          <p className="mt-3 text-base font-medium text-ink">{note}</p>
        </div>
      ) : null}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {task.choices.map((choice) => {
          const hit = phase === "feedback" && note === "Correct";
          const reveal = secondMiss;
          const right = (hit || reveal) && choice.correct;
          const wrong = !choice.correct && (missed === choice.letter || (reveal && picked === choice.letter));
          return (
            <li key={choice.letter}>
              <button
                type="button"
                onClick={() => take(choice.letter)}
                disabled={phase === "feedback"}
                className={cn(
                  "flex min-h-28 w-full items-center gap-4 rounded-[var(--radius-xl)] px-4 py-4 text-left shadow-[var(--shadow-border)]",
                  right && "bg-good text-parchment",
                  wrong && "bg-danger text-parchment",
                  !right && !wrong && reveal && "bg-card text-muted",
                  !right && !wrong && !reveal && "bg-card",
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
