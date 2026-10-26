import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { GameTest } from "@/components/paradigm-lab";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/game/qal-perfect")({
  component: QalPerfectPage,
});

function QalPerfectPage() {
  const [kind, setKind] = useState<"strong" | "weak">("strong");
  return (
    <>
      <div className="mb-4">
        <GameMenu />
      </div>
      <div className="mb-4 inline-flex overflow-hidden rounded-[var(--radius-md)] bg-card shadow-[var(--shadow-border)]" role="tablist" aria-label="Qal perfect test">
        {(
          [
            ["strong", "Strong roots"],
            ["weak", "Weak roots"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={kind === id}
            onClick={() => setKind(id)}
            className={cn(
              "min-h-11 px-3 text-sm font-semibold",
              kind === id ? "bg-primary text-primary-foreground" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <GameTest kind={kind} />
    </>
  );
}
