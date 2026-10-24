import { createFileRoute } from "@tanstack/react-router";
import { BlogIndex } from "@/components/blog-index";
import { CLASS_SITE } from "@/lib/class-site";
import { shareMeta } from "@/lib/seo";
import { TEACHING_SECTIONS } from "@/lib/teaching-text";
import { loadTeachingsIndex } from "@/lib/teachings";

const meta = TEACHING_SECTIONS.teachings;
const TITLE = `${meta.label} | HaDay HebRabbAi Mentor`;

export const Route = createFileRoute("/blogs/")({
  loader: async () => {
    try {
      const posts = await loadTeachingsIndex({ data: "teachings" });
      return { posts };
    } catch {
      return { posts: [] };
    }
  },
  head: () => ({
    meta: shareMeta(TITLE, meta.intro, meta.path),
    links: [
      { rel: "canonical", href: `${CLASS_SITE}${meta.path}` },
      { rel: "alternate", type: "application/rss+xml", title: meta.feed, href: `${meta.path}/rss.xml` },
    ],
  }),
  component: TeachingsIndex,
});

function TeachingsIndex() {
  const { posts } = Route.useLoaderData();
  return <BlogIndex section="teachings" posts={posts} />;
}
