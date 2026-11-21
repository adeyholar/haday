import { createFileRoute } from "@tanstack/react-router";
import { VerbLabRoom } from "@/components/verb-lab/verb-lab-room";
import { readVerbLabSearch } from "@/lib/verb-lab/redirects";

export const Route = createFileRoute("/iibs/verb-lab")({
  validateSearch: (search: Record<string, unknown>) => readVerbLabSearch(search),
  component: ScriptureVerbLab,
});

function ScriptureVerbLab() {
  const search = Route.useSearch();
  return <VerbLabRoom path="scripture" search={search} />;
}
