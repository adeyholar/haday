import { brotliCompressSync, gzipSync, constants as zlibConstants } from "node:zlib";
import { canonicalUrl, retiredHostRedirect, robotsNoindex, shouldRedirectAzure } from "../../src/lib/seo";
import { keepsBlogCache } from "../../src/lib/teaching-text";

/**
 * Content-Security-Policy, rolled out in Report-Only first so nothing breaks.
 * Why each source is here:
 * - script-src: the page streams inline bootstrap scripts (TanStack Start) and a theme script, and blog posts carry an inline onclick, so 'unsafe-inline' stays until the app sends nonces. https://grok.com is the platform extensions.js tag added by the head injector.
 * - style-src: React and the blog video button write style attributes. Google Fonts serves the CSS.
 * - font-src: Google Fonts files.
 * - img-src: blog pictures live on images.haday.app. Sign-in avatars come from *.googleusercontent.com and *.twimg.com (UserButton in src/lib/auth/gates.tsx). data: and blob: cover the handwriting pad and the recorder.
 * - media-src: chapter audio comes from mechon-mamre.org when no local file exists. blob: and data: cover the voice recorder.
 * - connect-src: same-origin server functions and static JSON, the grok.com remix-eligibility check, and the admin picture upload to Cloudflare R2.
 * - frame-src: only the privacy-enhanced YouTube embed that blog posts can open.
 * To enforce, send the same value as Content-Security-Policy and drop report-uri. See docs/SECURITY-HEADERS.md.
 */
export const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://grok.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.haday.app https://*.googleusercontent.com https://*.twimg.com",
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
export const CSP_REPORT_MAX_BYTES = 8192;
export const CSP_REPORT_RATE_LIMIT = 30;
export const CSP_REPORT_WINDOW_MS = 60_000;
const CSP_REPORT_TYPES = new Set(["application/csp-report", "application/reports+json", "application/json"]);

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

/** Security headers for every response. The 00. name keeps this outside the head injector, so the injector edits plain HTML and this file compresses it once. The enforced CSP only blocks framing, so the app's own scripts still run. The full policy is report-only until the reports are clean. See docs/SECURITY-HEADERS.md. */
const HEADERS: Record<string, string> = {
  "Content-Security-Policy": "frame-ancestors 'none'",
  "Content-Security-Policy-Report-Only": `${CSP_POLICY}; report-uri ${CSP_REPORT_PATH}`,
  "Permissions-Policy": PERMISSIONS_POLICY,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
};

type HeaderMap = Headers | { get?: (name: string) => string | null; [key: string]: unknown };

type ReportBody = {
  getReader?: () => ReadableStreamDefaultReader<Uint8Array>;
  cancel?: () => Promise<void> | void;
};

type ReportRequest = {
  method?: string;
  headers?: HeaderMap;
  body?: ReportBody | ReadableStream<Uint8Array> | null;
  on?: (event: string, listener: (...args: never[]) => void) => void;
  off?: (event: string, listener: (...args: never[]) => void) => void;
  read?: (size?: number) => Buffer | string | null;
  pause?: () => void;
  resume?: () => void;
};

type HeaderEvent = {
  url?: URL;
  req?: ReportRequest;
};

const rateHits = new Map<string, { start: number; count: number }>();

/** Test-only: clear the in-memory CSP report rate-limit window. */
export function resetCspReportRateLimit(): void {
  rateHits.clear();
}

function noContent(): Response {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store", Connection: "close" } });
}

function headerValue(headers: HeaderMap | undefined, name: string): string {
  if (!headers) return "";
  const lower = name.toLowerCase();
  if (typeof headers.get === "function") {
    const fromGet = headers.get(name) ?? headers.get(lower) ?? "";
    if (fromGet) return fromGet;
  }
  const rec = headers as Record<string, unknown>;
  const raw = rec[name] ?? rec[lower];
  if (Array.isArray(raw)) return String(raw[0] ?? "");
  return typeof raw === "string" ? raw : "";
}

function clientIp(event: HeaderEvent): string {
  const forwarded = headerValue(event.req?.headers, "x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return headerValue(event.req?.headers, "x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const row = rateHits.get(ip);
  if (!row || now - row.start >= CSP_REPORT_WINDOW_MS) {
    rateHits.set(ip, { start: now, count: 1 });
    if (rateHits.size > 10_000) {
      for (const [key, value] of rateHits) {
        if (now - value.start >= CSP_REPORT_WINDOW_MS) rateHits.delete(key);
      }
    }
    return false;
  }
  row.count += 1;
  return row.count > CSP_REPORT_RATE_LIMIT;
}

function mediaType(value: string): string {
  return value.split(";")[0].trim().toLowerCase();
}

function cancelBody(req?: ReportRequest): void {
  const body = req?.body;
  if (body && typeof body.cancel === "function") {
    try {
      void body.cancel();
    } catch {
      // Closing the body is best-effort.
    }
  }
}

async function readWebStream(stream: { getReader: () => ReadableStreamDefaultReader<Uint8Array> }, maxBytes: number): Promise<{ ok: boolean; text: string }> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      size += value.byteLength;
      if (size > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // Already over the cap.
        }
        return { ok: false, text: "" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, text: "" };
  }
  return { ok: true, text: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8") };
}

function readNodeStream(req: ReportRequest, maxBytes: number): Promise<{ ok: boolean; text: string }> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;
    const finish = (result: { ok: boolean; text: string }) => {
      if (settled) return;
      settled = true;
      req.off?.("data", onData);
      req.off?.("end", onEnd);
      req.off?.("error", onError);
      resolve(result);
    };
    const onData = (...args: unknown[]) => {
      const chunk = args[0];
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(typeof chunk === "string" ? chunk : String(chunk ?? ""));
      size += buf.length;
      if (size > maxBytes) {
        req.pause?.();
        finish({ ok: false, text: "" });
        req.resume?.();
        return;
      }
      chunks.push(buf);
    };
    const onEnd = () => finish({ ok: true, text: Buffer.concat(chunks).toString("utf8") });
    const onError = () => finish({ ok: false, text: "" });
    req.on?.("data", onData);
    req.on?.("end", onEnd);
    req.on?.("error", onError);
  });
}

async function readBodyCapped(req: ReportRequest | undefined, maxBytes: number): Promise<{ ok: boolean; text: string }> {
  const lengthRaw = headerValue(req?.headers, "content-length").trim();
  if (lengthRaw !== "") {
    const length = Number(lengthRaw);
    if (!Number.isFinite(length) || length < 0 || length > maxBytes) {
      cancelBody(req);
      return { ok: false, text: "" };
    }
  }
  if (!req) return { ok: true, text: "" };
  const body = req.body;
  if (body && typeof body.getReader === "function") {
    return readWebStream({ getReader: body.getReader.bind(body) }, maxBytes);
  }
  if (typeof req.on === "function" && typeof req.read === "function") return readNodeStream(req, maxBytes);
  cancelBody(req);
  return { ok: true, text: "" };
}

/** Browsers post violation reports here. The line goes to the app log and the browser gets a 204. */
export async function handleCspReport(event: HeaderEvent): Promise<Response> {
  if (isRateLimited(clientIp(event))) {
    cancelBody(event.req);
    return noContent();
  }
  const type = mediaType(headerValue(event.req?.headers, "content-type"));
  if (!CSP_REPORT_TYPES.has(type)) {
    cancelBody(event.req);
    return noContent();
  }
  const body = await readBodyCapped(event.req, CSP_REPORT_MAX_BYTES);
  if (!body.ok || !body.text) return noContent();
  try {
    // eslint-disable-next-line no-control-regex
    console.warn("[csp-report]", JSON.stringify(body.text.replace(/[\u0000-\u001f\u007f]+/g, " ").slice(0, 4000)));
  } catch {
    // A bad report is not worth an error.
  }
  return noContent();
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
  if (method === "POST" && path === CSP_REPORT_PATH) return handleCspReport(event);
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
