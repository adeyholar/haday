import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { WeekSelect } from "@/components/week-select";
import { itemsForWeek, studySetMeta } from "@/lib/vocab";
import { useStudy } from "@/lib/store";
import { FocusToggle } from "@/components/focus-toggle";
import { StudyMenu } from "@/components/study-menu";
import { DrillSitting } from "@/components/drill-sitting";
import { drillKey, finalDrillKey } from "@/lib/etch";
import { finalExamDrillItems } from "@/lib/final-vocab";
import { cn } from "@/lib/cn";

type DrillSearch = { set?: "final"; from?: string };

export const Route = createFileRoute("/drill")({
  validateSearch: (search: Record<string, unknown>): DrillSearch => ({
    set: search.set === "final" ? "final" : undefined,
    from: typeof search.from === "string" && search.from ? search.from : undefined,
  }),
  component: DrillPage,
});

function DrillPage() {
  const { set } = Route.useSearch();
  const navigate = Route.useNavigate();
  const final = set === "final";
  const week = useStudy((s) => s.week);
  const focus = useStudy((s) => s.focus);
  const saveDrillAt = useStudy((s) => s.saveDrillAt);
  const pool = useMemo(() => (final ? finalExamDrillItems() : itemsForWeek(week)), [final, week]);
  const label = final ? "Final exam" : studySetMeta(week).label;
  const placeKey = final ? finalDrillKey(focus) : drillKey(week, focus);

  return (
    <DrillSitting
      pool={pool}
      label={label}
      readPlace={() => useStudy.getState().game.drillRuns?.[placeKey]}
      writePlace={(place) => saveDrillAt(placeKey, place)}
      chrome={
        <>
          <StudyMenu />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate({ search: (prev) => ({ ...prev, set: undefined }) })}
              className={cn(
                "min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
                final ? "bg-card text-muted shadow-[var(--shadow-border)]" : "bg-ink text-parchment",
              )}
            >
              Study set
            </button>
            <button
              type="button"
              onClick={() => navigate({ search: (prev) => ({ ...prev, set: "final" }) })}
              className={cn(
                "min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
                final ? "bg-ink text-parchment" : "bg-card text-muted shadow-[var(--shadow-border)]",
              )}
            >
              Final exam
            </button>
          </div>
          {final ? (
            <p className="mt-2 text-sm text-ink">
              <span className="font-semibold">Final exam</span>
              <span className="text-muted"> · the professor’s eighty words · its own saved place</span>
            </p>
          ) : (
            <div className="mt-4">
              <WeekSelect />
            </div>
          )}
          <FocusToggle pool={final ? pool : undefined} />
        </>
      }
    />
  );
}