import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { MarkedAnswer } from "@/components/marked-answer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { passageForRoot } from "@/lib/verbal-passages";
import { paradigmVerse } from "@/lib/verbal-paradigm-verses";
import { markQueryInVerse } from "@/lib/tanakh-word";
import {
  CLASS_LABEL,
  CONJS,
  conjLabel,
  scriptureVerbWords,
  POOLS,
  STEMS,
  conjsFor,
  consonantsInPool,
  filled,
  gradeCell,
  openPattern,
  passDeck,
  passedAll,
  preview,
  rootFace,
  rootsForConsonant,
  stemsFor,
  type Cell,
  type ConjId,
  type RootPool,
  type StemId,
} from "@/lib/verbal-system";

const STATS_KEY = "verbal-system-stats-v1";

type Board = { n: number; cleared: number; sum: number; total: number };
type Phase = "choose" | "round" | "done";

function emptyBoard(): Board {
  return { n: 0, cleared: 0, sum: 0, total: 0 };
}

function loadBoard(): Board {
  if (typeof window === "undefined") return emptyBoard();
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return emptyBoard();
    const parsed = JSON.parse(raw) as Board;
    if (parsed && typeof parsed.n === "number") {
      return {
        n: parsed.n,
        cleared: parsed.cleared ?? 0,
        sum: parsed.sum ?? 0,
        total: parsed.total ?? 0,
      };
    }
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

function stemFromHash(hash: string): StemId | null {
  const id = hash.replace(/^#/, "");
  return STEMS.some((item) => item.id === id) ? (id as StemId) : null;
}

export function VerbalSystemBuilder({ scripture = false }: { scripture?: boolean }) {
  const hash = useRouterState({ select: (s) => s.location.hash });
  const opened = stemFromHash(hash);
  const [pool, setPool] = useState<RootPool>("tri");
  const [letter, setLetter] = useState("ש");
  const [rootId, setRootId] = useState("shamar");
  const [stem, setStem] = useState<StemId>(opened ?? "qal");
  const [conj, setConj] = useState<ConjId>("perfect");
  const [phase, setPhase] = useState<Phase>("choose");
  const [deck, setDeck] = useState<Cell[]>([]);
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [verdict, setVerdict] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [board, setBoard] = useState<Board>(emptyBoard());

  const letters = consonantsInPool(pool);
  const activeLetter = letters.some((item) => item.letter === letter) ? letter : (letters[0]?.letter ?? "");
  const roots = rootsForConsonant(pool, activeLetter);
  const root = roots.find((item) => item.id === rootId) ?? roots[0];
  const stemIds = root ? stemsFor(root.id) : [];
  const conjIds = root ? conjsFor(root.id, stem) : [];
  const pattern = root ? openPattern(root.id, stem, conj) : null;
  const cell = deck[at];
  const specific = root ? paradigmVerse(root.id, stem, conj) : null;
  const passage = specific
    ? { ref: specific.ref, where: specific.where, he: specific.he, en: specific.en, query: root?.letters.join("") ?? "" }
    : root
      ? passageForRoot(root.id)
      : null;
  const passageName = specific
    ? `${STEMS.find((item) => item.id === stem)?.en ?? stem} ${conjLabel(conj, scripture)}`
    : "";

  useEffect(() => {
    setBoard(loadBoard());
  }, []);

  useEffect(() => {
    const next = stemFromHash(hash);
    if (!next) return;
    setPool("tri");
    setLetter("ש");
    setRootId("shamar");
    setStem(next);
    setConj(conjsFor("shamar", next).includes("perfect") ? "perfect" : (conjsFor("shamar", next)[0] ?? "perfect"));
    setPhase("choose");
    setDeck([]);
    setAt(0);
    setPicks({});
    setVerdict(null);
    setCorrect(0);
  }, [hash]);

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

  function choosePool(id: RootPool) {
    const nextLetters = consonantsInPool(id);
    const nextLetter = nextLetters[0]?.letter ?? "";
    const nextRoot = rootsForConsonant(id, nextLetter)[0];
    setPool(id);
    setLetter(nextLetter);
    if (nextRoot) chooseRoot(nextRoot.id);
    else abandon();
  }

  function chooseLetter(next: string) {
    const nextRoot = rootsForConsonant(pool, next)[0];
    setLetter(next);
    if (nextRoot) chooseRoot(nextRoot.id);
    else abandon();
  }

  function chooseStem(id: StemId) {
    if (!root) return;
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
    setDeck(passDeck(pattern.cells));
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
          cleared: prev.cleared + (passedAll(total, deck.length) ? 1 : 0),
          sum: prev.sum + total,
          total: prev.total + deck.length,
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
  const percent = deck.length ? Math.round((correct / deck.length) * 100) : 0;
  const passed = passedAll(correct, deck.length);
  const marked = passage ? markQueryInVerse(passage.he, passage.query) : [];
  const read = passage?.ref.split(".") ?? [];

  return (
    <div className="grid gap-4">
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {scripture ? "Scripture Path · Verbal system" : "Grammar · Verbal system"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Verbal System</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          {scripture
            ? "Open at every level. The root is a verb the Tanakh uses, not this week’s list. Choose the pool, then the consonant you want to practice."
            : "Choose the pool, then the consonant you want to practice. The roots that use that consonant are the only ones in the list."}
          {" "}
          Pass every form of the stem and the conjugation. A Tanakh verse opens only when they are all right.
        </p>
        {scripture ? (
          <p className="mt-2 text-sm text-muted">
            Build the Qal qatal from the three root letters in{" "}
            <Link to="/iibs/verb-paradigm-quest" className="font-semibold text-primary">
              Build from the root
            </Link>
            . The ten-row Qal yiqtol drill is in{" "}
            <Link to="/iibs/qal-imperfect" className="font-semibold text-primary">
              Qal Yiqtol
            </Link>
            .
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            The nine-row Qal perfect drill is still in{" "}
            <Link to="/game/qal-perfect" className="font-semibold text-primary">
              Qal Perfect Builder
            </Link>
            . The ten-row Qal imperfect drill is in{" "}
            <Link to="/game/qal-imperfect" className="font-semibold text-primary">
              Qal Imperfect Builder
            </Link>
            .
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-ink">Pool</span>
            <select
              aria-label="Pool"
              value={pool}
              onChange={(event) => choosePool(event.target.value as RootPool)}
              className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-parchment px-2 text-base text-ink"
            >
              {POOLS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.en}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-ink">Consonant</span>
            <select
              aria-label="Consonant"
              value={activeLetter}
              onChange={(event) => chooseLetter(event.target.value)}
              className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-parchment px-2 font-hebrew text-base text-ink"
            >
              {letters.map((item) => (
                <option key={item.letter} value={item.letter}>
                  {item.letter} · {item.en}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-sm text-muted">{POOLS.find((item) => item.id === pool)?.line}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-ink">Root</span>
            <select
              aria-label="Root"
              value={root?.id ?? ""}
              onChange={(event) => chooseRoot(event.target.value)}
              className="min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-parchment px-2 font-hebrew text-base text-ink"
            >
              {roots.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.cite} — {item.gloss}
                </option>
              ))}
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
                  {conjLabel(item.id, scripture)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {phase === "round" ? (
          <p className="mt-2 text-xs text-muted">Changing the pool, the consonant, the root, the stem, or the conjugation leaves this pass.</p>
        ) : null}

        {pattern && root ? (
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
              <p className="mt-2 max-w-prose text-sm text-muted">{scripture ? scriptureVerbWords(pattern.blurb) : pattern.blurb}</p>
              <p className="mt-1 text-xs text-muted">
                {pattern.cells.length} {pattern.cells.length === 1 ? "form" : "forms"} in this conjugation. All of them.
              </p>
            </div>
            {phase !== "round" ? (
              <Button type="button" onClick={begin}>
                {phase === "done" ? "Practice these forms again" : "Begin these forms"}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={abandon}>
                Leave this pass
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
            {at + 1} of {deck.length}
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
              <MarkedAnswer ok={verdict.ok} given={shown} answer={cell.form} />
              {!verdict.ok ? (
                <>
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
                {at + 1 >= deck.length ? "See the pass" : "Next form"}
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
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Pass</p>
          <p className="mt-1 font-display text-4xl font-bold tabular-nums text-ink">
            {correct} / {deck.length}
            <span className="ms-3 text-2xl text-muted">{percent}%</span>
          </p>
          <p className={cn("mt-2 text-sm font-semibold", passed ? "text-good" : "text-ink")}>
            {passed ? "Every form is right. The verse is open." : "Not yet. Every form has to be right before the verse opens."}
          </p>
          {passed && passage ? (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {passageName ? `${passageName} · ${passage.where}` : passage.where}
              </p>
              <p className="he-taam mt-2 text-2xl leading-[2.2] text-ink" dir="rtl" lang="he">
                {marked.map((part, index) => (
                  <span key={`${part.word}-${index}`} className={part.hit ? "text-primary" : undefined}>
                    {part.word}{" "}
                  </span>
                ))}
              </p>
              <p className="mt-2 text-sm text-muted">{passage.en}</p>
              {read.length >= 2 ? (
                <p className="mt-3">
                  {scripture ? (
                    <Link
                      to="/iibs/wlc/$book/$ch"
                      params={{ book: read[0], ch: read[1] }}
                      className="font-semibold text-primary"
                    >
                      Read it in the text
                    </Link>
                  ) : (
                    <Link
                      to="/listen/read/$book/$ch"
                      params={{ book: read[0], ch: read[1] }}
                      className="font-semibold text-primary"
                    >
                      Read it in the text
                    </Link>
                  )}
                </p>
              ) : null}
            </div>
          ) : null}
        </Panel>
      ) : null}

      <p className="text-sm tabular-nums text-muted">
        {board.n
          ? `Passes: ${board.n} · Cleared: ${board.cleared} · Average: ${board.total ? ((board.sum / board.total) * 100).toFixed(0) : "0"}%`
          : "Your first finished pass will show up here."}
      </p>
    </div>
  );
}
