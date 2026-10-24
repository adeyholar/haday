import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

type Size = "compact" | "hero";

export function BrandLockup({
  size = "compact",
  linked = false,
  to = "/",
}: {
  size?: Size;
  linked?: boolean;
  to?: "/" | "/bbh" | "/iibs";
}) {
  const compact = size !== "hero";
  const inner = (
    <>
      <span className={cn("he-word shrink-0 font-bold text-primary", compact ? "text-2xl max-[379px]:text-xl" : "text-5xl")}>
        {compact ? (
          <>
            <span className="max-[379px]:hidden">הַדַּי</span>
            <span className="hidden max-[379px]:inline">ה</span>
          </>
        ) : (
          "הַדַּי"
        )}
      </span>
      <span className={cn("flex min-w-0 flex-col", size === "hero" ? "items-center" : "leading-tight")}>
        <span className={cn("whitespace-nowrap font-display font-bold tracking-tight text-ink", compact ? "text-xl max-[379px]:text-lg" : "text-5xl")}>
          HaDay
        </span>
        <span className={cn("font-semibold text-primary", compact ? "text-xs tracking-[0.04em] max-[379px]:hidden" : "mt-1 text-sm tracking-[0.08em]")}>
          HebRabbAi Mentor
        </span>
      </span>
    </>
  );

  const className = cn("flex min-w-0", size === "hero" ? "flex-col items-center gap-2" : "items-center gap-2.5");

  if (linked) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
