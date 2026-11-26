import { Link } from "@tanstack/react-router";
import { dueTotal, firstDueId, hydrateVerbLab, readProgressKey } from "@/lib/verb-lab/progress";
import type { VerbLabFrom } from "@/lib/verb-lab/redirects";
import { squareTitle, type VerbPath } from "@/lib/verb-lab/stems";
import { useStudy } from "@/lib/store";

export function VerbLabCard({ from, path }: { from: VerbLabFrom; path: VerbPath }) {
  const raw = useStudy((s) => s.game.verbLab);
  const progress = hydrateVerbLab(raw);
  const due = dueTotal(progress);
  const first = readProgressKey(firstDueId(progress) ?? "");
  const next = due > 0 && first ? `${due} forms due · ${squareTitle(path, first.squareId)}` : "Continue where you stopped";
  const scripture = path === "scripture";
  return (
    <Link
      to={scripture ? "/iibs/verb-lab" : "/verb-lab"}
      search={{ from }}
      className="block rounded-[var(--radius-xl)] border border-primary/40 bg-card p-4 text-ink shadow-[var(--shadow-border)]"
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-display text-2xl font-bold">Verb Lab</span>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Seven stems</span>
      </span>
      <span className="mt-1 block text-sm text-muted">Next: {next}</span>
      <span className="mt-2 block text-sm font-semibold text-primary">Open Verb Lab</span>
    </Link>
  );
}
