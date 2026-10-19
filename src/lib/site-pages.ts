import { CLASS_SITE } from "@/lib/class-site";

export type SitePage = {
  path: string;
  title: string;
  summary: string;
  lastmod: string;
};

export const STATIC_PAGES: SitePage[] = [
  {
    path: "/",
    title: "Learn to Read Biblical Hebrew",
    summary:
      "Learn to read the Hebrew Bible in its original language. Hear each word, build vocabulary and grammar, and read real verses step by step.",
    lastmod: "2026-10-19",
  },
  {
    path: "/how-to-memorize-biblical-hebrew-vocabulary",
    title: "How to Memorize Biblical Hebrew Vocabulary",
    summary:
      "Learn the most frequent words first, hear each word before its meaning, and read real verses early.",
    lastmod: "2026-10-17",
  },
  {
    path: "/legal",
    title: "Privacy and disclaimer",
    summary: "How HaDay uses your account, and what this Biblical Hebrew class site is not.",
    lastmod: "2026-10-18",
  },
  {
    path: "/credits",
    title: "Credits",
    summary: "The readers, texts, and open works behind HaDay HebRabbAi Mentor.",
    lastmod: "2026-10-18",
  },
  {
    path: "/about",
    title: "About HaDay HebRabbAi Mentor",
    summary: "Adeola Adegbolagun teaches Biblical Hebrew with HaDay HebRabbAi Mentor.",
    lastmod: "2026-10-19",
  },
];

/** Public pages a person can open. Later pages are added here. */
export function allPublicPages(): SitePage[] {
  return STATIC_PAGES;
}

function pageUrl(path: string): string {
  return path === "/" ? `${CLASS_SITE}/` : `${CLASS_SITE}${path}`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "\u0026amp;").replace(/</g, "\u0026lt;").replace(/>/g, "\u0026gt;");
}

export function sitemapXml(pages: SitePage[] = allPublicPages()): string {
  const urls = pages
    .map(
      (page) =>
        `  <url>\n    <loc>${escapeXml(pageUrl(page.path))}</loc>\n    <lastmod>${page.lastmod}</lastmod>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const LLMS_INTRO =
  "Learn to read the Hebrew Bible in its original language, for beginners, students and believers who want to understand Scripture more deeply.";

export function llmsTxt(pages: SitePage[] = allPublicPages()): string {
  const lines = pages.map((page) => `- ${page.title}: ${pageUrl(page.path)}`);
  return [
    "# HaDay HebRabbAi Mentor",
    "",
    LLMS_INTRO,
    "",
    "Public pages:",
    ...lines,
    "",
    "Teachings:",
    "",
    "The class study, games, listen pages, and lexicon require sign-in. Textbook pages and answer keys are not published here.",
    "",
  ].join("\n");
}
