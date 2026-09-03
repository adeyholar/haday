import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AlefBetPlay } from "@/components/alefbet-play";
import { GameMenu } from "@/components/game-menu";
import { isAlefBetLevelUnlocked } from "@/lib/game";
import { useStudy } from "@/lib/store";
import type { AlefBetLevel } from "@/lib/alefbet-game";

export const Route = createFileRoute("/game/alefbet/$level")({ component: AlefBetLevelPage });

function parseLevel(raw: string): AlefBetLevel | null {
  const n = Number(raw);
  if (n === 1 || n === 2 || n === 3) return n;
  return null;
}

function AlefBetLevelPage() {
  const { level: raw } = Route.useParams();
  const level = parseLevel(raw);
  const game = useStudy((s) => s.game);

  if (!level || !isAlefBetLevelUnlocked(game, level)) {
    return <Navigate to="/game/alefbet" />;
  }

  return (
    <>
      <div className="mb-4">
        <GameMenu />
      </div>
      <AlefBetPlay key={level} level={level} />
    </>
  );
}
