import { CLASS_SITE, PREVIOUS_CLASS_HOST, isRetiredVercelHost } from "@/lib/class-site";

export const SEO_TITLE = "Learn to Read Biblical Hebrew | HaDay HebRabbAi Mentor";

export const SEO_DESCRIPTION =
  "Learn to read the Hebrew Bible in its original language. Hear each word, build vocabulary and grammar, and read real verses step by step, so you understand the text more deeply and draw closer to God.";

export const SITE_OG_IMAGE = `${CLASS_SITE}/og.jpg`;

const INDEXABLE = new Set([
  "/",
  "/legal",
  "/credits",
  "/how-to-memorize-biblical-hebrew-vocabulary",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
]);

export function requestPath(pathname: string): string {
  const bare = (pathname.split("?")[0] ?? "/").split("#")[0] ?? "/";
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare || "/";
}

/** Pages a search engine may index. Sign-in, reset, admin, and the study stay out. */
export function isIndexablePath(pathname: string): boolean {
  return INDEXABLE.has(requestPath(pathname));
}

export function canonicalUrl(pathname: string): string {
  const path = requestPath(pathname);
  return path === "/" ? `${CLASS_SITE}/` : `${CLASS_SITE}${path}`;
}

export function hostName(raw: string | null | undefined): string {
  return (raw ?? "").split(",")[0]?.trim().toLowerCase().split(":")[0] ?? "";
}

export function shouldRedirectAzure(host: string, pathname: string, method: string): boolean {
  const verb = method.toUpperCase();
  if (verb !== "GET" && verb !== "HEAD") return false;
  if (!hostName(host).endsWith(".azurewebsites.net")) return false;
  return requestPath(pathname) !== "/api/health";
}

/** Old class host. 301 for a page, 308 for a form, never the health check. */
export function retiredHostRedirect(host: string, pathname: string, method: string): 301 | 308 | null {
  if (hostName(host) !== PREVIOUS_CLASS_HOST) return null;
  if (requestPath(pathname) === "/api/health") return null;
  const verb = method.toUpperCase();
  if (verb === "GET" || verb === "HEAD") return 301;
  return 308;
}

/** noindex for sign-in pages, the study, admin, and the retired Vercel host. */
export function robotsNoindex(host: string, pathname: string): boolean {
  if (isRetiredVercelHost(hostName(host))) return true;
  return !isIndexablePath(pathname);
}

export const SITE_NAME = "HaDay HebRabbAi Mentor";

export function shareMeta(
  title: string,
  description: string,
  path: string,
  opts?: { type?: "website" | "article"; image?: string },
) {
  const url = canonicalUrl(path);
  const image = opts?.image ?? SITE_OG_IMAGE;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: opts?.type ?? "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: title },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}

export const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "HaDay HebRabbAi Mentor",
      url: `${CLASS_SITE}/`,
      description: SEO_DESCRIPTION,
    },
    {
      "@type": "WebApplication",
      name: "HaDay HebRabbAi Mentor",
      url: `${CLASS_SITE}/`,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: SEO_DESCRIPTION,
    },
  ],
} as const;
