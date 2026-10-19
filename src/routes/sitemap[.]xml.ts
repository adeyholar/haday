import { createFileRoute } from "@tanstack/react-router";
import { sitemapXml } from "@/lib/site-pages";
import { sitemapPages } from "@/lib/teachings";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(sitemapXml(await sitemapPages()), {
          headers: { "content-type": "application/xml; charset=utf-8" },
        }),
    },
  },
});
