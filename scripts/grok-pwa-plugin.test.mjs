import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  appNameFromHost,
  createHeadInjector,
  grokXCreatorHeadTags,
  injectGrokPwaHead,
  isDocumentPath,
  isInstallQuery,
  renderWebManifest,
  snapshotOgIdentity,
  stripInstallParams,
} from "./grok-pwa-shared.mjs";
import { renderInstallPage } from "./grok-pwa-plugin.mjs";

const TEMPLATE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const isolatedOg = mkdtempSync(join(tmpdir(), "grok-og-isolated-"));

function inject(html, ctx = {}) {
  return injectGrokPwaHead(html, { cwd: isolatedOg, ...ctx });
}

function headInjector(ctx = {}) {
  return createHeadInjector({ cwd: isolatedOg, ...ctx });
}

test("injects before </head>", () => {
  const out = inject("<html><head><title>x</title></head><body></body></html>");
  assert.match(out, /rel="manifest"/);
  assert.match(out, /apple-touch-icon/);
  assert.match(out, /grok-app-builder\/extensions\.js/);
  assert.ok(out.indexOf("manifest") < out.indexOf("</head>"));
});

test("injects the extensions script without a project id", () => {
  const out = inject("<html><head></head></html>", {
    appName: "Demo",
    projectId: "",
  });
  assert.match(out, /src="https:\/\/grok\.com\/grok-app-builder\/extensions\.js" defer/);
  assert.doesNotMatch(out, /grok-project-id/);
  assert.doesNotMatch(out, /data-project-id/);
  assert.doesNotMatch(out, /property="grok:app_id"/);
});

test("injects project id on the script and meta when provided", () => {
  const out = inject("<html><head></head></html>", {
    appName: "Demo",
    projectId: "proj-123",
  });
  assert.match(out, /name="grok-project-id" content="proj-123"/);
  assert.match(out, /data-project-id="proj-123"/);
  assert.match(out, /property="grok:app_id" content="proj-123"/);
});

test("does not duplicate grok:app_id", () => {
  const ctx = { appName: "Demo", projectId: "proj-123" };
  const once = inject("<html><head></head></html>", ctx);
  const twice = inject(once, ctx);
  assert.equal(once, twice);
  assert.equal(twice.split('property="grok:app_id"').length - 1, 1);
});

test("omits x:creator tags without both creator values", () => {
  assert.deepEqual(grokXCreatorHeadTags("", "42"), []);
  assert.deepEqual(grokXCreatorHeadTags("@alice", ""), []);
  const out = inject("<html><head></head></html>", {
    appName: "Demo",
    projectId: "",
    creator: "@alice",
    creatorId: "",
  });
  assert.doesNotMatch(out, /property="x:creator"/);
});

test("injects x:creator tags when both creator values are set", () => {
  const out = inject("<html><head></head></html>", {
    appName: "Demo",
    projectId: "",
    creator: "@alice",
    creatorId: "42",
  });
  assert.match(out, /property="x:creator" content="@alice"/);
  assert.match(out, /property="x:creator:id" content="42"/);
});

test("escapes x:creator values", () => {
  const tags = grokXCreatorHeadTags('"><script>', '1" onclick="alert(1)');
  assert.equal(
    tags[0],
    '<meta property="x:creator" content="&quot;&gt;&lt;script&gt;">',
  );
  assert.equal(
    tags[1],
    '<meta property="x:creator:id" content="1&quot; onclick=&quot;alert(1)">',
  );
});

test("does not duplicate x:creator tags", () => {
  const ctx = { appName: "Demo", projectId: "", creator: "@alice", creatorId: "42" };
  const once = inject("<html><head></head></html>", ctx);
  const twice = inject(once, ctx);
  assert.equal(once, twice);
  assert.equal(twice.split('property="x:creator" content=').length - 1, 1);
  assert.equal(twice.split('property="x:creator:id"').length - 1, 1);
});

test("platform chrome keeps share tags the page already set", () => {
  const html =
    '<html><head><title>Hello World</title><meta property="og:title" content="Old"><meta name="twitter:card" content="summary"></head></html>';
  const out = inject(html, { appName: "Wild Race" });
  assert.match(out, /name="twitter:card" content="summary"/);
  assert.match(out, /property="og:title" content="Old"/);
  assert.doesNotMatch(out, /content="summary_large_image"/);
  assert.equal(out.split('name="twitter:card"').length - 1, 1);
  assert.equal(out.split('property="og:title"').length - 1, 1);
});

test("a post page keeps one share title, the post's own", () => {
  const site = {
    title: "Learn to Read Biblical Hebrew | HaDay HebRabbAi Mentor",
    description: "Hear each word.",
    card: "custom",
    image: "/og.jpg",
  };
  const title = "Two paths into Biblical Hebrew";
  const summary = "A short summary of the two paths.";
  const page = (path) =>
    `<html><head><title>${title}</title><meta property="og:title" content="${title}"><meta property="og:description" content="${summary}"><meta property="og:url" content="https://hebrewmentor.haday.app${path}"><meta property="og:type" content="article"><meta property="og:image" content="https://hebrewmentor.haday.app/og.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${summary}"></head><body></body></html>`;
  const out = inject(page("/learning-hebrabbai/two-paths-into-biblical-hebrew"), {
    site,
    host: "hebrewmentor.haday.app",
    cwd: isolatedOg,
  });
  assert.equal(out.split('property="og:title"').length - 1, 1);
  assert.match(out, /property="og:title" content="Two paths into Biblical Hebrew"/);
  assert.equal(out.split('property="og:description"').length - 1, 1);
  assert.match(out, /property="og:description" content="A short summary of the two paths."/);
  assert.match(out, /property="og:url" content="https:\/\/hebrewmentor\.haday\.app\/learning-hebrabbai\/two-paths-into-biblical-hebrew"/);
  assert.match(out, /property="og:type" content="article"/);
  assert.match(out, /name="twitter:title" content="Two paths into Biblical Hebrew"/);
  assert.match(out, /name="twitter:description" content="A short summary of the two paths."/);
  assert.doesNotMatch(out, /property="og:title" content="Learn to Read Biblical Hebrew/);
});

test("a page with no share tags still gets the site defaults", () => {
  const out = inject("<html><head><title>Home</title></head></html>", {
    cwd: isolatedOg,
    site: {
      title: "Learn to Read Biblical Hebrew | HaDay HebRabbAi Mentor",
      description: "Hear each word.",
    },
  });
  assert.match(out, /property="og:title" content="Learn to Read Biblical Hebrew \| HaDay HebRabbAi Mentor"/);
  assert.match(out, /property="og:description" content="Hear each word."/);
  assert.match(out, /name="twitter:card" content="summary_large_image"/);
});

test("does not duplicate twitter:card or og:title", () => {
  const once = inject("<html><head><title>Hello World</title></head></html>");
  const twice = inject(once);
  assert.equal(once, twice);
  assert.equal(twice.split('name="twitter:card"').length - 1, 1);
  assert.equal(twice.split('property="og:title"').length - 1, 1);
});

test("baked identity does not need a workspace filesystem", () => {
  const empty = mkdtempSync(join(tmpdir(), "grok-og-empty-"));
  const out = inject("<html><head></head></html>", {
    host: "wild-race.grok.me",
    cwd: empty,
    site: { title: "Pixel Nova", type: "x:game", card: "custom" },
  });
  assert.match(out, /property="og:title" content="Pixel Nova"/);
  assert.match(out, /property="og:type" content="website"/);
  assert.doesNotMatch(out, /x:game/);
  assert.match(out, /property="og:image" content="https:\/\/wild-race\.grok\.me\/og\.jpg"/);
  assert.doesNotMatch(out, /og\.grok\.me/);
});

test("a public og.jpg on disk becomes the share card", () => {
  const root = mkdtempSync(join(tmpdir(), "grok-og-card-"));
  mkdirSync(join(root, "public"));
  writeFileSync(join(root, "public/og.jpg"), "x");
  const out = inject("<html><head></head></html>", {
    host: "wild-race.grok.me",
    cwd: root,
    site: {},
  });
  assert.match(out, /wild-race\.grok\.me\/og\.jpg/);
  assert.doesNotMatch(out, /og\.grok\.me\/v1\/card\.png/);
});

test("snapshotOgIdentity stamps card=custom from a public card file", () => {
  const root = mkdtempSync(join(tmpdir(), "grok-og-snap-"));
  mkdirSync(join(root, "public"));
  writeFileSync(join(root, "public/og.jpg"), "x");
  const { site } = snapshotOgIdentity(root);
  assert.equal(site.card, "custom");
  assert.equal(site.image, "/og.jpg");
  assert.equal(site.banner, undefined);
});

test("snapshotOgIdentity stamps banner from public/x-banner.jpg", () => {
  const root = mkdtempSync(join(tmpdir(), "grok-og-banner-"));
  mkdirSync(join(root, "public"));
  writeFileSync(join(root, "public/x-banner.jpg"), "x");
  const { site } = snapshotOgIdentity(root);
  assert.equal(site.banner, "/x-banner.jpg");
});

test("a game card is not a share tag", () => {
  const out = inject("<html><head><meta property=\"x:game:image\" content=\"old\"></head></html>", {
    host: "wild-race.grok.me",
    site: { title: "Wild Race", type: "x:game", card: "custom", banner: "/x-banner.jpg" },
  });
  assert.match(out, /property="og:type" content="website"/);
  assert.doesNotMatch(out, /property="og:type" content="x:game"/);
  assert.doesNotMatch(out, /property="x:game:image" content="https:/);
  assert.match(out, /property="og:image" content="https:\/\/wild-race\.grok\.me\/og\.jpg"/);
  assert.doesNotMatch(out, /og\.grok\.me/);
});

test("published grok.me slug is not the share title", () => {
  const out = inject("<html><head></head></html>", {
    host: "wild-race.grok.me",
    site: { title: "Grok App" },
  });
  assert.match(out, /property="og:title" content="Grok App"/);
});

test("published grok.me slug is not the share title", () => {
  const out = inject("<html><head></head></html>", {
    host: "wild-race.grok.me",
  });
  assert.match(out, /property="og:title" content="Learn to Read Biblical Hebrew \| HaDay HebRabbAi Mentor"/);
  assert.doesNotMatch(out, /property="og:title" content="Wild Race"/);
});

test("emits og:image for a public host and prefers a custom card", () => {
  const placeholder = inject("<html><head></head></html>", {
    appName: "Wild Race",
    host: "wild-race.grok.me",
    site: { title: "Wild Race" },
  });
  assert.match(placeholder, /property="og:image" content="https:\/\/wild-race\.grok\.me\/og\.jpg"/);
  assert.match(placeholder, /property="og:type" content="website"/);
  assert.doesNotMatch(placeholder, /og\.grok\.me/);
  assert.doesNotMatch(placeholder, /x:game/);

  const custom = inject("<html><head></head></html>", {
    appName: "Wild Race",
    host: "wild-race.grok.me",
    site: { title: "Wild Race", card: "custom", type: "x:game" },
  });
  assert.match(custom, /property="og:image" content="https:\/\/wild-race\.grok\.me\/og\.jpg"/);
  assert.match(custom, /property="og:type" content="website"/);
  assert.doesNotMatch(custom, /x:game/);
});

test("a missing share image is the site card, not a generated placeholder", () => {
  const themed = inject("<html><head></head></html>", {
    host: "wild-race.grok.me",
    site: { title: "Wild Race", color: "#FF4D2E" },
  });
  assert.match(themed, /property="og:image" content="https:\/\/wild-race\.grok\.me\/og\.jpg"/);
  assert.match(themed, /property="og:type" content="website"/);
  assert.doesNotMatch(themed, /og\.grok\.me/);
  assert.doesNotMatch(themed, /color=/);
  assert.doesNotMatch(themed, /x:game/);
});

test("a document title is not the share title, and a site title is escaped once", () => {
  const fromDoc = inject("<html><head><title>Cats &amp; Dogs</title></head></html>");
  assert.match(fromDoc, /property="og:title" content="Learn to Read Biblical Hebrew \| HaDay HebRabbAi Mentor"/);
  assert.doesNotMatch(fromDoc, /property="og:title" content="Cats/);
  const fromSite = inject("<html><head></head></html>", { site: { title: "Cats & Dogs" } });
  assert.match(fromSite, /property="og:title" content="Cats &amp; Dogs"/);
  assert.doesNotMatch(fromSite, /Cats &amp;amp; Dogs/);
});

test("site.json title wins over the host slug", () => {
  const out = inject("<html><head></head></html>", {
    host: "wild-race.grok.me",
    site: { title: "Pixel Nova" },
  });
  assert.match(out, /property="og:title" content="Pixel Nova"/);
});

test("injects into documents with no head element", () => {
  const out = inject("<html><body>hi</body></html>", { appName: "Solo" });
  assert.match(out, /<head>/);
  assert.match(out, /property="og:title" content="Learn to Read Biblical Hebrew \| HaDay HebRabbAi Mentor"/);
  assert.match(out, /<\/head>/);
});

test("streaming injector matches </HEAD> case-insensitively", () => {
  const injector = headInjector({ appName: "Wild Race" });
  const chunks = [
    ...injector.push("<html><HEAD><title>x</title></HE"),
    ...injector.push("AD><body>hello</body></html>"),
  ];
  const out = Buffer.concat(chunks).toString("utf8");
  assert.match(out, /property="og:title" content="Learn to Read Biblical Hebrew \| HaDay HebRabbAi Mentor"/);
  assert.match(out, /<body>hello<\/body>/);
});

test("does not duplicate the extensions script", () => {
  const ctx = { appName: "Demo", projectId: "proj-123" };
  const once = inject("<html><head></head></html>", ctx);
  const twice = inject(once, ctx);
  assert.equal(once, twice);
  assert.equal(twice.split("extensions.js").length - 1, 1);
});

test("is idempotent", () => {
  const once = inject("<html><head></head></html>");
  const twice = inject(once);
  assert.equal(once, twice);
});

test("uses the app name in the injected title tag", () => {
  const out = inject("<html><head></head></html>", { appName: "Wild Race" });
  assert.match(out, /apple-mobile-web-app-title" content="Wild Race"/);
});

test("streaming injector handles </head> split across chunks", () => {
  const injector = headInjector({ appName: "Wild Race" });
  const chunks = [
    ...injector.push("<html><head><title>x</title></he"),
    ...injector.push("ad><body>hello</body></html>"),
  ];
  const out = Buffer.concat(chunks).toString("utf8");
  assert.match(out, /rel="manifest"/);
  assert.ok(out.indexOf("manifest") < out.indexOf("</head>"));
  assert.match(out, /<body>hello<\/body>/);
  assert.deepEqual(injector.flush(), []);
});

test("streaming injector passes post-head chunks through untouched", () => {
  const injector = headInjector();
  injector.push("<html><head></head>");
  const [tail] = injector.push("<body>tail</body>");
  assert.equal(tail.toString("utf8"), "<body>tail</body>");
});

test("streaming injector falls back when no </head> is seen", () => {
  const injector = headInjector();
  assert.deepEqual(injector.push("<html><head>"), []);
  const out = Buffer.concat(injector.flush()).toString("utf8");
  assert.match(out, /rel="manifest"/);
});

test("detects install query", () => {
  assert.equal(isInstallQuery("/?install=1&platform=ios"), true);
  assert.equal(isInstallQuery("/app?foo=1&install=true&platform=ios"), true);
  assert.equal(isInstallQuery("/?install=1"), false);
  assert.equal(isInstallQuery("/?install=1&platform=android"), false);
  assert.equal(isInstallQuery("/?install=0&platform=ios"), false);
  assert.equal(isInstallQuery("/"), false);
});

test("filters non-document paths", () => {
  assert.equal(isDocumentPath("/"), true);
  assert.equal(isDocumentPath("/app"), true);
  assert.equal(isDocumentPath("/api/thing"), false);
  assert.equal(isDocumentPath("/__grok/install/styles.css"), false);
  assert.equal(isDocumentPath("/logo.png"), false);
});

test("strips install params from the app link", () => {
  assert.equal(stripInstallParams("/?install=1&platform=ios"), "/");
  assert.equal(stripInstallParams("/app?install=1&platform=ios&tab=2"), "/app?tab=2");
});

test("names the install page from host slug", () => {
  assert.equal(appNameFromHost("localhost:8080"), "Learn to Read Biblical Hebrew | HaDay HebRabbAi Mentor");
  assert.equal(appNameFromHost("172.17.154.217:8080"), "Learn to Read Biblical Hebrew | HaDay HebRabbAi Mentor");
  assert.equal(appNameFromHost("wild-race.grok.me"), "Wild Race");
});

test("rejects hosts that are not plain slugs", () => {
  assert.equal(appNameFromHost("<script>alert(1)</script>"), "Learn to Read Biblical Hebrew | HaDay HebRabbAi Mentor");
  assert.equal(appNameFromHost('"><img src=x onerror=1>.grok.me'), "Learn to Read Biblical Hebrew | HaDay HebRabbAi Mentor");
});

test("renders install page markup", () => {
  const html = renderInstallPage("wild-race.grok.me", "/?install=1&platform=ios");
  assert.match(html, /Add Wild Race to your/);
  assert.match(html, /\/__grok\/install\/styles\.css/);
  assert.match(html, /href="\/"/);
  assert.equal(html.includes("{{APP_NAME}}"), false);
  assert.equal(html.includes("{{APP_URL}}"), false);
});

test("escapes host-derived values in the install page", () => {
  const html = renderInstallPage("<script>alert(1)</script>", "/?install=1&platform=ios");
  assert.equal(html.includes("<script>alert(1)</script>"), false);
});

test("renders the manifest with the per-app name", () => {
  const manifest = JSON.parse(renderWebManifest("wild-race.grok.me"));
  assert.equal(manifest.name, "Wild Race");
  assert.equal(manifest.short_name, "Wild Race");
  assert.equal(manifest.icons[0].src, "/__grok/icon-180.png");
});

// Tripwires: the deployed-app path only works if Nitro scans server/ — an
// accidental edit that drops serverDir or the middleware file would otherwise
// fail silently (published apps would just render the app for ?install=1).
test("vite config keeps the nitro serverDir wiring", () => {
  const viteConfig = readFileSync(join(TEMPLATE_ROOT, "vite.config.ts"), "utf8");
  assert.match(viteConfig, /serverDir:\s*"\.\/server"/);
  assert.match(viteConfig, /grokPwaPlugin\(\)/);
});

test("nitro middleware and its bundled assets exist", () => {
  const middleware = readFileSync(join(TEMPLATE_ROOT, "server/middleware/grok-pwa.ts"), "utf8");
  assert.match(middleware, /install-page\.html\?raw/);
  assert.match(middleware, /virtual:grok-og-identity/);
  readFileSync(join(TEMPLATE_ROOT, "scripts/install-page.html"));
  readFileSync(join(TEMPLATE_ROOT, "public/__grok/icon-180.png"));
  readFileSync(join(TEMPLATE_ROOT, "public/__grok/install/styles.css"));
});

test("vite plugin bakes og identity as a virtual module", () => {
  const plugin = readFileSync(join(TEMPLATE_ROOT, "scripts/grok-pwa-plugin.mjs"), "utf8");
  assert.match(plugin, /virtual:grok-og-identity/);
  assert.match(plugin, /snapshotOgIdentity/);
});

