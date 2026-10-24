import { createFileRoute, redirect } from "@tanstack/react-router";
import { retiredTeachingTarget } from "@/lib/teaching-text";

export const Route = createFileRoute("/teachings/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ href: retiredTeachingTarget(`/teachings/${params.slug}`), statusCode: 301 });
  },
});