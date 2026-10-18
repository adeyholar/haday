import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoadDeck, type RoadSet } from "@/components/road-deck";
import { StudyMenu } from "@/components/study-menu";
import { itemsForWeek } from "@/lib/vocab";
import { isTerm2Week, TERM2_WEEKS } from "@/lib/vocab-s2";
import { useStudy } from "@/lib/store";

const WEEK_KEY = "haday-road-term2-week";

function savedWeek(fallback: number): number {
  try {
    const n = Number(localStorage.getItem(WEEK_KEY));
    if (TERM2_WEEKS.some((row) => row.week === n)) return n;
  } catch {
    /* ignore */
  }
  return isTerm2Week(fallback) ? fallback : 101;
}

export const Route = createFileRoute("/study/term2/listen/road")({ component: Term2RoadPage });

function Term2RoadPage() {
  const studyWeek = useStudy((s) => s.week);
  const [week, setWeek] = useState(() => savedWeek(studyWeek));
  const sets = useMemo<RoadSet[]>(
    () =>
      TERM2_WEEKS.map((row) => ({
        id: String(row.week),
        label: String(row.show),
        title: row.label,
        hint: row.hint,
        items: itemsForWeek(row.week).map((item) => ({ ...item, plainEnglish: true })),
      })),
    [],
  );

  return (
    <RoadDeck
      menu={<StudyMenu />}
      kicker="On the road"
      sets={sets}
      setId={String(week)}
      onSet={(id) => {
        const next = TERM2_WEEKS.some((row) => row.week === Number(id)) ? Number(id) : 101;
        try {
          localStorage.setItem(WEEK_KEY, String(next));
        } catch {
          /* ignore */
        }
        setWeek(next);
      }}
      blurb={(set) =>
        `${set.title} · ${set.hint} · ${set.items.length} words. Hebrew, then the meaning. The week repeats. This is the Semester 2 list.`
      }
    />
  );
}
