import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { getAdminStatus } from "@/lib/admin";
import { searchTanakhIndex, type TanakhQueryResult } from "@/lib/tanakh-query-server";
import { fetchTanakhBook, isBookId } from "@/lib/tanakh-canon";
import { QUERY_PRESETS, kindLabel, parseRef, prettyRef, type QueryForm, type QueryKind } from "@/lib/tanakh-query";

export const Route = createFileRoute("/admin/query")({ component: TanakhFinderPage });

const GROUPS = ["Nouns", "Binyan", "Person", "Vowels", "Shewa", "Prefixes"];

function TanakhFinderPage() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [q, setQ] = useState("give me 10 vocal shewa");
  const [kind, setKind] = useState<QueryKind | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TanakhQueryResult | null>(null);
  const [card, setCard] = useState(0);
  const [open, setOpen] = useState(false);
  const [verse, setVerse] = useState<{ he: string; en: string } | null>(null);

  useEffect(() => {
    void getAdminStatus()
      .then((s) => setAdmin(s.admin))
      .catch(() => setAdmin(false));
  }, []);

  async function run(next?: { q?: string; kind?: QueryKind }) {
    const ask = next?.q ?? q;
    const k = next?.kind ?? (kind || undefined);
    setBusy(true);
    setError(null);
    try {
      const data = await searchTanakhIndex({ data: { q: ask, kind: k } });
      setResult(data);
      setCard(0);
      setOpen(false);
      setVerse(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed.");
    } finally {
      setBusy(false);
    }
  }

  function copyList() {
    if (!result) return;
    const lines = result.items.map((row) => `${row.w}\t${row.n}\t${row.r.join(", ")}`);
    void navigator.clipboard.writeText(lines.join("\n"));
  }

  const item: QueryForm | null = result?.items[card] ?? null;

  useEffect(() => {
    if (!open || !item?.r[0]) {
      setVerse(null);
      return;
    }
    const loc = parseRef(item.r[0]);
    if (!isBookId(loc.book)) return;
    let cancelled = false;
    void fetchTanakhBook(loc.book).then((dump) => {
      if (cancelled) return;
      const row = dump.chapters[loc.ch]?.find((v) => v.v === Number(loc.v));
      setVerse(row ? { he: row.he, en: row.en } : null);
    });
    return () => {
      cancelled = true;
    };
  }, [open, item]);

  function tapCard() {
    if (!result?.items.length) return;
    if (!open) {
      setOpen(true);
      return;
    }
    const next = card + 1;
    if (next >= result.items.length) {
      setCard(0);
      setOpen(false);
      return;
    }
    setCard(next);
    setOpen(false);
    setVerse(null);
  }

  const grouped = useMemo(() => {
    return GROUPS.map((g) => ({ g, items: QUERY_PRESETS.filter((p) => p.group === g) }));
  }, []);

  if (admin === false) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">Tanakh finder</h1>
        <p className="mt-3 text-sm text-muted">Only the course owner can run corpus queries.</p>
      </Panel>
    );
  }

  if (admin === null) {
    return (
      <Panel>
        <p className="text-sm text-muted">Loading finder…</p>
      </Panel>
    );
  }

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Owner</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Tanakh finder</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Any class grammar name as a teaching deck: construct vs absolute, pronouns, qal perfect /
          imperfect, wayyiqtol, piel / pual / niphal / hiphil / hophal / hithpael, shewa, qamets.
          Ask “give me 10 qal perfect” or tap a chip. Tap the card to read the verse, tap again to
          move. Morphology from the Open Scriptures Hebrew Bible (CC BY 4.0).{" "}
          <Link to="/admin" className="font-semibold text-primary">
            Roster
          </Link>
        </p>
        <form
          className="mt-4 grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          <label className="text-sm font-semibold text-ink">
            Query
            <input
              className="mt-1 h-12 w-full rounded-[var(--radius-md)] border border-border bg-parchment px-3 text-ink"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="give me 10 qal perfect · construct · piel"
            />
          </label>
          <Button type="submit" disabled={busy} className="h-11">
            {busy ? "Searching…" : "Deal the deck"}
          </Button>
        </form>
        {grouped.map((block) => (
          <div key={block.g} className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{block.g}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {block.items.map((p) => (
                <button
                  key={p.ask}
                  type="button"
                  onClick={() => {
                    setKind(p.kind);
                    setQ(p.ask);
                    void run({ q: p.ask, kind: p.kind });
                  }}
                  className="rounded-[var(--radius-md)] bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </Panel>

      {result && item ? (
        <Panel>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">{result.label}</h2>
              <p className="text-sm text-muted">
                Card {card + 1} of {result.items.length}
                {result.total > result.items.length ? ` · ${result.total} forms in the corpus` : ""}
                {result.parsed.scope !== "all" ? ` · ${result.parsed.scope}` : ""}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={copyList}>
              Copy list
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!result) return;
                const mix = [...result.items];
                for (let i = mix.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [mix[i], mix[j]] = [mix[j]!, mix[i]!];
                }
                setResult({ ...result, items: mix });
                setCard(0);
                setOpen(false);
                setVerse(null);
              }}
            >
              Shuffle
            </Button>
          </div>

          <button
            type="button"
            onClick={tapCard}
            className="mt-4 w-full rounded-[var(--radius-lg)] bg-parchment px-4 py-8 text-center shadow-[var(--shadow-border)]"
          >
            <p className="he-word text-5xl leading-tight text-ink sm:text-6xl" dir="rtl" lang="he">
              {item.w}
            </p>
            {!open ? (
              <p className="mt-4 text-sm font-semibold text-muted">Tap to read · tap again to move</p>
            ) : (
              <div className="mt-4 space-y-2 text-start">
                <p className="text-xs text-muted">
                  {item.n}× · {item.t.join(" · ")}
                </p>
                {item.r[0] ? (
                  <p className="text-sm font-semibold text-primary">{prettyRef(item.r[0])}</p>
                ) : null}
                {verse ? (
                  <>
                    <p className="he-word text-xl leading-relaxed text-ink" dir="rtl" lang="he">
                      {verse.he}
                    </p>
                    <p className="text-sm text-muted">{verse.en}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted">Loading the verse…</p>
                )}
              </div>
            )}
          </button>

          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCard((c) => Math.max(0, c - 1));
                setOpen(false);
                setVerse(null);
              }}
              disabled={card === 0}
            >
              Back
            </Button>
            <Button type="button" className="flex-1" onClick={tapCard}>
              {open ? (card + 1 >= result.items.length ? "Start over" : "Next card") : "Read"}
            </Button>
          </div>
        </Panel>
      ) : result ? (
        <Panel>
          <p className="text-sm text-muted">No forms for {kindLabel(result.parsed.kind, result.parsed.need)} in that slice.</p>
        </Panel>
      ) : null}
    </>
  );
}
