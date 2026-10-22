import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AttemptBanner } from "@/components/attempt-banner";
import { MarkedAnswer } from "@/components/marked-answer";
import { DontKnowButton } from "@/components/dont-know-button";
import { MixHe } from "@/components/grammar-play";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { playFeedback } from "@/lib/try-again";
import { useStudy } from "@/lib/store";
import { term2Exam, type Term2ExamQ } from "@/lib/term2-exams";
import { starsForTerm2, TERM2_CHAPTER_MAX, TERM2_PASS } from "@/lib/term2-game";
import { term2Lesson } from "@/lib/term2-lessons";

type PlayQ = Term2ExamQ & { key: string; retry?: boolean };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deal(chapter: number): PlayQ[] {
  return shuffle(term2Exam(chapter)).map((item, n) => ({
    ...item,
    key: `${chapter}-${n}`,
    choices: shuffle(item.choices),
  }));
}

export function Term2ExamPlay({ chapter }: { chapter: number }) {
  const lesson = term2Lesson(chapter);
  const complete = useStudy((s) => s.completeTerm2Exam);
  const noteActiveStudy = useStudy((s) => s.noteActiveStudy);
  const seeded = useMemo(() => deal(chapter), [chapter]);
  const [items, setItems] = useState<PlayQ[]>(seeded);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [firstTry, setFirstTry] = useState(0);
  const [firstSeen] = useState(seeded.length);
  const [done, setDone] = useState(false);
  const q = items[i];
  const pct = firstSeen ? Math.round((firstTry / firstSeen) * 100) : 0;
  const nextChapter = chapter < TERM2_CHAPTER_MAX ? chapter + 1 : null;

  function pick(choice: string) {
    if (!q || picked) return;
    noteActiveStudy();
    const ok = choice === q.answer;
    if (!ok && !retrying) {
      setRetrying(true);
      playFeedback("retry");
      return;
    }
    setPicked(choice);
    if (!q.retry && ok && !retrying) setFirstTry((n) => n + 1);
    playFeedback(ok ? "strong" : "fail");
  }

  function admitNoIdea() {
    if (!q || picked) return;
    noteActiveStudy();
    setPicked("__noidea__");
    playFeedback("fail");
  }

  function next() {
    if (!picked || !q) return;
    const ok = picked === q.answer;
    let nextItems = items;
    if (!ok && !q.retry) {
      const later: PlayQ = { ...q, key: `${q.key}-retry`, retry: true, choices: shuffle(q.choices) };
      const insertAt = Math.min(items.length, i + 2 + Math.floor(Math.random() * 3));
      nextItems = [...items.slice(0, insertAt), later, ...items.slice(insertAt)];
      setItems(nextItems);
    }
    if (i + 1 >= nextItems.length) {
      const score = firstSeen ? Math.round((firstTry / firstSeen) * 100) : 0;
      complete(chapter, { stars: starsForTerm2(firstSeen ? firstTry / firstSeen : 0), score });
      setDone(true);
      return;
    }
    setI((n) => n + 1);
    setPicked(null);
    setRetrying(false);
  }

  if (!q && !done) {
    return (
      <Panel>
        <p className="text-muted">That exam is not ready.</p>
      </Panel>
    );
  }

  if (done) {
    const passed = pct >= TERM2_PASS;
    return (
      <Panel className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Closed book · Chapter {chapter}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-ink">{pct}%</h1>
        <p className="mt-2 text-sm text-muted">
          {firstTry} / {firstSeen} on the first answer. A corrected second try does not count.
        </p>
        <p className="mt-3 text-sm font-medium text-ink">
          {passed
            ? nextChapter
              ? `Chapter ${nextChapter} exam is open.`
              : "That is the last exam."
            : `Need ${TERM2_PASS}% to open the next exam.`}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {passed && nextChapter ? (
            <Link to="/study/term2/exam/$chapter" params={{ chapter: String(nextChapter) }}>
              <Button className="w-full" size="lg">
                Chapter {nextChapter} exam
              </Button>
            </Link>
          ) : (
            <Button className="w-full" size="lg" onClick={() => {
              const again = deal(chapter);
              setItems(again);
              setI(0);
              setPicked(null);
              setRetrying(false);
              setFirstTry(0);
              setDone(false);
            }}>
              Try again
            </Button>
          )}
          <Link to="/study/term2/$chapter" params={{ chapter: String(chapter) }}>
            <Button className="w-full" variant="outline">
              Review the notes
            </Button>
          </Link>
        </div>
      </Panel>
    );
  }

  const ok = picked === q.answer;
  const lastNow = i + 1 >= items.length;
  return (
    <>
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Closed book · Chapter {chapter}
          {lesson ? ` · ${lesson.title}` : ""} · {Math.min(i + 1, firstSeen)} / {firstSeen}
        </p>
        <p className="mt-1 text-xs font-semibold text-muted">No notes on this page. {TERM2_PASS}% opens the next chapter.</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">
          <MixHe text={q.q} />
        </h1>
        {q.he ? (
          <p className="he-word mt-3 text-4xl" dir="rtl" lang="he">
            {q.he}
          </p>
        ) : null}
      </Panel>
      <ul className="mt-3 space-y-2">
        {q.choices.map((choice) => {
          const chosen = picked === choice;
          const rightChoice = choice === q.answer;
          return (
            <li key={choice}>
              <button
                type="button"
                disabled={Boolean(picked)}
                onClick={() => pick(choice)}
                className={cn(
                  "min-h-12 w-full rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium shadow-[var(--shadow-border)]",
                  !picked && "bg-card text-ink",
                  picked && rightChoice && "bg-good text-white",
                  picked && chosen && !rightChoice && "bg-bad text-white",
                  picked && !chosen && !rightChoice && "bg-card text-muted",
                )}
              >
                <MixHe text={choice} />
              </button>
            </li>
          );
        })}
      </ul>
      {!picked && retrying ? <AttemptBanner className="mt-3" kind="retry" /> : null}
      {!picked ? <DontKnowButton usedTry={retrying} onClick={admitNoIdea} /> : null}
      {picked ? (
        <div className="mt-3">
          <AttemptBanner kind={ok ? "strong" : "fail"} />
          <MarkedAnswer ok={ok} given={picked} answer={q.answer} />
          <p className="mt-2 text-sm text-muted">
            <MixHe text={q.why} />
          </p>
          {!ok && !q.retry ? <p className="mt-1 text-sm text-muted">You will see this one again. It still counts as a miss.</p> : null}
          <Button className="mt-3 w-full" onClick={next}>
            {lastNow ? "See score" : "Next"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
