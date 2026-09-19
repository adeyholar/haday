import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TypeKeyboard } from "@/components/type-keyboard";
import { playFeedback } from "@/lib/try-again";
import {
  STUDY_WORDS,
  firstWordLetters,
  gameRound,
  studyLetterBatch,
  type TypeWord,
} from "@/lib/hebrew-typing/bank";
import {
  TYPE_PASS,
  accuracyPct,
  applyTypeKey,
  missCueFor,
  missCueLabel,
  nextExpected,
  passedBatch,
  strengthFromMisses,
  wpmFrom,
} from "@/lib/hebrew-typing/engine";
import { isLatinLetterKey, mapPhysicalKey } from "@/lib/hebrew-typing/layout";
import { typingRank, type TypingProgress } from "@/lib/hebrew-typing/ranks";
import { CONSONANTS } from "@/lib/alphabet";

export type TypeMode = "study" | "game" | "quiz";
export type StudyPhase = "meet" | "drill" | "word";

function letterName(glyph: string): string {
  return CONSONANTS.find((c) => c.letter === glyph)?.name ?? glyph;
}

function PromptView({ target, typed }: { target: string; typed: string }) {
  const t = [...target.normalize("NFC")];
  const g = [...typed.normalize("NFC")];
  return (
    <p className="he-word mt-3 text-center text-5xl leading-relaxed sm:text-6xl" lang="he" dir="rtl">
      {t.map((ch, i) => (
        <span key={`${ch}-${i}`} className={i < g.length ? "he-spoken" : i === g.length ? "underline decoration-primary" : "text-ink"}>
          {ch}
        </span>
      ))}
    </p>
  );
}

export function TypeSession({
  mode,
  progress,
  words,
  onStudyPass,
  onGameFinish,
  onMark,
  onDone,
}: {
  mode: TypeMode;
  progress: TypingProgress;
  words?: TypeWord[];
  onStudyPass?: (acc: number) => void;
  onGameFinish?: (acc: number) => void;
  onMark?: (id: string, mark: "strong" | "weak" | "ok") => void;
  onDone?: (log: { id: string; hebrew: string; mark: "strong" | "weak" | "ok" }[]) => void;
}) {
  const missLadder = mode !== "study";
  const [phase, setPhase] = useState<StudyPhase>("meet");
  const [batchI, setBatchI] = useState(0);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);
  const [wordMisses, setWordMisses] = useState(0);
  const [cue, setCue] = useState("");
  const [pressed, setPressed] = useState<string | null>(null);
  const [missKey, setMissKey] = useState<string | null>(null);
  const [latinHelper, setLatinHelper] = useState(false);
  const [locked, setLocked] = useState(false);
  const [log, setLog] = useState<{ id: string; hebrew: string; mark: "strong" | "weak" | "ok" }[]>([]);
  const started = useRef(Date.now());
  const [seed, setSeed] = useState(0);

  const round = useMemo(() => {
    if (words) return words;
    return gameRound(10, seed + 7, progress.weak, progress.strong);
  }, [words, seed, progress.weak, progress.strong]);

  const studyTargets = useMemo(() => {
    if (phase === "meet") return batchI === 0 ? firstWordLetters() : studyLetterBatch(batchI, 4);
    if (phase === "drill") return studyLetterBatch(batchI + 3, 5);
    return STUDY_WORDS.slice(0, 5);
  }, [phase, batchI]);

  const gameWord: TypeWord | undefined = missLadder ? round[i] : undefined;
  const target = missLadder ? (gameWord?.hebrew ?? "") : (studyTargets[i] ?? "");
  const total = missLadder ? round.length : studyTargets.length;
  const acc = accuracyPct(hits, misses);
  const glow = locked ? null : nextExpected(target, typed);
  const showNikkud = missLadder || phase === "word" || Boolean(glow && /[\u0591-\u05C7]/.test(glow));
  const rank = typingRank(progress);

  function resetItem() {
    setTyped("");
    setWordMisses(0);
    setCue("");
    setLocked(false);
    setMissKey(null);
  }

  function finishItem(nextHits: number, nextMisses: number, mark: "strong" | "weak" | "ok") {
    if (gameWord) {
      onMark?.(gameWord.id, mark);
      setLog((rows) => [...rows, { id: gameWord.id, hebrew: gameWord.hebrew, mark }]);
    }
    if (mark === "strong") playFeedback("strong");
    const next = i + 1;
    if (next >= total) {
      setDone(true);
      const pct = accuracyPct(nextHits, nextMisses);
      const nextLog = gameWord ? [...log, { id: gameWord.id, hebrew: gameWord.hebrew, mark }] : log;
      if (mode === "game" || mode === "quiz") onGameFinish?.(pct);
      else if (passedBatch(pct)) onStudyPass?.(pct);
      onDone?.(nextLog);
      return;
    }
    setI(next);
    resetItem();
  }

  function onKey(raw: string) {
    if (done || !target || locked) return;
    const key = raw === "Backspace" ? "Backspace" : raw;
    const result = applyTypeKey(target, typed, key);
    if (key === "Backspace") {
      setTyped(result.typed);
      return;
    }
    if (result.hit) {
      const nextHits = hits + 1;
      setHits(nextHits);
      setTyped(result.typed);
      setCue("");
      if (result.done) finishItem(nextHits, misses, strengthFromMisses(wordMisses));
      return;
    }
    setMissKey(key);
    window.setTimeout(() => setMissKey(null), 220);
    if (!missLadder) {
      playFeedback("retry");
      return;
    }
    const cueKind = missCueFor(wordMisses);
    const nextWordMisses = wordMisses + 1;
    setWordMisses(nextWordMisses);
    setCue(missCueLabel(cueKind));
    if (cueKind === "retry") {
      playFeedback("retry");
      return;
    }
    const nextMisses = misses + 1;
    setMisses(nextMisses);
    setLocked(true);
    playFeedback("fail");
    window.setTimeout(() => finishItem(hits, nextMisses, "weak"), 900);
  }

  useEffect(() => {
    function onDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.repeat) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        onKey("Backspace");
        return;
      }
      if (isLatinLetterKey(e.key)) setLatinHelper(true);
      const mapped = mapPhysicalKey(e.key);
      if (!mapped) return;
      e.preventDefault();
      setPressed(mapped);
      onKey(mapped);
    }
    function onUp() {
      setPressed(null);
    }
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, target, done, hits, misses, i, wordMisses, locked]);

  function newStudyBatch() {
    started.current = Date.now();
    setDone(false);
    setI(0);
    setHits(0);
    setMisses(0);
    setLog([]);
    resetItem();
    setBatchI((n) => n + 1);
  }

  if (done) {
    const pass = passedBatch(acc);
    const wpm = wpmFrom(hits, Date.now() - started.current);
    const strong = log.filter((r) => r.mark === "strong");
    const weak = log.filter((r) => r.mark === "weak");
    return (
      <div className="rounded-[var(--radius-xl)] bg-card p-6 text-center shadow-[var(--shadow-border)]">
        <p className="font-display text-3xl font-bold text-ink">{acc}%</p>
        <p className="mt-1 text-sm text-muted">
          {hits} hits · {misses} misses · {wpm} WPM (speed is vanity)
        </p>
        {mode === "study" ? (
          <p className="mt-3 font-semibold text-ink">
            {pass ? `Passed (≥${TYPE_PASS}%). Rank: ${rank}` : `Need ${TYPE_PASS}% accuracy. Try this batch again.`}
          </p>
        ) : (
          <p className="mt-3 font-semibold text-ink">
            Strong {strong.length} · Weak {weak.length} · Rank: {rank}
          </p>
        )}
        {weak.length ? (
          <p className="he-word mt-2 text-lg" lang="he" dir="rtl">
            {weak.map((w) => w.hebrew).join(" · ")}
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          {mode === "study" ? (
            <>
              <Button onClick={newStudyBatch}>{pass ? "Next batch" : "Try again"}</Button>
              {pass && phase !== "word" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setPhase(phase === "meet" ? "drill" : "word");
                    newStudyBatch();
                  }}
                >
                  {phase === "meet" ? "Go to Drill" : "Go to Word"}
                </Button>
              ) : null}
            </>
          ) : (
            <Button
              onClick={() => {
                started.current = Date.now();
                setSeed((n) => n + 1);
                setDone(false);
                setI(0);
                setHits(0);
                setMisses(0);
                setLog([]);
                resetItem();
              }}
            >
              New round
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-ink">
          {mode === "study"
            ? `${phase === "meet" ? "Meet" : phase === "drill" ? "Drill" : "Word"} · ${i + 1}/${total}`
            : `Word ${i + 1}/${total}`}
        </span>
        <span className="tabular-nums text-muted">
          {acc}% · {rank}
        </span>
      </div>
      {latinHelper ? (
        <p className="mb-2 rounded-[var(--radius-md)] bg-surface px-3 py-2 text-center text-sm text-muted">
          English keys still work — we map them to Hebrew. You can also switch the iPad keyboard to Hebrew.
        </p>
      ) : null}
      {gameWord ? <p className="text-center text-sm text-muted">{gameWord.gloss}</p> : null}
      {mode === "study" && phase === "meet" && target ? (
        <p className="text-center text-sm text-muted">{letterName(target)} · find the key, then type it</p>
      ) : null}
      {mode === "study" && phase === "drill" ? (
        <p className="text-center text-sm text-muted">Type the letter. Accuracy before speed.</p>
      ) : null}
      {cue ? <p className="mt-2 text-center text-sm font-semibold text-danger">{cue}</p> : null}
      <PromptView target={target} typed={typed} />
      {typed ? (
        <p className="he-word mt-1 text-center text-2xl text-muted" lang="he" dir="rtl">
          {typed}
        </p>
      ) : null}
      <div className="mt-5">
        <TypeKeyboard glow={glow} pressed={pressed} miss={missKey} nikkud={showNikkud} onKey={onKey} />
      </div>
    </div>
  );
}
