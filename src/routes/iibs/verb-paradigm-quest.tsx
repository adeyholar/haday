import { createFileRoute, Link } from "@tanstack/react-router";
import { ScriptureTabs } from "@/components/iibs-door";
import { VerbQuestHome } from "@/components/verb-paradigm-quest-play";

export const Route = createFileRoute("/iibs/verb-paradigm-quest")({
  component: ScriptureParadigmQuest,
});

function ScriptureParadigmQuest() {
  return (
    <>
      <ScriptureTabs active="levels" />
      <p className="mb-4 text-sm">
        <Link to="/iibs" className="font-semibold text-primary">
          Levels
        </Link>
      </p>
      <VerbQuestHome scripture />
    </>
  );
}
