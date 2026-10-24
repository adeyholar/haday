import { createFileRoute } from "@tanstack/react-router";
import { BlogIndex } from "@/components/blog-index";
import { CLASS_SITE } from "@/lib/class-site";
import { shareMeta } from "@/lib/seo";
import { BLOG_HOME, blogFilter, blogPageTitle, postsForBlog, TEACHING_SECTIONS } from "@/lib/teaching-text";
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
  head: ({ match }) => {
    const filter = blogFilter(match.search.section);
    const title = blogPageTitle(filter);
    const intro = filter === "all" ? BLOG_HOME.intro : TEACHING_SECTIONS.teachings.intro;
    const meta = shareMeta(title, intro, BLOG_HOME.path);
    if (filter === "teachings") meta.push({ name: "robots", content: "noindex,follow" });
    return {
      meta,
      links: [
        { rel: "canonical", href: `${CLASS_SITE}${BLOG_HOME.path}` },
        { rel: "alternate", type: "application/rss+xml", title: "HaDay Teachings", href: "/blogs/rss.xml" },
        { rel: "alternate", type: "application/rss+xml", title: "HaDay Learning HebRabbAi", href: "/learning-hebrabbai/rss.xml" },
      ],
    };
  },
  component: BlogHome,
});

function BlogHome() {
  const { posts, filter } = Route.useLoaderData();
  return <BlogIndex filter={filter} posts={posts} />;
}
