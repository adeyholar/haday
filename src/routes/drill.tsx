import { useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { WeekSelect } from "@/components/week-select";
import { itemsForWeek, studySetMeta, type VocabItem } from "@/lib/vocab";
import { useStudy } from "@/lib/store";
import { FocusToggle } from "@/components/focus-toggle";
import { StudyMenu } from "@/components/study-menu";
import { DrillSitting } from "@/components/drill-sitting";
import { drillKey, finalDrillKey } from "@/lib/etch";
import { finalExamDrillItems } from "@/lib/final-vocab";
import { findStudyItem } from "@/lib/tanakh-pool";
import { iibsPathItems } from "@/lib/iibs-weeks";
import { loadPassagePack, passageDrillKey } from "@/lib/reading-loop/passage";
import { cn } from "@/lib/cn";

type DrillSearch = { set?: "final" | "passage"; from?: string };

export const Route = createFileRoute("/drill")({
  validateSearch: (search: Record<string, unknown>): DrillSearch => ({
    set: search.set === "final" || search.set === "passage" ? search.set : undefined,
    from: typeof search.from === "string" && search.from ? search.from : undefined,
  }),
  component: DrillPage,
});

function DrillPage() {
  const { set, from } = Route.useSearch();
  const navigate = Route.useNavigate();
  const passage = set === "passage";
  const final = set === "final";
  const pack = useMemo(() => (passage ? loadPassagePack() : null), [passage]);
  const week = useStudy((s) => s.week);
  const focus = useStudy((s) => s.focus);
  const saveDrillAt = useStudy((s) => s.saveDrillAt);
  const pool = useMemo(() => {
    if (passage) {
      const ids = pack?.ids ?? [];
      const items: VocabItem[] = [];
      for (const id of ids) {
        const item = findStudyItem(id) ?? iibsPathItems().find((row) => row.id === id);
        if (item) items.push(item);
      }
      return items;
    }
    return final ? finalExamDrillItems() : itemsForWeek(week);
  }, [passage, pack, final, week]);
  const label = passage ? (pack?.label ?? "This passage") : final ? "Final exam" : studySetMeta(week).label;
  const placeKey = passage && pack ? passageDrillKey(pack.scope, pack.ref) : final ? finalDrillKey(focus) : drillKey(week, focus);
  const back = pack?.back || from;

  if (passage && !pack) {
    return (
      <>
        <StudyMenu />
        <p className="mt-4 text-sm text-ink">Open a chapter and choose Drill unknowns. This sitting keeps its own place.</p>
        <Link to="/drill" search={{ from }} className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary">
          Study set
        </Link>
      </>
    );
  }

  return (
    <DrillSitting
      pool={pool}
      label={label}
      readPlace={() => useStudy.getState().game.drillRuns?.[placeKey]}
      writePlace={(place) => saveDrillAt(placeKey, place)}
      chrome={
        <>
          <StudyMenu />
          {passage ? (
            <p className="mt-3 text-sm text-ink">
              <span className="font-semibold">{label}</span>
              <span className="text-muted"> · unknowns from this passage · its own saved place</span>
            </p>
          ) : (
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
          )}
          {passage && back ? (
            <a href={back} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary">
              Back to the reading
            </a>
          ) : null}
          {final ? (
            <p className="mt-2 text-sm text-ink">
              <span className="font-semibold">Final exam</span>
              <span className="text-muted"> · the professor’s eighty words · its own saved place</span>
            </p>
          ) : passage ? null : (
            <div className="mt-4">
              <WeekSelect />
            </div>
          )}
          <FocusToggle pool={final || passage ? pool : undefined} />
        </>
      }
    />
  );
}