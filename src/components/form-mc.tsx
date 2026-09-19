import { cn } from "@/lib/cn";
import { CUE_TRY_AGAIN } from "@/lib/try-again";

export type ProduceMode = "do" | "choose" | "hard";

export function ProduceModeChips({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (next: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-medium shadow-[var(--shadow-border)]",
            value === o.id ? "bg-ink text-parchment" : "bg-card text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function HebrewFormChoices({
  choices,
  correct,
  revealed,
  missed,
  picked,
  onPick,
}: {
  choices: string[];
  correct: string;
  revealed: boolean;
  missed: string | null;
  picked: string | null;
  onPick: (form: string) => void;
}) {
  return (
    <ul className="mt-4 grid gap-2">
      {choices.map((c) => {
        const firstMiss = missed === c;
        const selected = picked === c;
        const ok = c === correct;
        return (
          <li key={c}>
            <button
              type="button"
              disabled={revealed || firstMiss}
              onClick={() => onPick(c)}
              className={cn(
                "he-word w-full min-h-12 rounded-[var(--radius-md)] px-4 py-3 text-2xl shadow-[var(--shadow-border)]",
                !revealed && !firstMiss && "bg-card hover:bg-surface",
                firstMiss && "bg-danger text-parchment",
                revealed && ok && "bg-good text-parchment",
                revealed && selected && !ok && "bg-danger text-parchment",
                revealed && !selected && !ok && !firstMiss && "bg-card text-muted",
              )}
              lang="he"
              dir="rtl"
            >
              {c}
            </button>
          </li>
        );
      })}
      {missed && !revealed ? (
        <li className="try-flash text-center text-lg font-bold uppercase tracking-wide text-danger">{CUE_TRY_AGAIN}</li>
      ) : null}
    </ul>
  );
}

export const TYPE_PRODUCE_OPTIONS = [
  { id: "do", label: "Do it" },
  { id: "choose", label: "Choose" },
  { id: "hard", label: "Hard choose" },
] as const;

export const WRITE_PRODUCE_OPTIONS = [
  { id: "type", label: "Type" },
  { id: "pad", label: "Handwrite" },
  { id: "choose", label: "Choose" },
  { id: "hard", label: "Hard choose" },
] as const;
