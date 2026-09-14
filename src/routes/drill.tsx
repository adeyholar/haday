import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { WeekSelect } from "@/components/week-select";
import { itemsForWeek } from "@/lib/vocab";
import { useStudy } from "@/lib/store";
import { FocusToggle } from "@/components/focus-toggle";
import { Panel } from "@/components/panel";
import { StudyMenu } from "@/components/study-menu";
import { EtchPlay } from "@/components/etch-play";
import { buildEtchSitting, ETCH_LEN, type EtchTask } from "@/lib/etch";
import type { Rating } from "@/lib/srs";

export const Route = createFileRoute("/drill")({ component: DrillPage });

function DrillPage() {
  const week = useStudy((s) => s.week);
  const focus = useStudy((s) => s.focus);
  const rate = useStudy((s) => s.rate);
  const pool = useMemo(() => itemsForWeek(week), [week]);
  const [tasks, setTasks] = useState<EtchTask[]>([]);
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const [hits, setHits] = useState(0);
  const [seen, setSeen] = useState(0);

  function deal() {
    const sitting = buildEtchSitting(pool, useStudy.getState().cards, useStudy.getState().game);
    setTasks(sitting);
    setI(0);
    setReady(true);
    setHits(0);
    setSeen(0);
  }

  useEffect(() => {
    deal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, focus]);

  const task = tasks[i];
  const finished = ready && tasks.length > 0 && i >= tasks.length;

  function onGrade(rating: Rating) {
    if (!task) return;
    if (task.kind !== "meet") {
      rate(task.item.id, rating);
      setSeen((n) => n + 1);
      if (rating === "good" || rating === "easy") setHits((n) => n + 1);
    } else {
      rate(task.item.id, "good");
    }
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

  if (!ready) {
    return (
      <>
        <WeekSelect />
        <p className="mt-8 text-sm text-muted">Dealing a round…</p>
      </>
    );
  }

  if (finished) {
    const pct = seen ? Math.round((hits / seen) * 100) : 100;
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
            {hits} held of {seen} checks · {pct}%. Meet cards are not scored.
          </p>
          <Button type="button" className="mt-6" onClick={deal}>
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
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full bg-primary transition-[width] duration-[var(--motion-fast)]"
            style={{ width: `${tasks.length ? (i / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </Panel>
      <EtchPlay task={task} index={i} total={tasks.length || ETCH_LEN} onGrade={onGrade} />
    </>
  );
}
