import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { StudyMenu } from "@/components/study-menu";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useStudy } from "@/lib/store";
import { term2Lesson } from "@/lib/term2-lessons";
import {
  isTerm2ChapterUnlocked,
  term2ChapterPool,
  term2ChapterRecord,
  term2ContinueTarget,
  TERM2_CHAPTER_MAX,
  TERM2_CHAPTER_MIN,
  TERM2_PASS,
} from "@/lib/term2-game";

export const Route = createFileRoute("/study/term2/game/")({ component: Term2GameMap });

function Term2GameMap() {
  const term2 = useStudy((s) => s.game.term2);
  const next = term2ContinueTarget(term2);

  return (
    <>
      <Panel className="mb-4">
        <StudyMenu />
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink">Game</h1>
        <p className="mt-3 max-w-prose text-muted">
          Each chapter is a level. Clear Recognize, Gloss, then Spell. Spell (strict) is optional. The first answer is
          the grade. A miss comes back once and still counts. {TERM2_PASS}% opens the next stage. Chapter{" "}
          {TERM2_CHAPTER_MIN} starts open. These scores stay in this room.
        </p>
        <Link
          to="/study/term2/game/$chapter/$stage"
          params={{ chapter: String(next.chapter), stage: next.stage }}
          className="mt-4 block"
        >
          <Button className="w-full" size="lg">
            Continue · Chapter {next.chapter}
          </Button>
        </Link>
      </Panel>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: TERM2_CHAPTER_MAX - TERM2_CHAPTER_MIN + 1 }, (_, n) => TERM2_CHAPTER_MIN + n).map(
          (chapter) => {
            const rec = term2ChapterRecord(term2, chapter);
            const unlocked = isTerm2ChapterUnlocked(term2, chapter);
            const lesson = term2Lesson(chapter);
            const done = ["recognize", "gloss", "spell-lenient"].filter((id) => rec.stages[id as "recognize"].cleared)
              .length;
            const inner = (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">
                    Ch. {chapter}
                    <span className="ms-2 font-display text-lg font-bold">{lesson?.title}</span>
                  </span>
                  {rec.cleared ? (
                    <Check className="size-4 shrink-0 text-good" />
                  ) : unlocked ? (
                    <span className="text-xs tabular-nums text-muted">{done}/3</span>
                  ) : (
                    <Lock className="size-4 shrink-0 text-muted" />
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {lesson?.short} · {term2ChapterPool(chapter).length} words
                </p>
              </>
            );
            return (
              <li key={chapter}>
                {unlocked ? (
                  <Link
                    to="/study/term2/game/$chapter"
                    params={{ chapter: String(chapter) }}
                    className={cn(
                      "block w-full rounded-[var(--radius-lg)] p-4 text-left shadow-[var(--shadow-border)]",
                      rec.cleared ? "bg-card" : "bg-card",
                    )}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="block w-full rounded-[var(--radius-lg)] bg-surface p-4 text-left text-muted shadow-[var(--shadow-border)]">
                    {inner}
                  </div>
                )}
              </li>
            );
          },
        )}
      </ol>
    </>
  );
}
