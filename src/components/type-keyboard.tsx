import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { TypeHands, type KeyBox } from "@/components/type-hands";
import {
  FINGER_LABEL,
  TIRO_ROWS,
  TIRO_SHIFT,
  fingerFor,
  latinForGlyph,
  type FingerId,
} from "@/lib/hebrew-typing/layout";

const FINGER_TONE: Record<FingerId, string> = {
  lp: "bg-danger/25",
  lr: "bg-primary/20",
  lm: "bg-good/20",
  li: "bg-primary/35",
  th: "bg-surface",
  ri: "bg-primary/35",
  rm: "bg-good/20",
  rr: "bg-primary/20",
  rp: "bg-danger/25",
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function TypeKeyboard({
  glow,
  pressed,
  miss,
  nikkud,
  shift,
  onKey,
  onShift,
}: {
  glow: string | null;
  pressed?: string | null;
  miss?: string | null;
  nikkud: boolean;
  shift?: boolean;
  onKey: (ch: string) => void;
  onShift?: (down: boolean) => void;
}) {
  const reduced = useReducedMotion();
  const layer = Boolean(shift);
  const boardRef = useRef<HTMLDivElement>(null);
  const keyRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [boxes, setBoxes] = useState<Record<string, KeyBox>>({});

  function measure() {
    const board = boardRef.current;
    if (!board) return;
    const origin = board.getBoundingClientRect();
    const next: Record<string, KeyBox> = {};
    for (const [id, el] of Object.entries(keyRefs.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      next[id] = {
        x: r.left - origin.left + r.width / 2,
        y: r.top - origin.top + r.height / 2,
        w: r.width,
        h: r.height,
      };
    }
    setBoxes((prev) => {
      const ids = Object.keys(next);
      if (
        ids.length === Object.keys(prev).length &&
        ids.every((id) => {
          const a = prev[id];
          const b = next[id];
          return a && b && Math.abs(a.x - b.x) < 0.6 && Math.abs(a.y - b.y) < 0.6;
        })
      ) {
        return prev;
      }
      return next;
    });
  }

  useLayoutEffect(() => {
    measure();
  });
  useEffect(() => {
    const node = boardRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const glowLatin = glow ? latinForGlyph(glow) : null;
  const pressLatin = pressed ? latinForGlyph(pressed) : null;
  const reach = pressLatin ?? glowLatin;
  const glowFinger = glow ? fingerFor(glow) ?? (glowLatin ? fingerFor(glowLatin) : null) : null;

  return (
    <div className="select-none">
      {glowFinger ? (
        <p className="mb-2 text-center text-sm text-muted">
          {layer ? "Shift · nikkud" : "Eyes on the screen."}{" "}
          <span className="font-semibold text-ink">{FINGER_LABEL[glowFinger]}</span>
        </p>
      ) : (
        <p className="mb-2 text-center text-sm text-muted">
          {layer ? "Tiro Shift — vowels on the home row." : "Tiro layout · home row ש ד ג כ · י ח ל ך ף"}
        </p>
      )}
      <div className="overflow-x-auto pb-1">
        <div ref={boardRef} className="relative mx-auto min-w-[34rem] max-w-3xl px-1 pt-2 pb-8">
          <div className="space-y-1.5">
            {TIRO_ROWS.map((row, ri) => (
              <div
                key={ri}
                className={cn("flex justify-center gap-1", ri === 1 && "ps-4", ri === 2 && "ps-10")}
              >
                {row.map((cap) => {
                  const shiftMark = TIRO_SHIFT[cap.latin];
                  const send = layer && shiftMark ? shiftMark.mark : cap.he;
                  const lit = glowLatin === cap.latin || glow === cap.he || glow === send;
                  const down = pressLatin === cap.latin || pressed === cap.he || pressed === send;
                  const wrong = miss === send || miss === cap.he;
                  return (
                    <button
                      key={cap.latin}
                      ref={(el) => {
                        keyRefs.current[cap.latin] = el;
                      }}
                      type="button"
                      dir="rtl"
                      lang="he"
                      onClick={() => onKey(send)}
                      className={cn(
                        "he-word relative z-0 flex h-12 min-w-11 flex-col items-center justify-center rounded-[var(--radius-sm)] px-1 text-lg shadow-[var(--shadow-border)] transition-transform duration-150 ease-out sm:min-w-12 sm:text-xl",
                        "active:scale-[0.96]",
                        down && !wrong && "translate-y-0.5",
                        wrong && "bg-danger text-parchment",
                        !wrong && lit && "bg-ink text-parchment",
                        !wrong && !lit && down && "bg-primary/30 ring-2 ring-primary",
                        !wrong && !lit && !down && FINGER_TONE[cap.finger],
                        ri === 1 && "border-b-2 border-ink/30",
                      )}
                    >
                      {layer && shiftMark ? (
                        <>
                          <span className={cn("he-word text-xl", lit || wrong ? "text-parchment" : "text-ink")} lang="he">
                            ב{shiftMark.mark}
                          </span>
                          <span className={cn("font-sans text-[8px] leading-none", lit || wrong ? "text-parchment/80" : "text-muted")}>
                            {shiftMark.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>{cap.he}</span>
                          <span
                            className={cn(
                              "font-sans text-[9px] leading-none",
                              lit || wrong ? "text-parchment/70" : "text-muted",
                            )}
                          >
                            {cap.latin}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="flex justify-center gap-1">
              <button
                type="button"
                onPointerDown={() => onShift?.(true)}
                onPointerUp={() => onShift?.(false)}
                onPointerLeave={() => onShift?.(false)}
                className={cn(
                  "h-11 min-w-20 rounded-[var(--radius-sm)] px-3 text-xs font-semibold shadow-[var(--shadow-border)]",
                  layer ? "bg-ink text-parchment" : "bg-card text-ink",
                )}
              >
                Shift
              </button>
              <button
                type="button"
                className="h-11 min-w-[12rem] rounded-[var(--radius-sm)] bg-card text-xs text-muted shadow-[var(--shadow-border)]"
              >
                space
              </button>
              <button
                type="button"
                onClick={() => onKey("Backspace")}
                className="h-11 min-w-24 rounded-[var(--radius-sm)] bg-card px-3 text-xs font-semibold text-ink shadow-[var(--shadow-border)]"
              >
                Backspace
              </button>
            </div>
          </div>
          <TypeHands boxes={boxes} reach={reach} down={Boolean(pressLatin)} reduced={reduced} />
        </div>
      </div>
      {nikkud && !layer ? (
        <p className="mt-2 text-center text-xs text-muted">Hold Shift (or tap Shift) for nikkud on this board.</p>
      ) : null}
    </div>
  );
}
