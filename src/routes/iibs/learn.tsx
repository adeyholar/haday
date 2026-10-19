import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/iibs/learn")({
  component: ScriptureLearn,
});

function ScriptureLearn() {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path</p>
      <h1 className="mt-1 font-display text-4xl font-bold text-ink">Learn</h1>
      <p className="mt-2 max-w-prose text-muted">The word lists live in the level. The Leningrad text lives in the Reading Lab.</p>
      <ul className="mt-4 grid gap-2">
        <li>
          <Link to="/iibs" className="block rounded-[var(--radius-xl)] bg-card p-4 text-ink shadow-[var(--shadow-border)]">
            <span className="block font-display text-2xl font-bold">Lessons</span>
            <span className="mt-1 block text-sm text-muted">Thirty lessons in the level you are in.</span>
          </Link>
        </li>
        <li>
          <Link to="/iibs/wlc" className="block rounded-[var(--radius-xl)] bg-card p-4 text-ink shadow-[var(--shadow-border)]">
            <span className="block font-display text-2xl font-bold">Reading Lab</span>
            <span className="mt-1 block text-sm text-muted">The Leningrad text, accents kept, on its own leaf.</span>
          </Link>
        </li>
      </ul>
    </>
  );
}
