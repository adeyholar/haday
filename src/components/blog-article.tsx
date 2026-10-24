import { Link } from "@tanstack/react-router";
import { BlogComments } from "@/components/blog-comments";
import { Panel } from "@/components/panel";
import { PublicFooter } from "@/components/public-footer";
import { AUTHOR } from "@/lib/author";
import { postJsonLd } from "@/lib/blog-jsonld";
import { renderTeaching, TEACHING_SECTIONS, type Teaching } from "@/lib/teaching-text";

export function BlogArticle({ post, related }: { post: Teaching; related: Teaching[] }) {
  const section = TEACHING_SECTIONS[post.section];
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd(post)) }} />
      <p className="text-sm text-muted">
        <a href="/" className="font-semibold text-primary underline-offset-4 hover:underline">
          Home
        </a>
        {" / "}
        <a href="/blogs" className="font-semibold text-primary underline-offset-4 hover:underline">
          Blog
        </a>
        {" / "}
        <a
          href={post.section === "teachings" ? "/blogs?section=teachings" : "/learning-hebrabbai"}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {section.label}
        </a>
        {" / "}
        <span>{post.title}</span>
      </p>
      <Panel className="mt-4">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink">{post.title}</h1>
        <p className="mt-3 text-sm text-muted">
          <Link to="/about" className="font-semibold text-primary underline-offset-4 hover:underline">
            Brother Ade
          </Link>
          . Published {post.published}
          {post.updated !== post.published ? `. Updated ${post.updated}` : ""}.
        </p>
        {post.image ? (
          <img src={post.image} alt={post.imageAlt} width={1200} height={675} loading="lazy" className="mt-4 w-full rounded-[var(--radius-md)]" />
        ) : null}
        <div
          className="blog-body mt-4 max-w-prose space-y-3 leading-relaxed text-ink"
          dangerouslySetInnerHTML={{ __html: renderTeaching(post.body) }}
        />
      </Panel>
      {post.section === "teachings" ? (
        <Panel className="mt-4">
          <Link to="/" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
            Read it in Hebrew with HebRabbAi
          </Link>
        </Panel>
      ) : null}
      <Panel className="mt-4">
        <img src="/about/adeola.jpg" alt={AUTHOR.name} width={800} height={800} className="h-16 w-16 rounded-full object-cover" />
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{AUTHOR.shortBio}</p>
      </Panel>
      <BlogComments slug={post.slug} initial={[]} />
      {related.length > 0 ? (
        <Panel className="mt-4">
          <h2 className="font-display text-2xl font-semibold text-ink">Related</h2>
          <ul className="mt-2 space-y-2">
            {related.map((item) => (
              <li key={item.slug}>
                {post.section === "teachings" ? (
                  <Link to="/blogs/$slug" params={{ slug: item.slug }} className="font-semibold text-primary underline-offset-4 hover:underline">
                    {item.title}
                  </Link>
                ) : (
                  <Link to="/learning-hebrabbai/$slug" params={{ slug: item.slug }} className="font-semibold text-primary underline-offset-4 hover:underline">
                    {item.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <PublicFooter />
    </main>
  );
}

