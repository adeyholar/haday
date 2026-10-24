import { createFileRoute, redirect } from "@tanstack/react-router";
import { retiredTeachingTarget } from "@/lib/teaching-text";

export const Route = createFileRoute("/teachings/rss.xml")({
  server: {
    handlers: {
      GET: async () => redirect({ href: retiredTeachingTarget("/teachings/rss.xml"), statusCode: 301 }),
    },
  },
});