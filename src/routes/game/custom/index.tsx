import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import {
  CHAPTER_META,
  GAME_STAGES,
  clearedChapters,
  mixPlayPool,
  type GameStageId,
} from "@/lib/game";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/custom/")({ component: CustomMixPage });

function CustomMixPage() {
  const game = useStudy((s) => s.game);
  const done = clearedChapters(game);
  const [picked, setPicked] = useState<number[]>(done);
  const [stage, setStage] = useState<GameStageId>("recognize");
  const pool = useMemo(() => mixPlayPool(picked), [picked]);

  function toggle(n: number) {
    setPicked((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort((a, b) => a - b)));
  }

  if (!done.length) {
    return (
      <>
        <Panel className="mb-4">
          <GameMenu />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Custom mix</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Review what you have cleared</h1>
          <p className="mt-3 max-w-prose text-muted">
            When you finish a BBH chapter at 90%, it appears here. Pick those levels and play the combined list in one
            sitting. Clear Chapter 1 first, then come back.
          </p>
          <Link to="/game" className="mt-5 inline-block">
            <Button>Chapter path</Button>
          </Link>
        </Panel>
      </>
    );
  }

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Custom mix</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Cleared levels, one sitting</h1>
        <p className="mt-3 max-w-prose text-muted">
          Only chapters you have already cleared. Tick the ones you want, pick Recognize, Gloss, or Spell, then play the
          combined list. This mix does not unlock or lock the path.
        </p>
      </Panel>

      <Panel className="mb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-ink">Levels</h2>
          <div className="flex gap-3 text-sm font-semibold">
            <button type="button" className="text-primary" onClick={() => setPicked(done)}>
              All
            </button>
            <button type="button" className="text-muted" onClick={() => setPicked([])}>
              None
            </button>
          </div>
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {done.map((n) => {
            const on = picked.includes(n);
            const meta = CHAPTER_META[n];
            return (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => toggle(n)}
                  className={cn(
                    "flex w-full items-baseline justify-between gap-2 rounded-[var(--radius-md)] px-4 py-3 text-left shadow-[var(--shadow-border)]",
                    on ? "bg-ink text-parchment" : "bg-card text-ink",
                  )}
                >
                  <span>
                    <span className="text-sm font-semibold">Ch. {n}</span>
                    <span className="ms-2 font-display text-lg font-bold">{meta?.title}</span>
                  </span>
                  <span className={cn("text-xs", on ? "text-parchment/70" : "text-muted")}>
                    {on ? "In mix" : "Add"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">How to play</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GAME_STAGES.map((s) => {
            const on = stage === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStage(s.id)}
                  className={cn(
                    "w-full rounded-[var(--radius-md)] px-4 py-3 text-left shadow-[var(--shadow-border)]",
                    on ? "bg-ink text-parchment" : "bg-card",
                  )}
                >
                  <span className="block font-semibold">{s.name}</span>
                  <span className={cn("block text-sm", on ? "text-parchment/70" : "text-muted")}>{s.prompt}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel>
        <p className="text-sm text-muted">
          {picked.length
            ? `${pool.length} lemmas from ${picked.length} level${picked.length === 1 ? "" : "s"} · ${GAME_STAGES.find((s) => s.id === stage)?.name}`
            : "Tick at least one cleared level."}
        </p>
        {picked.length ? (
          <Link
            to="/game/custom/play"
            search={{ chapters: picked.join(","), stage }}
            className="mt-4 block"
          >
            <Button className="w-full" size="lg">
              Play the mix
            </Button>
          </Link>
        ) : (
          <Button className="mt-4 w-full" size="lg" disabled>
            Play the mix
          </Button>
        )}
      </Panel>
    </>
  );
}
