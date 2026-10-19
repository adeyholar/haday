import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { injectGrokPwaHead, renderInstallPageHtml } from "./grok-pwa-shared.mjs";

function pngSize(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

test("a saved shortcut is HaDay, with the parchment he, and not the template icon", () => {
  const manifest = JSON.parse(readFileSync("/workspace/public/manifest.webmanifest", "utf8"));
  assert.equal(manifest.name, "HaDay HebRabbAi Mentor");
  assert.equal(manifest.short_name, "HaDay");
  assert.equal(manifest.background_color, "#F3EEE4");
  assert.equal(manifest.theme_color, "#F3EEE4");
  assert.deepEqual(
    manifest.icons.map((icon) => icon.sizes),
    ["192x192", "512x512", "512x512"],
  );
  assert.equal(manifest.icons[2].purpose, "maskable");
  assert.equal(pngSize(readFileSync("/workspace/public/icon-192.png")).w, 192);
  assert.equal(pngSize(readFileSync("/workspace/public/icon-512.png")).w, 512);
  assert.equal(pngSize(readFileSync("/workspace/public/apple-touch-icon.png")).w, 180);
  const ico = readFileSync("/workspace/public/favicon.ico");
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.ok(ico.readUInt16LE(4) >= 3);
  const svg = readFileSync("/workspace/public/favicon.svg", "utf8");
  assert.match(svg, /#F3EEE4/);
  assert.match(svg, /#603619/);
  assert.doesNotMatch(svg, /Times New Roman/);
  const head = readFileSync(new URL("../src/routes/__root.tsx", import.meta.url).pathname, "utf8");
  assert.match(head, /\/manifest\.webmanifest/);
  assert.match(head, /\/apple-touch-icon\.png/);
  assert.match(head, /content: "HaDay"/);
  assert.doesNotMatch(head, /__grok\/manifest/);
  const html = `<html><head>
    <link rel="manifest" href="/manifest.webmanifest">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
    <meta name="theme-color" content="#f3eee4">
    <meta name="apple-mobile-web-app-title" content="HaDay">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <title>HaDay</title>
  </head><body></body></html>`;
  const served = injectGrokPwaHead(html, { appName: "Grok App" });
  assert.equal(served.match(/rel="manifest"/g).length, 1);
  assert.equal(served.match(/rel="apple-touch-icon"/g).length, 1);
  assert.doesNotMatch(served, /Grok App/);
  assert.doesNotMatch(served, /__grok\/icon/);
  const install = renderInstallPageHtml("<title>Add {{APP_NAME}}</title>", {
    host: "hadayhebbraimentor.jcdisn.com",
    url: "/?install=1&platform=ios",
    name: "HaDay",
  });
  assert.match(install, /Add HaDay/);
  assert.doesNotMatch(install, /Grok App/);
  const installPage = readFileSync("/workspace/scripts/install-page.html", "utf8");
  assert.match(installPage, /href="\/apple-touch-icon\.png"/);
  assert.match(installPage, /href="\/manifest\.webmanifest"/);
  assert.doesNotMatch(installPage, /__grok\/icon-180/);
  const middleware = readFileSync("/workspace/server/middleware/grok-pwa.ts", "utf8");
  assert.match(middleware, /name: "HaDay HebRabbAi Mentor"/);
  assert.match(middleware, /icon: "\/apple-touch-icon\.png"/);
});
