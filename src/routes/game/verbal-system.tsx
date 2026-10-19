import { createFileRoute } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { VerbalSystemBuilder } from "@/components/verbal-system-builder";

export const Route = createFileRoute("/game/verbal-system")({
  component: VerbalSystemPage,
});

function VerbalSystemPage() {
  return (
    <>
      <div className="mb-4">
        <GameMenu />
      </div>
      <VerbalSystemBuilder />
    </>
  );
}
