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
      <Panel className="mb-4">
        <p className="text-sm">
          <Link to="/iibs" className="font-semibold text-primary">
            Levels
          </Link>
        </p>
      </Panel>
      <BinyanDrill />
    </>
  );
}
