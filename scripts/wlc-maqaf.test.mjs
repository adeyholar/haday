import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") }, jsx: true });
const { wlcMaqafChains, joinsNext } = await jiti.import(join(root, "src/lib/wlc.ts"));
const React = await jiti.import("react");
// The component is compiled with the classic JSX runtime here.
globalThis.React = React;
const { renderToStaticMarkup } = await jiti.import("react-dom/server");
const { WlcReading } = await jiti.import(join(root, "src/components/wlc-desk.tsx"));

/** Each `<span class="ms-chain">…</span>` element, matched by balanced spans. */
function chainHtml(html) {
  const out = [];
  let at = html.indexOf('<span class="ms-chain"');
  while (at !== -1) {
    const tag = /<(\/?)span\b[^>]*>/g;
    tag.lastIndex = at;
    let depth = 0;
    let m;
    while ((m = tag.exec(html))) {
      depth += m[1] ? -1 : 1;
      if (depth === 0) break;
    }
    out.push(html.slice(at, tag.lastIndex));
    at = html.indexOf('<span class="ms-chain"', tag.lastIndex);
  }
  return out;
}

const gen1 = JSON.parse(gunzipSync(readFileSync(join(root, "data/wlc/Gen/1.json.gz"))).toString("utf8"));

test("a maqaf binds its word to the next one", () => {
  const words = [
    { surface: "וְחֹ֖שֶׁךְ", trailer: " " },
    { surface: "עַל", trailer: "־" },
    { surface: "פְּנֵ֣י", trailer: " " },
    { surface: "כָּל", trailer: "־" },
    { surface: "בְּנֵי", trailer: "־" },
    { surface: "אָדָם", trailer: "׃" },
  ];
  const chains = wlcMaqafChains(words).map((c) => c.map((w) => w.surface));
  assert.deepEqual(chains, [["וְחֹ֖שֶׁךְ"], ["עַל", "פְּנֵ֣י"], ["כָּל", "בְּנֵי", "אָדָם"]]);
  assert.equal(joinsNext({ surface: "עַל", trailer: "־" }), true);
  assert.equal(joinsNext({ surface: "x", trailer: " ׀ " }), false);
  assert.equal(joinsNext({ surface: "x", trailer: "׃" }), false);
});

test("Gen 1:2 renders עַל־פְּנֵ֣י as one chain with no whitespace between the words", () => {
  const html = renderToStaticMarkup(React.createElement(WlcReading, { chapter: gen1, tone: "light", size: "page" }));
  const chains = chainHtml(html);
  assert.ok(chains.length >= 2, "Gen 1 has maqaf chains");
  const textOf = (h) => h.replace(/<[^>]+>/g, "");
  // Use the dataset's own code points for Gen 1:2 עַל and פְּנֵ֣י.
  const v2 = gen1.verses.find((v) => v.ref.endsWith(".1.2"));
  const at = v2.words.findIndex((w) => w.trailer === "\u05be");
  const [al, pene] = [v2.words[at], v2.words[at + 1]];
  const chain = chains.find((c) => textOf(c).includes(al.surface + "\u05be" + pene.surface));
  assert.ok(chain, `${al.surface} and ${pene.surface} sit in one chain with no gap after the maqaf`);
  const text = textOf(chain);
  assert.ok(!/\u05be\s/.test(text), "no whitespace after the maqaf");
  assert.ok(v2.text.includes(al.surface + "\u05be" + pene.surface), "matches the dataset verse text");
  // Each word stays its own tappable button inside the chain.
  assert.equal((chain.match(/<button/g) || []).length, 2);
});

test("every maqaf word in the Tanakh sample joins with no gap", () => {
  for (const verse of gen1.verses) {
    for (const chain of wlcMaqafChains(verse.words)) {
      for (const word of chain.slice(0, -1)) assert.ok(joinsNext(word), `${verse.ref} ${word.surface}`);
    }
  }
});
