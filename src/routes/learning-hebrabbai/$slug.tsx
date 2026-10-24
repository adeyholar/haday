import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { BlogArticle } from "@/components/blog-article";
import { CLASS_SITE } from "@/lib/class-site";
import { shareMeta } from "@/lib/seo";
import { postPath } from "@/lib/teaching-text";
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
    const path = postPath(post.section, post.slug);
    return {
      meta: [
        ...shareMeta(post.title, post.summary, path, { type: "article", image: post.image || undefined }),
        { property: "article:published_time", content: post.published },
        { property: "article:modified_time", content: post.updated },
      ],
      links: [{ rel: "canonical", href: `${CLASS_SITE}${path}` }],
    };
  },
  component: GuidePost,
});

function GuidePost() {
  const { post, related } = Route.useLoaderData();
  if (!post) return null;
  return <BlogArticle post={post} related={related} />;
}
