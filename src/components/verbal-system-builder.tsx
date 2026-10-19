import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  CLASS_LABEL,
  CONJS,
  ROOTS,
  ROUND,
  STEMS,
  cleared,
  conjsFor,
  dealRound,
  filled,
  gradeCell,
  openPattern,
  preview,
  rootById,
  rootFace,
  stemsFor,
  type Cell,
  type ConjId,
  type RootClass,
  type StemId,
} from "@/lib/verbal-system";

const STATS_KEY = "verbal-system-stats-v1";

const CLASS_ORDER: RootClass[] = [
  "strong",
  "assim",
  "I-gutt",
  "II-gutt",
  "III-gutt",
  "I-aleph",
  "III-aleph",
  "III-he",
  "I-nun",
  "I-yod",
  "hollow",
  "geminate",
];

type Board = { n: number; cleared: number; sum: number };
type Phase = "choose" | "round" | "done";

function emptyBoard(): Board {
  return { n: 0, cleared: 0, sum: 0 };
}

function loadBoard(): Board {
  if (typeof window === "undefined") return emptyBoard();
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return emptyBoard();
    const parsed = JSON.parse(raw) as Board;
    if (parsed && typeof parsed.n === "number") return parsed;
  } catch {
    /* keep the empty board */
  }
  return emptyBoard();
}

function saveBoard(board: Board) {
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(board));
  } catch {
    /* a private window can refuse the write */
  }
}

export function VerbalSystemBuilder() {
  const [rootId, setRootId] = useState(ROOTS[0].id);
  const [stem, setStem] = useState<StemId>("qal");
  const [conj, setConj] = useState<ConjId>("perfect");
  const [phase, setPhase] = useState<Phase>("choose");
  const [deck, setDeck] = useState<Cell[]>([]);
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [verdict, setVerdict] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [board, setBoard] = useState<Board>(emptyBoard);

  const root = rootById(rootId) ?? ROOTS[0];
  const stemIds = stemsFor(root.id);
  const conjIds = conjsFor(root.id, stem);
  const pattern = openPattern(root.id, stem, conj);
  const cell = deck[at];

  useEffect(() => {
    setBoard(loadBoard());
  }, []);

  function abandon() {
    setPhase("choose");
    setDeck([]);
    setAt(0);
    setPicks({});
    setVerdict(null);
    setCorrect(0);
  }

  function chooseRoot(id: string) {
    const nextStem = stemsFor(id).includes(stem) ? stem : stemsFor(id)[0];
    const nextConj = conjsFor(id, nextStem).includes(conj) ? conj : conjsFor(id, nextStem)[0];
    setRootId(id);
    setStem(nextStem);
    setConj(nextConj);
    abandon();
  }

  function chooseStem(id: StemId) {
    const nextConj = conjsFor(root.id, id).includes(conj) ? conj : conjsFor(root.id, id)[0];
    setStem(id);
    setConj(nextConj);
    abandon();
  }

  function chooseConj(id: ConjId) {
    setConj(id);
    abandon();
  }

  function begin() {
    if (!pattern) return;
    setDeck(dealRound(pattern.cells));
    setAt(0);
    setPicks({});
    setVerdict(null);
    setCorrect(0);
    setPhase("round");
  }

  function grade() {
    if (!pattern || !cell || verdict) return;
    const next = gradeCell(pattern, cell, picks);
    setVerdict(next);
    if (next.ok) setCorrect((n) => n + 1);
  }

  function advance() {
    if (!verdict) return;
    if (at + 1 >= deck.length) {
      const total = correct;
      setBoard((prev) => {
        const saved = {
          n: prev.n + 1,
          cleared: prev.cleared + (cleared(total) ? 1 : 0),
          sum: prev.sum + total,
        };
        saveBoard(saved);
        return saved;
      });
      setPhase("done");
      return;
    }
    setAt((n) => n + 1);
    setPicks({});
    setVerdict(null);
  }

  const shown = pattern ? preview(pattern, picks) : "";
  const percent = Math.round((correct / ROUND) * 100);
  const passed = cleared(correct);

  return (
    <div className="grid gap-4">
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar · Verbal system</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Verbal System</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Binyanim is the classroom word. The academy’s name for the whole set is the verbal system: a stem, then a conjugation. Choose a root from the Tanakh paradigms. A weak root does not open the same stems as a strong one, and the lists in the builder follow that choice.
        </p>
        <p className="mt-2 text-sm text-muted">
          Ten builds. Nine right is 90%, and that clears the round. The nine-row Qal perfect drill is still in{" "}
          <Link to="/game/qal-perfect" className="font-semibold text-primary">
            Qal Perfect Builder
          </Link>
          .
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-ink">Root</span>
            <select
              aria-label="Root"
              value={root.id}
              onChange={(event) => chooseRoot(event.target.value)}
              className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-parchment px-2 font-hebrew text-base text-ink"
            >
              {CLASS_ORDER.map((cls) => {
                const group = ROOTS.filter((item) => item.cls === cls);
                if (!group.length) return null;
                return (
                  <optgroup key={cls} label={CLASS_LABEL[cls]}>
                    {group.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.cite} — {item.gloss}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-ink">Stem</span>
            <select
              aria-label="Stem"
              value={stem}
              onChange={(event) => chooseStem(event.target.value as StemId)}
              className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-parchment px-2 font-hebrew text-base text-ink"
            >
              {STEMS.filter((item) => stemIds.includes(item.id)).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.he} · {item.en}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-ink">Conjugation</span>
            <select
              aria-label="Conjugation"
              value={conj}
              onChange={(event) => chooseConj(event.target.value as ConjId)}
              className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-parchment px-2 text-base text-ink"
            >
              {CONJS.filter((item) => conjIds.includes(item.id)).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.en}
                </option>
              ))}
            </select>
          </label>
        </div>
        {phase === "round" ? (
          <p className="mt-2 text-xs text-muted">Changing the root, the stem, or the conjugation leaves this round.</p>
        ) : null}

        {pattern ? (
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="he-word font-hebrew text-5xl leading-tight text-ink" dir="rtl" lang="he">
                {root.cite}
              </p>
              <p className="mt-1 text-sm text-ink">
                “{root.gloss}”
                <span className="text-muted"> · {CLASS_LABEL[root.cls]}</span>
              </p>
              <p className="he-word mt-1 font-hebrew text-lg text-muted" dir="rtl" lang="he">
                {rootFace(root)}
              </p>
              <p className="mt-2 max-w-prose text-sm text-muted">{pattern.blurb}</p>
              <p className="mt-1 text-xs text-muted">
                {stemIds.length} {stemIds.length === 1 ? "stem" : "stems"} on this root · {pattern.cells.length}{" "}
                {pattern.cells.length === 1 ? "shape" : "shapes"} in this conjugation
                {pattern.cells.length < ROUND ? " · the round still asks ten times" : ""}
              </p>
            </div>
            {phase !== "round" ? (
              <Button type="button" onClick={begin}>
                {phase === "done" ? "Another round of 10" : "Begin round of 10"}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={abandon}>
                Leave this round
              </Button>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">This root does not take that stem and conjugation.</p>
        )}
      </Panel>

      {phase === "round" && pattern && cell ? (
        <Panel>
          <div className="flex gap-1" aria-hidden>
            {deck.map((_, i) => (
              <span
                key={i}
                className={cn("h-1.5 flex-1 rounded-full", i < at ? "bg-primary" : i === at ? "bg-ink" : "bg-border")}
              />
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {at + 1} of {ROUND}
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink">{cell.label}</h2>
          <p
            className="he-taam mt-4 overflow-x-auto text-center text-5xl leading-[2.2] text-ink sm:text-6xl"
            dir="rtl"
            lang="he"
          >
            {shown || "—"}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pattern.slots.map((slot) => (
              <label key={slot.id} className="grid gap-1 text-sm">
                <span className="font-semibold text-ink">{slot.label}</span>
                <select
                  aria-label={slot.label}
                  value={picks[slot.id] ?? ""}
                  disabled={Boolean(verdict)}
                  onChange={(event) => setPicks((prev) => ({ ...prev, [slot.id]: event.target.value }))}
                  className={cn(
                    "min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-parchment px-2 text-base text-ink",
                    slot.id === "tone" ? "he-taam" : "font-hebrew",
                  )}
                >
                  <option value="">Choose</option>
                  {slot.options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.mark} {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {verdict ? (
            <div className={cn("mt-4 rounded-[var(--radius-md)] px-3 py-3", verdict.ok ? "bg-good/15" : "bg-danger/10")}>
              <p className={cn("font-semibold", verdict.ok ? "text-good" : "text-danger")}>
                {verdict.ok ? "Correct" : "Not yet"}
              </p>
              {!verdict.ok ? (
                <>
                  <p className="mt-2 flex flex-wrap items-baseline gap-2 text-sm">
                    <span>Answer</span>
                    <span className="he-taam text-4xl leading-[2.2] text-ink" dir="rtl" lang="he">
                      {cell.form}
                    </span>
                  </p>
                  <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
                    {verdict.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm text-muted">{cell.note}</p>
                </>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {verdict ? (
              <Button type="button" onClick={advance}>
                {at + 1 >= deck.length ? "See the round" : "Next build"}
              </Button>
            ) : (
              <Button type="button" disabled={!filled(pattern, picks)} onClick={grade}>
                Check
              </Button>
            )}
          </div>
        </Panel>
      ) : null}

      {phase === "done" ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Round</p>
          <p className="mt-1 font-display text-4xl font-bold tabular-nums text-ink">
            {correct} / {ROUND}
            <span className="ms-3 text-2xl text-muted">{percent}%</span>
          </p>
          <p className={cn("mt-2 text-sm font-semibold", passed ? "text-good" : "text-ink")}>
            {passed ? "Cleared. Nine right was the line." : "Not cleared. Nine right is 90%."}
          </p>
        </Panel>
      ) : null}

      <p className="text-sm tabular-nums text-muted">
        {board.n
          ? `Rounds: ${board.n} · Cleared: ${board.cleared} · Average: ${((board.sum / board.n / ROUND) * 100).toFixed(0)}%`
          : "Your first finished round will show up here."}
      </p>
    </div>
  );
}
