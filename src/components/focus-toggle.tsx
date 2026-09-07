import { cn } from "@/lib/cn";
import { statsFor, useStudy, type FocusMode } from "@/lib/store";
import { itemsForWeek } from "@/lib/vocab";

export function FocusToggle() {
  const week = useStudy((s) => s.week);
  const cards = useStudy((s) => s.cards);
  const focus = useStudy((s) => s.focus);
  const setFocus = useStudy((s) => s.setFocus);
  const st = statsFor(itemsForWeek(week), cards);
  const weak = (st.weak ?? 0) + (st.high ?? 0);

  const options: Array<{ id: FocusMode; label: string; hint: string }> = [
    { id: "due", label: "Due + weak first", hint: "Spaced review, misses on top" },
    { id: "weak", label: `Weak book${weak ? ` · ${weak}` : ""}`, hint: "Told first, then misses" },
  ];

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setFocus(opt.id)}
          className={cn(
            "min-h-11 rounded-[var(--radius-md)] px-3 py-2 text-left shadow-[var(--shadow-border)]",
            focus === opt.id ? "bg-ink text-parchment" : "bg-card",
          )}
        >
          <span className="block text-sm font-medium">{opt.label}</span>
          <span className={cn("block text-xs", focus === opt.id ? "text-parchment/70" : "text-muted")}>{opt.hint}</span>
        </button>
      ))}
    </div>
  );
}
