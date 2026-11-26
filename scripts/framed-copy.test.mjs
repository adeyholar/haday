import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("grammar hubs frame the room without editing path-hub", () => {
  const hub = source("src/components/path-hub.tsx");
  assert.match(hub, /<h1 className="mt-1 font-display text-4xl font-bold text-ink">\{room\.title\}<\/h1>/);
  assert.doesNotMatch(hub, /<Panel/);
  for (const file of ["src/routes/hub/learn.tsx", "src/routes/hub/practice.tsx", "src/routes/hub/play.tsx", "src/routes/hub/listen.tsx"]) {
    const text = source(file);
    assert.match(text, /<Panel className="hub-frame">/);
    assert.match(text, /<PathHub /);
  }
  assert.match(source("src/styles.css"), /\.hub-frame > ul > li > a/);
  assert.match(source("src/styles.css"), /\.wlc-toolbar[\s\S]*background: var\(--color-card\)/);
  assert.doesNotMatch(source("src/styles.css"), /\.wlc-toolbar[\s\S]*color-mix\(in oklab, var\(--color-card\) 92%/);
});

test("scripture learn, account, drill prompts, and loading lines use Panel", () => {
  const learn = source("src/routes/iibs/learn.tsx");
  const learnHead = learn.slice(0, learn.indexOf("<VerbLabCard"));
  assert.match(learnHead, /<Panel>/);
  assert.match(learnHead, /<h1 className="mt-1 font-display text-4xl font-bold text-ink">Learn<\/h1>/);
  assert.match(source("src/routes/account.tsx"), /<Panel>\s*<h1 className="font-display text-3xl font-bold text-ink">Account<\/h1>/);
  assert.match(source("src/components/etch-play.tsx"), /<Panel className="mb-4">/);
  assert.match(source("src/components/room-link.tsx"), /<Panel className="mb-3 p-3">/);
  assert.match(source("src/routes/iibs/wlc/index.tsx"), /<Panel className="mb-2">/);
  assert.match(source("src/components/paradigms/school-paradigm.tsx"), /return \(\s*<Panel>/);
  for (const file of [
    "src/routes/iibs/index.tsx",
    "src/routes/iibs/study/index.tsx",
    "src/routes/iibs/vocab/index.tsx",
    "src/routes/iibs/$level.tsx",
    "src/routes/bbh.tsx",
  ]) {
    assert.match(source(file), /<Panel>/);
  }
});
