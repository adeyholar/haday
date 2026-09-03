import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { WeekSelect } from "@/components/week-select";
import { VerseCard } from "@/components/verse-card";
import { Panel } from "@/components/panel";
import { AppErrorComponent } from "@/lib/error-component";
import { POS_LABEL, bbhVocab, itemsForWeek, type Pos } from "@/lib/vocab";
import { hydrateCard, isMastered, isWeak } from "@/lib/srs";
import { useStudy } from "@/lib/store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/browse")({
  component: BrowsePage,
  errorComponent: AppErrorComponent,
});

const POS_FILTERS: Array<Pos | "all"> = ["all", "noun", "verb", "adj", "prep", "particle", "pron", "name"];

function BrowsePage() {
  const week = useStudy((s) => s.week);
  const cards = useStudy((s) => s.cards);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState<Pos | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [weakOnly, setWeakOnly] = useState(false);
  const base = useMemo(() => itemsForWeek(week), [week]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const hebrewQ = q.trim();
    return base.filter((item) => {
      if (!item?.id) return false;
      if (weakOnly && !isWeak(cards[item.id])) return false;
      if (pos !== "all" && item.pos !== pos) return false;
      if (!query) return true;
      const alts = Array.isArray(item.alts) ? item.alts : [];
      const gloss = (item.gloss ?? "").toLowerCase();
      const translit = (item.translit ?? "").toLowerCase();
      const hebrew = item.hebrew ?? "";
      return (
        gloss.includes(query) ||
        translit.includes(query) ||
        hebrew.includes(hebrewQ) ||
        alts.some((a) => a.toLowerCase().includes(query))
      );
    });
  }, [base, q, pos, weakOnly, cards]);

  return (
    <>
      <Panel>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Lexicon</h1>
        <p className="mt-1 text-sm text-muted">
          {bbhVocab().length} BBH lemmas, same list as Game (Ch. 2–19). Tap a word for a Tanakh example.
        </p>
        <div className="mt-4">
          <WeekSelect />
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search gloss, Hebrew, or transliteration"
          className="mt-3 h-12 w-full rounded-[var(--radius-md)] border border-border bg-parchment px-4 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Panel>
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setWeakOnly((v) => !v)}
          className={cn(
            "h-9 shrink-0 rounded-full px-3 text-xs font-medium",
            weakOnly ? "bg-danger text-parchment" : "bg-card text-muted shadow-[var(--shadow-border)]",
          )}
        >
          Weak
        </button>
        {POS_FILTERS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPos(p)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3 text-xs font-medium",
              pos === p ? "bg-ink text-parchment" : "bg-card text-muted shadow-[var(--shadow-border)]",
            )}
          >
            {p === "all" ? "All" : POS_LABEL[p]}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs tabular-nums text-muted">{list.length} words</p>
      <ul className="mt-2 divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-border)]">
        {list.map((item) => {
          const card = cards[item.id];
          const mastered = isMastered(card);
          const weak = isWeak(card);
          const misses = hydrateCard(card).misses;
          const expanded = open === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : item.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-start"
              >
                <div className="min-w-0 flex-1">
                  <p className="he-word text-2xl leading-tight">{item.hebrew}</p>
                  <p className="truncate text-sm text-fg">{item.gloss}</p>
                  <p className="text-xs text-muted">
                    {item.translit} · {POS_LABEL[item.pos] ?? item.pos} · Ch. {item.chapter}
                  </p>
                </div>
                <span className={cn("text-xs font-medium", mastered ? "text-good" : weak ? "text-danger" : "text-subtle")}>
                  {mastered ? "Mastered" : weak ? `${misses} miss` : card ? "Learning" : "New"}
                </span>
              </button>
              {expanded && (
                <div className="px-4 pb-4">
                  <VerseCard item={item} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
