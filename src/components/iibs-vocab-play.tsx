import { useMemo, useRef, useState } from "react";
import { IIBS_LESSON_PASS } from "@/lib/iibs-game";
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

function choicesFor(right: string, pool: string[]) {
  const others: string[] = [];
  for (const gloss of shuffle(pool)) {
    if (!gloss || gloss === right || others.includes(gloss)) continue;
    others.push(gloss);
    if (others.length === 3) break;
  }
  return shuffle([right, ...others]);
}

export function IibsVocabPlay({
  words,
  pool,
  onFinish,
  onExit,
  onAgain,
  onNext,
  nextLabel,
}: {
  words: IibsVocabWord[];
  pool: string[];
  onFinish: (pct: number) => void;
  onExit: () => void;
  onAgain: () => void;
  onNext: (() => void) | null;
  nextLabel: string;
}) {
  const [queue, setQueue] = useState(() => shuffle(words.map((_, index) => index)));
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const first = useRef<Record<number, boolean>>({});
  const reported = useRef(false);
  const poolRef = useRef(pool);
  poolRef.current = pool;
  const index = queue[0];
  const word = index === undefined ? null : words[index];
  const choices = useMemo(
    () => (word ? choicesFor(word.gloss, poolRef.current) : []),
    [word],
  );

  function finish(pct: number) {
    if (reported.current) return;
    reported.current = true;
    setDone(pct);
    onFinish(pct);
  }

  function answer(gloss: string) {
    if (!word || index === undefined || picked || done !== null) return;
    const correct = gloss === word.gloss;
    if (!(index in first.current)) first.current[index] = correct;
    if (!correct) {
      setPicked(gloss);
      return;
    }
    const rest = queue.slice(1);
    if (rest.length === 0) {
      const hits = Object.values(first.current).filter(Boolean).length;
      finish(Math.round((hits / words.length) * 100));
      setQueue([]);
      return;
    }
    setQueue(rest);
  }

  function keepGoing() {
    if (index === undefined) return;
    setQueue([...queue.slice(1), index]);
    setPicked(null);
  }

  if (done !== null) {
    const cleared = done >= IIBS_LESSON_PASS;
    return (
      <div className="rounded-[var(--radius-xl)] bg-card p-5 text-center shadow-[var(--shadow-border)]">
        <p className="font-display text-5xl font-bold tabular-nums text-ink">{done}%</p>
        <p className="mt-3 text-muted">
          {cleared ? "Cleared." : `Not yet. ${IIBS_LESSON_PASS}% clears this stage.`}
        </p>
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
      <p className="he-word text-center text-5xl text-ink" dir="rtl" lang="he">
        {word.hebrew}
      </p>
      {word.plural ? (
        <p className="he-word mt-1 text-center text-xl text-muted" dir="rtl" lang="he">
          {word.plural}
        </p>
      ) : null}
      <div className="mt-5 grid gap-2">
        {choices.map((gloss) => {
          const show = picked !== null;
          const right = gloss === word.gloss;
          const wrong = show && gloss === picked && !right;
          return (
            <button
              key={gloss}
              type="button"
              disabled={show}
              onClick={() => answer(gloss)}
              className={`min-h-14 rounded-[var(--radius-lg)] bg-card px-4 text-lg text-ink shadow-[var(--shadow-border)] ${
                show && right ? "ring-2 ring-good" : ""
              } ${wrong ? "ring-2 ring-danger" : ""}`}
            >
              {gloss}
            </button>
          );
        })}
      </div>
      {picked ? (
        <button type="button" className="mt-3 min-h-14 w-full rounded-[var(--radius-lg)] bg-primary font-semibold text-primary-foreground" onClick={keepGoing}>
          Continue
        </button>
      ) : null}
    </div>
  );
}
