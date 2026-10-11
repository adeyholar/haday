import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Panel } from "@/components/panel";
import { getMyPath, type MyPath } from "@/lib/learner-path";
import { lessonUnlocked, levelUnlocked } from "@/lib/iibs-game";
import { vocabLessons } from "@/lib/iibs-vocab";
import { IIBS_LEVELS, isIibsLevel, levelAfter } from "@/lib/path";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/iibs/$level")({ component: LevelPage });

function LevelPage() {
  const { level } = Route.useParams();
  const progress = useStudy((s) => s.game.iibs);
  const [gate, setGate] = useState<MyPath | null>(null);
  const [lesson, setLesson] = useState<number | null>(null);

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

  if (!isIibsLevel(level)) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">Not on this ladder</h1>
        <Link to="/iibs" className="mt-4 inline-block font-semibold text-primary">
          Back to lessons
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
  const words = lesson !== null ? lists?.[lesson] : null;

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">IIBS · lessons</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">
          {words && lesson !== null ? `Lesson ${lesson + 1}` : meta.title}
        </h1>
        {open && lists && lesson === null ? (
          <p className="mt-3 max-w-prose text-muted">{lists.length} lessons. Open one to read its words.</p>
        ) : null}
        {!open ? (
          <p className="mt-3 max-w-prose text-muted">This level is locked. Clear Level {levelAfter(level)} in Vocab Builder first.</p>
        ) : null}
        {lesson !== null ? (
          <button type="button" className="mt-4 font-semibold text-primary" onClick={() => setLesson(null)}>
            All lessons
          </button>
        ) : (
          <Link to="/iibs" className="mt-4 inline-block font-semibold text-primary">
            Back to lessons
          </Link>
        )}
      </Panel>
      {open && lists && lesson === null ? (
        <ol className="grid gap-2">
          {lists.map((row, index) => {
            const n = index + 1;
            const unlocked = lessonUnlocked(progress, level, n, admin);
            return (
              <li key={n}>
                {unlocked && row.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setLesson(index)}
                    className="flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-xl)] bg-card px-5 text-left text-ink shadow-[var(--shadow-border)]"
                  >
                    <span className="font-display text-2xl font-bold">Lesson {n}</span>
                    <span className="text-sm text-muted">{row.length} words</span>
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
      {open && words && words.length > 0 ? (
        <ul className="grid gap-2">
          {words.map((word) => (
            <li key={`${word.hebrew}-${word.gloss}`} className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
              <p className="he-word text-4xl text-ink" dir="rtl" lang="he">
                {word.hebrew}
              </p>
              {word.plural ? (
                <p className="he-word mt-1 text-xl text-muted" dir="rtl" lang="he">
                  {word.plural}
                </p>
              ) : null}
              <p className="mt-2 text-muted">{word.gloss}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
