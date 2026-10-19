import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { RoomLink } from "@/components/room-link";

export function GameMenu() {
  return <RoomLink />;
}

export function WordPlayChoice({ which }: { which: "path" | "mix" }) {
  return (
    <div className="mt-4 flex gap-2">
      <Link
        to="/game"
        className={cn(
          "min-h-11 flex-1 rounded-[var(--radius-md)] px-3 py-2 text-center text-sm font-semibold",
          which === "path" ? "bg-ink text-parchment" : "bg-card text-ink shadow-[var(--shadow-border)]",
        )}
      >
        Vocabulary
      </Link>
      <Link
        to="/game/custom"
        search={{ kind: "vocab" }}
        className={cn(
          "min-h-11 flex-1 rounded-[var(--radius-md)] px-3 py-2 text-center text-sm font-semibold",
          which === "mix" ? "bg-ink text-parchment" : "bg-card text-ink shadow-[var(--shadow-border)]",
        )}
      >
        Custom mix
      </Link>
    </div>
  );
}
