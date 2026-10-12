/** Quiet beds for On the road. The word stays louder than the music. */

export const ROAD_MUSIC = [
  { id: "off", label: "Quiet" },
  { id: "hatikvah", label: "Hatikvah", src: "/road/hatikvah.mp3" },
  { id: "solemn", label: "Solemn", src: "/road/solemn.mp3" },
] as const;

export type RoadMusicId = (typeof ROAD_MUSIC)[number]["id"];

const TRACK_KEY = "haday-road-music";
const LEVEL_KEY = "haday-road-music-level";

let bed: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let source: MediaElementAudioSourceNode | null = null;

export function isRoadMusicId(value: string | null): value is RoadMusicId {
  return value === "off" || value === "hatikvah" || value === "solemn";
}

export function loadRoadMusic(): RoadMusicId {
  try {
    const saved = localStorage.getItem(TRACK_KEY);
    if (isRoadMusicId(saved)) return saved;
  } catch {
    /* ignore */
  }
  return "off";
}

export function saveRoadMusic(id: RoadMusicId) {
  try {
    localStorage.setItem(TRACK_KEY, id);
  } catch {
    /* ignore */
  }
}

/** 0–100. Playback never reaches full scale, so the word stays in front. */
export function loadRoadMusicLevel(): number {
  try {
    const n = Number(localStorage.getItem(LEVEL_KEY));
    if (Number.isFinite(n)) return Math.min(100, Math.max(0, Math.round(n)));
  } catch {
    /* ignore */
  }
  return 25;
}

export function saveRoadMusicLevel(level: number) {
  const next = Math.min(100, Math.max(0, Math.round(level)));
  try {
    localStorage.setItem(LEVEL_KEY, String(next));
  } catch {
    /* ignore */
  }
  if (bed) applyLevel(next);
  if (ctx && ctx.state === "suspended") void ctx.resume();
  return next;
}

/** 0 is silent. 100 stays under the spoken word. The curve spends the low half very quiet. */
export function musicVolume(level: number): number {
  const t = Math.min(100, Math.max(0, level)) / 100;
  return t * t * 0.35;
}

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  return ctx;
}

/** A phone ignores audio.volume. The gain node is what the slider actually moves. */
function applyLevel(level: number) {
  const amount = musicVolume(level);
  if (gain) {
    gain.gain.value = amount;
    if (bed) bed.volume = 1;
    return;
  }
  if (bed) bed.volume = amount;
}

function arm(el: HTMLAudioElement, level: number) {
  const context = audioContext();
  if (context && !source) {
    gain ??= context.createGain();
    gain.connect(context.destination);
    try {
      source = context.createMediaElementSource(el);
      source.connect(gain);
    } catch {
      source = null;
    }
  }
  applyLevel(level);
  if (context && context.state === "suspended") void context.resume();
}

function bedEl(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!bed) {
    bed = new Audio();
    bed.loop = true;
    bed.preload = "auto";
    bed.setAttribute("playsinline", "");
  }
  return bed;
}

/** Call from the Play tap so the phone allows the sound. */
export function playRoadMusic(id: RoadMusicId, level = loadRoadMusicLevel()) {
  const el = bedEl();
  if (!el || id === "off") {
    pauseRoadMusic();
    return;
  }
  const track = ROAD_MUSIC.find((item) => item.id === id);
  const src = track && "src" in track ? track.src : "";
  if (!src) return;
  arm(el, level);
  if (!el.getAttribute("src")?.endsWith(src)) {
    el.src = src;
    el.load();
  }
  void el.play().catch(() => {});
}

export function pauseRoadMusic() {
  try {
    bed?.pause();
  } catch {
    /* ignore */
  }
}
