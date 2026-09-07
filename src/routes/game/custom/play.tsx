import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GameStagePlay } from "@/components/game-stage";
import { mixableChapters, isStageId, parseChapterList } from "@/lib/game";
import { useStudy } from "@/lib/store";

type Search = { chapters?: string; stage?: string };

export const Route = createFileRoute("/game/custom/play")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    chapters: typeof s.chapters === "string" ? s.chapters : undefined,
    stage: typeof s.stage === "string" ? s.stage : undefined,
  }),
  component: CustomMixPlayPage,
});

function CustomMixPlayPage() {
  const { chapters: raw, stage: rawStage } = Route.useSearch();
  const game = useStudy((s) => s.game);
  const allowed = new Set(mixableChapters(game));
  const chapters = parseChapterList(raw).filter((n) => allowed.has(n));
  const stage = isStageId(rawStage) ? rawStage : "recognize";

  if (!chapters.length) return <Navigate to="/game/custom" />;

  return <GameStagePlay key={`${chapters.join("-")}-${stage}`} chapter={chapters[0]} stage={stage} mixChapters={chapters} />;
}
