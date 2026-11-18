import { createFileRoute } from "@tanstack/react-router";
import { ParadigmsLearnLink } from "@/components/paradigms/lesson-gate";
import { PathHub } from "@/components/path-hub";

export const Route = createFileRoute("/hub/learn")({
  component: LearnHub,
});

function LearnHub() {
  return (
    <>
      <PathHub kind="learn" />
      <ParadigmsLearnLink />
    </>
  );
}
