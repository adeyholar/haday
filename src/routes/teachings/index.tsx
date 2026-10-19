import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { PublicFooter } from "@/components/public-footer";
import { CLASS_SITE } from "@/lib/class-site";
import { shareMeta } from "@/lib/seo";
import { loadTeachingsIndex } from "@/lib/teachings";

const TITLE = "Teachings | HaDay HebRabbAi Mentor";
const DESCRIPTION = "Short readings from HaDay HebRabbAi Mentor that send you back to the Hebrew text.";

export const Route = createFileRoute("/teachings/")({
  loader: async () => {
    try {
      const posts = await loadTeachingsIndex();
      return { posts };
    } catch {
      return { posts: [] };
    }
  },
  head: () => ({
    meta: shareMeta(TITLE, DESCRIPTION, "/teachings"),
    links: [
      { rel: "canonical", href: `${CLASS_SITE}/teachings` },
      { rel: "alternate", type: "application/rss+xml", title: "HaDay Teachings", href: "/teachings/rss.xml" },
    ],
  }),
  component: TeachingsIndex,
});

function TeachingsIndex() {
  const { posts } = Route.useLoaderData();
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        name: "HaDay Teachings",
        url: `${CLASS_SITE}/teachings`,
        blogPost: posts.map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          url: `${CLASS_SITE}/teachings/${post.slug}`,
          datePublished: post.published,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${CLASS_SITE}/` },
          { "@type": "ListItem", position: 2, name: "Teachings", item: `${CLASS_SITE}/teachings` },
        ],
      },
    ],
  };
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
      <Panel>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink">Teachings</h1>
        <p className="mt-3 max-w-prose text-muted">{DESCRIPTION}</p>
      </Panel>
      {posts.length === 0 ? (
        <Panel className="mt-4">
          <p className="text-muted">No teachings yet.</p>
        </Panel>
      ) : (
        posts.map((post) => (
          <Panel key={post.slug} className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{post.published}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              <Link to="/teachings/$slug" params={{ slug: post.slug }} className="underline-offset-4 hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 max-w-prose text-muted">{post.summary}</p>
          </Panel>
        ))
      )}
      <PublicFooter />
    </main>
  );
}
