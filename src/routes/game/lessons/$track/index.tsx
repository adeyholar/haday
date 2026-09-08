import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import { grammarTrack } from "@/lib/grammar-tracks";
import { grammarUnitRecord, isGrammarUnitUnlocked } from "@/lib/game";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/lessons/$track/")({ component: GrammarTrackMapPage });

function GrammarTrackMapPage() {
  const { track: raw } = Route.useParams();
  const track = grammarTrack(raw);
  const game = useStudy((s) => s.game);

  if (!track) return <Navigate to="/game/lessons" />;

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Chapter {track.chapter} · {track.short}
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">{track.title}</h1>
        <p className="mt-3 max-w-prose text-muted">{track.blurb}</p>
        <p className="mt-2 text-sm">
          <Link to="/game/lessons" className="font-semibold text-primary">
            All grammar paths
          </Link>
          <span className="text-muted"> · 90% held unlocks the next unit.</span>
        </p>
      </Panel>
      <ol className="grid grid-cols-1 gap-2">
        {track.units.map((u) => {
          const rec = grammarUnitRecord(game, track.id, u.id);
          const unlocked = isGrammarUnitUnlocked(game, track.id, u.id);
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
                <Link to="/game/lessons/$track/$unit" params={{ track: track.id, unit: String(u.id) }} className={cls}>
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
