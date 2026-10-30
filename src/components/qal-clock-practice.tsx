import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HebrewType } from "@/components/hebrew-type";
import { ScreenChoices } from "@/components/screen-lamp";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  CLOCK_LABEL,
  CLOCK_NOTE,
  CLOCKS,
  PRACTICE_ROUNDS,
  answerSitting,
  clockCards,
  gradeClock,
  sittingFrom,
  type Clock,
  type ClockCard,
  type PracticeOrder,
  type Sitting,
} from "@/lib/qal-clocks";
import { CLASS_LABEL, ROOTS, type RootClass } from "@/lib/verbal-system";

type Filter = "all" | Clock;

const ROOT_GROUPS: { cls: RootClass; roots: (typeof ROOTS)[number][] }[] = [];
for (const root of ROOTS) {
  const last = ROOT_GROUPS[ROOT_GROUPS.length - 1];
  if (!last || last.cls !== root.cls) ROOT_GROUPS.push({ cls: root.cls, roots: [root] });
  else last.roots.push(root);
}

function shuffle(cards: ClockCard[]): ClockCard[] {
  const out = cards.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const hold = out[i];
    out[i] = out[j];
    out[j] = hold;
  }
  return out;
}

export function QalClockPractice() {
  const deck = useMemo(() => clockCards(), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [order, setOrder] = useState<PracticeOrder>("pgn");
  const [rootId, setRootId] = useState<string | null>(null);
  const [sitting, setSitting] = useState<Sitting | null>(null);
  const [typed, setTyped] = useState("");
  const [strict, setStrict] = useState(true);
  const [graded, setGraded] = useState<{ ok: boolean; lenient: boolean; tag: "" | "stress" } | null>(null);

  const card = sitting?.queue[0];

  function begin(nextRoot: string, nextFilter: Filter, nextOrder: PracticeOrder) {
    const cards = deck.filter((item) => item.rootId === nextRoot && (nextFilter === "all" || item.clock === nextFilter));
    setRootId(nextRoot);
    setSitting(sittingFrom(nextOrder === "pgn" ? cards : shuffle(cards), nextOrder));
    setTyped("");
    setGraded(null);
  }

  function check() {
    if (!card || graded) return;
    setGraded(gradeClock(card.form, typed, strict));
  }

  function next() {
    if (!sitting || !graded) return;
    setSitting(answerSitting(sitting, graded.ok));
    setTyped("");
    setGraded(null);
  }

  return (
    <div className="grid gap-4">
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Qal · practice</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-ink">Yiqtol, wayyiqtol, weqatal</h2>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Pick a root. Three rounds of its forms. Each tap says whether that part is still right. A miss comes back in the same round. This practice is not the graded test.
        </p>
        <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Clock">
          {(
            [
              ["all", "All three"],
              ...CLOCKS.map((id) => [id, CLOCK_LABEL[id]] as const),
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={filter === id}
              onClick={() => {
                setFilter(id);
                if (rootId) begin(rootId, id, order);
              }}
              className={cn(
                "min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
                filter === id ? "bg-primary text-primary-foreground" : "bg-card text-muted shadow-[var(--shadow-border)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Order">
          {(
            [
              ["pgn", "Person order"],
              ["mixed", "Mixed"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={order === id}
              onClick={() => {
                setOrder(id);
                if (rootId) begin(rootId, filter, id);
              }}
              className={cn(
                "min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
                order === id ? "bg-primary text-primary-foreground" : "bg-card text-muted shadow-[var(--shadow-border)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {order === "pgn" ? (
          <p className="mt-2 text-sm text-muted">
            Yiqtol, then wayyiqtol, then weqatal. Each clock runs 3ms, 3fs, 2ms, 2fs, 1cs, 3cp (3mp, 3fp), 2mp, 2fp, 1cp.
          </p>
        ) : null}
        <label className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={strict} onChange={(event) => setStrict(event.target.checked)} />
          Full pointing
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">Screen</span>
          <ScreenChoices className="w-full sm:w-auto" />
        </div>
      </Panel>
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Root</p>
        <div className="mt-3 grid gap-3" role="radiogroup" aria-label="Root">
          {ROOT_GROUPS.map((group) => (
            <div key={group.cls}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{CLASS_LABEL[group.cls]}</p>
              {group.cls === "strong" ? (
                <p className="mt-1 text-sm text-muted">Start with קָטַל. It is the plain strong verb. The others use the same pattern with harder letters.</p>
              ) : null}
              <div className="mt-1.5 flex flex-wrap gap-2">
                {group.roots.map((root) => (
                  <button
                    key={root.id}
                    type="button"
                    role="radio"
                    aria-checked={rootId === root.id}
                    onClick={() => begin(root.id, filter, order)}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
                      rootId === root.id ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-[var(--shadow-border)]",
                    )}
                  >
                    <span className="he-word text-xl leading-none" dir="rtl" lang="he">
                      {root.cite}
                    </span>
                    <span className={rootId === root.id ? "text-primary-foreground" : "text-muted"}>{root.gloss}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      {sitting?.finished ? (
        <Panel>
          <p className="text-sm font-semibold text-ink">Three rounds done.</p>
          <p className="mt-2 max-w-prose text-sm text-muted">
            This root is ready to take into the game. The graded tests stay under Play. This room did not score them.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => rootId && begin(rootId, filter, order)}>
              Practice this root again
            </Button>
            <Link
              to="/game/qal-imperfect"
              className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] px-3 text-sm font-semibold text-primary"
            >
              Qal imperfect test
            </Link>
          </div>
        </Panel>
      ) : null}
      {!rootId ? (
        <Panel>
          <p className="text-sm text-muted">Choose a root to start the three rounds.</p>
        </Panel>
      ) : null}
      {card ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Round {sitting?.round} of {PRACTICE_ROUNDS}
            {sitting && sitting.misses > 0 ? ` · ${sitting.misses} came back` : ""}
          </p>
          <p className="mt-1 text-sm text-muted">
            {sitting ? `${sitting.cleared} done · ${sitting.queue.length} left` : ""}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">{card.gloss}</p>
          <p className="he-word mt-1 text-4xl text-ink" dir="rtl" lang="he">
            {card.cite}
          </p>
          <p className="mt-2 text-sm text-ink">
            {CLOCK_LABEL[card.clock]} · {card.label}
          </p>
          <p className="mt-1 text-sm text-muted">{CLOCK_NOTE[card.clock]}</p>
          <div className="mt-4">
            <HebrewType
              value={typed}
              onChange={setTyped}
              target={card.form}
              strict={strict}
              hideVowelLetters
              markBackspace
              extraMarks
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={check} disabled={!typed.trim() || graded !== null}>
              Check
            </Button>
            <Button type="button" variant="outline" onClick={next} disabled={graded === null}>
              Next
            </Button>
          </div>
          {graded ? (
            <div className="mt-4 grid gap-2">
              <p className={cn("text-sm font-semibold", graded.ok ? "text-primary" : "text-danger")}>
                {graded.lenient ? "Letters match" : graded.ok ? "Correct" : graded.tag === "stress" ? "The accent is missing" : "Not yet"}
              </p>
              {!graded.ok || graded.lenient ? (
                <p className="he-word text-3xl text-ink" dir="rtl" lang="he">
                  {card.form}
                </p>
              ) : null}
            </div>
          ) : null}
        </Panel>
      ) : null}
      {rootId && sitting && !sitting.finished && !card ? (
        <Panel>
          <p className="text-sm text-muted">This root has no forms for that clock. Pick another clock, or another root.</p>
        </Panel>
      ) : null}
    </div>
  );
}