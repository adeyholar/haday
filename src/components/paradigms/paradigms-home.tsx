import { useEffect, useState } from "react";
import { ParadigmBoard } from "@/components/paradigms/paradigm-board";
import { PlacementQuiz } from "@/components/paradigms/placement-quiz";
import { useParadigmProgress } from "@/components/paradigms/use-paradigm-progress";
import type { LevelId, PlacementSource } from "@/lib/paradigms/types";

export function ParadigmsHome({ retake }: { retake: boolean }) {
  const { progress, update } = useParadigmProgress();
  const [placing, setPlacing] = useState(!progress.placed || retake);

  useEffect(() => {
    if (!retake && progress.placed) setPlacing(false);
  }, [progress.placed, retake]);

  function place(level: LevelId, source: Extract<PlacementSource, "quiz" | "skip">) {
    void update((current) => ({ ...current, level, placed: true, source }));
    setPlacing(false);
  }

  if (placing) return <PlacementQuiz onPlace={place} />;
  return <ParadigmBoard />;
}
