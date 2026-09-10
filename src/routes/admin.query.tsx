import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { getAdminStatus } from "@/lib/admin";
import { searchTanakhIndex, type TanakhQueryResult } from "@/lib/tanakh-query-server";
import { QUERY_PRESETS, parseRef, type QueryKind } from "@/lib/tanakh-query";
import { isBookId } from "@/lib/tanakh-canon";

export const Route = createFileRoute("/admin/query")({ component: TanakhFinderPage });

function TanakhFinderPage() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [q, setQ] = useState("give me 10 qamets qatan");
  const [kind, setKind] = useState<QueryKind | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TanakhQueryResult | null>(null);

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
          Pull a working list from the Masoretic text: qamets hatuf vs gadol, endingless masculine, feminine endings,
          duals, or the class noun lemmas as they actually appear. Ask in English — “give me 10 qamets qatan from
          Torah” — or tap a preset. Gender from endings is the form the student sees; class feminine/masculine uses the
          BBH noun list.{" "}
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
              placeholder="give me 10 qamets qatan"
            />
          </label>
          <Button type="submit" disabled={busy} className="h-11">
            {busy ? "Searching…" : "Find in the Tanakh"}
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUERY_PRESETS.map((p) => (
            <button
              key={p.kind}
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
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </Panel>

      {result ? (
        <Panel>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">{result.label}</h2>
              <p className="text-sm text-muted">
                {result.items.length} shown · {result.total} distinct forms · {result.tokens.toLocaleString()} tokens in
                the index
                {result.parsed.scope !== "all" ? ` · ${result.parsed.scope}` : ""}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={copyList}>
              Copy list
            </Button>
          </div>
          <ul className="mt-4 space-y-2">
            {result.items.map((row) => (
              <li
                key={row.w}
                className="rounded-[var(--radius-md)] bg-surface px-3 py-2 shadow-[var(--shadow-border)]"
              >
                <p className="he-word text-2xl text-ink" dir="rtl" lang="he">
                  {row.w}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {row.n}× · {row.t.join(" · ")}
                </p>
                <p className="mt-1 flex flex-wrap gap-2 text-sm">
                  {row.r.map((ref) => {
                    const loc = parseRef(ref);
                    if (!isBookId(loc.book)) return <span key={ref}>{ref}</span>;
                    return (
                      <Link
                        key={ref}
                        to="/listen/read/$book/$ch"
                        params={{ book: loc.book, ch: loc.ch }}
                        search={{ v1: Number(loc.v) }}
                        className="font-semibold text-primary"
                      >
                        {ref.replace(/\./g, " ")}
                      </Link>
                    );
                  })}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </>
  );
}
