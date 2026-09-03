import { alphabetVocab, bbhVocab, GAME_CHAPTER_TITLES, type VocabItem } from "@/lib/vocab";
import type { ReadingVerse } from "@/lib/reading";

const POS_KEY = "haday-listen-i";
const LOOP_KEY = "haday-listen-loop";

export type ListenLoop = "off" | "chapter" | "all";
export type ListenItem = VocabItem & { announce?: string };

export function listenPlaylist(): ListenItem[] {
  const items = [...alphabetVocab(), ...bbhVocab()];
  let prev = -1;
  return items.map((item) => {
    const announce = item.chapter !== prev ? `Chapter ${item.chapter}. ${GAME_CHAPTER_TITLES[item.chapter] ?? ""}` : undefined;
    prev = item.chapter;
    return { ...item, announce };
  });
}

export function loadListenIndex(): number {
  try {
    const n = Number(localStorage.getItem(POS_KEY) || 0);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function saveListenIndex(i: number) {
  try {
    localStorage.setItem(POS_KEY, String(Math.max(0, i)));
  } catch {
    /* ignore */
  }
}

export function firstIndexForChapter(list: ListenItem[], chapter: number): number {
  const i = list.findIndex((x) => x.chapter === chapter);
  return i < 0 ? 0 : i;
}

export function chapterRange(list: ListenItem[], chapter: number): { start: number; end: number } {
  let start = -1;
  let end = -1;
  for (let i = 0; i < list.length; i++) {
    if (list[i]?.chapter !== chapter) {
      if (start >= 0) break;
      continue;
    }
    if (start < 0) start = i;
    end = i;
  }
  if (start < 0) return { start: 0, end: Math.max(0, list.length - 1) };
  return { start, end };
}

export function nextListenIndex(list: ListenItem[], i: number, loop: ListenLoop): number | null {
  const cur = list[i];
  if (!cur) return loop === "all" && list.length ? 0 : null;
  if (loop === "chapter") {
    const { start, end } = chapterRange(list, cur.chapter);
    return i < end ? i + 1 : start;
  }
  if (i + 1 < list.length) return i + 1;
  if (loop === "all") return 0;
  return null;
}

export function prevListenIndex(list: ListenItem[], i: number, loop: ListenLoop): number {
  const cur = list[i];
  if (loop === "chapter" && cur) {
    const { start, end } = chapterRange(list, cur.chapter);
    return i > start ? i - 1 : end;
  }
  if (i > 0) return i - 1;
  if (loop === "all" && list.length) return list.length - 1;
  return Math.max(0, i);
}

export function loadListenLoop(): ListenLoop {
  try {
    const v = localStorage.getItem(LOOP_KEY);
    if (v === "off" || v === "chapter" || v === "all") return v;
  } catch {
    /* ignore */
  }
  return "chapter";
}

export function saveListenLoop(loop: ListenLoop) {
  try {
    localStorage.setItem(LOOP_KEY, loop);
  } catch {
    /* ignore */
  }
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";
}

export function isAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function ttsHebrew(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C3-\u05C7]/g, "")
    .trim();
}

export function glossSpoken(gloss: string): string {
  return gloss.replace(/;/g, ".").replace(/\s+/g, " ").trim();
}

export function primaryGloss(gloss: string): string {
  const full = glossSpoken(gloss);
  const first = full.split(/[,;]/)[0]?.trim() ?? full;
  return first || full;
}

/** Full English line after the Hebrew name: "Abraham", "Heaven, sky". */
export function spokenEnglish(gloss: string): string {
  const s = glossSpoken(gloss);
  if (!s) return s;
  if (s === s.toUpperCase()) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function restFor(rate: number, calmMs: number): number {
  return Math.round(calmMs / Math.max(rate, 0.5));
}

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  return window.speechSynthesis;
}

function voices(): SpeechSynthesisVoice[] {
  try {
    return synth()?.getVoices() ?? [];
  } catch {
    return [];
  }
}

export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  const have = voices();
  if (have.length) return Promise.resolve(have);
  return new Promise((resolve) => {
    const s = synth();
    if (!s) {
      resolve([]);
      return;
    }
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(t);
      window.clearInterval(poll);
      resolve(s.getVoices());
    };
    const t = window.setTimeout(done, 2500);
    const poll = window.setInterval(() => {
      if (s.getVoices().length) done();
    }, 80);
    const onChange = () => done();
    s.addEventListener("voiceschanged", onChange, { once: true });
  });
}

export function hasHebrewVoice(): boolean {
  return voices().some((v) => hebrewish(v));
}

function hebrewish(v: SpeechSynthesisVoice): boolean {
  const lang = (v.lang || "").toLowerCase();
  const name = v.name || "";
  return /^(he|iw)\b/i.test(lang) || /hebrew|carmit|hila|yael|עברית/i.test(name);
}

const FEMALE =
  /female|woman|samantha|victoria|karen|moira|tessa|fiona|zira|jenny|aria|carmit|heera|nicky|susan|salli|ivy|kendra|joanna|amy|emma|olivia|linda|hazel|allison|ava|zoe|kate|serena|veena|raveena|aditi|hila|yael|natasha|siri|google [a-z ]*female|microsoft (zira|jenny|aria)|samantha|karen|moira/i;
const MALE =
  /male|\bman\b|david|daniel|\balex\b|fred|tom|mark|\bguy\b|matthew|brian|ravi|aaron|nathan|ralph|bruce|gordon|oliver|james|thomas|jony|google [a-z ]*male|microsoft (david|mark|guy)/i;
const ROBOT = /compact|novelty|whisper|bells|boing|trinoids|zarvox|bad news|good news|pipe organ|cellos|albert|bahh|hysterical|junior|princess|bubbles/i;

function scoreVoice(v: SpeechSynthesisVoice, langPrefix: string): number {
  const lang = (v.lang || "").toLowerCase();
  const name = v.name || "";
  const want = langPrefix.toLowerCase();
  let n = 0;
  if (lang.startsWith(want)) n += 8;
  if (want.startsWith("he") && (lang.startsWith("he-il") || lang.startsWith("iw"))) n += 6;
  if (want.startsWith("en") && (lang.startsWith("en-us") || lang.startsWith("en-gb") || lang.startsWith("en-il") || lang.startsWith("en-au"))) n += 2;
  if (FEMALE.test(name)) n += 6;
  if (MALE.test(name)) n -= 8;
  if (ROBOT.test(name)) n -= 12;
  if (v.localService) n += 2;
  if (/google/i.test(name) && FEMALE.test(name)) n += 2;
  if (/carmit/i.test(name)) n += 5;
  return n;
}

function pickVoice(langPrefix: string): SpeechSynthesisVoice | undefined {
  const all = voices().filter((v) => {
    const lang = (v.lang || "").toLowerCase();
    const want = langPrefix.toLowerCase();
    if (lang.startsWith(want)) return true;
    if (want === "he" && hebrewish(v)) return true;
    return false;
  });
  const ranked = (all.length ? all : voices()).slice().sort((a, b) => scoreVoice(b, langPrefix) - scoreVoice(a, langPrefix));
  const best = ranked[0];
  if (!best) return undefined;
  if (MALE.test(best.name) || ROBOT.test(best.name)) {
    const female = ranked.find((v) => FEMALE.test(v.name) && !MALE.test(v.name) && !ROBOT.test(v.name));
    if (female) return female;
  }
  return best;
}

/** Modern Israeli Latin if the device has no Hebrew voice. Vav = v, qof = k. */
export function modernLatin(translit: string): string {
  return translit
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ʾʿ']/g, "")
    .replace(/w/gi, "v")
    .replace(/q/gi, "k")
    .replace(/[âāăáà]/g, "a")
    .replace(/[êēĕəéè]/g, "e")
    .replace(/[îīíì]/g, "i")
    .replace(/[ôōŏóò]/g, "o")
    .replace(/[ûūúù]/g, "u")
    .replace(/ḥ/g, "kh")
    .replace(/[ṣ]/g, "ts")
    .replace(/š/g, "sh")
    .replace(/ś/g, "s")
    .replace(/ṭ/g, "t")
    .replace(/[ḇ]/g, "v")
    .replace(/[ḵ]/g, "kh")
    .replace(/[ḡ]/g, "g")
    .replace(/[ḏ]/g, "d")
    .replace(/[ṯ]/g, "t")
    .replace(/p̄/g, "f")
    .replace(/[-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

let audioCtx: AudioContext | null = null;

function ensureAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

function dummySpeak(lang: string, voice?: SpeechSynthesisVoice) {
  const s = synth();
  if (!s) return;
  try {
    const u = new SpeechSynthesisUtterance("Listen.");
    u.lang = lang;
    u.volume = 1;
    u.rate = 1;
    u.pitch = 1.1;
    if (voice) {
      u.voice = voice;
      if (voice.lang) u.lang = voice.lang;
    }
    s.speak(u);
  } catch {
    /* ignore */
  }
}

/** Must run inside the Play click, before any await. Unlocks Safari on iPhone and iPad. */
export function unlockSpeech() {
  const s = synth();
  const ac = ensureAudioCtx();
  if (ac && ac.state === "suspended") void ac.resume();
  if (!s) return;
  try {
    if (s.paused) s.resume();
    // Do not cancel here. iPad Safari drops the whole session if we cancel
    // and then speak a silent dummy; later lines never become audible.
    dummySpeak("en-US", pickVoice("en"));
  } catch {
    /* ignore */
  }
}

export function stopSpeech() {
  const s = synth();
  if (!s) return;
  try {
    s.cancel();
  } catch {
    /* ignore */
  }
}

export function keepSpeechAlive() {
  const s = synth();
  if (!s) return;
  try {
    if (s.paused) s.resume();
  } catch {
    /* ignore */
  }
}

/** Returns true if the engine actually started speaking. */
export async function speakLine(
  text: string,
  lang: "he" | "en",
  rate: number,
  signal: { stop: boolean } = { stop: false },
): Promise<boolean> {
  const s = synth();
  const spoken = text.trim();
  if (!s || !spoken || signal.stop) return false;
  try {
    if (s.paused) s.resume();
  } catch {
    /* ignore */
  }

  const apple = isAppleMobile();
  const spokenRate = Math.min(1.12, Math.max(0.55, lang === "he" ? rate * 0.92 : rate));

  const makeU = () => {
    const u = new SpeechSynthesisUtterance(spoken);
    u.volume = 1;
    u.pitch = lang === "he" ? 1.08 : 1.12;
    u.rate = spokenRate;
    if (lang === "he") {
      const he = pickVoice("he") || pickVoice("iw");
      u.lang = he?.lang || "he-IL";
      if (he) u.voice = he;
    } else {
      const en = pickVoice("en");
      u.lang = en?.lang || "en-US";
      if (en) u.voice = en;
    }
    return u;
  };

  const started = await new Promise<boolean>((resolve) => {
    let settled = false;
    let heard = false;
    let u = makeU();
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(safety);
      window.clearTimeout(retry);
      window.clearInterval(poll);
      resolve(ok);
    };
    const arm = (utter: SpeechSynthesisUtterance) => {
      utter.onstart = () => {
        heard = true;
      };
      utter.onend = () => finish(true);
      utter.onerror = () => finish(heard);
    };
    arm(u);
    const safety = window.setTimeout(
      () => finish(heard),
      Math.min(24_000, 3_200 + spoken.length * (280 / spokenRate)),
    );
    const retry = window.setTimeout(() => {
      if (heard || signal.stop || settled) return;
      try {
        if (s.paused) s.resume();
      } catch {
        /* ignore */
      }
      u = makeU();
      arm(u);
      try {
        s.speak(u);
      } catch {
        finish(false);
      }
    }, apple ? 700 : 1400);
    const poll = window.setInterval(() => {
      if (signal.stop) {
        finish(heard);
        return;
      }
      try {
        if (s.paused) s.resume();
      } catch {
        finish(heard);
      }
    }, 80);
    try {
      s.speak(u);
    } catch {
      finish(false);
    }
  });
  return started;
}

export function pauseMs(ms: number, signal: { stop: boolean }): Promise<void> {
  return new Promise((resolve) => {
    if (signal.stop || ms <= 0) {
      resolve();
      return;
    }
    const t = window.setTimeout(() => {
      window.clearInterval(check);
      resolve();
    }, ms);
    const check = window.setInterval(() => {
      if (!signal.stop) return;
      window.clearTimeout(t);
      window.clearInterval(check);
      resolve();
    }, 80);
  });
}

async function speakHebrewWord(item: ListenItem, rate: number, signal: { stop: boolean }): Promise<void> {
  const he = ttsHebrew(item.hebrew);
  const latin = modernLatin(item.translit) || he;
  if (hasHebrewVoice()) {
    const ok = await speakLine(he, "he", rate, signal);
    if (!ok && !signal.stop) await speakLine(latin, "en", rate, signal);
  } else {
    await speakLine(latin, "en", rate, signal);
  }
}

export async function speakCard(item: ListenItem, rate: number, signal: { stop: boolean }): Promise<void> {
  if (signal.stop) return;
  const apple = isAppleMobile();
  if (item.announce) {
    await speakLine(item.announce, "en", Math.min(rate, 1), signal);
    if (signal.stop) return;
    if (!apple) await pauseMs(restFor(rate, 420), signal);
  }
  if (signal.stop) return;

  await speakHebrewWord(item, rate, signal);
  if (signal.stop) return;
  await pauseMs(restFor(rate, apple ? 220 : 380), signal);
  if (signal.stop) return;

  const en = spokenEnglish(item.gloss);
  if (en) await speakLine(en, "en", rate, signal);
  if (signal.stop) return;
  await pauseMs(restFor(rate, apple ? 280 : 720), signal);
}

export async function speakReadingVerse(verse: ReadingVerse, rate: number, signal: { stop: boolean }): Promise<void> {
  if (signal.stop) return;
  const apple = isAppleMobile();
  await speakLine(`Genesis ${verse.chapter}, verse ${verse.verse}.`, "en", Math.min(rate, 1), signal);
  if (signal.stop) return;
  const he = ttsHebrew(verse.he);
  if (hasHebrewVoice()) {
    const ok = await speakLine(he, "he", rate, signal);
    if (!ok && !signal.stop) await speakLine(he, "en", rate, signal);
  } else {
    await speakLine(he, "en", rate, signal);
  }
  if (signal.stop) return;
  await pauseMs(restFor(rate, apple ? 220 : 380), signal);
  if (signal.stop) return;
  await speakLine(verse.en, "en", rate, signal);
  if (signal.stop) return;
  await pauseMs(restFor(rate, apple ? 280 : 720), signal);
}

export function playListenChime() {
  const ac = ensureAudioCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  const g = ac.createGain();
  g.connect(ac.destination);
  g.gain.value = 0.18;
  const beep = (freq: number, start: number, dur: number) => {
    const o = ac.createOscillator();
    const eg = ac.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    eg.gain.setValueAtTime(0.0001, start);
    eg.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
    eg.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(eg);
    eg.connect(g);
    o.start(start);
    o.stop(start + dur + 0.02);
  };
  const t0 = ac.currentTime;
  beep(523, t0, 0.12);
  beep(784, t0 + 0.12, 0.16);
}
