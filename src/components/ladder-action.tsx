import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { isBookId } from "@/lib/tanakh-canon";
import { labSearch, type LadderAction } from "@/lib/ladder";

export function LadderActionLink({
  action,
  onLab,
}: {
  action: LadderAction;
  onLab?: () => void;
}) {
  const lab = action.lab;
  const book = lab && isBookId(lab.book) ? lab.book : "Gen";
  const ch = String(lab?.ch ?? 1);
  const search = lab ? labSearch(lab) : {};

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
      <Link to="/drill" className="block">
        <Button className="w-full" variant="outline" size="lg">
          {action.label}
        </Button>
      </Link>
    );
  }

  if (action.kind === "write") {
    return (
      <Link to="/write" search={{ mode: "write" }} className="block">
        <Button className="w-full" variant="outline" size="lg">
          {action.label}
        </Button>
      </Link>
    );
  }

  if (action.kind === "alphabet") {
    return (
      <Link to="/alphabet" search={{ tab: "write", letter: "" }} className="block">
        <Button className="w-full" variant="outline" size="lg">
          {action.label}
        </Button>
      </Link>
    );
  }

  if (action.kind === "ask") {
    return (
      <Link to="/ask" className="block">
        <Button className="w-full" variant="outline" size="lg">
          {action.label}
        </Button>
      </Link>
    );
  }

  return (
    <Link to="/listen" className="block">
      <Button className="w-full" variant="outline" size="lg">
        {action.label}
      </Button>
    </Link>
  );
}
