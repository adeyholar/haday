import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GradeBanner } from "@/components/grade-banner";
import { MarkedAnswer } from "@/components/marked-answer";
import { passageChoices, passageGlossHit, stepPassage, type PassageAsk } from "@/lib/reading-loop/passage-quiz";
import { playFeedback } from "@/lib/try-again";
import { useStudy } from "@/lib/store";
import type { VocabItem } from "@/lib/vocab";

export function PassageQuiz({ pool, label, back }: { pool: VocabItem[]; label: string; back?: string }) {
  const rate = useStudy((s) => s.rate);
  const [ask, setAsk] = useState<PassageAsk | null>(null);
  const [queue, setQueue] = useState<string[]>(() => pool.map((item) => item.id));
  const [retried, setRetried] = useState<Set<string>>(() => new Set());
  const [first, setFirst] = useState<Record<string, boolean>>({});
  const [typed, setTyped] = useState("");
  const [mark, setMark] = useState<{ ok: boolean; given: string } | null>(null);
  const byId = useMemo(() => new Map(pool.map((item) => [item.id, item])), [pool]);
  const item = queue[0] ? byId.get(queue[0]) : undefined;
  const choices = useMemo(() => (item && ask === "choice" ? passageChoices(item) : []), [item, ask]);
  const done = ask !== null && !item && Object.keys(first).length > 0;
  const held = Object.values(first).filter(Boolean).length;
  const total = pool.length;

  function begin(next: PassageAsk) {
    setAsk(next);
    setQueue(pool.map((row) => row.id));
    setRetried(new Set());
    setFirst({});
    setTyped("");
    setMark(null);
  }

  function grade(ok: boolean, given: string) {
    if (!item || mark) return;
    playFeedback(ok ? "strong" : "fail");
    setMark({ ok, given });
    setFirst((prev) => (item.id in prev ? prev : { ...prev, [item.id]: ok }));
    if (!(item.id in first)) rate(item.id, ok ? "good" : "again");
  }

  function continueOn() {
    if (!item || !mark) return;
    const stepped = stepPassage(queue, mark.ok, retried);
    setQueue(stepped.queue);
    setRetried(stepped.retried);
    setTyped("");
    setMark(null);
  }

  if (!ask) {
    return (
      <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path · Reading Lab</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">{label}</h1>
        <p className="mt-3 max-w-prose text-muted">
          {total} {total === 1 ? "lemma" : "lemmas"} this passage still needs. This is a short pass, not every way of asking.
          Choose one way. When you finish, go back to the reading.
        </p>
        <div className="mt-5 grid gap-2">
          <Button type="button" size="lg" className="w-full" onClick={() => begin("choice")}>
            Multiple choice
          </Button>
          <Button type="button" size="lg" variant="outline" className="w-full" onClick={() => begin("gloss")}>
            Write the gloss
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted">The choices look alike. Read them. A guess from the shape of the word is not enough.</p>
        {back ? <BackLink back={back} quiet /> : null}
      </section>
    );
  }

  if (done) {
    return (
      <section className="rounded-[var(--radius-xl)] bg-card p-5 text-center shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Sitting done</p>
        <p className="mt-2 font-display text-5xl font-bold text-ink">{total ? Math.round((held / total) * 100) : 0}%</p>
        <p className="mt-2 text-muted">
          {held} of {total} held on the first answer. A miss came back once.
        </p>
        <div className="mt-5 grid gap-2">
          {back ? <BackLink back={back} /> : <BackLink back="/iibs/wlc" />}
          <Button type="button" size="lg" variant="outline" className="w-full" onClick={() => setAsk(null)}>
            Choose the other way
          </Button>
        </div>
      </section>
    );
  }

  if (!item) return null;

  return (
    <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        {ask === "choice" ? "Multiple choice" : "Gloss"} · {queue.length} still in this pass
      </p>
      <p className="he-word mt-4 text-center font-hebrew text-5xl leading-tight text-ink" dir="rtl" lang="he">
        {item.hebrew}
      </p>
      <p className="mt-3 text-center text-sm text-muted">
        {ask === "choice" ? "Choose the meaning. The other lines are close." : "Write the meaning."}
      </p>
      {mark ? (
        <div className="mt-5">
          <GradeBanner ok={mark.ok} label={mark.ok ? "Correct" : "Not quite"} />
          <MarkedAnswer ok={mark.ok} given={mark.given} answer={item.gloss} />
          <Button type="button" className="mt-5 w-full" size="lg" onClick={continueOn}>
            Continue
          </Button>
        </div>
      ) : ask === "choice" ? (
        <ul className="mt-5 grid gap-2">
          {choices.map((choice) => (
            <li key={choice}>
              <button
                type="button"
                onClick={() => grade(choice === item.gloss || passageGlossHit(item, choice), choice)}
                className="min-h-14 w-full rounded-[var(--radius-md)] bg-surface px-4 text-left text-lg font-semibold text-ink shadow-[var(--shadow-border)]"
              >
                {choice}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <form
          className="mt-5 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            grade(passageGlossHit(item, typed), typed.trim());
          }}
        >
          <label className="sr-only" htmlFor="passage-gloss">
            Meaning
          </label>
          <input
            id="passage-gloss"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            className="min-h-14 w-full rounded-[var(--radius-md)] bg-surface px-4 text-lg text-ink shadow-[var(--shadow-border)]"
            placeholder="The meaning"
          />
          <Button type="submit" size="lg" className="w-full">
            Check
          </Button>
        </form>
      )}
      {back ? <BackLink back={back} quiet /> : null}
    </section>
  );
}

function BackLink({ back, quiet = false }: { back: string; quiet?: boolean }) {
  const match = /^\/iibs\/wlc\/([^/]+)\/(\d+)$/.exec(back);
  const className = quiet
    ? "mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary"
    : "inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 text-base font-semibold text-primary-foreground";
  if (!match) {
    return (
      <Link to="/iibs/wlc" className={className}>
        Back to the reading
      </Link>
    );
  }
  return (
    <Link to="/iibs/wlc/$book/$ch" params={{ book: match[1]!, ch: match[2]! }} className={className}>
      Back to the reading
    </Link>
  );
}
