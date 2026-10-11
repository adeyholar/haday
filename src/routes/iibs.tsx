import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/iibs")({ component: IibsLayout });

function IibsLayout() {
  return <Outlet />;
}
