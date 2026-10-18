import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { IibsVocabPlay } from "@/components/iibs-vocab-play";
import { IibsWritePlay } from "@/components/iibs-write-play";
import { Panel } from "@/components/panel";
import { getMyPath, type MyPath } from "@/lib/learner-path";
import {
  IIBS_GAME_LEVELS,
  IIBS_LESSON_PASS,
  IIBS_STAGES,
  iibsLessonRec,
  lessonUnlocked,
  lessonWordCount,
  levelUnlocked,
  stageUnlocked,
  type IibsStageId,
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
  const finishIibsStage = useStudy((s) => s.finishIibsStage);
  const [gate, setGate] = useState<MyPath | null>(null);
  const [lesson, setLesson] = useState<number | null>(null);
  const [stage, setStage] = useState<IibsStageId | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMyPath()
      .then((next) => {
        if (!cancelled) setGate(next);
      })
      .catch(() => {
        if (!cancelled) setGate({ path: null, cleared: null, admin: false, term: 1 });
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
  const stageIndex = stage ? IIBS_STAGES.findIndex((item) => item.id === stage) : -1;
  const nextStage = stageIndex >= 0 ? IIBS_STAGES[stageIndex + 1] : undefined;
  const stageMeta = IIBS_STAGES.find((item) => item.id === stage);

  function goNext() {
    if (nextStage) {
      setStage(nextStage.id);
      setRound((n) => n + 1);
      return;
    }
    if (lessonNo < 30 && lessonWordCount(level, lessonNo + 1) > 0) {
      setLesson(lessonNo);
      setStage(null);
      return;
    }
    if (lessonNo < 30) {
      setLesson(null);
      setStage(null);
      return;
    }
    if (nextLevel) void navigate({ to: "/iibs/vocab/$level", params: { level: nextLevel } });
    else void navigate({ to: "/iibs/vocab" });
  }

  const nextLabel = nextStage ? nextStage.name : lessonNo < 30 ? `Lesson ${lessonNo + 1}` : nextLevel ? `Level ${nextLevel}` : "Vocab Builder";

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path · vocab builder</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">
          {stageMeta && lesson !== null ? `Lesson ${lessonNo} · ${stageMeta.name}` : lesson !== null ? `Lesson ${lessonNo}` : meta.title}
        </h1>
        {open && lists && lesson === null ? (
          <p className="mt-3 max-w-prose text-muted">
            Each lesson has four stages. Clear Multiple, Gloss, Hebrew, then Strict at {IIBS_LESSON_PASS}%. Strict opens
            the next lesson.
          </p>
        ) : null}
        {open && lesson !== null && !stage ? (
          <p className="mt-3 max-w-prose text-muted">Clear one stage at {IIBS_LESSON_PASS}% to open the next.</p>
        ) : null}
        {!open ? (
          <p className="mt-3 max-w-prose text-muted">This level is locked. Clear Level {levelAfter(level)} first.</p>
        ) : null}
        {stage ? (
          <button type="button" className="mt-4 font-semibold text-primary" onClick={() => setStage(null)}>
            Stages
          </button>
        ) : lesson !== null ? (
          <button
            type="button"
            className="mt-4 font-semibold text-primary"
            onClick={() => {
              setLesson(null);
              setStage(null);
            }}
          >
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
            const done = IIBS_STAGES.filter((item) => rec.stages[item.id].cleared).length;
            const frontier = lists.findIndex((item, itemIndex) => {
              const itemNo = itemIndex + 1;
              const itemRec = iibsLessonRec(progress, level, itemNo);
              return lessonUnlocked(progress, level, itemNo, admin) && item.length > 0 && !itemRec.stages.strict.cleared;
            });
            return (
              <li key={n}>
                {unlocked && row.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLesson(index);
                      setStage(null);
                    }}
                    className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-xl)] px-5 text-left shadow-[var(--shadow-border)] ${
                      index === frontier ? "bg-primary text-primary-foreground" : "bg-card text-ink"
                    }`}
                  >
                    <span className="font-display text-2xl font-bold">Lesson {n}</span>
                    <span className="inline-flex items-center gap-2 text-sm">
                      {rec.stages.strict.cleared ? <Check className={`size-4 ${index === frontier ? "" : "text-good"}`} /> : null}
                      {done}/4
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
      {open && lesson !== null && !stage ? (
        <ol className="grid gap-2">
          {IIBS_STAGES.map((item, index) => {
            const unlocked = stageUnlocked(progress, level, lessonNo, item.id, admin);
            const rec = iibsLessonRec(progress, level, lessonNo).stages[item.id];
            const frontier = IIBS_STAGES.findIndex((candidate) => {
              const openStage = stageUnlocked(progress, level, lessonNo, candidate.id, admin);
              return openStage && !iibsLessonRec(progress, level, lessonNo).stages[candidate.id].cleared;
            });
            const current = index === frontier;
            return (
              <li key={item.id}>
                {unlocked ? (
                  <button
                    type="button"
                    onClick={() => setStage(item.id)}
                    className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-[var(--radius-xl)] px-5 text-left shadow-[var(--shadow-border)] ${
                      current ? "bg-primary text-primary-foreground" : "bg-card text-ink"
                    }`}
                  >
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wide opacity-80">Stage {index + 1}</span>
                      <span className="font-display text-2xl font-bold">{item.name}</span>
                      <span className={`mt-0.5 block text-sm ${current ? "text-primary-foreground/80" : "text-muted"}`}>{item.prompt}</span>
                    </span>
                    {rec.cleared ? <Check className={`size-4 shrink-0 ${current ? "" : "text-good"}`} /> : <span className="text-sm">Play</span>}
                  </button>
                ) : (
                  <div className="flex min-h-16 items-center justify-between gap-3 rounded-[var(--radius-xl)] bg-card px-5 text-muted opacity-70 shadow-[var(--shadow-border)]">
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wide">Stage {index + 1}</span>
                      <span className="font-display text-2xl font-bold">{item.name}</span>
                    </span>
                    <Lock className="size-4" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      ) : null}
      {open && playing && playing.length > 0 && lesson !== null && stage === "multiple" ? (
        <IibsVocabPlay
          key={`${level}-${lessonNo}-multiple-${round}`}
          words={playing}
          pool={pool}
          onFinish={(pct) => finishIibsStage(level, lessonNo, "multiple", pct)}
          onExit={() => setStage(null)}
          onAgain={() => setRound((n) => n + 1)}
          nextLabel={nextLabel}
          onNext={goNext}
        />
      ) : null}
      {open && playing && playing.length > 0 && lesson !== null && stage && stage !== "multiple" ? (
        <IibsWritePlay
          key={`${level}-${lessonNo}-${stage}-${round}`}
          stage={stage}
          words={playing}
          onFinish={(pct) => finishIibsStage(level, lessonNo, stage, pct)}
          onExit={() => setStage(null)}
          onAgain={() => setRound((n) => n + 1)}
          nextLabel={nextLabel}
          onNext={goNext}
        />
      ) : null}
    </>
  );
}
