import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { IibsVocabPlay } from "@/components/iibs-vocab-play";
import { Panel } from "@/components/panel";
import { getMyPath, type MyPath } from "@/lib/learner-path";
import {
  IIBS_GAME_LEVELS,
  IIBS_LESSON_PASS,
  iibsLessonRec,
  lessonUnlocked,
  lessonWordCount,
  levelUnlocked,
} from "@/lib/iibs-game";
import { vocabLessons, type IibsVocabLevel } from "@/lib/iibs-vocab";
import { IIBS_LEVELS, levelAfter } from "@/lib/path";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/iibs/vocab/$level")({ component: VocabLevelPage });

function isGameLevel(value: string): value is IibsVocabLevel {
  return (IIBS_GAME_LEVELS as readonly string[]).includes(value);
}

function VocabLevelPage() {
  const { level } = Route.useParams();
  const navigate = useNavigate();
  const progress = useStudy((s) => s.game.iibs);
  const finishIibsLesson = useStudy((s) => s.finishIibsLesson);
  const [gate, setGate] = useState<MyPath | null>(null);
  const [lesson, setLesson] = useState<number | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMyPath()
      .then((next) => {
        if (!cancelled) setGate(next);
      })
      .catch(() => {
        if (!cancelled) setGate({ path: null, cleared: null, admin: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isGameLevel(level)) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">Not in Vocab Builder</h1>
        <Link to="/iibs/vocab" className="mt-4 inline-block font-semibold text-primary">
          Back to Vocab Builder
        </Link>
      </Panel>
    );
  }

  if (!gate) {
    return (
      <Panel>
        <p className="text-sm text-muted">Opening this level…</p>
      </Panel>
    );
  }

  const admin = gate.admin;
  const meta = IIBS_LEVELS.find((item) => item.id === level)!;
  const open = levelUnlocked(progress, level, admin);
  const lists = vocabLessons(level);
  const playing = lesson !== null ? lists?.[lesson] : null;
  const lessonNo = lesson === null ? 0 : lesson + 1;
  const pool = (lists ?? []).flatMap((row) => row.map((word) => word.gloss));
  const nextLevel = IIBS_GAME_LEVELS[IIBS_GAME_LEVELS.indexOf(level) + 1];

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">IIBS · vocab builder</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">
          {playing && lesson !== null ? `Lesson ${lessonNo}` : meta.title}
        </h1>
        {open && lists && lesson === null ? (
          <p className="mt-3 max-w-prose text-muted">
            {lists.length} lessons. Clear one at {IIBS_LESSON_PASS}% to open the next.
          </p>
        ) : null}
        {!open ? (
          <p className="mt-3 max-w-prose text-muted">This level is locked. Clear Level {levelAfter(level)} first.</p>
        ) : null}
        {lesson !== null ? (
          <button type="button" className="mt-4 font-semibold text-primary" onClick={() => setLesson(null)}>
            All lessons
          </button>
        ) : (
          <Link to="/iibs/vocab" className="mt-4 inline-block font-semibold text-primary">
            Back to Vocab Builder
          </Link>
        )}
      </Panel>
      {open && lists && lesson === null ? (
        <ol className="grid gap-2">
          {lists.map((row, index) => {
            const n = index + 1;
            const unlocked = lessonUnlocked(progress, level, n, admin);
            const rec = iibsLessonRec(progress, level, n);
            const frontier = lists.findIndex((item, itemIndex) => {
              const itemNo = itemIndex + 1;
              return (
                lessonUnlocked(progress, level, itemNo, admin) &&
                item.length > 0 &&
                !iibsLessonRec(progress, level, itemNo).cleared
              );
            });
            return (
              <li key={n}>
                {unlocked && row.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setLesson(index)}
                    className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-xl)] px-5 text-left shadow-[var(--shadow-border)] ${
                      index === frontier ? "bg-primary text-primary-foreground" : "bg-card text-ink"
                    }`}
                  >
                    <span className="font-display text-2xl font-bold">Lesson {n}</span>
                    <span className="inline-flex items-center gap-2 text-sm">
                      {rec.cleared ? <Check className={`size-4 ${index === frontier ? "" : "text-good"}`} /> : null}
                      {rec.attempts ? `${rec.best}%` : `${row.length} words`}
                    </span>
                  </button>
                ) : (
                  <div className="flex min-h-14 items-center justify-between gap-3 rounded-[var(--radius-xl)] bg-card px-5 text-muted opacity-70 shadow-[var(--shadow-border)]">
                    <span className="font-display text-2xl font-bold">Lesson {n}</span>
                    {row.length === 0 ? <span className="text-sm">No words yet</span> : <Lock className="size-4" />}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      ) : null}
      {open && playing && playing.length > 0 && lesson !== null ? (
        <IibsVocabPlay
          key={`${level}-${lessonNo}-${round}`}
          words={playing}
          pool={pool}
          onFinish={(pct) => finishIibsLesson(level, lessonNo, pct)}
          onExit={() => setLesson(null)}
          onAgain={() => setRound((n) => n + 1)}
          nextLabel={lessonNo < 30 ? `Lesson ${lessonNo + 1}` : nextLevel ? `Level ${nextLevel}` : "Vocab Builder"}
          onNext={
            lessonNo < 30 && lessonWordCount(level, lessonNo + 1) > 0
              ? () => setLesson(lesson + 1)
              : lessonNo < 30
                ? () => setLesson(null)
                : nextLevel
                  ? () => void navigate({ to: "/iibs/vocab/$level", params: { level: nextLevel } })
                  : () => void navigate({ to: "/iibs/vocab" })
          }
        />
      ) : null}
    </>
  );
}
