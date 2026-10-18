import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Headphones, ListChecks, Lock, Layers, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { levelUnlocked, lessonUnlocked } from "@/lib/iibs-game";
import { enterIibsRoom, leaveIibsRoom, readIibsRoom, subscribeIibsRoom } from "@/lib/iibs-room";
import { vocabLessons, type IibsVocabLevel } from "@/lib/iibs-vocab";
import { IIBS_LEVELS, levelAfter, type IibsLevelId } from "@/lib/path";
import { LEVEL_LEAVE, LEVEL_WHICH, LEVEL_WHICH_LINE } from "@/lib/path-names";
import { isIibsWeekLevel } from "@/lib/iibs-weeks";
import type { IibsGameProgress } from "@/lib/iibs-game";

export function useIibsRoom() {
  const [level, setLevel] = useState<IibsVocabLevel | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLevel(readIibsRoom());
    setReady(true);
    return subscribeIibsRoom(() => setLevel(readIibsRoom()));
  }, []);

  return { level, ready };
}

export function ScriptureTabs({ active }: { active: "levels" | "lab" }) {
  const face = (on: boolean) =>
    `flex min-h-11 items-center justify-center rounded-[var(--radius-lg)] px-3 text-sm font-semibold ${
      on ? "bg-ink text-parchment" : "text-muted"
    }`;
  return (
    <div className="mb-4 grid grid-cols-2 gap-1 rounded-[var(--radius-xl)] bg-card p-1 shadow-[var(--shadow-border)]" role="tablist" aria-label="Scripture Path">
      <Link to="/iibs" role="tab" aria-selected={active === "levels"} className={face(active === "levels")}>
        Levels
      </Link>
      <Link to="/iibs/wlc" role="tab" aria-selected={active === "lab"} className={face(active === "lab")}>
        Reading Lab
      </Link>
    </div>
  );
}

export function LevelHall({
  progress,
  admin,
}: {
  progress: IibsGameProgress;
  admin: boolean;
}) {
  return (
    <>
      <ScriptureTabs active="levels" />
      <section className="mb-4 rounded-[var(--radius-xl)] bg-card p-5 text-center shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">{LEVEL_WHICH}</h1>
        <p className="mx-auto mt-3 max-w-prose text-muted">{LEVEL_WHICH_LINE}</p>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        {IIBS_LEVELS.filter((level) => isIibsWeekLevel(level.id)).map((level) => {
          const id = level.id as IibsVocabLevel;
          const open = levelUnlocked(progress, id, admin);
          const lessons = vocabLessons(id);
          const words = lessons ? lessons.reduce((sum, row) => sum + row.length, 0) : 0;
          return (
            <button
              key={id}
              type="button"
              disabled={!open}
              onClick={() => {
                if (open) enterIibsRoom(id);
              }}
              className={`rounded-[var(--radius-xl)] p-5 text-left shadow-[var(--shadow-border)] ${
                open ? "bg-card text-ink" : "bg-card text-muted opacity-70"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-3xl font-bold">{level.title}</span>
                {open ? null : <Lock className="size-5 shrink-0" />}
              </span>
              <span className="mt-2 block text-sm text-muted">
                {open
                  ? `Thirty lessons · ${words} words`
                  : `Locked until Level ${levelAfter(id as IibsLevelId)} is cleared.`}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export function LevelRoom({
  level,
  progress,
  admin,
}: {
  level: IibsVocabLevel;
  progress: IibsGameProgress;
  admin: boolean;
}) {
  const [lesson, setLesson] = useState<number | null>(null);
  const lists = vocabLessons(level);
  const words = lesson !== null ? lists?.[lesson] : null;
  const title = IIBS_LEVELS.find((item) => item.id === level)?.title ?? `Level ${level}`;

  return (
    <>
      <Button
        className="mb-4 w-full"
        size="lg"
        variant="outline"
        onClick={() => {
          setLesson(null);
          leaveIibsRoom();
        }}
      >
        {LEVEL_LEAVE}
      </Button>
      <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">
          {words && lesson !== null ? `Lesson ${lesson + 1}` : title}
        </h1>
        <p className="mt-3 max-w-prose text-muted">
          Thirty lessons in this room. Vocab, study, and listening stay with {title}. Other levels stay outside.
        </p>
        {lesson !== null ? (
          <button type="button" className="mt-4 font-semibold text-primary" onClick={() => setLesson(null)}>
            All thirty lessons
          </button>
        ) : null}
      </section>

      {lesson === null ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            to="/iibs/vocab/$level"
            params={{ level }}
            className="flex min-h-24 flex-col justify-center rounded-[var(--radius-xl)] bg-card p-4 text-ink shadow-[var(--shadow-border)]"
          >
            <Layers className="size-5 text-primary" />
            <span className="mt-2 font-display text-xl font-bold">Vocab</span>
            <span className="text-sm text-muted">Thirty lessons, four stages</span>
          </Link>
          <Link
            to="/iibs/study/$level"
            params={{ level }}
            className="flex min-h-24 flex-col justify-center rounded-[var(--radius-xl)] bg-card p-4 text-ink shadow-[var(--shadow-border)]"
          >
            <ListChecks className="size-5 text-primary" />
            <span className="mt-2 font-display text-xl font-bold">Study</span>
            <span className="text-sm text-muted">Thirty weeks, then drill</span>
          </Link>
          <Link
            to="/iibs/road"
            className="flex min-h-24 flex-col justify-center rounded-[var(--radius-xl)] bg-card p-4 text-ink shadow-[var(--shadow-border)]"
          >
            <Headphones className="size-5 text-primary" />
            <span className="mt-2 font-display text-xl font-bold">Listen</span>
            <span className="text-sm text-muted">This level, on the road</span>
          </Link>
          <Link
            to="/iibs/wlc"
            className="flex min-h-24 flex-col justify-center rounded-[var(--radius-xl)] bg-card p-4 text-ink shadow-[var(--shadow-border)]"
          >
            <ScrollText className="size-5 text-primary" />
            <span className="mt-2 font-display text-xl font-bold">Reading Lab</span>
            <span className="text-sm text-muted">Leningrad Tanakh. Accents stay.</span>
          </Link>
        </div>
      ) : null}

      {lists && lesson === null ? (
        <ol className="mt-4 grid gap-2">
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

      {words && words.length > 0 ? (
        <ul className="mt-4 grid gap-2">
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
