import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { WeekSelect } from "@/components/week-select";
import { itemsForWeek, studySetMeta } from "@/lib/vocab";
import { useStudy } from "@/lib/store";
import { FocusToggle } from "@/components/focus-toggle";
import { StudyMenu } from "@/components/study-menu";
import { DrillSitting } from "@/components/drill-sitting";
import { drillKey } from "@/lib/etch";

export const Route = createFileRoute("/drill")({ component: DrillPage });

function DrillPage() {
  const week = useStudy((s) => s.week);
  const focus = useStudy((s) => s.focus);
  const saveDrillRun = useStudy((s) => s.saveDrillRun);
  const pool = useMemo(() => itemsForWeek(week), [week]);

  return (
    <DrillSitting
      pool={pool}
      label={studySetMeta(week).label}
      readPlace={() => useStudy.getState().game.drillRuns?.[drillKey(week, focus)]}
      writePlace={(place) => saveDrillRun(week, focus, place)}
      chrome={
        <>
          <StudyMenu />
          <div className="mt-4">
            <WeekSelect />
          </div>
          <FocusToggle />
        </>
      }
    />
  );
}
