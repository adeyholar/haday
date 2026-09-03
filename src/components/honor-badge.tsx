import { Crown } from "lucide-react";
import { cn } from "@/lib/cn";

export function HonorBadge({
  honor,
  className,
  compact = false,
}: {
  honor: { title: string; short: string };
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      title={honor.title}
      className={cn(
        "inline-flex min-h-7 max-w-full items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold tracking-wide text-primary-foreground",
        className,
      )}
    >
      <span className="truncate">{compact ? honor.short : honor.title}</span>
    </span>
  );
}

export function CrownBadge({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span
      title="Crown of the Text — 100% on the Ultimate Challenge"
      className={cn(
        "inline-flex min-h-7 max-w-full items-center gap-1 rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold tracking-wide text-parchment",
        className,
      )}
    >
      <Crown className="size-3.5 shrink-0" />
      <span className="truncate">{compact ? "Crown" : "Crown of the Text"}</span>
    </span>
  );
}
