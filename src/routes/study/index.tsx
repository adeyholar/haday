import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { StudyMenu } from "@/components/study-menu";
import { StudyContinue } from "@/components/study-continue";
import { Panel } from "@/components/panel";
import { STATIONS, isStationUnlocked, lessonsFor, stationComplete } from "@/lib/ladder";
import { useStudy } from "@/lib/store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/study/")({ component: LadderMapPage });

function LadderMapPage() {
  const ladder = useStudy((s) => s.game.ladder);
  const climb = [...STATIONS].sort((a, b) => b.order - a.order);

  return (
    <>
      <Panel className="mb-4">
        <StudyMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">The climb</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Five stations to the Realm</h1>
        <p className="mt-3 max-w-prose text-muted">
          Begin at Alef-bet Station. Each rung opens the next. The top is the Realm of the Word — reading and hearing
          with understanding. Open real text first. Name the rule last.
        </p>
        <div className="mt-4">
          <StudyContinue />
        </div>
      </Panel>
      <ol className="flex flex-col gap-2">
        {climb.map((station) => {
          const open = isStationUnlocked(ladder, station.id);
          const done = stationComplete(ladder, station.id);
          const current = open && !done && ladder.currentStationId === station.id;
          const n = lessonsFor(station.id).length;
          const held = lessonsFor(station.id).filter((l) => ladder.trained[l.id]).length;
          const inner = (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl font-bold">{station.name}</span>
                {open ? (
                  <span className="text-xs font-semibold text-muted">
                    {station.order === 5 ? "Realm" : `Rung ${station.order}`}
                  </span>
                ) : (
                  <Lock className="size-4 shrink-0 text-muted" />
                )}
              </div>
              <p className="mt-1 font-display text-xl text-primary" dir="rtl" lang="he">
                {station.hebrew}
              </p>
              <p className={cn("mt-1 text-sm", current ? "text-primary-foreground/80" : "text-muted")}>{station.goal}</p>
              {open ? (
                <p className="mt-1 text-sm text-muted">
                  {done ? "Trained" : `${held} / ${n} lessons`}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">The road opens when the rung below is trained.</p>
              )}
            </>
          );
          const cls = cn(
            "block w-full rounded-[var(--radius-lg)] p-4 text-left shadow-[var(--shadow-border)]",
            done && "bg-card",
            current && "bg-primary text-primary-foreground",
            open && !current && !done && "bg-card",
            !open && "bg-surface text-muted",
          );
          return (
            <li key={station.id}>
              {open ? (
                <Link to="/study/station/$id" params={{ id: station.id }} className={cls}>
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
