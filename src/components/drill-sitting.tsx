import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EtchPlay } from "@/components/etch-play";
import { Panel } from "@/components/panel";
import { snapshotOf, statsFor, useStudy } from "@/lib/store";
import { saveProgress } from "@/lib/progress";
import {
  applyDrillReviews,
  buildEtchFromIds,
  buildEtchSitting,
  drillFingerprint,
  drillGate,
  drillProgress,
  drillDistance,
  vocabDistance,
  drillSeed,
  queueDrillMiss,
  type DrillPlace,
  type DrillReview,
  type EtchTask,
} from "@/lib/etch";
import type { VocabItem } from "@/lib/vocab";
import type { Rating } from "@/lib/srs";

type Phase = "resume" | "changed" | "run" | "done";
type DrillGrade = Rating | "skip";

/**
 * The Grammar Path drill, pointed at any word list.
 * Study the word, then ask it every way. A miss comes back in the group.
 */
export function DrillSitting({
  pool,
  label,
  readPlace,
  writePlace,
  chrome,
}: {
  pool: VocabItem[];
  label: string;
  readPlace: () => DrillPlace | undefined;
  writePlace: (place: DrillPlace | null) => void;
  chrome?: ReactNode;
}) {
  const focus = useStudy((s) => s.focus);
  const cards = useStudy((s) => s.cards);
  const rate = useStudy((s) => s.rate);
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
  const fingerprint = drillFingerprint(pool.map((item) => item.id));
  const prepared = useRef<EtchTask[]>([]);
  const watch = `${fingerprint}:${focus}`;

  function persist(place: DrillPlace | null) {
    writePlace(place);
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
    const sitting = prepared.current.length
      ? prepared.current
      : applyDrillReviews(buildEtchFromIds(pool, place.ids, place.seed), place.reviews);
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
    const place = readPlace();
    const rebuilt = place?.ids.length
      ? applyDrillReviews(buildEtchFromIds(pool, place.ids, place.seed), place.reviews)
      : [];
    const gate = drillGate(place, fingerprint, rebuilt.length);
    if (gate === "changed") {
      setPhase("changed");
      return;
    }
    if (gate === "resume" && place) {
      prepared.current = rebuilt;
      setOffer(drillProgress(rebuilt, place.index));
      setPhase("resume");
      return;
    }
    prepared.current = [];
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
    // Rebuild only when the word list or the focus changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden") {
        void saveProgress({ data: snapshotOf(useStudy.getState()) }).catch(() => {});
      }
    };
    const onHide = () => {
      void saveProgress({ data: snapshotOf(useStudy.getState()) }).catch(() => {});
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  const task = tasks[i];
  const finished = phase === "run" && tasks.length > 0 && i >= tasks.length;
  const words = statsFor(pool, cards);
  const vocab = vocabDistance(words.seen, words.mastered, words.total);
  const sittingTasks = phase === "resume" && prepared.current.length ? prepared.current : tasks;
  const sittingIndex = phase === "resume" ? (readPlace()?.index ?? 0) : i;
  const drill = drillDistance(sittingIndex, sittingTasks.length);

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
        {chrome}
        <p className="mt-6 text-muted">No words in this set.</p>
      </>
    );
  }

  if (phase === "resume") {
    return (
      <>
        {chrome ? <Panel className="mb-4">{chrome}</Panel> : null}
        <div className="rounded-[var(--radius-xl)] bg-card p-6 text-center shadow-[var(--shadow-border)]">
          <h1 className="font-display text-2xl font-semibold">Continue where you stopped</h1>
          <p className="mt-2 text-muted">
            {label} · {offer}
          </p>
          <DrillMeters drill={drill} vocab={vocab} />
          <div className="mt-5 grid gap-2">
            <Button
              type="button"
              onClick={() => {
                const place = readPlace();
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
        {chrome ? <Panel className="mb-4">{chrome}</Panel> : null}
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
        {chrome ? <Panel className="mb-4">{chrome}</Panel> : null}
        <div className="mt-4 rounded-[var(--radius-xl)] bg-card p-8 text-center shadow-[var(--shadow-border)]">
          <p className="he-word text-4xl text-primary">שָׁלוֹם</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">Sitting done</h1>
          <p className="mt-2 text-muted">
            {hits} held of {checks} checks · {pct}%. Study cards are not scored. A miss came back in the group.
          </p>
          <DrillMeters drill={drillDistance(tasks.length, tasks.length)} vocab={vocab} />
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
        {chrome}
        <p className="mt-8 text-sm text-muted">Dealing a round…</p>
      </>
    );
  }

  return (
    <>
      <Panel className="mb-4">
        {chrome}
        <p className="mt-3 text-sm text-muted">
          {drillProgress(tasks, i)}. Every word is studied, then asked every way. A miss says Not quite and comes back in
          the group.
        </p>
        {saved ? <p className="mt-1 text-xs text-muted">Saved</p> : null}
        <DrillMeters drill={drill} vocab={vocab} />
      </Panel>
      <EtchPlay
        key={task.key}
        task={task}
        pool={pool}
        seed={seed}
        index={i}
        total={tasks.length}
        label={drillProgress(tasks, i)}
        onGrade={onGrade}
      />
    </>
  );
}

function DrillMeters({
  drill,
  vocab,
}: {
  drill: { done: number; total: number; left: number; pct: number };
  vocab: { met: number; mastered: number; total: number; left: number; pct: number };
}) {
  return (
    <div className="mt-3 grid gap-3 text-left">
      <Meter title="This drill" pct={drill.pct} line={`${drill.done} of ${drill.total} cards · ${drill.left} left`} />
      <Meter
        title="These words"
        pct={vocab.pct}
        line={`${vocab.mastered} of ${vocab.total} mastered · ${vocab.left} still to learn · ${vocab.met} met`}
      />
    </div>
  );
}

function Meter({ title, pct, line }: { title: string; pct: number; line: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">{title}</span>
        <span className="tabular-nums text-muted">{pct}%</span>
      </div>
      <p className="text-sm text-muted">{line}</p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={title}>
        <div className="h-full bg-primary transition-[width] duration-[var(--motion-fast)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
