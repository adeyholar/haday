import { useStudy } from "@/lib/store";
import { TERM2_WEEK_BASE } from "@/lib/vocab-s2";

const TERM1_WEEK = "haday-term1-week";

/** Park the first-term week while Semester 2 is open, and restore it once on the way back. */
export function enterTermWeek(term: 1 | 2) {
  if (typeof window === "undefined") return;
  const week = useStudy.getState().week;
  if (term === 2) {
    if (week < TERM2_WEEK_BASE) {
      window.sessionStorage.setItem(TERM1_WEEK, String(week));
      useStudy.getState().setWeek(TERM2_WEEK_BASE);
    }
    return;
  }
  const raw = window.sessionStorage.getItem(TERM1_WEEK);
  window.sessionStorage.removeItem(TERM1_WEEK);
  if (raw == null && week < TERM2_WEEK_BASE) return;
  const saved = Number(raw);
  const back = Number.isInteger(saved) && saved > 0 && saved < TERM2_WEEK_BASE ? saved : week < TERM2_WEEK_BASE ? week : 1;
  if (week !== back) useStudy.getState().setWeek(back);
}
