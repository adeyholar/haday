import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/teachings/rss.xml")({
  server: {
    handlers: {
      GET: async () => redirect({ href: "/blogs/rss.xml", statusCode: 301 }),
    },
  },
});
