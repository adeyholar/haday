import { createFileRoute, redirect } from "@tanstack/react-router";
import { retiredTeachingTarget } from "@/lib/teaching-text";

export const Route = createFileRoute("/teachings/")({
  beforeLoad: () => {
    throw redirect({ href: retiredTeachingTarget("/teachings"), statusCode: 301 });
  },
});