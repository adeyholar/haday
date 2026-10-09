import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GameMenu } from "@/components/game-menu";
import { GradeBanner } from "@/components/grade-banner";
import { Panel } from "@/components/panel";
import {
  startWeek7Run,
  takeWeek7,
  week7Choices,
  week7Current,
  week7Grade,
  week7Section,
  WEEK7_ITEMS,
  type Week7Run,
} from "@/lib/week7-mock";

export const Route = createFileRoute("/game/week7")({ component: Week7MockPage });

const KEY = "haday-week7-mock";

function loadRun(): Week7Run | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as Week7Run;
    if (!run || !Array.isArray(run.order) || typeof run.index !== "number") return null;
    if (!run.first || typeof run.first !== "object") return null;
    if (!run.choices || typeof run.choices !== "object") return null;
    return run;
  } catch {
    return null;
  }
}

function saveRun(run: Week7Run | null) {
  if (typeof window === "undefined") return;
  if (!run) window.localStorage.removeItem(KEY);
  else window.localStorage.setItem(KEY, JSON.stringify(run));
}

function Week7MockPage() {
  const [ready, setReady] = useState(false);
  const [run, setRun] = useState<Week7Run | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Week7Run | null>(null);
  const [mark, setMark] = useState<{ ok: boolean; given: string } | null>(null);

  useEffect(() => {
    setRun(loadRun());
    setReady(true);
  }, []);

  function begin(fresh: boolean) {
    const next = fresh || !run || run.index >= run.order.length ? startWeek7Run(Date.now()) : run;
    setRun(next);
    saveRun(next);
    setDraft("");
    setMark(null);
    setPending(null);
  }

  function submit(raw: string) {
    if (!run || mark) return;
    const item = week7Current(run);
    if (!item) return;
    const result = takeWeek7(run, raw);
    setPending(result.run);
    setMark({ ok: result.ok, given: raw.trim() });
    setDraft("");
  }

  function next() {
    if (!pending) return;
    setRun(pending);
    saveRun(pending);
    setPending(null);
    setMark(null);
    setDraft("");
  }

  if (!ready) return null;

  const item = run ? week7Current(run) : null;
  const open = run && item;
  const grade = run ? week7Grade(run) : null;
  const finished = run && !item && Object.keys(run.first).length > 0;

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Week 7 · two tests, one grade</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Mock exam</h1>
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
      {open && item ? (
        <Card
          hebrew={item.hebrew}
          ask={week7Section(item.section).ask}
          title={week7Section(item.section).title}
          place={`${run.index + 1} of ${run.order.length}`}
          kind={item.kind}
          choices={week7Choices(item, run.choices[item.id])}
          draft={draft}
          mark={mark}
          show={item.accept[0]}
          onDraft={setDraft}
          onSubmit={submit}
          onNext={next}
        />
      ) : null}
    </>
  );
}

function Intro({ saved, onStart }: { saved: Week7Run | null; onStart: () => void }) {
  const mid = saved && saved.index > 0 && saved.index < saved.order.length;
  return (
    <>
      <p className="mt-3 max-w-prose text-muted">
        This follows the midterm review: gender and number, prefixes, pronoun suffixes, adjectives, pronouns, construct
        chains, then the review word list. {WEEK7_ITEMS.length} items. Each section stays together. The lines inside it
        are mixed. The class exam uses different examples of the same kinds, and it is shorter.
      </p>
      <p className="mt-3 max-w-prose text-muted">
        One grade, from your first answer on each item. A miss goes to the back and stays there until you get it. Leave,
        and this sitting continues on the same item.
      </p>
      <Button className="mt-5 w-full" size="lg" onClick={onStart}>
        {mid ? `Continue — item ${saved.index + 1} of ${saved.order.length}` : "Start the mock"}
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
        Start a new mock
      </Button>
    </>
  );
}

function Card({
  hebrew,
  ask,
  title,
  place,
  kind,
  choices,
  draft,
  mark,
  show,
  onDraft,
  onSubmit,
  onNext,
}: {
  hebrew: string;
  ask: string;
  title: string;
  place: string;
  kind: string;
  choices: string[];
  draft: string;
  mark: { ok: boolean; given: string } | null;
  show: string;
  onDraft: (value: string) => void;
  onSubmit: (raw: string) => void;
  onNext: () => void;
}) {
  const typed = kind === "type" || kind === "code";
  return (
    <Panel>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        {title} · {place}
      </p>
      <p className="he-word mt-4 text-center font-hebrew text-5xl leading-tight text-ink" dir="rtl" lang="he">
        {hebrew}
      </p>
      <p className="mt-4 text-center text-muted">{ask}</p>
      {mark ? (
        <div className="mt-5">
          <GradeBanner ok={mark.ok} label={mark.ok ? "Correct" : "Not quite"} />
          <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {mark.ok ? "Your answer" : "You wrote"}
          </p>
          <p className={`mt-1 text-center text-xl font-semibold ${mark.ok ? "text-good" : "text-danger"}`}>
            {mark.given}
          </p>
          {!mark.ok ? (
            <>
              <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted">Answer</p>
              <p className="mt-1 text-center text-xl font-semibold text-good">{show}</p>
            </>
          ) : null}
          <Button className="mt-5 w-full" size="lg" onClick={onNext}>
            Continue
          </Button>
        </div>
      ) : typed ? (
        <form
          className="mt-5 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(draft);
          }}
        >
          <input
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            className="h-12 rounded-[var(--radius-md)] border border-border bg-parchment px-3 text-lg text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={kind === "code" ? "Suffix code" : "English"}
          />
          <Button type="submit" className="w-full" size="lg" disabled={!draft.trim()}>
            Check
          </Button>
        </form>
      ) : (
        <ul className="mt-5 grid gap-2">
          {choices.map((choice) => (
            <li key={choice}>
              <button
                type="button"
                onClick={() => onSubmit(choice)}
                className="min-h-14 w-full rounded-[var(--radius-md)] bg-card px-4 text-left text-lg font-semibold text-ink shadow-[var(--shadow-border)]"
              >
                {choice}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
