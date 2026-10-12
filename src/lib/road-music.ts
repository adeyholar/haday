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
  return 40;
}

export function saveRoadMusicLevel(level: number) {
  const next = Math.min(100, Math.max(0, Math.round(level)));
  try {
    localStorage.setItem(LEVEL_KEY, String(next));
  } catch {
    /* ignore */
  }
  if (bed) bed.volume = musicVolume(next);
  return next;
}

export function musicVolume(level: number): number {
  return Math.min(0.55, Math.max(0, level / 100) * 0.55);
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
  el.volume = musicVolume(level);
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
