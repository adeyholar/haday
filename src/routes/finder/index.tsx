import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { StudyMenu } from "@/components/study-menu";
import { QUERY_PRESETS } from "@/lib/tanakh-query";
import { FINDER_COUNTS, finderAsk } from "@/lib/finder-search";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/finder/")({ component: FinderHubPage });

const GROUPS = ["Nouns", "Binyan", "Person", "Vowels", "Shewa", "Prefixes"];

function FinderHubPage() {
  const navigate = useNavigate();
  const [n, setN] = useState(10);
  const [q, setQ] = useState("qal perfect");

  const grouped = useMemo(
    () => GROUPS.map((g) => ({ g, items: QUERY_PRESETS.filter((p) => p.group === g) })),
    [],
  );

  function deal(ask: string) {
    const query = finderAsk(ask, n);
    void navigate({ to: "/finder/deck", search: { q: query, n } });
  }

  return (
    <>
      <StudyMenu />
      <Panel className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Tanakh cards</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Deal a grammar deck</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Pick how many, then a grammar name. You get a flashcard deck from the Tanakh — one card at a
          time. Flip to read the verse, then open it in the reading page.
        </p>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">How many</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FINDER_COUNTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setN(c)}
              className={cn(
                "min-h-11 rounded-[var(--radius-md)] px-4 text-sm font-semibold shadow-[var(--shadow-border)]",
                n === c ? "bg-ink text-parchment" : "bg-surface text-ink",
              )}
            >
              {c} cards
            </button>
          ))}
        </div>

        <form
          className="mt-4 grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            deal(q || "qal perfect");
          }}
        >
          <label className="text-sm font-semibold text-ink">
            Or type a grammar name
            <input
              className="mt-1 h-12 w-full rounded-[var(--radius-md)] border border-border bg-parchment px-3 text-ink"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="qal perfect · construct · silent shewa"
            />
          </label>
          <Button type="submit" className="h-12">
            Deal {n} cards
          </Button>
        </form>

        {grouped.map((block) => (
          <div key={block.g} className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{block.g}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {block.items.map((p) => (
                <button
                  key={p.ask}
                  type="button"
                  onClick={() => deal(p.ask)}
                  className="min-h-12 rounded-[var(--radius-md)] bg-surface px-3 py-3 text-start text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </Panel>
    </>
  );
}
