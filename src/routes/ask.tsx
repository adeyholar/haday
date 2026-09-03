import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/panel";
import { askHaday, type AskTurn } from "@/lib/ask-haday";

export const Route = createFileRoute("/ask")({ component: AskPage });

function AskPage() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<AskTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setError("");
    setQuestion("");
    const nextHist: AskTurn[] = [...history, { role: "user", text: q }];
    setHistory(nextHist);
    const res = await askHaday({ data: { question: q, history } });
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    setHistory([...nextHist, { role: "assistant", text: res.text }]);
    setBusy(false);
  }

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Lesson help</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Ask HaDay Hebraic AI</h1>
        <p className="mt-3 text-muted">
          Questions from class: letters, syllables, nouns, vocabulary, and the Genesis 1–5 reading. Ask to clarify the
          lesson — not for a shortcut past the work.
        </p>
      </Panel>

      <div className="space-y-3">
        {history.length === 0 && (
          <Panel>
            <p className="text-sm text-muted">Try: Why is dual אַיִם a diphthong? Why isn’t בַּיָּם the vocab word? What is Genesis 1:1 in the WLC?</p>
          </Panel>
        )}
        {history.map((t, i) => (
          <div
            key={`${t.role}-${i}`}
            className={`rounded-[var(--radius-lg)] px-4 py-3 shadow-[var(--shadow-border)] ${
              t.role === "user" ? "bg-ink text-parchment" : "bg-card text-ink"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
              {t.role === "user" ? "You" : "HaDay Hebraic AI"}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{t.text}</p>
          </div>
        ))}
        {busy && <p className="text-sm font-semibold text-primary">Thinking through the lesson…</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      <form
        className="mt-4 grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          className="min-h-24 w-full rounded-[var(--radius-md)] bg-card px-3 py-3 text-base text-ink shadow-[var(--shadow-border)]"
          placeholder="Ask about this week’s lesson…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={800}
        />
        <Button type="submit" size="lg" disabled={busy || question.trim().length < 2}>
          Ask
        </Button>
      </form>
    </>
  );
}
