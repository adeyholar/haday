import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";
import { StudyMenu } from "@/components/study-menu";
import { Button } from "@/components/ui/button";
import { TypeSession } from "@/components/type-session";
import { cn } from "@/lib/cn";
import { poolForSelection, type TypeWord } from "@/lib/hebrew-typing/bank";
import { emptyTyping } from "@/lib/hebrew-typing/ranks";
import { COURSE_WEEKS, GAME_CHAPTER_TITLES } from "@/lib/vocab";
import { useStudy } from "@/lib/store";

type Search = { shell?: "game" | "study" };

export const Route = createFileRoute("/self-quiz")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    shell: s.shell === "game" ? "game" : "study",
  }),
  component: SelfQuizPage,
});

function SelfQuizPage() {
  const { shell } = Route.useSearch();
  const gameShell = shell === "game";
  const game = useStudy((s) => s.game);
  const mark = useStudy((s) => s.recordTypingMark);
  const typing = game.typing ?? emptyTyping();
  const [weeks, setWeeks] = useState<number[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [deck, setDeck] = useState<TypeWord[] | null>(null);
  const [run, setRun] = useState(0);
  const [lastWeak, setLastWeak] = useState<TypeWord[]>([]);

  const pool = useMemo(() => poolForSelection(weeks, chapters), [weeks, chapters]);
  const play = deck;

  function toggle(list: number[], n: number, set: (v: number[]) => void) {
    set(list.includes(n) ? list.filter((x) => x !== n) : [...list, n]);
  }

  function start(from: TypeWord[]) {
    setLastWeak([]);
    setDeck(from.slice(0, 12));
    setRun((n) => n + 1);
  }

  return (
    <>
      <Panel className="mb-4">
        {gameShell ? <GameMenu /> : <StudyMenu />}
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">Quiz myself</h1>
        <p className="mt-2 max-w-prose text-muted">
          Pick a week, a chapter, or both. Type the pointed Hebrew. First miss: try again. Second miss: weak. First try
          right: strong.
        </p>
      </Panel>

      {!play ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Weeks</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {COURSE_WEEKS.map((w) => (
              <button
                key={w.week}
                type="button"
                onClick={() => toggle(weeks, w.week, setWeeks)}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] px-1 text-xs font-semibold",
                  weeks.includes(w.week) ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-[var(--shadow-border)]",
                )}
              >
                Wk {w.week}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Chapters</p>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {Array.from({ length: 19 }, (_, i) => i + 1).map((ch) => (
              <button
                key={ch}
                type="button"
                title={GAME_CHAPTER_TITLES[ch]}
                onClick={() => toggle(chapters, ch, setChapters)}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] text-sm font-semibold tabular-nums",
                  chapters.includes(ch) ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-[var(--shadow-border)]",
                )}
              >
                {ch}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">{pool.length} words in this mix</p>
          <Button className="mt-3 w-full" disabled={!pool.length} onClick={() => start(pool)}>
            Start quiz
          </Button>
        </Panel>
      ) : (
        <Panel>
          <TypeSession
            key={run}
            mode="quiz"
            progress={typing}
            words={play}
            crowdAww={gameShell}
            onMark={(id, m) => mark(id, m)}
            onDone={(log) => {
              setLastWeak(play.filter((w) => log.some((r) => r.id === w.id && r.mark === "weak")));
            }}
          />
          <div className="mt-4 flex flex-col gap-2">
            {lastWeak.length ? (
              <Button variant="outline" onClick={() => start(lastWeak)}>
                Retry weak only
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => {
                setDeck(null);
                setLastWeak([]);
              }}
            >
              New mix
            </Button>
          </div>
        </Panel>
      )}
    </>
  );
}
