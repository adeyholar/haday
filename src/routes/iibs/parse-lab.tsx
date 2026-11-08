import { createFileRoute } from "@tanstack/react-router";
import { ParseLabSession } from "@/components/parse-lab-session";
import { parseParseLabSearch } from "@/lib/parse-lab";

export const Route = createFileRoute("/iibs/parse-lab")({
  validateSearch: (search: Record<string, unknown>) => parseParseLabSearch(search),
  component: ScriptureParseLabPage,
});

function ScriptureParseLabPage() {
  const search = Route.useSearch();
  return <ParseLabSession door="scripture" search={search} />;
}
