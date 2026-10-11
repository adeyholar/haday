import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { HonorBadge } from "@/components/honor-badge";
import { Panel } from "@/components/panel";
import { getMyPath, type MyPath } from "@/lib/learner-path";
import { IIBS_LESSON_PASS, IIBS_RANKS, heldIibsRank, levelCleared, levelUnlocked, rankForLevel } from "@/lib/iibs-game";
import { IIBS_LEVELS, levelAfter, type IibsLevelId } from "@/lib/path";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/iibs/vocab/")({ component: VocabHome });

function VocabHome() {
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not open Vocab Builder.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const admin = Boolean(gate?.admin);
  const held = heldIibsRank(progress);

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">IIBS · vocab builder</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Vocab Builder</h1>
        <p className="mt-3 max-w-prose text-muted">
          Level A, lesson 1 is open. Each lesson has four stages: Multiple, Gloss, Hebrew, then Strict. Clear a stage at{" "}
          {IIBS_LESSON_PASS}% to open the next stage. Strict opens the next lesson. Clear every lesson in a level and
          you receive that level’s rank.
        </p>
        <p className="mt-4">
          {held ? <HonorBadge honor={held} /> : <span className="text-sm text-muted">No rank yet. Clear Level A.</span>}
        </p>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Panel>
      <ol className="mb-4 grid gap-2">
        {IIBS_RANKS.map((rank) => {
          const earned = rank.id !== "lab" && levelCleared(progress, rank.id);
          return (
            <li
              key={rank.id}
              className={`flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius-lg)] px-4 ${
                earned ? "bg-card text-ink shadow-[var(--shadow-border)]" : "text-muted"
              }`}
            >
              <span>
                <span className="block font-semibold">{rank.title}</span>
                <span className="text-sm text-muted">{rank.id === "lab" ? "Hebrew Reading Lab" : `Level ${rank.id}`}</span>
              </span>
              {earned ? <Check className="size-4 shrink-0 text-good" /> : <Lock className="size-4 shrink-0" />}
            </li>
          );
        })}
      </ol>
      <ol className="grid gap-2">
        {IIBS_LEVELS.map((level) => {
          const open = levelUnlocked(progress, level.id, admin);
          const done = level.id !== "lab" && levelCleared(progress, level.id);
          return <LevelRow key={level.id} id={level.id} title={level.title} open={open} done={done} />;
        })}
      </ol>
    </>
  );
}

function LevelRow({ id, title, open, done }: { id: IibsLevelId; title: string; open: boolean; done: boolean }) {
  const after = levelAfter(id);
  const rank = rankForLevel(id);
  const note = !open
    ? id === "lab"
      ? "Locked until Level E is cleared."
      : `Locked until Level ${after} is cleared.`
    : done
      ? rank?.title ?? "Cleared."
      : "Open for you.";
  const body = (
    <>
      <span>
        <span className="block font-display text-2xl font-bold">{title}</span>
        <span className="mt-1 block text-sm text-muted">{note}</span>
      </span>
      {done ? <Check className="size-5 shrink-0 text-good" /> : open ? null : <Lock className="size-5 shrink-0 text-muted" />}
    </>
  );
  const className =
    "flex min-h-24 items-center justify-between gap-3 rounded-[var(--radius-xl)] bg-card p-5 text-ink shadow-[var(--shadow-border)]";
  if (!open || id === "lab") {
    return (
      <li>
        <div className={`${className} ${open ? "" : "opacity-70"}`} aria-disabled="true">
          {body}
        </div>
      </li>
    );
  }
  return (
    <li>
      <Link to="/iibs/vocab/$level" params={{ level: id }} className={className}>
        {body}
      </Link>
    </li>
  );
}
