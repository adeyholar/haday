import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HebrewType } from "@/components/hebrew-type";
import { Panel } from "@/components/panel";
import { QalPerfectBuilder } from "@/components/qal-perfect-builder";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { speakHebrewWord } from "@/lib/listen";
import { useStudy } from "@/lib/store";
import { shuffle } from "@/lib/vocab";
import {
  PGN_ORDER,
  QATAL,
  gradeVerb,
  firstAnswer,
  placeChosenMark,
  qalPerfect,
  questPercent,
  recordVerbQuest,
  redFrom,
  splitClusters,
  transferRoots,
  type Pgn,
  type VerbForm,
  type VerbRoot,
} from "@/lib/verb-paradigm-quest";

const LEVELS = [
  { id: 1, name: "Build from the root", hint: "Only the three letters are given. You add every vowel, the ending, the accent, and the meteg." },
  { id: 2, name: "Build it again", hint: "Same root. The screen still shows only the letters. Every mark counts." },
  { id: 3, name: "Read it", hint: "The form is written. Name who did it." },
  { id: 4, name: "New roots", hint: "A class verb. Still only the root letters. You add the vowels." },
] as const;

function Pointed({ form, pgn, className }: { form: string; pgn: Pgn; className?: string }) {
  const parts = splitClusters(form);
  const cut = redFrom(pgn, parts.length);
  return (
    <span className={cn("he-taam", className)} dir="rtl" lang="he">
      {parts.map((part, i) => (
        <span key={`${part}-${i}`} className={i >= cut ? "text-ocean" : undefined}>
          {part}
        </span>
      ))}
    </span>
  );
}

export function VerbQuestHome() {
  const quest = useStudy((s) => s.game.verbParadigmQuest);
  const [level, setLevel] = useState(0);
  const [builder, setBuilder] = useState(false);
  const roots = useMemo(() => transferRoots(), []);
  const [rootAt, setRootAt] = useState(0);
  const root = level === 4 ? (roots[rootAt % Math.max(roots.length, 1)] ?? QATAL) : QATAL;

  if (builder) {
    return (
      <div>
        <button type="button" onClick={() => setBuilder(false)} className="mb-4 text-sm font-medium text-primary">
          Levels
        </button>
        <QalPerfectBuilder />
      </div>
    );
  }

  if (!level) {
    return (
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar · Qal perfect</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Verb Paradigm Quest</h1>
        <p className="mt-3 text-sm text-muted">
          Only the root letters are on the screen. You add the vowels. The app does not write them on the root for you.
        </p>
        <p className="mt-2 text-sm text-muted">
          Every stem, not only the Qal perfect, is in the{" "}
          <Link to="/game/verbal-system" className="font-semibold text-primary">
            Verbal System
          </Link>
          .
        </p>
        <ul className="mt-4 grid gap-2">
          <li>
            <button
              type="button"
              onClick={() => setBuilder(true)}
              className="w-full rounded-[var(--radius-md)] bg-primary px-4 py-3 text-left text-primary-foreground"
            >
              <span className="font-semibold">Qal Perfect Builder</span>
              <span className="mt-1 block text-sm text-primary-foreground/80">
                All nine forms of one root. You choose the vowel under each root letter, and the ending.
              </span>
            </button>
          </li>
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
  const [log, setLog] = useState<boolean[]>([]);
  const [deal, setDeal] = useState(0);
  const [filled, setFilled] = useState<Partial<Record<Pgn, boolean>>>({});
  const [built, setBuilt] = useState("");
  const [choice, setChoice] = useState<Pgn | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [nudge, setNudge] = useState(false);
  const [helped, setHelped] = useState(false);
  const [tries, setTries] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [firstClean, setFirstClean] = useState<boolean | null>(null);
  const [donePct, setDonePct] = useState<number | null>(null);
  const hear = useRef({ stop: false });
  useEffect(() => {
    const signal = hear;
    return () => {
      signal.current.stop = true;
    };
  }, []);
  const pgn = queue[0];
  const card = pgn ? byPgn[pgn] : null;

  useEffect(() => {
    setQueue(shuffle([...PGN_ORDER]));
    setReturned({});
    setLog([]);
    setDeal(0);
    setFilled({});
    setDonePct(null);
  }, [level, root.id]);

  useEffect(() => {
    if (!card) return;
    setBuilt("");
    setChoice(null);
    setLines([]);
    setNudge(false);
    setHelped(false);
    setTries(0);
    setRevealed(false);
    setFirstClean(null);
  }, [card, deal]);

  function speak(row: VerbForm) {
    hear.current.stop = true;
    const signal = { stop: false };
    hear.current = signal;
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
      signal,
    );
  }

  function finishCard(row: VerbForm, clean: boolean) {
    const results = [...log, clean];
    const back = !clean && !returned[row.pgn];
    const rest = queue.slice(1);
    const nextQueue = back ? [...rest, row.pgn] : rest;
    setLog(results);
    setFilled((prev) => ({ ...prev, [row.pgn]: true }));
    setReturned((prev) => (back ? { ...prev, [row.pgn]: true } : prev));
    setDeal((n) => n + 1);
    setQueue(nextQueue);
    if (clean) speak(row);
    if (!nextQueue.length) {
      const pct = questPercent(results);
      setDonePct(pct);
      save(recordVerbQuest(useStudy.getState().game.verbParadigmQuest, level, pct, level === 2 || level === 4 ? root.id : null));
    }
  }

  function checkBuild() {
    if (!card) return;
    const graded = gradeVerb(built, card.form, card.pgn, root.letters[1]);
    const clean = firstAnswer(firstClean, graded.correct, helped);
    if (firstClean === null) setFirstClean(clean);
    if (graded.correct) {
      finishCard(card, clean);
      return;
    }
    if (graded.nudge && !nudge) {
      setNudge(true);
      setLines(graded.lines);
      return;
    }
    if (tries < 1 && !graded.nudge) {
      setTries(1);
      setLines(graded.lines);
      return;
    }
    setLines([card.hook]);
    setHelped(true);
    setRevealed(true);
  }

  if (donePct != null) {
    const cleared = donePct >= 90;
    return (
      <Panel className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{LEVELS[level - 1]?.name}</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">{cleared ? "Paradigm sealed" : "Not yet"}</h1>
        <p className="mt-2 text-sm text-muted">{donePct}% clean. 90% opens the next. A miss comes back once, and that card counts.</p>
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
                    const correct = id === card.pgn;
                    const clean = firstAnswer(firstClean, correct, helped);
                    if (firstClean === null) setFirstClean(clean);
                    if (correct) finishCard(card, clean);
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
          <HebrewType
            value={built}
            onChange={setBuilt}
            target={card.form}
            liveGrade={false}
            hideHint
            extraMarks
            hideVowelLetters
            markBackspace
            onSpecialMark={(mark) => {
              const placed = placeChosenMark(built, card.form, mark);
              if (placed.status === "wait") {
                setLines(["Type that letter first. Then the accent or the meteg lands on the letter this form requires."]);
                return true;
              }
              if (placed.status === "skip") return false;
              setBuilt(placed.text);
              return true;
            }}
          />
          {revealed ? (
            <p className="mt-3 text-center">
              <Pointed form={card.form} pgn={card.pgn} className="text-4xl" />
            </p>
          ) : null}
          {lines.length ? <Feedback lines={lines} nudge={nudge && !helped} /> : null}
          <div className="mt-3">
            {revealed ? (
              <Button className="w-full" onClick={() => finishCard(card, false)}>
                Next
              </Button>
            ) : (
              <Button className="w-full" onClick={checkBuild}>
                Check
              </Button>
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
    <div className={cn("mt-3 rounded-[var(--radius-md)] px-3 py-2 text-sm", nudge ? "bg-balloon text-ink" : "bg-card text-ink")}>
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
