import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { WeekSelect } from "@/components/week-select";
import { itemsForWeek, studySetMeta } from "@/lib/vocab";
import { snapshotOf, useStudy } from "@/lib/store";
import { FocusToggle } from "@/components/focus-toggle";
import { Panel } from "@/components/panel";
import { StudyMenu } from "@/components/study-menu";
import { EtchPlay } from "@/components/etch-play";
import { saveProgress } from "@/lib/progress";
import {
  applyDrillReviews,
  buildEtchFromIds,
  buildEtchSitting,
  drillFingerprint,
  drillGate,
  drillKey,
  drillProgress,
  drillSeed,
  queueDrillMiss,
  type DrillPlace,
  type DrillReview,
  type EtchTask,
} from "@/lib/etch";
import type { Rating } from "@/lib/srs";

export const Route = createFileRoute("/drill")({ component: DrillPage });

type Phase = "resume" | "changed" | "run" | "done";
type DrillGrade = Rating | "skip";

function DrillPage() {
  const week = useStudy((s) => s.week);
  const focus = useStudy((s) => s.focus);
  const rate = useStudy((s) => s.rate);
  const saveDrillRun = useStudy((s) => s.saveDrillRun);
  const [tasks, setTasks] = useState<EtchTask[]>([]);
  const [i, setI] = useState(0);
  const [hits, setHits] = useState(0);
  const [checks, setChecks] = useState(0);
  const [reviews, setReviews] = useState<DrillReview[]>([]);
  const [seed, setSeed] = useState(1);
  const [ids, setIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("run");
  const [offer, setOffer] = useState("");
  const [saved, setSaved] = useState(false);

  const pool = itemsForWeek(week);
  const fingerprint = drillFingerprint(pool.map((item) => item.id));
  const setLabel = studySetMeta(week).label;

  function persist(place: DrillPlace | null) {
    saveDrillRun(week, focus, place);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  function begin() {
    const nextSeed = drillSeed();
    const sitting = buildEtchSitting(pool, useStudy.getState().cards, useStudy.getState().game, Date.now(), focus, nextSeed);
    const wordIds = sitting.filter((task) => task.kind === "study" && task.back === 0).map((task) => task.item.id);
    setTasks(sitting);
    setI(0);
    setHits(0);
    setChecks(0);
    setReviews([]);
    setSeed(nextSeed);
    setIds(wordIds);
    setPhase(sitting.length ? "run" : "done");
  }

  function resume(place: DrillPlace) {
    const base = buildEtchFromIds(pool, place.ids, place.seed);
    const sitting = applyDrillReviews(base, place.reviews);
    setTasks(sitting);
    setI(Math.min(place.index, sitting.length));
    setHits(place.hits);
    setChecks(place.checks);
    setReviews(place.reviews);
    setSeed(place.seed);
    setIds(place.ids);
    setPhase(place.index >= sitting.length ? "done" : "run");
  }

  useEffect(() => {
    const place = useStudy.getState().game.drillRuns?.[drillKey(week, focus)];
    const items = itemsForWeek(week);
    const mark = drillFingerprint(items.map((item) => item.id));
    const rebuilt = place?.ids.length
      ? applyDrillReviews(buildEtchFromIds(items, place.ids, place.seed), place.reviews)
      : [];
    const gate = drillGate(place, mark, rebuilt.length);
    if (gate === "changed") {
      setPhase("changed");
      return;
    }
    if (gate === "resume" && place) {
      setOffer(drillProgress(rebuilt, place.index));
      setPhase("resume");
      return;
    }
    begin();
    // The sitting is rebuilt only when the week or the focus changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, focus]);

  useEffect(() => {
    const flush = () => {
      void saveProgress({ data: snapshotOf(useStudy.getState()) }).catch(() => {});
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  const task = tasks[i];
  const finished = phase === "run" && tasks.length > 0 && i >= tasks.length;

  function onGrade(rating: DrillGrade) {
    if (!task) return;
    const studyCard = task.kind === "study" || task.kind === "meet";
    const scored = !studyCard && task.back === 0 && rating !== "skip";
    if (studyCard && rating !== "skip") rate(task.item.id, rating === "again" ? "again" : "good");
    else if (scored) rate(task.item.id, rating);
    const nextHits = hits + (scored && rating === "good" ? 1 : 0);
    const nextChecks = checks + (scored ? 1 : 0);
    let nextTasks = tasks;
    let nextReviews = reviews;
    if ((rating === "again" || rating === "reveal") && task.back < 2) {
      const sent = queueDrillMiss(tasks, i, task);
      nextTasks = sent.tasks;
      if (sent.review) nextReviews = [...reviews, sent.review];
    }
    const nextIndex = i + 1;
    setTasks(nextTasks);
    setReviews(nextReviews);
    setHits(nextHits);
    setChecks(nextChecks);
    setI(nextIndex);
    if (nextIndex >= nextTasks.length) {
      setPhase("done");
      persist(null);
      return;
    }
    persist({
      seed,
      ids,
      index: nextIndex,
      reviews: nextReviews,
      hits: nextHits,
      checks: nextChecks,
      fingerprint,
    });
  }

  if (!pool.length) {
    return (
      <>
        <WeekSelect />
        <p className="mt-6 text-muted">No words in this set.</p>
      </>
    );
  }

  if (phase === "resume") {
    return (
      <>
        <Panel className="mb-4">
          <StudyMenu />
          <div className="mt-4">
            <WeekSelect />
          </div>
          <FocusToggle />
        </Panel>
        <div className="rounded-[var(--radius-xl)] bg-card p-6 text-center shadow-[var(--shadow-border)]">
          <h1 className="font-display text-2xl font-semibold">Continue where you stopped</h1>
          <p className="mt-2 text-muted">
            {setLabel} · {offer}
          </p>
          <div className="mt-5 grid gap-2">
            <Button
              type="button"
              onClick={() => {
                const place = useStudy.getState().game.drillRuns?.[drillKey(week, focus)];
                if (place) resume(place);
              }}
            >
              Continue
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                persist(null);
                begin();
              }}
            >
              Start over
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (phase === "changed") {
    return (
      <>
        <Panel className="mb-4">
          <WeekSelect />
          <FocusToggle />
        </Panel>
        <div className="rounded-[var(--radius-xl)] bg-card p-6 text-center shadow-[var(--shadow-border)]">
          <h1 className="font-display text-2xl font-semibold">This week's list changed</h1>
          <p className="mt-2 text-muted">The saved place no longer matches the words. Start this sitting over.</p>
          <Button
            type="button"
            className="mt-5"
            onClick={() => {
              persist(null);
              begin();
            }}
          >
            Start over
          </Button>
        </div>
      </>
    );
  }

  if (phase === "done" || finished) {
    const pct = checks ? Math.round((hits / checks) * 100) : 100;
    return (
      <>
        <Panel className="mb-4">
          <WeekSelect />
          <FocusToggle />
        </Panel>
        <div className="mt-4 rounded-[var(--radius-xl)] bg-card p-8 text-center shadow-[var(--shadow-border)]">
          <p className="he-word text-4xl text-primary">שָׁלוֹם</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">Sitting done</h1>
          <p className="mt-2 text-muted">
            {hits} held of {checks} checks · {pct}%. Study cards are not scored. A miss came back in the group.
          </p>
          <Button type="button" className="mt-6" onClick={begin}>
            New sitting
          </Button>
        </div>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <WeekSelect />
        <p className="mt-8 text-sm text-muted">Dealing a round…</p>
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
        <p className="mt-3 text-sm text-muted">
          {drillProgress(tasks, i)}. Every word is studied, then asked every way. A miss says Not quite and comes back in
          the group.
        </p>
        {saved ? <p className="mt-1 text-xs text-muted">Saved</p> : null}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full bg-primary transition-[width] duration-[var(--motion-fast)]"
            style={{ width: `${tasks.length ? (i / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </Panel>
      <EtchPlay task={task} index={i} total={tasks.length} label={drillProgress(tasks, i)} onGrade={onGrade} />
    </>
  );
}
