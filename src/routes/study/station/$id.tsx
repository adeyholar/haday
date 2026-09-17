import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { StudyMenu } from "@/components/study-menu";
import { StudyContinue } from "@/components/study-continue";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import {
  isStationId,
  isStationUnlocked,
  lessonGateLine,
  lessonsFor,
  stationById,
} from "@/lib/ladder";
import { useStudy } from "@/lib/store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/study/station/$id")({ component: StationPage });

function StationPage() {
  const { id } = Route.useParams();
  const ladder = useStudy((s) => s.game.ladder);
  const visit = useStudy((s) => s.visitLadder);
  const station = isStationId(id) ? stationById(id) : undefined;

  if (!station) return <Navigate to="/study" />;
  if (!isStationUnlocked(ladder, station.id)) return <Navigate to="/study" />;

  const lessons = lessonsFor(station.id);

  return (
    <>
      <Panel className="mb-4">
        <StudyMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Station {station.order} of 5
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">{station.name}</h1>
        <p className="mt-1 font-display text-2xl text-primary" dir="rtl" lang="he">
          {station.hebrew}
        </p>
        <p className="mt-3 max-w-prose text-muted">{station.goal}</p>
        <p className="mt-2 text-sm text-muted">{station.doneWhen}</p>
        <div className="mt-4">
          <StudyContinue />
        </div>
        <p className="mt-3 text-sm">
          <Link to="/study" className="font-semibold text-primary">
            All stations
          </Link>
        </p>
      </Panel>
      <ol className="grid grid-cols-1 gap-2">
        {lessons.map((lesson) => {
          const trained = Boolean(ladder.trained[lesson.id]);
          const line = lessonGateLine(ladder, lesson.id);
          return (
            <li key={lesson.id}>
              <Link
                to="/study/lesson/$id"
                params={{ id: lesson.id }}
                className={cn(
                  "block w-full rounded-[var(--radius-lg)] bg-card p-4 text-left shadow-[var(--shadow-border)]",
                  trained && "ring-1 ring-good/40",
                )}
                onClick={() => visit(station.id, lesson.id)}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-2xl font-bold">{lesson.title}</span>
                  <span className={cn("text-xs font-semibold", trained ? "text-good" : "text-muted")}>
                    {line}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{lesson.labLabel}</p>
              </Link>
            </li>
          );
        })}
      </ol>
      <Link to="/game" className="mt-4 block">
        <Button className="w-full" variant="outline">
          Game is the exam
        </Button>
      </Link>
    </>
  );
}
