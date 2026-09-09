import { useEffect, useRef, useState, type ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { NavTip } from "@/components/nav-tip";

export type NavHref =
  | "/"
  | "/drill"
  | "/write"
  | "/quiz"
  | "/rules"
  | "/match"
  | "/browse"
  | "/alphabet"
  | "/listen"
  | "/listen/pet"
  | "/listen/read"
  | "/listen/read/$book"
  | "/listen/read/$book/$ch"
  | "/keep"
  | "/guide"
  | "/challenge"
  | "/rewards"
  | "/leaderboard"
  | "/admin"
  | "/admin/voice"
  | "/legal"
  | "/game"
  | "/game/custom"
  | "/game/alefbet"
  | "/game/balloons"
  | "/game/syllables"
  | "/game/nouns"
  | "/game/article"
  | "/game/lessons"
  | "/game/lessons/$track"
  | "/ask"
  | "/ideas";

export type NavItem = {
  to: NavHref;
  params?: { book?: string; ch?: string; track?: string };
  hash?: string;
  label: string;
  hint?: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

function canHover() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function NavMenu({
  label,
  icon: Icon,
  items,
  active,
  drop = "down",
  tipSide = "bottom",
  layout = "header",
}: {
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  items: NavItem[];
  active?: boolean;
  drop?: "down" | "up";
  tipSide?: "bottom" | "top";
  layout?: "header" | "bar";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const trigger = (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label={label}
      title={label}
      onClick={() => setOpen((v) => !v)}
      className={cn(
        "flex items-center justify-center rounded-[var(--radius-md)]",
        layout === "header" && "size-11 gap-0",
        layout === "bar" && "min-h-14 w-full flex-col gap-0.5 text-xs font-medium",
        active || open ? "text-primary" : "text-muted",
      )}
    >
      <Icon className="size-5" strokeWidth={active || open ? 2.2 : 1.8} />
      {layout === "bar" ? (
        <span className="inline-flex items-center gap-0.5">
          {label}
          {drop === "up" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </span>
      ) : null}
    </button>
  );

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        if (canHover()) setOpen(true);
      }}
    >
      {layout === "header" && !open ? <NavTip label={label} side={tipSide}>{trigger}</NavTip> : trigger}
      {open && (
        <div
          className={cn(
            "absolute z-50",
            drop === "down" ? "end-0 top-full pt-2" : "bottom-full start-1/2 -translate-x-1/2 pb-2",
          )}
        >
          <ul role="menu" className="min-w-48 rounded-[var(--radius-md)] bg-card py-1 shadow-[var(--shadow-border)]">
            {items.map((item) => {
              const ItemIcon = item.icon;
              const key = `${item.to}:${item.params?.book ?? ""}:${item.params?.ch ?? ""}:${item.hash ?? ""}:${item.label}`;
              return (
                <li key={key} role="none">
                  <Link
                    role="menuitem"
                    to={item.to}
                    params={item.params}
                    hash={item.hash}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center gap-2 px-3 text-sm font-medium text-ink hover:bg-surface"
                  >
                    <ItemIcon className="size-4 shrink-0 text-primary" strokeWidth={1.8} />
                    <span>
                      {item.label}
                      {item.hint ? <span className="mt-0.5 block text-xs font-normal text-muted">{item.hint}</span> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

