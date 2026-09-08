import { CONSONANTS, FINAL_FORMS, VOWELS, type HebrewLetter, type HebrewVowel } from "@/lib/alphabet";
import { ALEF_BET_LINE } from "@/lib/alefbet-game";

export const BALLOON_START_LIVES = 3;
export const BALLOON_MAX_LIVES = 6;
export const BALLOON_OCEAN_Y = 82;

export type BalloonPack = "letters" | "vowels";

export type BalloonGlyph = {
  id: string;
  glyph: string;
  name: string;
  kind: "letter" | "vowel";
};

export type BalloonWave = {
  id: number;
  title: string;
  blurb: string;
  items: BalloonGlyph[];
  catches: number;
  decoys: number;
  fallSeconds: number;
};

const LETTER_TWINS: Record<string, string[]> = {
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
  "mem-final": ["samekh"],
  "nun-final": ["vav", "kaf-final"],
  "pe-final": ["kaf-final", "pe"],
  "tsade-final": ["tsade", "ayin"],
};

/** Same-family and look-alike vowels. Qamets Hatuf is omitted — it shares the qamets mark. */
const VOWEL_TWINS: Record<string, string[]> = {
  qamets: ["pathach", "hateph-qamets"],
  pathach: ["qamets", "hateph-pathach", "seghol"],
  tsere: ["seghol", "hireq", "tsere-he"],
  holem: ["holem-waw", "hateph-qamets"],
  seghol: ["tsere", "pathach", "hateph-seghol"],
  hireq: ["tsere", "hireq-yod", "shewa"],
  qibbuts: ["shureq", "shewa"],
  shewa: ["hateph-pathach", "hireq", "hateph-seghol"],
  "hateph-pathach": ["pathach", "shewa", "hateph-seghol"],
  "hateph-seghol": ["seghol", "shewa", "hateph-pathach"],
  "hateph-qamets": ["qamets", "holem"],
  "qamets-he": ["tsere-he", "pathach"],
  "tsere-he": ["qamets-he", "tsere"],
  "seghol-he": ["seghol", "tsere-he"],
  "holem-he": ["holem", "holem-waw"],
  "holem-waw": ["holem", "shureq"],
  shureq: ["qibbuts", "holem-waw"],
  "tsere-yod": ["hireq-yod", "tsere"],
  "seghol-yod": ["tsere-yod", "seghol"],
  "hireq-yod": ["hireq", "tsere-yod"],
};

function fromLetter(l: HebrewLetter): BalloonGlyph {
  return { id: l.id, glyph: l.letter, name: l.name, kind: "letter" };
}

function fromVowel(v: HebrewVowel): BalloonGlyph {
  return { id: v.id, glyph: v.mark, name: v.name, kind: "vowel" };
}

const LETTER_GLYPHS = [...CONSONANTS, ...FINAL_FORMS].map(fromLetter);
const VOWEL_GLYPHS = VOWELS.filter((v) => v.id !== "qamets-hatuf").map(fromVowel);
const GLYPHS = new Map<string, BalloonGlyph>([...LETTER_GLYPHS, ...VOWEL_GLYPHS].map((g) => [g.id, g]));

function glyphs(ids: string[]): BalloonGlyph[] {
  return ids.map((id) => GLYPHS.get(id)).filter((g): g is BalloonGlyph => Boolean(g));
}

export const LETTER_WAVES: BalloonWave[] = [
  {
    id: 1,
    title: "First line",
    blurb: "Alef through Het. Slow fall. Hear the name, tap the glyph.",
    items: ALEF_BET_LINE.slice(0, 8).map(fromLetter),
    catches: 8,
    decoys: 2,
    fallSeconds: 9,
  },
  {
    id: 2,
    title: "Middle line",
    blurb: "Tet through Ayin. A little faster.",
    items: ALEF_BET_LINE.slice(8, 16).map(fromLetter),
    catches: 8,
    decoys: 2,
    fallSeconds: 8,
  },
  {
    id: 3,
    title: "Last line",
    blurb: "Pe through Tav. Shin and Sin both appear.",
    items: ALEF_BET_LINE.slice(16).map(fromLetter),
    catches: 8,
    decoys: 3,
    fallSeconds: 7.2,
  },
  {
    id: 4,
    title: "Look-alikes",
    blurb: "The whole line. Decoys are the letters students mix: ב/כ, ד/ר, ה/ח, שׁ/שׂ.",
    items: ALEF_BET_LINE.map(fromLetter),
    catches: 10,
    decoys: 3,
    fallSeconds: 6.6,
  },
  {
    id: 5,
    title: "Finals too",
    blurb: "Final kaf, mem, nun, pe, tsade join the sky. Fastest fall.",
    items: [...ALEF_BET_LINE.map(fromLetter), ...FINAL_FORMS.map(fromLetter)],
    catches: 10,
    decoys: 4,
    fallSeconds: 5.8,
  },
];

export const VOWEL_WAVES: BalloonWave[] = [
  {
    id: 1,
    title: "A-class",
    blurb: "Qamets vs Pathach — the pair everyone mixes. Hateph Pathach sits with them.",
    items: glyphs(["qamets", "pathach", "hateph-pathach", "qamets-he"]),
    catches: 8,
    decoys: 2,
    fallSeconds: 9,
  },
  {
    id: 2,
    title: "E and I",
    blurb: "Tsere, Seghol, Hireq, Shewa. Listen for the name, not the sound-alike.",
    items: glyphs(["tsere", "seghol", "hireq", "shewa", "hateph-seghol"]),
    catches: 8,
    decoys: 2,
    fallSeconds: 8,
  },
  {
    id: 3,
    title: "O and U",
    blurb: "Holem, Qibbuts, Hateph Qamets. Shureq joins so the vav-dot is in the sky.",
    items: glyphs(["holem", "qibbuts", "hateph-qamets", "shureq", "holem-waw"]),
    catches: 8,
    decoys: 3,
    fallSeconds: 7.2,
  },
  {
    id: 4,
    title: "Vowel letters",
    blurb: "ה ו י as vowel letters: Qamets He, Holem Vav, Hireq Yod, and their neighbors.",
    items: glyphs(["qamets-he", "tsere-he", "seghol-he", "holem-he", "holem-waw", "shureq", "tsere-yod", "hireq-yod"]),
    catches: 10,
    decoys: 3,
    fallSeconds: 6.6,
  },
  {
    id: 5,
    title: "All vowels",
    blurb: "The full set. Weak marks you missed keep coming back.",
    items: VOWEL_GLYPHS,
    catches: 10,
    decoys: 4,
    fallSeconds: 5.8,
  },
];

/** @deprecated use balloonWaves("letters") */
export const BALLOON_WAVES = LETTER_WAVES;
export const BALLOON_WAVE_COUNT = LETTER_WAVES.length;

export function balloonWaves(pack: BalloonPack): BalloonWave[] {
  return pack === "vowels" ? VOWEL_WAVES : LETTER_WAVES;
}

export function balloonWave(pack: BalloonPack, id: number): BalloonWave | undefined {
  return balloonWaves(pack).find((w) => w.id === id);
}

export type BalloonSprite = {
  id: string;
  item: BalloonGlyph;
  x: number;
  y: number;
  speed: number;
  sway: number;
  phase: number;
  hue: number;
  target: boolean;
  hint: boolean;
};

export function lookalikesOf(id: string): BalloonGlyph[] {
  const twins = LETTER_TWINS[id] ?? VOWEL_TWINS[id] ?? [];
  return twins.map((x) => GLYPHS.get(x)).filter((g): g is BalloonGlyph => Boolean(g));
}

export function spokenLetterName(item: BalloonGlyph): string {
  if (item.id.endsWith("-final")) return `final ${item.name.replace(/^Final /i, "")}`;
  return item.name;
}

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function weakWeight(weak: Record<string, number> | undefined, id: string): number {
  return 1 + Math.min(8, Math.max(0, Number(weak?.[id]) || 0) * 2);
}

export function pickTarget(
  wave: BalloonWave,
  avoidId?: string,
  weak: Record<string, number> = {},
): BalloonGlyph {
  const pool = avoidId ? wave.items.filter((l) => l.id !== avoidId) : wave.items;
  const bag = pool.length ? pool : wave.items;
  const weights = bag.map((g) => weakWeight(weak, g.id));
  const total = weights.reduce((n, w) => n + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < bag.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return bag[i];
  }
  return bag[bag.length - 1] ?? wave.items[0];
}

export function pickDecoys(wave: BalloonWave, target: BalloonGlyph, count: number): BalloonGlyph[] {
  const twins = lookalikesOf(target.id).filter((l) => wave.items.some((w) => w.id === l.id));
  const rest = wave.items.filter((l) => l.id !== target.id && !twins.some((t) => t.id === l.id));
  const bag = [...twins, ...shuffle(rest)];
  const seen = new Set<string>();
  const out: BalloonGlyph[] = [];
  for (const l of bag) {
    if (seen.has(l.id) || l.id === target.id) continue;
    seen.add(l.id);
    out.push(l);
    if (out.length >= count) break;
  }
  return out;
}

export function spawnCall(opts: {
  wave: BalloonWave;
  combo: number;
  avoidId?: string;
  weak?: Record<string, number>;
  hint?: boolean;
}): BalloonSprite[] {
  const { wave, combo, avoidId, weak = {}, hint = false } = opts;
  const target = pickTarget(wave, avoidId, weak);
  const decoys = pickDecoys(wave, target, wave.decoys);
  const letters = shuffle([target, ...decoys]);
  const slow = combo >= 4 ? 0.85 : 1;
  const speed = (BALLOON_OCEAN_Y - 6) / (wave.fallSeconds * slow);
  const n = letters.length;
  return letters.map((item, i) => {
    const lane = (i + 0.5) / n;
    const jitter = (Math.random() - 0.5) * (70 / n);
    return {
      id: `${item.id}-${Math.random().toString(36).slice(2, 8)}`,
      item,
      x: Math.min(88, Math.max(12, lane * 76 + 12 + jitter)),
      y: 4 + Math.random() * 6,
      speed,
      sway: 4 + Math.random() * 5,
      phase: Math.random() * Math.PI * 2,
      hue: i,
      target: item.id === target.id,
      hint: hint && item.id === target.id,
    };
  });
}

export function bumpWeak(weak: Record<string, number>, id: string, delta: number): Record<string, number> {
  const next = { ...weak };
  const n = Math.max(0, (next[id] ?? 0) + delta);
  if (n === 0) delete next[id];
  else next[id] = n;
  return next;
}

export function gainLife(lives: number): number {
  return Math.min(BALLOON_MAX_LIVES, lives + 1);
}
