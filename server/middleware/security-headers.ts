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
  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers,
  });
}
