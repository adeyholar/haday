import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { PathHub } from "@/components/path-hub";

export const Route = createFileRoute("/hub/practice")({
  component: PracticeHub,
});

function PracticeHub() {
  return (
    <Panel className="hub-frame">
      <PathHub kind="practice" />
    </Panel>
  );
}
