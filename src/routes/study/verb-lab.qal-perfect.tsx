import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { QalPerfectBuilder } from "@/components/qal-perfect-builder";
import { StudyLab } from "@/components/paradigm-lab";
import { StudyMenu } from "@/components/study-menu";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/study/verb-lab/qal-perfect")({
  component: VerbLabPage,
});

function VerbLabPage() {
  const [kind, setKind] = useState<"strong" | "weak">("weak");
  return (
    <>
      <div className="mb-4">
        <StudyMenu />
      </div>
      <div className="mb-4 inline-flex overflow-hidden rounded-[var(--radius-md)] bg-card shadow-[var(--shadow-border)]" role="tablist" aria-label="Qal perfect practice">
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
      {kind === "strong" ? <QalPerfectBuilder /> : <StudyLab />}
    </>
  );
}
