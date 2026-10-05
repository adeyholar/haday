import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AttemptBanner } from "@/components/attempt-banner";
import { DontKnowButton } from "@/components/dont-know-button";
import { Panel } from "@/components/panel";
import { StudyMenu } from "@/components/study-menu";
import { VerseCard } from "@/components/verse-card";
import { VocabArt } from "@/components/vocab-art";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { isHighWeak } from "@/lib/srs";
import { useStudy } from "@/lib/store";
import { playFeedback } from "@/lib/try-again";
import { quizChoices, type VocabItem } from "@/lib/vocab";
import { classVocab, packWeakRun, unpackWeakRun, weakPool } from "@/lib/weak-pool";

export const Route = createFileRoute("/weak")({ component: WeakPoolPage });

function WeakPoolPage() {
  const vocab = useMemo(() => classVocab(), []);
  const cards = useStudy((s) => s.cards);
  const stored = useStudy((s) => s.game.weakRun);
  const rate = useStudy((s) => s.rate);
  const noteActiveStudy = useStudy((s) => s.noteActiveStudy);
  const saveWeakRun = useStudy((s) => s.saveWeakRun);
  const live = useMemo(() => weakPool(cards, vocab), [cards, vocab]);
  const resume = useMemo(() => unpackWeakRun(stored, vocab), [stored, vocab]);

  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<VocabItem[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [missedChoice, setMissedChoice] = useState<string | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const [score, setScore] = useState({ right: 0, wrong: 0 });

  const iRef = useRef(0);
  const idsRef = useRef<string[]>([]);
  const settled = useRef(false);
  iRef.current = i;

  const item = queue[i] ?? null;
  const finished = started && queue.length > 0 && i >= queue.length;
  const choices = useMemo(() => (item ? quizChoices(item, vocab) : []), [item, vocab]);
  const showVerse = Boolean(item && picked && picked !== item.gloss);

  function begin(fresh: boolean) {
    const restored = fresh ? null : unpackWeakRun(useStudy.getState().game.weakRun, vocab);
    const next = restored?.queue ?? weakPool(useStudy.getState().cards, vocab);
    const startAt = restored?.index ?? 0;
    if (!next.length || startAt >= next.length) return;
    const ids = next.map((word) => word.id);
    idsRef.current = ids;
    settled.current = false;
    setQueue(next);
    setI(startAt);
    setPicked(null);
    setMissedChoice(null);
    setGaveUp(false);
    setScore({ right: 0, wrong: 0 });
    setStarted(true);
    saveWeakRun(packWeakRun(ids, startAt));
  }

  function settle() {
    if (settled.current) return;
    settled.current = true;
    const next = iRef.current + 1;
    const ids = idsRef.current;
    if (next >= ids.length) saveWeakRun(null);
    else saveWeakRun({ ids, index: next });
  }

  function mark(ok: boolean) {
    const current = queue[iRef.current];
    if (!current) return;
    rate(current.id, ok ? "good" : "again");
    settle();
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1) }));
  }

  function admitNoIdea() {
    const current = queue[iRef.current];
    if (!current || picked) return;
    playFeedback("fail");
    rate(current.id, "reveal");
    settle();
    setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
    setGaveUp(true);
    setPicked("__noidea__");
  }

  function goNext() {
    setPicked(null);
    setMissedChoice(null);
    setGaveUp(false);
    settled.current = false;
    setI((n) => n + 1);
  }

  if (!started) {
    const sitting = resume?.queue ?? live;
    const at = resume ? resume.index : 0;
    const extra = resume ? live.filter((word) => !resume.queue.some((q) => q.id === word.id)).length : 0;
    return (
      <>
        <Panel className="mb-4">
          <StudyMenu />
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">Weak pool</h1>
          <p className="mt-2 max-w-prose text-muted">
            Every weak word, from the whole list. Run them in one sitting. Leave any time — it continues on the same
            word. A new pool starts only after this one is finished.
          </p>
          {sitting.length > 0 ? (
            <p className="mt-3 text-sm font-medium tabular-nums text-ink">
              {sitting.length} {sitting.length === 1 ? "word" : "words"}
              {resume ? ` · word ${at + 1} is next` : ""}
            </p>
          ) : (
            <p className="mt-3 text-muted">No weak words yet. A miss, or being told the answer, puts a word here.</p>
          )}
          {extra > 0 ? (
            <p className="mt-1 text-sm text-muted">
              {extra} newer {extra === 1 ? "word waits" : "words wait"} for the next pool.
            </p>
          ) : null}
        </Panel>
        {sitting.length > 0 ? (
          <ul className="max-h-[50vh] divide-y divide-border overflow-y-auto rounded-[var(--radius-xl)] bg-card px-4 shadow-[var(--shadow-border)]">
            {sitting.map((word, n) => {
              const high = isHighWeak(cards[word.id]);
              const misses = cards[word.id]?.misses ?? 0;
              const here = Boolean(resume && n === at);
              return (
                <li key={word.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="he-word text-xl leading-tight">{word.hebrew}</p>
                    <p className="truncate text-sm text-muted">{word.gloss}</p>
                  </div>
                  <span className={cn("shrink-0 text-xs font-semibold", high ? "text-danger" : "text-muted")}>
                    {here ? "Next · " : ""}
                    {high ? "Told" : `${misses} miss${misses === 1 ? "" : "es"}`}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
        {resume ? (
          <Button type="button" size="lg" className="mt-4 w-full text-xl" onClick={() => begin(false)}>
            Continue — word {at + 1} of {resume.queue.length}
          </Button>
        ) : sitting.length > 0 ? (
          <Button type="button" size="lg" className="mt-4 w-full text-xl" onClick={() => begin(true)}>
            Run all {sitting.length} {sitting.length === 1 ? "word" : "words"}
          </Button>
        ) : null}
      </>
    );
  }

  if (finished || !item) {
    const again = weakPool(cards, vocab);
    return (
      <>
        <Panel className="mb-4">
          <StudyMenu />
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">Pool finished</h1>
          <p className="mt-2 text-muted">
            {score.right} correct of {score.right + score.wrong}.
            {again.length
              ? ` ${again.length} still weak. A new pool can start.`
              : " Nothing in this list is weak."}
          </p>
        </Panel>
        {again.length > 0 ? (
          <Button type="button" size="lg" className="w-full" onClick={() => begin(true)}>
            Run the weak words again
          </Button>
        ) : null}
      </>
    );
  }

  return (
    <>
      <Panel className="mb-4">
        <StudyMenu />
        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-ink">Weak pool</h1>
          <p className="text-sm font-medium tabular-nums text-ink">
            {i + 1} / {queue.length} · {score.right} correct
          </p>
        </div>
        <p className="mt-2 text-sm text-muted">Leave any time. This pool continues on the same word.</p>
      </Panel>
      <div className="rounded-[var(--radius-xl)] bg-card px-5 py-8 text-center shadow-[var(--shadow-border)]">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <div className="min-w-0">
            <p className="he-word text-5xl">{item.hebrew}</p>
            <p className="mt-2 text-sm text-muted">{item.translit}</p>
          </div>
          <VocabArt id={item.id} />
        </div>
      </div>
      <ul className="mt-4 grid gap-2">
        {choices.map((choice) => {
          const selected = picked === choice;
          const correct = choice === item.gloss;
          const show = picked !== null;
          const firstMiss = missedChoice === choice;
          return (
            <li key={choice}>
              <button
                type="button"
                disabled={picked !== null || firstMiss}
                onClick={() => {
                  if (choice === item.gloss) {
                    setPicked(choice);
                    mark(true);
                    playFeedback("strong");
                    return;
                  }
                  if (!missedChoice) {
                    setMissedChoice(choice);
                    noteActiveStudy();
                    playFeedback("retry");
                    return;
                  }
                  setPicked(choice);
                  mark(false);
                  playFeedback("fail");
                }}
                className={cn(
                  "min-h-12 w-full rounded-[var(--radius-md)] px-4 py-3 text-left text-sm font-medium shadow-[var(--shadow-border)]",
                  !show && !firstMiss && "bg-card",
                  firstMiss && "bg-danger text-parchment",
                  show && correct && "bg-good text-parchment",
                  show && selected && !correct && "bg-danger text-parchment",
                  show && !selected && !correct && !firstMiss && "bg-card text-muted",
                )}
              >
                {choice}
              </button>
            </li>
          );
        })}
      </ul>
      {missedChoice && !picked ? (
        <>
          {missedChoice !== "__nudge__" ? <AttemptBanner className="mt-4" kind="retry" /> : null}
          <p className="try-flash mt-2 text-center text-lg font-bold uppercase tracking-wide text-danger">Try again</p>
          <p className="mt-1 text-center text-sm font-medium text-ink">Attempt it before I tell you.</p>
        </>
      ) : null}
      {picked ? (
        <>
          <AttemptBanner className="mt-4" kind={picked === item.gloss ? "strong" : "fail"} />
          {gaveUp ? <p className="mt-2 text-center text-sm text-muted">It stays in the next pool.</p> : null}
        </>
      ) : null}
      {showVerse ? <VerseCard item={item} /> : null}
      {picked ? (
        <Button className="mt-4 w-full" onClick={goNext}>
          Next
        </Button>
      ) : (
        <DontKnowButton
          usedTry={Boolean(missedChoice)}
          onNudge={() => {
            if (!missedChoice) setMissedChoice("__nudge__");
          }}
          onClick={admitNoIdea}
        />
      )}
    </>
  );
}
