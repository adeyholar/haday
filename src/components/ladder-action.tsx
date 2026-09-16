import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { isBookId } from "@/lib/tanakh-canon";
import { labSearch, type LadderAction } from "@/lib/ladder";
import { fromSearch } from "@/lib/passage";

export function LadderActionLink({
  action,
  lessonId,
  onLab,
}: {
  action: LadderAction;
  lessonId: string;
  onLab?: () => void;
}) {
  const lab = action.lab;
  const book = lab && isBookId(lab.book) ? lab.book : "Gen";
  const ch = String(lab?.ch ?? 1);
  const search = lab ? labSearch(lab, lessonId) : fromSearch(lessonId);

  if (action.kind === "lab" || action.kind === "echo") {
    return (
      <Link
        to="/listen/read/$book/$ch"
        params={{ book, ch }}
        search={search}
        onClick={onLab}
        className="block"
      >
        <Button className="w-full" size="lg">
          {action.label}
        </Button>
      </Link>
    );
  }

  if (action.kind === "drill") {
    return (
      <Link to="/drill" search={fromSearch(lessonId)} className="block">
        <Button className="w-full" variant="outline" size="lg">
          {action.label}
        </Button>
      </Link>
    );
  }

  if (action.kind === "write") {
    return (
      <Link to="/write" search={{ mode: "write", ...fromSearch(lessonId) }} className="block">
        <Button className="w-full" variant="outline" size="lg">
          {action.label}
        </Button>
      </Link>
    );
  }

  if (action.kind === "alphabet") {
    return (
      <Link to="/alphabet" search={{ tab: "write", letter: "", ...fromSearch(lessonId) }} className="block">
        <Button className="w-full" variant="outline" size="lg">
          {action.label}
        </Button>
      </Link>
    );
  }

  if (action.kind === "ask") {
    return (
      <Link to="/ask" search={fromSearch(lessonId)} className="block">
        <Button className="w-full" variant="outline" size="lg">
          {action.label}
        </Button>
      </Link>
    );
  }

  return (
    <Link to="/listen" search={fromSearch(lessonId)} className="block">
      <Button className="w-full" variant="outline" size="lg">
        {action.label}
      </Button>
    </Link>
  );
}
