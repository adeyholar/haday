import { useEffect, useState, type ComponentType } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useParadigmAccess } from "@/components/paradigms/use-paradigm-progress";
import { loadParadigmsHome } from "@/components/paradigms/load-session";
import { Panel } from "@/components/panel";

export const Route = createFileRoute("/paradigms")({
  validateSearch: (search: Record<string, unknown>) => ({
    retake: search.retake === "1" || search.retake === 1 || search.retake === true || search.retake === "true",
  }),
  component: ParadigmsPage,
});

function ParadigmsPage() {
  const { retake } = Route.useSearch();
  const { enabled, ready } = useParadigmAccess();
  const [Home, setHome] = useState<ComponentType<{ retake: boolean }> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancel = false;
    loadParadigmsHome().then((mod) => {
      if (!cancel) setHome(() => mod.ParadigmsHome);
    });
    return () => {
      cancel = true;
    };
  }, [enabled]);

  if (!ready || !enabled || !Home) {
    if (!ready || enabled) return null;
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">Paradigms</h1>
        <p className="mt-2 text-sm text-muted">This is not open on this account.</p>
      </Panel>
    );
  }
  return <Home retake={retake} />;
}
