import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  END_ORDER,
  ENDINGS,
  FORMS,
  ROOTS,
  STATS_KEY,
  VOWEL_OPTS,
  VOWELS,
  blankChoices,
  buildForm,
  emptyStats,
  filled,
  gradeRow,
  openFields,
  rootDisplay,
  rootsFor,
  type BuilderRoot,
  type BuilderStats,
  type EndId,
  type LevelFilter,
  type PgnKey,
  type RowChoice,
  type RowGrade,
  type VowelId,
} from "@/lib/qal-perfect-builder";
import { perfectVerse } from "@/lib/verbal-paradigm-verses";
import { markQueryInVerse } from "@/lib/tanakh-word";

const CIRCLE = "\u25CC";

function loadStats(): BuilderStats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as BuilderStats;
    if (parsed && typeof parsed.n === "number") return parsed;
  } catch {
    /* keep the empty board */
  }
  return emptyStats();
}

function pickRoot(level: LevelFilter, avoid: BuilderRoot | null): BuilderRoot {
  const pool = rootsFor(level);
  const open = pool.filter((root) => root !== avoid);
  const list = open.length ? open : pool;
  return list[Math.floor(Math.random() * list.length)] ?? pool[0];
}

function shuffled<T>(items: T[]): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const hold = next[i];
    next[i] = next[j];
    next[j] = hold;
  }
  return next;
}

export function QalPerfectBuilder() {
  const [level, setLevel] = useState<LevelFilter>("1");
  const [shuffleRows, setShuffleRows] = useState(false);
  const [root, setRoot] = useState<BuilderRoot>(ROOTS[0]);
  const [sel, setSel] = useState<Record<PgnKey, RowChoice>>(blankChoices);
  const [order, setOrder] = useState<PgnKey[]>(FORMS.map((form) => form.k));
  const [graded, setGraded] = useState(false);
  const [counted, setCounted] = useState(false);
  const [results, setResults] = useState<Partial<Record<PgnKey, RowGrade>>>({});
  const [score, setScore] = useState<number | null>(null);
  const [stats, setStats] = useState<BuilderStats>(emptyStats);

  function deal(nextLevel: LevelFilter, avoid: BuilderRoot | null, mix: boolean) {
    setRoot(pickRoot(nextLevel, avoid));
    setSel(blankChoices());
    setOrder(mix ? shuffled(FORMS.map((form) => form.k)) : FORMS.map((form) => form.k));
    setGraded(false);
    setCounted(false);
    setResults({});
    setScore(null);
  }

  useEffect(() => {
    setStats(loadStats());
  }, []);

  function setField(k: PgnKey, field: "v1" | "v2" | "v3" | "end", value: string) {
    setSel((prev) => ({
      ...prev,
      [k]: { ...prev[k], [field]: value },
    }));
  }

  function setMerge(k: PgnKey, merge: boolean) {
    setSel((prev) => ({ ...prev, [k]: { ...prev[k], merge } }));
  }

  function setTone(k: PgnKey, tone: RowChoice["tone"]) {
    setSel((prev) => ({ ...prev, [k]: { ...prev[k], tone } }));
  }

  const done = FORMS.filter((form) => filled(sel[form.k])).length;
  const openRows = order.filter((k) => openFields(sel[k]).length > 0);
  const byK = Object.fromEntries(FORMS.map((form) => [form.k, form])) as Record<PgnKey, (typeof FORMS)[number]>;
  const verse = perfectVerse(root.c);

  function grade() {
    if (!root) return;
    const next: Partial<Record<PgnKey, RowGrade>> = {};
    let points = 0;
    for (const form of FORMS) {
      const row = gradeRow(root, form, sel[form.k]);
      next[form.k] = row;
      if (row.ok) points += 1;
    }
    setResults(next);
    setScore(points);
    setGraded(true);
    const first = order.find((k) => !next[k]?.ok);
    if (first) document.getElementById(`qal-row-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!counted) {
      const saved = {
        n: stats.n + 1,
        sum: stats.sum + points,
        perfect: stats.perfect + (points === 9 ? 1 : 0),
      };
      setStats(saved);
      setCounted(true);
      try {
        window.localStorage.setItem(STATS_KEY, JSON.stringify(saved));
      } catch {
        /* a private window can refuse the write */
      }
    }
  }

  return (
    <div className="grid gap-4">
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar · Qal perfect</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Qal Perfect Builder</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Build all nine forms of the root. For each row pick the vowel under each root letter, the ending, and the accent or the meteg. No vowel, no accent, and no meteg are real choices. The word assembles as you choose.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex overflow-hidden rounded-[var(--radius-md)] bg-card shadow-[var(--shadow-border)]" role="radiogroup" aria-label="Root set">
            {(
              [
                ["1", "Strong roots"],
                ["2", "Assimilating"],
                ["all", "All"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={level === id}
                onClick={() => {
                  if (level === id) return;
                  setLevel(id);
                  deal(id, root, shuffleRows);
                }}
                className={cn(
                  "min-h-11 px-3 text-sm font-semibold",
                  level === id ? "bg-primary text-primary-foreground" : "text-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="inline-flex min-h-11 items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={shuffleRows}
              onChange={(event) => {
                const on = event.target.checked;
                setShuffleRows(on);
                setOrder(on ? shuffled(FORMS.map((form) => form.k)) : FORMS.map((form) => form.k));
                setGraded(false);
                setResults({});
                setScore(null);
              }}
            />
            Shuffle row order
          </label>
        </div>
      </Panel>

      <Panel className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Root</p>
          <p className="he-word font-hebrew text-5xl leading-tight text-ink" dir="rtl" lang="he">
            {rootDisplay(root)}
          </p>
        </div>
        <p className="text-base text-ink">
          “{root.gloss}”
          <span className="mt-1 block text-sm text-muted">
            {root.assim ? "Assimilating root: watch where letters merge." : "Strong root: no weak letters."}
          </span>
          {verse ? <span className="mt-1 block text-sm text-muted">Qal perfect in {verse.where}</span> : null}
        </p>
      </Panel>

      <div className="grid gap-2">
        {order.map((k) => {
          const form = byK[k];
          const choice = sel[k];
          const preview = buildForm(root, choice, k);
          const row = results[k];
          const open = openFields(choice);
          const bad = new Set(row && !row.ok ? row.misses : []);
          return (
            <div
              id={`qal-row-${k}`}
              key={k}
              className={cn(
                "grid grid-cols-1 items-center gap-3 rounded-[var(--radius-lg)] bg-card p-3 shadow-[var(--shadow-border)] sm:grid-cols-[4.6rem_7.5rem_minmax(0,1fr)]",
                row?.ok && "bg-good/15",
                row && !row.ok && "bg-danger/10",
                !row && done > 0 && open.length > 0 && "ring-2 ring-danger",
              )}
            >
              <div>
                <p className="font-mono text-base font-medium text-ink">{k}</p>
                <p className="text-xs leading-tight text-muted">{form.long}</p>
              </div>
              <p className="he-taam text-center text-4xl leading-[2.2] text-ink" dir="rtl" lang="he">
                {preview === null ? "—" : preview || " "}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <VowelSelect
                  label={`Vowel under first root letter, ${k}`}
                  placeholder="1st vowel…"
                  value={choice.v1}
                  bad={bad.has("v1")}
                  onChange={(value) => setField(k, "v1", value)}
                />
                <VowelSelect
                  label={`Vowel under second root letter, ${k}`}
                  placeholder="2nd vowel…"
                  value={choice.v2}
                  bad={bad.has("v2")}
                  onChange={(value) => setField(k, "v2", value)}
                />
                <VowelSelect
                  label={`Vowel under third root letter, ${k}`}
                  placeholder="3rd vowel…"
                  value={choice.v3}
                  bad={bad.has("v3")}
                  onChange={(value) => setField(k, "v3", value)}
                />
                <EndSelect label={`Ending, ${k}`} value={choice.end} bad={bad.has("end")} onChange={(value) => setField(k, "end", value)} />
                <ToneSelect person={k} value={choice.tone} bad={bad.has("tone")} onChange={(value) => setTone(k, value)} />
                {root.assim ? (
                  <label
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-1 text-sm text-muted sm:col-span-2",
                      bad.has("merge") && "ring-2 ring-danger",
                    )}
                  >
                    <input type="checkbox" checked={choice.merge} onChange={(event) => setMerge(k, event.target.checked)} />
                    Merge final root letter with ending
                  </label>
                ) : null}
              </div>
              {done > 0 && open.length && !row ? (
                <p className="text-sm font-semibold text-danger sm:col-span-3">Still needed: {open.join(", ")}.</p>
              ) : null}
              {row ? (
                <div className="border-t border-dashed border-border pt-2 sm:col-span-3">
                  <p className={cn("font-semibold", row.ok ? "text-good" : "text-danger")}>{row.ok ? "✓ Correct" : "✗ Not yet"}</p>
                  {!row.ok ? (
                    <>
                      <p className="mt-1 flex flex-wrap items-baseline gap-2 text-sm">
                        <span>Answer:</span>
                        <span className="he-taam text-3xl leading-[2.2] text-ink" dir="rtl" lang="he">
                          {row.answer}
                        </span>
                      </p>
                      <ul className="mt-1 list-disc space-y-1 ps-5 text-sm">
                        {row.diffs.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                      <p className="mt-1 text-sm text-muted">{row.note}</p>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Rows filled: {done} of 9</p>
          {done > 0 && openRows.length ? (
            <p className="text-sm font-semibold text-danger">Still open: {openRows.join(", ")}. A blank menu is not a choice.</p>
          ) : null}
          {score !== null ? (
            <p className="text-2xl font-bold tabular-nums text-ink">
              {score} / 9{score === 9 ? " — all nine" : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {graded ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSel(blankChoices());
                setGraded(false);
                setResults({});
                setScore(null);
              }}
            >
              Clear and retry
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => deal(level, root, shuffleRows)}>
            Skip to next root
          </Button>
          <Button type="button" onClick={grade}>
            {graded ? "Grade again" : "Submit for grading"}
          </Button>
        </div>
      </Panel>

      {score !== null && score >= 8 && verse ? <OpenedVerse verse={verse} letters={root.c} /> : null}

      <p className="text-sm tabular-nums text-muted">
        {stats.n
          ? `Roots graded: ${stats.n} · Average: ${(stats.sum / stats.n).toFixed(1)} / 9 · Perfect rounds: ${stats.perfect}`
          : "Your first graded root will show up here."}
      </p>
    </div>
  );
}

function OpenedVerse({ verse, letters }: { verse: { ref: string; where: string; he: string; en: string }; letters: string }) {
  const marked = markQueryInVerse(verse.he, letters);
  const [book, ch] = verse.ref.split(".");
  return (
    <Panel>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Qal perfect · {verse.where}</p>
      <p className="he-taam mt-2 text-2xl leading-[2.2] text-ink" dir="rtl" lang="he">
        {marked.map((part, index) => (
          <span key={`${part.word}-${index}`} className={part.hit ? "text-primary" : undefined}>
            {part.word}{" "}
          </span>
        ))}
      </p>
      <p className="mt-2 text-sm text-muted">{verse.en}</p>
      {book && ch ? (
        <p className="mt-3">
          <Link to="/listen/read/$book/$ch" params={{ book, ch }} className="font-semibold text-primary">
            Read it in the text
          </Link>
        </p>
      ) : null}
    </Panel>
  );
}

function VowelSelect({
  label,
  placeholder,
  value,
  bad,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: VowelId | "none" | "";
  bad?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      aria-invalid={bad || undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-parchment px-2 font-hebrew text-base text-ink",
        bad && "ring-2 ring-danger",
      )}
    >
      <option value="">{placeholder}</option>
      <option value="none">{CIRCLE} no vowel</option>
      {VOWEL_OPTS.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {CIRCLE}
          {VOWELS[opt.id]} {opt.name}
        </option>
      ))}
    </select>
  );
}

function ToneSelect({
  person,
  value,
  bad,
  onChange,
}: {
  person: string;
  value: RowChoice["tone"];
  bad?: boolean;
  onChange: (value: RowChoice["tone"]) => void;
}) {
  return (
    <select
      aria-label={`Accent or meteg, ${person}`}
      aria-invalid={bad || undefined}
      value={value}
      onChange={(event) => onChange(event.target.value as RowChoice["tone"])}
      className={cn(
        "he-taam min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-parchment px-2 text-base text-ink sm:col-span-2",
        bad && "ring-2 ring-danger",
      )}
    >
      <option value="">Accent or meteg…</option>
      <option value="none">No accent and no meteg</option>
      <option value="accent">{"\u25CC\u05AB"} Accent on the second letter</option>
      <option value="meteg">{"\u25CC\u05BD"} Meteg under the first letter</option>
    </select>
  );
}

function EndSelect({
  label,
  value,
  bad,
  onChange,
}: {
  label: string;
  value: EndId | "";
  bad?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      aria-invalid={bad || undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-parchment px-2 font-hebrew text-base text-ink",
        bad && "ring-2 ring-danger",
      )}
    >
      <option value="">Ending…</option>
      {END_ORDER.map((id) => {
        const ending = ENDINGS[id];
        const shown = id === "none" ? "no ending" : `${ending.tail}  ${ending.name}`;
        return (
          <option key={id} value={id}>
            {shown}
          </option>
        );
      })}
    </select>
  );
}
