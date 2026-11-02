import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListenMenu } from "@/components/listen-menu";
import { RoadDeck, type RoadSet } from "@/components/road-deck";
import { finalExamRoadItems } from "@/lib/final-vocab";
import { COURSE_WEEKS, itemsForWeek } from "@/lib/vocab";
import { useStudy } from "@/lib/store";

const WEEK_KEY = "haday-road-week";

type RoadSearch = { week?: number; set?: "final" };

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
  validateSearch: (search: Record<string, unknown>): RoadSearch => {
    if (search.set === "final") return { set: "final" };
    const n = Number(search.week);
    return courseWeek(n) ? { week: n } : {};
  },
  component: RoadListenPage,
});

function RoadListenPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const studyWeek = useStudy((s) => s.week);
  const [week, setWeek] = useState(() => search.week ?? loadRoadWeek(studyWeek));
  const sets = useMemo<RoadSet[]>(
    () => [
      ...COURSE_WEEKS.map((w) => ({
        id: String(w.week),
        label: String(w.week),
        title: w.label,
        hint: w.hint,
        items: itemsForWeek(w.week),
      })),
      {
        id: "final",
        label: "Exam",
        title: "Final exam",
        hint: "The professor’s eighty words",
        items: finalExamRoadItems(),
      },
    ],
    [],
  );

  useEffect(() => {
    if (search.set === "final" || !search.week || search.week === week) return;
    saveRoadWeek(search.week);
    setWeek(search.week);
  }, [search.set, search.week, week]);

  return (
    <RoadDeck
      menu={<ListenMenu />}
      kicker="On the road"
      sets={sets}
      setId={search.set === "final" ? "final" : String(search.week ?? week)}
      onSet={(id) => {
        if (id === "final") {
          void navigate({ search: { set: "final" }, replace: true });
          return;
        }
        const next = courseWeek(Number(id)) ?? 1;
        saveRoadWeek(next);
        setWeek(next);
        void navigate({ search: { week: next }, replace: true });
      }}
      blurb={(set) =>
        set.id === "final"
          ? `${set.title} · ${set.hint} · ${set.items.length} words. Hebrew, then the exam meaning, in the same voice as Drill. The list repeats until you pause. The lock screen can skip. Music, if you turn it on, stays under the word.`
          : `${set.title} · ${set.hint} · ${set.items.length} words. Hebrew, then the meaning, in the same voice as Drill. The week repeats until you pause. The lock screen can skip. Music, if you turn it on, stays under the word.`
      }
    />
  );
}