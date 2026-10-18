import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { StudyMenu } from "@/components/study-menu";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import { GAME_STAGES } from "@/lib/game";
import { useStudy } from "@/lib/store";
import { term2Lesson } from "@/lib/term2-lessons";
import {
  isTerm2ChapterUnlocked,
  isTerm2StageUnlocked,
  term2ChapterPool,
  term2ChapterRecord,
  TERM2_PASS,
} from "@/lib/term2-game";

export const Route = createFileRoute("/study/term2/game/$chapter/")({ component: Term2ChapterHub });

function Term2ChapterHub() {
  const { chapter: raw } = Route.useParams();
  const chapter = Number(raw);
  const lesson = term2Lesson(chapter);
  const term2 = useStudy((s) => s.game.term2);
  if (!lesson || !isTerm2ChapterUnlocked(term2, chapter)) return <Navigate to="/study/term2/game" />;
  const rec = term2ChapterRecord(term2, chapter);
  const pool = term2ChapterPool(chapter);

  return (
    <>
      <Panel className="mb-4">
        <StudyMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Game · Chapter {chapter}</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">{lesson.title}</h1>
        <p className="mt-3 text-muted">{lesson.short}</p>
        <p className="mt-2 text-sm text-muted">
          {pool.length} words · {TERM2_PASS}% on the first answer · Spell (strict) is optional
        </p>
      </Panel>
      <ol className="grid gap-2">
        {GAME_STAGES.map((stage, index) => {
          const row = rec.stages[stage.id];
          const open = isTerm2StageUnlocked(term2, chapter, stage.id);
          const cls = cn(
            "flex w-full items-center justify-between gap-3 rounded-[var(--radius-lg)] p-4 text-left shadow-[var(--shadow-border)]",
            row.cleared || open ? "bg-card" : "bg-surface text-muted",
          );
          const inner = (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Stage {index + 1}</p>
                <p className="font-display text-2xl font-bold">{stage.name}</p>
                <p className="mt-0.5 text-sm text-muted">{stage.prompt}</p>
                {row.best > 0 ? <p className="mt-1 text-xs tabular-nums text-muted">Best {row.best}%</p> : null}
              </div>
              {row.cleared ? <Check className="size-5 text-good" /> : open ? null : <Lock className="size-5" />}
            </>
          );
          return (
            <li key={stage.id}>
              {open ? (
                <Link to="/study/term2/game/$chapter/$stage" params={{ chapter: String(chapter), stage: stage.id }} className={cls}>
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
