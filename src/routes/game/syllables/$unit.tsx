import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { SyllablePlay } from "@/components/syllable-play";
import { isSyllableUnitUnlocked, SYLLABLE_UNIT_MAX } from "@/lib/game";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/syllables/$unit")({ component: SyllableUnitPage });

function SyllableUnitPage() {
  const { unit: raw } = Route.useParams();
  const n = Number(raw);
  const game = useStudy((s) => s.game);
  const ok = Number.isInteger(n) && n >= 1 && n <= SYLLABLE_UNIT_MAX && isSyllableUnitUnlocked(game, n);

  if (!ok) return <Navigate to="/game/syllables" />;

  return (
    <>
      <div className="mb-4">
        <GameMenu />
      </div>
      <SyllablePlay key={n} unitId={n} />
    </>
  );
}
