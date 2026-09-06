import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { clientIpFromHeaders, countryFromHeaders, countryLabel } = await jiti.import("/workspace/src/lib/visit-geo.ts");

test("Azure x-forwarded-for yields the public client IP", () => {
  const h = new Headers({
    "x-forwarded-for": "76.187.12.10, 10.0.0.4",
  });
  assert.equal(clientIpFromHeaders(h), "76.187.12.10");
});

test("private hops are skipped", () => {
  const h = new Headers({
    "x-forwarded-for": "192.168.1.4, 127.0.0.1, 8.8.8.8",
  });
  assert.equal(clientIpFromHeaders(h), "8.8.8.8");
});

test("Vercel country header still wins when present", () => {
  const h = new Headers({ "x-vercel-ip-country": "NG" });
  assert.equal(countryFromHeaders(h), "NG");
  assert.equal(countryFromHeaders(new Headers()), "");
});

test("country labels stay human", () => {
  assert.equal(countryLabel("US"), "United States");
  assert.equal(countryLabel(""), "");
});
