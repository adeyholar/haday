import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { PathHub } from "@/components/path-hub";

export const Route = createFileRoute("/hub/play")({
  component: PlayHub,
});

function PlayHub() {
  return (
    <Panel className="hub-frame">
      <PathHub kind="play" />
    </Panel>
  );
}
