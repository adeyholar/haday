import { useEffect, useMemo, useState } from "react";
import { HebrewType } from "@/components/hebrew-type";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  PGN_LONG,
  book,
  chapterCells,
  practiceCells,
  renderCell,
  type DeckFilter,
  type PracticeCell,
} from "@/lib/paradigm/book";
import { highlightWeak, strongPerfect } from "@/lib/paradigm/diff";
import { TAG_LABEL, gradeAnswer, hintFor, type MissTag } from "@/lib/paradigm/grade";
import { dueIds, schedule, type SrsState } from "@/lib/paradigm/srs";

const SRS_KEY = "haday-paradigm-srs-v1";
const FINALS = [
  { from: "כ", to: "ך", name: "kaf" },
  { from: "מ", to: "ם", name: "mem" },
  { from: "נ", to: "ן", name: "nun" },
  { from: "פ", to: "ף", name: "pe" },
  { from: "צ", to: "ץ", name: "tsade" },
];

type Mode = "build" | "review" | "mixed" | "parse" | "diff" | "finals";

function loadSrs(): SrsState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SRS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SrsState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function pick<T>(items: T[], avoid?: T): T {
  const open = avoid ? items.filter((item) => item !== avoid) : items;
  const list = open.length ? open : items;
  return list[Math.floor(Math.random() * list.length)] ?? items[0];
}

export function ParadigmLab() {
  const [mode, setMode] = useState<Mode>("build");
  const [deck, setDeck] = useState<DeckFilter>("chapter");
  const [strict, setStrict] = useState(true);
  const [srs, setSrs] = useState<SrsState>({});
  const [cursor, setCursor] = useState(0);
  const [typed, setTyped] = useState("");
  const [graded, setGraded] = useState(false);
  const [tags, setTags] = useState<MissTag[]>([]);
  const [alt, setAlt] = useState(false);
  const [rootId, setRootId] = useState(book.roots.find((root) => root.memorize)?.id ?? book.roots[0].id);
  const [finalAt, setFinalAt] = useState(0);
  const [parsePick, setParsePick] = useState({ root: "", classId: "", pgn: "" });
  const [pin, setPin] = useState<string | null>(null);

  const pool = useMemo(() => (deck === "chapter" ? chapterCells() : practiceCells(deck)), [deck]);
  const mixed = useMemo(() => [...chapterCells(), ...practiceCells("supplementary")], []);
  const reviewIds = dueIds(
    pool.map((item) => item.id),
    srs,
    Date.now(),
  );
  const activeList = mode === "mixed" ? mixed : mode === "review" ? pool.filter((item) => reviewIds.includes(item.id)) : pool;
  const listed = activeList[cursor % Math.max(activeList.length, 1)];
  const item = mode === "review" && pin ? (pool.find((row) => row.id === pin) ?? listed) : listed;

  useEffect(() => {
    setSrs(loadSrs());
  }, []);

  function persist(next: SrsState) {
    setSrs(next);
    try {
      window.localStorage.setItem(SRS_KEY, JSON.stringify(next));
    } catch {
      /* a private window can refuse the write */
    }
  }

  function resetCard() {
    setTyped("");
    setGraded(false);
    setTags([]);
    setAlt(false);
    setParsePick({ root: "", classId: "", pgn: "" });
    setPin(null);
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
    setPin(item.id);
    persist({ ...srs, [item.id]: schedule(srs[item.id], result.ok, Date.now()) });
  }

  const choices = useMemo(() => {
    if (!item || mode !== "parse") return null;
    const roots = book.roots.filter((root) => root.deck === "chapter" || root.deck === "supplementary");
    const rootChoices = unique([item.root, ...roots.filter((root) => root.id !== item.root.id).slice(0, 3)]);
    const classChoices = unique([item.root.classId, ...book.classes.map((row) => row.id).filter((id) => id !== item.root.classId)]).slice(0, 4);
    const pgnChoices = unique([item.pgn, "3fs", "2ms", "1cs", "3cp"]).slice(0, 4);
    return { rootChoices, classChoices, pgnChoices };
  }, [item, mode]);

  return (
    <div className="grid gap-4">
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Chapter 14</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-ink">Weak Qal perfect</h2>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Twelve roots from the chapter, plus a supplementary deck for נתן and היה. סבב and קום are marked Memorize. Full pointing is the grade. Accents and meteg are not required. Imperfect and imperative stay locked until a later chapter.
        </p>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Practice">
          {(
            [
              ["build", "Build"],
              ["review", "Review"],
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
        <Panel className="flex flex-wrap items-center gap-3">
          <div className="inline-flex overflow-hidden rounded-[var(--radius-md)] bg-card shadow-[var(--shadow-border)]" role="radiogroup" aria-label="Deck">
            {(
              [
                ["chapter", "Chapter 14"],
                ["memorize", "Memorize"],
                ["supplementary", "Supplementary"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={deck === id}
                onClick={() => {
                  setDeck(id);
                  setCursor(0);
                  resetCard();
                }}
                className={cn("min-h-11 px-3 text-sm font-semibold", deck === id ? "bg-primary text-primary-foreground" : "text-muted")}
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

      {mode === "finals" ? (
        <FinalWarmup at={finalAt} onNext={() => setFinalAt((value) => (value + 1) % FINALS.length)} />
      ) : null}

      {mode === "diff" ? <DiffView rootId={rootId} onRoot={setRootId} /> : null}

      {mode === "review" && activeList.length === 0 && !pin ? (
        <Panel>
          <p className="text-sm text-muted">Nothing is due. A miss comes back before a form you already have.</p>
        </Panel>
      ) : null}

      {item && (mode === "build" || mode === "mixed" || (mode === "review" && (activeList.length > 0 || pin))) ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {item.root.gloss}
            {item.root.memorize ? " · Memorize" : ""}
            {item.alternates.length ? " · alt accepted" : ""}
          </p>
          <p className="he-word mt-1 text-4xl text-ink" dir="rtl" lang="he">
            {item.root.root}
          </p>
          <p className="mt-2 text-sm text-ink">{PGN_LONG[item.pgn] ?? item.pgn}</p>
          <div className="mt-4">
            <HebrewType value={typed} onChange={setTyped} target={item.cell.form} alts={item.alternates} strict={strict} liveGrade={false} hideHint hideVowelLetters markBackspace />
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
            <div className="mt-4 grid gap-2">
              <p className={cn("text-sm font-semibold", tags.length === 0 ? "text-primary" : "text-danger")}>
                {tags.length === 0 ? (alt ? "Correct · alt" : "Correct") : "Not yet"}
              </p>
              <p className="he-word text-3xl text-ink" dir="rtl" lang="he">
                {renderCell(item.cell)}
              </p>
              {item.cell.attestation ? <p className="text-sm text-muted">Attested · {item.cell.attestation.ref}</p> : null}
              {tags.length ? <p className="text-sm text-muted">{hintFor(item, tags)}</p> : null}
            </div>
          ) : null}
        </Panel>
      ) : null}

      {item && mode === "parse" && choices ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Name this form · Qal perfect</p>
          <p className="he-word mt-2 text-4xl text-ink" dir="rtl" lang="he">
            {renderCell(item.cell)}
          </p>
          <ChoiceRow label="Root" value={parsePick.root} options={choices.rootChoices.map((root) => ({ id: root.id, label: `${root.root} ${root.gloss}` }))} onPick={(id) => setParsePick((prev) => ({ ...prev, root: id }))} />
          <ChoiceRow label="Class" value={parsePick.classId} options={choices.classChoices.map((id) => ({ id, label: id }))} onPick={(id) => setParsePick((prev) => ({ ...prev, classId: id }))} />
          <ChoiceRow label="Person" value={parsePick.pgn} options={choices.pgnChoices.map((id) => ({ id, label: PGN_LONG[id] ?? id }))} onPick={(id) => setParsePick((prev) => ({ ...prev, pgn: id }))} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                const ok = parsePick.root === item.root.id && parsePick.classId === item.root.classId && parsePick.pgn === item.pgn;
                setGraded(true);
                setTags(ok ? [] : ["other"]);
                persist({ ...srs, [item.id]: schedule(srs[item.id], ok, Date.now()) });
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
              {tags.length === 0 ? "Correct" : `Qal perfect · ${item.root.root} ${item.root.gloss} · ${item.root.classId} · ${PGN_LONG[item.pgn]}`}
            </p>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
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
            <span className={option.label.includes(" ") ? "he-word" : undefined} dir="rtl" lang="he">
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
      <p className="mt-3 text-sm text-muted">קָטַל on the left. The chapter root on the right. Marks that differ are marked.</p>
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
        <HebrewType
          value={typed}
          onChange={(next) => {
            setTyped(next);
            setOk(null);
            return next;
          }}
          target={card.to}
          strict
          liveGrade={false}
          hideHint
          hideVowelLetters
        />
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          onClick={() => setOk(typed === card.to)}
        >
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
