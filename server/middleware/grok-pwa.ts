/**
 * Deployed-app (Nitro) half of the platform PWA chrome. Auto-registered as
 * global h3 middleware because vite.config.ts sets `serverDir: "./server"` —
 * without that option Nitro v3 never scans this directory.
 *
 * - `?install=1&platform=ios` on a document path → the Home Screen tutorial,
 *   bundled into the server build via `?raw` (the public/ directory is CDN
 *   static output on Vercel and not readable from the function).
 * - `/__grok/manifest.webmanifest` → per-app-named manifest (kept out of
 *   public/ so this dynamic response is the only one).
 * - Other HTML documents → fill missing PWA + OG head tags at `</head>`.
 *   A tag the page already wrote (og: and twitter:) stays. A site default is
 *   added only when that tag is missing. Encoded and plain documents get the
 *   same head. Blog cache headers are left as the inner response set them.
 *   OG identity is baked via `virtual:grok-og-identity` at `vite build`
 *   (this function cannot read `src/lib/og/site.json` or `public/og.jpg`).
 *   This must be a middleware transforming `next()`: h3 discards the `response`
 *   runtime hook's return value, and `render:html` does not exist in Nitro v3.
 */
import installPageTemplate from "../../scripts/install-page.html?raw";
import { grokOgIdentity } from "virtual:grok-og-identity";
import {
  acceptsHtml,
  finishHtmlResponse,
  isDocumentPath,
  isInstallQuery,
  renderInstallPageHtml,
  renderWebManifest,
} from "../../scripts/grok-pwa-shared.mjs";

interface GrokPwaEvent {
  url: URL;
  req: { method: string; headers: Headers };
}

function requestHost(event: GrokPwaEvent): string {
  return (
    event.req.headers.get("x-forwarded-host") ?? event.req.headers.get("host") ?? event.url.host
  );
}

function keepsBlogCache(path: string): boolean {
  return (
    path === "/blogs" ||
    path.startsWith("/blogs/") ||
    path === "/learning-hebrabbai" ||
    path.startsWith("/learning-hebrabbai/")
  );
}

async function injectDocument(response: Response, host: string, path: string): Promise<Response> {
  const encoding = response.headers.get("content-encoding") ?? "";
  const raw = Buffer.from(await response.arrayBuffer());
  const finished = finishHtmlResponse(
    raw,
    encoding,
    { host, site: grokOgIdentity.site },
    response.headers,
  );
  if (!finished) {
    return new Response(raw, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }
  const headers = finished.headers;
  if (!keepsBlogCache(path)) {
    headers.set("cache-control", "no-store, no-cache, must-revalidate");
    headers.set("pragma", "no-cache");
  }
  return new Response(Buffer.from(finished.body), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default async function grokPwaMiddleware(
  event: GrokPwaEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const method = (event.req.method ?? "GET").toUpperCase();
  if (method !== "GET") return next();

  const path = event.url.pathname;
  const urlWithQuery = path + event.url.search;

  if (path === "/__grok/manifest.webmanifest" || path === "/__grok/manifest.json") {
    return new Response(
      renderWebManifest(requestHost(event), {
        name: "HaDay HebRabbAi Mentor",
        shortName: "HaDay",
        icon: "/apple-touch-icon.png",
        background: "#F3EEE4",
        theme: "#F3EEE4",
      }),
      {
        headers: {
          "content-type": "application/manifest+json; charset=utf-8",
          "cache-control": "no-cache",
        },
      },
    );
  }

  if (
    isInstallQuery(urlWithQuery) &&
    isDocumentPath(path) &&
    acceptsHtml(event.req.headers.get("accept"))
  ) {
    const html = renderInstallPageHtml(installPageTemplate, {
      host: requestHost(event),
      url: urlWithQuery,
      name: "HaDay",
    });
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  }

  if (!isDocumentPath(path)) return next();

  const result = await next();
  if (
    result instanceof Response &&
    result.body &&
    String(result.headers.get("content-type") ?? "").includes("text/html")
  ) {
    return injectDocument(result, requestHost(event), path);
  }
  return result;
}
