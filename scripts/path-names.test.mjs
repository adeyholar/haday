import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { GRAMMAR_PATH, SCRIPTURE_PATH } = await jiti.import("/workspace/src/lib/path-names.ts");

function files(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

test("the doors are named for the method, and the old names stay out of view", () => {
  assert.equal(GRAMMAR_PATH.title, "Grammar Path");
  assert.equal(SCRIPTURE_PATH.title, "Scripture Path");
  assert.match(GRAMMAR_PATH.hebrew, /ד/);
  assert.match(SCRIPTURE_PATH.hebrew, /מ/);
  const doors = readFileSync("/workspace/src/routes/index.tsx", "utf8");
  assert.match(doors, /GRAMMAR_PATH\.title/);
  assert.match(doors, /SCRIPTURE_PATH\.title/);
  assert.match(doors, /href="\/bbh"/);
  assert.match(doors, /href="\/iibs"/);

  const brand = /\bBBH\b|\bIIBS\b/;
  const leaks = [];
  for (const path of files("/workspace/src")) {
    const raw = stripComments(readFileSync(path, "utf8"));
    const strings = raw.match(/`(?:\\[\s\S]|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g) ?? [];
    for (const item of strings) {
      if (!brand.test(item)) continue;
      if (path.endsWith("src/lib/ask-haday.ts") && item.includes("Do not call them")) continue;
      leaks.push(`${path}: ${item.slice(0, 80)}`);
    }
    const code = raw.replace(/`(?:\\[\s\S]|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/(?:\\.|[^/\n])+\/[gimsuy]*/g, " ");
    if (brand.test(code) && !path.endsWith("src/lib/ladder.ts")) {
      leaks.push(`${path}: identifier or text`);
    }
  }
  assert.deepEqual(leaks, []);
});
