export type TeachingPath = "grammar" | "scripture";

export type TeachingSection = "teachings" | "learning-hebrabbai";

export const TEACHING_SECTIONS: Record<
  TeachingSection,
  { label: string; path: "/blogs" | "/learning-hebrabbai"; intro: string; feed: string }
> = {
  teachings: {
    label: "Teachings",
    path: "/blogs",
    intro: "Writing on Scripture from HaDay HebRabbAi Mentor.",
    feed: "HaDay Teachings",
  },
  "learning-hebrabbai": {
    label: "Learning HebRabbAi",
    path: "/learning-hebrabbai",
    intro: "Guides for using HaDay HebRabbAi Mentor.",
    feed: "Learning HebRabbAi",
  },
};

export function teachingSection(value: string | undefined): TeachingSection | null {
  if (value === "teachings" || value === "learning-hebrabbai") return value;
  return null;
}

export function postPath(section: TeachingSection, slug: string): string {
  return `${TEACHING_SECTIONS[section].path}/${slug}`;
}

export type Teaching = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  path: TeachingPath;
  section: TeachingSection;
  tags: string[];
  related: string[];
  image: string;
  imageAlt: string;
  draft: boolean;
  published: string;
  updated: string;
};

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function splitList(value: string): string[] {
  const seen = new Set<string>();
  for (const part of value.split(",")) {
    const slug = slugify(part.trim());
    if (slug) seen.add(slug);
  }
  return [...seen];
}

function cleanLine(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

const IMAGE_HOST = "images.haday.app";

export function isBlogImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === IMAGE_HOST && url.pathname.length > 1;
  } catch {
    return false;
  }
}

export function validateTeaching(input: {
  slug?: string;
  title?: string;
  summary?: string;
  body?: string;
  path?: string;
  section?: string;
  tags?: string;
  related?: string;
  image?: string;
  imageAlt?: string;
  draft?: boolean;
  published?: string;
}): { ok: true; value: Omit<Teaching, "updated"> } | { ok: false; error: string } {
  const title = cleanLine(input.title ?? "", 140);
  if (title.length < 4) return { ok: false, error: "Give the blog a title." };
  const summary = cleanLine(input.summary ?? "", 155);
  if (summary.length < 12) return { ok: false, error: "Add a summary of at least a sentence." };
  if ((input.summary ?? "").trim().length > 155) return { ok: false, error: "Keep the summary to 155 characters." };
  const slug = slugify(input.slug?.trim() || title);
  if (!slug) return { ok: false, error: "The address needs letters or numbers." };
  const section = teachingSection(input.section);
  if (!section) return { ok: false, error: "Choose Teachings or Learning HebRabbAi." };
  const body = (input.body ?? "").replace(/\r\n/g, "\n").trim();
  if (body.length < 20) return { ok: false, error: "Write the post before saving." };
  if (body.length > 20000) return { ok: false, error: "This post is too long to save." };
  if (input.path !== "grammar" && input.path !== "scripture") {
    return { ok: false, error: "Choose the Grammar Path or the Scripture Path." };
  }
  const published = (input.published ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(published)) return { ok: false, error: "Set the date." };
  const image = (input.image ?? "").trim();
  const imageAlt = cleanLine(input.imageAlt ?? "", 180);
  if (image && !isBlogImageUrl(image)) {
    return { ok: false, error: "The picture must be an https://images.haday.app address." };
  }
  if (image && !imageAlt) return { ok: false, error: "Add alt text for the picture." };
  const imageTags = body.match(/\[image[^\]]*\]/g) ?? [];
  const goodImages =
    body.match(/\[image url="https:\/\/images\.haday\.app\/[^"\s]+" alt="[^"]+"[^\]]*\]/g) ?? [];
  if (imageTags.length !== goodImages.length) {
    return { ok: false, error: "Each picture in the post needs an images.haday.app address and alt text." };
  }
  return {
    ok: true,
    value: {
      slug,
      title,
      summary,
      body,
      path: input.path,
      section,
      tags: splitList(input.tags ?? ""),
      related: splitList(input.related ?? "").filter((item) => item !== slug),
      image,
      imageAlt,
      draft: input.draft !== false,
      published,
    },
  };
}

export function isPublicTeaching(post: Pick<Teaching, "draft" | "published">, now = new Date()): boolean {
  if (post.draft) return false;
  const day = post.published.slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  return day <= today;
}

export function teachingCta(path: TeachingPath, signedIn: boolean): string {
  if (path === "scripture") return signedIn ? "/iibs" : "/login?path=iibs";
  return signedIn ? "/bbh" : "/login?path=bbh";
}

export function relatedTeachings(post: Teaching, all: Teaching[], count = 2): Teaching[] {
  const live = all.filter((item) => item.slug !== post.slug && item.section === post.section && isPublicTeaching(item));
  const picked: Teaching[] = [];
  const used = new Set<string>();
  const take = (item: Teaching | undefined) => {
    if (!item || used.has(item.slug) || picked.length >= count) return;
    used.add(item.slug);
    picked.push(item);
  };
  for (const slug of post.related) take(live.find((item) => item.slug === slug));
  const tags = new Set(post.tags);
  for (const item of live) {
    if (item.tags.some((tag) => tags.has(tag))) take(item);
  }
  for (const item of live) take(item);
  return picked;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

function safeHref(value: string): string | null {
  const href = value.trim();
  if (href.startsWith("/") && !href.startsWith("//")) return escapeHtml(href);
  if (/^https:\/\/[^\s]+$/i.test(href)) return escapeHtml(href);
  return null;
}

function inline(value: string): string {
  let text = escapeHtml(value);
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (all, label: string, href: string) => {
    const safe = safeHref(href);
    return safe ? `<a href="${safe}">${label}</a>` : all;
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  text = text.replace(/[\u0590-\u05FF]+/g, (word) => `<span dir="rtl" lang="he">${word}</span>`);
  return text;
}

const SHORTCODE =
  /\[verse ref="([^"]{1,40})"\]([\s\S]*?)\[\/verse\]|\[image url="(https:\/\/images\.haday\.app\/[^"\s]+)" alt="([^"]{1,180})"(?: caption="([^"]*)")?(?: width="(\d{1,5})")?(?: height="(\d{1,5})")?\]|\[video id="([A-Za-z0-9_-]{11})"\]|\[hebrabbai-cta\]/g;

function markdownBlocks(markdown: string): string {
  const blocks = markdown.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n");
      const heading = /^(#{1,3})\s+(.+)$/.exec(lines[0] ?? "");
      if (lines.length === 1 && heading) {
        const level = heading[1]!.length + 1;
        return `<h${level}>${inline(heading[2]!)}</h${level}>`;
      }
      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        const items = lines.map((line) => `<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        const items = lines.map((line) => `<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`).join("");
        return `<ol>${items}</ol>`;
      }
      if (lines.every((line) => line.startsWith(">"))) {
        return `<blockquote>${inline(lines.map((line) => line.replace(/^>\s?/, "")).join(" "))}</blockquote>`;
      }
      return `<p>${inline(lines.join(" "))}</p>`;
    })
    .join("");
}

function shortcodeHtml(match: RegExpExecArray): string {
  if (match[1] != null) {
    return `<figure class="my-4"><blockquote dir="rtl" lang="he" class="he-word text-2xl leading-relaxed">${inline(match[2] ?? "")}</blockquote><figcaption class="mt-1 text-sm text-muted">${escapeHtml(match[1])}</figcaption></figure>`;
  }
  if (match[3]) {
    const width = match[6] ? ` width="${escapeHtml(match[6])}"` : "";
    const height = match[7] ? ` height="${escapeHtml(match[7])}"` : "";
    const caption = match[5]?.trim() ? `<figcaption class="mt-1 text-sm text-muted">${escapeHtml(match[5])}</figcaption>` : "";
    return `<figure class="my-4"><img src="${escapeHtml(match[3])}" alt="${escapeHtml(match[4] ?? "")}" loading="lazy"${width}${height}>${caption}</figure>`;
  }
  if (match[8]) {
    const id = escapeHtml(match[8]);
    const src = `https://www.youtube-nocookie.com/embed/${id}`;
    return `<p><button type="button" class="min-h-11 font-semibold text-primary underline" onclick="this.outerHTML='<iframe src="${src}" title="Video" loading="lazy" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0"></iframe>'">Play the video</button></p>`;
  }
  return `<p><a class="inline-flex min-h-11 items-center font-semibold text-primary underline" href="/login">Open HaDay HebRabbAi Mentor</a></p>`;
}

export function renderTeaching(markdown: string): string {
  const source = markdown.replace(/\r\n/g, "\n").trim();
  let html = "";
  let last = 0;
  for (const match of source.matchAll(SHORTCODE)) {
    const index = match.index ?? 0;
    html += markdownBlocks(source.slice(last, index));
    html += shortcodeHtml(match);
    last = index + match[0].length;
  }
  html += markdownBlocks(source.slice(last));
  return html;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "\u0026amp;").replace(/</g, "\u0026lt;").replace(/>/g, "\u0026gt;");
}

export function teachingsRss(posts: Teaching[], site: string, section: TeachingSection = "teachings"): string {
  const meta = TEACHING_SECTIONS[section];
  const items = posts
    .filter((post) => post.section === section && isPublicTeaching(post))
    .map((post) => {
      const link = `${site}${postPath(section, post.slug)}`;
      const pub = new Date(`${post.published}T12:00:00.000Z`).toUTCString();
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid>${escapeXml(link)}</guid>`,
        `      <pubDate>${pub}</pubDate>`,
        `      <description>${escapeXml(post.summary)}</description>`,
        "      <author>Adeola Adegbolagun</author>",
        "    </item>",
      ].join("\n");
    })
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(meta.feed)}</title>`,
    `    <link>${site}${meta.path}</link>`,
    `    <description>${escapeXml(meta.intro)}</description>`,
    `    <atom:link href="${site}${meta.path}/rss.xml" rel="self" type="application/rss+xml"/>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
