import { createFileRoute, Navigate } from "@tanstack/react-router";
import { StudyMenu } from "@/components/study-menu";
import { Term2ExamPlay } from "@/components/term2-exam-play";
import { term2Lesson } from "@/lib/term2-lessons";

export const Route = createFileRoute("/study/term2/exam/$chapter")({ component: Term2ExamPage });

function Term2ExamPage() {
  const { chapter: raw } = Route.useParams();
  const chapter = Number(raw);
  const lesson = term2Lesson(chapter);
  if (!lesson) return <Navigate to="/study/term2" />;
  return (
    <>
      <div className="mb-4">
        <StudyMenu />
      </div>
      <Term2ExamPlay key={chapter} chapter={chapter} />
    </>
  );
}
