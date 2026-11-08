import { createFileRoute } from "@tanstack/react-router";
import { ParseLabSession } from "@/components/parse-lab-session";
import { parseParseLabSearch } from "@/lib/parse-lab";

export const Route = createFileRoute("/parse-lab")({
  validateSearch: (search: Record<string, unknown>) => parseParseLabSearch(search),
  component: GrammarParseLabPage,
});

function GrammarParseLabPage() {
  const search = Route.useSearch();
  return <ParseLabSession door="grammar" search={search} />;
}
