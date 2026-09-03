import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { LadderStrip } from "@/components/rewards-bar";
import { BadgeGlyph } from "@/components/badge-icons";
import { HonorBadge, CrownBadge } from "@/components/honor-badge";
import { AppErrorComponent } from "@/lib/error-component";
import { hydrateGame } from "@/lib/game";
import { BADGES, HONOR_RANKS, scoreboard } from "@/lib/rewards";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/rewards")({
  component: RewardsPage,
  errorComponent: AppErrorComponent,
});

function RewardsPage() {
  const raw = useStudy((s) => s.game);
  const streak = useStudy((s) => s.streak);
  const game = hydrateGame(raw);
  const board = scoreboard(game, streak);
  const earned = new Set(Array.isArray(game.badges) ? game.badges : []);
  const honor = board.honor ?? { title: "Hearer of the Word", short: "Hearer", step: 0 };

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Rewards</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Climb the ladder</h1>
        <p className="mt-3 max-w-prose text-muted">
          Daily streak for showing up. Win streak for clearing stages. Each BBH chapter is a rung — 19 to the summit.
          Honor ranks follow the church’s old formation names, from Hearer to Masorete.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <HonorBadge honor={honor} />
          {board.crown ? <CrownBadge /> : null}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[var(--radius-md)] bg-surface px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Level</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums text-ink">{board.level}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{honor.short}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-surface px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Points</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums text-ink">{board.points.toLocaleString()}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{board.stars} stars</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-surface px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Path</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums text-ink">{board.overallPct}%</p>
            <p className="mt-0.5 truncate text-xs text-muted">{board.cleared}/{board.total} chapters</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">{board.next}</p>
        <LadderStrip game={game} />
      </Panel>

      <Panel className="mb-4">
        <h2 className="font-display text-2xl font-bold text-ink">Honor ranks</h2>
        <p className="mt-2 text-sm text-muted">Clear a chapter to take the next name. Chapter 19 is Masorete — keeper of the pointed text.</p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {HONOR_RANKS.map((rank, i) => {
            const got = honor.step >= i;
            return (
              <li
                key={`${rank.short}-${i}`}
                className={`flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 py-2.5 ${
                  got ? "bg-card shadow-[var(--shadow-border)]" : "bg-surface"
                }`}
              >
                <span className={`text-sm font-medium ${got ? "text-ink" : "text-muted"}`}>
                  <span className="me-2 tabular-nums text-primary">{i === 0 ? "Start" : `Ch. ${i}`}</span>
                  {rank.title}
                </span>
                {got ? <HonorBadge honor={rank} compact /> : null}
              </li>
            );
          })}
        </ol>
      </Panel>

      <ul className="grid gap-2 sm:grid-cols-2">
        {BADGES.map((b) => {
          const got = earned.has(b.id);
          return (
            <li
              key={b.id}
              className={`rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-border)] ${
                got ? "bg-card" : "bg-surface"
              }`}
            >
              <div className="flex items-center gap-3">
                <BadgeGlyph id={b.id} className={`size-5 ${got ? "text-primary" : "text-muted"}`} />
                <div>
                  <p className={`font-semibold ${got ? "text-ink" : "text-muted"}`}>{b.title}</p>
                  <p className="text-sm text-muted">{got ? "Earned" : b.hint}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-sm">
        <Link to="/game" className="font-semibold text-primary">
          Back to the map
        </Link>
      </p>
    </>
  );
}
