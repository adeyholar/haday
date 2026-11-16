import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GradeBanner } from "@/components/grade-banner";
import { MarkedAnswer } from "@/components/marked-answer";
import { findStudyItem } from "@/lib/tanakh-pool";
import { iibsPathItems } from "@/lib/iibs-weeks";
import {
  passageChoices,
  passageGlossHit,
  stepPassage,
  type PassageAsk,
  type PassageSitting,
} from "@/lib/reading-loop/passage-quiz";
import { playFeedback } from "@/lib/try-again";
import { useStudy } from "@/lib/store";
import type { VocabItem } from "@/lib/vocab";

type Phase = "ask" | "resume" | "run" | "done";

function resolveItems(ids: readonly string[], fresh: readonly VocabItem[]): VocabItem[] {
  const byId = new Map(fresh.map((item) => [item.id, item]));
  const path = iibsPathItems();
  const out: VocabItem[] = [];
  for (const id of ids) {
    const item = byId.get(id) ?? findStudyItem(id) ?? path.find((row) => row.id === id);
    if (item) out.push(item);
  }
  return out;
}

export function PassageQuiz({
  placeKey,
  scope,
  refName,
  pool,
  label,
  back,
  saved,
}: {
  placeKey: string;
  scope: "iibs" | "bbh";
  refName: string;
  pool: VocabItem[];
  label: string;
  back?: string;
  saved: PassageSitting | null;
}) {
  const rate = useStudy((s) => s.rate);
  const savePassageSitting = useStudy((s) => s.savePassageSitting);
  const freshIds = pool.map((item) => item.id);
  const [phase, setPhase] = useState<Phase>(() => (saved && saved.queue.length ? "resume" : "ask"));
  const [ask, setAsk] = useState<PassageAsk | null>(saved?.ask ?? null);
  const [sourceIds, setSourceIds] = useState<string[]>(() => (saved?.ids.length ? saved.ids : freshIds));
  const [queue, setQueue] = useState<string[]>(() => saved?.queue ?? freshIds);
  const [retried, setRetried] = useState<Set<string>>(() => new Set(saved?.retried ?? []));
  const [first, setFirst] = useState<Record<string, boolean>>(() => saved?.first ?? {});
  const [sittingLabel, setSittingLabel] = useState(saved?.label || label);
  const [sittingBack, setSittingBack] = useState(saved?.back || back || "");
  const [typed, setTyped] = useState("");
  const [mark, setMark] = useState<{ ok: boolean; given: string; item: VocabItem } | null>(null);
  const items = useMemo(() => resolveItems(sourceIds, pool), [sourceIds, pool]);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const item = queue[0] ? byId.get(queue[0]) : undefined;
  const choices = useMemo(() => (item && ask === "choice" && phase === "run" ? passageChoices(item) : []), [item, ask, phase]);
  const held = Object.values(first).filter(Boolean).length;
  const total = sourceIds.length;
  const home = sittingBack || back;

  function remember(next: {
    ask: PassageAsk;
    ids: string[];
    queue: string[];
    retried: Set<string>;
    first: Record<string, boolean>;
    label: string;
    back: string;
  }) {
    if (!next.queue.length) {
      savePassageSitting(placeKey, null);
      return;
    }
    savePassageSitting(placeKey, {
      scope,
      ref: refName,
      label: next.label,
      back: next.back,
      ask: next.ask,
      ids: next.ids,
      queue: next.queue,
      retried: [...next.retried],
      first: next.first,
      at: Date.now(),
    });
  }

  function begin(nextAsk: PassageAsk, ids: string[], nextLabel: string, nextBack: string) {
    const start = ids.length ? ids : freshIds;
    setAsk(nextAsk);
    setSourceIds(start);
    setQueue(start);
    setRetried(new Set());
    setFirst({});
    setSittingLabel(nextLabel);
    setSittingBack(nextBack);
    setTyped("");
    setMark(null);
    setPhase("run");
    remember({ ask: nextAsk, ids: start, queue: start, retried: new Set(), first: {}, label: nextLabel, back: nextBack });
  }

  function grade(ok: boolean, given: string) {
    if (!item || mark || !ask) return;
    playFeedback(ok ? "strong" : "fail");
    const nextFirst = item.id in first ? first : { ...first, [item.id]: ok };
    if (!(item.id in first)) rate(item.id, ok ? "good" : "again");
    const stepped = stepPassage(queue, ok, retried);
    setMark({ ok, given, item });
    setFirst(nextFirst);
    setQueue(stepped.queue);
    setRetried(stepped.retried);
    if (!stepped.queue.length) {
      savePassageSitting(placeKey, null);
      return;
    }
    remember({
      ask,
      ids: sourceIds,
      queue: stepped.queue,
      retried: stepped.retried,
      first: nextFirst,
      label: sittingLabel,
      back: sittingBack,
    });
  }

  function continueOn() {
    if (!mark) return;
    setTyped("");
    setMark(null);
    if (!queue.length) setPhase("done");
  }

  const face = mark?.item ?? item;

  if (phase === "resume" && saved) {
    return (
      <section className="rounded-[var(--radius-xl)] bg-card p-5 text-center shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path · Reading Lab</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Continue where you stopped</h1>
        <p className="mt-3 text-muted">
          {saved.label} · {saved.queue.length} still in this pass. Leaving, or signing out, keeps this sitting.
        </p>
        <div className="mt-5 grid gap-2">
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => {
              const ids = saved.ids.filter((id) => resolveItems([id], pool).length);
              const nextQueue = saved.queue.filter((id) => ids.includes(id));
              if (!nextQueue.length) {
                savePassageSitting(placeKey, null);
                setPhase("ask");
                return;
              }
              setAsk(saved.ask);
              setSourceIds(ids);
              setQueue(nextQueue);
              setRetried(new Set(saved.retried.filter((id) => ids.includes(id))));
              setFirst(saved.first);
              setSittingLabel(saved.label);
              setSittingBack(saved.back);
              setPhase("run");
            }}
          >
            Continue
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => {
              savePassageSitting(placeKey, null);
              setAsk(null);
              setSourceIds(freshIds.length ? freshIds : saved.ids);
              setQueue(freshIds.length ? freshIds : saved.ids);
              setRetried(new Set());
              setFirst({});
              setSittingLabel(label);
              setSittingBack(back || saved.back);
              setPhase("ask");
            }}
          >
            Start over
          </Button>
        </div>
        {home ? <BackLink back={home} quiet /> : null}
      </section>
    );
  }

  if (phase === "ask" || !ask) {
    const count = freshIds.length || sourceIds.length;
    return (
      <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path · Reading Lab</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">{label}</h1>
        <p className="mt-3 max-w-prose text-muted">
          {count} {count === 1 ? "lemma" : "lemmas"} this passage still needs. This is a short pass, not every way of asking.
          Choose one way. Leave, or sign out, and this sitting is still here.
        </p>
        <div className="mt-5 grid gap-2">
          <Button type="button" size="lg" className="w-full" onClick={() => begin("choice", freshIds.length ? freshIds : sourceIds, label, back || "")}>
            Multiple choice
          </Button>
          <Button type="button" size="lg" variant="outline" className="w-full" onClick={() => begin("gloss", freshIds.length ? freshIds : sourceIds, label, back || "")}>
            Write the gloss
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted">The choices look alike. Read them. A guess from the shape of the word is not enough.</p>
        {home ? <BackLink back={home} quiet /> : null}
      </section>
    );
  }

  if ((phase === "done" || !face) && !mark) {
    return (
      <section className="rounded-[var(--radius-xl)] bg-card p-5 text-center shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Sitting done</p>
        <p className="mt-2 font-display text-5xl font-bold text-ink">{total ? Math.round((held / total) * 100) : 0}%</p>
        <p className="mt-2 text-muted">
          {held} of {total} held on the first answer. A miss came back once.
        </p>
        <div className="mt-5 grid gap-2">
          {home ? <BackLink back={home} /> : <BackLink back="/iibs/wlc" />}
          <Button type="button" size="lg" variant="outline" className="w-full" onClick={() => setPhase("ask")}>
            Choose the other way
          </Button>
        </div>
      </section>
    );
  }

  if (!face) return null;

  return (
    <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        {ask === "choice" ? "Multiple choice" : "Gloss"} · {Math.max(queue.length, mark ? 1 : 0)} still in this pass
      </p>
      <p className="he-word mt-4 text-center font-hebrew text-5xl leading-tight text-ink" dir="rtl" lang="he">
        {face?.hebrew}
      </p>
      <p className="mt-3 text-center text-sm text-muted">
        {ask === "choice" ? "Choose the meaning. The other lines are close." : "Write the meaning."}
      </p>
      {mark ? (
        <div className="mt-5">
          <GradeBanner ok={mark.ok} label={mark.ok ? "Correct" : "Not quite"} />
          <MarkedAnswer ok={mark.ok} given={mark.given} answer={mark.item.gloss} />
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
                onClick={() => grade(choice === face.gloss || passageGlossHit(face, choice), choice)}
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
            grade(passageGlossHit(face, typed), typed.trim());
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
      {home ? <BackLink back={home} quiet /> : null}
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
