import { useState } from "react";
import { Button } from "@/components/ui/button";
import { setMyTerm } from "@/lib/learner-path";
import { closeTermHall, openTermHall, publishTerm, type GrammarTerm } from "@/lib/path";
import {
  TERM_LEAVE,
  TERM_ONE_LINE,
  TERM_ONE_TITLE,
  TERM_TWO_LINE,
  TERM_TWO_NOTE,
  TERM_TWO_TITLE,
  TERM_WHICH,
  TERM_WHICH_LINE,
} from "@/lib/path-names";

export function SemesterHall({ onEnter }: { onEnter: (term: GrammarTerm) => void }) {
  const [busy, setBusy] = useState<GrammarTerm | null>(null);
  const [error, setError] = useState("");

  async function enter(term: GrammarTerm) {
    setBusy(term);
    setError("");
    try {
      const result = await setMyTerm({ data: { done: term === 2 } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      publishTerm(term);
      closeTermHall();
      onEnter(term);
    } catch {
      setError("That door did not open. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <section className="mb-4 rounded-[var(--radius-xl)] bg-card p-5 text-center shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar Path</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">{TERM_WHICH}</h1>
        <p className="mx-auto mt-3 max-w-prose text-muted">{TERM_WHICH_LINE}</p>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy != null}
          onClick={() => void enter(1)}
          className="rounded-[var(--radius-xl)] bg-ink p-5 text-left text-parchment shadow-[var(--shadow-border)]"
        >
          <p className="font-display text-3xl font-bold">{TERM_ONE_TITLE}</p>
          <p className="mt-2 text-sm text-parchment/80">{TERM_ONE_LINE}</p>
        </button>
        <button
          type="button"
          disabled={busy != null}
          onClick={() => void enter(2)}
          className="rounded-[var(--radius-xl)] bg-card p-5 text-left text-ink shadow-[var(--shadow-border)]"
        >
          <p className="font-display text-3xl font-bold">{TERM_TWO_TITLE}</p>
          <p className="mt-2 text-sm text-muted">{TERM_TWO_LINE}</p>
        </button>
      </div>
    </>
  );
}

export function LeaveSemester({ onLeave }: { onLeave: () => void }) {
  return (
    <Button
      className="mb-4 w-full"
      size="lg"
      variant="outline"
      onClick={() => {
        openTermHall();
        onLeave();
      }}
    >
      {TERM_LEAVE}
    </Button>
  );
}

export function SecondTerm({ onLeave }: { onLeave: () => void }) {
  return (
    <>
      <LeaveSemester onLeave={onLeave} />
      <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar Path</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">{TERM_TWO_TITLE}</h1>
        <p className="mt-3 max-w-prose text-muted">{TERM_TWO_LINE}</p>
        <p className="mt-3 max-w-prose text-sm text-muted">{TERM_TWO_NOTE}</p>
      </section>
    </>
  );
}
