import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { ParadigmsLearnLink } from "@/components/paradigms/lesson-gate";
import { PathHub } from "@/components/path-hub";

export const Route = createFileRoute("/hub/learn")({
  component: LearnHub,
});

function LearnHub() {
  return (
    <Panel className="hub-frame">
      <PathHub kind="learn" />
      <ParadigmsLearnLink />
    </Panel>
  );
}
