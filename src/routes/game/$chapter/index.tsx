import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameContinue } from "@/components/game-continue";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import {
  CHAPTER_META,
  GAME_STAGES,
  chapterPool,
  chapterRecord,
  clampChapter,
  continueTarget,
  isChapterUnlocked,
  isStageUnlocked,
} from "@/lib/game";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/$chapter/")({ component: ChapterHub });

function ChapterHub() {
  const { chapter: raw } = Route.useParams();
  if (!/^\d+$/.test(raw)) {
    return <Navigate to="/game" />;
  }
  const chapter = clampChapter(Number(raw));
  const game = useStudy((s) => s.game);
  const rec = chapterRecord(game, chapter);
  const meta = CHAPTER_META[chapter];
  const pool = chapterPool(chapter);
  const unlocked = isChapterUnlocked(game, chapter);

  if (!unlocked) {
    const t = continueTarget(game);
    return <Navigate to="/game/$chapter/$stage" params={{ chapter: String(t.chapter), stage: t.stage }} />;
  }

  const nextOpen = GAME_STAGES.find((s) => !rec.stages[s.id].cleared) ?? GAME_STAGES[0];

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Game · Level {chapter}
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">
          Chapter {chapter}
          {meta ? ` · ${meta.title}` : ""}
        </h1>
        <p className="mt-3 text-muted">{meta?.blurb}</p>
        <p className="mt-2 text-sm text-muted">
          {pool.length} {chapter === 1 ? "letters" : "lemmas"}
          {chapter > 1 ? " · same citation forms as the class book" : ""} · 90% first-answer to clear a
          stage · {GAME_STAGES.filter((s) => rec.stages[s.id].cleared).length}/4 stages
        </p>
        <div className="mt-4">
          <GameContinue />
        </div>
      </Panel>

      <ol className="grid gap-2">
        {GAME_STAGES.map((s, i) => {
          const st = rec.stages[s.id];
          const open = isStageUnlocked(game, chapter, s.id);
          const current = open && !st.cleared;
          const cls = cn(
            "flex w-full items-center justify-between gap-3 rounded-[var(--radius-lg)] p-4 text-left shadow-[var(--shadow-border)]",
            current && "bg-primary text-primary-foreground",
            st.cleared && "bg-card",
            open && !current && !st.cleared && "bg-card",
            !open && "bg-surface text-muted",
          );
          const inner = (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Stage {i + 1}</p>
                <p className="font-display text-2xl font-bold">{s.name}</p>
                <p className={cn("mt-0.5 text-sm", current ? "text-primary-foreground/80" : "text-muted")}>
                  {s.prompt}
                </p>
              </div>
              {st.cleared ? (
                <span className="shrink-0 text-lg tracking-widest text-primary">
                  {"★".repeat(st.stars)}
                  <Check className="ms-1 inline size-4 text-good" />
                </span>
              ) : open ? (
                <span className="text-sm font-medium">Play</span>
              ) : (
                <Lock className="size-4 shrink-0" />
              )}
            </>
          );
          return (
            <li key={s.id}>
              {open ? (
                <Link to="/game/$chapter/$stage" params={{ chapter: String(chapter), stage: s.id }} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-6">
        <Link to="/game">
          <Button variant="outline" className="w-full">
            All chapters
          </Button>
        </Link>
      </div>

      {nextOpen && rec.cleared && (
        <p className="mt-4 text-center text-sm text-good">Chapter cleared. Replay any stage, or continue the path.</p>
      )}
    </>
  );
}
