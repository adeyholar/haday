import { Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { PublicFooter } from "@/components/public-footer";
import { blogIndexJsonLd } from "@/lib/blog-jsonld";
import {
  BLOG_HOME,
  BLOG_TABS,
  blogDate,
  TEACHING_SECTIONS,
  type BlogFilter,
  type Teaching,
} from "@/lib/teaching-text";

export function BlogIndex({ filter, posts }: { filter: BlogFilter; posts: Teaching[] }) {
  const heading = filter === "all" ? BLOG_HOME.label : TEACHING_SECTIONS[filter].label;
  const intro = filter === "all" ? BLOG_HOME.intro : TEACHING_SECTIONS[filter].intro;
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogIndexJsonLd(filter, posts)) }} />
      <p className="text-sm text-muted">
        <Link to="/" className="font-semibold text-primary underline-offset-4 hover:underline">
          Home
        </Link>
        {" / "}
        {filter === "all" ? (
          <span>Blog</span>
        ) : (
          <>
            <Link to="/blogs" className="font-semibold text-primary underline-offset-4 hover:underline">
              Blog
            </Link>
            {" / "}
            <span>{TEACHING_SECTIONS[filter].label}</span>
          </>
        )}
      </p>
      <Panel className="mt-4">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink">{heading}</h1>
        <p className="mt-3 max-w-prose text-muted">{intro}</p>
        <nav aria-label="Blog" className="mt-4 flex flex-wrap gap-2">
          {BLOG_TABS.map((tab) =>
            tab.id === "teachings" ? (
              <Link
                key={tab.id}
                to="/blogs"
                search={{ section: "teachings" }}
                aria-current={tab.id === filter ? "page" : undefined}
                className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-ink aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
              >
                {tab.label}
              </Link>
            ) : tab.id === "learning-hebrabbai" ? (
              <Link
                key={tab.id}
                to="/learning-hebrabbai"
                aria-current={tab.id === filter ? "page" : undefined}
                className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-ink aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
              >
                {tab.label}
              </Link>
            ) : (
              <Link
                key={tab.id}
                to="/blogs"
                aria-current={tab.id === filter ? "page" : undefined}
                className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-ink aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
              >
                {tab.label}
              </Link>
            ),
          )}
        </nav>
        {filter !== "learning-hebrabbai" ? (
          <p className="mt-3 flex flex-wrap gap-x-5 text-sm">
            <Link to="/blogs/rss.xml" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
              HaDay Teachings
            </Link>
            <Link to="/learning-hebrabbai/rss.xml" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
              HaDay Learning HebRabbAi
            </Link>
          </p>
        ) : null}
      </Panel>
      {posts.length === 0 ? (
        <Panel className="mt-4">
          <p className="text-muted">No posts yet.</p>
        </Panel>
      ) : (
        posts.map((post) => (
          <Panel key={post.slug} className="mt-4">
            {post.image ? (
              <div className="mb-3 aspect-[16/9] overflow-hidden rounded-[var(--radius-md)]">
                <img src={post.image} alt={post.imageAlt} width={1200} height={675} loading="lazy" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <h2 className="font-display text-2xl font-semibold text-ink">
              {post.section === "teachings" ? (
                <Link to="/blogs/$slug" params={{ slug: post.slug }} className="underline-offset-4 hover:underline">
                  {post.title}
                </Link>
              ) : (
                <Link to="/learning-hebrabbai/$slug" params={{ slug: post.slug }} className="underline-offset-4 hover:underline">
                  {post.title}
                </Link>
              )}
            </h2>
            <p className="mt-2 max-w-prose text-muted">{post.summary}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{TEACHING_SECTIONS[post.section].label}</p>
            <p className="mt-1 text-sm text-muted">
              <time dateTime={post.published}>{blogDate(post.published)}</time>
            </p>
          </Panel>
        ))
      )}
      <PublicFooter />
    </main>
  );
}
