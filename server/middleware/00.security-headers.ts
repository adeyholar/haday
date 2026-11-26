import { brotliCompressSync, gzipSync, constants as zlibConstants } from "node:zlib";
import { canonicalUrl, retiredHostRedirect, robotsNoindex, shouldRedirectAzure } from "../../src/lib/seo";
import { keepsBlogCache } from "../../src/lib/teaching-text";

/**
 * Content-Security-Policy, rolled out in Report-Only first so nothing breaks.
 * Why each source is here:
 * - script-src: the page streams inline bootstrap scripts (TanStack Start) and a theme script, and blog posts carry an inline onclick, so 'unsafe-inline' stays until the app sends nonces. https://grok.com is the platform extensions.js tag added by the head injector.
 * - style-src: React and the blog video button write style attributes. Google Fonts serves the CSS.
 * - font-src: Google Fonts files.
 * - img-src: blog pictures live on images.haday.app. data: and blob: cover the handwriting pad and the recorder.
 * - media-src: chapter audio comes from mechon-mamre.org when no local file exists. blob: and data: cover the voice recorder.
 * - connect-src: same-origin server functions and static JSON, the grok.com remix-eligibility check, and the admin picture upload to Cloudflare R2.
 * - frame-src: only the privacy-enhanced YouTube embed that blog posts can open.
 * To enforce, send the same value as Content-Security-Policy and drop report-uri (see docs/CSP.md).
 */
export const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://grok.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.haday.app",
  "media-src 'self' blob: data: https://mechon-mamre.org",
  "connect-src 'self' https://grok.com https://app-builder-deployer.grok.com https://*.r2.cloudflarestorage.com",
  "frame-src https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

export const CSP_REPORT_PATH = "/api/csp-report";

/** The microphone stays on for this site because the recorder, echo and read-aloud lessons use it. */
export const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=(self)",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "serial=()",
  "hid=()",
  "display-capture=()",
  "accelerometer=()",
  "gyroscope=()",
  "magnetometer=()",
  'fullscreen=(self "https://www.youtube-nocookie.com")',
].join(", ");

/** Security headers for every response. The 00. name keeps this outside the head injector, so the injector edits plain HTML and this file compresses it once. The enforced CSP only blocks framing, so the app's own scripts still run. The full policy is report-only until the reports are clean. */
const HEADERS: Record<string, string> = {
  "Content-Security-Policy": "frame-ancestors 'none'",
  "Content-Security-Policy-Report-Only": `${CSP_POLICY}; report-uri ${CSP_REPORT_PATH}`,
  "Permissions-Policy": PERMISSIONS_POLICY,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
};

type HeaderEvent = {
  url?: URL;
  req?: { method?: string; headers?: Headers; text?: () => Promise<string> };
};

/** Browsers post violation reports here. The line goes to the app log and the browser gets a 204. */
async function logCspReport(event: HeaderEvent): Promise<Response> {
  try {
    const raw = ((await event.req?.text?.()) ?? "").slice(0, 4000);
    // eslint-disable-next-line no-control-regex
    console.warn("[csp-report]", JSON.stringify(raw.replace(/[\u0000-\u001f\u007f]+/g, " ")));
  } catch {
    // A bad report is not worth an error.
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

function requestHost(event: HeaderEvent): string {
  const headers = event.req?.headers;
  return headers?.get?.("x-forwarded-host") || headers?.get?.("host") || event.url?.host || "";
}

/** Un-hashed public files. Hashed /assets already send immutable. */
function publicCache(path: string): string | null {
  if (path.startsWith("/assets/")) return null;
  if (/\.(?:jpg|jpeg|png|webp|gif|svg|ico|woff2?|mp3|json)$/i.test(path)) return "public, max-age=604800";
  return null;
}

function blogCachePath(path: string): boolean {
  return keepsBlogCache(path) || path === "/sitemap.xml" || path === "/llms.txt";
}

function hasSessionCookie(event: HeaderEvent): boolean {
  const cookie = event.req?.headers?.get?.("cookie") || "";
  return cookie.includes("session_token=");
}

function compressible(type: string): boolean {
  return /text\/|javascript|json|xml|svg|\+json/i.test(type);
}

async function encode(result: Response, accept: string): Promise<Response> {
  if (result.headers.has("content-encoding")) return result;
  const type = result.headers.get("content-type") || "";
  if (!compressible(type) || !result.body) return result;
  const buf = Buffer.from(await result.arrayBuffer());
  if (buf.length < 256) {
    return new Response(buf, { status: result.status, statusText: result.statusText, headers: result.headers });
  }
  const br = /\bbr\b/.test(accept);
  const gz = /\bgzip\b/.test(accept);
  if (!br && !gz) {
    return new Response(buf, { status: result.status, statusText: result.statusText, headers: result.headers });
  }
  const out = br
    ? brotliCompressSync(buf, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 5 } })
    : gzipSync(buf);
  const headers = new Headers(result.headers);
  headers.set("content-encoding", br ? "br" : "gzip");
  headers.delete("content-length");
  const vary = headers.get("vary");
  headers.set("vary", vary ? `${vary}, Accept-Encoding` : "Accept-Encoding");
  return new Response(out, { status: result.status, statusText: result.statusText, headers });
}

export default async function securityHeaders(
  event: HeaderEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const method = event.req?.method || "GET";
  const path = event.url?.pathname || "/";
  if (method === "POST" && path === CSP_REPORT_PATH) return logCspReport(event);
  const host = requestHost(event);
  const retired = event.url ? retiredHostRedirect(host, path, method) : null;
  if (event.url && (shouldRedirectAzure(host, path, method) || retired)) {
    return new Response(null, {
      status: retired ?? 301,
      headers: {
        ...HEADERS,
        Location: canonicalUrl(path) + event.url.search,
      },
    });
  }

  const result = await next();
  if (!(result instanceof Response)) return result;
  const headers = new Headers(result.headers);
  for (const [key, value] of Object.entries(HEADERS)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  if (robotsNoindex(host, path)) headers.set("X-Robots-Tag", "noindex, nofollow");
  else if (!headers.has("Link")) headers.set("Link", `<${canonicalUrl(path)}>; rel="canonical"`);
  if (path.startsWith("/admin") || path.startsWith("/api/")) headers.set("cache-control", "no-store");
  else if (blogCachePath(path)) {
    headers.set(
      "cache-control",
      hasSessionCookie(event) ? "no-store" : "public, s-maxage=300, stale-while-revalidate=300",
    );
  }
  const cache = publicCache(path);
  if (cache && !headers.has("cache-control")) headers.set("cache-control", cache);
  const shaped = new Response(result.body, { status: result.status, statusText: result.statusText, headers });
  const accept = event.req?.headers?.get?.("accept-encoding") || "";
  return encode(shaped, accept);
}
