import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { GameContinue } from "@/components/game-continue";
import { GameMenu } from "@/components/game-menu";
import { RewardsBar } from "@/components/rewards-bar";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import {
  CHAPTER_META,
  GAME_CHAPTER_MAX,
  GAME_STAGES,
  chapterRecord,
  isChapterUnlocked,
} from "@/lib/game";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/")({ component: GameMapPage });

function GameMapPage() {
  const game = useStudy((s) => s.game);
  const streak = useStudy((s) => s.streak);

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Chapter path</h1>
        <p className="mt-3 max-w-prose text-muted">
          Each BBH chapter is a level. Clear Recognize, Gloss, Spell (lenient), then Spell (strict) to unlock the next.
          Cards use the citation form from the class book. Both spell stages need the right consonants and vowels. Lenient
          still shows the verse; strict does not. Chapter 1 starts open. 90% first-answer clears a stage.{" "}
          <Link to="/guide" className="font-semibold text-primary">
            How to play
          </Link>
        </p>
        <div className="mt-4">
          <GameContinue />
        </div>
        <p className="mt-3 text-sm">
          <Link to="/challenge" className="font-semibold text-primary">
            Ultimate Challenge
          </Link>
          <span className="text-muted"> — optional full-list exam, graded when you finish.</span>
        </p>
        <p className="mt-3 text-sm text-muted">
          Streak <span className="font-semibold tabular-nums text-ink">{streak}d</span>
          {game.winStreak > 1 ? (
            <>
              {" · "}
              Wins <span className="font-semibold tabular-nums text-ink">{game.winStreak}</span>
            </>
          ) : null}
        </p>
      </Panel>

      <div className="mb-4">
        <RewardsBar />
      </div>

      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: GAME_CHAPTER_MAX }, (_, i) => i + 1).map((n) => {
          const rec = chapterRecord(game, n);
          const unlocked = isChapterUnlocked(game, n);
          const current = unlocked && !rec.cleared && n <= game.unlockedChapter;
          const meta = CHAPTER_META[n];
          const stagesDone = GAME_STAGES.filter((s) => rec.stages[s.id].cleared).length;
          const inner = (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">
                  Ch. {n}
                  <span className="ms-2 font-display text-lg font-bold">{meta?.title}</span>
                </span>
                {rec.cleared ? (
                  <Check className="size-4 shrink-0 text-good" />
                ) : unlocked ? (
                  <span className="text-xs tabular-nums text-muted">{stagesDone}/4</span>
                ) : (
                  <Lock className="size-4 shrink-0 text-muted" />
                )}
              </div>
              <p className={cn("mt-1 text-sm", current ? "text-primary-foreground/80" : "text-muted")}>
                {meta?.blurb}
              </p>
              {rec.cleared && (
                <p className="mt-1 text-sm tracking-widest text-primary" aria-label={`${Math.min(3, rec.stars)} chapter stars`}>
                  {"★".repeat(Math.min(3, Math.max(1, Math.round(rec.stars / 4))))}
                </p>
              )}
            </>
          );
          const cls = cn(
            "block w-full rounded-[var(--radius-lg)] p-4 text-left shadow-[var(--shadow-border)]",
            rec.cleared && "bg-card",
            current && !rec.cleared && "bg-primary text-primary-foreground",
            unlocked && !current && !rec.cleared && "bg-card",
            !unlocked && "bg-surface text-muted",
          );
          return (
            <li key={n}>
              {unlocked ? (
                <Link to="/game/$chapter" params={{ chapter: String(n) }} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
