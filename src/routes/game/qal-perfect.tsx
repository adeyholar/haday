import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { ParadigmLab } from "@/components/paradigm-lab";
import { QalPerfectBuilder } from "@/components/qal-perfect-builder";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/game/qal-perfect")({
  component: QalPerfectPage,
});

function QalPerfectPage() {
  const [deck, setDeck] = useState<"strong" | "ch14">("strong");
  return (
    <>
      <div className="mb-4">
        <GameMenu />
      </div>
      <div className="mb-4 inline-flex overflow-hidden rounded-[var(--radius-md)] bg-card shadow-[var(--shadow-border)]" role="tablist" aria-label="Qal perfect deck">
        {(
          [
            ["strong", "Strong roots"],
            ["ch14", "Chapter 14"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={deck === id}
            onClick={() => setDeck(id)}
            className={cn(
              "min-h-11 px-3 text-sm font-semibold",
              deck === id ? "bg-primary text-primary-foreground" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {deck === "strong" ? <QalPerfectBuilder /> : <ParadigmLab />}
    </>
  );
}
