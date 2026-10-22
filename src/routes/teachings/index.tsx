import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/teachings/")({
  beforeLoad: () => {
    throw redirect({ href: "/blogs", statusCode: 301 });
  },
});
