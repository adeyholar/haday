import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { getMyPath, type MyPath } from "@/lib/learner-path";
import { levelUnlocked } from "@/lib/iibs-game";
import { IIBS_LEVELS, isIibsLevel, levelAfter } from "@/lib/path";
import { iibsWeekCount, iibsWeekItems, isIibsWeekLevel } from "@/lib/iibs-weeks";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/iibs/study/$level")({ component: LevelWeeks });

function LevelWeeks() {
  const { level } = Route.useParams();
  const progress = useStudy((s) => s.game.iibs);
  const [gate, setGate] = useState<MyPath | null>(null);

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

  if (!isIibsWeekLevel(level) || !isIibsLevel(level)) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">Not a study level</h1>
        <Link to="/iibs/study" className="mt-4 inline-block font-semibold text-primary">
          All levels
        </Link>
      </Panel>
    );
  }

  if (!gate) {
    return (
      <Panel>
        <p className="text-sm text-muted">Opening this level…</p>
      </Panel>
    );
  }

  const meta = IIBS_LEVELS.find((item) => item.id === level)!;
  const open = levelUnlocked(progress, level, gate.admin);
  const weeks = iibsWeekCount(level);

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path · study</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">{meta.title}</h1>
        {open ? (
          <p className="mt-3 max-w-prose text-muted">
            {weeks} weeks. Open a week to study its words, then drill them. One week is one sitting.
          </p>
        ) : (
          <p className="mt-3 max-w-prose text-muted">This level is locked. Clear Level {levelAfter(level)} in Vocab Builder first.</p>
        )}
        <Link to="/iibs/study" className="mt-4 inline-block font-semibold text-primary">
          All levels
        </Link>
      </Panel>
      {open ? (
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: weeks }, (_, n) => {
            const week = n + 1;
            const count = iibsWeekItems(level, week).length;
            return (
              <li key={week}>
                <Link
                  to="/iibs/study/$level/$week"
                  params={{ level, week: String(week) }}
                  className="flex min-h-20 flex-col justify-center rounded-[var(--radius-lg)] bg-card px-4 py-3 text-ink shadow-[var(--shadow-border)]"
                >
                  <span className="font-display text-xl font-bold">Week {week}</span>
                  <span className="text-sm text-muted">{count} words</span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : null}
    </>
  );
}
