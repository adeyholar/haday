import type { ReactNode } from "react";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { liveMatchAny, normalizeHebrewFull, pointingHint } from "@/lib/hebrew";
import { accentStillOpen, liveMatchParadigm } from "@/lib/paradigm/normalize";
import { GradeBanner } from "@/components/grade-banner";
import { CONSONANTS } from "@/lib/alphabet";

const CONSONANT_KEYS = CONSONANTS.map((c) => ({ glyph: c.letter, name: c.name }));

const FINAL_KEYS = CONSONANTS.filter((c) => c.final).map((c) => ({
  glyph: c.final as string,
  name: `Final ${c.name}`,
}));

type PadKeyDef = { id: string; insert: string; show: string; name: string };

const VOWEL_POINTS: PadKeyDef[] = [
  { id: "shewa", insert: "ְ", show: "◌ְ", name: "Shewa" },
  { id: "pathach", insert: "ַ", show: "◌ַ", name: "Pathach" },
  { id: "qamets", insert: "ָ", show: "◌ָ", name: "Qamets" },
  { id: "seghol", insert: "ֶ", show: "◌ֶ", name: "Seghol" },
  { id: "tsere", insert: "ֵ", show: "◌ֵ", name: "Tsere" },
  { id: "hireq", insert: "ִ", show: "◌ִ", name: "Hireq" },
  { id: "holem", insert: "ֹ", show: "◌ֹ", name: "Holem" },
  { id: "qibbuts", insert: "ֻ", show: "◌ֻ", name: "Qibbuts" },
];

const REDUCED: PadKeyDef[] = [
  { id: "hateph-a", insert: "ֲ", show: "◌ֲ", name: "Hateph pathach" },
  { id: "hateph-e", insert: "ֱ", show: "◌ֱ", name: "Hateph seghol" },
  { id: "hateph-o", insert: "ֳ", show: "◌ֳ", name: "Hateph qamets" },
];

const MARKS: PadKeyDef[] = [
  { id: "dagesh", insert: "ּ", show: "◌ּ", name: "Dagesh" },
  { id: "shin-dot", insert: "ׁ", show: "◌ׁ", name: "Shin dot" },
  { id: "sin-dot", insert: "ׂ", show: "◌ׂ", name: "Sin dot" },
];

const VOWEL_LETTERS: PadKeyDef[] = [
  { id: "shureq", insert: "וּ", show: "וּ", name: "Shureq" },
  { id: "holem-waw", insert: "וֹ", show: "וֹ", name: "Holem vav" },
  { id: "hireq-yod", insert: "ִי", show: "◌ִי", name: "Hireq yod" },
  { id: "tsere-yod", insert: "ֵי", show: "◌ֵי", name: "Tsere yod" },
  { id: "qamets-he", insert: "ָה", show: "◌ָה", name: "Qamets he" },
];

function samePiece(a: string, b: string) {
  const left = normalizeHebrewFull(a);
  const right = normalizeHebrewFull(b);
  if (left || right) return left === right;
  return a === b;
}

function dropLastMark(s: string) {
  if (!s) return s;
  const parts = [...s];
  const last = parts[parts.length - 1] ?? "";
  const cp = last.codePointAt(0) ?? 0;
  if (cp >= 0x0591 && cp <= 0x05c7) return parts.slice(0, -1).join("");
  return dropLastGrapheme(s);
}

function dropLastGrapheme(s: string) {
  if (!s) return s;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const parts = [...new Intl.Segmenter("he", { granularity: "grapheme" }).segment(s)];
    return parts.slice(0, -1).map((p) => p.segment).join("");
  }
  return [...s].slice(0, -1).join("");
}

function PadKey({
  glyph,
  name,
  disabled,
  lit,
  quiet,
  shake,
  taam,
  onClick,
}: {
  glyph: string;
  name: string;
  disabled?: boolean;
  lit?: boolean;
  quiet?: boolean;
  shake?: boolean;
  taam?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={name}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-[var(--radius-sm)] bg-card px-1 shadow-[var(--shadow-border)] disabled:opacity-40",
        taam ? "min-h-20 py-1" : "min-h-12",
        quiet && "opacity-40",
        lit && "ring-2 ring-primary",
        shake && "ring-2 ring-danger",
      )}
    >
      <span className={cn("flex flex-col items-center", taam ? "he-taam justify-center" : "he-word")}>
        <span
          className={taam ? "text-3xl" : "text-3xl leading-none"}
          style={taam ? { lineHeight: 2.1, display: "block" } : undefined}
        >
          {glyph}
        </span>
        {taam ? <span className="font-sans text-[10px] font-semibold uppercase tracking-wide text-muted">{name}</span> : null}
      </span>
    </button>
  );
}

function PadSection({
  title,
  hint,
  cols,
  rtl,
  children,
}: {
  title: string;
  hint?: string;
  cols: "cons" | "three" | "four" | "five";
  rtl?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="mt-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{title}</h3>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      <div
        dir={rtl ? "rtl" : "ltr"}
        className={cn(
          "grid gap-1.5",
          cols === "cons" && "grid-cols-6",
          cols === "three" && "grid-cols-3",
          cols === "four" && "grid-cols-4",
          cols === "five" && "grid-cols-5",
        )}
      >
        {children}
      </div>
    </section>
  );
}

type Props = {
  value: string;
  onChange: (next: string) => void | string;
  target: string;
  alts?: string[];
  disabled?: boolean;
  strict?: boolean;
  hideHint?: boolean;
  /** When false, no live Correct / Try again / rings until the parent grades a submit. */
  liveGrade?: boolean;
  /** Spell-strict walk: only the expected piece is inserted. Others shake. */
  guide?: { expected: string | null; glow: string[]; shake: string | null; onMiss: (glyph: string) => void } | null;
  /** Accent and meteg. Off everywhere except the verb paradigm. */
  extraMarks?: boolean;
  /** Hide one-tap endings such as qamets-he, so the student builds them. */
  hideVowelLetters?: boolean;
  /** Backspace removes one mark, not the whole letter. */
  markBackspace?: boolean;
  /** When it returns true, the accent or meteg is placed by the parent. A string is the word after that placement. */
  onSpecialMark?: (insert: string) => boolean | string;
};

export function HebrewType({
  value,
  onChange,
  target,
  alts,
  disabled,
  strict = false,
  hideHint = false,
  liveGrade = true,
  guide = null,
  extraMarks = false,
  hideVowelLetters = false,
  markBackspace = false,
  onSpecialMark,
}: Props) {
  const paradigm = extraMarks && strict;
  const live = paradigm ? liveMatchParadigm(target, value) : liveMatchAny(target, value, alts, strict);
  const valueRef = useRef(value);
  valueRef.current = value;
  const extra = live === "off" ? pointingHint(target, value) : null;
  const offLabel = extra === "Use the final form" ? extra : "Try again";
  const accentOpen = paradigm && live === "prefix" && accentStillOpen(target, value);
  const hint = strict
    ? live === "empty"
      ? "Consonant first, then its vowel. Full match."
      : live === "exact"
        ? "Correct"
        : live === "prefix"
          ? accentOpen
            ? "Right so far. Add the accent."
            : paradigm
              ? "Right so far."
              : "Keep going — that prefix is right."
          : offLabel
    : live === "empty"
      ? "Consonant first, then its vowel. Vowels optional to match."
      : live === "exact"
        ? "Correct"
        : live === "prefix"
          ? "Keep going — that prefix is right."
          : offLabel;
  const showLive = (liveGrade || Boolean(disabled)) && !hideHint;
  const paint = liveGrade || Boolean(disabled);

  function add(chunk: string) {
    if (disabled) return;
    const current = valueRef.current;
    if (guide) {
      const want = guide.expected;
      const same = want != null && samePiece(chunk, want);
      if (!same) {
        guide.onMiss(chunk);
        return;
      }
    }
    if (chunk === "\u05AB" || chunk === "\u05BD") {
      const placed = onSpecialMark?.(chunk);
      if (placed === true) return;
      if (typeof placed === "string") {
        const stored = onChange(placed);
        valueRef.current = typeof stored === "string" ? stored : placed;
        return;
      }
    }
    const next = current + chunk;
    const stored = onChange(next);
    valueRef.current = typeof stored === "string" ? stored : next;
  }

  function keyFace(insert: string) {
    if (!guide) return {};
    const lit = guide.glow.some((g) => samePiece(g, insert));
    const shaken = guide.shake;
    const shake = shaken != null && samePiece(shaken, insert);
    return { lit, quiet: !lit, shake };
  }

  return (
    <div>
      <input
        dir="rtl"
        lang="he"
        value={value}
        disabled={disabled}
        readOnly
        inputMode="none"
        onChange={(e) => onChange(e.target.value)}
        placeholder="כתוב כאן"
        aria-label="Hebrew word"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "w-full rounded-[var(--radius-md)] border border-border bg-parchment px-4 text-center text-3xl text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          extraMarks ? "he-taam min-h-20 py-2 leading-[2.4]" : "h-14 font-hebrew",
          paint && live === "exact" && "ring-2 ring-good",
          paint && live === "prefix" && extraMarks && "ring-2 ring-primary",
          paint && live === "off" && value && "ring-2 ring-danger",
        )}
      />
      {!disabled && !liveGrade && (
        <p className="mt-2 text-center text-sm font-medium text-muted">
          Type the full word, then Check. No live grade.
        </p>
      )}
      {!disabled && showLive && (live === "exact" || live === "off") && (
        <GradeBanner className="mt-3" ok={live === "exact"} label={hint} size="live" />
      )}
      {!disabled && showLive && live === "off" && extra && extra !== offLabel && (
        <p className="mt-1 text-center text-sm font-semibold text-danger">{extra}</p>
      )}
      {!disabled && showLive && live !== "exact" && live !== "off" && (
        <p className={cn("mt-2 text-center text-sm font-medium", paradigm && live === "prefix" ? "font-semibold text-primary" : "text-muted")}>
          {hint}
        </p>
      )}

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          disabled={disabled || !value}
          onClick={() => {
            const current = valueRef.current;
            const next = markBackspace ? dropLastMark(current) : dropLastGrapheme(current);
            const stored = onChange(next);
            valueRef.current = typeof stored === "string" ? stored : next;
          }}
          className={cn(
            "min-h-11 rounded-[var(--radius-sm)] bg-card text-sm font-medium text-ink shadow-[var(--shadow-border)] disabled:opacity-40",
            guide && guide.expected == null && "ring-2 ring-primary",
          )}
        >
          Backspace
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label="Dagesh"
          onClick={() => add("\u05BC")}
          className={cn(
            "flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-card shadow-[var(--shadow-border)] disabled:opacity-40",
            keyFace("\u05BC").quiet && "opacity-40",
            keyFace("\u05BC").lit && "ring-2 ring-primary",
            keyFace("\u05BC").shake && "ring-2 ring-danger",
          )}
        >
          <span className="he-word text-3xl leading-none">◌ּ</span>
        </button>
        <button
          type="button"
          disabled={disabled || !value}
          onClick={() => {
            valueRef.current = "";
            onChange("");
          }}
          className="min-h-11 rounded-[var(--radius-sm)] bg-card text-sm font-medium text-ink shadow-[var(--shadow-border)] disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      <PadSection title="Consonants" cols="cons" rtl>
        {CONSONANT_KEYS.map((k) => (
          <PadKey key={k.name + k.glyph} glyph={k.glyph} name={k.name} disabled={disabled} {...keyFace(k.glyph)} onClick={() => add(k.glyph)} />
        ))}
      </PadSection>

      <PadSection title="Marks" hint="Tap after the letter" cols="three">
        {MARKS.map((k) => (
          <PadKey key={k.id} glyph={k.show} name={k.name} disabled={disabled} {...keyFace(k.insert)} onClick={() => add(k.insert)} />
        ))}
        {extraMarks ? (
          <>
            <PadKey taam glyph="ק֫" name="Accent" disabled={disabled} {...keyFace("\u05AB")} onClick={() => add("\u05AB")} />
            <PadKey taam glyph="קָֽ" name="Meteg" disabled={disabled} {...keyFace("\u05BD")} onClick={() => add("\u05BD")} />
          </>
        ) : null}
      </PadSection>

      <PadSection title="Final forms" cols="five" rtl>
        {FINAL_KEYS.map((k) => (
          <PadKey key={k.glyph} glyph={k.glyph} name={k.name} disabled={disabled} {...keyFace(k.glyph)} onClick={() => add(k.glyph)} />
        ))}
      </PadSection>

      <PadSection title="Vowels" hint="Sits on the last consonant" cols="four">
        {VOWEL_POINTS.map((k) => (
          <PadKey key={k.id} glyph={k.show} name={k.name} disabled={disabled} {...keyFace(k.insert)} onClick={() => add(k.insert)} />
        ))}
      </PadSection>

      <PadSection title="Reduced" cols="three">
        {REDUCED.map((k) => (
          <PadKey key={k.id} glyph={k.show} name={k.name} disabled={disabled} {...keyFace(k.insert)} onClick={() => add(k.insert)} />
        ))}
      </PadSection>

      {hideVowelLetters ? null : (
      <PadSection title="Vowel letters" hint="Adds the letter + vowel" cols="five">
        {VOWEL_LETTERS.map((k) => (
          <PadKey key={k.id} glyph={k.show} name={k.name} disabled={disabled} {...keyFace(k.insert)} onClick={() => add(k.insert)} />
        ))}
      </PadSection>
      )}

    </div>
  );
}
