import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { brotliDecompressSync, gzipSync, gunzipSync } from "node:zlib";
import { createJiti } from "jiti";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const jiti = createJiti(import.meta.url, {
  interopDefault: true,
  alias: {
    "@": join(root, "src"),
    "virtual:grok-og-identity": fileURLToPath(new URL("./fixtures/grok-og-identity.mjs", import.meta.url)),
    "../../scripts/install-page.html?raw": fileURLToPath(new URL("./fixtures/install-page-raw.mjs", import.meta.url)),
  },
});

function asFn(mod) {
  return typeof mod === "function" ? mod : mod.default;
}

async function text(response) {
  const encoding = response.headers.get("content-encoding") ?? "";
  const bytes = Buffer.from(await response.arrayBuffer());
  if (encoding === "gzip") return gunzipSync(bytes).toString("utf8");
  if (encoding === "br") return brotliDecompressSync(bytes).toString("utf8");
  return bytes.toString("utf8");
}

test("a post has one share title through the real middleware order", async () => {
  const dir = join(root, "server/middleware");
  const files = readdirSync(dir).filter((name) => name.endsWith(".ts")).sort();
  assert.ok(files.indexOf("00.security-headers.ts") < files.indexOf("grok-pwa.ts"));
  const security = asFn(await jiti.import(join(dir, "00.security-headers.ts")));
  const grok = asFn(await jiti.import(join(dir, "grok-pwa.ts")));
  const { TEACHING_SECTIONS } = await jiti.import(join(root, "src/lib/teaching-text.ts"));
  const title = "Two paths into Biblical Hebrew";
  const summary = "A short summary of the two paths.";
  const padding = "Hebrew ".repeat(80);
  for (const section of Object.values(TEACHING_SECTIONS)) {
    const path = `${section.path}/two-paths-into-biblical-hebrew`;
    const html = `<!doctype html><html><head><title>${title}</title><meta property="og:title" content="${title}"><meta property="og:description" content="${summary}"><meta property="og:url" content="https://hebrewmentor.haday.app${path}"><meta property="og:type" content="article"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${summary}"></head><body>${padding}</body></html>`;
    const handler = () =>
      new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
    const event = (encoding) => ({
      url: new URL(`https://hebrewmentor.haday.app${path}`),
      req: {
        method: "GET",
        headers: new Headers({
          accept: "text/html",
          host: "hebrewmentor.haday.app",
          "accept-encoding": encoding,
        }),
      },
    });
    const load = (encoding) => security(event(encoding), () => grok(event(encoding), handler));
    const plain = await load("");
    const gzip = await load("gzip");
    const br = await load("br");
    assert.equal(gzip.headers.get("content-encoding"), "gzip");
    assert.equal(br.headers.get("content-encoding"), "br");
    const plainHtml = await text(plain);
    assert.equal(await text(gzip), plainHtml);
    assert.equal(await text(br), plainHtml);
    const cache = "public, s-maxage=300, stale-while-revalidate=300";
    assert.equal(plain.headers.get("cache-control"), cache);
    assert.equal(gzip.headers.get("cache-control"), cache);
    assert.equal(br.headers.get("cache-control"), cache);
    assert.equal(plainHtml.includes("no-store"), false);
    assert.equal(plainHtml.split('property="og:title"').length - 1, 1);
    assert.match(plainHtml, /property="og:title" content="Two paths into Biblical Hebrew"/);
  }
  for (const path of ["/sitemap.xml", "/llms.txt"]) {
    const event = {
      url: new URL(`https://hebrewmentor.haday.app${path}`),
      req: { method: "GET", headers: new Headers({ host: "hebrewmentor.haday.app" }) },
    };
    const result = await security(event, () => new Response("ok", { headers: { "content-type": "text/plain" } }));
    assert.equal(result.headers.get("cache-control"), "public, s-maxage=300, stale-while-revalidate=300");
  }
});

test("an encoded page is left unchanged", async () => {
  const grok = asFn(await jiti.import(join(root, "server/middleware/grok-pwa.ts")));
  const html = `<!doctype html><html><head><title>Plain</title></head><body>${"Hebrew ".repeat(40)}</body></html>`;
  const event = {
    url: new URL("https://hebrewmentor.haday.app/study"),
    req: { method: "GET", headers: new Headers({ accept: "text/html", host: "hebrewmentor.haday.app" }) },
  };
  const result = await grok(event, () =>
    new Response(gzipSync(Buffer.from(html)), {
      headers: { "content-type": "text/html; charset=utf-8", "content-encoding": "gzip" },
    }),
  );
  assert.equal(result.headers.get("content-encoding"), "gzip");
  assert.equal(result.headers.get("cache-control"), null);
  assert.equal(gunzipSync(Buffer.from(await result.arrayBuffer())).toString("utf8"), html);
});
