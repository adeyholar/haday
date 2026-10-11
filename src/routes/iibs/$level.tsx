import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { getMyPath, type MyPath } from "@/lib/learner-path";
import { IIBS_LEVELS, PASS_MARK, isIibsLevel, levelAfter, levelOpen } from "@/lib/path";

export const Route = createFileRoute("/iibs/$level")({ component: LevelPage });

function LevelPage() {
  const { level } = Route.useParams();
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

  if (!isIibsLevel(level)) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">Not on this ladder</h1>
        <p className="mt-3 text-sm text-muted">Levels run from A to E, then Hebrew Reading Lab.</p>
        <Link to="/iibs" className="mt-4 inline-block font-semibold text-primary">
          Back to the levels
        </Link>
      </Panel>
    );
  }

  const meta = IIBS_LEVELS.find((item) => item.id === level)!;
  const open = gate ? levelOpen(level, gate.cleared, gate.admin) : false;
  const after = levelAfter(level);

  return (
    <Panel>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">IIBS</p>
      <h1 className="mt-1 font-display text-4xl font-bold text-ink">{meta.title}</h1>
      {open ? (
        <p className="mt-3 max-w-prose text-muted">
          Lessons, games, and word puzzles for this level come next. The exam that opens the next level is not here
          yet. It will cover this whole level. The pass mark is {PASS_MARK}%.
        </p>
      ) : (
        <p className="mt-3 max-w-prose text-muted">
          This level is locked. Pass the {after === "E" && level === "lab" ? "Level E" : `Level ${after}`} exam at{" "}
          {PASS_MARK}% first. That exam covers the whole level under this one.
        </p>
      )}
      <Link to="/iibs" className="mt-5 inline-block font-semibold text-primary">
        Back to the levels
      </Link>
    </Panel>
  );
}
