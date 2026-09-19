import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";
import { StudyMenu } from "@/components/study-menu";
import { Button } from "@/components/ui/button";
import { SelfQuizPlay, type SelfQuizMode } from "@/components/self-quiz-play";
import { cn } from "@/lib/cn";
import { COURSE_WEEKS, GAME_CHAPTER_TITLES, itemsForSelection, type VocabItem } from "@/lib/vocab";
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
  const rate = useStudy((s) => s.rate);
  const [weeks, setWeeks] = useState<number[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [deck, setDeck] = useState<VocabItem[] | null>(null);
  const [mode, setMode] = useState<SelfQuizMode>("type");
  const [run, setRun] = useState(0);
  const [lastWeak, setLastWeak] = useState<VocabItem[]>([]);

  const pool = useMemo(() => itemsForSelection(weeks, chapters), [weeks, chapters]);

  function toggle(list: number[], n: number, set: (v: number[]) => void) {
    set(list.includes(n) ? list.filter((x) => x !== n) : [...list, n]);
  }

  function start(from: VocabItem[]) {
    setLastWeak([]);
    setDeck(from);
    setRun((n) => n + 1);
  }

  return (
    <>
      <Panel className="mb-4">
        {gameShell ? <GameMenu /> : <StudyMenu />}
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">Quiz myself</h1>
        <p className="mt-2 max-w-prose text-muted">
          Pick any weeks and chapters. Every word in that mix is in the sitting. Type the English, or pick from four
          close glosses. First wrong is Try again. Second is Not yet — we’ll bring it back.
        </p>
      </Panel>

      {!deck ? (
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
          <p className="mt-3 text-sm text-muted">{pool.length} words — full deck, no cap</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant={mode === "type" ? "primary" : "outline"}
              onClick={() => setMode("type")}
            >
              Type English
            </Button>
            <Button
              variant={mode === "choice" ? "primary" : "outline"}
              onClick={() => setMode("choice")}
            >
              4 choices
            </Button>
          </div>
          <Button className="mt-3 w-full" disabled={!pool.length} onClick={() => start(pool)}>
            Start quiz
          </Button>
        </Panel>
      ) : (
        <Panel>
          <SelfQuizPlay
            key={run}
            items={deck}
            mode={mode}
            onMark={(id, m) => {
              if (m === "weak") rate(id, "again");
              else if (m === "strong") rate(id, "easy");
              else rate(id, "good");
            }}
            onDone={(weak) => setLastWeak(weak)}
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
