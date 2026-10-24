import { Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { PublicFooter } from "@/components/public-footer";
import { sectionJsonLd } from "@/lib/blog-jsonld";
import { TEACHING_SECTIONS, type Teaching, type TeachingSection } from "@/lib/teaching-text";

export function BlogIndex({ section, posts }: { section: TeachingSection; posts: Teaching[] }) {
  const meta = TEACHING_SECTIONS[section];
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sectionJsonLd(section, posts)) }} />
      <p className="text-sm text-muted">
        <Link to="/" className="font-semibold text-primary underline-offset-4 hover:underline">
          Home
        </Link>
        {" / "}
        <span>{meta.label}</span>
      </p>
      <Panel className="mt-4">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink">{meta.label}</h1>
        <p className="mt-3 max-w-prose text-muted">{meta.intro}</p>
      </Panel>
      {posts.length === 0 ? (
        <Panel className="mt-4">
          <p className="text-muted">No posts yet.</p>
        </Panel>
      ) : (
        posts.map((post) => (
          <Panel key={post.slug} className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{post.published}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              {section === "teachings" ? (
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
          </Panel>
        ))
      )}
      <PublicFooter />
    </main>
  );
}
