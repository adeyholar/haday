import { isHighWeak, isWeak, type CardState } from "@/lib/srs";
import type { VocabItem } from "@/lib/vocab";

export function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export function blobToB64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read recording."));
    reader.onload = () => {
      const s = String(reader.result ?? "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    reader.readAsDataURL(blob);
  });
}

export function firstNameOf(displayName: string | null | undefined): string {
  const raw = (displayName ?? "").trim();
  if (!raw) return "";
  return raw.split(/\s+/)[0] ?? "";
}

/** Recorded weak marks first, then other recorded lemmas, then the rest of the list. */
export function petQueue(
  items: VocabItem[],
  cards: Record<string, CardState | undefined>,
  recordedHe: Set<string>,
  n = 12,
): VocabItem[] {
  const high: VocabItem[] = [];
  const weak: VocabItem[] = [];
  const rec: VocabItem[] = [];
  const otherWeak: VocabItem[] = [];
  for (const item of items) {
    const card = cards[item.id];
    const has = recordedHe.has(item.id);
    if (has && isHighWeak(card)) high.push(item);
    else if (has && isWeak(card)) weak.push(item);
    else if (has) rec.push(item);
    else if (isHighWeak(card) || isWeak(card)) otherWeak.push(item);
  }
  const out: VocabItem[] = [];
  const seen = new Set<string>();
  function add(list: VocabItem[]) {
    for (const item of list) {
      if (out.length >= n) return;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  add(high);
  add(weak);
  add(rec);
  add(otherWeak);
  add(items);
  return out;
}
