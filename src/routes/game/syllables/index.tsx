import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import { SYLLABLE_UNITS } from "@/lib/syllables";
import { isSyllableUnitUnlocked, syllableUnitRecord } from "@/lib/game";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/syllables/")({ component: SyllableMapPage });

function SyllableMapPage() {
  const game = useStudy((s) => s.game);

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Syllables</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Cut the word</h1>
        <p className="mt-3 max-w-prose text-muted">
          Each unit has two beats: learn the rule with Tanakh words and verses (the hit is marked), then a 12-question
          quiz drawn from that unit’s pool. Score 70% to open the next unit.
        </p>
      </Panel>
      <ol className="grid grid-cols-1 gap-2">
        {SYLLABLE_UNITS.map((u) => {
          const rec = syllableUnitRecord(game, u.id);
          const unlocked = isSyllableUnitUnlocked(game, u.id);
          const current = unlocked && !rec.cleared;
          const inner = (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl font-bold">{u.title}</span>
                {rec.cleared ? (
                  <Check className="size-4 shrink-0 text-good" />
                ) : unlocked ? (
                  <span className="text-xs text-muted">{u.short}</span>
                ) : (
                  <Lock className="size-4 shrink-0 text-muted" />
                )}
              </div>
              <p className={cn("mt-1 text-sm", current ? "text-primary-foreground/80" : "text-muted")}>{u.short}</p>
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
            <li key={u.id}>
              {unlocked ? (
                <Link to="/game/syllables/$unit" params={{ unit: String(u.id) }} className={cls}>
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
