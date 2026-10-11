import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { getMyPath, type MyPath } from "@/lib/learner-path";
import { vocabLessons } from "@/lib/iibs-vocab";
import { IIBS_LEVELS, PASS_MARK, isIibsLevel, levelAfter, levelOpen } from "@/lib/path";

export const Route = createFileRoute("/iibs/$level")({ component: LevelPage });

function LevelPage() {
  const { level } = Route.useParams();
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
        <p className="mt-3 text-sm text-muted">Levels run from A to E, then Hebrew Reading Lab.</p>
        <Link to="/iibs" className="mt-4 inline-block font-semibold text-primary">
          Back to the levels
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

  const meta = IIBS_LEVELS.find((item) => item.id === level)!;
  const open = gate ? levelOpen(level, gate.cleared, gate.admin) : false;
  const after = levelAfter(level);
  const lessons = vocabLessons(level);
  const words = lessons?.[lesson ?? -1];

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">IIBS</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">
          {words && lesson !== null ? `Lesson ${lesson + 1}` : meta.title}
        </h1>
        {open && lessons ? (
          <p className="mt-3 max-w-prose text-muted">
            {lesson === null
              ? `${lessons.length} lessons. ${lessons.reduce((sum, row) => sum + row.length, 0)} words. Games come later.`
              : words && words.length
                ? `${words.length} words.`
                : "No words in the lexicon for this lesson."}
          </p>
        ) : (
          <p className="mt-3 max-w-prose text-muted">
            This level is locked. Pass the {level === "lab" ? "Level E" : `Level ${after}`} exam at {PASS_MARK}% first.
            That exam covers the whole level under this one.
          </p>
        )}
        {lesson !== null ? (
          <button type="button" className="mt-4 font-semibold text-primary" onClick={() => setLesson(null)}>
            All lessons
          </button>
        ) : (
          <Link to="/iibs" className="mt-4 inline-block font-semibold text-primary">
            Back to the levels
          </Link>
        )}
      </Panel>
      {open && lessons && lesson === null ? (
        <ol className="grid gap-2">
          {lessons.map((row, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => setLesson(index)}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-[var(--radius-xl)] bg-card px-5 text-left text-ink shadow-[var(--shadow-border)]"
              >
                <span className="font-display text-2xl font-bold">Lesson {index + 1}</span>
                <span className="text-sm text-muted">{row.length ? `${row.length} words` : "No words yet"}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      {open && words && words.length ? (
        <ol className="grid gap-2">
          {words.map((word, index) => (
            <li key={`${word.hebrew}-${index}`} className="rounded-[var(--radius-xl)] bg-card px-5 py-4 shadow-[var(--shadow-border)]">
              <p className="he-word text-center text-4xl text-ink" dir="rtl" lang="he">
                {word.hebrew}
              </p>
              {word.plural ? (
                <p className="he-word mt-1 text-center text-xl text-muted" dir="rtl" lang="he">
                  {word.plural}
                </p>
              ) : null}
              <p className="mt-2 text-center text-muted">{word.gloss}</p>
              {word.kind ? (
                <p className="mt-1 text-center text-xs font-semibold uppercase tracking-[0.14em] text-primary">{word.kind}</p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </>
  );
}
