import { AUTHOR, FFIM } from "@/lib/author";
import { CLASS_SITE } from "@/lib/class-site";
import { postPath, TEACHING_SECTIONS, type Teaching, type TeachingSection } from "@/lib/teaching-text";

const PUBLISHER_LOGO = "https://images.haday.app/brand/ffim-publisher-logo.png";

export function sectionCrumb(section: TeachingSection) {
  const meta = TEACHING_SECTIONS[section];
  return [
    { "@type": "ListItem", position: 1, name: "Home", item: `${CLASS_SITE}/` },
    { "@type": "ListItem", position: 2, name: meta.label, item: `${CLASS_SITE}${meta.path}` },
  ];
}

export function postJsonLd(post: Teaching) {
  const url = `${CLASS_SITE}${postPath(post.section, post.slug)}`;
  const guide = post.section === "learning-hebrabbai";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": guide ? "TechArticle" : "BlogPosting",
        headline: post.title,
        description: post.summary,
        datePublished: post.published,
        dateModified: post.updated || post.published,
        image: post.image || `${CLASS_SITE}/og.jpg`,
        inLanguage: "en",
        url,
        mainEntityOfPage: url,
        author: { "@id": AUTHOR.id, name: AUTHOR.name, url: AUTHOR.url },
        publisher: {
          "@type": "Organization",
          "@id": FFIM.id,
          name: "FFIM (Fathers' Faith International Ministries LLC)",
          logo: { "@type": "ImageObject", url: PUBLISHER_LOGO, width: 600, height: 600 },
        },
        ...(guide ? { about: { "@type": "SoftwareApplication", name: "HaDay HebRabbAi Mentor" } } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          ...sectionCrumb(post.section),
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };
}

export function sectionJsonLd(section: TeachingSection, posts: Pick<Teaching, "slug" | "title" | "published" | "section">[]) {
  const meta = TEACHING_SECTIONS[section];
  const url = `${CLASS_SITE}${meta.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        name: meta.feed,
        url,
        blogPost: posts.map((post) => ({
          "@type": section === "learning-hebrabbai" ? "TechArticle" : "BlogPosting",
          headline: post.title,
          url: `${CLASS_SITE}${postPath(section, post.slug)}`,
          datePublished: post.published,
        })),
      },
      { "@type": "BreadcrumbList", itemListElement: sectionCrumb(section) },
    ],
  };
}
