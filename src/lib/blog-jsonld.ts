import { AUTHOR, FFIM } from "@/lib/author";
import { CLASS_SITE } from "@/lib/class-site";
import { postPath, TEACHING_SECTIONS, type BlogFilter, type Teaching } from "@/lib/teaching-text";

const PUBLISHER_LOGO = "https://images.haday.app/brand/ffim-publisher-logo.png";

export function blogCrumbs(filter: BlogFilter) {
  const home = { "@type": "ListItem", position: 1, name: "Home", item: `${CLASS_SITE}/` };
  const blog = { "@type": "ListItem", position: 2, name: "Blog", item: `${CLASS_SITE}/blogs` };
  if (filter === "all") return [home, blog];
  const section = TEACHING_SECTIONS[filter];
  return [...[home, blog], { "@type": "ListItem", position: 3, name: section.label, item: `${CLASS_SITE}${section.path}` }];
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
          ...blogCrumbs(post.section),
          { "@type": "ListItem", position: 4, name: post.title, item: url },
        ],
      },
    ],
  };
}

export function blogIndexJsonLd(
  filter: BlogFilter,
  posts: Pick<Teaching, "slug" | "title" | "published" | "section">[],
) {
  const name = filter === "all" ? "Blog" : TEACHING_SECTIONS[filter].label;
  const url = filter === "learning-hebrabbai" ? `${CLASS_SITE}/learning-hebrabbai` : `${CLASS_SITE}/blogs`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        name,
        url,
        blogPost: posts.map((post) => ({
          "@type": post.section === "learning-hebrabbai" ? "TechArticle" : "BlogPosting",
          headline: post.title,
          url: `${CLASS_SITE}${postPath(post.section, post.slug)}`,
          datePublished: post.published,
        })),
      },
      { "@type": "BreadcrumbList", itemListElement: blogCrumbs(filter) },
    ],
  };
}
