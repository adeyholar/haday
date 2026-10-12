import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListenMenu } from "@/components/listen-menu";
import { RoadDeck, type RoadSet } from "@/components/road-deck";
import { COURSE_WEEKS, itemsForWeek } from "@/lib/vocab";
import { useStudy } from "@/lib/store";

const WEEK_KEY = "haday-road-week";

function courseWeek(n: number): number | null {
  return COURSE_WEEKS.some((w) => w.week === n) ? n : null;
}

function loadRoadWeek(fallback: number): number {
  try {
    const saved = courseWeek(Number(localStorage.getItem(WEEK_KEY)));
    if (saved) return saved;
  } catch {
    /* ignore */
  }
  return courseWeek(fallback) ?? 1;
}

function saveRoadWeek(week: number) {
  try {
    localStorage.setItem(WEEK_KEY, String(week));
  } catch {
    /* ignore */
  }
}

export const Route = createFileRoute("/listen/road")({
  validateSearch: (search: Record<string, unknown>): { week?: number } => {
    const n = Number(search.week);
    return courseWeek(n) ? { week: n } : {};
  },
  component: RoadListenPage,
});

function RoadListenPage() {
  const search = Route.useSearch();
  const studyWeek = useStudy((s) => s.week);
  const [week, setWeek] = useState(() => search.week ?? loadRoadWeek(studyWeek));
  const weekRef = useRef(week);
  weekRef.current = week;
  const sets = useMemo<RoadSet[]>(
    () =>
      COURSE_WEEKS.map((w) => ({
        id: String(w.week),
        label: String(w.week),
        title: w.label,
        hint: w.hint,
        items: itemsForWeek(w.week),
      })),
    [],
  );

  useEffect(() => {
    if (!search.week || search.week === weekRef.current) return;
    saveRoadWeek(search.week);
    setWeek(search.week);
  }, [search.week]);

  return (
    <RoadDeck
      menu={<ListenMenu />}
      kicker="On the road"
      sets={sets}
      setId={String(week)}
      onSet={(id) => {
        const next = courseWeek(Number(id)) ?? 1;
        saveRoadWeek(next);
        setWeek(next);
      }}
      blurb={(set) =>
        `${set.title} · ${set.hint} · ${set.items.length} words. Hebrew, then the meaning, in the same voice as Drill. The week repeats until you pause. The lock screen can skip. Music, if you turn it on, stays under the word.`
      }
    />
  );
}
