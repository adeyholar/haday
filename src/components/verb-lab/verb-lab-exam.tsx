import { useMemo, useState } from "react";
import { examById } from "@/lib/verb-lab/registry";
import { drawExam, examPassed, formPercent, GAME_STAGE_PASS, squarePassed, type ExamAnswer, type PracticePrompt } from "@/lib/verb-lab/session";
import { squareTitle, type StemId, type VerbPath } from "@/lib/verb-lab/stems";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function VerbLabExam({
  examId,
  path,
  taught,
  stem,
  onDone,
  onLeave,
}: {
  examId: string;
  path: VerbPath;
  taught: number;
  stem: StemId;
  onDone: (answers: ExamAnswer[]) => void;
  onLeave: () => void;
}) {
  const exam = examById(examId);
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const prompts = useMemo(() => (exam ? drawExam("strong", examId, path, taught, mulberry32(seed)) : []), [exam, examId, path, taught, seed]);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [finished, setFinished] = useState(false);
  const prompt: PracticePrompt | undefined = prompts[step];

  if (!exam) {
    return (
      <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-sm text-muted">That exam is not in this room.</p>
        <button type="button" className="mt-3 min-h-11 font-semibold text-primary" onClick={onLeave}>
          Back to Verb Lab
        </button>
      </section>
    );
  }

  if (prompts.length === 0) {
    return (
      <section className="rounded-[var(--radius-xl)] border border-primary bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Exam</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">{exam.title(path)}</h1>
        <p className="mt-2 text-sm text-muted">No taught squares in this exam yet.</p>
        <button type="button" className="mt-4 min-h-11 font-semibold text-primary" onClick={onLeave}>
          Back to the {stem} row
        </button>
      </section>
    );
  }

  if (finished) {
    const squares = [...new Set(answers.map((answer) => answer.squareId))];
    const passed = squares.filter((id) => squarePassed(answers, id));
    const missed = squares.filter((id) => !squarePassed(answers, id));
    return (
      <section className="grid gap-3 rounded-[var(--radius-xl)] border border-primary bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Exam</p>
        <h1 className="font-display text-3xl font-bold text-ink">{exam.title(path)}</h1>
        <p className="text-sm text-ink">
          {formPercent(answers)}% of the forms. {examPassed(answers) ? "This exam is cleared." : `${GAME_STAGE_PASS}% clears it.`}{" "}
          {passed.length} square{passed.length === 1 ? "" : "s"} cleared.
          {missed.length ? ` ${missed.length} went to the due pile on Next.` : " Nothing missed."}
        </p>
        <ul className="grid gap-2 text-sm">
          {squares.map((id) => (
            <li key={id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface px-3 py-2">
              <span>{squareTitle(path, id)}</span>
              <span className={squarePassed(answers, id) ? "font-semibold text-good" : "font-semibold text-danger"}>
                {squarePassed(answers, id) ? "Cleared" : "Due"}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
          onClick={() => onDone(answers)}
        >
          Back to the {stem} row
        </button>
      </section>
    );
  }

  if (!prompt) return null;

  function commit(choice: string) {
    if (!prompt || picked != null) return;
    const correct = choice === prompt.pgn;
    const next = [...answers, { squareId: prompt.squareId, correct }];
    setPicked(choice);
    setAnswers(next);
  }

  function advance() {
    if (step + 1 >= prompts.length) setFinished(true);
    else {
      setStep(step + 1);
      setPicked(null);
    }
  }

  return (
    <section className="grid gap-4 rounded-[var(--radius-xl)] border border-primary bg-card p-5 shadow-[var(--shadow-border)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Exam</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">{exam.title(path)}</h1>
        <p className="mt-2 text-sm text-muted">
          Covers {exam.covers.join(", ")}. Clears at {GAME_STAGE_PASS}% of the forms you answer. Question {step + 1} of {prompts.length}.
        </p>
      </div>
      <p className="text-center text-sm text-muted">{squareTitle(path, prompt.squareId)}</p>
      <p className="he-word verb-lab-form text-center text-4xl text-ink" lang="he" dir="rtl">
        {prompt.form}
      </p>
      {prompt.standard ? <p className="text-center text-xs font-semibold uppercase tracking-wide text-primary">standard form, not in the Bible</p> : null}
      <div className="grid grid-cols-2 gap-2">
        {prompt.choices.map((choice) => {
          const right = picked != null && choice.pgn === prompt.pgn;
          const miss = picked === choice.pgn && choice.pgn !== prompt.pgn;
          return (
            <button
              key={choice.pgn}
              type="button"
              disabled={picked != null}
              className={`min-h-11 rounded-[var(--radius-md)] border px-3 py-2 text-sm ${right ? "border-good text-good" : miss ? "border-danger text-danger" : "border-border bg-surface text-ink"}`}
              onClick={() => commit(choice.pgn)}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      {picked != null ? (
        <button type="button" className="min-h-11 text-sm font-semibold text-primary" onClick={advance}>
          {step + 1 >= prompts.length ? "See the result" : "Next"}
        </button>
      ) : null}
    </section>
  );
}
