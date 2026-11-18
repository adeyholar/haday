import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { answerPlacement, placementChoices, placementItem, placementWord, skipPlacement, startPlacement, type PlacementStep } from "@/lib/paradigms/placement";
import type { LevelId } from "@/lib/paradigms/types";

export function PlacementQuiz({
  onPlace,
}: {
  onPlace: (level: LevelId, source: "quiz" | "skip") => void;
}) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState<PlacementStep>(() => startPlacement());
  const item = placementItem(step);
  const choices = useMemo(() => (item ? placementChoices(item) : []), [item]);

  function skip() {
    const left = skipPlacement();
    onPlace(left.level, left.source);
  }

  if (!started) {
    return (
      <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Placement</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-ink">Where do you start?</h2>
        <p className="mt-2 text-sm text-muted">Thirteen forms, easy to hard. Skip and you start at L1. I don&apos;t know counts as a miss.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button type="button" onClick={() => setStarted(true)}>
            Begin
          </Button>
          <Button type="button" variant="outline" onClick={skip}>
            Skip
          </Button>
        </div>
      </section>
    );
  }

  function choose(miss: boolean) {
    const next = answerPlacement(step, miss);
    setStep(next);
    if (next.done && next.level) onPlace(next.level, "quiz");
  }

  if (!item) return null;

  return (
    <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{item.n}</p>
        <Button type="button" variant="ghost" onClick={skip}>
          Skip
        </Button>
      </div>
      <p className="he-word mt-4 text-center text-5xl text-ink" lang="he" dir="rtl">
        {placementWord(item)}
      </p>
      <p className="mt-2 text-center text-sm text-muted">{item.ref}</p>
      <div className="mt-4 flex flex-col gap-2">
        {choices.map((label) => (
          <Button key={label} type="button" variant="outline" onClick={() => choose(label !== item.correct)}>
            {label}
          </Button>
        ))}
        <Button type="button" variant="ghost" onClick={() => choose(true)}>
          I don&apos;t know
        </Button>
      </div>
    </section>
  );
}
