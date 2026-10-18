import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { StudyMenu } from "@/components/study-menu";
import { Button } from "@/components/ui/button";
import { useStudy } from "@/lib/store";
import { term2Lesson, TERM2_LESSONS } from "@/lib/term2-lessons";
import { weekForTerm2Chapter } from "@/lib/vocab-s2";

export const Route = createFileRoute("/study/term2/$chapter")({ component: Term2Chapter });

function Term2Chapter() {
  const { chapter: raw } = Route.useParams();
  const chapter = Number(raw);
  const lesson = term2Lesson(chapter);
  if (!lesson) return <Navigate to="/study/term2" />;
  const index = TERM2_LESSONS.findIndex((item) => item.chapter === chapter);
  const prev = TERM2_LESSONS[index - 1];
  const next = TERM2_LESSONS[index + 1];

  return (
    <>
      <Panel>
        <StudyMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Semester 2 · Chapter {lesson.chapter}
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">{lesson.title}</h1>
        <p className="mt-2 text-sm text-muted">{lesson.short}</p>
      </Panel>

      <Panel className="mt-3">
        {lesson.paras.map((para) => (
          <p key={para.slice(0, 24)} className="mt-3 max-w-prose text-ink first:mt-0">
            {para}
          </p>
        ))}
      </Panel>

      <Panel className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{lesson.exampleWhere}</p>
        <p className="he-word mt-3 text-2xl leading-relaxed">{lesson.exampleHe}</p>
        <p className="mt-2 text-ink">{lesson.exampleEn}</p>
        <p className="mt-3 text-sm text-muted">{lesson.hold}</p>
      </Panel>

      <div className="mt-4 flex flex-col gap-2">
        <Link to="/drill" onClick={() => useStudy.getState().setWeek(weekForTerm2Chapter(lesson.chapter))}>
          <Button className="w-full" size="lg">
            Drill chapter {lesson.chapter}
          </Button>
        </Link>
        <div className="grid grid-cols-2 gap-2">
          {prev ? (
            <Link to="/study/term2/$chapter" params={{ chapter: String(prev.chapter) }}>
              <Button className="w-full" variant="outline" size="lg">
                Chapter {prev.chapter}
              </Button>
            </Link>
          ) : (
            <Link to="/study/term2">
              <Button className="w-full" variant="outline" size="lg">
                All lessons
              </Button>
            </Link>
          )}
          {next ? (
            <Link to="/study/term2/$chapter" params={{ chapter: String(next.chapter) }}>
              <Button className="w-full" variant="outline" size="lg">
                Chapter {next.chapter}
              </Button>
            </Link>
          ) : (
            <Link to="/bbh">
              <Button className="w-full" variant="outline" size="lg">
                Back to the room
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
