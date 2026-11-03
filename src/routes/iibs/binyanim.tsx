import { createFileRoute, Link } from "@tanstack/react-router";
import { BinyanDrill } from "@/components/binyan-drill";
import { ScriptureTabs } from "@/components/iibs-door";

export const Route = createFileRoute("/iibs/binyanim")({
  component: ScriptureBinyanim,
});

function ScriptureBinyanim() {
  return (
    <>
      <ScriptureTabs active="levels" />
      <p className="mb-4 text-sm">
        <Link to="/iibs" className="font-semibold text-primary">
          Levels
        </Link>
      </p>
      <BinyanDrill />
    </>
  );
}
