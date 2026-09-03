import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { HebrewType } from "@/components/hebrew-type";
import { Panel } from "@/components/panel";
import { VerseCard } from "@/components/verse-card";
import { cn } from "@/lib/cn";
import { GradeBanner } from "@/components/grade-banner";
import { NewBadges } from "@/components/rewards-bar";
import { playGrade } from "@/lib/sfx";
import {
  CHAPTER_META,
  GAME_STAGE_PASS,
  GAME_STAGES,
  chapterPlayPool,
  chapterRecord,
  continueTarget,
  runOrdinal,
  starsForRate,
  stageMeta,
  type GameStageId,
} from "@/lib/game";
import { liveMatchAny } from "@/lib/hebrew";
import { verseFor } from "@/lib/verses";
import { scoreboard } from "@/lib/rewards";
import { useStudy } from "@/lib/store";
import { glossMatches, liveGloss, quizChoices, type VocabItem } from "@/lib/vocab";

function spellTargets(item: VocabItem, stage: GameStageId): { target: string; alts: string[] } {
  const alts = [...(item.hebrewAlts ?? [])];
  if (stage === "spell-lenient") {
    const hit = verseFor(item.id)?.hit;
    if (hit && hit !== item.hebrew && !alts.includes(hit)) alts.push(hit);
  }
  return { target: item.hebrew, alts };
}

function shuffleCopy(items: VocabItem[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props = {
  chapter: number;
  stage: GameStageId;
};

type Phase = "play" | "done";

export function GameStagePlay({ chapter, stage }: Props) {
  const navigate = useNavigate();
  const completeGameStage = useStudy((s) => s.completeGameStage);
  const rate = useStudy((s) => s.rate);
  const game = useStudy((s) => s.game);
  const streak = useStudy((s) => s.streak);
  const [deal, setDeal] = useState(0);
  const pool = useMemo(() => chapterPlayPool(chapter, stage), [chapter, stage, deal]);
  const [queue, setQueue] = useState<VocabItem[]>(() => shuffleCopy(pool));
  const [total, setTotal] = useState(pool.length);
  const [picked, setPicked] = useState<string | null>(null);
  const [missedChoice, setMissedChoice] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [tries, setTries] = useState(0);
  const [firstHits, setFirstHits] = useState(0);
  const [firstSeen, setFirstSeen] = useState(0);
  const [phase, setPhase] = useState<Phase>("play");
  const [stars, setStars] = useState(1);

  useEffect(() => {
    setQueue(shuffleCopy(pool));
    setTotal(pool.length);
    setPicked(null);
    setMissedChoice(null);
    setTyped("");
    setRevealed(false);
    setTries(0);
    setFirstHits(0);
    setFirstSeen(0);
    setPhase("play");
    setStars(1);
  }, [chapter, stage, pool]);

  const item = queue[0];
  const spell = item ? spellTargets(item, stage) : { target: "", alts: [] as string[] };
  const typedOk =
    !item
      ? false
      : stage === "gloss"
        ? glossMatches(item, typed)
        : liveMatchAny(spell.target, typed, spell.alts, true) === "exact";
  const choices = useMemo(() => (item ? quizChoices(item, pool) : []), [item, pool]);
  const meta = stageMeta(stage);
  const chapterMeta = CHAPTER_META[chapter];
  const doneCount = total - queue.length;
  const showEnglish = Boolean(picked || revealed);

  function finishIfEmpty(nextQueue: VocabItem[], nextFirstHits: number, nextFirstSeen: number) {
    if (nextQueue.length > 0) return;
    const rateValue = nextFirstSeen ? nextFirstHits / nextFirstSeen : 1;
    const earned = starsForRate(rateValue);
    const score = Math.round(rateValue * 100);
    setStars(earned);
    setPhase("done");
    completeGameStage(chapter, stage, { stars: earned, score, firstTryRate: rateValue });
  }

  function succeed(firstTry: boolean) {
    if (!item) return;
    rate(item.id, firstTry ? "easy" : "good");
    const nextHits = firstHits + (firstTry ? 1 : 0);
    const nextSeen = firstSeen + 1;
    setFirstHits(nextHits);
    setFirstSeen(nextSeen);
    const nextQueue = queue.slice(1);
    setQueue(nextQueue);
    resetItem();
    finishIfEmpty(nextQueue, nextHits, nextSeen);
  }

  function failAndRecycle() {
    if (!item) return;
    rate(item.id, "again");
    const nextSeen = firstSeen + 1;
    setFirstSeen(nextSeen);
    const rest = queue.slice(1);
    const insertAt = rest.length ? Math.floor(Math.random() * (rest.length + 1)) : 0;
    const nextQueue = [...rest.slice(0, insertAt), item, ...rest.slice(insertAt)];
    setQueue(nextQueue);
    resetItem();
    finishIfEmpty(nextQueue, firstHits, nextSeen);
  }

  function replayStage() {
    setDeal((n) => n + 1);
  }

  function resetItem() {
    setPicked(null);
    setMissedChoice(null);
    setTyped("");
    setRevealed(false);
    setTries(0);
  }

  function checkTyped(ok: boolean) {
    playGrade(ok);
    if (ok) {
      setRevealed(true);
      setPicked("ok");
      return;
    }
    if (tries < 1) {
      setTries(1);
      return;
    }
    setRevealed(true);
    setPicked("miss");
  }

  function advanceAfterReveal() {
    if (!item) return;
    if (stage === "recognize") {
      if (picked === item.gloss) succeed(!missedChoice);
      else failAndRecycle();
      return;
    }
    if (picked === "ok") {
      succeed(tries === 0);
      return;
    }
    failAndRecycle();
  }

  if (!pool.length) {
    return (
      <Panel>
        <p className="text-muted">No words in this chapter yet.</p>
        <Link to="/game" className="mt-4 inline-block text-sm font-medium text-primary">
          Back to map
        </Link>
      </Panel>
    );
  }

  if (phase === "done") {
    const idx = GAME_STAGES.findIndex((s) => s.id === stage);
    const nextStage = GAME_STAGES[idx + 1];
    const next = continueTarget(game);
    const chapterCleared = Boolean(game.chapters[String(chapter)]?.cleared);
    const board = scoreboard(game, streak);
    const rec = chapterRecord(game, chapter).stages[stage];
    const run = rec.attempts || 1;
    const pct = Math.round((firstSeen ? firstHits / firstSeen : 1) * 100);
    const passed = pct >= GAME_STAGE_PASS;
    return (
      <Panel className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Chapter {chapter} · {meta.name}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          {passed ? "Stage cleared" : `Need ${GAME_STAGE_PASS}% to clear`}
        </h1>
        <p className="mt-3 text-3xl tracking-widest text-primary" aria-label={`${stars} stars`}>
          {"★".repeat(stars)}
          <span className="text-border">{"★".repeat(3 - stars)}</span>
        </p>
        <p className="mt-3 font-display text-2xl font-bold capitalize text-ink">{runOrdinal(run)} run</p>
        <p className="mt-2 text-sm text-muted">
          {pct}% this round · {firstHits}/{firstSeen} clean on first answer
          {rec.best ? ` · best ${rec.best}%` : ""}
        </p>
        <p className="mt-1 text-sm text-muted">
          Level {board.level} · {board.points.toLocaleString()} pts
        </p>
        {chapterCleared && (
          <p className="mt-3 text-sm font-medium text-good">
            Chapter {chapter} cleared
            {chapter < 19 ? ` · Chapter ${chapter + 1} unlocked` : " · path complete"}
          </p>
        )}
        {!passed && (
          <p className="mt-3 text-sm text-muted">
            First-answer score must be {GAME_STAGE_PASS}% or better to open the next stage.
          </p>
        )}
        <NewBadges ids={game.justEarned ?? []} />
        <div className="mt-6 flex flex-col gap-2">
          {passed && nextStage && !chapterCleared ? (
            <Link to="/game/$chapter/$stage" params={{ chapter: String(chapter), stage: nextStage.id }}>
              <Button className="w-full" size="lg">
                Continue · {nextStage.name}
              </Button>
            </Link>
          ) : passed ? (
            <Link
              to="/game/$chapter/$stage"
              params={{ chapter: String(next.chapter), stage: next.stage }}
            >
              <Button className="w-full" size="lg">
                Continue · Chapter {next.chapter} · {stageMeta(next.stage).name}
              </Button>
            </Link>
          ) : (
            <Button className="w-full" size="lg" onClick={replayStage}>
              Try again
            </Button>
          )}
          <Link to="/game">
            <Button className="w-full" variant="outline">
              Chapter map
            </Button>
          </Link>
          {passed && (
            <Button className="w-full" variant="outline" onClick={replayStage}>
              New round
            </Button>
          )}
        </div>
      </Panel>
    );
  }

  if (!item) {
    return (
      <Panel>
        <p className="text-sm text-muted">Preparing…</p>
      </Panel>
    );
  }

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Chapter {chapter}
          {chapterMeta ? ` · ${chapterMeta.title}` : ""}
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-ink">{meta.name}</h1>
          <span className="text-sm tabular-nums text-muted">
            {Math.min(doneCount + 1, total)} / {total}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">{meta.prompt}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-[var(--motion-fast)]"
            style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
          />
        </div>
      </Panel>

      <div className="rounded-[var(--radius-xl)] bg-card px-5 py-8 text-center shadow-[var(--shadow-border)]">
        {stage === "recognize" || stage === "gloss" ? (
          <>
            <p className="he-word text-5xl">{item.hebrew}</p>
            <p className="mt-2 text-sm text-muted">{item.translit}</p>
            {item.id.startsWith("tv:") && (
              <p className="mt-1 text-xs text-muted">Tanakh form · lemma <span className="he-word text-base text-ink">{item.hebrewAlts?.[0]}</span></p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">English</p>
            <p className="mt-1 font-display text-3xl font-semibold text-ink">{item.gloss}</p>
            {revealed && <p className="he-word mt-3 text-4xl">{item.hebrew}</p>}
          </>
        )}
      </div>

      {(stage !== "spell-strict" || revealed) && (
        <VerseCard item={item} showEnglish={showEnglish} />
      )}

      {stage === "recognize" ? (
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
                        playGrade(true);
                        return;
                      }
                      if (!missedChoice) {
                        setMissedChoice(c);
                        setTries(1);
                        playGrade(false);
                        return;
                      }
                      setPicked(c);
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
            <>
              <GradeBanner className="mt-4" ok={picked === item.gloss} />
              <Button className="mt-4 w-full" onClick={advanceAfterReveal}>
                Next
              </Button>
            </>
          )}
        </>
      ) : stage === "gloss" ? (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (revealed) {
              advanceAfterReveal();
              return;
            }
            checkTyped(typedOk);
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
            <GradeBanner className="mt-3" size="live" ok={liveGloss(item, typed) === "exact"} />
          )}
          {!revealed && liveGloss(item, typed) === "prefix" && (
            <p className="mt-2 text-center text-sm font-medium text-muted">Keep going.</p>
          )}
          {!revealed && liveGloss(item, typed) === "empty" && (
            <p className="mt-2 text-center text-sm font-medium text-muted">Type the English gloss — no list.</p>
          )}
          {tries >= 1 && !revealed && (
            <p className="try-flash mt-2 text-center text-lg font-bold uppercase tracking-wide text-danger">
              One more try
            </p>
          )}
          {revealed && (
            <div className="mt-3">
              <GradeBanner ok={typedOk} />
              <p className="mt-2 text-center text-sm text-muted">BBH: {item.gloss}</p>
            </div>
          )}
          <Button className="mt-3 w-full" type="submit">
            {revealed ? "Next" : tries >= 1 ? "Check retry" : "Check"}
          </Button>
        </form>
      ) : (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (revealed) {
              advanceAfterReveal();
              return;
            }
            checkTyped(typedOk);
          }}
        >
          <HebrewType
            value={typed}
            onChange={setTyped}
            target={spell.target}
            alts={spell.alts}
            disabled={revealed}
            strict
          />
          {tries >= 1 && !revealed && (
            <p className="try-flash mt-3 text-center text-lg font-bold uppercase tracking-wide text-danger">
              One more try
            </p>
          )}
          {revealed && (
            <div className="mt-3">
              <GradeBanner ok={typedOk} />
              {!typedOk && (
                <p className="mt-2 text-center text-sm text-muted">
                  Answer: <span className="he-word text-xl text-ink">{item.hebrew}</span>
                </p>
              )}
              {typedOk && spell.alts.some((a) => a !== item.hebrew) && (
                <p className="mt-2 text-center text-sm text-muted">
                  Lemma <span className="he-word text-lg text-ink">{item.hebrew}</span>
                  {verseFor(item.id)?.hit && verseFor(item.id)!.hit !== item.hebrew ? (
                    <>
                      {" "}
                      · this verse <span className="he-word text-lg text-ink">{verseFor(item.id)!.hit}</span>
                    </>
                  ) : null}
                </p>
              )}
            </div>
          )}
          <Button className="mt-3 w-full" type="submit" disabled={!revealed && !typed.trim()}>
            {revealed ? "Next" : tries >= 1 ? "Check retry" : "Check"}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center">
        <button
          type="button"
          className="min-h-11 text-sm font-medium text-muted"
          onClick={() => navigate({ to: "/game/$chapter", params: { chapter: String(chapter) } })}
        >
          Back to chapter
        </button>
      </p>
    </>
  );
}
