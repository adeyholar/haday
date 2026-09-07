/** The live class host. Old Vercel URLs must not serve the app. */
export const CLASS_SITE = "https://hadayhebbraimentor.jcdisn.com";
export const CLASS_SITE_HOST = "hadayhebbraimentor.jcdisn.com";
export const AZURE_FALLBACK = "https://haday.azurewebsites.net";

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
