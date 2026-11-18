import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ParadigmBoard } from "@/components/paradigms/paradigm-board";
import { PlacementQuiz } from "@/components/paradigms/placement-quiz";
import { useParadigmProgress } from "@/components/paradigms/use-paradigm-progress";
import { Panel } from "@/components/panel";
import type { LevelId, PlacementSource } from "@/lib/paradigms/types";

export const Route = createFileRoute("/paradigms")({
  validateSearch: (search: Record<string, unknown>) => ({
    retake: search.retake === "1" || search.retake === 1 || search.retake === true || search.retake === "true",
  }),
  component: ParadigmsPage,
});

function ParadigmsPage() {
  const { retake } = Route.useSearch();
  const { enabled, progress, update } = useParadigmProgress();
  const [placing, setPlacing] = useState(!progress.placed || retake);

  useEffect(() => {
    if (!retake && progress.placed) setPlacing(false);
  }, [progress.placed, retake]);

  if (!enabled) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">Paradigms</h1>
        <p className="mt-2 text-sm text-muted">This is not open on this account.</p>
      </Panel>
    );
  }

  function place(level: LevelId, source: Extract<PlacementSource, "quiz" | "skip">) {
    void update((current) => ({ ...current, level, placed: true, source }));
    setPlacing(false);
  }

  if (placing) return <PlacementQuiz onPlace={place} />;
  return <ParadigmBoard />;
}
