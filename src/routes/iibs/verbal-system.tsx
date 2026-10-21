import { createFileRoute, Link } from "@tanstack/react-router";
import { ScriptureTabs } from "@/components/iibs-door";
import { VerbalSystemBuilder } from "@/components/verbal-system-builder";

export const Route = createFileRoute("/iibs/verbal-system")({
  component: ScriptureVerbalSystem,
});

function ScriptureVerbalSystem() {
  return (
    <>
      <ScriptureTabs active="levels" />
      <p className="mb-4 text-sm">
        <Link to="/iibs" className="font-semibold text-primary">
          Levels
        </Link>
      </p>
      <VerbalSystemBuilder scripture />
    </>
  );
}
