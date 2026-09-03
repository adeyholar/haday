import {
  ALL_GAME_WEEK,
  COURSE_WEEKS,
  GAME_CHAPTER_TITLES,
  itemsForWeek,
  studySetMeta,
  weekForGameChapter,
} from "@/lib/vocab";
import { useStudy } from "@/lib/store";
import { cn } from "@/lib/cn";

export function WeekSelect() {
  const week = useStudy((s) => s.week);
  const setWeek = useStudy((s) => s.setWeek);
  const gameMode = week >= 30;
  const meta = studySetMeta(week);
  const count = itemsForWeek(week).length;

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
        Study set
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (!gameMode) setWeek(ALL_GAME_WEEK);
          }}
          className={cn(
            "min-h-11 flex-1 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
            gameMode ? "bg-ink text-parchment" : "bg-card text-muted shadow-[var(--shadow-border)]",
          )}
        >
          Game chapters
        </button>
        <button
          type="button"
          onClick={() => {
            if (gameMode) setWeek(1);
          }}
          className={cn(
            "min-h-11 flex-1 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
            !gameMode ? "bg-ink text-parchment" : "bg-card text-muted shadow-[var(--shadow-border)]",
          )}
        >
          Course weeks
        </button>
      </div>

      {gameMode ? (
        <>
          <button
            type="button"
            onClick={() => setWeek(ALL_GAME_WEEK)}
            className={cn(
              "mt-2 min-h-11 w-full rounded-[var(--radius-md)] px-3 text-sm font-semibold",
              week === ALL_GAME_WEEK ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-[var(--shadow-border)]",
            )}
          >
            All Game · Ch. 2–19
          </button>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {Array.from({ length: 19 }, (_, i) => i + 1).map((ch) => {
              const id = weekForGameChapter(ch);
              const on = week === id;
              return (
                <button
                  key={ch}
                  type="button"
                  title={`Chapter ${ch} · ${GAME_CHAPTER_TITLES[ch]}`}
                  onClick={() => setWeek(id)}
                  className={cn(
                    "min-h-11 rounded-[var(--radius-md)] text-sm font-semibold tabular-nums",
                    on ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-[var(--shadow-border)]",
                  )}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
          {COURSE_WEEKS.map((w) => (
            <button
              key={w.week}
              type="button"
              title={`${w.label} — ${w.hint}`}
              onClick={() => setWeek(w.week)}
              className={cn(
                "min-h-11 rounded-[var(--radius-md)] px-1 text-xs font-semibold",
                week === w.week ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-[var(--shadow-border)]",
              )}
            >
              Wk {w.week}
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 text-sm text-ink">
        <span className="font-semibold">{meta.label}</span>
        {meta.hint ? ` · ${meta.hint}` : ""}
        <span className="text-muted"> · {count} words</span>
      </p>
    </div>
  );
}
