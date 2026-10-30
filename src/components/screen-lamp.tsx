import { useEffect, useRef, useState } from "react";
import { Moon, Sun, SunDim } from "lucide-react";
import { cn } from "@/lib/cn";
import { readLamp, setLamp, subscribeLamp, type Lamp } from "@/lib/lamp";

const LAMPS: { id: Lamp; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dim", label: "Dim" },
  { id: "dark", label: "Dark" },
];

export function ScreenChoices({ className }: { className?: string }) {
  const [lamp, set] = useState<Lamp>("light");
  useEffect(() => {
    set(readLamp());
    return subscribeLamp(set);
  }, []);
  return (
    <div className={cn("flex rounded-[var(--radius-md)] bg-card p-0.5 shadow-[var(--shadow-border)]", className)} role="group" aria-label="Screen">
      {LAMPS.map((row) => (
        <button
          key={row.id}
          type="button"
          aria-pressed={lamp === row.id}
          onClick={() => setLamp(row.id)}
          className={cn(
            "min-h-11 flex-1 px-3 text-sm font-semibold",
            lamp === row.id ? "rounded-[var(--radius-sm)] bg-ink text-parchment" : "text-muted",
          )}
        >
          {row.label}
        </button>
      ))}
    </div>
  );
}

export function ScreenLamp() {
  const [open, setOpen] = useState(false);
  const [lamp, set] = useState<Lamp>("light");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    set(readLamp());
    return subscribeLamp(set);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);
  const Icon = lamp === "dark" ? Moon : lamp === "dim" ? SunDim : Sun;
  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        aria-label="Screen brightness"
        aria-expanded={open}
        aria-pressed={lamp !== "light"}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface hover:text-ink"
      >
        <Icon className="size-5" />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-30 w-56">
          <ScreenChoices />
        </div>
      ) : null}
    </div>
  );
}
