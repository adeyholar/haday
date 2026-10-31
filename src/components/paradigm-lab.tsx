import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HebrewType } from "@/components/hebrew-type";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  HOLLOW_STRESS_NOTE,
  PGN_LONG,
  allCells,
  book,
  openCells,
  perfectCells,
  practiceCells,
  renderCell,
  type DeckFilter,
  type PracticeCell,
} from "@/lib/paradigm/book";
import { shuffledChoices } from "@/lib/paradigm/choices";
import { highlightWeak, strongPerfect } from "@/lib/paradigm/diff";
import { TAG_LABEL, gradeAnswer, hintFor, type MissTag } from "@/lib/paradigm/grade";
import { strongCells } from "@/lib/paradigm/strong-set";
import { displayRoot } from "@/lib/qal-perfect-builder";
import { placeChosenMark } from "@/lib/verb-paradigm-quest";
import {
  masteryCount,
  notePractice,
  schedule,
  selectTestIds,
  type PracticeLog,
  type SrsState,
} from "@/lib/paradigm/srs";

import { placeChosenMark } from "@/lib/verb-paradigm-quest";

function seatMark(current: string, target: string, mark: string): boolean | string {
  const placed = placeChosenMark(current, target, mark);
  if (placed.status === "wait") return true;
  if (placed.status === "skip") return false;
  return placed.text;
}

const CONJ_LABEL: Record<string, string> = {
  qal_perfect: "Qal perfect",
  qal_imperfect: "Qal imperfect",
  qal_imperative: "Qal imperative",
};

const CONJ_PERSONS: Record<string, string[]> = {
  qal_perfect: ["3ms", "3fs", "2ms", "2fs", "1cs", "3cp", "2mp", "2fp", "1cp"],
  qal_imperfect: ["3ms", "3fs", "2ms", "2fs", "1cs", "3mp", "3fp", "2mp", "2fp", "1cp"],
  qal_imperative: ["2ms", "2fs", "2mp", "2fp"],
};

type ConjFilter = "all" | "qal_perfect" | "qal_imperfect" | "qal_imperative";
const SRS_KEY = "haday-paradigm-srs-v1";
const PRACTICE_KEY = "haday-paradigm-practice-v1";
const FINALS = [
  { from: "כ", to: "ך", name: "kaf" },
  { from: "מ", to: "ם", name: "mem" },
  { from: "נ", to: "ן", name: "nun" },
  { from: "פ", to: "ף", name: "pe" },
  { from: "צ", to: "ץ", name: "tsade" },
];

type Mode = "build" | "review" | "mixed" | "parse" | "diff" | "finals";

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* a private window can refuse the write */
  }
}

export function StudyLab() {
  const [mode, setMode] = useState<Mode>("build");
  const [deck, setDeck] = useState<DeckFilter>("all");
  const [conj, setConj] = useState<ConjFilter>("all");
  const [strict, setStrict] = useState(true);
  const [srs, setSrs] = useState<SrsState>({});
  const [practice, setPractice] = useState<PracticeLog>({});
  const [cursor, setCursor] = useState(0);
  const [typed, setTyped] = useState("");
  const [graded, setGraded] = useState(false);
  const [tags, setTags] = useState<MissTag[]>([]);
  const [alt, setAlt] = useState(false);
  const [lenient, setLenient] = useState(false);
  const [rootId, setRootId] = useState(book.roots.find((root) => root.memorize)?.id ?? book.roots[0].id);
  const [finalAt, setFinalAt] = useState(0);
  const [parsePick, setParsePick] = useState({ root: "", classId: "", pgn: "" });
  const [pin, setPin] = useState<string | null>(null);
  const [shownDeal, setShownDeal] = useState(0);

  const pool = useMemo(() => {
    const rows = practiceCells(deck);
    return conj === "all" ? rows : rows.filter((row) => row.conjugation === conj);
  }, [deck, conj]);
  const mixed = useMemo(() => {
    const rows = openCells();
    return conj === "all" ? rows : rows.filter((row) => row.conjugation === conj);
  }, [conj]);
  const reviewList = useMemo(
    () => pool.filter((item) => (practice[item.id]?.misses ?? 0) > 0),
    [pool, practice],
  );
  const activeList = mode === "mixed" ? mixed : mode === "review" ? reviewList : pool;
  const listed = activeList[cursor % Math.max(activeList.length, 1)];
  const item = mode === "review" && pin ? (pool.find((row) => row.id === pin) ?? listed) : listed;
  const gradedPerfect = allCells().filter((row) => row.conjugation === "qal_perfect");
  const mastered = masteryCount(gradedPerfect.map((row) => row.id), srs);

  useEffect(() => {
    setSrs(loadJson<SrsState>(SRS_KEY, {}));
    setPractice(loadJson<PracticeLog>(PRACTICE_KEY, {}));
  }, []);

  function resetCard() {
    setTyped("");
    setGraded(false);
    setTags([]);
    setAlt(false);
    setLenient(false);
    setPin(null);
    setParsePick({ root: "", classId: "", pgn: "" });
    setShownDeal((n) => n + 1);
  }

  function nextCard() {
    setCursor((value) => (mode === "review" && pin ? value : value + 1));
    resetCard();
  }

  function grade() {
    if (!item) return;
    const result = gradeAnswer(item, typed, strict);
    setGraded(true);
    setTags(result.tags);
    setAlt(result.alt);
    setLenient(result.lenient);
    setPin(item.id);
    const next = notePractice(practice, item.id, result.ok && !result.lenient, result.tags);
    setPractice(next);
    saveJson(PRACTICE_KEY, next);
  }

  const choices = useMemo(() => {
    if (!item || mode !== "parse") return null;
    const roots = shuffledChoices(
      `${item.id}:root:${shownDeal}`,
      item.root.id,
      book.roots.map((root) => root.id),
    );
    const classChoices = shuffledChoices(
      `${item.id}:class:${shownDeal}`,
      item.root.classId,
      book.classes.map((row) => row.id),
    );
    const pgnChoices = shuffledChoices(
      `${item.id}:pgn:${shownDeal}`,
      item.pgn,
      CONJ_PERSONS[item.conjugation] ?? CONJ_PERSONS.qal_perfect,
    );
    return {
      rootChoices: roots.map((id) => book.roots.find((root) => root.id === id)!).filter(Boolean),
      classChoices,
      pgnChoices,
    };
  }, [item, mode, shownDeal]);

  const filters: { id: DeckFilter; label: string }[] = [
    { id: "all", label: "All" },
    ...book.classes.map((row) => ({ id: `class:${row.id}` as DeckFilter, label: row.id })),
    { id: "memorize", label: "Memorize" },
  ];

  return (
    <div className="grid gap-4">
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Qal perfect · weak roots</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-ink">Practice</h2>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Twelve weak roots by class, plus נתן and היה. סבב and קום are marked Memorize. Full pointing is the grade. Stress is marked only when it is not on the last syllable. Meteg is ignored. Perfect, imperfect, and imperative are all open here.
        </p>
        <p className="mt-3 text-sm text-ink">
          Mastered {mastered} / {gradedPerfect.length}. This number comes from the test, and the test grades the Qal perfect only.
        </p>
        <Link to="/game/qal-perfect" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary">
          Take the test
        </Link>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Practice">
          {(
            [
              ["build", "Build"],
              ["review", "Misses"],
              ["mixed", "Mixed"],
              ["parse", "Parse"],
              ["diff", "Strong vs weak"],
              ["finals", "Final letters"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => {
                setMode(id);
                setCursor(0);
                resetCard();
              }}
              className={cn(
                "min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
                mode === id ? "bg-primary text-primary-foreground" : "bg-card text-muted shadow-[var(--shadow-border)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Panel>

      {mode !== "diff" && mode !== "finals" ? (
        <Panel className="grid gap-3">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Verb class">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="radio"
                aria-checked={deck === filter.id}
                onClick={() => {
                  setDeck(filter.id);
                  setCursor(0);
                  resetCard();
                }}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
                  deck === filter.id ? "bg-primary text-primary-foreground" : "bg-card text-muted shadow-[var(--shadow-border)]",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Conjugation">
            {(
              [
                ["all", "All forms"],
                ["qal_perfect", "Perfect"],
                ["qal_imperfect", "Imperfect"],
                ["qal_imperative", "Imperative"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={conj === id}
                onClick={() => {
                  setConj(id);
                  setCursor(0);
                  resetCard();
                }}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
                  conj === id ? "bg-primary text-primary-foreground" : "bg-card text-muted shadow-[var(--shadow-border)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="inline-flex min-h-11 items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={strict} onChange={(event) => setStrict(event.target.checked)} />
            Full pointing
          </label>
        </Panel>
      ) : null}

      {mode === "finals" ? <FinalWarmup at={finalAt} onNext={() => setFinalAt((value) => (value + 1) % FINALS.length)} /> : null}
      {mode === "diff" ? <DiffView rootId={rootId} onRoot={setRootId} /> : null}

      {mode === "review" && activeList.length === 0 && !pin ? (
        <Panel>
          <p className="text-sm text-muted">No misses yet. A miss in practice is remembered here. It does not change mastery.</p>
        </Panel>
      ) : null}

      {item && (mode === "build" || mode === "mixed" || (mode === "review" && (activeList.length > 0 || pin))) ? (
        <Panel>
          <Prompt item={item} />
          {item.root.classId === "hollow" || item.root.classId === "hollow-aleph" ? (
            <p className="mt-3 text-sm text-muted">{HOLLOW_STRESS_NOTE}</p>
          ) : null}
          <div className="mt-4">
            <HebrewType
              value={typed}
              onChange={setTyped}
              target={item.cell.form}
              alts={item.alternates}
              strict={strict}
              liveGrade={false}
              hideHint
              hideVowelLetters
              markBackspace
              extraMarks
              onSpecialMark={(mark, current) => seatMark(current, item.cell.form, mark)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={grade} disabled={!typed.trim() || graded}>
              Check
            </Button>
            <Button type="button" variant="outline" onClick={nextCard}>
              Next
            </Button>
          </div>
          {graded ? (
            <Result item={item} tags={tags} alt={alt} lenient={lenient} hint />
          ) : null}
        </Panel>
      ) : null}

      {item && mode === "parse" && choices ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Name this form</p>
          <p className="mt-1 text-sm text-muted">{CONJ_LABEL[item.conjugation] ?? item.conjugation}</p>
          <p className="he-word mt-2 text-4xl text-ink" dir="rtl" lang="he">
            {renderCell(item.cell)}
          </p>
          <ChoiceRow
            label="Root"
            value={parsePick.root}
            options={choices.rootChoices.map((root) => ({ id: root.id, label: `${displayRoot(root.root)} ${root.gloss}` }))}
            onPick={(id) => setParsePick((prev) => ({ ...prev, root: id }))}
          />
          <ChoiceRow
            label="Class"
            value={parsePick.classId}
            options={choices.classChoices.map((id) => ({ id, label: id }))}
            onPick={(id) => setParsePick((prev) => ({ ...prev, classId: id }))}
          />
          <ChoiceRow
            label="Person"
            value={parsePick.pgn}
            options={choices.pgnChoices.map((id) => ({ id, label: PGN_LONG[id] ?? id }))}
            onPick={(id) => setParsePick((prev) => ({ ...prev, pgn: id }))}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                const ok = parsePick.root === item.root.id && parsePick.classId === item.root.classId && parsePick.pgn === item.pgn;
                setGraded(true);
                setTags(ok ? [] : ["other"]);
                const next = notePractice(practice, item.id, ok, ok ? [] : ["other"]);
                setPractice(next);
                saveJson(PRACTICE_KEY, next);
              }}
              disabled={graded || !parsePick.root || !parsePick.classId || !parsePick.pgn}
            >
              Check
            </Button>
            <Button type="button" variant="outline" onClick={nextCard}>
              Next
            </Button>
          </div>
          {graded ? (
            <p className="mt-3 text-sm text-muted">
              {tags.length === 0 ? "Correct" : `${CONJ_LABEL[item.conjugation] ?? item.conjugation} · ${displayRoot(item.root.root)} ${item.root.gloss} · ${item.root.classId} · ${PGN_LONG[item.pgn]}`}
            </p>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}

export function GameTest({ kind }: { kind: "strong" | "weak" }) {
  const pool = useMemo(() => (kind === "strong" ? strongCells() : perfectCells()), [kind]);
  const [srs, setSrs] = useState<SrsState>({});
  const [queue, setQueue] = useState<PracticeCell[]>([]);
  const [cursor, setCursor] = useState(0);
  const [typed, setTyped] = useState("");
  const [graded, setGraded] = useState(false);
  const [tags, setTags] = useState<MissTag[]>([]);
  const [alt, setAlt] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  function begin(state: SrsState) {
    const practice = loadJson<PracticeLog>(PRACTICE_KEY, {});
    const ids = selectTestIds(
      pool.map((item) => item.id),
      state,
      practice,
      Date.now(),
    );
    setQueue(ids.map((id) => pool.find((item) => item.id === id)).filter((item): item is PracticeCell => Boolean(item)));
    setCursor(0);
    setTyped("");
    setGraded(false);
    setTags([]);
    setAlt(false);
    setCorrect(0);
    setDone(false);
    setReady(true);
  }

  useEffect(() => {
    const state = loadJson<SrsState>(SRS_KEY, {});
    setSrs(state);
    begin(state);
    // The sitting is fixed when the set changes. Practice answers must not rebuild it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const item = queue[cursor];
  const total = queue.length;

  function grade() {
    if (!item || graded) return;
    const result = gradeAnswer(item, typed, true);
    setGraded(true);
    setTags(result.tags);
    setAlt(result.alt);
    if (result.ok) setCorrect((value) => value + 1);
    const next = { ...srs, [item.id]: schedule(srs[item.id], result.ok, Date.now()) };
    setSrs(next);
    saveJson(SRS_KEY, next);
  }

  function next() {
    if (cursor + 1 >= total) {
      setDone(true);
      return;
    }
    setCursor((value) => value + 1);
    setTyped("");
    setGraded(false);
    setTags([]);
    setAlt(false);
  }

  if (!ready) return null;

  return (
    <div className="grid gap-4">
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Qal perfect test</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-ink">{kind === "strong" ? "Strong roots" : "Weak roots"}</h2>
        <p className="mt-3 max-w-prose text-sm text-muted">
          {kind === "strong"
            ? "Graded, with the accent and the meteg. No hints until you check. A hit moves the form ahead. A miss brings it back."
            : "Graded, with stress. No hints until you check. Meteg is ignored. A hit moves the form ahead. A miss brings it back."}
        </p>
        <Link to="/study/verb-lab/qal-perfect" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary">
          Practice first
        </Link>
      </Panel>
      {done || !item ? (
        <Panel>
          <p className="font-display text-3xl font-bold text-ink">
            {total ? `${correct} of ${total}` : "Nothing is due"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {total ? "Mastery updates from this test only." : "Practice first, or wait until a form is due again."}
          </p>
          <Button type="button" className="mt-4" onClick={() => begin(srs)}>
            Another sitting
          </Button>
        </Panel>
      ) : (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {cursor + 1} / {total}
          </p>
          <Prompt item={item} />
          <div className="mt-4">
            <HebrewType
              value={typed}
              onChange={setTyped}
              target={item.cell.form}
              alts={item.alternates}
              strict
              liveGrade={false}
              hideHint
              hideVowelLetters
              markBackspace
              extraMarks
              onSpecialMark={(mark, current) => seatMark(current, item.cell.form, mark)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={grade} disabled={!typed.trim() || graded}>
              Check
            </Button>
            <Button type="button" variant="outline" onClick={next} disabled={!graded}>
              {cursor + 1 >= total ? "Score" : "Next"}
            </Button>
          </div>
          {graded ? <Result item={item} tags={tags} alt={alt} lenient={false} hint={false} /> : null}
        </Panel>
      )}
    </div>
  );
}

function Prompt({ item }: { item: PracticeCell }) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {item.root.gloss}
        {item.root.memorize ? " · Memorize" : ""}
        {item.root.supplementary ? " · Supplementary" : ""}
      </p>
      <p className="he-word mt-1 text-4xl text-ink" dir="rtl" lang="he">
        {displayRoot(item.root.root)}
      </p>
      <p className="mt-2 text-sm text-ink">
        {CONJ_LABEL[item.conjugation] ?? item.conjugation} · {PGN_LONG[item.pgn] ?? item.pgn}
      </p>
    </>
  );
}

function Result({
  item,
  tags,
  alt,
  lenient,
  hint,
}: {
  item: PracticeCell;
  tags: MissTag[];
  alt: boolean;
  lenient: boolean;
  hint: boolean;
}) {
  const line = lenient ? "letters right, now point it" : tags.length === 0 ? (alt ? "Correct · alt" : "Correct") : "Not yet";
  return (
    <div className="mt-4 grid gap-2">
      <p className={cn("text-sm font-semibold", tags.length === 0 && !lenient ? "text-primary" : "text-danger")}>{line}</p>
      <p className="he-word text-3xl text-ink" dir="rtl" lang="he">
        {renderCell(item.cell)}
      </p>
      {item.cell.attestation ? <p className="text-sm text-muted">Attested · {item.cell.attestation.ref}</p> : null}
      {tags.length ? (
        <p className="text-sm text-muted">{hint ? hintFor(item, tags) : tags.map((tag) => TAG_LABEL[tag]).join(" ")}</p>
      ) : null}
    </div>
  );
}

function ChoiceRow({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onPick: (id: string) => void;
}) {
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onPick(option.id)}
            className={cn(
              "min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
              value === option.id ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-[var(--shadow-border)]",
            )}
          >
            <span className="he-word" dir="rtl" lang="he">
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DiffView({ rootId, onRoot }: { rootId: string; onRoot: (id: string) => void }) {
  const root = book.roots.find((row) => row.id === rootId) ?? book.roots[0];
  const table = root.conjugations.qal_perfect;
  return (
    <Panel>
      <label className="text-sm text-muted">
        Root
        <select className="ms-2 min-h-11 rounded-[var(--radius-md)] bg-card px-2" value={root.id} onChange={(event) => onRoot(event.target.value)}>
          {book.roots
            .filter((row) => row.conjugations.qal_perfect)
            .map((row) => (
              <option key={row.id} value={row.id}>
                {row.root} · {row.gloss}
                {row.memorize ? " · memorize" : ""}
              </option>
            ))}
        </select>
      </label>
      <p className="mt-3 text-sm text-muted">קָטַל on the left. The weak root on the right. Marks that differ are marked.</p>
      <div className="mt-3 grid gap-2">
        {Object.entries(table.cells).map(([pgn, cell]) => (
          <div key={pgn} className="grid grid-cols-[5rem_1fr_1fr] items-baseline gap-2 text-sm">
            <span className="text-muted">{pgn}</span>
            <span className="he-word text-xl text-ink" dir="rtl" lang="he">
              {strongPerfect(pgn)}
            </span>
            <span className="he-word text-xl" dir="rtl" lang="he">
              {highlightWeak(pgn, cell.form).map((piece, index) => (
                <span key={`${piece.ch}-${index}`} className={piece.changed ? "text-primary" : "text-ink"}>
                  {piece.ch}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function FinalWarmup({ at, onNext }: { at: number; onNext: () => void }) {
  const card = FINALS[at] ?? FINALS[0];
  const [typed, setTyped] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);
  return (
    <Panel>
      <p className="text-sm text-muted">Type the final form of this letter.</p>
      <p className="he-word mt-2 text-5xl text-ink" dir="rtl" lang="he">
        {card.from}
      </p>
      <div className="mt-4">
        <HebrewType value={typed} onChange={setTyped} target={card.to} strict liveGrade={false} hideHint hideVowelLetters />
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={() => setOk(typed === card.to)}>
          Check
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setTyped("");
            setOk(null);
            onNext();
          }}
        >
          Next
        </Button>
      </div>
      {ok != null ? <p className="mt-3 text-sm text-muted">{ok ? "Correct" : `The final form is ${card.to}.`}</p> : null}
      <p className="sr-only">{card.name}</p>
    </Panel>
  );
}
