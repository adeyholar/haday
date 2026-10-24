import { Link } from "@tanstack/react-router";
import { BlogComments } from "@/components/blog-comments";
import { Panel } from "@/components/panel";
import { PublicFooter } from "@/components/public-footer";
import { AUTHOR } from "@/lib/author";
import { postJsonLd } from "@/lib/blog-jsonld";
import { blogDate, renderTeaching, TEACHING_SECTIONS, type Teaching } from "@/lib/teaching-text";

export function BlogArticle({ post, related }: { post: Teaching; related: Teaching[] }) {
  const section = TEACHING_SECTIONS[post.section];
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd(post)) }} />
      <p className="text-sm text-muted">
        <Link to="/" className="font-semibold text-primary underline-offset-4 hover:underline">
          Home
        </Link>
        {" / "}
        <Link to="/blogs" className="font-semibold text-primary underline-offset-4 hover:underline">
          Blog
        </Link>
        {" / "}
        {post.section === "teachings" ? (
          <Link to="/blogs" className="font-semibold text-primary underline-offset-4 hover:underline">
            {section.label}
          </Link>
        ) : (
          <Link to="/learning-hebrabbai" className="font-semibold text-primary underline-offset-4 hover:underline">
            {section.label}
          </Link>
        )}
        {" / "}
        <span>{post.title}</span>
      </p>
      <article className="mt-4">
        <Panel>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink">{post.title}</h1>
          <p className="mt-3 text-sm text-muted">
            <Link to="/about" className="font-semibold text-primary underline-offset-4 hover:underline">
              Brother Ade
            </Link>
            . Published <time dateTime={post.published}>{blogDate(post.published)}</time>
            {post.updated !== post.published ? <>. Updated <time dateTime={post.updated}>{blogDate(post.updated)}</time></> : null}
            .
          </p>
          {post.image ? (
            <img src={post.image} alt={post.imageAlt} width={1200} height={675} loading="lazy" className="mt-4 w-full rounded-[var(--radius-md)]" />
          ) : null}
          <div
            className="blog-body mt-4 max-w-prose leading-relaxed text-ink"
            dangerouslySetInnerHTML={{ __html: renderTeaching(post.body) }}
          />
        </Panel>
      </article>
      {post.section === "teachings" ? (
        <Panel className="mt-4">
          <Link to="/" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
            Read it in Hebrew with HaDay HebRabbAi Mentor
          </Link>
        </Panel>
      ) : null}
      <Panel className="mt-4">
        <img src="/about/adeola-128.jpg" alt="Brother Ade" width={128} height={128} className="h-16 w-16 rounded-full object-cover" />
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

