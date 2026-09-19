import { cn } from "@/lib/cn";
import { IL_ROWS, NIKKUD_KEYS, FINGER_LABEL, fingerFor, type FingerId } from "@/lib/hebrew-typing/layout";

const FINGER_TONE: Record<FingerId, string> = {
  lp: "bg-danger/25",
  lr: "bg-primary/20",
  lm: "bg-good/20",
  li: "bg-primary/35",
  ri: "bg-primary/35",
  rm: "bg-good/20",
  rr: "bg-primary/20",
  rp: "bg-danger/25",
};

export function TypeKeyboard({
  glow,
  nikkud,
  onKey,
}: {
  glow: string | null;
  nikkud: boolean;
  onKey: (ch: string) => void;
}) {
  const glowFinger = glow ? fingerFor(glow) : null;
  return (
    <div className="select-none">
      {glowFinger ? (
        <p className="mb-2 text-center text-sm text-muted">
          Use your <span className="font-semibold text-ink">{FINGER_LABEL[glowFinger]}</span>
        </p>
      ) : null}
      <div className="space-y-1.5">
        {IL_ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1">
            {row.map((ch) => {
              const finger = fingerFor(ch);
              const lit = glow === ch;
              return (
                <button
                  key={ch}
                  type="button"
                  dir="rtl"
                  lang="he"
                  onClick={() => onKey(ch)}
                  className={cn(
                    "he-word flex h-11 min-w-9 items-center justify-center rounded-[var(--radius-sm)] px-1 text-lg shadow-[var(--shadow-border)] sm:h-12 sm:min-w-10 sm:text-xl",
                    lit ? "bg-ink text-parchment" : finger ? FINGER_TONE[finger] : "bg-card",
                  )}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {nikkud ? (
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {NIKKUD_KEYS.map((n) => (
            <button
              key={n.name}
              type="button"
              onClick={() => onKey(n.mark)}
              className={cn(
                "flex h-10 min-w-10 flex-col items-center justify-center rounded-[var(--radius-sm)] bg-card px-1 text-[10px] text-muted shadow-[var(--shadow-border)]",
                glow === n.mark && "bg-ink text-parchment",
              )}
            >
              <span className="he-word text-lg text-ink" lang="he">
                ב{n.mark}
              </span>
              <span className={glow === n.mark ? "text-parchment/80" : ""}>{n.name}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-2 flex justify-center">
        <button
          type="button"
          onClick={() => onKey("Backspace")}
          className="h-10 rounded-[var(--radius-sm)] bg-card px-4 text-sm shadow-[var(--shadow-border)]"
        >
          Backspace
        </button>
      </div>
    </div>
  );
}
