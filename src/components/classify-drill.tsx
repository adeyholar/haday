import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { findHitRange } from "@/lib/hebrew";
import { cn } from "@/lib/cn";
import { drawRound, ROUND_LEN } from "@/lib/quiz-draw";
import {
  answerLabel,
  itemsForKind,
  liveClassify,
  parseClassifyInput,
  formatClassifyRef,
  type ClassifyAnswer,
  type ClassifyItem,
  type ClassifyKind,
} from "@/lib/classify";

type Phase = "ask" | "retry" | "lead" | "done";

export function ClassifyDrill({ kind }: { kind: ClassifyKind }) {
  const [seed, setSeed] = useState(0);
  const deck = useMemo(
    () => drawRound(itemsForKind(kind), ROUND_LEN, `classify:${kind}`, (item) => item.id),
    [kind, seed],
  );
  return <Round key={`${kind}-${seed}`} kind={kind} deck={deck} onAgain={() => setSeed((n) => n + 1)} />;
}

function Round({
  kind,
  deck,
  onAgain,
}: {
  kind: ClassifyKind;
  deck: ClassifyItem[];
  onAgain: () => void;
}) {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("ask");
  const [ok, setOk] = useState(false);
  const [picked, setPicked] = useState<ClassifyAnswer | null>(null);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const lastTap = useRef(0);

  const item = deck[i];
  const revealed = phase === "done";
  const live = item ? liveClassify(item, typed) : "empty";

  function reset() {
    setTyped("");
    setPhase("ask");
    setOk(false);
    setPicked(null);
    lastTap.current = 0;
  }

  function grade(choice: ClassifyAnswer) {
    if (!item || revealed) return;
    const now = Date.now();
    if (choice === picked && choice !== item.answer && now - lastTap.current < 400) return;
    lastTap.current = now;
    const hit = choice === item.answer;
    if (hit) {
      setPicked(choice);
      setOk(true);
      setPhase("done");
      setScore((s) => ({ ...s, right: s.right + 1 }));
      return;
    }
    if (phase === "ask") {
      setPicked(choice);
      setPhase("retry");
      return;
    }
    if (phase === "retry") {
      setPicked(choice);
      setPhase("lead");
      return;
    }
    setPicked(choice);
    setOk(false);
    setPhase("done");
    setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
  }

  function submitType() {
    if (!item || revealed) return;
    const parsed = parseClassifyInput(kind, typed);
    if (!parsed) return;
    grade(parsed);
  }

  function next() {
    reset();
    setI((n) => n + 1);
  }

  if (!item) {
    const total = score.right + score.wrong;
    return (
      <div className="rounded-[var(--radius-xl)] bg-card p-8 text-center shadow-[var(--shadow-border)]">
        <h2 className="font-display text-3xl font-semibold">Round complete</h2>
        <p className="mt-2 font-display text-4xl tabular-nums">
          {score.right}
          <span className="text-xl text-muted"> / {total}</span>
        </p>
        <Button className="mt-6" onClick={onAgain}>
          New round
        </Button>
      </div>
    );
  }

  const options: { id: ClassifyAnswer; label: string; hint: string }[] =
    kind === "shewa"
      ? [
          { id: "vocal", label: "Vocal", hint: "murmur vowel · shewa na" },
          { id: "silent", label: "Silent", hint: "no sound · shewa nach" },
        ]
      : [
          { id: "qamets", label: "Qamets", hint: "long ā · father" },
          { id: "hatuf", label: "Qamets hatuf", hint: "short o · bottle" },
        ];

  return (
    <>
      <p className="mb-3 text-sm font-medium tabular-nums text-ink">
        {i + 1} / {deck.length} · {score.right} correct
      </p>

      <div className="rounded-[var(--radius-xl)] bg-card px-5 py-8 text-center shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
          {kind === "shewa" ? "Vocal or silent shewa" : "Qamets or qamets hatuf"}
        </p>
        <p className="mx-auto mt-2 max-w-prose text-sm text-muted">
          {kind === "shewa"
            ? "Ask: is it first in the word, under dagesh forte, or after an unaccented long vowel? Or after a short vowel, first of two, or last in the word?"
            : "Hatuf (short o) lives only in a closed, unaccented syllable. Long ā prefers open pretonic or closed accented."}
        </p>
        <p className="he-word mt-4 text-6xl leading-tight sm:text-7xl" lang="he">
          <Highlighted word={item.word} hit={item.hit} />
        </p>
        <p className="mt-3 text-sm font-medium text-ink">{item.markOn}</p>
        {revealed && <p className="mt-1 text-sm text-muted">{item.gloss}</p>}
      </div>

      <form
        className="mt-4 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (revealed) next();
          else submitType();
        }}
      >
        <label className="grid gap-1 text-sm font-medium text-ink">
          Type the answer
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={revealed}
            className={cn(
              "h-12 w-full rounded-[var(--radius-md)] bg-card px-3 font-medium text-ink shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              live === "match" && "ring-2 ring-good",
              live === "off" && "ring-2 ring-danger",
            )}
            placeholder={kind === "shewa" ? "vocal or silent" : "qamets or hatuf"}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        {!revealed && live !== "empty" && (
          <p
            className={cn(
              "text-sm font-medium",
              live === "match" && "text-good",
              live === "off" && "text-danger",
              live === "prefix" && "text-muted",
            )}
          >
            {live === "match"
              ? "Looks right — check, or tap the matching button."
              : live === "off"
                ? "That reads as the other choice."
                : "Keep typing — vocal / silent, or qamets / hatuf."}
          </p>
        )}

        <ul className="grid grid-cols-2 gap-2">
          {options.map((o) => {
            const chosen = picked === o.id;
            const isAnswer = o.id === item.answer;
            const failNow = chosen && !isAnswer && !revealed;
            const showRight = revealed && isAnswer;
            const showWrong = revealed && chosen && !isAnswer;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  disabled={revealed}
                  onClick={() => grade(o.id)}
                  className={cn(
                    "flex min-h-16 w-full flex-col items-center justify-center rounded-[var(--radius-md)] px-3 py-3 shadow-[var(--shadow-border)]",
                    !failNow && !showRight && !showWrong && "bg-card",
                    failNow && "bg-danger text-parchment",
                    showRight && "bg-good text-parchment",
                    showWrong && "bg-danger text-parchment",
                    revealed && !chosen && !isAnswer && "bg-card text-muted",
                  )}
                >
                  <span className="text-base font-semibold">{o.label}</span>
                  <span className={cn("text-xs", failNow || showRight || showWrong ? "opacity-80" : "text-muted")}>
                    {o.hint}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {phase === "retry" && (
          <p className="try-flash mt-1 text-center text-xl font-bold uppercase tracking-wide text-danger sm:text-2xl">
            One more try
          </p>
        )}

        {phase === "lead" && (
          <div className="rounded-[var(--radius-md)] bg-danger/10 px-4 py-3 text-start">
            <p className="try-flash text-center text-xl font-bold uppercase tracking-wide text-danger">
              Think it through
            </p>
            <p className="mt-2 text-sm font-medium text-ink">{item.lead}</p>
            <p className="mt-1 text-xs text-muted">Answer again from the question — then we will tell you.</p>
          </div>
        )}

        {revealed && <Result item={item} ok={ok} />}

        {(revealed || parseClassifyInput(kind, typed)) && (
          <Button type="submit" size="lg" className="w-full">
            {revealed ? "Next" : "Check typed answer"}
          </Button>
        )}
      </form>
    </>
  );
}

function Result({ item, ok }: { item: ClassifyItem; ok: boolean }) {
  return (
    <div className={cn("rounded-[var(--radius-lg)] px-4 py-4 text-start", ok ? "bg-good/15" : "bg-danger/10")}>
      <p
        className={cn(
          "font-display text-3xl font-bold",
          ok ? "applause text-good" : "text-danger",
        )}
      >
        {ok ? "Correct" : "It is " + answerLabel(item)}
      </p>
      {ok && <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-good">{answerLabel(item)}</p>}
      <p className="mt-2 he-word text-xl" lang="he">
        {item.syllables}
      </p>
      <p className="mt-2 text-sm font-medium text-ink">{item.why}</p>
      <figure className="mt-3 border-t border-border pt-3">
        <figcaption className="text-xs font-semibold uppercase tracking-wide text-muted">
          Tanakh · {formatClassifyRef(item)}
        </figcaption>
        <p className="he-word mt-2 text-xl leading-relaxed" lang="he">
          <Highlighted word={item.he} hit={item.verseHit} />
        </p>
        <p className="mt-1 text-sm text-muted">{item.en}</p>
      </figure>
    </div>
  );
}

function Highlighted({ word, hit }: { word: string; hit: string }) {
  const range = findHitRange(word, hit);
  if (!range) return <>{word}</>;
  return (
    <>
      {word.slice(0, range.start)}
      <mark className="he-hit">{word.slice(range.start, range.end)}</mark>
      {word.slice(range.end)}
    </>
  );
}

