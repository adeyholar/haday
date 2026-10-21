import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  END_ORDER,
  ENDINGS,
  FORMS,
  KNOWN_PASSES,
  PASS_AT,
  PREFIX,
  PREFIX_ORDER,
  ROOTS,
  STATS_KEY,
  VOWEL_OPTS,
  VOWELS,
  blankChoices,
  buildForm,
  emptyStats,
  filled,
  gradeRow,
  knownCount,
  nextRoot,
  openFields,
  passCount,
  passesNeeded,
  recordRound,
  rootKnown,
  setKnown,
  verseParts,
  type BuilderRoot,
  type EndId,
  type ImperfectStats,
  type PgnKey,
  type PrefixId,
  type RowChoice,
  type RowGrade,
  type VowelId,
} from "@/lib/qal-imperfect-builder";

const CIRCLE = "\u25CC";

function loadStats(): ImperfectStats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as ImperfectStats;
    if (parsed && typeof parsed.rounds === "number" && parsed.passes) return parsed;
  } catch {
    /* keep the empty board */
  }
  return emptyStats();
}

function saveStats(stats: ImperfectStats) {
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* a private window can refuse the write */
  }
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

export function QalImperfectBuilder() {
  const [shuffleRows, setShuffleRows] = useState(false);
  const [root, setRoot] = useState<BuilderRoot>(ROOTS[0]);
  const [sel, setSel] = useState<Record<PgnKey, RowChoice>>(blankChoices);
  const [order, setOrder] = useState<PgnKey[]>(FORMS.map((form) => form.k));
  const [graded, setGraded] = useState(false);
  const [counted, setCounted] = useState(false);
  const [results, setResults] = useState<Partial<Record<PgnKey, RowGrade>>>({});
  const [score, setScore] = useState<number | null>(null);
  const [stats, setStats] = useState<ImperfectStats>(emptyStats);

  function deal(current: BuilderRoot | null, failed: boolean, mix: boolean, board: ImperfectStats) {
    setRoot(nextRoot(board, current, failed));
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

  function setField(k: PgnKey, field: "pre" | "v1" | "v2" | "v3" | "end", value: string) {
    setSel((prev) => ({ ...prev, [k]: { ...prev[k], [field]: value } }));
  }

  function setTone(k: PgnKey, tone: RowChoice["tone"]) {
    setSel((prev) => ({ ...prev, [k]: { ...prev[k], tone } }));
  }

  const done = FORMS.filter((form) => filled(sel[form.k])).length;
  const openRows = order.filter((k) => openFields(sel[k]).length > 0);
  const byK = Object.fromEntries(FORMS.map((form) => [form.k, form])) as Record<PgnKey, (typeof FORMS)[number]>;
  const known = setKnown(stats);

  function grade() {
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
    if (first) document.getElementById(`qal-imp-row-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!counted) {
      const saved = recordRound(stats, root, points);
      setStats(saved);
      setCounted(true);
      saveStats(saved);
    }
  }

  return (
    <div className="grid gap-4">
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar · Qal imperfect</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Qal Imperfect Builder</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          The imperfect is the prefix conjugation. A prefix may be there, and an ending may be there. No prefix, no vowel, no ending, and no meteg are real choices. Build all ten. A blank menu is not a choice.
        </p>
        <p className="mt-2 max-w-prose text-sm text-muted">
          Four class roots need {KNOWN_PASSES} cleared rounds each: remember, write, keep, gather. {ROOTS.length - 4} more roots are strong verbs the Tanakh uses in this same pattern. Each of those needs one cleared round. A miss brings that root back. The reference stays on the root. The verse opens when the round clears.
        </p>
        <label className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-muted">
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
      </Panel>

      <Panel>
        <p className="text-sm font-semibold text-ink">{known ? "This set is known. Another round keeps it." : `${knownCount(stats)} of ${ROOTS.length} roots known.`}</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {ROOTS.map((item) => {
            const n = Math.min(passesNeeded(item), passCount(stats, item));
            return (
              <li key={item.c} className={cn("rounded-[var(--radius-md)] px-3 py-2 text-sm", item.c === root.c ? "bg-primary/10" : "bg-card")}>
                <span className="he-word text-ink" dir="rtl" lang="he">
                  {item.cite}
                </span>
                <span className="ms-2 text-muted">{rootKnown(stats, item) ? "known" : `${n}/${passesNeeded(item)}`}</span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Root</p>
          <p className="he-word font-hebrew text-5xl leading-tight text-ink" dir="rtl" lang="he">
            {root.cite}
          </p>
        </div>
        <p className="text-base text-ink">
          “{root.gloss}”
          <span className="mt-1 block text-sm text-muted">Qal imperfect in {root.where}</span>
          <span className="mt-1 block text-sm text-muted">
            {rootKnown(stats, root) ? "Known. It can still return." : `Cleared ${Math.min(passesNeeded(root), passCount(stats, root))} of ${passesNeeded(root)}.`}
          </span>
        </p>
      </Panel>

      <div className="grid gap-2">
        {order.map((k) => {
          const form = byK[k];
          const choice = sel[k];
          const preview = buildForm(root, choice);
          const row = results[k];
          const open = openFields(choice);
          const bad = new Set(row && !row.ok ? row.misses : []);
          return (
            <div
              id={`qal-imp-row-${k}`}
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
                {preview || " "}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <PrefixSelect value={choice.pre} bad={bad.has("pre")} onChange={(value) => setField(k, "pre", value)} person={k} />
                <VowelSelect label={`Vowel under first root letter, ${k}`} placeholder="1st vowel…" value={choice.v1} bad={bad.has("v1")} onChange={(value) => setField(k, "v1", value)} />
                <VowelSelect label={`Vowel under second root letter, ${k}`} placeholder="2nd vowel…" value={choice.v2} bad={bad.has("v2")} onChange={(value) => setField(k, "v2", value)} />
                <VowelSelect label={`Vowel under third root letter, ${k}`} placeholder="3rd vowel…" value={choice.v3} bad={bad.has("v3")} onChange={(value) => setField(k, "v3", value)} />
                <EndSelect label={`Ending, ${k}`} value={choice.end} bad={bad.has("end")} onChange={(value) => setField(k, "end", value)} />
                <ToneSelect person={k} value={choice.tone} bad={bad.has("tone")} onChange={(value) => setTone(k, value)} />
              </div>
              {done > 0 && open.length && !row ? (
                <p className="text-sm font-semibold text-danger sm:col-span-3">Still needed: {open.join(", ")}.</p>
              ) : null}
              {row ? (
                <div className="border-t border-dashed border-border pt-2 sm:col-span-3">
                  <p className={cn("font-semibold", row.ok ? "text-good" : "text-danger")}>{row.ok ? "Correct" : "Not yet"}</p>
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
          <p className="text-sm text-muted">Rows filled: {done} of {FORMS.length}</p>
          {done > 0 && openRows.length ? (
            <p className="text-sm font-semibold text-danger">Still open: {openRows.join(", ")}. A blank menu is not a choice.</p>
          ) : null}
          {score !== null ? (
            <p className="text-2xl font-bold tabular-nums text-ink">
              {score} / {FORMS.length}
              {score >= PASS_AT ? " — round cleared" : " — this root comes back"}
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
          <Button type="button" variant="outline" onClick={() => deal(root, false, shuffleRows, stats)}>
            Skip to next root
          </Button>
          {graded && score !== null ? (
            <Button type="button" onClick={() => deal(root, score < PASS_AT, shuffleRows, stats)}>
              {score < PASS_AT ? "Same root again" : "Next root"}
            </Button>
          ) : (
            <Button type="button" onClick={grade}>
              Submit for grading
            </Button>
          )}
        </div>
      </Panel>

      {score !== null && score >= PASS_AT ? <VerseOpen root={root} /> : null}

      <p className="text-sm tabular-nums text-muted">
        {stats.rounds
          ? `Rounds: ${stats.rounds}. A cleared round is ${PASS_AT} of ${FORMS.length}. ${knownCount(stats)} of ${ROOTS.length} roots known.`
          : "Your first graded root will show up here."}
      </p>
    </div>
  );
}

function VerseOpen({ root }: { root: BuilderRoot }) {
  const marked = verseParts(root.he, root.c);
  const [book, ch] = root.ref.split(".");
  return (
    <Panel>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{root.where}</p>
      <p className="he-taam mt-2 text-2xl leading-[2.2] text-ink" dir="rtl" lang="he">
        {marked.map((part, index) => (
          <span key={`${part.word}-${index}`} className={part.hit ? "text-primary" : undefined}>
            {part.word}{" "}
          </span>
        ))}
      </p>
      <p className="mt-2 text-sm text-muted">{root.en}</p>
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

function fieldClass(bad?: boolean) {
  return cn(
    "min-h-11 w-full rounded-[var(--radius-sm)] border border-border bg-parchment px-2 text-base text-ink",
    bad && "ring-2 ring-danger",
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
    <select aria-label={label} aria-invalid={bad || undefined} value={value} onChange={(event) => onChange(event.target.value)} className={cn(fieldClass(bad), "font-hebrew")}>
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

function PrefixSelect({
  person,
  value,
  bad,
  onChange,
}: {
  person: string;
  value: PrefixId | "none" | "";
  bad?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select aria-label={`Prefix, ${person}`} aria-invalid={bad || undefined} value={value} onChange={(event) => onChange(event.target.value)} className={cn(fieldClass(bad), "font-hebrew sm:col-span-2")}>
      <option value="">Prefix…</option>
      <option value="none">no prefix</option>
      {PREFIX_ORDER.map((id) => (
        <option key={id} value={id}>
          {PREFIX[id]}
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
      className={cn(fieldClass(bad), "he-taam sm:col-span-2")}
    >
      <option value="">Accent or meteg…</option>
      <option value="none">No accent and no meteg</option>
      <option value="accent">{"\u25CC\u05AB"} Accent on the theme vowel</option>
      <option value="meteg">{"\u25CC\u05BD"} Meteg under the prefix</option>
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
    <select aria-label={label} aria-invalid={bad || undefined} value={value} onChange={(event) => onChange(event.target.value)} className={cn(fieldClass(bad), "font-hebrew")}>
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
