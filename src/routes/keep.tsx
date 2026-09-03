import { useEffect, useReducer } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/panel";
import { VerseCard } from "@/components/verse-card";
import { POS_LABEL } from "@/lib/vocab";
import { useStudy } from "@/lib/store";
import { applyDrillGrade, currentItem, isRoundFinished, type DrillRound } from "@/lib/drill-round";
import { keepDoneToday, keepStats, pickKeepRound, type KeepCard } from "@/lib/keep";
import type { Rating } from "@/lib/srs";

export const Route = createFileRoute("/keep")({ component: KeepPage });

type Ui = {
  round: DrillRound;
  flipped: boolean;
  ready: boolean;
  faces: Record<string, KeepCard["face"]>;
  why: Record<string, KeepCard["why"]>;
};

type Action =
  | { type: "deal"; items: KeepCard[] }
  | { type: "flip" }
  | { type: "grade"; rating: Rating };

function reducer(state: Ui, action: Action): Ui {
  switch (action.type) {
    case "deal":
      return {
        ready: true,
        flipped: false,
        round: { items: action.items, pos: 0, done: [] },
        faces: Object.fromEntries(action.items.map((x) => [x.id, x.face])),
        why: Object.fromEntries(action.items.map((x) => [x.id, x.why])),
      };
    case "flip":
      return { ...state, flipped: true };
    case "grade":
      return { ...state, flipped: false, round: applyDrillGrade(state.round, action.rating) };
    default:
      return state;
  }
}

function KeepPage() {
  const rate = useStudy((s) => s.rate);
  const finishKeep = useStudy((s) => s.finishKeep);
  const cards = useStudy((s) => s.cards);
  const lastKeepDay = useStudy((s) => s.lastKeepDay);
  const keepStreak = useStudy((s) => s.keepStreak);
  const game = useStudy((s) => s.game);
  const stats = keepStats(cards, game);
  const already = keepDoneToday(lastKeepDay);
  const [ui, dispatch] = useReducer(reducer, {
    ready: false,
    flipped: false,
    round: { items: [], pos: 0, done: [] },
    faces: {},
    why: {},
  });

  function deal() {
    dispatch({ type: "deal", items: pickKeepRound(useStudy.getState().cards, useStudy.getState().game, 12) });
  }

  useEffect(() => {
    deal();
  }, []);

  const current = currentItem(ui.round);
  const finished = ui.ready && isRoundFinished(ui.round);

  useEffect(() => {
    if (finished && ui.round.items.length) finishKeep();
  }, [finished, ui.round.items.length, finishKeep]);

  function grade(rating: Rating) {
    if (!current) return;
    rate(current.id, rating);
    dispatch({ type: "grade", rating });
  }

  if (!stats.seen) {
    return (
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">זָכוֹר · Zakhor</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Daily keep</h1>
        <p className="mt-3 text-muted">
          This round only uses lemmas you have already recalled correctly — from Game chapters you have opened, not new vocabulary.
        </p>
        <p className="mt-3 text-sm text-muted">Play a Game stage or Drill first. Then Keep has a storehouse to draw from.</p>
        <Link to="/game" className="mt-4 inline-block">
          <Button>Open Game</Button>
        </Link>
      </Panel>
    );
  }

  if (finished) {
    return (
      <Panel className="text-center">
        <p className="he-word text-4xl text-primary">זָכוֹר</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">Kept for today</h1>
        <p className="mt-2 text-muted">
          {keepStreak}-day keep streak. Tomorrow another mix of old and due words.
        </p>
        <Button className="mt-6" onClick={deal}>
          Extra round
        </Button>
      </Panel>
    );
  }

  if (!current) {
    return (
      <Panel>
        <p className="text-sm text-muted">Dealing keep…</p>
      </Panel>
    );
  }

  const face = ui.faces[current.id] ?? "he-en";
  const why = ui.why[current.id];
  const total = ui.round.items.length;
  const cleared = ui.round.done.length;
  const whyLabel = why === "cool" ? "Cooling — old lemma" : why === "weak" ? "Needs work" : "Due today";

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">זָכוֹר · Zakhor</p>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h1 className="font-display text-3xl font-bold text-ink">Daily keep</h1>
          <span className="text-sm tabular-nums text-muted">
            {Math.min(cleared + 1, total)} / {total}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {stats.mastered} mastered · {stats.cooling} cooling · {stats.due} due
          {already ? " · extra round" : ""}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full bg-primary"
            style={{ width: `${total ? (cleared / total) * 100 : 0}%` }}
          />
        </div>
      </Panel>

      <button
        type="button"
        onClick={() => dispatch({ type: "flip" })}
        className="block w-full rounded-[var(--radius-xl)] bg-card px-5 py-12 text-center shadow-[var(--shadow-border)]"
      >
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {POS_LABEL[current.pos]} · Ch. {current.chapter} · {whyLabel}
        </p>
        {!ui.flipped ? (
          face === "he-en" ? (
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
        {!ui.flipped && (
          <p className="mt-8 text-sm text-subtle">
            {face === "he-en" ? "Recall the English" : "Recall the Hebrew"} · tap
          </p>
        )}
      </button>

      {ui.flipped && <VerseCard item={current} showEnglish />}

      {ui.flipped && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button type="button" variant="danger" onClick={() => grade("again")}>
            Again
          </Button>
          <Button type="button" variant="outline" onClick={() => grade("good")}>
            Good
          </Button>
          <Button type="button" variant="primary" onClick={() => grade("easy")}>
            Easy
          </Button>
        </div>
      )}
    </>
  );
}
