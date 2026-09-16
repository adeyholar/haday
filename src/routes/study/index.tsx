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
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Learn in order</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Stations</h1>
        <p className="mt-3 max-w-prose text-muted">
          This is the path through Hebrew. You start at Alef-bet Station (the letters). Each station trains you, then
          the next one opens. The last stop is the Realm of the Word: Scripture you can read and hear with
          understanding. Always open a real verse first. The grammar name comes last.
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
                    {station.order === 5 ? "Last stop" : `Station ${station.order} of 5`}
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
                <p className="mt-1 text-sm text-muted">Finish the station below to open this one.</p>
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
