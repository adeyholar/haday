import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("hub titles and the public return sit in the card panel", () => {
  const hub = read("src/components/path-hub.tsx");
  assert.match(hub, /<Panel className="mb-4">\s*<p className="text-xs font-semibold uppercase tracking-\[0\.16em\] text-primary">Grammar Path<\/p>\s*<h1/);
  assert.match(hub, /<Panel className="mt-4 text-sm">\s*<Link to="\/guide"/);
  const learn = read("src/routes/iibs/learn.tsx");
  assert.match(learn, /<Panel className="mb-4">\s*<p className="text-xs font-semibold uppercase tracking-\[0\.16em\] text-primary">Scripture Path<\/p>\s*<h1/);
  for (const file of ["src/routes/legal.tsx", "src/routes/credits.tsx"]) {
    const page = read(file);
    assert.match(page, /<Panel className="mb-6 flex flex-col items-center text-center">[\s\S]*<BrandLockup size="hero" linked \/>[\s\S]*<PublicReturn className="mb-0" \/>/);
    assert.equal(page.includes("<p className=\"mt-5 text-center text-sm\">"), false);
  }
  assert.match(read("src/components/public-footer.tsx"), /<Panel>\s*<nav aria-label="Site"/);
  assert.equal(read("src/components/public-footer.tsx").includes("bg-card/90"), false);
  assert.match(read("src/components/room-link.tsx"), /bg-card px-4 font-semibold text-primary shadow-\[var\(--shadow-border\)\]/);
  assert.match(read("src/styles.css"), /\.wlc-toolbar \{[\s\S]*background: var\(--color-card\);/);
  assert.equal(read("src/styles.css").includes("color-mix(in oklab, var(--color-card) 92%, transparent)"), false);
});

test("quiz and drill feedback copy uses the card panel", () => {
  assert.match(read("src/components/grade-banner.tsx"), /<Panel className=\{cn\("text-center", className\)\}>/);
  assert.match(read("src/components/marked-answer.tsx"), /<Panel className="mt-4 grid gap-3 text-center">/);
  assert.match(read("src/routes/quiz.tsx"), /<Panel>\s*<QuizSetBar set=\{set\} \/>\s*<p className="mt-6 text-muted">No words in this set\.<\/p>/);
  assert.match(read("src/components/paradigms/school-paradigm.tsx"), /return \(\s*<Panel>/);
});
