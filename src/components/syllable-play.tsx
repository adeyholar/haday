import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GradeBanner } from "@/components/grade-banner";
import { DontKnowButton } from "@/components/dont-know-button";
import { Panel } from "@/components/panel";
import { TanakhLearnVerse } from "@/components/tanakh-learn-verse";
import { playGrade } from "@/lib/sfx";
import { cn } from "@/lib/cn";
import {
  shuffleQuiz,
  syllableUnit,
  syllableQuizPool,
  starsFromSyllableScore,
  SYLLABLE_QUIZ_LEN,
  type SyllableQuiz,
} from "@/lib/syllables";
import { useStudy } from "@/lib/store";
import { GAME_STAGE_PASS } from "@/lib/game";

type PlayQ = SyllableQuiz & { key: string; retry?: boolean };

function MixHe({ text, className }: { text: string; className?: string }) {
  const re = /[\u0590-\u05FF]+/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(
      <span key={`he-${i++}`} className="he-word" dir="rtl" lang="he">
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <span className={className}>{nodes}</span>;
}

function SplitWord({ split, size = "lg" }: { split: string; size?: "lg" | "sm" }) {
  const parts = split.split(" | ").filter(Boolean);
  const large = size === "lg";
  if (parts.length < 2) {
    return (
      <span className={cn("he-word", large ? "text-3xl text-primary" : "text-lg")} dir="rtl">
        {split}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "he-word inline-flex items-center justify-start gap-2",
        large ? "text-3xl text-primary" : "text-lg",
      )}
      dir="rtl"
    >
      {parts.flatMap((part, i) => [
        i > 0 ? (
          <span
            key={`bar-${i}`}
            className="inline-block h-[1.05em] w-0.5 shrink-0 self-center rounded-full bg-current"
            aria-hidden
          />
        ) : null,
        <span key={`p-${i}`}>{part}</span>,
      ])}
    </span>
  );
}

export function SyllablePlay({ unitId }: { unitId: number }) {
  const unit = syllableUnit(unitId);
  const complete = useStudy((s) => s.completeSyllableUnit);
  const [step, setStep] = useState<"learn" | "quiz">("learn");
  const [items, setItems] = useState<PlayQ[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState(false);

  const q = items[i];
  const unique = items.filter((x) => !x.retry).length || items.length;
  const pct = useMemo(() => (unique ? Math.round((right / unique) * 100) : 0), [right, unique]);

  function shuffleIn<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let n = a.length - 1; n > 0; n--) {
      const j = Math.floor(Math.random() * (n + 1));
      [a[n], a[j]] = [a[j], a[n]];
    }
    return a;
  }

  function startQuiz() {
    if (!unit) return;
    const built = shuffleQuiz(unit).map((item, n) => ({ ...item, key: `${unitId}-${n}` }));
    setItems(built);
    setI(0);
    setPicked(null);
    setRight(0);
    setDone(false);
    setStep("quiz");
  }

  function pick(choice: string) {
    if (!q || picked) return;
    const ok = choice === q.answer;
    setPicked(choice);
    if (ok) setRight((n) => n + 1);
    playGrade(ok);
  }

  function admitNoIdea() {
    if (!q || picked) return;
    setPicked("__noidea__");
    playGrade(false);
  }

  function next() {
    if (!picked || !q) return;
    const ok = picked === q.answer;
    let nextItems = items;
    if (!ok && !q.retry) {
      const later: PlayQ = { ...q, key: `${q.key}-retry`, retry: true, choices: shuffleIn(q.choices) };
      const insertAt = Math.min(items.length, i + 2 + Math.floor(Math.random() * 3));
      nextItems = [...items.slice(0, insertAt), later, ...items.slice(insertAt)];
      setItems(nextItems);
    }
    if (i + 1 >= nextItems.length) {
      const orig = nextItems.filter((x) => !x.retry).length || nextItems.length;
      const finalPct = Math.round((right / orig) * 100);
      complete(unitId, {
        stars: starsFromSyllableScore(finalPct),
        score: finalPct,
        firstTryRate: right / orig,
      });
      setDone(true);
      return;
    }
    setI((n) => n + 1);
    setPicked(null);
  }

  if (!unit) {
    return (
      <Panel>
        <p className="text-muted">That unit is missing.</p>
        <Link to="/game/syllables" className="mt-3 inline-block font-semibold text-primary">
          Back to syllables
        </Link>
      </Panel>
    );
  }

  if (step === "learn") {
    return (
      <>
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Unit {unit.id} · Learn
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">{unit.title}</h1>
          <p className="mt-3 max-w-prose text-ink">
            <MixHe text={unit.rule} />
          </p>
        </Panel>
        <Panel className="mt-3">
          <h2 className="font-display text-xl font-bold text-ink">Tanakh words</h2>
          <ul className="mt-3 space-y-3">
            {unit.samples.map((s) => (
              <li key={s.word} className="rounded-[var(--radius-md)] bg-surface px-3 py-3">
                <p>
                  <SplitWord split={s.split} />
                </p>
                <p className="he-word mt-1 text-lg text-muted" dir="rtl">
                  {s.word}
                </p>
                <p className="mt-1 text-sm text-muted">
                  <MixHe text={s.note} />
                </p>
                {s.ref ? <p className="mt-1 text-xs font-semibold text-muted">{s.ref}</p> : null}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="mt-3">
          <h2 className="font-display text-xl font-bold text-ink">In the Tanakh</h2>
          <p className="mt-1 text-sm text-muted">
            The hit word is marked. Under it: the citation lemma, the split, and why this form is here.
          </p>
          <ul className="mt-3 space-y-4">
            {unit.verses.map((v) => (
              <TanakhLearnVerse key={`${v.ref}-${v.hit}`} verse={v} kind="syllable" samples={unit.samples} />
            ))}
          </ul>
        </Panel>
        <Button className="mt-4 w-full" onClick={startQuiz}>
          Quiz this rule · {SYLLABLE_QUIZ_LEN} of {syllableQuizPool(unit).length}
        </Button>
      </>
    );
  }

  if (done) {
    const passed = pct >= GAME_STAGE_PASS;
    return (
      <Panel className="text-center">
        <p className="font-display text-4xl font-bold text-ink">{pct}%</p>
        <p className="mt-2 text-sm text-muted">
          {right} / {unique} · {passed ? "Unit cleared." : `Need ${GAME_STAGE_PASS}% to unlock the next unit.`}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {passed && unitId < 8 ? (
            <Link to="/game/syllables/$unit" params={{ unit: String(unitId + 1) }} className="block">
              <Button className="w-full">Next unit</Button>
            </Link>
          ) : null}
          <Button variant="outline" onClick={startQuiz}>
            Try the quiz again
          </Button>
          <Link to="/game/syllables" className="text-sm font-semibold text-primary">
            Syllable map
          </Link>
        </div>
      </Panel>
    );
  }

  if (!q) return null;
  const ok = picked === q.answer;
  const lastNow = i + 1 >= items.length && (ok || Boolean(q.retry));

  return (
    <>
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Unit {unit.id} · Quiz · {i + 1} / {items.length}
          {q.retry ? " · again" : ""}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink">
          <MixHe text={q.q} />
        </h1>
        {q.ref ? <p className="mt-1 text-xs font-semibold text-muted">{q.ref}</p> : null}
        {q.he ? (
          <p className="he-word mt-3 text-4xl" dir="rtl">
            {q.he}
          </p>
        ) : null}
      </Panel>
      <ul className="mt-3 space-y-2">
        {q.choices.map((c) => {
          const chosen = picked === c;
          const rightChoice = c === q.answer;
          return (
            <li key={c}>
              <button
                type="button"
                disabled={Boolean(picked)}
                onClick={() => pick(c)}
                className={cn(
                  "min-h-12 w-full rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium shadow-[var(--shadow-border)]",
                  !picked && "bg-card text-ink",
                  picked && rightChoice && "bg-good text-white",
                  picked && chosen && !rightChoice && "bg-bad text-white",
                  picked && !chosen && !rightChoice && "bg-card text-muted",
                )}
              >
                <span className={c.includes(" | ") ? undefined : "he-word"}>
                  {c.includes(" | ") ? <SplitWord split={c} size="sm" /> : c}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!picked && <DontKnowButton onClick={admitNoIdea} />}
      {picked && (
        <div className="mt-3">
          <GradeBanner ok={ok} />
          <p className="mt-2 text-sm text-muted">
            <MixHe text={q.why} />
          </p>
          {!ok && !q.retry ? (
            <p className="mt-1 text-sm text-muted">You will see this one again in a moment.</p>
          ) : null}
          <Button className="mt-3 w-full" onClick={next}>
            {lastNow ? "See score" : "Next"}
          </Button>
        </div>
      )}
    </>
  );
}
