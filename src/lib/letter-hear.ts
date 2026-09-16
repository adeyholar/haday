import { playVocabClip, speakLine, stopSpeech, unlockSpeech } from "@/lib/listen";
import { LETTER_SAY_EN, letterNameSrc } from "@/lib/letter-clips";

export { letterNameSrc } from "@/lib/letter-clips";

export function hushHear(signal: { stop: boolean }): { stop: boolean } {
  signal.stop = true;
  stopSpeech();
  return { stop: false };
}

export async function hearLetterName(id: string, name: string, signal: { stop: boolean }): Promise<void> {
  unlockSpeech();
  if (signal.stop) return;
  const src = letterNameSrc(id);
  if (src) {
    const ok = await playVocabClip(
      { src, start: 0, end: 0, he: name, kind: "lemma", source: "eliran" },
      0.95,
      signal,
    );
    if (ok || signal.stop) return;
  }
  if (signal.stop) return;
  await speakLine(LETTER_SAY_EN[id] ?? name, "en", 0.8, signal);
}
