import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

type Size = "compact" | "hero";

export function BrandLockup({
  size = "compact",
  linked = false,
}: {
  size?: Size;
  linked?: boolean;
}) {
  const inner = (
    <>
      <span
        className={cn(
          "he-word text-primary",
          size === "hero" ? "text-5xl font-bold" : "text-2xl font-bold",
        )}
      >
        הַדַּי
      </span>
      <span className={cn("flex min-w-0 flex-col", size === "hero" ? "items-center" : "leading-tight")}>
        <span
          className={cn(
            "font-display font-bold tracking-tight text-ink",
            size === "hero" ? "text-5xl" : "text-xl",
          )}
        >
          HaDay
        </span>
        <span
          className={cn(
            "font-semibold uppercase text-primary",
            size === "hero" ? "mt-1 text-sm tracking-[0.2em]" : "text-xs tracking-[0.14em]",
          )}
        >
          Hebraic Mentor
        </span>
      </span>
    </>
  );

  const className = cn(
    "flex min-w-0",
    size === "hero" ? "flex-col items-center gap-2" : "items-center gap-2.5",
  );

  if (linked) {
    return (
      <Link to="/" className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
