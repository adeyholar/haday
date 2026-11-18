import { useState, type ReactNode } from "react";
import { NO_ENGLISH, TRANSLATION_OPTIONS, englishRefLabel, type EnglishSlot, type TranslationId } from "@/lib/english-line";

const CHOICE_KEY = "haday.english.choice";

export function rememberedTranslation(): TranslationId {
  if (typeof window === "undefined") return "ylt";
  try {
    const saved = window.localStorage.getItem(CHOICE_KEY);
    if (saved === "web" || saved === "ylt") return saved;
  } catch {
    /* ignore */
  }
  return "ylt";
}

export function rememberTranslation(choice: TranslationId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHOICE_KEY, choice);
  } catch {
    /* ignore */
  }
}

export function EnglishAsk({
  ylt,
  web,
  extra,
  verseKey,
  loading = false,
  onOpen,
  startOpen = false,
}: {
  ylt: EnglishSlot;
  web: EnglishSlot;
  extra?: ReactNode;
  /** When this changes, the control closes again. Each verse needs its own tap. */
  verseKey?: string;
  loading?: boolean;
  onOpen?: () => void;
  startOpen?: boolean;
}) {
  const [openKey, setOpenKey] = useState<string | null>(startOpen ? (verseKey ?? "open") : null);
  const [choice, setChoice] = useState<TranslationId | null>(null);
  const open = openKey !== null && openKey === (verseKey ?? "open");
  if (!open) {
    return (
      <button
        type="button"
        className="min-h-11 text-sm font-semibold text-primary"
        onClick={() => {
          setOpenKey(verseKey ?? "open");
          onOpen?.();
        }}
      >
        English
      </button>
    );
  }
  const selected = choice ?? rememberedTranslation();
  const slot = selected === "ylt" ? ylt : web;
  return (
    <div className="mt-2">
      <div className="flex gap-2" role="group" aria-label="English translation">
        {TRANSLATION_OPTIONS.map((label) => {
          const id: TranslationId = label === "YLT" ? "ylt" : "web";
          return (
            <button
              key={label}
              type="button"
              className={`min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold ${selected === id ? "bg-ink text-parchment" : "text-muted"}`}
              aria-pressed={selected === id}
              onClick={() => {
                setChoice(id);
                rememberTranslation(id);
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      {loading ? <p className="mt-2 text-sm text-muted">Loading…</p> : <EnglishLines slot={slot} />}
      {extra}
    </div>
  );
}

export function EnglishLines({ slot }: { slot: EnglishSlot }) {
  if (slot.state === "none") return <p className="mt-2 text-sm text-muted">{slot.message}</p>;
  return (
    <div className="mt-2 space-y-2">
      {slot.lines.map((line) => (
        <p key={`${line.ref}-${line.part ?? ""}`} className="text-sm text-ink">
          <span className="font-semibold">{englishRefLabel(line.ref)}</span> {line.text}
          {line.alsoCovers ? <span className="mt-1 block text-muted">also covers Heb. {line.alsoCovers}</span> : null}
        </p>
      ))}
    </div>
  );
}

export function closedEnglishMessage(): string {
  return NO_ENGLISH;
}

/** A word gloss stays off the page until this control is tapped. */
export function GlossAsk({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  if (!open) {
    return (
      <button type="button" className="min-h-11 text-sm font-semibold text-primary" onClick={() => setOpen(true)}>
        Gloss
      </button>
    );
  }
  return <p className="mt-1 text-sm text-muted">{text}</p>;
}
