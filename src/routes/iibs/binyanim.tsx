import { createFileRoute, Link } from "@tanstack/react-router";
import { BinyanDrill } from "@/components/binyan-drill";
import { ScriptureTabs } from "@/components/iibs-door";
import { Panel } from "@/components/panel";

export const Route = createFileRoute("/iibs/binyanim")({
  component: ScriptureBinyanim,
});

function ScriptureBinyanim() {
  return (
    <>
      <ScriptureTabs active="levels" />
      <Panel className="mb-4 text-sm">
        <Link to="/iibs" className="inline-flex min-h-11 items-center font-semibold text-primary">
          Levels
        </Link>
      </Panel>
      <BinyanDrill />
    </>
  );
}
