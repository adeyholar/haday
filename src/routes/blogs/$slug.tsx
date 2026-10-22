import { createFileRoute, Link, notFound, useRouteContext } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { PublicFooter } from "@/components/public-footer";
import { AUTHOR } from "@/lib/author";
import { CLASS_SITE } from "@/lib/class-site";
import { shareMeta } from "@/lib/seo";
import { teachingCta, renderTeaching } from "@/lib/teaching-text";
import { loadTeachingPage } from "@/lib/teachings";

export const Route = createFileRoute("/blogs/$slug")({
  loader: async ({ params }) => {
    const page = await loadTeachingPage({ data: params.slug });
    if (!page.post) throw notFound();
    return { post: page.post, related: page.related };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const post = loaderData.post;
    const path = `/blogs/${post.slug}`;
    const image = post.image || undefined;
    return {
      meta: [
        ...shareMeta(post.title, post.summary, path, { type: "article", image }),
        { property: "article:published_time", content: post.published },
        { property: "article:modified_time", content: post.updated },
      ],
      links: [{ rel: "canonical", href: `${CLASS_SITE}${path}` }],
    };
  },
  component: TeachingPage,
});

function TeachingPage() {
  const { post, related } = Route.useLoaderData();
  const { sessionUser } = useRouteContext({ from: "__root__" });
  const href = teachingCta(post.path, sessionUser != null);
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.summary,
        datePublished: post.published,
        dateModified: post.updated,
        image: post.image || `${CLASS_SITE}/og.jpg`,
        inLanguage: "en",
        author: { "@id": AUTHOR.id, name: AUTHOR.name },
        publisher: { "@id": `${CLASS_SITE}/about#ffim`, name: "Fathers' Faith International Ministries", logo: { "@type": "ImageObject", url: `${CLASS_SITE}/og.jpg` } },
        mainEntityOfPage: `${CLASS_SITE}/blogs/${post.slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${CLASS_SITE}/` },
          { "@type": "ListItem", position: 2, name: "Blogs", item: `${CLASS_SITE}/blogs` },
          { "@type": "ListItem", position: 3, name: post.title, item: `${CLASS_SITE}/blogs/${post.slug}` },
        ],
      },
    ],
  };
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
      <p className="text-sm text-muted">
        <Link to="/" className="font-semibold text-primary underline-offset-4 hover:underline">
          Home
        </Link>
        {" / "}
        <Link to="/blogs" className="font-semibold text-primary underline-offset-4 hover:underline">
          Blogs
        </Link>
      </p>
      <Panel className="mt-4">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink">{post.title}</h1>
        <p className="mt-3 text-sm text-muted">
          <Link to="/about" className="font-semibold text-primary underline-offset-4 hover:underline">
            {AUTHOR.name}
          </Link>
          . Published {post.published}
          {post.updated !== post.published ? `. Updated ${post.updated}` : ""}.
        </p>
        <div
          className="blog-body mt-4 max-w-prose space-y-3 leading-relaxed text-ink"
          dangerouslySetInnerHTML={{ __html: renderTeaching(post.body) }}
        />
      </Panel>
      <Panel className="mt-4">
        <a href={href} className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
          Practice these words in HaDay
        </a>
        <p className="mt-3 text-sm">
          <Link to="/how-to-memorize-biblical-hebrew-vocabulary" className="font-semibold text-primary underline-offset-4 hover:underline">
            Read the method.
          </Link>
        </p>
      </Panel>
      <Panel className="mt-4">
        <img src="/about/adeola.jpg" alt={AUTHOR.name} width={800} height={800} className="h-16 w-16 rounded-full object-cover" />
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{AUTHOR.shortBio}</p>
      </Panel>
      {related.length > 0 ? (
        <Panel className="mt-4">
          <h2 className="font-display text-2xl font-semibold text-ink">Related</h2>
          <ul className="mt-2 space-y-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link to="/blogs/$slug" params={{ slug: item.slug }} className="font-semibold text-primary underline-offset-4 hover:underline">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <PublicFooter />
    </main>
  );
}
