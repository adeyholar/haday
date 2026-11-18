import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ParadigmCheck } from "@/components/paradigms/paradigm-check";
import { PlacementQuiz } from "@/components/paradigms/placement-quiz";
import { useParadigmProgress } from "@/components/paradigms/use-paradigm-progress";
import { nextBox } from "@/lib/paradigms/leitner";
import type { LevelId, PlacementSource } from "@/lib/paradigms/types";

type GateStep = "placement" | "check" | "lesson";

export function ParadigmLessonGate({ lessonKey, children }: { lessonKey: string; children: ReactNode }) {
  const { enabled, progress, update } = useParadigmProgress();
  const [step, setStep] = useState<GateStep>(progress.placed ? "check" : "placement");

  useEffect(() => {
    if (progress.placed && step === "placement") setStep("check");
  }, [progress.placed, step]);

  if (!enabled || step === "lesson") return children;

  function place(level: LevelId, source: Extract<PlacementSource, "quiz" | "skip">) {
    void update((current) => ({ ...current, level, placed: true, source }));
    setStep("check");
  }

  function logSkip(itemId: string | null) {
    void update((current) => ({
      ...current,
      skips: [...current.skips, { at: new Date().toISOString(), lessonKey, itemId }],
    }));
  }

  function grade(cellId: string, correct: boolean) {
    void update((current) => ({
      ...current,
      boxes: { ...current.boxes, [cellId]: nextBox(current.boxes[cellId], correct) },
    }));
  }

  if (step === "placement") return <PlacementQuiz onPlace={place} />;

  return (
    <ParadigmCheck
      lessonKey={lessonKey}
      level={progress.level}
      boxes={progress.boxes}
      onSkip={logSkip}
      onAnswer={grade}
      onDone={() => setStep("lesson")}
    />
  );
}

export function ParadigmsLearnLink() {
  const { enabled } = useParadigmProgress();
  if (!enabled) return null;
  return (
    <Link
      to="/paradigms"
      search={{ retake: false }}
      className="mt-3 block rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-border)]"
    >
      <span className="font-display text-2xl font-bold text-ink">Paradigms</span>
      <p className="mt-1 text-sm text-muted">Strong verb, seven binyanim. On this phone. Offline once the page has loaded.</p>
    </Link>
  );
}
