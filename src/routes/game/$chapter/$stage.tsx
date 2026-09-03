import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GameStagePlay } from "@/components/game-stage";
import { clampChapter, continueTarget, isStageId, isStageUnlocked } from "@/lib/game";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/$chapter/$stage")({
  component: GameStagePage,
});

function GameStagePage() {
  const { chapter: rawChapter, stage: rawStage } = Route.useParams();
  const chapter = clampChapter(Number(rawChapter));
  const game = useStudy((s) => s.game);

  if (!isStageId(rawStage)) {
    const t = continueTarget(game);
    return <Navigate to="/game/$chapter/$stage" params={{ chapter: String(t.chapter), stage: t.stage }} />;
  }

  if (!isStageUnlocked(game, chapter, rawStage)) {
    const t = continueTarget(game);
    return <Navigate to="/game/$chapter/$stage" params={{ chapter: String(t.chapter), stage: t.stage }} />;
  }

  return <GameStagePlay key={`${chapter}-${rawStage}`} chapter={chapter} stage={rawStage} />;
}
