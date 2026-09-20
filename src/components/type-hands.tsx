import { cn } from "@/lib/cn";
import type { FingerId } from "@/lib/hebrew-typing/layout";

/** Geometric hands over the Tiro board. One finger dips with the physical key. */
const LEFT: { id: FingerId; d: string }[] = [
  { id: "lp", d: "M38 118c-6-38-4-72 8-98c6-4 12 2 11 12c-2 28-2 58 6 84z" },
  { id: "lr", d: "M62 108c-4-42 2-78 12-102c6-4 12 4 10 14c-6 30-4 58 2 82z" },
  { id: "lm", d: "M88 100c-2-46 8-84 16-108c7-4 12 6 10 16c-8 32-6 60 0 82z" },
  { id: "li", d: "M118 96c4-44 22-78 28-96c6-3 12 8 9 16c-12 28-14 56-8 80z" },
];

const RIGHT: { id: FingerId; d: string }[] = [
  { id: "ri", d: "M262 96c-4-44-22-78-28-96c-6-3-12 8-9 16c12 28 14 56 8 80z" },
  { id: "rm", d: "M292 100c2-46-8-84-16-108c-7-4-12 6-10 16c8 32 6 60 0 82z" },
  { id: "rr", d: "M318 108c4-42-2-78-12-102c-6-4-12 4-10 14c6 30 4 58-2 82z" },
  { id: "rp", d: "M342 118c6-38 4-72-8-98c-6-4-12 2-11 12c2 28 2 58-6 84z" },
];

export function TypeHands({
  active,
  reduced,
}: {
  active: FingerId | null;
  reduced: boolean;
}) {
  return (
    <svg
      viewBox="0 0 380 160"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] w-full"
      aria-hidden
    >
      <ellipse cx="108" cy="148" rx="72" ry="22" className="fill-ink/10" />
      <ellipse cx="272" cy="148" rx="72" ry="22" className="fill-ink/10" />
      {[...LEFT, ...RIGHT].map((f) => {
        const on = active === f.id;
        return (
          <path
            key={f.id}
            d={f.d}
            className={cn(
              "stroke-ink/40 fill-primary/25",
              on && "fill-primary/55 stroke-ink/70",
            )}
            style={{
              transformOrigin: "center bottom",
              transform: !reduced && on ? "translateY(7px)" : undefined,
              transition: reduced ? undefined : "transform 140ms ease-out, fill 140ms ease-out",
            }}
          />
        );
      })}
    </svg>
  );
}
