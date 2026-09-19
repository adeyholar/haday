import { createFileRoute } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";
import { TypeSession } from "@/components/type-session";
import { emptyTyping } from "@/lib/hebrew-typing/ranks";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/type")({ component: TypeGamePage });

function TypeGamePage() {
  const game = useStudy((s) => s.game);
  const record = useStudy((s) => s.recordTypingGame);
  const mark = useStudy((s) => s.recordTypingMark);
  const typing = game.typing ?? emptyTyping();

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">Type the word</h1>
        <p className="mt-2 max-w-prose text-muted">
          Do it: type the pointed Hebrew. Choose / Hard choose: English gloss, four Hebrew forms. First wrong is Try
          again (not weak). Second is Not yet. Type stays quiet. No speech score.
        </p>
      </Panel>
      <Panel>
        <TypeSession
          mode="game"
          progress={typing}
          onGameFinish={(acc) => record(acc)}
          onMark={(id, m) => mark(id, m)}
        />
      </Panel>
    </>
  );
}
