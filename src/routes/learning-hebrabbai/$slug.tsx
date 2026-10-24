import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { BlogArticle } from "@/components/blog-article";
import { postHead, postPath } from "@/lib/teaching-text";
import { loadTeachingPage } from "@/lib/teachings";

export const Route = createFileRoute("/learning-hebrabbai/$slug")({
  loader: async ({ params }) => {
    const page = await loadTeachingPage({ data: params.slug });
    if (!page.post) throw notFound();
    if (page.post.section !== "learning-hebrabbai") {
      throw redirect({ href: postPath(page.post.section, page.post.slug), statusCode: 301 });
    }
    return page;
  },
  head: ({ loaderData }) => {
    if (!loaderData?.post) return {};
    const post = loaderData.post;
    return postHead(post);
  },
  component: GuidePost,
});

function GuidePost() {
  const { post, related } = Route.useLoaderData();
  if (!post) return null;
  return <BlogArticle post={post} related={related} />;
}
