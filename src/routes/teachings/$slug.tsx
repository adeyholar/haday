import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/teachings/$slug")({
  beforeLoad: ({ params }) => {
    const slug = params.slug;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw redirect({ href: "/blogs", statusCode: 301 });
    }
    throw redirect({ href: `/blogs/${slug}`, statusCode: 301 });
  },
});
