import { cn } from "@/lib/cn";
import { HOME_FINGER_LATIN, type FingerId } from "@/lib/hebrew-typing/layout";

export type KeyBox = { x: number; y: number; w: number; h: number };

const ORDER: Exclude<FingerId, "th">[] = ["lp", "lr", "lm", "li", "ri", "rm", "rr", "rp"];

export function TypeHands({
  boxes,
  reach,
  down,
  reduced,
}: {
  boxes: Record<string, KeyBox>;
  reach: string | null;
  down: boolean;
  reduced: boolean;
}) {
  const homeA = boxes.a;
  const homeJ = boxes.j;
  if (!homeA || !homeJ) return null;

  const ease = reduced ? "none" : "left 180ms ease-out, top 180ms ease-out, transform 140ms ease-out";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-visible" aria-hidden>
      <div
        className="absolute h-8 w-24 rounded-[40%] bg-ink/10"
        style={{ left: homeA.x - 52, top: homeA.y + 28 }}
      />
      <div
        className="absolute h-8 w-24 rounded-[40%] bg-ink/10"
        style={{ left: homeJ.x - 28, top: homeJ.y + 28 }}
      />
      {ORDER.map((id) => {
        const home = boxes[HOME_FINGER_LATIN[id]];
        if (!home) return null;
        const going = reach && boxes[reach] && (
          (id === "lp" && ["q", "a", "z"].includes(reach)) ||
          (id === "lr" && ["w", "s", "x"].includes(reach)) ||
          (id === "lm" && ["e", "d", "c"].includes(reach)) ||
          (id === "li" && ["r", "t", "f", "g", "v", "b"].includes(reach)) ||
          (id === "ri" && ["y", "u", "h", "j", "n", "m"].includes(reach)) ||
          (id === "rm" && ["i", "k", ","].includes(reach)) ||
          (id === "rr" && ["o", "l", "."].includes(reach)) ||
          (id === "rp" && ["p", ";", "/"].includes(reach))
        );
        const dest = going ? boxes[reach!]! : home;
        const pressing = Boolean(going && down);
        return (
          <div
            key={id}
            className={cn(
              "absolute rounded-full border border-ink/25 bg-primary/40",
              going && "z-20 bg-primary/70 border-ink/50",
            )}
            style={{
              width: Math.max(14, home.w * 0.48),
              height: Math.max(22, home.h * 0.55),
              left: dest.x,
              top: dest.y + dest.h * 0.28,
              transform: `translate(-50%, -50%) ${pressing && !reduced ? "translateY(5px) scale(0.96)" : ""}`,
              transition: ease,
            }}
          />
        );
      })}
    </div>
  );
}
