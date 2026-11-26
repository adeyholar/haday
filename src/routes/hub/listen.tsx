import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { PathHub } from "@/components/path-hub";

export const Route = createFileRoute("/hub/listen")({
  component: ListenHub,
});

function ListenHub() {
  return (
    <Panel className="hub-frame">
      <PathHub kind="listen" />
    </Panel>
  );
}
