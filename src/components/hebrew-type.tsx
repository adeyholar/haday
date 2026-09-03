import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { liveMatchAny, pointingHint } from "@/lib/hebrew";
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
  onClick,
}: {
  glyph: string;
  name: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={name}
      onClick={onClick}
      className="flex min-h-12 items-center justify-center rounded-[var(--radius-sm)] bg-card px-1 shadow-[var(--shadow-border)] disabled:opacity-40"
    >
      <span className="he-word text-3xl leading-none">{glyph}</span>
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
  onChange: (next: string) => void;
  target: string;
  alts?: string[];
  disabled?: boolean;
  strict?: boolean;
  hideHint?: boolean;
};

export function HebrewType({ value, onChange, target, alts, disabled, strict = false, hideHint = false }: Props) {
  const live = liveMatchAny(target, value, alts, strict);
  const extra = live === "off" ? pointingHint(target, value) : null;
  const offLabel = extra === "Use the final form" ? extra : "Not correct";
  const hint = strict
    ? live === "empty"
      ? "Consonant first, then its vowel. Full match."
      : live === "exact"
        ? "Correct"
        : live === "prefix"
          ? "Keep going — that prefix is right."
          : offLabel
    : live === "empty"
      ? "Consonant first, then its vowel. Vowels optional to match."
      : live === "exact"
        ? "Correct"
        : live === "prefix"
          ? "Keep going — that prefix is right."
          : offLabel;

  function add(chunk: string) {
    if (disabled) return;
    onChange(value + chunk);
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
          "h-14 w-full rounded-[var(--radius-md)] border border-border bg-parchment px-4 text-center font-hebrew text-3xl text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          live === "exact" && "ring-2 ring-good",
          live === "off" && value && "ring-2 ring-danger",
        )}
      />
      {!disabled && !hideHint && (live === "exact" || live === "off") && (
        <GradeBanner className="mt-3" ok={live === "exact"} label={hint} size="live" />
      )}
      {!disabled && !hideHint && live === "off" && extra && extra !== offLabel && (
        <p className="mt-1 text-center text-sm font-semibold text-danger">{extra}</p>
      )}
      {!disabled && !hideHint && live !== "exact" && live !== "off" && (
        <p className="mt-2 text-center text-sm font-medium text-muted">{hint}</p>
      )}

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          disabled={disabled || !value}
          onClick={() => onChange(dropLastGrapheme(value))}
          className="min-h-11 rounded-[var(--radius-sm)] bg-card text-sm font-medium text-ink shadow-[var(--shadow-border)] disabled:opacity-40"
        >
          Backspace
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label="Dagesh"
          onClick={() => add("ּ")}
          className="flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] bg-card shadow-[var(--shadow-border)] disabled:opacity-40"
        >
          <span className="he-word text-3xl leading-none">◌ּ</span>
        </button>
        <button
          type="button"
          disabled={disabled || !value}
          onClick={() => onChange("")}
          className="min-h-11 rounded-[var(--radius-sm)] bg-card text-sm font-medium text-ink shadow-[var(--shadow-border)] disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      <PadSection title="Consonants" cols="cons" rtl>
        {CONSONANT_KEYS.map((k) => (
          <PadKey key={k.name + k.glyph} glyph={k.glyph} name={k.name} disabled={disabled} onClick={() => add(k.glyph)} />
        ))}
      </PadSection>

      <PadSection title="Marks" hint="Tap after the letter" cols="three">
        {MARKS.map((k) => (
          <PadKey key={k.id} glyph={k.show} name={k.name} disabled={disabled} onClick={() => add(k.insert)} />
        ))}
      </PadSection>

      <PadSection title="Final forms" cols="five" rtl>
        {FINAL_KEYS.map((k) => (
          <PadKey key={k.glyph} glyph={k.glyph} name={k.name} disabled={disabled} onClick={() => add(k.glyph)} />
        ))}
      </PadSection>

      <PadSection title="Vowels" hint="Sits on the last consonant" cols="four">
        {VOWEL_POINTS.map((k) => (
          <PadKey key={k.id} glyph={k.show} name={k.name} disabled={disabled} onClick={() => add(k.insert)} />
        ))}
      </PadSection>

      <PadSection title="Reduced" cols="three">
        {REDUCED.map((k) => (
          <PadKey key={k.id} glyph={k.show} name={k.name} disabled={disabled} onClick={() => add(k.insert)} />
        ))}
      </PadSection>

      <PadSection title="Vowel letters" hint="Adds the letter + vowel" cols="five">
        {VOWEL_LETTERS.map((k) => (
          <PadKey key={k.id} glyph={k.show} name={k.name} disabled={disabled} onClick={() => add(k.insert)} />
        ))}
      </PadSection>

    </div>
  );
}
