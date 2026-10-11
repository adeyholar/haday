import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Panel } from "@/components/panel";
import { getMyPath, type MyPath } from "@/lib/learner-path";
import { levelUnlocked } from "@/lib/iibs-game";
import { IIBS_LEVELS, levelAfter, type IibsLevelId } from "@/lib/path";
import { vocabLessons } from "@/lib/iibs-vocab";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/iibs/")({ component: IibsHome });

function IibsHome() {
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not open the lessons.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const admin = Boolean(gate?.admin);

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">IIBS · lessons</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Lessons</h1>
        <p className="mt-3 max-w-prose text-muted">
          Each lesson lists its words. Level A, lesson 1 is open. The next lesson opens when Strict is cleared in Vocab
          Builder.
        </p>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Panel>
      <ol className="grid gap-2">
        {IIBS_LEVELS.map((level) => {
          const open = levelUnlocked(progress, level.id, admin);
          return <LevelRow key={level.id} id={level.id} title={level.title} open={open} />;
        })}
      </ol>
    </>
  );
}

function LevelRow({ id, title, open }: { id: IibsLevelId; title: string; open: boolean }) {
  const after = levelAfter(id);
  const lessons = vocabLessons(id);
  const words = lessons ? lessons.reduce((sum, lesson) => sum + lesson.length, 0) : 0;
  const note = !open
    ? id === "lab"
      ? "Locked until Level E is cleared."
      : `Locked until Level ${after} is cleared.`
    : lessons
      ? `${lessons.length} lessons · ${words} words`
      : "Open for you.";
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
  if (!open) {
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
      <Link to="/iibs/$level" params={{ level: id }} className={className}>
        {body}
      </Link>
    </li>
  );
}
