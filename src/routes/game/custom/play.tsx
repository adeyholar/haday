import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GameStagePlay } from "@/components/game-stage";
import { GrammarMixPlay } from "@/components/grammar-mix-play";
import { mixableChapters, mixableGrammarTracks, isStageId, parseChapterList, parseTrackList } from "@/lib/game";
import { useStudy } from "@/lib/store";

type Search = { chapters?: string; stage?: string; tracks?: string };

export const Route = createFileRoute("/game/custom/play")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    chapters: typeof s.chapters === "string" ? s.chapters : undefined,
    stage: typeof s.stage === "string" ? s.stage : undefined,
    tracks: typeof s.tracks === "string" ? s.tracks : undefined,
  }),
  component: CustomMixPlayPage,
});

function CustomMixPlayPage() {
  const { chapters: raw, stage: rawStage, tracks: rawTracks } = Route.useSearch();
  const game = useStudy((s) => s.game);

  if (rawTracks) {
    const allowed = new Set(mixableGrammarTracks(game));
    const tracks = parseTrackList(rawTracks).filter((id) => allowed.has(id));
    if (!tracks.length) return <Navigate to="/game/custom" search={{ kind: "grammar" }} />;
    return <GrammarMixPlay key={tracks.join("-")} trackIds={tracks} />;
  }

  const allowed = new Set(mixableChapters(game));
  const chapters = parseChapterList(raw).filter((n) => allowed.has(n));
  const stage = isStageId(rawStage) ? rawStage : "recognize";

  if (!chapters.length) return <Navigate to="/game/custom" search={{ kind: "vocab" }} />;

  return <GameStagePlay key={`${chapters.join("-")}-${stage}`} chapter={chapters[0]} stage={stage} mixChapters={chapters} />;
}
