import { createFileRoute } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { QalImperfectBuilder } from "@/components/qal-imperfect-builder";

export const Route = createFileRoute("/game/qal-imperfect")({
  component: QalImperfectPage,
});

function QalImperfectPage() {
  return (
    <>
      <div className="mb-4">
        <GameMenu />
      </div>
      <QalImperfectBuilder />
    </>
  );
}
