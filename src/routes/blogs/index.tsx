import { createFileRoute } from "@tanstack/react-router";
import { BlogIndex } from "@/components/blog-index";
import { CLASS_SITE } from "@/lib/class-site";
import { shareMeta } from "@/lib/seo";
import { BLOG_HOME, blogFilter, postsForBlog } from "@/lib/teaching-text";
import { loadTeachingsIndex } from "@/lib/teachings";

export const Route = createFileRoute("/blogs/")({
  validateSearch: (search: Record<string, unknown>): { section?: "teachings" } => {
    if (search.section === "teachings") return { section: "teachings" };
    return {};
  },
  loaderDeps: ({ search }) => ({ section: search.section }),
  loader: async ({ deps }) => {
    const filter = blogFilter(deps.section);
    try {
      const posts = await loadTeachingsIndex({ data: filter === "all" ? "all" : filter });
      return { posts: postsForBlog(posts, filter), filter };
    } catch {
      return { posts: [], filter };
    }
  },
  head: () => ({
    meta: shareMeta(BLOG_HOME.title, BLOG_HOME.intro, BLOG_HOME.path),
    links: [
      { rel: "canonical", href: `${CLASS_SITE}${BLOG_HOME.path}` },
      { rel: "alternate", type: "application/rss+xml", title: "HaDay Teachings", href: "/blogs/rss.xml" },
    ],
  }),
  component: BlogHome,
});

function BlogHome() {
  const { posts, filter } = Route.useLoaderData();
  return <BlogIndex filter={filter} posts={posts} />;
}
