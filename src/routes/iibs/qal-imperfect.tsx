import { createFileRoute, Link } from "@tanstack/react-router";
import { ScriptureTabs } from "@/components/iibs-door";
import { QalImperfectBuilder } from "@/components/qal-imperfect-builder";

export const Route = createFileRoute("/iibs/qal-imperfect")({
  component: ScriptureQalImperfect,
});

function ScriptureQalImperfect() {
  return (
    <>
      <ScriptureTabs active="levels" />
      <p className="mb-4 text-sm">
        <Link to="/iibs/verb-paradigm-quest" className="font-semibold text-primary">
          Build from the root
        </Link>
      </p>
      <QalImperfectBuilder />
    </>
  );
}
