import { useEffect } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { StudyMenu } from "@/components/study-menu";
import { LadderActionLink } from "@/components/ladder-action";
import { AlefNoticeWalk } from "@/components/alef-notice-walk";
import { PsalmAcrosticWalk } from "@/components/psalm-acrostic-walk";
import { LessonStepBadge, LessonUnlockChecklist } from "@/components/lesson-unlock-checklist";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import {
  canTrain,
  isStationUnlocked,
  lessonById,
  lessonGates,
  lessonNeedsWalk,
  lessonsFor,
  stationById,
} from "@/lib/ladder";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/study/lesson/$id")({ component: LessonPage });

function LessonPage() {
  const { id } = Route.useParams();
  const ladder = useStudy((s) => s.game.ladder);
  const visit = useStudy((s) => s.visitLadder);
  const openText = useStudy((s) => s.openLadderText);
  const train = useStudy((s) => s.trainLadderLesson);
  const notice = useStudy((s) => s.noticeLadderWalk);
  const lesson = lessonById(id);
  const station = lesson ? stationById(lesson.stationId) : undefined;

  useEffect(() => {
    if (lesson && station && isStationUnlocked(ladder, lesson.stationId)) {
      visit(lesson.stationId, lesson.id);
    }
    // resume pointer only on enter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  if (!lesson || !station) return <Navigate to="/study" />;
  if (!isStationUnlocked(ladder, lesson.stationId)) return <Navigate to="/study" />;

  const opened = Boolean(ladder.openedText[lesson.id]);
  const trained = Boolean(ladder.trained[lesson.id]);
  const noticed = Boolean(ladder.noticed[lesson.id]);
  const drilled = Boolean(ladder.drillPass[lesson.id]);
  const gates = lessonGates(ladder, lesson.id);
  const siblings = lessonsFor(lesson.stationId);
  const nextLesson = siblings.find((l) => l.order === lesson.order + 1);
  const labAction = lesson.actions.find((a) => a.kind === "lab") ?? lesson.actions[0];
  const practice = lesson.actions.filter((a) => a.kind !== "lab");

  return (
    <>
      <div className="mb-4">
        <StudyMenu />
      </div>
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {station.name} · Lesson {lesson.order}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">{lesson.title}</h1>
        <p className="mt-2 text-sm text-muted">{lesson.labLabel}</p>
      </Panel>

      <div className="mt-3">
        <LessonUnlockChecklist progress={ladder} lesson={lesson} onOpenText={() => openText(lesson.id)} />
      </div>

      <Panel className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">1 · Open the text</p>
          <LessonStepBadge done={opened} />
        </div>
        <p className="mt-2 max-w-prose text-ink">{lesson.notice}</p>
        <div className="mt-3">
          <LadderActionLink action={labAction} lessonId={lesson.id} onLab={() => openText(lesson.id)} />
        </div>
        {!opened ? (
          <p className="mt-2 text-sm text-muted">The Lab is the door. Practice waits until you have opened the verse.</p>
        ) : (
          <p className="mt-2 text-sm text-muted">Text opened. Notice, then practice.</p>
        )}
      </Panel>

      <Panel className="mt-3">
        <div id="lesson-notice" className="scroll-mt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">2 · Notice</p>
            <LessonStepBadge done={noticed} />
          </div>
          <p className="mt-2 max-w-prose text-ink">{lesson.distinction}</p>
          {lesson.id === "alef-bereshit" ? (
            opened ? (
              <AlefNoticeWalk lessonId={lesson.id} />
            ) : (
              <p className="mt-2 text-sm text-muted">Open Genesis 1:1 first. Then we walk the first word and the letters.</p>
            )
          ) : null}
          {lesson.id === "alef-ps119" ? (
            opened ? (
              <PsalmAcrosticWalk lessonId={lesson.id} />
            ) : (
              <p className="mt-2 text-sm text-muted">Open Psalm 119 first. Then we walk one letter, one stanza at a time.</p>
            )
          ) : null}
          {opened && !lessonNeedsWalk(lesson.id) ? (
            ladder.noticed[lesson.id] ? (
              <p className="mt-3 text-sm text-muted">You noticed this verse.</p>
            ) : (
              <Button className="mt-3" variant="outline" onClick={() => notice(lesson.id)}>
                I have noticed
              </Button>
            )
          ) : null}
          {opened && lessonNeedsWalk(lesson.id) && !ladder.noticed[lesson.id] ? (
            <p className="mt-3 text-sm text-muted">Walk every letter. Hear is not a score.</p>
          ) : null}
          {opened && lessonNeedsWalk(lesson.id) && ladder.noticed[lesson.id] ? (
            <p className="mt-3 text-sm text-muted">Notice walk finished.</p>
          ) : null}
        </div>
      </Panel>

      <Panel className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">3 · Practice</p>
          {gates.some((g) => g.id === "drill") ? <LessonStepBadge done={drilled} /> : null}
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {opened ? (
            practice.map((action) => (
              <LadderActionLink
                key={`${action.kind}-${action.label}`}
                action={action}
                lessonId={lesson.id}
                onLab={action.kind === "echo" ? () => openText(lesson.id) : undefined}
              />
            ))
          ) : (
            <p className="text-sm text-muted">Open the text first. Then Drill, Write, Echo, and Ask are ready.</p>
          )}
        </div>
      </Panel>

      <Panel className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">4 · Name the rule last</p>
        {opened ? (
          <p className="mt-2 max-w-prose text-ink">{lesson.rule}</p>
        ) : (
          <p className="mt-2 text-sm text-muted">The rule stays closed until you have met the text.</p>
        )}
        <p className="mt-2 text-sm text-muted">{lesson.hearAgain}</p>
      </Panel>

      <div className="mt-4 flex flex-col gap-2">
        {trained ? (
          <p className="text-center text-sm font-semibold text-muted">This lesson is trained.</p>
        ) : (
          <Button className="w-full" disabled={!canTrain(ladder, lesson.id)} onClick={() => train(lesson.id)}>
            Mark trained
          </Button>
        )}
        {nextLesson ? (
          <Link to="/study/lesson/$id" params={{ id: nextLesson.id }} className="block">
            <Button className="w-full" variant="outline">
              Next lesson
            </Button>
          </Link>
        ) : (
          <Link to="/study/station/$id" params={{ id: station.id }} className="block">
            <Button className="w-full" variant="outline">
              Back to {station.name}
            </Button>
          </Link>
        )}
        <Link to="/study" className="text-center text-sm font-semibold text-primary">
          All stations
        </Link>
      </div>
    </>
  );
}
