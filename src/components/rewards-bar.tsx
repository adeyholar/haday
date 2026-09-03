import { Flame } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { GAME_CHAPTER_MAX, chapterRecord, hydrateGame, type GameSnapshot } from "@/lib/game";
import { BADGES, badgeMeta, scoreboard } from "@/lib/rewards";
import { HonorBadge, CrownBadge } from "@/components/honor-badge";
import { BadgeGlyph } from "@/components/badge-icons";
import { useStudy } from "@/lib/store";

export function RewardsBar() {
  const raw = useStudy((s) => s.game);
  const streak = useStudy((s) => s.streak);
  const game = hydrateGame(raw);
  const board = scoreboard(game, streak);
  const earned = new Set(Array.isArray(game.badges) ? game.badges : []);
  const shown = BADGES.filter((b) => earned.has(b.id)).slice(0, 4);

  return (
    <div className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-ink">Your climb</h2>
        <Link to="/rewards" className="text-sm font-medium text-primary">
          All rewards
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <HonorBadge honor={board.honor} />
        {board.crown ? <CrownBadge /> : null}
        <span className="text-sm text-muted">Level {board.level} of {board.total}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <DashStat label="Level" value={String(board.level)} hint={board.honor.short} />
        <DashStat label="Points" value={board.points.toLocaleString()} hint={`${board.stars} stars`} />
        <DashStat label="Streak" value={`${streak}d`} hint={game.winStreak > 1 ? `${game.winStreak} wins` : "daily"} />
      </div>

      <div className="mt-4">
        <ProgressRow
          label={`This level · ${board.chapterStagesDone}/${board.chapterStagesTotal} stages`}
          pct={board.chapterPct}
        />
        <ProgressRow
          label={`Path · ${board.cleared}/${board.total} chapters`}
          pct={board.overallPct}
          className="mt-3"
        />
        <p className="mt-2 text-sm text-muted">{board.next}</p>
      </div>

      <LadderStrip game={game} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] bg-surface px-3 text-sm font-semibold text-ink">
          <Flame className="size-4 text-primary" />
          {streak}d
        </span>
        {shown.map((b) => (
            <span
              key={b.id}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] bg-surface px-3 text-sm font-medium text-ink"
              title={b.hint}
            >
              <BadgeGlyph id={b.id} className="size-4 text-primary" />
              {b.title}
            </span>
        ))}
      </div>
    </div>
  );
}

function DashStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-surface px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums text-ink">{value}</p>
      <p className="mt-0.5 truncate text-xs text-muted">{hint}</p>
    </div>
  );
}

function ProgressRow({ label, pct, className }: { label: string; pct: number; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-ink">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-[var(--motion-fast)]"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

export function LadderStrip({ game }: { game: GameSnapshot }) {
  return (
    <ol className="mt-3 grid grid-cols-10 gap-1 sm:grid-cols-[repeat(19,minmax(0,1fr))]">
      {Array.from({ length: GAME_CHAPTER_MAX }, (_, i) => i + 1).map((n) => {
        const rec = chapterRecord(game, n);
        const unlocked = n <= Math.max(game.unlockedChapter, 1);
        return (
          <li key={n}>
            <span
              className={cn(
                "flex h-8 items-center justify-center rounded-[var(--radius-sm)] text-xs font-semibold tabular-nums",
                rec.cleared && "bg-primary text-primary-foreground",
                unlocked && !rec.cleared && "bg-surface text-ink shadow-[var(--shadow-border)]",
                !unlocked && "bg-surface/70 text-muted",
              )}
              aria-label={`Chapter ${n}${rec.cleared ? " cleared" : unlocked ? " open" : " locked"}`}
            >
              {n}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function NewBadges({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <ul className="mt-4 space-y-1">
      {ids.map((id) => {
        const meta = badgeMeta(id);
        if (!meta) return null;
        return (
          <li key={id} className="flex items-center justify-center gap-2 text-sm font-medium text-good">
            <BadgeGlyph id={id} className="size-4" />
            Reward: {meta.title}
          </li>
        );
      })}
    </ul>
  );
}
