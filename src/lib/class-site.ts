/** The live class host. The previous host only redirects here. */
export const CLASS_SITE = "https://hebrewmentor.haday.app";
export const CLASS_SITE_HOST = "hebrewmentor.haday.app";
/** Kept so the old address can redirect. Do not use it as the public address. */
export const PREVIOUS_CLASS_HOST = "hadayhebbraimentor.jcdisn.com";
/** Public enquiries. The only address shown on the site. */
export const CONTACT_EMAIL = "haday.assistant@mail.grokbot.com";

export function isRetiredVercelHost(host: string | undefined | null): boolean {
  const h = (host ?? "").toLowerCase().split(":")[0];
  return h === "haday.vercel.app" || h.endsWith(".vercel.app");
}

export function classSiteUrl(path = "/"): string {
  const raw = path.split("#")[0] ?? "/";
  const hash = path.includes("#") ? `#${path.split("#").slice(1).join("#")}` : "";
  if (!raw || raw === "/" || raw === "/index.html") return CLASS_SITE + hash;
  return CLASS_SITE + (raw.startsWith("/") ? raw : `/${raw}`) + hash;
}
