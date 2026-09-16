import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { continueLabel, continueTarget } from "@/lib/ladder";
import { useStudy } from "@/lib/store";

export function StudyContinue({ className }: { className?: string }) {
  const ladder = useStudy((s) => s.game.ladder);
  const t = continueTarget(ladder);
  return (
    <Link to="/study/lesson/$id" params={{ id: t.lessonId }} className={className}>
      <Button className="w-full justify-between" size="lg">
        <span className="truncate">{continueLabel(ladder)}</span>
        <ChevronRight className="size-5 shrink-0" />
      </Button>
    </Link>
  );
}
