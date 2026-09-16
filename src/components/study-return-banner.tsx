import { Link, useSearch } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { lessonById, stationById } from "@/lib/ladder";

export function StudyReturnBanner() {
  const search = useSearch({ strict: false }) as { from?: unknown };
  const from = typeof search.from === "string" ? search.from : "";
  const lesson = from ? lessonById(from) : undefined;
  if (!lesson) return null;
  const station = stationById(lesson.stationId);

  return (
    <Link
      to="/study/lesson/$id"
      params={{ id: lesson.id }}
      className="mb-4 flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-md)] bg-ink px-4 py-3 text-parchment shadow-[var(--shadow-border)]"
    >
      <ChevronLeft className="size-5 shrink-0" aria-hidden />
      <span className="min-w-0 text-start">
        <span className="block text-base font-semibold">Back to lesson</span>
        <span className="block truncate text-sm text-parchment">
          {station ? `${station.name} · ` : ""}
          {lesson.title}
        </span>
      </span>
    </Link>
  );
}
