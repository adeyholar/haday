import { alphabetVocab, bbhVocab, GAME_CHAPTER_TITLES, type VocabItem } from "@/lib/vocab";
import { term2Vocab } from "@/lib/vocab-s2";
import type { ReadingVerse } from "@/lib/reading";
import { vocabClip, type VocabClip } from "@/lib/vocab-clips";
import { getVoiceClip, listVoiceIndex, type VoicePart } from "@/lib/voice";
import { spokenHebrew, clipLookupIds, hebrewForTts, chapterWordEn } from "@/lib/voice-corpus";
import { loadNeuralManifest, neuralSrc } from "@/lib/neural-voice";
import { holdRoadMusic } from "@/lib/road-music";

const POS_KEY = "haday-listen-i";
const LOOP_KEY = "haday-listen-loop";
const MIX_KEY = "haday-listen-mix-ch";

export type ListenLoop = "off" | "chapter" | "all" | "mix";
export type ListenItem = VocabItem & {
  announce?: string;
  /** BBH clip id for the Hebrew, when this card is not that lemma. */
  heVoiceId?: string;
  /** A second Hebrew form, such as a plural, spoken after the lemma. */
  alsoHebrew?: string;
  /** Speak the gloss itself. Do not play another course's English clip. */
  plainEnglish?: boolean;
};

export function listenPlaylist(): ListenItem[] {
  const items = [...alphabetVocab(), ...bbhVocab()];
  let prev = -1;
  return items.map((item) => {
    const announce = item.chapter !== prev ? `Chapter ${chapterWordEn(item.chapter)}. ${GAME_CHAPTER_TITLES[item.chapter] ?? ""}` : undefined;
    prev = item.chapter;
    return { ...item, announce };
  });
}

/** Semester 2 lemmas only. A separate place from the first-term listen list. */
export function term2ListenPlaylist(): ListenItem[] {
  const items = term2Vocab();
  let prev = -1;
  return items.map((item) => {
    const announce = item.chapter !== prev ? `Chapter ${chapterWordEn(item.chapter)}.` : undefined;
    prev = item.chapter;
    return { ...item, announce, plainEnglish: true };
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

export function nextListenIndex(
  list: ListenItem[],
  i: number,
  loop: ListenLoop,
  mixChapters: number[] = [],
): number | null {
  const cur = list[i];
  if (loop === "mix") {
    const idx = mixIndexList(list, mixChapters, cur?.chapter);
    if (!idx.length) return nextListenIndex(list, i, "chapter");
    const pos = idx.indexOf(i);
    if (pos < 0) return idx.find((n) => n > i) ?? idx[0] ?? null;
    return idx[(pos + 1) % idx.length];
  }
  if (!cur) return loop === "all" && list.length ? 0 : null;
  if (loop === "chapter") {
    const { start, end } = chapterRange(list, cur.chapter);
    return i < end ? i + 1 : start;
  }
  if (i + 1 < list.length) return i + 1;
  if (loop === "all") return 0;
  return null;
}

export function prevListenIndex(
  list: ListenItem[],
  i: number,
  loop: ListenLoop,
  mixChapters: number[] = [],
): number {
  const cur = list[i];
  if (loop === "mix") {
    const idx = mixIndexList(list, mixChapters, cur?.chapter);
    if (!idx.length) return prevListenIndex(list, i, "chapter");
    const pos = idx.indexOf(i);
    if (pos < 0) {
      const before = [...idx].reverse().find((n) => n < i);
      return before ?? idx[idx.length - 1] ?? Math.max(0, i);
    }
    return idx[(pos - 1 + idx.length) % idx.length];
  }
  if (loop === "chapter" && cur) {
    const { start, end } = chapterRange(list, cur.chapter);
    return i > start ? i - 1 : end;
  }
  if (i > 0) return i - 1;
  if (loop === "all" && list.length) return list.length - 1;
  return Math.max(0, i);
}

export function mixIndexList(list: ListenItem[], chapters: number[], fallbackChapter?: number): number[] {
  const set = new Set(chapters.filter((n) => n >= 1 && n <= 19));
  if (!set.size && fallbackChapter) set.add(fallbackChapter);
  const idx: number[] = [];
  for (let n = 0; n < list.length; n++) {
    if (set.has(list[n].chapter)) idx.push(n);
  }
  return idx;
}

export function mixPosition(
  list: ListenItem[],
  i: number,
  chapters: number[],
): { pos: number; len: number } {
  const idx = mixIndexList(list, chapters, list[i]?.chapter);
  if (!idx.length) return { pos: 1, len: 1 };
  const pos = idx.indexOf(i);
  return { pos: (pos < 0 ? 0 : pos) + 1, len: idx.length };
}

export function loadListenLoop(): ListenLoop {
  try {
    const v = localStorage.getItem(LOOP_KEY);
    if (v === "off" || v === "chapter" || v === "all" || v === "mix") return v;
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

export function loadListenMix(): number[] {
  try {
    const raw = localStorage.getItem(MIX_KEY) ?? "";
    const seen = new Set<number>();
    const out: number[] = [];
    for (const part of raw.split(/[,+\s]+/)) {
      const n = Number(part);
      if (!Number.isInteger(n) || n < 1 || n > 19 || seen.has(n)) continue;
      seen.add(n);
      out.push(n);
    }
    return out.sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export function saveListenMix(chapters: number[]) {
  try {
    const clean = [...new Set(chapters.filter((n) => n >= 1 && n <= 19))].sort((a, b) => a - b);
    localStorage.setItem(MIX_KEY, clean.join(","));
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
  return hebrewForTts(s);
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
    // Must speak inside the Play click so Safari keeps the session.
    // Do not say "Listen." — chapter announce and the lemma come next.
    // A space at full volume is inaudible but still counts as a real speak
    // (volume 0 is skipped and later lines never play on iPad).
    const u = new SpeechSynthesisUtterance("\u00a0");
    u.lang = lang;
    u.volume = 1;
    u.rate = 2;
    u.pitch = 1;
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
  unlockClipAudio();
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
  stopClip();
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

let clipEl: HTMLAudioElement | null = null;
let clipPoll = 0;
let clipGen = 0;
let ownPauseAt = 0;
let haltSuppressedUntil = 0;
let liveUtterance: SpeechSynthesisUtterance | null = null;
/** True from our own pause until the next clip's play() has started. Not a timer. */
let roadGap = false;
/** The phone can report that pause after the next word is already audible. */
let roadGapEchoUntil = 0;
let roadDriveWanted = false;

function markOwnPause() {
  ownPauseAt = Date.now();
  roadGap = true;
}

function endRoadGap() {
  roadGap = false;
  roadGapEchoUntil = Date.now() + 800;
}

/** The drive is on. Screen lock and the truck stereo must not end it. */
export function setRoadDriveWanted(wanted: boolean) {
  roadDriveWanted = wanted;
}

/**
 * Lock-screen Pause is the driver only while a word is actually playing.
 * The quiet between Hebrew and English, and a pause the phone already took, are not Stop.
 */
export function roadPauseIsUser(): boolean {
  if (roadGap || Date.now() < roadGapEchoUntil) return false;
  const el = clipEl;
  if (!el || el.paused || el.ended) return false;
  return true;
}

/** iOS keeps a podcast going when the screen dims. A drive should too. */
export function preferRoadPlayback() {
  const nav = navigator as Navigator & { audioSession?: { type?: string } };
  try {
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* older phones have no audio session */
  }
}

/** Ignore a lock-screen pause that we caused by stopping a clip or a gloss. */
export function suppressRoadHalt(ms: number) {
  haltSuppressedUntil = Math.max(haltSuppressedUntil, Date.now() + ms);
}

/** True when we just paused a word clip ourselves. The lock screen must not treat that as Stop. */
export function recentOwnPause(): boolean {
  return Date.now() - ownPauseAt < 1200 || Date.now() < haltSuppressedUntil || roadGap;
}

function getClipEl(): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;
  if (!clipEl) {
    clipEl = new Audio();
    clipEl.preload = "auto";
    clipEl.setAttribute("playsinline", "true");
    clipEl.addEventListener("pause", () => {
      // A lock, a stereo, or a ducked session pauses the word. Keep the drive.
      // A clip that reached its end must not be started over.
      if (!roadDriveWanted || roadGap || !clipEl || clipEl.ended) return;
      if (Number.isFinite(clipEl.duration) && clipEl.duration > 0.2 && clipEl.currentTime >= clipEl.duration - 0.08) return;
      void clipEl.play().catch(() => {});
    });
  }
  return clipEl;
}

/** Drop the Hebrew file so the phone can speak. The next clip sets a new source. */
function releaseClipForSpeech() {
  markOwnPause();
  const el = clipEl;
  if (!el) return;
  try {
    el.pause();
  } catch {
    /* ignore */
  }
  try {
    el.removeAttribute("src");
    el.load();
  } catch {
    /* ignore */
  }
}
function stopClip() {
  clipGen += 1;
  markOwnPause();
  if (clipPoll) {
    window.clearInterval(clipPoll);
    clipPoll = 0;
  }
  if (!clipEl) return;
  try {
    clipEl.pause();
  } catch {
    /* ignore */
  }
}

function unlockClipAudio() {
  const el = getClipEl();
  if (!el) return;
  const mine = clipGen;
  el.muted = true;
  void el
    .play()
    .then(() => {
      if (mine !== clipGen) return;
      markOwnPause();
      el.pause();
      el.muted = false;
    })
    .catch(() => {
      if (mine === clipGen) el.muted = false;
    });
}

function clipSrcMatches(el: HTMLAudioElement, src: string): boolean {
  return Boolean(el.getAttribute("src") === src || (el.src && (el.src.endsWith(src) || el.src.includes(src))));
}

function waitClipMeta(el: HTMLAudioElement): Promise<boolean> {
  if (el.readyState >= 1) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      el.removeEventListener("loadedmetadata", onOk);
      el.removeEventListener("error", onErr);
      window.clearTimeout(t);
      resolve(ok);
    };
    const onOk = () => done(true);
    const onErr = () => done(false);
    el.addEventListener("loadedmetadata", onOk);
    el.addEventListener("error", onErr);
    const t = window.setTimeout(() => done(el.readyState >= 1), 5000);
  });
}

export async function playVocabClip(clip: VocabClip, rate: number, signal: { stop: boolean }): Promise<boolean> {
  const el = getClipEl();
  if (!el || signal.stop) return false;
  stopClip();
  const mine = clipGen;
  try {
    if (!clipSrcMatches(el, clip.src)) {
      el.src = clip.src;
      el.load();
    }
    const ready = await waitClipMeta(el);
    if (!ready || signal.stop || mine !== clipGen) return false;
    const whole = clip.kind === "lemma" || clip.end <= 0;
    const start = whole ? 0 : Math.max(0, clip.start);
    const known = Number.isFinite(el.duration) && el.duration > 0.2;
    const end = whole ? (known ? el.duration : Number.POSITIVE_INFINITY) : Math.max(start + 0.14, clip.end);
    el.playbackRate = Math.min(1.2, Math.max(0.7, rate));
    el.volume = 1;
    el.muted = false;
    el.currentTime = start;
    const started = await new Promise<boolean>((resolve) => {
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(ok);
      };
      const timer = window.setTimeout(() => done(false), 2000);
      el.play().then(
        () => {
          if (!el.paused) done(true);
          else window.setTimeout(() => done(!el.paused), 250);
        },
        () => done(false),
      );
    });
    if (!started || signal.stop || mine !== clipGen) return false;
    endRoadGap();
    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        window.clearInterval(poll);
        if (clipPoll === poll) clipPoll = 0;
        window.clearTimeout(safety);
        if (mine === clipGen) {
          markOwnPause();
          try {
            el.pause();
          } catch {
            /* ignore */
          }
        }
        resolve(ok);
      };
      let stalled = 0;
      let resumeTries = 0;
      const poll = window.setInterval(() => {
        if (mine !== clipGen || signal.stop) {
          finish(true);
          return;
        }
        if (el.ended || (Number.isFinite(end) && el.currentTime >= end - 0.02)) {
          finish(true);
          return;
        }
        if (el.paused) {
          stalled += 40;
          // A short system pause is not the end of the word. Try again, then move on.
          if (roadDriveWanted && resumeTries < 2 && stalled >= 160) {
            resumeTries += 1;
            stalled = 0;
            void el.play().catch(() => {});
            return;
          }
          if (stalled > 400) finish(el.currentTime > start + 0.2);
          return;
        }
        stalled = 0;
      }, 40);
      clipPoll = poll;
      el.onended = () => {
        if (mine === clipGen) finish(true);
      };
      const span = Number.isFinite(end) ? (end - start) / Math.max(el.playbackRate, 0.5) : 8;
      const safety = window.setTimeout(() => finish(true), Math.min(15000, span * 1000 + 1500));
    });
  } catch {
    return false;
  }
}

/** Returns true if the engine actually started speaking. */
export async function speakLine(
  text: string,
  lang: "he" | "en",
  rate: number,
  signal: { stop: boolean } = { stop: false },
  opts?: { mustStart?: boolean },
): Promise<boolean> {
  const s = synth();
  const spoken = lang === "he" ? ttsHebrew(text) : text.trim();
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
    let kick = 0;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(safety);
      window.clearTimeout(retry);
      window.clearTimeout(kick);
      window.clearTimeout(giveUp);
      window.clearInterval(poll);
      if (!ok && opts?.mustStart) {
        try {
          s.cancel();
        } catch {
          /* a gloss that never started must not talk over the recording */
        }
      }
      resolve(ok);
    };
    const arm = (utter: SpeechSynthesisUtterance) => {
      utter.onstart = () => {
        heard = true;
      };
      utter.onend = () => {
        if (opts?.mustStart && !heard) return;
        finish(true);
      };
      utter.onerror = () => finish(heard && !opts?.mustStart);
    };
    arm(u);
    const safety = window.setTimeout(
      () => finish(heard),
      Math.min(24_000, 3_200 + spoken.length * (280 / spokenRate)),
    );
    const giveUp = window.setTimeout(
      () => {
        if (opts?.mustStart && !heard) finish(false);
      },
      apple ? 1500 : 2000,
    );
    const kickTimer = window.setTimeout(() => {
      try {
        if (s.paused) s.resume();
      } catch {
        /* iPhone stays paused after a clip unless resume runs again */
      }
    }, 80);
    kick = kickTimer;
    const retry = window.setTimeout(() => {
      if (heard || signal.stop || settled) return;
      try {
        if (s.paused) s.resume();
      } catch {
        /* ignore */
      }
      u = makeU();
      liveUtterance = u;
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
      liveUtterance = u;
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

const voiceClipCache = new Map<string, { mime: string; b64: string } | null>();
let voiceHeIds: Set<string> | null = null;
let voiceKeys: Set<string> | null = null;

function promiseTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("timeout")), ms);
    work.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function invalidateVoiceCache() {
  voiceClipCache.clear();
  voiceHeIds = null;
  voiceKeys = null;
}

async function knownVoiceKeys(): Promise<Set<string>> {
  if (voiceKeys) return voiceKeys;
  try {
    const rows = await promiseTimeout(listVoiceIndex(), 2500);
    voiceKeys = new Set(rows.map((row) => `${row.vocabId}:${row.part}`));
    voiceHeIds = new Set(rows.filter((row) => row.part === "he").map((row) => row.vocabId));
  } catch {
    voiceKeys = new Set();
    voiceHeIds = new Set();
  }
  return voiceKeys;
}

export async function recordedHeIds(): Promise<Set<string>> {
  await knownVoiceKeys();
  return voiceHeIds ?? new Set();
}

export async function playAdminVoice(
  vocabId: string,
  part: VoicePart,
  rate: number,
  signal: { stop: boolean },
): Promise<boolean> {
  roadGap = true;
  const key = `${vocabId}:${part}`;
  let payload = voiceClipCache.get(key);
  if (payload === undefined) {
    payload = null;
    const keys = await knownVoiceKeys();
    const ids = clipLookupIds(vocabId);
    if (ids.some((id) => keys.has(`${id}:${part}`))) {
      for (const cid of ids) {
        if (!keys.has(`${cid}:${part}`)) continue;
        try {
          const row = await promiseTimeout(getVoiceClip({ data: { vocabId: cid, part } }), 2500);
          if (row) {
            payload = { mime: row.mime, b64: row.b64 };
            break;
          }
        } catch {
          /* try alias, or skip a hung lookup */
        }
      }
    }
    voiceClipCache.set(key, payload);
  }
  if (!payload || signal.stop) return false;
  const src = `data:${payload.mime};base64,${payload.b64}`;
  return playVocabClip(
    { src, start: 0, end: 0, he: "", kind: "lemma", source: "eliran" },
    rate,
    signal,
  );
}

export async function playNeuralVoice(
  vocabId: string,
  part: VoicePart,
  rate: number,
  signal: { stop: boolean },
): Promise<boolean> {
  roadGap = true;
  await loadNeuralManifest();
  const src = neuralSrc(vocabId, part);
  if (!src || signal.stop) return false;
  return playVocabClip({ src, start: 0, end: 0, he: "", kind: "lemma", source: "eliran" }, rate, signal);
}

export async function speakHebrewWord(
  item: ListenItem,
  rate: number,
  signal: { stop: boolean },
  opts?: { preferNeural?: boolean },
): Promise<void> {
  const voiceId = item.heVoiceId || item.id;
  if (opts?.preferNeural) {
    const neural = await playNeuralVoice(voiceId, "he", rate, signal);
    if (neural || signal.stop) return;
  }
  const own = await playAdminVoice(voiceId, "he", rate, signal);
  if (own || signal.stop) return;
  if (!opts?.preferNeural) {
    const neural = await playNeuralVoice(voiceId, "he", rate, signal);
    if (neural || signal.stop) return;
  }
  const clip = vocabClip(voiceId);
  if (clip?.source === "eliran" && clip.kind === "lemma") {
    const ok = await playVocabClip(clip, rate, signal);
    if (ok || signal.stop) return;
  }
  const he = spokenHebrew(voiceId, item.hebrew);
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
    const neuralAnn = await playNeuralVoice(`announce-${item.chapter}`, "en", Math.min(rate, 1), signal);
    if (!neuralAnn && !signal.stop) await speakLine(item.announce, "en", Math.min(rate, 1), signal);
    if (signal.stop) return;
    if (!apple) await pauseMs(restFor(rate, 420), signal);
  }
  if (signal.stop) return;

  await speakHebrewWord(item, rate, signal);
  if (signal.stop) return;
  await pauseMs(restFor(rate, apple ? 220 : 380), signal);
  if (signal.stop) return;

  const en = spokenEnglish(item.gloss);
  if (en) {
    const ownEn = await playAdminVoice(item.id, "en", rate, signal);
    if (!ownEn && !signal.stop) {
      const neuralEn = await playNeuralVoice(item.id, "en", rate, signal);
      if (!neuralEn && !signal.stop) await speakLine(en, "en", rate, signal);
    }
  }
  if (signal.stop) return;
  await pauseMs(restFor(rate, apple ? 280 : 720), signal);
}

/** Say a gloss after a Hebrew clip. The phone will not talk over that clip or the music. */
async function speakGlossOnRoad(en: string, signal: { stop: boolean }): Promise<boolean> {
  suppressRoadHalt(12000);
  releaseClipForSpeech();
  const releaseMusic = holdRoadMusic();
  try {
    await pauseMs(160, signal);
    if (signal.stop) return false;
    return speakLine(en, "en", 0.85, signal, { mustStart: true });
  } finally {
    releaseMusic();
  }
}

/** Hebrew, then the meaning. Same clips and pace as Drill. No chapter announcement. */
export async function speakRoadCard(item: ListenItem, signal: { stop: boolean }): Promise<void> {
  if (signal.stop) return;
  await speakHebrewWord(item, 0.85, signal, { preferNeural: true });
  if (signal.stop) return;
  if (item.alsoHebrew) {
    await pauseMs(restFor(0.85, 280), signal);
    if (signal.stop) return;
    await speakHebrewWord(
      { ...item, id: `${item.id}-also`, hebrew: item.alsoHebrew, heVoiceId: undefined, alsoHebrew: undefined },
      0.85,
      signal,
      { preferNeural: true },
    );
    if (signal.stop) return;
  }
  await pauseMs(restFor(0.85, 420), signal);
  if (signal.stop) return;
  const en = spokenEnglish(item.gloss);
  if (!en) return;
  const voiceId = item.heVoiceId || item.id;
  if (item.plainEnglish && item.heVoiceId && item.heVoiceId !== item.id) {
    // This gloss is not the other course's recording. Say the card. If the phone
    // stays quiet, play that recording anyway so the meaning is not skipped.
    const said = await speakGlossOnRoad(en, signal);
    if (!said && !signal.stop) {
      const neuralEn = await playNeuralVoice(voiceId, "en", 0.85, signal);
      if (!neuralEn && !signal.stop) await playAdminVoice(voiceId, "en", 0.85, signal);
    }
  } else {
    const neuralEn = await playNeuralVoice(voiceId, "en", 0.85, signal);
    if (!neuralEn && !signal.stop) {
      const ownEn = await playAdminVoice(voiceId, "en", 0.85, signal);
      if (!ownEn && !signal.stop) await speakGlossOnRoad(en, signal);
    }
  }
  if (signal.stop) return;
  await pauseMs(restFor(0.85, 720), signal);
}

export async function speakReadingVerse(verse: ReadingVerse, rate: number, signal: { stop: boolean }): Promise<void> {
  if (signal.stop) return;
  const apple = isAppleMobile();
  await speakLine(`Genesis ${chapterWordEn(verse.chapter)}, verse ${chapterWordEn(verse.verse)}.`, "en", Math.min(rate, 1), signal);
  if (signal.stop) return;
  const he = ttsHebrew(verse.he);
  if (hasHebrewVoice()) {
    await speakLine(he, "he", rate, signal);
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
