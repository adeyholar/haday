import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  checkCanSkip,
  drawCheck,
  gradedLine,
  type CheckItem,
  type GradedLine,
} from "@/lib/paradigms/check";
import { resultsLines } from "@/lib/paradigms/present";
import type { LevelId } from "@/lib/paradigms/types";

type Phase = "intro" | "item" | "results";

export function ParadigmCheck({
  lessonKey,
  level,
  boxes,
  onSkip,
  onAnswer,
  onDone,
}: {
  lessonKey: string;
  level: LevelId;
  boxes: Record<string, number>;
  onSkip: (itemId: string | null) => void;
  onAnswer: (cellId: string, correct: boolean) => void;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [items, setItems] = useState<CheckItem[]>([]);
  const [index, setIndex] = useState(0);
  const [lines, setLines] = useState<GradedLine[]>([]);
  const [typed, setTyped] = useState("");

  function finish(next: GradedLine[]) {
    setLines(next);
    setPhase("results");
  }

  function advance(nextLines: GradedLine[]) {
    if (index + 1 >= items.length) finish(nextLines);
    else {
      setLines(nextLines);
      setIndex(index + 1);
      setTyped("");
    }
  }

  function skipIntro() {
    if (!checkCanSkip("intro")) return;
    onSkip(null);
    onDone();
  }

  function begin() {
    const drawn = drawCheck({ levelId: level, boxes });
    if (drawn.length === 0) {
      onDone();
      return;
    }
    setItems(drawn);
    setIndex(0);
    setPhase("item");
  }

  const item = items[index];

  function skipItem() {
    if (!item || !checkCanSkip("item")) return;
    onSkip(`${lessonKey}:${item.id}`);
    advance(lines);
  }

  function commit(answer: string) {
    if (!item) return;
    const line = gradedLine(item, answer);
    onAnswer(item.cellId, line.correct);
    advance([...lines, line]);
  }

  if (phase === "intro") {
    return (
      <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Paradigm check</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-ink">{level}</h2>
        <p className="mt-2 text-sm text-muted">A few forms before the lesson. Skip any time. A skip is not a miss.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button type="button" onClick={begin}>
            Begin
          </Button>
          {checkCanSkip("intro") ? (
            <Button type="button" variant="outline" onClick={skipIntro}>
              Skip
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  if (phase === "results") {
    const rows = resultsLines(lines);
    return (
      <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <ul className="flex flex-col gap-3">
          {rows.map((row, at) => (
            <li key={`${row.right}-${at}`} className="text-2xl" lang="he" dir="rtl">
              <span className="he-word">{row.theirs}</span>
              <span aria-hidden="true"> · </span>
              <span className="he-word">{row.right}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="mt-4 min-h-11 text-2xl font-semibold text-primary" aria-label="Continue" onClick={onDone}>
          →
        </button>
      </section>
    );
  }

  if (!item) return null;

  return (
    <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {index + 1} / {items.length}
        </p>
        {checkCanSkip("item") ? (
          <Button type="button" variant="ghost" onClick={skipItem}>
            Skip
          </Button>
        ) : null}
      </div>
      <CheckPrompt item={item} typed={typed} onTyped={setTyped} onCommit={commit} />
    </section>
  );
}

function CheckPrompt({
  item,
  typed,
  onTyped,
  onCommit,
}: {
  item: CheckItem;
  typed: string;
  onTyped: (value: string) => void;
  onCommit: (answer: string) => void;
}) {
  switch (item.kind) {
    case "parse":
      return (
        <div>
          <p className="he-word mt-4 text-center text-5xl text-ink" lang="he" dir="rtl">
            {item.prompt}
          </p>
          <p className="mt-2 text-center text-sm text-muted">{item.ref}</p>
          <div className="mt-4 flex flex-col gap-2">
            {item.choices.map((choice) => (
              <Button key={choice.cellId} type="button" variant="outline" onClick={() => onCommit(choice.cellId)}>
                {choice.label}
              </Button>
            ))}
          </div>
        </div>
      );
    case "fill":
      return (
        <div>
      <p className="mt-4 text-lg font-semibold text-ink">{item.label}</p>
      <div className="mt-4 flex flex-col gap-2">
        {item.choices.map((form) => (
          <button
            key={form}
            type="button"
            className="he-word min-h-11 rounded-[var(--radius-md)] bg-surface px-3 text-2xl text-ink"
            lang="he"
            dir="rtl"
            onClick={() => onCommit(form)}
          >
            {form}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-sm text-muted">
        Or type the form
        <input
          value={typed}
          onChange={(event) => onTyped(event.target.value)}
          className="he-word mt-1 w-full min-h-11 rounded-[var(--radius-md)] bg-surface px-3 text-2xl text-ink"
          lang="he"
          dir="rtl"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>
      <Button type="button" className="mt-3" onClick={() => onCommit(typed)} disabled={!typed.trim()}>
        Check
      </Button>
    </div>
      );
    default: {
      const unexpected: never = item;
      return unexpected;
    }
  }
}
