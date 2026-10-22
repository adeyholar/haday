import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/teachings")({
  beforeLoad: () => {
    throw redirect({ href: "/admin/blogs", statusCode: 301 });
  },
});
