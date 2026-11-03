import { useMemo, useState } from "react";
import { GradeBanner } from "@/components/grade-banner";
import { Button } from "@/components/ui/button";
import {
  BINYAN_ROUND,
  STEM_CARDS,
  binyanChoices,
  binyanClue,
  binyanPrompt,
  choiceMatches,
  dealBinyanRound,
  finishBinyanRound,
  noteBinyanFirst,
  stemExamples,
  stemsOpen,
  strongBinyanCards,
  type BinyanCard,
  type BinyanChoice,
  type BinyanMode,
} from "@/lib/binyan-drill";
import { useStudy } from "@/lib/store";
import type { StemId } from "@/lib/verbal-system";

const MODES: { id: BinyanMode; title: string; line: string }[] = [
  { id: "verb-stem", title: "Name the stem", line: "See the form. Choose the stem." },
  { id: "stem-verb", title: "Find the form", line: "See the stem. Choose its form." },
  { id: "same-root", title: "Same root", line: "One root, then which stem that form is." },
];

export function BinyanDrill() {
  const progress = useStudy((state) => state.game.binyan);
  const save = useStudy((state) => state.saveBinyan);
  const open = stemsOpen(progress.set);
  const [mode, setMode] = useState<BinyanMode | null>(null);
  const [round, setRound] = useState<BinyanCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<BinyanChoice | null>(null);
  const [firstCorrect, setFirstCorrect] = useState(0);
  const [report, setReport] = useState<{ correct: number; advanced: boolean } | null>(null);
  const [locked, setLocked] = useState(false);
  const [choices, setChoices] = useState<BinyanChoice[]>([]);

  const cards = useMemo(() => strongBinyanCards(), []);
  const card = round?.[index] ?? null;

  function begin(next: BinyanMode) {
    const dealt = dealBinyanRound(open);
    setMode(next);
    setRound(dealt);
    setIndex(0);
    setChoices(dealt[0] ? binyanChoices(dealt[0], next, open) : []);
    setPicked(null);
    setFirstCorrect(0);
    setReport(null);
    setLocked(false);
  }

  function answer(choice: BinyanChoice) {
    if (!card || !mode || locked) return;
    const right = choiceMatches(card, choice, mode);
    setPicked(choice);
    setLocked(true);
    setFirstCorrect((count) => count + (right ? 1 : 0));
    save(noteBinyanFirst(progress, card.stem, right));
  }

  function nextCard() {
    if (!round || !mode) return;
    if (index + 1 >= round.length) {
      const current = useStudy.getState().game.binyan;
      const next = finishBinyanRound(current, firstCorrect);
      save(next);
      setReport({ correct: firstCorrect, advanced: next.set > current.set });
      setRound(null);
      setPicked(null);
      setLocked(false);
      return;
    }
    setIndex((value) => value + 1);
    setChoices(binyanChoices(round[index + 1], mode, open));
    setPicked(null);
    setLocked(false);
  }

  if (!round || !mode || !card) {
    return <Home open={open} cards={cards} report={report} onBegin={begin} />;
  }

  const prompt = binyanPrompt(card, mode);
  const right = picked ? choiceMatches(card, picked, mode) : false;
  const done = index + 1 >= round.length;

  return (
    <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        {index + 1} of {BINYAN_ROUND}
      </p>
      <p className="mt-2 text-sm text-muted">{prompt.line}</p>
      <p className="he-word mt-4 text-center font-hebrew text-5xl leading-tight text-ink" dir="rtl" lang="he">
        {prompt.hebrew}
      </p>
      <div className="mt-5 grid gap-2">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            disabled={locked}
            onClick={() => answer(choice)}
            className="min-h-14 rounded-[var(--radius-lg)] bg-parchment px-3 text-lg text-ink disabled:opacity-80"
          >
            <span className="font-hebrew" dir="rtl" lang="he">
              {choice.hebrew}
            </span>
            {mode !== "stem-verb" ? <span className="ml-2 font-sans text-base">{STEM_CARDS[choice.stem].en}</span> : null}
          </button>
        ))}
      </div>
      {picked ? (
        <div className="mt-5 grid gap-3">
          <GradeBanner ok={right} label={right ? "Correct" : "Not quite"} />
          {right ? null : (
            <>
              <p className="he-word text-center font-hebrew text-4xl leading-tight text-ink" dir="rtl" lang="he">
                {card.form}
              </p>
              <p className="text-center text-sm text-ink">{binyanClue(card)}</p>
            </>
          )}
          <Button type="button" className="w-full" onClick={nextCard}>
            {done ? "Round" : "Next"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function Home({
  open,
  cards,
  report,
  onBegin,
}: {
  open: StemId[];
  cards: BinyanCard[];
  report: { correct: number; advanced: boolean } | null;
  onBegin: (mode: BinyanMode) => void;
}) {
  return (
    <div className="grid gap-3">
      <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">Seven stems</h1>
        <p className="mt-3 max-w-prose text-muted">
          A strong form, then the stem. Qal, Piel, and Hiphil first. A round is ten. Nine first answers open the next
          stems. A miss says Not quite, and only then shows the mark. This does not lock a level.
        </p>
        {report === null ? null : (
          <p className="mt-3 text-sm text-ink">
            {report.correct} of {BINYAN_ROUND}. {report.advanced ? "The next stems are open." : "Same stems again."}
          </p>
        )}
      </section>
      <div className="grid gap-2">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onBegin(item.id)}
            className="rounded-[var(--radius-xl)] bg-card p-4 text-left text-ink shadow-[var(--shadow-border)]"
          >
            <span className="font-display text-xl font-bold">{item.title}</span>
            <span className="mt-1 block text-sm text-muted">{item.line}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        {open.map((stem) => {
          const face = STEM_CARDS[stem];
          const examples = stemExamples(stem, cards);
          return (
            <section key={stem} className="rounded-[var(--radius-xl)] bg-card p-4 shadow-[var(--shadow-border)]">
              <p className="font-display text-2xl font-bold text-ink">
                {face.en}{" "}
                <span className="font-hebrew" dir="rtl" lang="he">
                  {face.he}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted">{face.meaning}</p>
              <ul className="mt-3 grid gap-2">
                {examples.map((card) => (
                  <li key={card.id} className="text-sm text-ink">
                    <span className="font-hebrew text-xl" dir="rtl" lang="he">
                      {card.form}
                    </span>
                    <span className="ml-2 text-muted">{binyanClue(card)}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
