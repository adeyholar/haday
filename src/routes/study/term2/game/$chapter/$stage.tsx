import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GameStagePlay } from "@/components/game-stage";
import { isStageId } from "@/lib/game";
import { useStudy } from "@/lib/store";
import { isTerm2StageUnlocked } from "@/lib/term2-game";
import { term2Lesson } from "@/lib/term2-lessons";

export const Route = createFileRoute("/study/term2/game/$chapter/$stage")({ component: Term2StagePage });

function Term2StagePage() {
  const { chapter: rawChapter, stage: rawStage } = Route.useParams();
  const chapter = Number(rawChapter);
  const term2 = useStudy((s) => s.game.term2);
  if (!term2Lesson(chapter) || !isStageId(rawStage) || !isTerm2StageUnlocked(term2, chapter, rawStage)) {
    return <Navigate to="/study/term2/game" />;
  }
  return <GameStagePlay key={`${chapter}-${rawStage}`} chapter={chapter} stage={rawStage} room="term2" />;
}
