import { createFileRoute } from "@tanstack/react-router";
import { CLASS_SITE } from "@/lib/class-site";
import { teachingsRss } from "@/lib/teaching-text";
import { loadTeachingsIndex } from "@/lib/teachings";

export const Route = createFileRoute("/blogs/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const posts = await loadTeachingsIndex({ data: "teachings" }).catch(() => []);
        return new Response(teachingsRss(posts, CLASS_SITE, "teachings"), {
          headers: { "content-type": "application/rss+xml; charset=utf-8" },
        });
      },
    },
  },
});
