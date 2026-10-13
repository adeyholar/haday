import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Panel } from "@/components/panel";
import { getMyPath, type MyPath } from "@/lib/learner-path";
import { levelUnlocked } from "@/lib/iibs-game";
import { IIBS_LEVELS, levelAfter, type IibsLevelId } from "@/lib/path";
import { IIBS_WEEKS, iibsWeekCount, iibsWeekItems, isIibsWeekLevel } from "@/lib/iibs-weeks";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/iibs/study/")({ component: StudyHome });

function StudyHome() {
  const progress = useStudy((s) => s.game.iibs);
  const [gate, setGate] = useState<MyPath | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getMyPath()
      .then((next) => {
        if (!cancelled) setGate(next);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not open Study.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const admin = Boolean(gate?.admin);

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path · study</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Study</h1>
        <p className="mt-3 max-w-prose text-muted">
          Each level is {IIBS_WEEKS} weeks. A week is that week’s words only. You study the word, then the drill asks it
          every way. The whole level is not one sitting.
        </p>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Panel>
      <ol className="grid gap-2">
        {IIBS_LEVELS.filter((level) => isIibsWeekLevel(level.id)).map((level) => {
          const id = level.id as IibsLevelId;
          const open = levelUnlocked(progress, id, admin);
          return <LevelRow key={id} id={id} title={level.title} open={open} />;
        })}
      </ol>
    </>
  );
}

function LevelRow({ id, title, open }: { id: IibsLevelId; title: string; open: boolean }) {
  const weeks = isIibsWeekLevel(id) ? iibsWeekCount(id) : 0;
  const words = isIibsWeekLevel(id)
    ? Array.from({ length: weeks }, (_, n) => iibsWeekItems(id, n + 1).length).reduce((sum, n) => sum + n, 0)
    : 0;
  const note = !open
    ? `Locked until Level ${levelAfter(id)} is cleared.`
    : `${weeks} weeks · ${words} words`;
  const body = (
    <>
      <span>
        <span className="block font-display text-2xl font-bold">{title}</span>
        <span className="mt-1 block text-sm text-muted">{note}</span>
      </span>
      {open ? null : <Lock className="size-5 shrink-0 text-muted" />}
    </>
  );
  const className =
    "flex min-h-24 items-center justify-between gap-3 rounded-[var(--radius-xl)] bg-card p-5 text-ink shadow-[var(--shadow-border)]";
  if (!open || !isIibsWeekLevel(id)) {
    return (
      <li>
        <div className={`${className} opacity-70`} aria-disabled="true">
          {body}
        </div>
      </li>
    );
  }
  return (
    <li>
      <Link to="/iibs/study/$level" params={{ level: id }} className={className}>
        {body}
      </Link>
    </li>
  );
}
