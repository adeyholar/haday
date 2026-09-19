import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { StudyMenu } from "@/components/study-menu";
import { Button } from "@/components/ui/button";
import { VocabCardsPlay } from "@/components/vocab-cards-play";
import { cn } from "@/lib/cn";
import { COURSE_WEEKS, GAME_CHAPTER_TITLES, itemsForSelection, type VocabItem } from "@/lib/vocab";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/cards")({
  component: CardsPage,
});

function CardsPage() {
  const rate = useStudy((s) => s.rate);
  const [weeks, setWeeks] = useState<number[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [deck, setDeck] = useState<VocabItem[] | null>(null);
  const [run, setRun] = useState(0);

  const pool = useMemo(() => itemsForSelection(weeks, chapters), [weeks, chapters]);

  function toggle(list: number[], n: number, set: (v: number[]) => void) {
    set(list.includes(n) ? list.filter((x) => x !== n) : [...list, n]);
  }

  return (
    <>
      <Panel className="mb-4">
        <StudyMenu />
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">Cards</h1>
        <p className="mt-2 max-w-prose text-muted">
          Meet the word in Scripture before you quiz. Hear it, see the gloss, and the Tanakh line. Got it marks it met.
          Again brings it back. No score.
        </p>
      </Panel>

      {!deck ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Weeks</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {COURSE_WEEKS.map((w) => (
              <button
                key={w.week}
                type="button"
                onClick={() => toggle(weeks, w.week, setWeeks)}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] px-1 text-xs font-semibold",
                  weeks.includes(w.week) ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-[var(--shadow-border)]",
                )}
              >
                Wk {w.week}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Chapters</p>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {Array.from({ length: 19 }, (_, i) => i + 1).map((ch) => (
              <button
                key={ch}
                type="button"
                title={GAME_CHAPTER_TITLES[ch]}
                onClick={() => toggle(chapters, ch, setChapters)}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] text-sm font-semibold tabular-nums",
                  chapters.includes(ch) ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-[var(--shadow-border)]",
                )}
              >
                {ch}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">{pool.length} words — full deck, no cap</p>
          <Button className="mt-3 w-full" disabled={!pool.length} onClick={() => { setDeck(pool); setRun((n) => n + 1); }}>
            Start cards
          </Button>
        </Panel>
      ) : (
        <Panel>
          <VocabCardsPlay
            key={run}
            items={deck}
            onMet={(id) => rate(id, "good")}
            onAgain={(id) => rate(id, "again")}
          />
          <Button className="mt-4 w-full" variant="outline" onClick={() => setDeck(null)}>
            New mix
          </Button>
        </Panel>
      )}
    </>
  );
}
