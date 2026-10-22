import { useEffect, useRef, useState } from "react";
import { GradeBanner } from "@/components/grade-banner";
import { MarkedAnswer } from "@/components/marked-answer";
import { HebrewType } from "@/components/hebrew-type";
import { IIBS_LESSON_PASS, iibsGlossHit, type IibsStageId } from "@/lib/iibs-game";
import { liveMatchAny } from "@/lib/hebrew";
import { playFeedback } from "@/lib/try-again";
import type { IibsVocabWord } from "@/lib/iibs-vocab";

function shuffle<T>(list: T[]): T[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = next[i]!;
    next[i] = next[j]!;
    next[j] = swap;
  }
  return next;
}

export function IibsWritePlay({
  stage,
  words,
  onFinish,
  onExit,
  onAgain,
  onNext,
  nextLabel,
}: {
  stage: Exclude<IibsStageId, "multiple">;
  words: IibsVocabWord[];
  onFinish: (pct: number) => void;
  onExit: () => void;
  onAgain: () => void;
  onNext: (() => void) | null;
  nextLabel: string;
}) {
  const [queue, setQueue] = useState(() => shuffle(words.map((_, index) => index)));
  const [typed, setTyped] = useState("");
  const [missed, setMissed] = useState(false);
  const [scored, setScored] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const first = useRef<Record<number, boolean>>({});
  const reported = useRef(false);
  const timer = useRef<number | null>(null);
  const index = queue[0];
  const word = index === undefined ? null : words[index];

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  function finish(pct: number) {
    if (reported.current) return;
    reported.current = true;
    setDone(pct);
    onFinish(pct);
  }

  function correct(value: string) {
    if (!word) return false;
    if (stage === "gloss") return iibsGlossHit(word.gloss, value);
    return liveMatchAny(word.hebrew, value, [], true) === "exact";
  }

  function advance(hit: boolean) {
    if (index === undefined) return;
    if (!(index in first.current)) first.current[index] = hit;
    const rest = queue.slice(1);
    if (hit && rest.length === 0) {
      const hits = Object.values(first.current).filter(Boolean).length;
      finish(Math.round((hits / words.length) * 100));
      setQueue([]);
      return;
    }
    setQueue(hit ? rest : [...rest, index]);
    setTyped("");
    setMissed(false);
    setScored(false);
  }

  function check() {
    if (!word || missed || scored || done !== null) return;
    if (correct(typed)) {
      playFeedback("strong");
      setScored(true);
      timer.current = window.setTimeout(() => advance(true), 700);
      return;
    }
    playFeedback("fail");
    if (!(index in first.current)) first.current[index!] = false;
    setMissed(true);
  }

  if (done !== null) {
    const cleared = done >= IIBS_LESSON_PASS;
    return (
      <div className="rounded-[var(--radius-xl)] bg-card p-5 text-center shadow-[var(--shadow-border)]">
        <p className="font-display text-5xl font-bold tabular-nums text-ink">{done}%</p>
        <p className="mt-3 text-muted">{cleared ? "Cleared." : `Not yet. ${IIBS_LESSON_PASS}% clears this stage.`}</p>
        <div className="mt-5 grid gap-2">
          {cleared && onNext ? (
            <button type="button" className="min-h-14 rounded-[var(--radius-lg)] bg-primary font-semibold text-primary-foreground" onClick={onNext}>
              {nextLabel}
            </button>
          ) : null}
          <button type="button" className="min-h-14 rounded-[var(--radius-lg)] bg-card font-semibold text-ink shadow-[var(--shadow-border)]" onClick={onAgain}>
            Play again
          </button>
          <button type="button" className="min-h-14 rounded-[var(--radius-lg)] bg-card font-semibold text-ink shadow-[var(--shadow-border)]" onClick={onExit}>
            All lessons
          </button>
        </div>
      </div>
    );
  }

  if (!word) return null;
  const seen = words.length - queue.length + 1;

  return (
    <div>
      <p className="mb-3 text-center text-sm text-muted">
        Word {seen} of {words.length}
      </p>
      {stage === "gloss" || stage === "hebrew" ? (
        <p className="he-word text-center text-5xl text-ink" dir="rtl" lang="he">
          {word.hebrew}
        </p>
      ) : (
        <p className="text-center text-2xl text-ink">{word.gloss}</p>
      )}
      {stage === "gloss" ? (
        <input
          value={typed}
          disabled={missed || scored}
          onChange={(event) => setTyped(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") check();
          }}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="English gloss"
          className="mt-5 h-14 w-full rounded-[var(--radius-md)] border border-border bg-parchment px-4 text-lg text-ink"
        />
      ) : (
        <div className="mt-5">
          <HebrewType
            value={typed}
            onChange={setTyped}
            target={word.hebrew}
            disabled={missed || scored}
            strict
            liveGrade={stage === "hebrew"}
            hideHint={stage === "strict"}
          />
        </div>
      )}
      {scored ? (
        <div className="mt-4">
          <GradeBanner ok label="Correct" />
          <MarkedAnswer ok given={typed} answer={stage === "gloss" ? word.gloss : word.hebrew} />
        </div>
      ) : null}
      {missed ? (
        <div className="mt-4">
          <GradeBanner ok={false} label="Not quite" />
          <MarkedAnswer ok={false} given={typed} answer={stage === "gloss" ? word.gloss : word.hebrew} />
        </div>
      ) : null}
      {missed ? (
        <button type="button" className="mt-3 min-h-14 w-full rounded-[var(--radius-lg)] bg-primary font-semibold text-primary-foreground" onClick={() => advance(false)}>
          Continue
        </button>
      ) : scored ? null : (
        <button type="button" className="mt-3 min-h-14 w-full rounded-[var(--radius-lg)] bg-primary font-semibold text-primary-foreground" onClick={check}>
          Check
        </button>
      )}
    </div>
  );
}
