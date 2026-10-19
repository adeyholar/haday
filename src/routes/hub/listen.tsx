import { createFileRoute } from "@tanstack/react-router";
import { PathHub } from "@/components/path-hub";

export const Route = createFileRoute("/hub/listen")({
  component: () => <PathHub kind="listen" />,
});
