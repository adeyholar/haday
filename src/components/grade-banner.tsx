import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  ok: boolean;
  label?: string;
  size?: "live" | "result";
  className?: string;
};

export function GradeBanner({ ok, label, size = "result", className }: Props) {
  const text = label ?? (ok ? "Correct" : "Not correct");
  const Icon = ok ? Check : X;
  const live = size === "live";

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "grade-pop flex items-center justify-center gap-2 text-center font-display font-bold leading-none tracking-tight",
        live ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl",
        ok ? "text-good" : "text-danger",
        className,
      )}
    >
      <Icon
        aria-hidden
        className={live ? "size-8 stroke-[3] sm:size-9" : "size-10 stroke-[3] sm:size-12"}
      />
      {text}
    </p>
  );
}
