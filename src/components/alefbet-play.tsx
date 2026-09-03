import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GradeBanner } from "@/components/grade-banner";
import { Panel } from "@/components/panel";
import { playGrade } from "@/lib/sfx";
import {
  ALEF_BET_COUNT,
  ALEF_BET_LEVELS,
  buildAlefBetRound,
  expectedLetter,
  neighborPrompt,
  shuffledLine,
  shuffledNames,
  starsFromRate,
  type AlefBetLevel,
  type AlefBetQuestion,
} from "@/lib/alefbet-game";
import { useStudy } from "@/lib/store";
import type { HebrewLetter } from "@/lib/alphabet";

function LetterPad({
  letters,
  disabled,
  onPick,
}: {
  letters: HebrewLetter[];
  disabled?: boolean;
  onPick: (letter: HebrewLetter) => void;
}) {
  return (
    <div dir="rtl" className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
      {letters.map((l) => (
        <button
          key={l.id + l.letter}
          type="button"
          disabled={disabled}
          onClick={() => onPick(l)}
          className="flex min-h-14 items-center justify-center rounded-[var(--radius-sm)] bg-card shadow-[var(--shadow-border)] disabled:opacity-40"
        >
          <span className="he-word text-3xl leading-none">{l.letter}</span>
        </button>
      ))}
    </div>
  );
}

function NamePad({
  letters,
  disabled,
  onPick,
}: {
  letters: HebrewLetter[];
  disabled?: boolean;
  onPick: (letter: HebrewLetter) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      {letters.map((l) => (
        <button
          key={l.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(l)}
          className="min-h-12 rounded-[var(--radius-sm)] bg-card px-2 text-sm font-semibold shadow-[var(--shadow-border)] disabled:opacity-40"
        >
          {l.name}
        </button>
      ))}
    </div>
  );
}

function NumberPad({ disabled, onPick }: { disabled?: boolean; onPick: (n: number) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
      {Array.from({ length: ALEF_BET_COUNT }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onPick(n)}
          className="min-h-12 rounded-[var(--radius-sm)] bg-card text-base font-semibold tabular-nums shadow-[var(--shadow-border)] disabled:opacity-40"
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function promptOf(q: AlefBetQuestion): { title: string; showHe?: string; showEn?: string } {
  if (q.kind === "name-of") return { title: `Letter ${q.index} of ${ALEF_BET_COUNT}. Name it.`, showHe: q.letter.letter };
  if (q.kind === "glyph-of") return { title: `Letter ${q.index} of ${ALEF_BET_COUNT}. Tap ${q.letter.name}.`, showEn: q.letter.name };
  if (q.kind === "number-of") return { title: "What number is this letter?", showHe: q.letter.letter };
  if (q.kind === "letter-of") return { title: `Which letter is number ${q.index}?` };
  return { title: neighborPrompt(q), showHe: q.letter.letter };
}

export function AlefBetPlay({ level }: { level: AlefBetLevel }) {
  const complete = useStudy((s) => s.completeAlefBetLevel);
  const meta = ALEF_BET_LEVELS[level - 1];
  const [round] = useState(() => buildAlefBetRound(level));
  const [pos, setPos] = useState(0);
  const [tries, setTries] = useState(0);
  const [firstHits, setFirstHits] = useState(0);
  const [done, setDone] = useState(0);
  const [grade, setGrade] = useState<null | boolean>(null);
  const [lock, setLock] = useState(false);
  const [keys, setKeys] = useState(() => shuffledLine());
  const [names, setNames] = useState(() => shuffledNames());
  const q = round[pos];
  const finished = pos >= round.length;
  const prompt = q ? promptOf(q) : null;

  const nextLevel = level < 3 ? level + 1 : null;

  function reshuffle() {
    setKeys(shuffledLine());
    setNames(shuffledNames());
  }

  function mark(ok: boolean) {
    if (lock || !q) return;
    playGrade(ok);
    setGrade(ok);
    if (!ok) {
      setTries((t) => t + 1);
      reshuffle();
      return;
    }
    const first = tries === 0;
    const hits = firstHits + (first ? 1 : 0);
    const answered = done + 1;
    setFirstHits(hits);
    setDone(answered);
    setLock(true);
    window.setTimeout(() => {
      const nextPos = pos + 1;
      if (nextPos >= round.length) {
        const rate = hits / round.length;
        complete(level, {
          stars: starsFromRate(rate),
          score: Math.round(rate * 100),
          firstTryRate: rate,
        });
      }
      setPos(nextPos);
      setTries(0);
      setGrade(null);
      setLock(false);
      reshuffle();
    }, 650);
  }

  function onLetter(letter: HebrewLetter) {
    if (!q) return;
    mark(letter.id === expectedLetter(q).id);
  }

  function onNumber(n: number) {
    if (!q) return;
    mark(n === q.index);
  }

  const score = round.length ? Math.round((firstHits / round.length) * 100) : 0;

  if (finished || pos >= round.length) {
    const rate = round.length ? firstHits / round.length : 0;
    const stars = starsFromRate(rate);
    return (
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{meta.title}</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Level cleared</h1>
        <p className="mt-3 font-display text-5xl font-bold tabular-nums text-ink">{score}%</p>
        <p className="mt-1 tracking-widest text-primary">{"★".repeat(stars)}</p>
        <p className="mt-3 text-sm text-muted">
          {firstHits} of {round.length} on the first tap. Keys shuffle every question so the place on the pad cannot
          give it away.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {nextLevel ? (
            <Link to="/game/alefbet/$level" params={{ level: String(nextLevel) }}>
              <Button className="w-full" size="lg">
                Next: {ALEF_BET_LEVELS[nextLevel - 1].title}
              </Button>
            </Link>
          ) : (
            <p className="text-sm font-semibold text-good">Aleph-bet mastery complete.</p>
          )}
          <Link to="/game/alefbet">
            <Button variant="outline" className="w-full" size="lg">
              Aleph-bet map
            </Button>
          </Link>
        </div>
      </Panel>
    );
  }

  const useLetterPad = q.kind === "glyph-of" || q.kind === "letter-of" || q.kind === "neighbor";
  const useNamePad = q.kind === "name-of";
  const useNumPad = q.kind === "number-of";

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {meta.title} · {pos + 1}/{round.length}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">{prompt?.title}</h1>
      </Panel>

      <div className="rounded-[var(--radius-xl)] bg-card px-5 py-8 text-center shadow-[var(--shadow-border)]">
        {prompt?.showHe ? <p className="he-word text-7xl sm:text-8xl">{prompt.showHe}</p> : null}
        {prompt?.showEn ? <p className="font-display text-4xl font-bold text-ink">{prompt.showEn}</p> : null}
        {q.kind === "letter-of" ? (
          <p className="font-display text-6xl font-bold tabular-nums text-ink">{q.index}</p>
        ) : null}
        {grade != null ? (
          <div className="mt-4">
            <GradeBanner ok={grade} />
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        {useLetterPad ? <LetterPad letters={keys} disabled={lock} onPick={onLetter} /> : null}
        {useNamePad ? <NamePad letters={names} disabled={lock} onPick={onLetter} /> : null}
        {useNumPad ? <NumberPad disabled={lock} onPick={onNumber} /> : null}
      </div>
    </>
  );
}
