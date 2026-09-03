import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import { ALEF_BET_LEVELS, ALEF_BET_LINE } from "@/lib/alefbet-game";
import { alefBetLevelRecord, isAlefBetLevelUnlocked } from "@/lib/game";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/alefbet/")({ component: AlefBetMapPage });

function AlefBetMapPage() {
  const game = useStudy((s) => s.game);

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Aleph-bet mastery</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Master the letters</h1>
        <p className="mt-3 max-w-prose text-muted">
          Three levels. The line, then the place of each letter, then the neighbor. No multiple-choice on neighbors —
          a shuffled Hebrew pad, letter only. Sin is 21, Shin is 22, Tav is 23.
        </p>
        <p className="he-word mt-4 text-2xl leading-relaxed" dir="rtl">
          {ALEF_BET_LINE.map((l) => l.letter).join(" ")}
        </p>
      </Panel>

      <ol className="grid grid-cols-1 gap-2">
        {ALEF_BET_LEVELS.map((lv) => {
          const rec = alefBetLevelRecord(game, lv.id);
          const unlocked = isAlefBetLevelUnlocked(game, lv.id);
          const current = unlocked && !rec.cleared;
          const inner = (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl font-bold">{lv.title}</span>
                {rec.cleared ? (
                  <Check className="size-4 shrink-0 text-good" />
                ) : unlocked ? (
                  <span className="text-xs text-muted">{lv.short}</span>
                ) : (
                  <Lock className="size-4 shrink-0 text-muted" />
                )}
              </div>
              <p className={cn("mt-1 text-sm", current ? "text-primary-foreground/80" : "text-muted")}>{lv.blurb}</p>
              {rec.cleared ? (
                <p className="mt-1 text-sm tracking-widest text-primary">
                  {"★".repeat(Math.min(3, rec.stars))} · best {rec.best}%
                </p>
              ) : null}
            </>
          );
          const cls = cn(
            "block w-full rounded-[var(--radius-lg)] p-4 text-left shadow-[var(--shadow-border)]",
            rec.cleared && "bg-card",
            current && "bg-primary text-primary-foreground",
            unlocked && !current && !rec.cleared && "bg-card",
            !unlocked && "bg-surface text-muted",
          );
          return (
            <li key={lv.id}>
              {unlocked ? (
                <Link to="/game/alefbet/$level" params={{ level: String(lv.id) }} className={cls}>
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
