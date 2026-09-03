import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { continueLabel, continueTarget } from "@/lib/game";
import { useStudy } from "@/lib/store";

export function GameContinue({ className }: { className?: string }) {
  const game = useStudy((s) => s.game);
  const t = continueTarget(game);
  return (
    <Link
      to="/game/$chapter/$stage"
      params={{ chapter: String(t.chapter), stage: t.stage }}
      className={className}
    >
      <Button className="w-full justify-between" size="lg">
        <span className="truncate">{continueLabel(game)}</span>
        <ChevronRight className="size-5 shrink-0" />
      </Button>
    </Link>
  );
}
