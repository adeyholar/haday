import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { getAdminStatus, getMailerStatus, issuePasswordReset, listPendingResets, listRoster, removeUser, revokeAllPasswordResets, revokePasswordReset, type PendingReset, type RosterPerson } from "@/lib/admin";
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
  const [resets, setResets] = useState<PendingReset[]>([]);
  const [visits, setVisits] = useState<VisitStats | null>(null);
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [mailer, setMailer] = useState<{ configured: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getAdminStatus();
        if (cancelled) return;
        setAdmin(status.admin);
        if (!status.admin) return;
        const [rowsR, trafficR, inboxR, pendingR, mailerR] = await Promise.allSettled([
          listRoster(),
          listVisits(),
          listIdeaInbox(),
          listPendingResets(),
          getMailerStatus(),
        ]);
        if (cancelled) return;
        if (rowsR.status === "fulfilled") setPeople(rowsR.value);
        else setError(rowsR.reason instanceof Error ? rowsR.reason.message : "Could not load roster.");
        if (trafficR.status === "fulfilled") setVisits(trafficR.value);
        if (inboxR.status === "fulfilled") setIdeas(inboxR.value);
        else setIdeas([]);
        if (pendingR.status === "fulfilled") setResets(pendingR.value);
        if (mailerR.status === "fulfilled") setMailer(mailerR.value);
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
          Email accounts stay waiting until they open the confirmation mail.
        </p>
        <p className="mt-2 max-w-prose text-sm text-muted">
          {mailer?.configured
            ? "Email reset sends the hour-long link to that classmate. Copy stays as a backup if nothing arrives."
            : "This host is not sending mail yet. Email reset still creates a link you can copy until a mailer key is on Azure or Vercel."}{" "}
          <Link to="/admin/voice" className="font-semibold text-primary">
            Voice bank
          </Link>
          {" — "}
          record class lemmas for Alive Pet and Listen.{" "}
          <Link to="/finder" className="font-semibold text-primary">
            Tanakh cards
          </Link>
          {" — "}
          deal a grammar flashcard deck from the whole text.
        </p>
      </Panel>

      <ResetInbox resets={resets} mailerOn={Boolean(mailer?.configured)} onChange={setResets} />

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
          Country is from the visitor’s IP on Azure (filled on the next visit if it was blank). Owner-only.
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
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Signed up</th>
              <th className="px-4 py-3 font-semibold">Last login</th>
              <th className="px-4 py-3 font-semibold">Last study</th>
              <th className="px-4 py-3 font-semibold tabular-nums">Streak</th>
              <th className="px-4 py-3 font-semibold">Mail</th>
              <th className="px-4 py-3 font-semibold">Reset</th>
              <th className="px-4 py-3 font-semibold">Remove</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{p.name || "—"}</td>
                <td className="px-4 py-3 text-muted">
                  <span className="block">{p.email || "—"}</span>
                  <span className="mt-0.5 block text-xs text-subtle">{signInLabel(p)}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{fmt(p.signedUp)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{fmt(p.lastLogin)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{fmt(p.lastStudy)}</td>
                <td className="px-4 py-3 tabular-nums text-ink">{p.streak}d</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">
                  {p.hasPassword ? (p.emailVerified ? "Confirmed" : "Waiting") : "OAuth"}
                </td>
                <td className="px-4 py-3">
                  <IssueReset
                    person={p}
                    mailerOn={Boolean(mailer?.configured)}
                    onIssued={(reset) => {
                      setResets((cur) => [reset, ...cur.filter((r) => r.email !== reset.email)]);
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <RemoveAccount
                    person={p}
                    onRemoved={(id) => setPeople((cur) => (cur ?? []).filter((row) => row.id !== id))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function signInLabel(p: RosterPerson): string {
  if (p.hasPassword) return "Email password";
  const raw = (p.providers || "").toLowerCase();
  if (raw.includes("google")) return "Google";
  if (raw.includes("twitter") || raw.includes("x")) return "X";
  if (raw) return raw;
  return "Sign-in unknown";
}

function RemoveAccount({
  person,
  onRemoved,
}: {
  person: RosterPerson;
  onRemoved: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (person.protectedAccount) {
    return <span className="text-xs text-subtle">Owner</span>;
  }

  async function go() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const result = await removeUser({ data: { userId: person.id } });
      if (!result.ok) {
        setNote(result.reason);
        setConfirming(false);
        return;
      }
      onRemoved(person.id);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not remove that account.");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-w-[7rem] justify-items-start gap-1">
      <button
        type="button"
        disabled={busy}
        className="min-h-11 rounded-[var(--radius-md)] bg-card px-3 text-sm font-semibold text-danger shadow-[var(--shadow-border)] disabled:opacity-60"
        onClick={() => void go()}
      >
        {busy ? "Removing…" : confirming ? "Confirm" : "Remove"}
      </button>
      {confirming && !busy ? (
        <button type="button" className="text-xs text-muted" onClick={() => setConfirming(false)}>
          Cancel
        </button>
      ) : null}
      {note ? <span className="max-w-[12rem] text-xs leading-snug text-muted">{note}</span> : null}
    </div>
  );
}

function resetUrl(token: string): string {
  return `${window.location.origin}/reset-password?token=${encodeURIComponent(token)}`;
}

function IssueReset({
  person,
  mailerOn,
  onIssued,
}: {
  person: RosterPerson;
  mailerOn: boolean;
  onIssued: (reset: PendingReset) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (!person.hasPassword) {
    return <span className="text-xs text-subtle">No password</span>;
  }

  async function issue() {
    setBusy(true);
    setNote(null);
    setSent(false);
    setCopied(false);
    try {
      const result = await issuePasswordReset({ data: { email: person.email } });
      if (!result.ok) {
        setNote(result.reason);
        return;
      }
      onIssued({
        email: person.email,
        name: person.name,
        expiresAt: result.expiresAt,
        token: result.token,
      });
      if (result.emailed) {
        setSent(true);
        setNote(`Sent to ${person.email}. They have one hour.`);
        return;
      }
      try {
        await navigator.clipboard.writeText(resetUrl(result.token));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
      setNote(
        mailerOn
          ? "Mail did not send. Link copied — send it privately."
          : "Mail is not on this host. Link copied — send it privately.",
      );
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not email a reset.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-w-[8.5rem] justify-items-start gap-1">
      <button
        type="button"
        disabled={busy}
        className="min-h-11 rounded-[var(--radius-md)] bg-card px-3 text-sm font-semibold text-primary shadow-[var(--shadow-border)] disabled:opacity-60"
        onClick={() => void issue()}
      >
        {busy ? "Sending…" : sent ? "Emailed" : copied ? "Copied" : "Email reset"}
      </button>
      {note ? <span className="max-w-[12rem] text-xs leading-snug text-muted">{note}</span> : null}
    </div>
  );
}

function ResetInbox({
  resets,
  mailerOn,
  onChange,
}: {
  resets: PendingReset[];
  mailerOn: boolean;
  onChange: (next: PendingReset[]) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function copyLink(token: string) {
    try {
      await navigator.clipboard.writeText(resetUrl(token));
      setCopied(token);
      window.setTimeout(() => setCopied((cur) => (cur === token ? null : cur)), 2000);
    } catch {
      setCopied(null);
    }
  }

  async function revokeOne(token: string) {
    setBusy(token);
    setNote(null);
    try {
      const result = await revokePasswordReset({ data: { token } });
      if (!result.ok) {
        setNote(result.reason);
        return;
      }
      onChange(resets.filter((r) => r.token !== token));
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not revoke that link.");
    } finally {
      setBusy(null);
    }
  }

  async function revokeAll() {
    setBusy("all");
    setNote(null);
    try {
      const result = await revokeAllPasswordResets();
      onChange([]);
      setNote(result.removed ? `Removed ${result.removed} waiting link${result.removed === 1 ? "" : "s"}.` : "None waiting.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not clear waiting links.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel className="mb-4">
      <h2 className="font-display text-2xl font-bold text-ink">Password reset</h2>
      <p className="mt-1 text-sm text-muted">
        Classmates can tap Forgot password on Sign in, or you can email a link from their row.
        Links expire in one hour — or revoke them here right away. Forgot password is limited
        (a few tries per person and per network) so a flood cannot fill the mailbox.
        Copy is only a backup if the inbox is empty — do not paste these in a public channel.
      </p>
      {resets.length > 0 ? (
        <button
          type="button"
          disabled={busy === "all"}
          className="mt-3 min-h-11 rounded-[var(--radius-md)] bg-card px-3 text-sm font-semibold text-danger shadow-[var(--shadow-border)] disabled:opacity-60"
          onClick={() => void revokeAll()}
        >
          {busy === "all" ? "Revoking…" : "Revoke all waiting"}
        </button>
      ) : null}
      {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
      {resets.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          {mailerOn
            ? "None waiting. Use Email reset on a row when someone is locked out."
            : "None waiting. Email reset will copy a link until mail is configured."}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {resets.map((r) => (
            <li key={r.token} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="font-semibold text-ink">{r.name || r.email}</span>
                <span className="ms-2 text-muted">
                  {r.email}
                  {r.expiresAt ? ` · until ${fmt(r.expiresAt)}` : ""}
                </span>
              </span>
              <span className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  className="min-h-11 rounded-[var(--radius-md)] bg-card px-3 font-semibold text-primary shadow-[var(--shadow-border)]"
                  onClick={() => void copyLink(r.token)}
                >
                  {copied === r.token ? "Copied" : "Copy link"}
                </button>
                <button
                  type="button"
                  disabled={busy === r.token}
                  className="min-h-11 rounded-[var(--radius-md)] bg-card px-3 font-semibold text-danger shadow-[var(--shadow-border)] disabled:opacity-60"
                  onClick={() => void revokeOne(r.token)}
                >
                  {busy === r.token ? "Revoking…" : "Revoke"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
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
