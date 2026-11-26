import { useState } from "react";
import { practicePrompt, type PracticePrompt } from "@/lib/verb-lab/session";
import type { ClassId } from "@/lib/verb-lab/data";
import type { VerbLabMode } from "@/lib/verb-lab/redirects";

function random(): number {
  return Math.random();
}

export function VerbLabPractice({
  classId,
  squareId,
  mode,
  onMode,
  onAnswer,
}: {
  classId: ClassId;
  squareId: string;
  mode: VerbLabMode;
  onMode: (mode: VerbLabMode) => void;
  onAnswer: (correct: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [prompt, setPrompt] = useState<PracticePrompt | null>(() => practicePrompt(classId, squareId, 0, random));
  const [picked, setPicked] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [seen, setSeen] = useState(0);
  const [first, setFirst] = useState(0);

  function load(nextIndex: number) {
    setIndex(nextIndex);
    setPrompt(practicePrompt(classId, squareId, nextIndex, random));
    setPicked(null);
    setShown(false);
  }

  function score(correct: boolean) {
    setSeen((n) => n + 1);
    if (correct) setFirst((n) => n + 1);
    onAnswer(correct);
  }

  if (!prompt) {
    return <p className="text-sm text-muted">This square has no forms to practice.</p>;
  }

  return (
    <div className="grid gap-4">
      <div className="inline-flex w-fit overflow-hidden rounded-full border border-border" role="group" aria-label="Practice mode">
        {(["quiz", "drill"] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={mode === item}
            className={`min-h-11 px-4 text-sm font-semibold ${mode === item ? "bg-primary text-primary-foreground" : "bg-surface text-muted"}`}
            onClick={() => onMode(item)}
          >
            {item === "quiz" ? "Quiz" : "Drill"}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">One builder for every stem. Quiz and drill are modes of the same tool.</p>
      {mode === "quiz" ? (
        <section className="grid justify-items-center gap-4 rounded-[var(--radius-xl)] bg-surface p-5 text-center shadow-[var(--shadow-border)]">
          <p className="text-sm text-muted">Which person is this?</p>
          <p className="he-word verb-lab-form text-4xl text-ink" lang="he" dir="rtl">
            {prompt.form}
          </p>
          {prompt.standard ? <p className="text-xs font-semibold uppercase tracking-wide text-primary">standard form, not in the Bible</p> : null}
          <div className="grid w-full grid-cols-2 gap-2">
            {prompt.choices.map((choice) => {
              const right = picked != null && choice.pgn === prompt.pgn;
              const miss = picked === choice.pgn && choice.pgn !== prompt.pgn;
              return (
                <button
                  key={choice.pgn}
                  type="button"
                  disabled={picked != null}
                  className={`min-h-11 rounded-[var(--radius-md)] border px-3 py-2 text-sm ${right ? "border-good text-good" : miss ? "border-danger text-danger" : "border-border bg-surface text-ink"}`}
                  onClick={() => {
                    if (picked != null) return;
                    const correct = choice.pgn === prompt.pgn;
                    setPicked(choice.pgn);
                    score(correct);
                  }}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>
          {picked != null ? (
            <p className={`font-semibold ${picked === prompt.pgn ? "text-good" : "text-danger"}`}>
              {picked === prompt.pgn ? "Right." : `Not quite. This is ${prompt.person}.`}
            </p>
          ) : null}
          <button
            type="button"
            className="min-h-11 text-sm font-semibold text-primary disabled:text-muted"
            disabled={picked == null}
            onClick={() => {
              if (picked == null) return;
              load(index + 1);
            }}
          >
            Next
          </button>
        </section>
      ) : (
        <section className="grid justify-items-center gap-4 rounded-[var(--radius-xl)] bg-surface p-5 text-center shadow-[var(--shadow-border)]">
          <p className="text-sm text-muted">Say it, then reveal</p>
          <p className="text-lg font-semibold text-ink">{prompt.person}</p>
          <p className="he-word verb-lab-form min-h-12 text-4xl text-ink" lang="he" dir="rtl">
            {shown ? prompt.form : ""}
          </p>
          {shown && prompt.standard ? <p className="text-xs font-semibold uppercase tracking-wide text-primary">standard form, not in the Bible</p> : null}
          {shown ? (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                onClick={() => {
                  score(true);
                  load(index + 1);
                }}
              >
                I had it
              </button>
              <button
                type="button"
                className="min-h-11 rounded-full border border-primary px-4 text-sm font-semibold text-primary"
                onClick={() => {
                  score(false);
                  load(index + 1);
                }}
              >
                Not yet
              </button>
            </div>
          ) : (
            <button type="button" className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground" onClick={() => setShown(true)}>
              Reveal
            </button>
          )}
        </section>
      )}
      <p className="text-sm text-muted">
        This sitting: {first} of {seen} right the first time.
      </p>
    </div>
  );
}
