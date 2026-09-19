import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TypeKeyboard } from "@/components/type-keyboard";
import { playGrade } from "@/lib/sfx";
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
  nextExpected,
  passedBatch,
  wpmFrom,
} from "@/lib/hebrew-typing/engine";
import { mapPhysicalKey } from "@/lib/hebrew-typing/layout";
import { typingRank, type TypingProgress } from "@/lib/hebrew-typing/ranks";
import { CONSONANTS } from "@/lib/alphabet";

export type TypeMode = "study" | "game";
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
  onStudyPass,
  onGameFinish,
}: {
  mode: TypeMode;
  progress: TypingProgress;
  onStudyPass?: (acc: number) => void;
  onGameFinish?: (acc: number) => void;
}) {
  const [phase, setPhase] = useState<StudyPhase>("meet");
  const [batchI, setBatchI] = useState(0);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);
  const started = useRef(Date.now());
  const [seed, setSeed] = useState(0);
  const round = useMemo(() => gameRound(10, seed + 7), [seed]);

  const studyTargets = useMemo(() => {
    if (phase === "meet") return batchI === 0 ? firstWordLetters() : studyLetterBatch(batchI, 4);
    if (phase === "drill") return studyLetterBatch(batchI + 3, 5);
    return STUDY_WORDS.slice(0, 5);
  }, [phase, batchI]);

  const gameWord: TypeWord | undefined = round[i];
  const target = mode === "game" ? (gameWord?.hebrew ?? "") : (studyTargets[i] ?? "");
  const total = mode === "game" ? round.length : studyTargets.length;
  const acc = accuracyPct(hits, misses);
  const glow = nextExpected(target, typed);
  const showNikkud = mode === "game" || phase === "word" || Boolean(glow && /[\u0591-\u05C7]/.test(glow));
  const rank = typingRank(progress);

  function resetItem() {
    setTyped("");
  }

  function finishItem(nextHits: number, nextMisses: number) {
    playGrade(true);
    const next = i + 1;
    if (next >= total) {
      setDone(true);
      const pct = accuracyPct(nextHits, nextMisses);
      if (mode === "game") onGameFinish?.(pct);
      else if (passedBatch(pct)) onStudyPass?.(pct);
      return;
    }
    setI(next);
    resetItem();
  }

  function onKey(raw: string) {
    if (done || !target) return;
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
      if (result.done) finishItem(nextHits, misses);
    } else {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      playGrade(false);
    }
  }

  useEffect(() => {
    function onDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        onKey("Backspace");
        return;
      }
      const mapped = mapPhysicalKey(e.key);
      if (!mapped) return;
      e.preventDefault();
      onKey(mapped);
    }
    window.addEventListener("keydown", onDown);
    return () => window.removeEventListener("keydown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, target, done, hits, misses, i]);

  function newStudyBatch() {
    started.current = Date.now();
    setDone(false);
    setI(0);
    setHits(0);
    setMisses(0);
    setTyped("");
    setBatchI((n) => n + 1);
  }

  if (done) {
    const pass = passedBatch(acc);
    const wpm = wpmFrom(hits, Date.now() - started.current);
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
          <p className="mt-3 font-semibold text-ink">Accuracy first. Rank: {rank}</p>
        )}
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
                setTyped("");
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
          {mode === "study" ? `${phase === "meet" ? "Meet" : phase === "drill" ? "Drill" : "Word"} · ${i + 1}/${total}` : `Word ${i + 1}/${total}`}
        </span>
        <span className="tabular-nums text-muted">
          {acc}% · {rank}
        </span>
      </div>
      {mode === "game" && gameWord ? (
        <p className="text-center text-sm text-muted">{gameWord.gloss}</p>
      ) : phase === "meet" && target ? (
        <p className="text-center text-sm text-muted">{letterName(target)} · find the key, then type it</p>
      ) : phase === "drill" ? (
        <p className="text-center text-sm text-muted">Type the letter. Accuracy before speed.</p>
      ) : (
        <p className="text-center text-sm text-muted">Type the letters you see, right to left.</p>
      )}
      <PromptView target={target} typed={typed} />
      {typed ? (
        <p className="he-word mt-1 text-center text-2xl text-muted" lang="he" dir="rtl">
          {typed}
        </p>
      ) : null}
      <div className="mt-5">
        <TypeKeyboard glow={glow} nikkud={showNikkud} onKey={onKey} />
      </div>
    </div>
  );
}
