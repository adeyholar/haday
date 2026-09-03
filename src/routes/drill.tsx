import { useEffect, useMemo, useReducer } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { WeekSelect } from "@/components/week-select";
import { POS_LABEL, itemsForWeek } from "@/lib/vocab";
import { useStudy } from "@/lib/store";
import { applyDrillGrade, buildRound, currentItem, isRoundFinished, type DrillRound } from "@/lib/drill-round";
import { VerseCard } from "@/components/verse-card";
import { FocusToggle } from "@/components/focus-toggle";
import { Panel } from "@/components/panel";
import { StudyMenu } from "@/components/study-menu";
import type { Rating } from "@/lib/srs";

export const Route = createFileRoute("/drill")({ component: DrillPage });

type Ui = {
  round: DrillRound;
  flipped: boolean;
  ready: boolean;
};

type Action =
  | { type: "deal"; items: DrillRound["items"] }
  | { type: "flip" }
  | { type: "grade"; rating: Rating };

function reducer(state: Ui, action: Action): Ui {
  switch (action.type) {
    case "deal":
      return {
        ready: true,
        flipped: false,
        round: { items: action.items, pos: 0, done: [] },
      };
    case "flip":
      return { ...state, flipped: true };
    case "grade":
      return {
        ...state,
        flipped: false,
        round: applyDrillGrade(state.round, action.rating),
      };
    default:
      return state;
  }
}

function DrillPage() {
  const week = useStudy((s) => s.week);
  const direction = useStudy((s) => s.direction);
  const setDirection = useStudy((s) => s.setDirection);
  const focus = useStudy((s) => s.focus);
  const rate = useStudy((s) => s.rate);
  const pool = useMemo(() => itemsForWeek(week), [week]);
  const [ui, dispatch] = useReducer(reducer, {
    ready: false,
    flipped: false,
    round: { items: [], pos: 0, done: [] },
  });

  function deal() {
    const items = buildRound(pool, useStudy.getState().cards, focus, 18);
    dispatch({ type: "deal", items });
  }

  useEffect(() => {
    deal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, focus]);

  const current = currentItem(ui.round);
  const finished = ui.ready && isRoundFinished(ui.round);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        dispatch({ type: "flip" });
      }
      if (!ui.flipped || !current) return;
      if (e.key === "1") grade("again");
      if (e.key === "2") grade("good");
      if (e.key === "3") grade("easy");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ui.flipped, current?.id]);

  function grade(rating: Rating) {
    if (!current) return;
    rate(current.id, rating);
    dispatch({ type: "grade", rating });
  }

  if (!pool.length) {
    return (
      <>
        <WeekSelect />
        <p className="mt-6 text-muted">No words in this set.</p>
      </>
    );
  }

  if (!ui.ready) {
    return (
      <>
        <WeekSelect />
        <p className="mt-8 text-sm text-muted">Dealing a round…</p>
      </>
    );
  }

  if (finished) {
    return (
      <>
        <Panel className="mb-4">
          <WeekSelect />
          <FocusToggle />
        </Panel>
        <div className="mt-4 rounded-[var(--radius-xl)] bg-card p-8 text-center shadow-[var(--shadow-border)]">
          <p className="he-word text-4xl text-primary">שָׁלוֹם</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">Caught up</h1>
          <p className="mt-2 text-muted">You finished this round. Start another, or quiz the weak list.</p>
          <Button type="button" className="mt-6" onClick={deal}>
            New round
          </Button>
        </div>
      </>
    );
  }

  if (!current) {
    return (
      <>
        <WeekSelect />
        <p className="mt-8 text-sm text-muted">Dealing a round…</p>
      </>
    );
  }

  const frontHe = direction === "he-en";
  const total = ui.round.items.length;
  const cleared = ui.round.done.length;

  return (
    <>
      <Panel className="mb-4">
        <StudyMenu />
        <div className="mt-4">
          <WeekSelect />
        </div>
        <FocusToggle />
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="tabular-nums font-medium text-ink">
            {Math.min(cleared + 1, total)} / {total}
          </span>
          <button
            type="button"
            className="min-h-11 text-sm font-semibold text-primary"
            onClick={() => setDirection(frontHe ? "en-he" : "he-en")}
          >
            {frontHe ? "Hebrew → English" : "English → Hebrew"}
          </button>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full bg-primary transition-[width] duration-[var(--motion-fast)]"
            style={{ width: `${total ? (cleared / total) * 100 : 0}%` }}
          />
        </div>
      </Panel>

      <button
        type="button"
        onClick={() => dispatch({ type: "flip" })}
        className="block w-full rounded-[var(--radius-xl)] bg-card px-5 py-12 text-center shadow-[var(--shadow-border)] transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)] active:scale-[0.99]"
      >
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {POS_LABEL[current.pos]} · Ch. {current.chapter}
        </p>
        {!ui.flipped ? (
          frontHe ? (
            <p className="he-word mt-4 text-5xl sm:text-6xl">{current.hebrew}</p>
          ) : (
            <p className="mt-4 font-display text-3xl font-semibold">{current.gloss}</p>
          )
        ) : (
          <div className="mt-4">
            <p className="he-word text-5xl sm:text-6xl">{current.hebrew}</p>
            <p className="mt-3 font-display text-2xl font-semibold">{current.gloss}</p>
            <p className="mt-1 text-sm text-muted">{current.translit}</p>
          </div>
        )}
        {!ui.flipped && <p className="mt-8 text-sm text-subtle">Tap to reveal · Space</p>}
      </button>

      <VerseCard item={current} showEnglish={ui.flipped} />

      {ui.flipped && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button type="button" variant="danger" onClick={() => grade("again")}>
            Again
            <span className="text-xs opacity-70">1</span>
          </Button>
          <Button type="button" variant="outline" onClick={() => grade("good")}>
            Good
            <span className="text-xs opacity-70">2</span>
          </Button>
          <Button type="button" variant="primary" onClick={() => grade("easy")}>
            Easy
            <span className="text-xs opacity-70">3</span>
          </Button>
        </div>
      )}
      <p className="mt-3 text-center text-xs text-subtle">Keys 1 / 2 / 3 after flip</p>
    </>
  );
}
