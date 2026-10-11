import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoadExam } from "@/routes/game/road";
import { useStudy } from "@/lib/store";
import { bbhVocab } from "@/lib/vocab";

export const Route = createFileRoute("/game/final")({ component: FinalRoadPage });

function FinalRoadPage() {
  const pool = useMemo(() => bbhVocab(), []);
  const run = useStudy((s) => s.game.roadFinalRun);
  const saveRun = useStudy((s) => s.saveRoadFinalRun);
  return (
    <RoadExam
      pool={pool}
      title="Road exam · Week 15"
      intro="final words, every class lemma from chapters 2–19."
      run={run}
      saveRun={saveRun}
    />
  );
}
