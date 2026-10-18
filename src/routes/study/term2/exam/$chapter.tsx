import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { StudyMenu } from "@/components/study-menu";
import { Term2ExamPlay } from "@/components/term2-exam-play";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { useStudy } from "@/lib/store";
import { isTerm2ExamUnlocked, TERM2_PASS } from "@/lib/term2-game";
import { term2Lesson } from "@/lib/term2-lessons";

export const Route = createFileRoute("/study/term2/exam/$chapter")({ component: Term2ExamPage });

function Term2ExamPage() {
  const { chapter: raw } = Route.useParams();
  const chapter = Number(raw);
  const lesson = term2Lesson(chapter);
  const term2 = useStudy((s) => s.game.term2);
  if (!lesson) return <Navigate to="/study/term2" />;
  if (!isTerm2ExamUnlocked(term2, chapter)) {
    return (
      <Panel>
        <StudyMenu />
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">Chapter {chapter} is locked</h1>
        <p className="mt-3 text-muted">
          The previous chapter’s exam opens this one, at {TERM2_PASS}% on the first answer.
        </p>
        <Link to="/study/term2/exam/$chapter" params={{ chapter: String(chapter - 1) }} className="mt-4 block">
          <Button className="w-full">Chapter {chapter - 1} exam</Button>
        </Link>
      </Panel>
    );
  }
  return (
    <>
      <div className="mb-4">
        <StudyMenu />
      </div>
      <Term2ExamPlay key={chapter} chapter={chapter} />
    </>
  );
}
