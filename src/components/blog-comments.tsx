import { useEffect, useState } from "react";
import { Link, useRouteContext } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { addBlogComment, loadBlogComments, removeBlogComment, type BlogComment } from "@/lib/blog-comments";

export function BlogComments({ slug, initial }: { slug: string; initial: BlogComment[] }) {
  const { sessionUser } = useRouteContext({ from: "__root__" });
  const { user, isPending } = useCurrentUserState();
  const signedIn = sessionUser != null || user != null;
  const [comments, setComments] = useState(initial);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    loadBlogComments({ data: slug })
      .then((next) => {
        if (!cancel) setComments(next);
      })
      .catch(() => {
        if (!cancel) setError("Comments could not be loaded.");
      });
    return () => {
      cancel = true;
    };
  }, [slug]);

  async function send() {
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await addBlogComment({ data: { slug, body } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setBody("");
    setComments(res.comments);
  }

  async function remove(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await removeBlogComment({ data: { id } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setComments((list) => list.filter((item) => item.id !== id));
  }

  return (
    <Panel className="mt-4">
      <h2 className="font-display text-2xl font-semibold text-ink">Comments</h2>
      {comments.length === 0 ? <p className="mt-3 text-sm text-muted">No comments yet.</p> : null}
      <ul className="mt-3 space-y-4">
        {comments.map((item) => (
          <li key={item.id} className="border-t border-border pt-3">
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{item.author}</span>
              {item.created ? ` · ${item.created}` : ""}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-ink" dir="auto">
              {item.body}
            </p>
            {item.canRemove ? (
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                onClick={() => void remove(item.id)}
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {signedIn ? (
        <form
          className="mt-4 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <label className="grid gap-1 text-sm font-semibold text-ink">
            Leave a comment
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              maxLength={1500}
              className="rounded-[var(--radius-md)] bg-surface px-3 py-2 text-base font-normal text-ink shadow-[var(--shadow-border)]"
            />
          </label>
          {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
          <Button type="submit" disabled={busy || isPending}>
            Post comment
          </Button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted">
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>{" "}
          to leave a comment.
          {error ? <span className="mt-1 block text-danger">{error}</span> : null}
        </p>
      )}
    </Panel>
  );
}
