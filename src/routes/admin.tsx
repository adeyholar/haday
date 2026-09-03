import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { getAdminStatus, listRoster, type RosterPerson } from "@/lib/admin";
import { listVisits, countryLabel, type VisitStats } from "@/lib/visits";
import {
  IDEA_AREA_LABEL,
  IDEA_STATUS_LABEL,
  IDEA_STATUSES,
  listIdeaInbox,
  reviewIdea,
  type Idea,
  type IdeaStatus,
} from "@/lib/ideas";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 6);
}

function AdminPage() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [people, setPeople] = useState<RosterPerson[] | null>(null);
  const [visits, setVisits] = useState<VisitStats | null>(null);
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getAdminStatus();
        if (cancelled) return;
        setAdmin(status.admin);
        if (!status.admin) return;
        const [rows, traffic, inbox] = await Promise.all([listRoster(), listVisits(), listIdeaInbox()]);
        if (cancelled) return;
        setPeople(rows);
        setVisits(traffic);
        setIdeas(inbox);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load roster.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">Class roster</h1>
        <p className="mt-2 text-sm text-danger">{error}</p>
      </Panel>
    );
  }

  if (admin === false) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">Class roster</h1>
        <p className="mt-3 text-sm text-muted">
          This page is only for the course owner. Classmates cannot see who else signed in.
        </p>
        <p className="mt-3 text-sm">
          <Link to="/" className="font-semibold text-primary">
            Back home
          </Link>
        </p>
      </Panel>
    );
  }

  if (admin === null || people === null) {
    return (
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Owner</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Class roster</h1>
        <p className="mt-3 text-sm text-muted">Loading sign-ins…</p>
      </Panel>
    );
  }

  const anon = visits?.recentAnon ?? [];

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Owner</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Class roster</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          {people.length} account{people.length === 1 ? "" : "s"}. Name and email come from sign-in.
          Last login is the most recent session; last study is when they saved progress.
        </p>
      </Panel>

      <IdeaInventory ideas={ideas ?? []} onChange={setIdeas} />

      {visits && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Unique browsers" value={String(visits.unique)} />
          <Stat label="Did not sign in" value={String(visits.anonymous)} />
          <Stat label="Signed in later" value={String(visits.signedIn)} />
          <Stat label="Page hits" value={String(visits.hits)} />
        </div>
      )}

      <Panel className="mb-4">
        <h2 className="font-display text-2xl font-bold text-ink">Visitors who did not sign in</h2>
        <p className="mt-1 text-sm text-muted">
          Anonymous browsers on the login page or the site. No names or emails — a cookie id only.
          Country is from the first request (Vercel / edge), owner-only.
        </p>
        {(visits?.countries.length ?? 0) > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {visits!.countries.map((c) => (
              <li
                key={c.code}
                className="rounded-[var(--radius-md)] bg-surface px-2.5 py-1 text-sm text-ink shadow-[var(--shadow-border)]"
              >
                <span className="font-semibold">{countryLabel(c.code) || c.code}</span>
                <span className="ms-1.5 tabular-nums text-muted">{c.n}</span>
              </li>
            ))}
          </ul>
        )}
        {anon.length === 0 ? (
          <p className="mt-3 text-sm text-muted">None yet. New visits to the login page will show here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {anon.map((v) => (
              <li key={v.id} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="font-semibold text-ink">Visitor {shortId(v.id)}</span>
                  <span className="ms-2 text-muted">
                    {countryLabel(v.country) || "country unknown"}
                    {v.device ? ` · ${v.device}` : ""}
                    {` · ${v.lastPath}`}
                    {` · ${v.hits} hit${v.hits === 1 ? "" : "s"}`}
                  </span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-muted">{fmt(v.lastSeen)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="overflow-x-auto rounded-[var(--radius-xl)] bg-card shadow-[var(--shadow-border)]">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Signed up</th>
              <th className="px-4 py-3 font-semibold">Last login</th>
              <th className="px-4 py-3 font-semibold">Last study</th>
              <th className="px-4 py-3 font-semibold tabular-nums">Streak</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{p.name || "—"}</td>
                <td className="px-4 py-3 text-muted">{p.email || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{fmt(p.signedUp)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{fmt(p.lastLogin)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{fmt(p.lastStudy)}</td>
                <td className="px-4 py-3 tabular-nums text-ink">{p.streak}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function IdeaInventory({ ideas, onChange }: { ideas: Idea[]; onChange: (next: Idea[]) => void }) {
  const inbox = ideas.filter((i) => i.status === "new").length;
  return (
    <Panel className="mb-4">
      <h2 className="font-display text-2xl font-bold text-ink">Feature inventory</h2>
      <p className="mt-1 text-sm text-muted">
        {inbox} waiting for review. Mark what makes sense as planned, then building, then shipped. Hold the rest.
        Classmates add ideas from{" "}
        <Link to="/ideas" className="font-semibold text-primary">
          Suggest a feature
        </Link>
        .
      </p>
      {ideas.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No ideas yet. Share the Suggest a feature page with the group.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {ideas.map((idea) => (
            <li key={idea.id} className="rounded-[var(--radius-md)] bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
              <p className="font-semibold text-ink">{idea.title}</p>
              <p className="mt-1 text-xs text-muted">
                {idea.author} · {IDEA_AREA_LABEL[idea.area]} · {new Date(idea.created).toLocaleDateString()}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink">{idea.body}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
                <select
                  className="min-h-12 rounded-[var(--radius-md)] bg-card px-3 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
                  value={idea.status}
                  onChange={(e) => {
                    const status = e.target.value as IdeaStatus;
                    onChange(ideas.map((x) => (x.id === idea.id ? { ...x, status } : x)));
                    void reviewIdea({ data: { id: idea.id, status, note: idea.note } });
                  }}
                >
                  {IDEA_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {IDEA_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <input
                  className="min-h-12 rounded-[var(--radius-md)] bg-card px-3 text-sm text-ink shadow-[var(--shadow-border)]"
                  placeholder="Review note (optional)"
                  defaultValue={idea.note}
                  maxLength={280}
                  onBlur={(e) => {
                    const note = e.target.value.trim();
                    if (note === idea.note) return;
                    onChange(ideas.map((x) => (x.id === idea.id ? { ...x, note } : x)));
                    void reviewIdea({ data: { id: idea.id, status: idea.status, note } });
                  }}
                />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {IDEA_STATUS_LABEL[idea.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-xl)] bg-card px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums text-ink">{value}</p>
    </div>
  );
}
