import { CLASS_SITE, PREVIOUS_CLASS_HOST, isRetiredVercelHost } from "@/lib/class-site";

export const SEO_TITLE =
  "Biblical Hebrew Vocabulary Trainer for First-Year Students | HaDay HebRabbAi Mentor";

export const SEO_DESCRIPTION =
  "HaDay HebRabbAi Mentor trains Biblical Hebrew vocabulary for first-year students. Hear a word, then its meaning. Lessons stay behind sign-in.";

const INDEXABLE = new Set(["/", "/legal", "/credits", "/robots.txt", "/sitemap.xml", "/llms.txt"]);

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
