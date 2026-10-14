import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GameMenu } from "@/components/game-menu";
import { GradeBanner } from "@/components/grade-banner";
import { Panel } from "@/components/panel";
import {
  FINAL_VOCAB,
  finalVocabChoices,
  finalVocabCurrent,
  finalVocabGrade,
  startFinalVocab,
  takeFinalVocab,
  type FinalVocabRun,
} from "@/lib/final-vocab";

export const Route = createFileRoute("/game/final-vocab")({ component: FinalVocabPage });

const KEY = "haday-final-vocab";

function loadRun(): FinalVocabRun | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as FinalVocabRun;
    if (!run || !Array.isArray(run.order) || typeof run.index !== "number") return null;
    if (!run.first || typeof run.first !== "object") return null;
    if (!run.choices || typeof run.choices !== "object") return null;
    return run;
  } catch {
    return null;
  }
}

function saveRun(run: FinalVocabRun | null) {
  if (typeof window === "undefined") return;
  if (!run) window.localStorage.removeItem(KEY);
  else window.localStorage.setItem(KEY, JSON.stringify(run));
}

function FinalVocabPage() {
  const [ready, setReady] = useState(false);
  const [run, setRun] = useState<FinalVocabRun | null>(null);
  const [pending, setPending] = useState<FinalVocabRun | null>(null);
  const [mark, setMark] = useState<{ ok: boolean; given: string } | null>(null);

  useEffect(() => {
    setRun(loadRun());
    setReady(true);
  }, []);

  function begin(fresh: boolean) {
    const next = fresh || !run || run.index >= run.order.length ? startFinalVocab(Date.now()) : run;
    setRun(next);
    saveRun(next);
    setMark(null);
    setPending(null);
  }

  function submit(raw: string) {
    if (!run || mark) return;
    const result = takeFinalVocab(run, raw);
    setPending(result.run);
    setMark({ ok: result.ok, given: raw.trim() });
  }

  function next() {
    if (!pending) return;
    setRun(pending);
    saveRun(pending);
    setPending(null);
    setMark(null);
  }

  if (!ready) return null;

  const item = run ? finalVocabCurrent(run) : null;
  const open = run && item;
  const grade = run ? finalVocabGrade(run) : null;
  const finished = run && !item && Object.keys(run.first).length > 0;

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Week 15 · final exam vocabulary</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Final vocab</h1>
        {!open && !finished ? (
          <Intro saved={run} onStart={() => begin(!run || run.index >= (run.order.length || 1))} />
        ) : null}
        {open ? (
          <button type="button" className="mt-3 text-sm text-muted underline" onClick={() => begin(true)}>
            Start over
          </button>
        ) : null}
        {finished && grade ? <Done grade={grade} onAgain={() => begin(true)} /> : null}
      </Panel>
      {open && item && run ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Vocabulary · {run.index + 1} of {run.order.length}
          </p>
          <p className="he-word mt-4 text-center font-hebrew text-5xl leading-tight text-ink" dir="rtl" lang="he">
            {item.hebrew}
          </p>
          <p className="mt-4 text-center text-muted">Choose the meaning. These are the words on the final list.</p>
          {mark ? (
            <div className="mt-5">
              <GradeBanner ok={mark.ok} label={mark.ok ? "Correct" : "Not quite"} />
              <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {mark.ok ? "Your answer" : "You chose"}
              </p>
              <p className={`mt-1 text-center text-xl font-semibold ${mark.ok ? "text-good" : "text-danger"}`}>
                {mark.given}
              </p>
              {!mark.ok ? (
                <>
                  <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted">Answer</p>
                  <p className="mt-1 text-center text-xl font-semibold text-good">{item.accept[0]}</p>
                </>
              ) : null}
              <Button className="mt-5 w-full" size="lg" onClick={next}>
                Continue
              </Button>
            </div>
          ) : (
            <ul className="mt-5 grid gap-2">
              {finalVocabChoices(item, run.choices[item.id]).map((choice) => (
                <li key={choice}>
                  <button
                    type="button"
                    onClick={() => submit(choice)}
                    className="min-h-14 w-full rounded-[var(--radius-md)] bg-card px-4 text-left text-lg font-semibold text-ink shadow-[var(--shadow-border)]"
                  >
                    {choice}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}
    </>
  );
}

function Intro({ saved, onStart }: { saved: FinalVocabRun | null; onStart: () => void }) {
  const mid = saved && saved.index > 0 && saved.index < saved.order.length;
  return (
    <>
      <p className="mt-3 max-w-prose text-muted">
        The same sitting as the Week 7 word list: Hebrew on the card, four meanings, one of them right.{" "}
        {FINAL_VOCAB.length} words, from the final exam slides. The order is mixed.
      </p>
      <p className="mt-3 max-w-prose text-muted">
        One grade, from your first answer on each word. A miss goes to the back and stays there until you get it. Leave,
        and this sitting continues on the same word.
      </p>
      <Button className="mt-5 w-full" size="lg" onClick={onStart}>
        {mid ? `Continue — word ${saved.index + 1} of ${saved.order.length}` : "Start the vocab"}
      </Button>
    </>
  );
}

function Done({ grade, onAgain }: { grade: { held: number; total: number; pct: number }; onAgain: () => void }) {
  return (
    <>
      <p className="mt-4 font-display text-5xl font-bold text-ink">{grade.pct}%</p>
      <p className="mt-2 text-muted">
        {grade.held} of {grade.total} held on the first answer. Every miss has been answered again.
      </p>
      <Button className="mt-5 w-full" size="lg" onClick={onAgain}>
        Start a new sitting
      </Button>
    </>
  );
}
