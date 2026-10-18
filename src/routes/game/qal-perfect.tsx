import { createFileRoute } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { QalPerfectBuilder } from "@/components/qal-perfect-builder";

export const Route = createFileRoute("/game/qal-perfect")({
  component: QalPerfectPage,
});

function QalPerfectPage() {
  return (
    <>
      <div className="mb-4">
        <GameMenu />
      </div>
      <QalPerfectBuilder />
    </>
  );
}
