import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import { grammarChapterLabel } from "@/lib/grammar";
import { GRAMMAR_TRACKS } from "@/lib/grammar-tracks";
import { grammarUnitRecord, lessonProgress } from "@/lib/game";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/lessons/")({ component: LessonsHubPage });

function LessonsHubPage() {
  const game = useStudy((s) => s.game);

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar chapters</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">One chapter at a time</h1>
        <p className="mt-3 max-w-prose text-muted">
          Each BBH chapter is its own path with its own title — not one 6–11 bundle. Open the chapter you are reading
          this week. Four units: learn with real verses, pair the forms, then a 12-question quiz. 90% held opens the
          next unit inside that chapter.
        </p>
        <p className="mt-2 text-sm">
          <Link to="/game/article" className="font-semibold text-primary">
            Article & vav · chapter 5
          </Link>
          <span className="text-muted"> · then </span>
          <Link to="/game/lessons/$track" params={{ track: "prep" }} className="font-semibold text-primary">
            Ch. 6 Prepositions
          </Link>
          <span className="text-muted">.</span>
        </p>
      </Panel>
      <ol className="grid grid-cols-1 gap-2">
        {GRAMMAR_TRACKS.map((t) => {
          const prog = lessonProgress(game, t.id);
          const cleared = t.units.filter((u) => grammarUnitRecord(game, t.id, u.id).cleared).length;
          const allClear = cleared >= t.units.length;
          const started =
            prog.unlockedUnit > 1 || t.units.some((u) => grammarUnitRecord(game, t.id, u.id).attempts > 0);
          const current = started && !allClear;
          const inner = (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">
                  Chapter {t.chapter}
                  <span className="ms-2 font-display text-2xl font-bold">{t.title}</span>
                </span>
                {allClear ? <Check className="size-4 shrink-0 text-good" /> : null}
              </div>
              <p className={cn("mt-1 text-sm", current && !allClear ? "text-primary-foreground/80" : "text-muted")}>
                {t.blurb}
              </p>
              <p className={cn("mt-1 text-sm", allClear ? "tracking-widest text-primary" : "text-muted")}>
                {cleared} / {t.units.length} units
                {prog.units["1"]?.best
                  ? ` · best ${Math.max(...t.units.map((u) => grammarUnitRecord(game, t.id, u.id).best))}%`
                  : ""}
              </p>
            </>
          );
          const cls = cn(
            "block w-full rounded-[var(--radius-lg)] p-4 text-left shadow-[var(--shadow-border)]",
            allClear && "bg-card",
            current && "bg-primary text-primary-foreground",
            !current && !allClear && "bg-card",
          );
          return (
            <li key={t.id}>
              <Link to="/game/lessons/$track" params={{ track: t.id }} className={cls} aria-label={grammarChapterLabel(t)}>
                {inner}
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
