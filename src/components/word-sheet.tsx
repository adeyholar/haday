import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { askHaday, type AskTurn, type AskVerseContext } from "@/lib/ask-haday";
import { classLemmaForWord, describeTags, grammarAskFromTags, vocabLine } from "@/lib/word-card";
import { lookupTanakhWord } from "@/lib/tanakh-query-server";
import { shortGloss } from "@/lib/tanakh-learn-note";
import type { BookId } from "@/lib/tanakh-canon";

export type WordPick = {
  word: string;
  index: number;
  book: BookId;
  chapter: number;
  verse: number;
  he: string;
  en: string;
};

export function WordSheet({
  pick,
  onClose,
}: {
  pick: WordPick;
  onClose: () => void;
}) {
  const lemma = classLemmaForWord(pick.word);
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<AskTurn[]>([]);
  const [askBusy, setAskBusy] = useState(false);
  const [askErr, setAskErr] = useState("");
  const ref = `${pick.book}.${pick.chapter}.${pick.verse}`;
  const deck = grammarAskFromTags(tags);
  const labels = describeTags(tags);
  const vocab = vocabLine(lemma);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setTags([]);
    setAskOpen(false);
    setHistory([]);
    setQuestion("");
    setAskErr("");
    void lookupTanakhWord({ data: { w: pick.word, ref } })
      .then((hit) => {
        if (!cancelled) setTags(hit?.t ?? []);
      })
      .catch(() => {
        if (!cancelled) setTags([]);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pick.word, pick.index, ref]);

  const context: AskVerseContext = {
    ref: pick.he ? `${pick.book} ${pick.chapter}:${pick.verse}` : ref,
    he: pick.he,
    en: pick.en,
    word: pick.word,
    tags: labels,
    vocab,
  };

  async function sendAsk() {
    const q = question.trim();
    if (!q || askBusy) return;
    setAskBusy(true);
    setAskErr("");
    setQuestion("");
    const nextHist: AskTurn[] = [...history, { role: "user", text: q }];
    setHistory(nextHist);
    const res = await askHaday({ data: { question: q, history, context } });
    if (!res.ok) {
      setAskErr(res.error);
      setAskBusy(false);
      return;
    }
    setHistory([...nextHist, { role: "assistant", text: res.text }]);
    setAskBusy(false);
  }

  return (
    <div className="mt-4 rounded-[var(--radius-xl)] bg-card px-4 py-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">This word</p>
          <p className="he-word mt-1 text-4xl leading-tight text-ink" dir="rtl" lang="he">
            {pick.word}
          </p>
        </div>
        <button type="button" className="min-h-11 shrink-0 px-2 text-sm font-semibold text-primary" onClick={onClose}>
          Close
        </button>
      </div>
      {lemma ? (
        <p className="mt-3 text-sm text-ink">
          Class vocab · Ch. {lemma.chapter}: <span className="he-word text-xl" dir="rtl" lang="he">{lemma.hebrew}</span>
          {" · "}
          {shortGloss(lemma.gloss)}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">Not a BBH citation lemma — tags below are from the form in this verse.</p>
      )}
      {busy ? <p className="mt-2 text-sm text-muted">Looking up the form…</p> : null}
      {labels.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {labels.map((lab) => (
            <li
              key={lab}
              className="rounded-[var(--radius-md)] bg-surface px-2 py-1 text-xs font-semibold text-ink shadow-[var(--shadow-border)]"
            >
              {lab}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex flex-col gap-2">
        {deck ? (
          <Link
            to="/finder/deck"
            search={{ q: deck.q, n: 10 }}
            className="flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-ink px-4 text-sm font-semibold text-parchment"
          >
            {deck.label}
          </Link>
        ) : null}
        <Button type="button" variant="outline" size="lg" onClick={() => setAskOpen((o) => !o)}>
          Ask about this word
        </Button>
      </div>
      {askOpen ? (
        <div className="mt-3 border-t border-transparent pt-3">
          {history.map((t, i) => (
            <div
              key={`${t.role}-${i}`}
              className={`mb-2 rounded-[var(--radius-md)] px-3 py-2 text-sm ${
                t.role === "user" ? "bg-ink text-parchment" : "bg-surface text-ink"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{t.text}</p>
            </div>
          ))}
          {askBusy ? <p className="text-sm font-semibold text-primary">Thinking through this verse…</p> : null}
          {askErr ? <p className="text-sm text-danger">{askErr}</p> : null}
          <form
            className="mt-2 grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendAsk();
            }}
          >
            <textarea
              className="min-h-20 w-full rounded-[var(--radius-md)] bg-surface px-3 py-2 text-base text-ink shadow-[var(--shadow-border)]"
              placeholder="Why is this form here?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={800}
            />
            <Button type="submit" size="lg" disabled={askBusy || question.trim().length < 2}>
              Ask HaDay
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
