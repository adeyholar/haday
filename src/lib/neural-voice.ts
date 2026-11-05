import { resolveCorpusId } from "@/lib/voice-corpus";

const MANIFEST_URL = "/audio/neural/manifest.json?v=2026-11-04-kipper";

export type NeuralManifest = Record<string, { he?: string; en?: string }>;

let manifest: NeuralManifest | null = null;
let load: Promise<NeuralManifest> | null = null;

export async function loadNeuralManifest(): Promise<NeuralManifest> {
  if (manifest) return manifest;
  load ??= (async () => {
    try {
      const res = await Promise.race([
        fetch(MANIFEST_URL, { cache: "force-cache" }),
        new Promise<Response>((_, reject) => {
          window.setTimeout(() => reject(new Error("timeout")), 4000);
        }),
      ]);
      if (!res.ok) {
        manifest = {};
        return manifest;
      }
      const data = (await res.json()) as NeuralManifest;
      manifest = data && typeof data === "object" ? data : {};
      return manifest;
    } catch {
      manifest = {};
      return manifest;
    }
  })();
  return load;
}

export function neuralSrc(id: string, part: "he" | "en"): string | undefined {
  if (!manifest) return undefined;
  const key = resolveCorpusId(id);
  return manifest[key]?.[part] ?? manifest[id]?.[part];
}
