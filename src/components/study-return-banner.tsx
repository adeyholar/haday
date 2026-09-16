import { Link, useSearch } from "@tanstack/react-router";
import { lessonById, stationById } from "@/lib/ladder";

export function StudyReturnBanner() {
  const search = useSearch({ strict: false }) as { from?: unknown };
  const from = typeof search.from === "string" ? search.from : "";
  const lesson = from ? lessonById(from) : undefined;
  if (!lesson) return null;
  const station = stationById(lesson.stationId);

  return (
    <p className="mb-3 text-sm font-semibold">
      <Link to="/study/lesson/$id" params={{ id: lesson.id }} className="text-primary hover:underline">
        Back to Stations
        {station ? ` · ${station.name}` : ""} · {lesson.title}
      </Link>
    </p>
  );
}
