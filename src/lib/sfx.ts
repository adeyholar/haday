const MUTE_KEY = "haday-sfx-muted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let applause: AudioBuffer | null = null;
let applauseLoad: Promise<AudioBuffer | null> | null = null;
let aww: AudioBuffer | null = null;
let awwLoad: Promise<AudioBuffer | null> | null = null;
const listeners = new Set<(value: boolean) => void>();

function readMuted() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

muted = readMuted();

function ensureGraph() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function setMasterGain(value: number) {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(value, ctx.currentTime, 0.02);
}

export function unlockSfx() {
  const ac = ensureGraph();
  if (!ac) return;
  void loadApplause(ac);
  void loadAww(ac);
}

export function isMuted() {
  return muted;
}

export function setMuted(next: boolean) {
  muted = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* ignore quota */
    }
  }
  if (!ensureGraph() || !master || !ctx) {
    listeners.forEach((fn) => fn(muted));
    return;
  }
  setMasterGain(next ? 0 : 1);
  listeners.forEach((fn) => fn(muted));
}

export function subscribeMute(fn: (value: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function decodeSfx(ac: AudioContext, url: string): Promise<AudioBuffer | null> {
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("sfx");
      return res.arrayBuffer();
    })
    .then((raw) => ac.decodeAudioData(raw.slice(0)))
    .catch(() => null);
}

// Mixkit 521 — audience clapping, hands only (no cheers / voices). Mixkit License.
function loadApplause(ac: AudioContext): Promise<AudioBuffer | null> {
  if (applause) return Promise.resolve(applause);
  if (applauseLoad) return applauseLoad;
  applauseLoad = decodeSfx(ac, "/sfx/crowd-clap.mp3").then((buf) => {
    if (!buf) applauseLoad = null;
    else applause = buf;
    return buf;
  });
  return applauseLoad;
}

// Freesound 752706 — small crowd “aww”, CC0 (Nox_Sound).
function loadAww(ac: AudioContext): Promise<AudioBuffer | null> {
  if (aww) return Promise.resolve(aww);
  if (awwLoad) return awwLoad;
  awwLoad = decodeSfx(ac, "/sfx/crowd-aww.mp3").then((buf) => {
    if (!buf) awwLoad = null;
    else aww = buf;
    return buf;
  });
  return awwLoad;
}

function startBuffer(ac: AudioContext, dest: GainNode, buf: AudioBuffer, peak = 0.95) {
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  const t0 = ac.currentTime;
  const dur = buf.duration;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.018);
  g.gain.setValueAtTime(peak, t0 + Math.max(0.08, dur - 0.28));
  g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
  src.connect(g);
  g.connect(dest);
  src.start(t0);
  src.stop(t0 + dur + 0.03);
  src.onended = () => {
    src.disconnect();
    g.disconnect();
  };
}

function playCrowdClap(ac: AudioContext, dest: GainNode) {
  if (applause) {
    startBuffer(ac, dest, applause, 0.95);
    return;
  }
  void loadApplause(ac).then((buf) => {
    if (buf && !muted) startBuffer(ac, dest, buf, 0.95);
  });
}

function playCrowdAww(ac: AudioContext, dest: GainNode) {
  if (aww) {
    startBuffer(ac, dest, aww, 1);
    return;
  }
  void loadAww(ac).then((buf) => {
    if (buf && !muted) startBuffer(ac, dest, buf, 1);
  });
}

export function playGrade(ok: boolean) {
  const ac = ensureGraph();
  if (!ac || !master || muted) return;
  if (ok) playCrowdClap(ac, master);
  else playCrowdAww(ac, master);
}

if (typeof window !== "undefined") {
  const unlock = () => unlockSfx();
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") unlockSfx();
  });
}
