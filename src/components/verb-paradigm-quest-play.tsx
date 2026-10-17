import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HebrewType } from "@/components/hebrew-type";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { speakHebrewWord } from "@/lib/listen";
import { useStudy } from "@/lib/store";
import { shuffle } from "@/lib/vocab";
import {
  PGN_ORDER,
  QATAL,
  gradeVerb,
  qalPerfect,
  recordVerbQuest,
  redFrom,
  splitClusters,
  stepToward,
  transferRoots,
  type Pgn,
  type VerbForm,
  type VerbRoot,
} from "@/lib/verb-paradigm-quest";

const LEVELS = [
  { id: 1, name: "Endings", hint: "The stem is written. Add the ending, and the accent or the meteg." },
  { id: 2, name: "Build the verb", hint: "The root is קטל. Type the whole form. Every mark counts." },
  { id: 3, name: "Read it", hint: "The form is written. Name who did it." },
  { id: 4, name: "New roots", hint: "Same pattern, a class verb." },
] as const;

function Pointed({ form, pgn, className }: { form: string; pgn: Pgn; className?: string }) {
  const parts = splitClusters(form);
  const cut = redFrom(pgn, parts.length);
  return (
    <span className={cn("he-word", className)} dir="rtl" lang="he">
      {parts.map((part, i) => (
        <span key={`${part}-${i}`} className={i >= cut ? "text-danger" : undefined}>
          {part}
        </span>
      ))}
    </span>
  );
}

function toggleMark(cluster: string, mark: string) {
  const parts = [...cluster];
  const next = parts.includes(mark) ? parts.filter((ch) => ch !== mark) : [...parts, mark];
  return next.join("");
}

export function VerbQuestHome() {
  const quest = useStudy((s) => s.game.verbParadigmQuest);
  const [level, setLevel] = useState(0);
  const roots = useMemo(() => transferRoots(), []);
  const [rootAt, setRootAt] = useState(0);
  const root = level === 4 ? (roots[rootAt % Math.max(roots.length, 1)] ?? QATAL) : QATAL;

  if (!level) {
    return (
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar · Qal perfect</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Verb paradigm</h1>
        <p className="mt-3 text-sm text-muted">
          The root is given. You build the stem, the ending, and the person. A missing vowel, dagesh, shin dot, accent, or meteg is a wrong word.
        </p>
        <ul className="mt-4 grid gap-2">
          {LEVELS.map((row) => {
            const open = row.id <= quest.unlocked;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  disabled={!open}
                  onClick={() => setLevel(row.id)}
                  className="w-full rounded-[var(--radius-md)] bg-card px-4 py-3 text-left shadow-[var(--shadow-border)] disabled:opacity-40"
                >
                  <span className="font-semibold text-ink">
                    {row.id}. {row.name}
                  </span>
                  {quest.cleared[row.id] ? <span className="ml-2 text-sm text-good">Cleared</span> : null}
                  <span className="mt-1 block text-sm text-muted">{open ? row.hint : "90% on the previous level opens this."}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>
    );
  }

  return (
    <VerbQuestSitting
      level={level}
      root={root}
      onExit={() => setLevel(0)}
      onAgain={() => setRootAt((n) => n + 1)}
    />
  );
}

function VerbQuestSitting({
  level,
  root,
  onExit,
  onAgain,
}: {
  level: number;
  root: VerbRoot;
  onExit: () => void;
  onAgain: () => void;
}) {
  const save = useStudy((s) => s.saveVerbQuest);
  const forms = useMemo(() => qalPerfect(root), [root]);
  const byPgn = useMemo(() => Object.fromEntries(forms.map((row) => [row.pgn, row])) as Record<Pgn, VerbForm>, [forms]);
  const [queue, setQueue] = useState<Pgn[]>(() => shuffle([...PGN_ORDER]));
  const [returned, setReturned] = useState<Partial<Record<Pgn, boolean>>>({});
  const [outcome, setOutcome] = useState<Partial<Record<Pgn, "clean" | "miss">>>({});
  const [filled, setFilled] = useState<Partial<Record<Pgn, boolean>>>({});
  const [ending, setEnding] = useState("");
  const [built, setBuilt] = useState("");
  const [stem, setStem] = useState<string[]>([]);
  const [picked, setPicked] = useState<number>(0);
  const [choice, setChoice] = useState<Pgn | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [nudge, setNudge] = useState(false);
  const [helped, setHelped] = useState(false);
  const [tries, setTries] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [donePct, setDonePct] = useState<number | null>(null);
  const hear = useRef({ stop: false });
  const pgn = queue[0];
  const card = pgn ? byPgn[pgn] : null;

  useEffect(() => {
    setQueue(shuffle([...PGN_ORDER]));
    setReturned({});
    setOutcome({});
    setFilled({});
    setDonePct(null);
  }, [level, root.id]);

  useEffect(() => {
    if (!card) return;
    setEnding("");
    setBuilt("");
    setStem(splitClusters(card.stem));
    setPicked(card.pgn === "3fs" || card.pgn === "3cp" ? 0 : 1);
    setChoice(null);
    setLines([]);
    setNudge(false);
    setHelped(false);
    setTries(0);
    setRevealed(false);
    hear.current.stop = true;
    hear.current = { stop: false };
  }, [card]);

  function speak(row: VerbForm) {
    void speakHebrewWord(
      {
        id: `vpq-qal-pf-${root.id}-${row.pgn}`,
        hebrew: row.form,
        translit: "",
        gloss: row.gloss,
        alts: [],
        pos: "verb",
        chapter: 12,
        freq: 0,
      },
      0.9,
      hear.current,
    );
  }

  function finishCard(row: VerbForm, clean: boolean) {
    const nextOutcome = outcome[row.pgn] ?? (clean ? "clean" : "miss");
    const outcomes = { ...outcome, [row.pgn]: nextOutcome };
    const back = !clean && !returned[row.pgn];
    const rest = queue.slice(1);
    const nextQueue = back ? [...rest, row.pgn] : rest;
    setOutcome(outcomes);
    setFilled((prev) => ({ ...prev, [row.pgn]: true }));
    setReturned((prev) => (back ? { ...prev, [row.pgn]: true } : prev));
    setQueue(nextQueue);
    if (clean) speak(row);
    if (!nextQueue.length) {
      const cleans = PGN_ORDER.filter((id) => outcomes[id] === "clean").length;
      const pct = Math.round((cleans / PGN_ORDER.length) * 100);
      setDonePct(pct);
      save(recordVerbQuest(useStudy.getState().game.verbParadigmQuest, level, pct, level === 2 || level === 4 ? root.id : null));
    }
  }

  function currentAnswer() {
    if (!card) return "";
    if (level === 2 || level === 4) return built;
    return stem.join("") + ending;
  }

  function checkBuild() {
    if (!card) return;
    if (level === 1 && card.pgn === "3ms" && ending.trim()) {
      setLines(["3ms has no ending. The bare stem is the form."]);
      setTries(1);
      return;
    }
    const graded = gradeVerb(currentAnswer(), card.form, card.pgn, root.letters[1]);
    if (graded.correct) {
      finishCard(card, !helped);
      return;
    }
    if (graded.nudge && !nudge) {
      setNudge(true);
      setLines(graded.lines);
      return;
    }
    if (graded.nudge && nudge) {
      const placed = stepToward(currentAnswer(), card.form);
      if (level === 2 || level === 4) setBuilt(placed);
      else {
        const parts = splitClusters(placed);
        const stemCount = splitClusters(card.stem).length;
        setStem(parts.slice(0, stemCount));
        setEnding(parts.slice(stemCount).join(""));
      }
      setHelped(true);
      setLines([...graded.lines, "The mark is in place. Check again."]);
      return;
    }
    if (tries < 1) {
      setTries(1);
      setLines(graded.lines);
      return;
    }
    setLines([card.hook]);
    setHelped(true);
    setRevealed(true);
  }

  function showNext() {
    if (!card) return;
    const next = stepToward(currentAnswer(), card.form);
    if (level === 2 || level === 4) setBuilt(next);
    else {
      const parts = splitClusters(next);
      const stemCount = splitClusters(card.stem).length;
      setStem(parts.slice(0, stemCount));
      setEnding(parts.slice(stemCount).join(""));
    }
    setHelped(true);
  }

  if (donePct != null) {
    const cleared = donePct >= 90;
    return (
      <Panel className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{LEVELS[level - 1]?.name}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">{cleared ? "Paradigm sealed" : "Not yet"}</h1>
        <p className="mt-2 text-sm text-muted">{donePct}% clean on the first answer. 90% opens the next.</p>
        <div className="mt-4">
          <Board forms={forms} filled={Object.fromEntries(PGN_ORDER.map((id) => [id, true]))} active={null} />
        </div>
        <div className="mt-6 flex flex-col gap-2">
          {level === 4 ? (
            <Button onClick={onAgain}>Another root</Button>
          ) : null}
          <Button variant="outline" onClick={onExit}>
            Levels
          </Button>
        </div>
      </Panel>
    );
  }

  if (!card || !pgn) return null;
  const building = level === 1 || level === 2 || level === 4;

  return (
    <div>
      <Panel className="mb-4">
        <button type="button" onClick={onExit} className="text-sm font-medium text-primary">
          Levels
        </button>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {LEVELS[level - 1]?.name} · {queue.length} left
        </p>
        <div className="mt-3 flex items-center justify-between gap-3" dir="rtl">
          {root.letters.map((letter, i) => (
            <span key={`${letter}-${i}`} className="he-word flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-card text-3xl shadow-[var(--shadow-border)]">
              {letter}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm font-semibold text-ink" dir="ltr">
          Qal · Perfect · {pgn}
        </p>
        {level < 3 ? <p className="text-sm text-muted">{card.gloss}</p> : null}
      </Panel>

      <Board forms={forms} filled={filled} active={pgn} />

      {level === 3 ? (
        <div className="mt-4">
          <p className="text-center">
            <Pointed form={card.form} pgn={card.pgn} className="text-5xl" />
          </p>
          <ul className="mt-4 grid grid-cols-3 gap-2">
            {PGN_ORDER.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    setChoice(id);
                    if (id === card.pgn) finishCard(card, !helped);
                    else {
                      setHelped(true);
                      setLines([`That is ${id}. This form is ${card.pgn}: ${card.gloss}.`]);
                    }
                  }}
                  className={cn(
                    "min-h-12 w-full rounded-[var(--radius-md)] bg-card text-sm font-semibold shadow-[var(--shadow-border)]",
                    choice === id && id === card.pgn && "bg-good text-parchment",
                    choice === id && id !== card.pgn && "bg-danger text-parchment",
                  )}
                >
                  {id}
                </button>
              </li>
            ))}
          </ul>
          {lines.length ? <Feedback lines={lines} nudge={false} /> : null}
          {choice && choice !== card.pgn ? (
            <Button className="mt-3 w-full" onClick={() => finishCard(card, false)}>
              Next
            </Button>
          ) : null}
        </div>
      ) : null}

      {building ? (
        <div className="mt-4">
          {level === 1 ? (
            <div className="mb-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Stem · tap a letter, then Accent or Meteg</p>
              <div className="mt-2 flex justify-center gap-2" dir="rtl">
                {stem.map((part, i) => (
                  <button
                    key={`${part}-${i}`}
                    type="button"
                    onClick={() => setPicked(i)}
                    className={cn(
                      "he-word min-h-14 min-w-14 rounded-[var(--radius-md)] bg-card px-2 text-4xl shadow-[var(--shadow-border)]",
                      picked === i && "ring-2 ring-primary",
                    )}
                  >
                    {part}
                  </button>
                ))}
                <span className="he-word text-4xl text-danger">{ending}</span>
              </div>
            </div>
          ) : null}
          {level === 1 && card.pgn === "3ms" ? (
            <Button className="w-full" onClick={checkBuild}>
              No ending
            </Button>
          ) : (
            <HebrewType
              value={level === 1 ? ending : built}
              onChange={level === 1 ? setEnding : setBuilt}
              target={card.form}
              liveGrade={false}
              hideHint
              extraMarks
              hideVowelLetters
              markBackspace
              onSpecialMark={
                level === 1
                  ? (mark) => {
                      setStem((prev) => prev.map((part, i) => (i === picked ? toggleMark(part, mark) : part)));
                      return true;
                    }
                  : undefined
              }
            />
          )}
          {revealed ? (
            <p className="mt-3 text-center">
              <Pointed form={card.form} pgn={card.pgn} className="text-4xl" />
            </p>
          ) : null}
          {lines.length ? <Feedback lines={lines} nudge={nudge && !helped} /> : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {revealed ? (
              <Button className="col-span-2" onClick={() => finishCard(card, false)}>
                Next
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={showNext}>
                  Show me
                </Button>
                <Button onClick={checkBuild}>Check</Button>
              </>
            )}
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm">
        <Link to="/lessons/$track/$unit" params={{ track: "verbs", unit: "3" }} className="font-medium text-primary">
          Perfect endings lesson
        </Link>
      </p>
    </div>
  );
}

function Feedback({ lines, nudge }: { lines: string[]; nudge: boolean }) {
  return (
    <div className={cn("mt-3 rounded-[var(--radius-md)] px-3 py-2 text-sm", nudge ? "bg-card text-ink" : "bg-card text-ink")}>
      {lines.map((line) => (
        <p key={line} className={nudge ? "font-medium" : undefined}>
          {line}
        </p>
      ))}
    </div>
  );
}

function Board({
  forms,
  filled,
  active,
}: {
  forms: VerbForm[];
  filled: Partial<Record<Pgn, boolean>>;
  active: Pgn | null;
}) {
  return (
    <ol className="grid grid-cols-3 gap-2">
      {forms.map((row) => (
        <li
          key={row.pgn}
          className={cn(
            "min-h-16 rounded-[var(--radius-md)] bg-card px-1 py-2 text-center shadow-[var(--shadow-border)]",
            active === row.pgn && "ring-2 ring-primary",
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{row.pgn}</p>
          {filled[row.pgn] ? <Pointed form={row.form} pgn={row.pgn} className="text-xl" /> : <p className="mt-2 text-sm text-muted">·</p>}
        </li>
      ))}
    </ol>
  );
}
