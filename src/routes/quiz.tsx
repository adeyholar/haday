import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { VerseCard } from "@/components/verse-card";
import { WeekSelect } from "@/components/week-select";
import { FocusToggle } from "@/components/focus-toggle";
import { glossMatches, liveGloss, quizChoices, type VocabItem } from "@/lib/vocab";
import { useStudy } from "@/lib/store";
import { pickEloDeck } from "@/lib/elo";
import { weekPlayPool } from "@/lib/tanakh-pool";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/panel";
import { StudyMenu } from "@/components/study-menu";
import { GradeBanner } from "@/components/grade-banner";
import { playGrade } from "@/lib/sfx";

export const Route = createFileRoute("/quiz")({ component: QuizPage });

type Mode = "choice" | "type";

function QuizPage() {
  const week = useStudy((s) => s.week);
  const focus = useStudy((s) => s.focus);
  const rate = useStudy((s) => s.rate);
  const pool = useMemo(() => weekPlayPool(week), [week]);
  const [mode, setMode] = useState<Mode>("choice");
  const [seed, setSeed] = useState(0);
  const [deck, setDeck] = useState<VocabItem[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [missedChoice, setMissedChoice] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [typeTries, setTypeTries] = useState(0);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const snapshot = useStudy.getState().cards;
    setDeck(pickEloDeck(pool, snapshot, 12));
    setI(0);
    setPicked(null);
    setMissedChoice(null);
    setTyped("");
    setRevealed(false);
    setTypeTries(0);
    setReady(true);
  }, [pool, seed, focus]);

  const item = deck[i];
  const choices = useMemo(() => (item ? quizChoices(item, pool) : []), [item, pool]);
  const showVerse = (mode === "choice" && picked !== null) || (mode === "type" && revealed);

  function resetRound() {
    setI(0);
    setPicked(null);
    setMissedChoice(null);
    setTyped("");
    setRevealed(false);
    setTypeTries(0);
    setScore({ right: 0, wrong: 0 });
    setSeed((s) => s + 1);
  }

  function mark(ok: boolean) {
    if (!item) return;
    rate(item.id, ok ? "good" : "again");
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1) }));
  }

  function next() {
    setPicked(null);
    setMissedChoice(null);
    setTyped("");
    setRevealed(false);
    setTypeTries(0);
    setI((n) => n + 1);
  }

  if (!pool.length) {
    return (
      <>
        <WeekSelect />
        <p className="mt-6 text-muted">No words in this set.</p>
      </>
    );
  }

  if (!ready || (deck.length > 0 && !item && i === 0)) {
    return (
      <>
        <WeekSelect />
        <p className="mt-8 text-sm text-muted">Dealing a round…</p>
      </>
    );
  }

  if (!item) {
    const total = score.right + score.wrong;
    return (
      <>
        <WeekSelect />
        <div className="mt-8 rounded-[var(--radius-xl)] bg-card p-8 text-center shadow-[var(--shadow-border)]">
          <h1 className="font-display text-3xl font-semibold">Round complete</h1>
          <p className="mt-2 font-display text-4xl tabular-nums">
            {score.right}
            <span className="text-xl text-muted"> / {total}</span>
          </p>
          <Button className="mt-6" onClick={resetRound}>
            New round
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Panel className="mb-4">
        <StudyMenu />
        <div className="mt-4">
          <WeekSelect />
        </div>
        <FocusToggle />
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant={mode === "choice" ? "primary" : "outline"} onClick={() => { setMode("choice"); resetRound(); }}>
            Multiple choice
          </Button>
          <Button size="sm" variant={mode === "type" ? "primary" : "outline"} onClick={() => { setMode("type"); resetRound(); }}>
            Type the gloss
          </Button>
        </div>
        <p className="mt-4 text-sm font-medium tabular-nums text-ink">
          {i + 1} / {deck.length} · {score.right} correct
        </p>
      </Panel>

      <div className="mt-3 rounded-[var(--radius-xl)] bg-card px-5 py-8 text-center shadow-[var(--shadow-border)]">
        <p className="he-word text-5xl">{item.hebrew}</p>
        <p className="mt-2 text-sm text-muted">{item.translit}</p>
      </div>

      {mode === "choice" ? (
        <>
        <ul className="mt-4 grid gap-2">
          {choices.map((c) => {
            const selected = picked === c;
            const correct = c === item.gloss;
            const show = picked !== null;
            const firstMiss = missedChoice === c;
            return (
              <li key={c}>
                <button
                  type="button"
                  disabled={picked !== null || firstMiss}
                  onClick={() => {
                    if (c === item.gloss) {
                      setPicked(c);
                      mark(true);
                      playGrade(true);
                      return;
                    }
                    if (!missedChoice) {
                      setMissedChoice(c);
                      playGrade(false);
                      return;
                    }
                    setPicked(c);
                    mark(false);
                    playGrade(false);
                  }}
                  className={cn(
                    "w-full min-h-12 rounded-[var(--radius-md)] px-4 py-3 text-left text-sm font-medium shadow-[var(--shadow-border)]",
                    !show && !firstMiss && "bg-card hover:bg-surface",
                    firstMiss && "bg-danger text-parchment",
                    show && correct && "bg-good text-parchment",
                    show && selected && !correct && "bg-danger text-parchment",
                    show && !selected && !correct && !firstMiss && "bg-card text-muted",
                  )}
                >
                  {c}
                </button>
              </li>
            );
          })}
        </ul>
        {missedChoice && !picked && (
          <>
            <GradeBanner className="mt-4" ok={false} />
            <p className="try-flash mt-2 text-center text-lg font-bold uppercase tracking-wide text-danger">
              One more try
            </p>
          </>
        )}
        {picked && (
          <GradeBanner className="mt-4" ok={picked === item.gloss} />
        )}
        </>
      ) : (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (revealed) {
              next();
              return;
            }
            const ok = glossMatches(item, typed);
            playGrade(ok);
            if (ok) {
              setRevealed(true);
              mark(true);
              return;
            }
            if (typeTries < 1) {
              setTypeTries(1);
              return;
            }
            setRevealed(true);
            mark(false);
          }}
        >
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={revealed}
            placeholder="English gloss"
            className={cn(
              "h-12 w-full rounded-[var(--radius-md)] bg-card px-4 shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !revealed && liveGloss(item, typed) === "exact" && "ring-2 ring-good",
              !revealed && liveGloss(item, typed) === "off" && "ring-2 ring-danger",
            )}
            autoCapitalize="off"
            autoCorrect="off"
          />
          {!revealed && (liveGloss(item, typed) === "exact" || liveGloss(item, typed) === "off") && (
            <GradeBanner
              className="mt-3"
              size="live"
              ok={liveGloss(item, typed) === "exact"}
            />
          )}
          {!revealed && liveGloss(item, typed) === "prefix" && (
            <p className="mt-2 text-center text-sm font-medium text-muted">Keep going.</p>
          )}
          {!revealed && liveGloss(item, typed) === "empty" && (
            <p className="mt-2 text-center text-sm font-medium text-muted">Type the English gloss.</p>
          )}
          {typeTries >= 1 && !revealed && (
            <p className="try-flash mt-2 text-center text-lg font-bold uppercase tracking-wide text-danger">
              One more try
            </p>
          )}
          {revealed && (
            <div className="mt-3">
              <GradeBanner ok={glossMatches(item, typed)} />
              <p className="mt-2 text-center text-sm text-muted">BBH: {item.gloss}</p>
            </div>
          )}
          <Button className="mt-3 w-full" type="submit">
            {revealed ? "Next" : typeTries >= 1 ? "Check retry" : "Check"}
          </Button>
        </form>
      )}

      {showVerse && <VerseCard item={item} />}

      {mode === "choice" && picked && (
        <Button className="mt-4 w-full" onClick={next}>
          Next
        </Button>
      )}
    </>
  );
}
