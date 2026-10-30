import { createFileRoute } from "@tanstack/react-router";
import { QalClockPractice } from "@/components/qal-clock-practice";
import { StudyMenu } from "@/components/study-menu";

export const Route = createFileRoute("/study/verb-lab/qal-clocks")({
  component: QalClocksPage,
});

function QalClocksPage() {
  return (
    <>
      <div className="mb-4">
        <StudyMenu />
      </div>
      <QalClockPractice />
    </>
  );
}
