import { CONSONANTS, FINAL_FORMS, type HebrewLetter } from "@/lib/alphabet";
import { ALEF_BET_LINE } from "@/lib/alefbet-game";

export const BALLOON_START_LIVES = 3;
export const BALLOON_MAX_LIVES = 6;
export const BALLOON_OCEAN_Y = 82;
export const BALLOON_WAVE_COUNT = 5;

const LOOKALIKES: Record<string, string[]> = {
  alef: ["ayin", "tav"],
  bet: ["kaf", "pe"],
  gimel: ["nun", "zayin"],
  dalet: ["resh", "kaf-final"],
  he: ["het", "tav"],
  vav: ["zayin", "nun-final", "yod"],
  zayin: ["vav", "nun-final"],
  het: ["he", "tav"],
  tet: ["mem", "samekh"],
  yod: ["vav", "nun-final"],
  kaf: ["bet", "pe", "nun"],
  lamed: ["nun", "gimel"],
  mem: ["tet", "samekh", "mem-final"],
  nun: ["gimel", "kaf"],
  samekh: ["mem", "mem-final", "tet"],
  ayin: ["alef", "tsade"],
  pe: ["kaf", "bet", "pe-final"],
  tsade: ["ayin", "tsade-final"],
  qof: ["kaf", "resh"],
  resh: ["dalet", "kaf-final"],
  shin: ["sin", "tav"],
  sin: ["shin", "samekh"],
  tav: ["he", "het"],
  "kaf-final": ["nun-final", "resh"],
  "mem-final": ["samekh", "samekh"],
  "nun-final": ["vav", "kaf-final"],
  "pe-final": ["kaf-final", "pe"],
  "tsade-final": ["tsade", "ayin"],
};

const BY_ID = new Map<string, HebrewLetter>(
  [...CONSONANTS, ...FINAL_FORMS].map((l) => [l.id, l]),
);

export type BalloonWave = {
  id: number;
  title: string;
  blurb: string;
  letters: HebrewLetter[];
  catches: number;
  decoys: number;
  fallSeconds: number;
};

export const BALLOON_WAVES: BalloonWave[] = [
  {
    id: 1,
    title: "First line",
    blurb: "Alef through Het. Slow fall. Hear the name, tap the glyph.",
    letters: ALEF_BET_LINE.slice(0, 8),
    catches: 8,
    decoys: 2,
    fallSeconds: 9,
  },
  {
    id: 2,
    title: "Middle line",
    blurb: "Tet through Ayin. A little faster.",
    letters: ALEF_BET_LINE.slice(8, 16),
    catches: 8,
    decoys: 2,
    fallSeconds: 8,
  },
  {
    id: 3,
    title: "Last line",
    blurb: "Pe through Tav. Shin and Sin both appear.",
    letters: ALEF_BET_LINE.slice(16),
    catches: 8,
    decoys: 3,
    fallSeconds: 7.2,
  },
  {
    id: 4,
    title: "Look-alikes",
    blurb: "The whole line. Decoys are the letters students mix: ב/כ, ד/ר, ה/ח, שׁ/שׂ.",
    letters: ALEF_BET_LINE,
    catches: 10,
    decoys: 3,
    fallSeconds: 6.6,
  },
  {
    id: 5,
    title: "Finals too",
    blurb: "Final kaf, mem, nun, pe, tsade join the sky. Fastest fall.",
    letters: [...ALEF_BET_LINE, ...FINAL_FORMS],
    catches: 10,
    decoys: 4,
    fallSeconds: 5.8,
  },
];

export type BalloonSprite = {
  id: string;
  letter: HebrewLetter;
  x: number;
  y: number;
  speed: number;
  sway: number;
  phase: number;
  hue: number;
  target: boolean;
};

export function letterById(id: string): HebrewLetter | undefined {
  return BY_ID.get(id);
}

export function lookalikesOf(id: string): HebrewLetter[] {
  return (LOOKALIKES[id] ?? []).map((x) => BY_ID.get(x)).filter((x): x is HebrewLetter => Boolean(x));
}

export function spokenLetterName(letter: HebrewLetter): string {
  if (letter.id.endsWith("-final")) return `final ${letter.name.replace(/^Final /i, "")}`;
  return letter.name;
}

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickTarget(wave: BalloonWave, avoidId?: string): HebrewLetter {
  const pool = avoidId ? wave.letters.filter((l) => l.id !== avoidId) : wave.letters;
  return pool[Math.floor(Math.random() * pool.length)] ?? wave.letters[0];
}

export function pickDecoys(wave: BalloonWave, target: HebrewLetter, count: number): HebrewLetter[] {
  const twins = lookalikesOf(target.id).filter((l) => wave.letters.some((w) => w.id === l.id));
  const rest = wave.letters.filter((l) => l.id !== target.id && !twins.some((t) => t.id === l.id));
  const bag = [...twins, ...shuffle(rest)];
  const seen = new Set<string>();
  const out: HebrewLetter[] = [];
  for (const l of bag) {
    if (seen.has(l.id) || l.id === target.id) continue;
    seen.add(l.id);
    out.push(l);
    if (out.length >= count) break;
  }
  return out;
}

export function spawnCall(wave: BalloonWave, combo: number, avoidId?: string): BalloonSprite[] {
  const target = pickTarget(wave, avoidId);
  const decoys = pickDecoys(wave, target, wave.decoys);
  const letters = shuffle([target, ...decoys]);
  const slow = combo >= 4 ? 0.85 : 1;
  const speed = (BALLOON_OCEAN_Y - 6) / (wave.fallSeconds * slow);
  const n = letters.length;
  return letters.map((letter, i) => {
    const lane = (i + 0.5) / n;
    const jitter = (Math.random() - 0.5) * (70 / n);
    return {
      id: `${letter.id}-${Math.random().toString(36).slice(2, 8)}`,
      letter,
      x: Math.min(88, Math.max(12, lane * 76 + 12 + jitter)),
      y: 4 + Math.random() * 6,
      speed,
      sway: 4 + Math.random() * 5,
      phase: Math.random() * Math.PI * 2,
      hue: i,
      target: letter.id === target.id,
    };
  });
}

export function gainLife(lives: number): number {
  return Math.min(BALLOON_MAX_LIVES, lives + 1);
}

export function balloonWave(id: number): BalloonWave | undefined {
  return BALLOON_WAVES.find((w) => w.id === id);
}
