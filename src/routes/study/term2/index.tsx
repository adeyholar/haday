import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { StudyMenu } from "@/components/study-menu";
import { TERM2_LESSONS } from "@/lib/term2-lessons";

export const Route = createFileRoute("/study/term2/")({ component: Term2Lessons });

function Term2Lessons() {
  return (
    <>
      <Panel>
        <StudyMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Semester 2</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Lessons</h1>
        <p className="mt-3 max-w-prose text-muted">
          Read the chapter, then drill its words. These lessons stay in this room.
        </p>
      </Panel>
      <ul className="mt-3 grid gap-2">
        {TERM2_LESSONS.map((lesson) => (
          <li key={lesson.chapter}>
            <Link
              to="/study/term2/$chapter"
              params={{ chapter: String(lesson.chapter) }}
              className="block rounded-[var(--radius-xl)] bg-card p-4 shadow-[var(--shadow-border)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Chapter {lesson.chapter}</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{lesson.title}</p>
              <p className="mt-1 text-sm text-muted">{lesson.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
