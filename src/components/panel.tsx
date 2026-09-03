import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]", className)}>
      {children}
    </div>
  );
}
