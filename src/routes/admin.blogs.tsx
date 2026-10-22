import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { getAdminStatus } from "@/lib/admin";
import { deleteTeaching, listTeachingDesk, saveTeaching } from "@/lib/teachings";
import { slugify, type Teaching, type TeachingPath } from "@/lib/teaching-text";

export const Route = createFileRoute("/admin/blogs")({ component: BlogDesk });

const EMPTY = {
  previousSlug: "",
  title: "",
  slug: "",
  summary: "",
  body: "",
  path: "grammar" as TeachingPath,
  tags: "",
  related: "",
  image: "",
  draft: true,
  published: new Date().toISOString().slice(0, 10),
};

function BlogDesk() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<Teaching[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    setPosts(await listTeachingDesk());
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getAdminStatus();
        if (cancelled) return;
        setAdmin(status.admin);
        if (!status.admin) return;
        await reload();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not open the desk.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function edit(post: Teaching) {
    setNote("");
    setError(null);
    setForm({
      previousSlug: post.slug,
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      body: post.body,
      path: post.path,
      tags: post.tags.join(", "),
      related: post.related.join(", "),
      image: post.image,
      draft: post.draft,
      published: post.published,
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    setNote("");
    try {
      const result = await saveTeaching({ data: form });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNote(result.teaching.draft ? "Saved as a draft. It is not on the public page." : "Published. It is on the blogs page.");
      setForm({ ...form, previousSlug: result.teaching.slug, slug: result.teaching.slug });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!form.previousSlug) return;
    if (!window.confirm("Remove this blog?")) return;
    setBusy(true);
    setError(null);
    try {
      const result = await deleteTeaching({ data: { slug: form.previousSlug } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setForm(EMPTY);
      setNote("Removed.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove it.");
    } finally {
      setBusy(false);
    }
  }

  if (admin === false) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">Blogs</h1>
        <p className="mt-3 text-sm text-muted">This desk is only for the course owner.</p>
      </Panel>
    );
  }

  if (admin === null) {
    return (
      <Panel>
        <p className="text-sm text-muted">Opening the blogs desk…</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Owner</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Blogs</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Write here. A draft stays private. Uncheck “Keep this as a draft” and save to put it on the public blogs page.
          A post does not have to be a lesson. No code change is required.
        </p>
        <p className="mt-2 text-sm">
          <Link to="/admin" className="font-semibold text-primary">
            Back to the roster
          </Link>
        </p>
      </Panel>
      <Panel>
        <h2 className="font-display text-2xl font-semibold text-ink">{form.previousSlug ? "Edit" : "New blog"}</h2>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Title
          <input
            value={form.title}
            onChange={(event) => {
              const title = event.target.value;
              setForm((current) => ({
                ...current,
                title,
                slug: current.previousSlug ? current.slug : slugify(title),
              }));
            }}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 font-normal"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Address
          <input
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 font-normal"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Summary ({form.summary.trim().length}/155)
          <textarea
            value={form.summary}
            onChange={(event) => setForm({ ...form, summary: event.target.value })}
            rows={3}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 font-normal"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Path
          <select
            value={form.path}
            onChange={(event) => setForm({ ...form, path: event.target.value === "scripture" ? "scripture" : "grammar" })}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 font-normal"
          >
            <option value="grammar">Grammar Path</option>
            <option value="scripture">Scripture Path</option>
          </select>
        </label>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Date
          <input
            type="date"
            value={form.published}
            onChange={(event) => setForm({ ...form, published: event.target.value })}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 font-normal"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Tags, separated by commas
          <input
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 font-normal"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Related addresses, separated by commas
          <input
            value={form.related}
            onChange={(event) => setForm({ ...form, related: event.target.value })}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 font-normal"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Post
          <textarea
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
            rows={14}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 font-normal"
          />
        </label>
        <p className="mt-2 text-xs text-muted">Use blank lines between paragraphs. **bold**, *italic*, and # headings work. Hebrew is set right to left.</p>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={form.draft}
            onChange={(event) => setForm({ ...form, draft: event.target.checked })}
          />
          Keep this as a draft
        </label>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {note ? <p className="mt-3 text-sm text-primary">{note}</p> : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={() => void save()} className="min-h-11 rounded-[var(--radius-md)] bg-primary px-4 font-semibold text-card">
            Save
          </button>
          <button type="button" disabled={busy} onClick={() => { setForm(EMPTY); setNote(""); setError(null); }} className="min-h-11 rounded-[var(--radius-md)] border border-border px-4 font-semibold">
            New
          </button>
          {form.previousSlug ? (
            <button type="button" disabled={busy} onClick={() => void remove()} className="min-h-11 rounded-[var(--radius-md)] px-4 font-semibold text-danger">
              Remove
            </button>
          ) : null}
        </div>
      </Panel>
      <Panel>
        <h2 className="font-display text-2xl font-semibold text-ink">Saved</h2>
        {posts.length === 0 ? <p className="mt-3 text-sm text-muted">None yet.</p> : null}
        <ul className="mt-3 space-y-2">
          {posts.map((post) => (
            <li key={post.slug}>
              <button type="button" onClick={() => edit(post)} className="text-left font-semibold text-primary underline-offset-4 hover:underline">
                {post.title}
              </button>
              <span className="ml-2 text-sm text-muted">{post.draft ? "Draft" : "Public"} · {post.published}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
