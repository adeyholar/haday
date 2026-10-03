import { verseEndFrom, verseStartFrom, wordEndFrom, type ChapterAudio } from "@/lib/reading";

export type AfterBag = { stop: boolean; said: boolean; replay: boolean };

export function wordSlice(
  meta: ChapterAudio | undefined,
  verse: number,
  word: number,
  count: number,
  duration: number,
): { start: number; end: number } {
  const starts = meta?.words?.[Math.max(0, verse - 1)] ?? [];
  const v0 = verseStartFrom(meta, verse);
  const v1 = Math.max(v0 + 0.25, verseEndFrom(meta, verse, duration || meta?.duration || 0));
  const n = Math.max(1, count);
  if (starts.length >= n && starts[word] != null) {
    const start = starts[word] ?? v0;
    let end = wordEndFrom(meta, verse, word);
    if (!(end > start + 0.08)) end = start + Math.max(0.28, (v1 - v0) / n);
    return { start, end: Math.min(v1, Math.max(start + 0.2, end)) };
  }
  const span = (v1 - v0) / n;
  const start = v0 + word * span;
  return { start, end: start + span };
}

export function playPulse(ctx: AudioContext): Promise<void> {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 620;
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.18);
  return new Promise((resolve) => window.setTimeout(resolve, 220));
}

export function waitForSpeech(
  ctx: AudioContext,
  stream: MediaStream,
  bag: AfterBag,
  timeoutMs = 8000,
): Promise<"spoke" | "said" | "replay" | "stop" | "timeout"> {
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  const opened = performance.now();
  let floor = 0.02;
  let frames = 0;
  let heard = false;
  let quietAt = 0;

  return new Promise((resolve) => {
    const done = (value: "spoke" | "said" | "replay" | "stop" | "timeout") => {
      try {
        source.disconnect();
      } catch {
        /* already gone */
      }
      resolve(value);
    };
    const tick = () => {
      if (bag.stop) return done("stop");
      if (bag.replay) {
        bag.replay = false;
        return done("replay");
      }
      if (bag.said) {
        bag.said = false;
        return done("said");
      }
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = ((data[i] ?? 128) - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const now = performance.now();
      if (now - opened < 180) {
        window.setTimeout(tick, 40);
        return;
      }
      if (frames < 6) {
        floor = frames === 0 ? rms : floor * 0.7 + rms * 0.3;
        frames += 1;
        window.setTimeout(tick, 40);
        return;
      }
      const hot = rms > Math.max(0.035, floor * 2.4 + 0.012);
      if (hot) {
        heard = true;
        quietAt = 0;
      } else if (heard) {
        if (!quietAt) quietAt = now;
        if (now - quietAt >= 480) return done("spoke");
      } else if (now - opened > timeoutMs) {
        return done("timeout");
      }
      window.setTimeout(tick, 40);
    };
    window.setTimeout(tick, 40);
  });
}

export function waitUntilSaid(bag: AfterBag, timeoutMs: number): Promise<"said" | "replay" | "stop" | "timeout"> {
  const opened = performance.now();
  return new Promise((resolve) => {
    const id = window.setInterval(() => {
      if (bag.stop) {
        window.clearInterval(id);
        resolve("stop");
        return;
      }
      if (bag.replay) {
        bag.replay = false;
        window.clearInterval(id);
        resolve("replay");
        return;
      }
      if (bag.said) {
        bag.said = false;
        window.clearInterval(id);
        resolve("said");
        return;
      }
      if (performance.now() - opened > timeoutMs) {
        window.clearInterval(id);
        resolve("timeout");
      }
    }, 80);
  });
}
