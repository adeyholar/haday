import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DrillSitting } from "@/components/drill-sitting";
import { FocusToggle } from "@/components/focus-toggle";
import { Panel } from "@/components/panel";
import { getMyPath, type MyPath } from "@/lib/learner-path";
import { levelUnlocked } from "@/lib/iibs-game";
import { levelAfter } from "@/lib/path";
import { iibsWeekCount, iibsWeekItems, iibsWeekLabel, isIibsWeekLevel } from "@/lib/iibs-weeks";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/iibs/study/$level/$week")({ component: WeekStudy });

function WeekStudy() {
  const { level, week: weekParam } = Route.useParams();
  const week = Math.round(Number(weekParam));
  const progress = useStudy((s) => s.game.iibs);
  const focus = useStudy((s) => s.focus);
  const saveIibsDrill = useStudy((s) => s.saveIibsDrill);
  const [gate, setGate] = useState<MyPath | null>(null);
  const known = isIibsWeekLevel(level);
  const count = known ? iibsWeekCount(level) : 0;
  const pool = useMemo(() => (known && week >= 1 && week <= count ? iibsWeekItems(level, week) : []), [known, level, week, count]);

  useEffect(() => {
    let cancelled = false;
    getMyPath()
      .then((next) => {
        if (!cancelled) setGate(next);
      })
      .catch(() => {
        if (!cancelled) setGate({ path: null, cleared: null, admin: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!known || week < 1 || week > count) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">No such week</h1>
        <Link to="/iibs/study" className="mt-4 inline-block font-semibold text-primary">
          All levels
        </Link>
      </Panel>
    );
  }

  if (!gate) {
    return (
      <Panel>
        <p className="text-sm text-muted">Opening this week…</p>
      </Panel>
    );
  }

  if (!levelUnlocked(progress, level, gate.admin)) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">Level {level} is locked</h1>
        <p className="mt-3 text-muted">Clear Level {levelAfter(level)} in Vocab Builder first.</p>
        <Link to="/iibs/study" className="mt-4 inline-block font-semibold text-primary">
          All levels
        </Link>
      </Panel>
    );
  }

  const prev = week > 1 ? week - 1 : null;
  const next = week < count ? week + 1 : null;

  return (
    <DrillSitting
      pool={pool}
      label={iibsWeekLabel(level, week)}
      readPlace={() => useStudy.getState().game.iibsDrillRuns?.[`${level}:${week}:${focus === "weak" ? "weak" : "due"}`]}
      writePlace={(place) => saveIibsDrill(level, week, focus, place)}
      chrome={
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path · study</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">{iibsWeekLabel(level, week)}</h1>
          <p className="mt-1 text-sm text-muted">
            {pool.length} words · week {week} of {count}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
            <Link to="/iibs/study/$level" params={{ level }} className="text-primary">
              All weeks
            </Link>
            {prev ? (
              <Link to="/iibs/study/$level/$week" params={{ level, week: String(prev) }} className="text-primary">
                Week {prev}
              </Link>
            ) : null}
            {next ? (
              <Link to="/iibs/study/$level/$week" params={{ level, week: String(next) }} className="text-primary">
                Week {next}
              </Link>
            ) : null}
          </div>
          <FocusToggle />
        </>
      }
    />
  );
}
