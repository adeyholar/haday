import { LadderActionLink } from "@/components/ladder-action";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { canTrain, lessonGates, type LadderLesson, type LessonGate } from "@/lib/ladder";
import type { LadderProgress } from "@/lib/ladder";

function GateBadge({ done }: { done: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        done ? "bg-good/15 text-good" : "bg-surface text-muted",
      )}
    >
      {done ? "Done" : "Not yet"}
    </span>
  );
}

function scrollToNotice() {
  document.getElementById("lesson-notice")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function GateAction({
  gate,
  lesson,
  onOpenText,
}: {
  gate: LessonGate;
  lesson: LadderLesson;
  onOpenText?: () => void;
}) {
  if (gate.done) return null;
  if (gate.id === "text") {
    const lab = lesson.actions.find((a) => a.kind === "lab") ?? { kind: "lab" as const, label: "Open the text", lab: lesson.lab };
    return <LadderActionLink action={lab} lessonId={lesson.id} onLab={onOpenText} />;
  }
  if (gate.id === "notice") {
    return (
      <Button type="button" variant="outline" className="w-full" onClick={scrollToNotice}>
        Go to Notice
      </Button>
    );
  }
  const drill = lesson.actions.find((a) => a.kind === "drill") ?? { kind: "drill" as const, label: "Drill" };
  return <LadderActionLink action={drill} lessonId={lesson.id} />;
}

export function LessonStepBadge({ done }: { done: boolean }) {
  return <GateBadge done={done} />;
}

export function LessonUnlockChecklist({
  progress,
  lesson,
  onOpenText,
}: {
  progress: LadderProgress;
  lesson: LadderLesson;
  onOpenText?: () => void;
}) {
  const gates = lessonGates(progress, lesson.id);
  const ready = canTrain(progress, lesson.id);
  const trained = Boolean(progress.trained[lesson.id]);
  if (trained) return null;

  return (
    <div className="rounded-[var(--radius-lg)] bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">To unlock Mark trained</p>
      <p className="mt-1 text-sm font-semibold text-ink">
        {ready ? "Ready — mark trained" : `${gates.filter((g) => g.done).length}/${gates.length} complete`}
      </p>
      <ol className="mt-3 space-y-3">
        {gates.map((gate, i) => (
          <li key={gate.id} className="rounded-[var(--radius-md)] bg-card px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-ink">
                {i + 1}. {gate.label}
              </p>
              <GateBadge done={gate.done} />
            </div>
            {!gate.done ? <p className="mt-1 text-sm text-muted">{gate.hint}</p> : null}
            {!gate.done ? (
              <div className="mt-2">
                <GateAction gate={gate} lesson={lesson} onOpenText={onOpenText} />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
