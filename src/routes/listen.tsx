import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/listen")({ component: ListenLayout });

function ListenLayout() {
  return <Outlet />;
}
