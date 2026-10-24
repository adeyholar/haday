import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { getAdminStatus } from "@/lib/admin";
import { presignBlogImage } from "@/lib/blog-images";
import { deleteTeaching, listTeachingDesk, saveTeaching } from "@/lib/teachings";
import { insertPostPiece, slugify, spreadsheetToTable, type Teaching, type TeachingPath, type TeachingSection } from "@/lib/teaching-text";

export const Route = createFileRoute("/admin/blogs")({ component: BlogDesk });

const EMPTY = {
  previousSlug: "",
  title: "",
  slug: "",
  summary: "",
  searchTitle: "",
  body: "",
  path: "grammar" as TeachingPath,
  section: "" as "" | TeachingSection,
  tags: "",
  related: "",
  image: "",
  imageAlt: "",
  draft: true,
  published: new Date().toISOString().slice(0, 10),
};

function pictureFiles(data: DataTransfer | null): File[] {
  if (!data) return [];
  const fromItems = [...data.items]
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
  if (fromItems.length) return fromItems;
  return [...data.files].filter((file) => file.type.startsWith("image/"));
}

function toWebp(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = image.width > 1600 ? 1600 / image.width : 1;
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("This browser cannot prepare the picture."));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) reject(new Error("This browser cannot make a WebP picture."));
          else resolve({ blob, width, height });
        },
        "image/webp",
        0.82,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file is not a picture."));
    };
    image.src = url;
  });
}

function BlogDesk() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<Teaching[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      searchTitle: post.searchTitle,
      body: post.body,
      path: post.path,
      section: post.section,
      tags: post.tags.join(", "),
      related: post.related.join(", "),
      image: post.image,
      imageAlt: post.imageAlt,
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
      setNote(
        result.teaching.draft
          ? "Saved as a draft. It is not on the public page."
          : result.teaching.section === "teachings"
            ? "Published. It is on the Teachings page."
            : "Published. It is on the Learning HebRabbAi page.",
      );
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

  function placeInPost(piece: string) {
    const box = bodyRef.current;
    const start = box?.selectionStart ?? form.body.length;
    const end = box?.selectionEnd ?? start;
    setForm({ ...form, body: insertPostPiece(form.body, start, end, piece) });
  }

  async function uploadPictures(files: File[]) {
    const slug = slugify(form.slug || form.title);
    if (!slug) {
      setError("Add a title first, then add pictures.");
      return;
    }
    if (!form.slug) setForm((current) => ({ ...current, slug }));
    setUploading(true);
    setError(null);
    let draft = form.body;
    let cursor = bodyRef.current?.selectionStart ?? draft.length;
    try {
      for (const file of files) {
        if (file.type !== "image/webp" && file.type !== "image/jpeg" && file.type !== "image/png") {
          setError("Use a WebP, JPEG, or PNG picture.");
          return;
        }
        const alt = window.prompt("Describe this picture")?.trim() ?? "";
        if (!alt) {
          setError("Add alt text for the picture.");
          return;
        }
        const made = await toWebp(file);
        if (made.blob.size > 2 * 1024 * 1024) {
          setError("Keep the picture under 2 MB.");
          return;
        }
        const signed = await presignBlogImage({
          data: { slug, type: "image/webp", bytes: made.blob.size },
        });
        if (!signed.ok) {
          setError(signed.error);
          return;
        }
        const sent = await fetch(signed.putUrl, {
          method: "PUT",
          body: made.blob,
          headers: { "content-type": "image/webp" },
        });
        if (!sent.ok) {
          setError("The picture did not upload.");
          return;
        }
        const safeAlt = alt.replace(/"/g, "");
        const tag = `[image url="${signed.url}" alt="${safeAlt}" width="${made.width}" height="${made.height}"]`;
        const before = draft.slice(0, cursor);
        const gap = before.length > 0 && !before.endsWith("\n\n") ? "\n\n" : "";
        const piece = `${gap}${tag}`;
        draft = `${before}${piece}${draft.slice(cursor)}`;
        cursor = before.length + piece.length;
        setForm((current) => ({ ...current, body: draft }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The picture did not upload.");
    } finally {
      setUploading(false);
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
          Write here. Choose a section before you save. A draft stays private. Paste, drop, or choose a picture. It is resized, saved on images.haday.app, and needs alt text.
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
          Search title ({form.searchTitle.trim().length}/60)
          <input
            value={form.searchTitle}
            onChange={(event) => setForm({ ...form, searchTitle: event.target.value })}
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
          Section
          <select
            value={form.section}
            onChange={(event) =>
              setForm({
                ...form,
                section: event.target.value === "learning-hebrabbai" ? "learning-hebrabbai" : event.target.value === "teachings" ? "teachings" : "",
              })
            }
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 font-normal"
          >
            <option value="">Choose a section</option>
            <option value="teachings">Teachings</option>
            <option value="learning-hebrabbai">Learning HebRabbAi</option>
          </select>
        </label>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Picture address
          <input
            value={form.image}
            onChange={(event) => setForm({ ...form, image: event.target.value })}
            placeholder="https://images.haday.app/..."
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 font-normal"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Picture alt text
          <input
            value={form.imageAlt}
            onChange={(event) => setForm({ ...form, imageAlt: event.target.value })}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 font-normal"
          />
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
            ref={bodyRef}
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
            onPaste={(event) => {
              const images = pictureFiles(event.clipboardData);
              if (images.length > 0) {
                event.preventDefault();
                void uploadPictures(images);
                return;
              }
              const sheet = spreadsheetToTable(event.clipboardData.getData("text/plain"));
              if (!sheet) return;
              event.preventDefault();
              if ("error" in sheet) {
                setError(sheet.error);
                return;
              }
              placeInPost(sheet.table);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const images = pictureFiles(event.dataTransfer);
              if (images.length === 0) return;
              event.preventDefault();
              void uploadPictures(images);
            }}
            rows={14}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 font-normal"
          />
        </label>
        {uploading ? <p className="mt-2 text-sm text-muted">Uploading…</p> : null}
        <p className="mt-2 text-xs text-muted">Use blank lines between paragraphs. **bold**, *italic*, and # headings work. Hebrew is set right to left. A table is a header row, then | --- |, then the cells. A spreadsheet paste becomes a table.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="min-h-11 rounded-[var(--radius-md)] border border-border px-3 text-sm font-semibold" onClick={() => setForm({ ...form, body: `${form.body}\n\n[verse ref="Gen 1:1"]בְּרֵאשִׁית[/verse]`.trim() })}>
            Insert verse
          </button>
          <button type="button" className="min-h-11 rounded-[var(--radius-md)] border border-border px-3 text-sm font-semibold" onClick={() => fileRef.current?.click()}>
            Add picture
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/webp,image/jpeg,image/png"
            className="hidden"
            onChange={(event) => {
              const images = event.target.files ? [...event.target.files] : [];
              event.target.value = "";
              if (images.length) void uploadPictures(images);
            }}
          />
          <button
            type="button"
            className="min-h-11 rounded-[var(--radius-md)] border border-border px-3 text-sm font-semibold"
            onClick={() =>
              placeInPost(`| Column 1 | Column 2 | Column 3 |
| --- | --- | --- |
|  |  |  |
|  |  |  |`)
            }
          >
            Table
          </button>
          <button type="button" className="min-h-11 rounded-[var(--radius-md)] border border-border px-3 text-sm font-semibold" onClick={() => setForm({ ...form, body: `${form.body}\n\n[video id=""]`.trim() })}>
            Insert video
          </button>
          <button type="button" className="min-h-11 rounded-[var(--radius-md)] border border-border px-3 text-sm font-semibold" onClick={() => setForm({ ...form, body: `${form.body}\n\n[hebrabbai-cta]`.trim() })}>
            Insert app link
          </button>
        </div>
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
