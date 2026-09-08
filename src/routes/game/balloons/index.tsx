import { createFileRoute } from "@tanstack/react-router";
import { BalloonDrop } from "@/components/balloon-drop";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";

export const Route = createFileRoute("/game/balloons/")({ component: BalloonPage });

function BalloonPage() {
  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
      </Panel>
      <BalloonDrop />
    </>
  );
}
