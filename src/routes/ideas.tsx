import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/panel";
import {
  IDEA_AREA_LABEL,
  IDEA_AREAS,
  IDEA_STATUS_LABEL,
  addIdea,
  listIdeaBoard,
  listMyIdeas,
  type Idea,
  type IdeaArea,
} from "@/lib/ideas";

export const Route = createFileRoute("/ideas")({ component: IdeasPage });

function IdeasPage() {
  const [mine, setMine] = useState<Idea[] | null>(null);
  const [board, setBoard] = useState<Idea[] | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [area, setArea] = useState<IdeaArea>("app");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function refresh() {
    const [a, b] = await Promise.all([listMyIdeas(), listIdeaBoard()]);
    setMine(a);
    setBoard(b);
  }

  useEffect(() => {
    void refresh().catch(() => setError("Could not load ideas yet."));
  }, []);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    setSaved(false);
    const res = await addIdea({ data: { title, body, area } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setTitle("");
    setBody("");
    setSaved(true);
    await refresh();
  }

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Class feedback</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Suggest a feature</h1>
        <p className="mt-3 text-muted">
          Tell Crown what would help you learn. Ideas land in the inventory for review. What makes sense for class gets
          planned, then built.
        </p>
      </Panel>

      <Panel className="mb-4">
        <h2 className="font-display text-2xl font-bold text-ink">Add an idea</h2>
        <form
          className="mt-4 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="grid gap-1 text-sm font-semibold text-ink">
            Short name
            <input
              className="min-h-12 rounded-[var(--radius-md)] bg-surface px-3 text-base font-normal text-ink shadow-[var(--shadow-border)]"
              value={title}
              maxLength={80}
              placeholder="e.g. Slow the Genesis reading"
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-ink">
            Where
            <select
              className="min-h-12 rounded-[var(--radius-md)] bg-surface px-3 text-base font-normal text-ink shadow-[var(--shadow-border)]"
              value={area}
              onChange={(e) => setArea(e.target.value as IdeaArea)}
            >
              {IDEA_AREAS.map((a) => (
                <option key={a} value={a}>
                  {IDEA_AREA_LABEL[a]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-ink">
            What it should do
            <textarea
              className="min-h-28 rounded-[var(--radius-md)] bg-surface px-3 py-3 text-base font-normal text-ink shadow-[var(--shadow-border)]"
              value={body}
              maxLength={800}
              placeholder="When I am driving / in class / on iPad, I need…"
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {saved ? <p className="text-sm font-semibold text-good">In the inventory. Crown will review it.</p> : null}
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? "Saving…" : "Send to inventory"}
          </Button>
        </form>
      </Panel>

      <Panel className="mb-4">
        <h2 className="font-display text-2xl font-bold text-ink">Your ideas</h2>
        {mine === null ? (
          <p className="mt-3 text-sm text-muted">Loading…</p>
        ) : mine.length === 0 ? (
          <p className="mt-3 text-sm text-muted">None yet. The form above is the start of the list.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {mine.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <h2 className="font-display text-2xl font-bold text-ink">On the board</h2>
        <p className="mt-1 text-sm text-muted">Ideas that passed review — planned, building, or shipped.</p>
        {board === null ? (
          <p className="mt-3 text-sm text-muted">Loading…</p>
        ) : board.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Empty for now. After review, approved work shows here.{" "}
            <Link to="/guide" className="font-semibold text-primary">
              How to use HaDay
            </Link>
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {board.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <li className="rounded-[var(--radius-md)] bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <div className="flex flex-wrap items-center gap-2">
        <Lightbulb className="size-4 text-primary" />
        <p className="font-semibold text-ink">{idea.title}</p>
        <span className="rounded-sm bg-card px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
          {IDEA_STATUS_LABEL[idea.status]}
        </span>
        <span className="text-xs text-muted">{IDEA_AREA_LABEL[idea.area]}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink">{idea.body}</p>
      {idea.note ? <p className="mt-2 text-sm text-muted">Note: {idea.note}</p> : null}
    </li>
  );
}
