import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { ContactLink, PublicFooter } from "@/components/public-footer";
import { AUTHOR, ABOUT_DESCRIPTION, FFIM, PERSON_JSON_LD } from "@/lib/author";
import { CLASS_SITE, CONTACT_EMAIL } from "@/lib/class-site";
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
      "@type": "Organization",
      "@id": FFIM.id,
      name: FFIM.name,
      alternateName: FFIM.alternateName,
      founder: { "@id": AUTHOR.id },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: CONTACT_EMAIL,
      },
    },
    {
      "@type": "WebApplication",
      name: "HaDay HebRabbAi Mentor",
      url: `${CLASS_SITE}/`,
      applicationCategory: "EducationalApplication",
      publisher: { "@id": FFIM.id },
      provider: { "@id": FFIM.id },
    },
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
    meta: shareMeta(TITLE, ABOUT_DESCRIPTION, "/about"),
    links: [{ rel: "canonical", href: AUTHOR.url }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_JSON_LD) }} />
      <Panel>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink">About HaDay HebRabbAi Mentor</h1>
        <p className="mt-3 max-w-prose leading-relaxed text-muted">{AUTHOR.shortBio}</p>
      </Panel>
      <Panel className="mt-4">
        <h2 className="font-display text-2xl font-semibold text-ink">Why HaDay exists</h2>
        <p className="mt-3 max-w-prose leading-relaxed text-muted">{AUTHOR.mission}</p>
      </Panel>
      <Panel className="mt-4">
        <img
          src="/about/adeola.jpg"
          alt="Adeola Adegbolagun"
          width={800}
          height={800}
          className="h-40 w-40 rounded-full object-cover"
        />
        <p className="mt-4 font-display text-2xl font-semibold text-ink">{AUTHOR.name}</p>
        <p className="mt-3 max-w-prose leading-relaxed text-muted">{AUTHOR.longBio}</p>
      </Panel>
      <Panel className="mt-4">
        <h2 className="font-display text-2xl font-semibold text-ink">What you'll learn</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
          <li>Reading the Hebrew alphabet and vowel points</li>
          <li>Vocabulary, with audio for every word</li>
          <li>Grammar: forms, roots, and how words are built</li>
          <li>Reading real verses, Levels A to E, then the Reading Lab</li>
          <li>The Grammar Path and the Scripture Path</li>
        </ul>
        <p className="mt-4 text-sm font-semibold">
          <a href="/teachings" className="text-primary underline-offset-4 hover:underline">
            Teachings
          </a>
        </p>
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <a href="/login?path=bbh" className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline">
            Start the Grammar Path
          </a>
          <a href="/login?path=iibs" className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline">
            Start the Scripture Path
          </a>
        </p>
      </Panel>
      <Panel className="mt-4">
        <h2 className="font-display text-2xl font-semibold text-ink">Contact</h2>
        <p className="mt-3">
          <ContactLink />
        </p>
      </Panel>
      <PublicFooter />
    </main>
  );
}
