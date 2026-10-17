import { createFileRoute } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { VerbQuestHome } from "@/components/verb-paradigm-quest-play";

export const Route = createFileRoute("/game/verb-paradigm-quest")({
  component: VerbParadigmQuestPage,
});

function VerbParadigmQuestPage() {
  return (
    <>
      <div className="mb-4">
        <GameMenu />
      </div>
      <VerbQuestHome />
    </>
  );
}
