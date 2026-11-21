import { createFileRoute } from "@tanstack/react-router";
import { VerbLabRoom } from "@/components/verb-lab/verb-lab-room";
import { readVerbLabSearch } from "@/lib/verb-lab/redirects";

export const Route = createFileRoute("/verb-lab")({
  validateSearch: (search: Record<string, unknown>) => readVerbLabSearch(search),
  component: GrammarVerbLab,
});

function GrammarVerbLab() {
  const search = Route.useSearch();
  return <VerbLabRoom path="grammar" search={search} />;
}
