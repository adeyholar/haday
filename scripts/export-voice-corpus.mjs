import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { voiceCorpus, corpusScript } = await jiti.import(join(root, "src/lib/voice-corpus.ts"));

const items = voiceCorpus();
const outDir = join(root, "public/audio/neural");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "corpus.json"), JSON.stringify(items, null, 0));
writeFileSync(join(outDir, "corpus.txt"), corpusScript(items));
console.log(`corpus ${items.length} items → public/audio/neural/corpus.json`);
