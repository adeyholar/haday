import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Hover / focus name for icon-only controls. */
export function NavTip({
  label,
  children,
  side = "bottom",
  full = false,
}: {
  label: string;
  children: ReactNode;
  side?: "bottom" | "top";
  full?: boolean;
}) {
  return (
    <span className={cn("group relative inline-flex", full && "flex w-full")}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-sm)] bg-ink px-2 py-1 text-xs font-semibold text-parchment opacity-0 shadow-lg transition-opacity delay-75 group-hover:opacity-100 group-focus-within:opacity-100",
          side === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5",
        )}
      >
        {label}
      </span>
    </span>
  );
}
