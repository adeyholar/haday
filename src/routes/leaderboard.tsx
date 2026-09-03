import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { HonorBadge, CrownBadge } from "@/components/honor-badge";
import { Button } from "@/components/ui/button";
import { AppErrorComponent } from "@/lib/error-component";
import { cn } from "@/lib/cn";
import { listLeaderboard, type BoardRow } from "@/lib/leaderboard";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  errorComponent: AppErrorComponent,
});

function LeaderboardPage() {
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setRows(null);
    listLeaderboard()
      .then((data) => {
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load the board.");
        setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const you = rows?.find((r) => r.you);

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Class</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Leaderboard</h1>
        <p className="mt-3 max-w-prose text-muted">
          Ranked by reward points from stages, stars, chapters, badges, and streaks. Names only — no emails.
        </p>
        {you && (
          <p className="mt-3 text-sm text-ink">
            You are <span className="font-semibold">#{you.rank}</span>
            {" · "}
            {you.honor || "Hearer of the Word"}
            {" · "}
            {you.points.toLocaleString()} pts · Level {you.level}
          </p>
        )}
      </Panel>

      {error && (
        <Panel className="mb-4">
          <p className="text-sm text-danger">{error}</p>
          <Button className="mt-3" variant="outline" onClick={() => setTick((n) => n + 1)}>
            Try again
          </Button>
        </Panel>
      )}

      {rows === null && !error && (
        <Panel>
          <p className="text-sm text-muted">Loading the class board…</p>
        </Panel>
      )}

      {rows && rows.length === 0 && !error && (
        <Panel>
          <p className="text-sm text-muted">No classmates yet. Sign in and play to take first place.</p>
        </Panel>
      )}

      {rows && rows.length > 0 && (
        <ol className="overflow-hidden rounded-[var(--radius-xl)] bg-card shadow-[var(--shadow-border)]">
          {rows.map((row, i) => (
            <li
              key={`${row.rank}-${i}-${row.you ? "you" : row.name}`}
              className={cn(
                "flex items-center gap-3 border-b border-border px-4 py-3 last:border-0",
                row.you && "bg-surface",
              )}
            >
              <span className="w-8 shrink-0 text-center font-display text-xl font-bold tabular-nums text-primary">
                {row.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 flex-wrap items-center gap-2 font-semibold text-ink">
                  <span className="truncate">{row.name}</span>
                  <HonorBadge
                    honor={{ title: row.honor || "Hearer of the Word", short: row.honorShort || "Hearer" }}
                    compact
                  />
                  {row.crown ? <CrownBadge compact /> : null}
                  {row.you ? <span className="text-xs font-medium uppercase tracking-wide text-primary">You</span> : null}
                </p>
                <p className="text-sm text-muted">
                  Level {row.level}
                  {row.streak ? ` · ${row.streak}d streak` : ""}
                </p>
              </div>
              <span className="shrink-0 font-display text-xl font-bold tabular-nums text-ink">
                {(row.points || 0).toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-6 text-sm">
        <Link to="/" className="font-semibold text-primary">
          Back to dashboard
        </Link>
      </p>
    </>
  );
}
