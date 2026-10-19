import { createFileRoute } from "@tanstack/react-router";
import { llmsTxt } from "@/lib/site-pages";
import { sitemapPages } from "@/lib/teachings";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(llmsTxt(await sitemapPages()), {
          headers: { "content-type": "text/plain; charset=utf-8" },
        }),
    },
  },
});
