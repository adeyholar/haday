import { brotliCompressSync, gzipSync, constants as zlibConstants } from "node:zlib";
import { canonicalUrl, retiredHostRedirect, robotsNoindex, shouldRedirectAzure } from "../../src/lib/seo";

/** Security headers for every response. CSP only blocks framing, so the app's own scripts still run. */
const HEADERS: Record<string, string> = {
  "Content-Security-Policy": "frame-ancestors 'none'",
  "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
};

type HeaderEvent = {
  url?: URL;
  req?: { method?: string; headers?: Headers };
};

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
  const cache = publicCache(path);
  if (cache && !headers.has("cache-control")) headers.set("cache-control", cache);
  const shaped = new Response(result.body, { status: result.status, statusText: result.statusText, headers });
  const accept = event.req?.headers?.get?.("accept-encoding") || "";
  return encode(shaped, accept);
}
