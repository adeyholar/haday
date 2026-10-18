import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FocusToggle } from "@/components/focus-toggle";
import { WeekSelect } from "@/components/week-select";
import { setMyTerm } from "@/lib/learner-path";
import { closeTermHall, openTermHall, publishTerm, type GrammarTerm } from "@/lib/path";
import {
  TERM_LEAVE,
  TERM_ONE_LINE,
  TERM_ONE_TITLE,
  TERM_TWO_LINE,
  TERM_TWO_NOTE,
  TERM_TWO_TITLE,
  TERM_WHICH,
  TERM_WHICH_LINE,
} from "@/lib/path-names";
import { statsFor, useStudy } from "@/lib/store";
import { enterTermWeek } from "@/lib/term-week";
import { TERM2_LESSONS } from "@/lib/term2-lessons";
import { itemsForWeek, studySetMeta } from "@/lib/vocab";
import { term2Vocab, weekForTerm2Chapter } from "@/lib/vocab-s2";
import { weakPool } from "@/lib/weak-pool";

export function SemesterHall({ onEnter }: { onEnter: (term: GrammarTerm) => void }) {
  const [busy, setBusy] = useState<GrammarTerm | null>(null);
  const [error, setError] = useState("");

  async function enter(term: GrammarTerm) {
    setBusy(term);
    setError("");
    try {
      const result = await setMyTerm({ data: { done: term === 2 } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      publishTerm(term);
      closeTermHall();
      enterTermWeek(term);
      onEnter(term);
    } catch {
      setError("That door did not open. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <section className="mb-4 rounded-[var(--radius-xl)] bg-card p-5 text-center shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar Path</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">{TERM_WHICH}</h1>
        <p className="mx-auto mt-3 max-w-prose text-muted">{TERM_WHICH_LINE}</p>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy != null}
          onClick={() => void enter(1)}
          className="rounded-[var(--radius-xl)] bg-ink p-5 text-left text-parchment shadow-[var(--shadow-border)]"
        >
          <p className="font-display text-3xl font-bold">{TERM_ONE_TITLE}</p>
          <p className="mt-2 text-sm text-parchment/80">{TERM_ONE_LINE}</p>
        </button>
        <button
          type="button"
          disabled={busy != null}
          onClick={() => void enter(2)}
          className="rounded-[var(--radius-xl)] bg-card p-5 text-left text-ink shadow-[var(--shadow-border)]"
        >
          <p className="font-display text-3xl font-bold">{TERM_TWO_TITLE}</p>
          <p className="mt-2 text-sm text-muted">{TERM_TWO_LINE}</p>
        </button>
      </div>
    </>
  );
}

export function LeaveSemester({ onLeave }: { onLeave: () => void }) {
  return (
    <Button
      className="mb-4 w-full"
      size="lg"
      variant="outline"
      onClick={() => {
        openTermHall();
        onLeave();
      }}
    >
      {TERM_LEAVE}
    </Button>
  );
}

export function SecondTerm({ onLeave }: { onLeave: () => void }) {
  const week = useStudy((s) => s.week);
  const cards = useStudy((s) => s.cards);
  const streak = useStudy((s) => s.streak);
  const setFocus = useStudy((s) => s.setFocus);
  const items = itemsForWeek(week);
  const stats = statsFor(items, cards);
  const meta = studySetMeta(week);
  const pct = stats.total ? Math.round((stats.mastered / stats.total) * 100) : 0;
  const vocab = useMemo(() => term2Vocab(), []);
  const weak = useMemo(() => weakPool(cards, vocab), [cards, vocab]);

  useEffect(() => {
    enterTermWeek(2);
  }, []);

  return (
    <>
      <LeaveSemester onLeave={onLeave} />
      <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar Path</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">{TERM_TWO_TITLE}</h1>
        <p className="mt-3 max-w-prose text-muted">{TERM_TWO_LINE}</p>
        <p className="mt-3 max-w-prose text-sm text-muted">{TERM_TWO_NOTE}</p>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Due" value={stats.due} />
        <Stat label="Weak" value={(stats.weak ?? 0) + (stats.high ?? 0)} />
        <Stat label="Mastered" value={`${stats.mastered}/${stats.total}`} />
        <Stat label="Streak" value={`${streak}d`} />
      </div>

      <div className="mt-4 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Study toolbox</p>
        <WeekSelect />
        <FocusToggle />
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted">{meta.hint}</span>
            <span className="tabular-nums text-fg">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <Link to="/drill">
            <Button className="w-full" size="lg">
              Drill this chapter
            </Button>
          </Link>
          <Link to="/quiz">
            <Button className="w-full" variant="outline" size="lg">
              Quiz
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/write" search={{ mode: "write" }}>
              <Button className="w-full" variant="outline" size="lg">
                Write
              </Button>
            </Link>
            <Link to="/write" search={{ mode: "memorize" }}>
              <Button className="w-full" variant="outline" size="lg">
                Memorize
              </Button>
            </Link>
          </div>
          <Link to="/match">
            <Button className="w-full" variant="outline" size="lg">
              Match
            </Button>
          </Link>
          <Link to="/browse">
            <Button className="w-full" variant="outline" size="lg">
              Lexicon
            </Button>
          </Link>
          <Link to="/study/term2/game">
            <Button className="w-full" variant="outline" size="lg">
              Game
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/study/term2/listen">
              <Button className="w-full" variant="outline" size="lg">
                Listen
              </Button>
            </Link>
            <Link to="/study/term2/listen/road">
              <Button className="w-full" variant="outline" size="lg">
                On the road
              </Button>
            </Link>
          </div>
          {weak.length > 0 ? (
            <Link to="/weak">
              <Button className="w-full" variant="outline" size="lg" onClick={() => setFocus("weak")}>
                Weak pool · {weak.length}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <section className="mt-4 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl font-bold text-ink">Lessons</h2>
        <p className="mt-1 text-sm text-muted">Read the note, then sit the closed-book exam. Drill the chapter’s words after that.</p>
        <ul className="mt-3 grid gap-2">
          {TERM2_LESSONS.map((lesson) => {
            const st = statsFor(itemsForWeek(weekForTerm2Chapter(lesson.chapter)), cards);
            return (
              <li key={lesson.chapter}>
                <Link
                  to="/study/term2/$chapter"
                  params={{ chapter: String(lesson.chapter) }}
                  className="block rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      Chapter {lesson.chapter} · {lesson.title}
                    </p>
                    <span className="text-xs tabular-nums text-muted">
                      {st.mastered}/{st.total}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{lesson.short}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-card px-3 py-3 shadow-[var(--shadow-border)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 font-sans text-2xl font-bold tabular-nums text-ink">{value}</p>
    </div>
  );
}
