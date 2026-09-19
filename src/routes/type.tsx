import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { StudyMenu } from "@/components/study-menu";
import { StudyReturnBanner } from "@/components/study-return-banner";
import { TypeSession } from "@/components/type-session";
import { parseFromSearch } from "@/lib/passage";
import { emptyTyping } from "@/lib/hebrew-typing/ranks";
import { TYPE_PASS } from "@/lib/hebrew-typing/engine";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/type")({
  validateSearch: parseFromSearch,
  component: TypeStudyPage,
});

function TypeStudyPage() {
  const game = useStudy((s) => s.game);
  const record = useStudy((s) => s.recordTypingStudy);
  const typing = game.typing ?? emptyTyping();

  return (
    <>
      <StudyReturnBanner />
      <Panel className="mb-4">
        <StudyMenu />
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">Type</h1>
        <p className="mt-2 max-w-prose text-muted">
          Eyes on the screen. Home row, then where each letter lives, then mixes, then short words, then Tanakh
          snippets. Accuracy ≥{TYPE_PASS}% opens the next step. Speed is vanity.
        </p>
      </Panel>
      <Panel>
        <TypeSession
          mode="study"
          progress={typing}
          onStudyPass={(acc, rung) => record(acc, rung)}
        />
      </Panel>
    </>
  );
}
