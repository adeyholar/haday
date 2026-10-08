import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { getAdminStatus } from "@/lib/admin";
import { getClassUse, type ClassUse } from "@/lib/use-report.server";
import type { UseBucket } from "@/lib/use-report";

export const Route = createFileRoute("/admin/use")({ component: UsePage });

function UsePage() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [report, setReport] = useState<ClassUse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getAdminStatus();
        if (cancelled) return;
        setAdmin(status.admin);
        if (!status.admin) return;
        const next = await getClassUse();
        if (!cancelled) setReport(next);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "";
        if (/unauthorized|forbidden/i.test(message)) {
          setAdmin(false);
          return;
        }
        setError(message || "Could not load class use.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">What the class uses</h1>
        <p className="mt-2 text-sm text-danger">{error}</p>
      </Panel>
    );
  }

  if (admin === false) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">What the class uses</h1>
        <p className="mt-3 text-sm text-muted">This page is only for the course owner.</p>
        <p className="mt-3 text-sm">
          <Link to="/" className="font-semibold text-primary">
            Back home
          </Link>
        </p>
      </Panel>
    );
  }

  if (admin === null || report === null) {
    return (
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Owner</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">What the class uses</h1>
        <p className="mt-3 text-sm text-muted">Loading…</p>
      </Panel>
    );
  }

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Owner</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">What the class uses</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Practice already saved on each account: vocabulary answers, games, and grammar. Page opens are counted from
          now on, including Road exam and the Week 7 mock. Earlier visits only kept the last page. Classmates cannot
          open this.
        </p>
        <p className="mt-2 text-sm">
          <Link to="/admin" className="font-semibold text-primary">
            Class roster
          </Link>
        </p>
      </Panel>

      <Panel className="mb-4">
        <h2 className="font-display text-2xl font-bold text-ink">Practice</h2>
        <p className="mt-1 text-sm text-muted">What saved accounts have done most. A person counts once for each area they have used.</p>
        {report.practice.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No saved practice yet.</p>
        ) : (
          <Bars rows={report.practice} note={(row) => `${row.n} · ${row.people} ${row.people === 1 ? "person" : "people"}`} />
        )}
      </Panel>

      <Panel className="mb-4">
        <h2 className="font-display text-2xl font-bold text-ink">Pages opened</h2>
        <p className="mt-1 text-sm text-muted">Opens since this count began. One browser counts as one person, even if they return.</p>
        {report.areas.length === 0 ? (
          <p className="mt-4 text-sm text-muted">None yet. The next visit starts the count.</p>
        ) : (
          <Bars rows={report.areas} note={(row) => `${row.n} opens · ${row.people} ${row.people === 1 ? "person" : "people"}`} />
        )}
      </Panel>

      <Panel>
        <h2 className="font-display text-2xl font-bold text-ink">Each account</h2>
        <p className="mt-1 text-sm text-muted">Sorted by vocabulary answers already saved.</p>
        {report.students.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No one has saved study yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {report.students.map((student, index) => (
              <li key={`${student.name}-${index}`} className="rounded-[var(--radius-md)] bg-card px-4 py-3 shadow-[var(--shadow-border)]">
                <p className="font-semibold text-ink">{student.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {student.words} {student.words === 1 ? "word" : "words"} · {student.answers}{" "}
                  {student.answers === 1 ? "answer" : "answers"} · {student.streak}d streak · {student.sessions}{" "}
                  {student.sessions === 1 ? "session" : "sessions"}
                </p>
                <p className="mt-1 text-sm text-ink">Most: {student.top}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

function Bars({ rows, note }: { rows: UseBucket[]; note: (row: UseBucket) => string }) {
  const max = Math.max(1, ...rows.map((row) => row.n));
  return (
    <ul className="mt-4 grid gap-3">
      {rows.map((row) => (
        <li key={row.id}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold text-ink">{row.label}</span>
            <span className="shrink-0 tabular-nums text-muted">{note(row)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, Math.round((row.n / max) * 100))}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
