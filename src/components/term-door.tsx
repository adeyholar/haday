import { useState } from "react";
import { Button } from "@/components/ui/button";
import { setMyTerm } from "@/lib/learner-path";
import { publishTerm } from "@/lib/path";
import {
  TERM_ASK,
  TERM_LEAVE,
  TERM_NO,
  TERM_OWNER,
  TERM_STAY,
  TERM_TWO_LINE,
  TERM_TWO_NOTE,
  TERM_TWO_TITLE,
  TERM_YES,
} from "@/lib/path-names";

export function FirstTermDoor({ onEnter }: { onEnter: () => void }) {
  const [stayed, setStayed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function enter() {
    setBusy(true);
    setError("");
    try {
      const result = await setMyTerm({ data: { done: true } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      publishTerm(2);
      onEnter();
    } catch {
      setError("The door did not open. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-4 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar Path</p>
      <h2 className="mt-1 font-display text-2xl font-bold text-ink">{TERM_ASK}</h2>
      <p className="mt-2 text-sm text-muted">{TERM_OWNER}</p>
      {stayed ? <p className="mt-3 text-sm font-semibold text-ink">{TERM_STAY}</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button className="w-full" size="lg" disabled={busy} onClick={() => void enter()}>
          {TERM_YES}
        </Button>
        <Button className="w-full" size="lg" variant="outline" disabled={busy} onClick={() => setStayed(true)}>
          {TERM_NO}
        </Button>
      </div>
    </section>
  );
}

export function SecondTerm({ onLeave }: { onLeave: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function leave() {
    setBusy(true);
    setError("");
    try {
      const result = await setMyTerm({ data: { done: false } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      publishTerm(1);
      onLeave();
    } catch {
      setError("The door did not open. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar Path</p>
      <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">{TERM_TWO_TITLE}</h1>
      <p className="mt-3 max-w-prose text-muted">{TERM_TWO_LINE}</p>
      <p className="mt-3 max-w-prose text-sm text-muted">{TERM_TWO_NOTE}</p>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <Button className="mt-5 w-full" size="lg" variant="outline" disabled={busy} onClick={() => void leave()}>
        {TERM_LEAVE}
      </Button>
    </section>
  );
}
