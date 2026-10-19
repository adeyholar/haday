import { createFileRoute } from "@tanstack/react-router";
import { PathHub } from "@/components/path-hub";

export const Route = createFileRoute("/hub/learn")({
  component: () => <PathHub kind="learn" />,
});
