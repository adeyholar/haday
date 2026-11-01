import { useMemo, useState } from "react";
import { Panel } from "@/components/panel";
import { gradeRealForm, realFormDeck, type RealForm } from "@/lib/reading-loop/real-forms";

export function RealFormLab({ scripture = false, onExit }: { scripture?: boolean; onExit: () => void }) {
  const deck = useMemo(() => realFormDeck(undefined, 3), []);
  const [at, setAt] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const form: RealForm | undefined = deck[at];
  const done = at >= deck.length;

  function choose(choice: string) {
    if (!form || picked) return;
    setPicked(choice);
    if (gradeRealForm(form, choice)) setHits((n) => n + 1);
    else setMisses((n) => n + 1);
  }

  if (done) {
    const total = hits + misses;
    const pct = total ? Math.round((hits / total) * 100) : 0;
    return (
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {scripture ? "Scripture Path · real forms" : "Grammar · real forms"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Qal forms from the text</h1>
        <p className="mt-3 text-sm text-ink">
          {hits} of {total} · {pct}%
        </p>
        <button type="button" onClick={onExit} className="mt-4 min-h-11 font-semibold text-primary">
          Back to Verb Lab
        </button>
      </Panel>
    );
  }

  if (!form) return null;
  const right = picked === form.answer;

  return (
    <Panel>
      <button type="button" onClick={onExit} className="text-sm font-semibold text-primary">
        Verb Lab
      </button>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        {scripture ? "Scripture Path" : "Grammar"} · {at + 1} of {deck.length}
      </p>
      <p className="he-taam mt-2 text-5xl text-ink" dir="rtl" lang="he">
        {form.form}
      </p>
      <p className="mt-2 text-sm text-ink">
        {form.gloss} · {form.ref}
      </p>
      <p className="mt-3 text-sm text-muted">Name the Qal parse. This form is from the Tanakh, not a made-up paradigm.</p>
      <ul className="mt-3 grid gap-2">
        {form.choices.map((choice) => {
          const on = picked === choice;
          const good = picked && choice === form.answer;
          return (
            <li key={choice}>
              <button
                type="button"
                disabled={Boolean(picked)}
                onClick={() => choose(choice)}
                className={`min-h-12 w-full rounded-[var(--radius-md)] px-3 text-left text-sm font-semibold ${
                  good ? "bg-ink text-parchment" : on ? "bg-surface text-ink" : "bg-card text-ink shadow-[var(--shadow-border)]"
                }`}
              >
                {choice}
              </button>
            </li>
          );
        })}
      </ul>
      {picked ? (
        <div className="mt-3">
          <p className="text-sm text-ink">{right ? "Correct." : `Not quite. ${form.answer}.`}</p>
          <button
            type="button"
            className="mt-2 min-h-11 font-semibold text-primary"
            onClick={() => {
              setPicked(null);
              setAt((n) => n + 1);
            }}
          >
            Next
          </button>
        </div>
      ) : null}
    </Panel>
  );
}
