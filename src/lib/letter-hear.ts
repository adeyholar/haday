import { playNeuralVoice, speakLine, stopSpeech, unlockSpeech } from "@/lib/listen";
import { loadNeuralManifest } from "@/lib/neural-voice";

export function hushHear(signal: { stop: boolean }): { stop: boolean } {
  signal.stop = true;
  stopSpeech();
  return { stop: false };
}

export async function hearLetterName(id: string, name: string, signal: { stop: boolean }): Promise<void> {
  unlockSpeech();
  await loadNeuralManifest();
  if (signal.stop) return;
  const he = await playNeuralVoice(id, "he", 0.85, signal);
  if (he || signal.stop) return;
  const en = await playNeuralVoice(id, "en", 0.85, signal);
  if (en || signal.stop) return;
  await speakLine(name, "en", 0.8, signal);
}
