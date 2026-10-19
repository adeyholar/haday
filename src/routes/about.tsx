import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter } from "@/components/public-footer";
import { AUTHOR, PERSON_JSON_LD } from "@/lib/author";
import { CLASS_SITE } from "@/lib/class-site";
import { shareMeta } from "@/lib/seo";

const TITLE = "About | HaDay HebRabbAi Mentor";

const ABOUT_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      name: "About HaDay HebRabbAi Mentor",
      url: AUTHOR.url,
      mainEntity: { "@id": AUTHOR.id },
    },
    PERSON_JSON_LD,
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${CLASS_SITE}/` },
        { "@type": "ListItem", position: 2, name: "About", item: AUTHOR.url },
      ],
    },
  ],
};

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: shareMeta(TITLE, AUTHOR.mission, "/about"),
    links: [{ rel: "canonical", href: AUTHOR.url }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_JSON_LD) }} />
      <h1 className="font-display text-4xl font-bold tracking-tight text-ink">About HaDay HebRabbAi Mentor</h1>
      <img
        src="/about/adeola.jpg"
        alt={AUTHOR.name}
        width={400}
        height={400}
        className="mt-6 h-40 w-40 rounded-[var(--radius-md)] object-cover"
      />
      <p className="mt-4 font-display text-2xl font-semibold text-ink">{AUTHOR.name}</p>
      <p className="mt-3 max-w-prose leading-relaxed text-muted">{AUTHOR.longBio}</p>
      <p className="mt-3 max-w-prose leading-relaxed text-muted">{AUTHOR.mission}</p>
      <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        <Link to="/bbh" className="text-primary underline-offset-4 hover:underline">
          Grammar Path
        </Link>
        <Link to="/iibs" className="text-primary underline-offset-4 hover:underline">
          Scripture Path
        </Link>
        <a href="/teachings" className="text-primary underline-offset-4 hover:underline">
          Teachings
        </a>
      </p>
      <PublicFooter />
    </main>
  );
}
