import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { GrammarPlay } from "@/components/grammar-play";
import { grammarTrack } from "@/lib/grammar-tracks";
import { grammarUnitOpen } from "@/lib/game";
import { useOpenTerm } from "@/lib/use-open-term";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/lessons/$track/$unit")({ component: GrammarUnitPage });

function GrammarUnitPage() {
  const { track: rawTrack, unit: rawUnit } = Route.useParams();
  const track = grammarTrack(rawTrack);
  const n = Number(rawUnit);
  const game = useStudy((s) => s.game);
  const term = useOpenTerm();
  const ok =
    Boolean(track) &&
    Number.isInteger(n) &&
    n >= 1 &&
    n <= (track?.units.length ?? 0) &&
    track != null &&
    grammarUnitOpen(game, track.id, n, term);

  if (!track) return <Navigate to="/game/lessons" />;
  if (!ok) return <Navigate to="/game/lessons/$track" params={{ track: track.id }} />;

  return (
    <>
      <div className="mb-4">
        <GameMenu />
      </div>
      <GrammarPlay key={`${track.id}-${n}-exam`} track={track} unitId={n} mode="exam" />
    </>
  );
}
