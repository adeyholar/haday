import { useMemo, useState } from "react";
import { HebrewType } from "@/components/hebrew-type";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { CLOCK_LABEL, CLOCK_NOTE, CLOCKS, clockCards, gradeClock, type Clock, type ClockCard } from "@/lib/qal-clocks";

type Filter = "all" | Clock;

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
  const deck = useMemo(() => shuffle(clockCards()), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [cursor, setCursor] = useState(0);
  const [typed, setTyped] = useState("");
  const [strict, setStrict] = useState(true);
  const [graded, setGraded] = useState(false);
  const [ok, setOk] = useState(false);
  const [lenient, setLenient] = useState(false);
  const [tag, setTag] = useState<"" | "stress">("");

  const pool = filter === "all" ? deck : deck.filter((card) => card.clock === filter);
  const card = pool[cursor % Math.max(pool.length, 1)];

  function reset() {
    setTyped("");
    setGraded(false);
    setOk(false);
    setLenient(false);
    setTag("");
  }

  function next() {
    setCursor((value) => value + 1);
    reset();
  }

  function check() {
    if (!card) return;
    const result = gradeClock(card.form, typed, strict);
    setGraded(true);
    setOk(result.ok);
    setLenient(result.lenient);
    setTag(result.tag);
  }

  return (
    <div className="grid gap-4">
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Qal · practice</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-ink">Yiqtol, wayyiqtol, weqatal</h2>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Type the Qal form. Yiqtol is the imperfect. Wayyiqtol is the story past. Weqatal is the perfect with “and.” This practice is not the graded test.
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
                setCursor(0);
                reset();
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
        <label className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={strict} onChange={(event) => setStrict(event.target.checked)} />
          Full pointing
        </label>
      </Panel>
      {card ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{card.gloss}</p>
          <p className="he-word mt-1 text-4xl text-ink" dir="rtl" lang="he">
            {card.cite}
          </p>
          <p className="mt-2 text-sm text-ink">
            {CLOCK_LABEL[card.clock]} · {card.label}
          </p>
          <p className="mt-1 text-sm text-muted">{CLOCK_NOTE[card.clock]}</p>
          <div className="mt-4">
            <HebrewType value={typed} onChange={setTyped} target={card.form} strict={strict} liveGrade={false} hideHint hideVowelLetters markBackspace extraMarks />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={check} disabled={!typed.trim() || graded}>
              Check
            </Button>
            <Button type="button" variant="outline" onClick={next}>
              Next
            </Button>
          </div>
          {graded ? (
            <div className="mt-4 grid gap-2">
              <p className={cn("text-sm font-semibold", ok && !lenient ? "text-primary" : "text-danger")}>
                {lenient ? "Letters right, now point it" : ok ? "Correct" : tag === "stress" ? "The accent is missing" : "Not yet"}
              </p>
              <p className="he-word text-3xl text-ink" dir="rtl" lang="he">
                {card.form}
              </p>
            </div>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}
