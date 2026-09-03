import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { NounPlay } from "@/components/noun-play";
import { isNounUnitUnlocked, NOUN_UNIT_MAX } from "@/lib/game";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/nouns/$unit")({ component: NounUnitPage });

function NounUnitPage() {
  const { unit: raw } = Route.useParams();
  const n = Number(raw);
  const game = useStudy((s) => s.game);
  const ok = Number.isInteger(n) && n >= 1 && n <= NOUN_UNIT_MAX && isNounUnitUnlocked(game, n);

  if (!ok) return <Navigate to="/game/nouns" />;

  return (
    <>
      <div className="mb-4">
        <GameMenu />
      </div>
      <NounPlay key={n} unitId={n} />
    </>
  );
}
