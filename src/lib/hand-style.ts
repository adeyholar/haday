import { enrollLetterInk, primaryLetterInk, type InkStroke } from "@/lib/letter-shape";
import { modelGlyph } from "@/lib/letter-models";
import { scoreInkToPaths } from "@/lib/letter-strokes";

export const HAND_GOAL = 5;
const KEY = "haday-hand-style-v1";
const EVENT = "haday-hand";

export type HandSample = { strokes: InkStroke[]; t: number };
export type HandLetterState = { samples: HandSample[]; proto?: InkStroke[]; bar: number };
export type HandBank = Record<string, HandSample[] | HandLetterState>;

function roundPt(p: { x: number; y: number }) {
  return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
}

function bbox(pts: { x: number; y: number }[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}

function resample(s: InkStroke, n = 28): InkStroke {
  if (s.length <= 1) return s.map(roundPt);
  const out: InkStroke = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const j = t * (s.length - 1);
    const a = s[Math.floor(j)];
    const b = s[Math.min(s.length - 1, Math.ceil(j))];
    const f = j - Math.floor(j);
    out.push(roundPt({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }));
  }
  return out;
}

/** Fit ink into 0–100 so later grading is size-independent. */
export function compactStrokes(strokes: InkStroke[]): InkStroke[] {
  const pts = strokes.flat();
  if (!pts.length) return [];
  const b = bbox(pts);
  return strokes
    .filter((s) => s.length)
    .map((s) =>
      resample(
        s.map((p) => ({
          x: ((p.x - b.minX) / b.w) * 100,
          y: ((p.y - b.minY) / b.h) * 100,
        })),
      ),
    );
}

function asState(v: HandSample[] | HandLetterState | undefined): HandLetterState {
  if (!v) return { samples: [], bar: 0.64 };
  if (Array.isArray(v)) return { samples: v.slice(0, HAND_GOAL), bar: 0.64 };
  return {
    samples: Array.isArray(v.samples) ? v.samples.slice(0, HAND_GOAL) : [],
    proto: v.proto,
    bar: Number(v.bar) >= 0.64 ? Math.min(0.82, v.bar) : 0.64,
  };
}

function blend(a: InkStroke[], b: InkStroke[], t: number): InkStroke[] {
  if (!a.length) return b;
  if (a.length !== b.length) return t > 0.5 ? b : a;
  return a.map((sa, i) => {
    const sb = resample(b[i] ?? sa, sa.length);
    return sa.map((p, j) => {
      const q = sb[j] ?? p;
      return roundPt({ x: p.x * (1 - t) + q.x * t, y: p.y * (1 - t) + q.y * t });
    });
  });
}

function medoid(samples: HandSample[]): InkStroke[] | undefined {
  if (!samples.length) return undefined;
  if (samples.length === 1) return samples[0].strokes;
  let best = 0;
  let bestSum = -1;
  for (let i = 0; i < samples.length; i++) {
    let sum = 0;
    for (let j = 0; j < samples.length; j++) {
      if (i === j) continue;
      sum += scoreInkToPaths(samples[i].strokes, samples[j].strokes).score;
    }
    if (sum > bestSum) {
      bestSum = sum;
      best = i;
    }
  }
  return samples[best].strokes;
}

function letterId(expected: string): string {
  return modelGlyph(expected);
}

export function loadHand(): HandBank {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: HandBank = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        const samples: HandSample[] = [];
        for (const s of v) {
          if (!s || typeof s !== "object") continue;
          const strokes = (s as HandSample).strokes;
          if (!Array.isArray(strokes) || !strokes.length) continue;
          samples.push({ strokes, t: Number((s as HandSample).t) || 0 });
        }
        if (samples.length) out[k] = { samples: samples.slice(0, HAND_GOAL), proto: medoid(samples), bar: 0.64 };
        continue;
      }
      if (v && typeof v === "object" && Array.isArray((v as HandLetterState).samples)) {
        out[k] = asState(v as HandLetterState);
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function saveHand(bank: HandBank) {
  try {
    localStorage.setItem(KEY, JSON.stringify(bank));
  } catch {
    /* quota */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function samplesFor(expected: string): InkStroke[][] {
  const st = asState(loadHand()[letterId(expected)]);
  const out: InkStroke[][] = [];
  if (st.proto?.length) out.push(st.proto);
  for (const s of st.samples) out.push(s.strokes);
  return out;
}

export function sampleCount(expected: string): number {
  return asState(loadHand()[letterId(expected)]).samples.length;
}

export function handBar(expected: string): number {
  return asState(loadHand()[letterId(expected)]).bar;
}

export function handStats(bank = loadHand()): { letters: number; full: number; samples: number } {
  let letters = 0;
  let full = 0;
  let samples = 0;
  for (const v of Object.values(bank)) {
    const st = asState(v);
    if (!st.samples.length) continue;
    letters += 1;
    samples += st.samples.length;
    if (st.samples.length >= HAND_GOAL) full += 1;
  }
  return { letters, full, samples };
}

export function subscribeHand(fn: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

export function clearLetterHand(expected: string) {
  const bank = loadHand();
  delete bank[letterId(expected)];
  saveHand(bank);
}

export function mergeHand(remote: HandBank): HandBank {
  const local = loadHand();
  const out: HandBank = { ...remote };
  for (const [k, val] of Object.entries(local)) {
    const a = asState(out[k]);
    const b = asState(val);
    const combined = [...b.samples];
    for (const s of a.samples) {
      if (combined.length >= HAND_GOAL) break;
      combined.push(s);
    }
    const samples = combined.slice(0, HAND_GOAL);
    out[k] = {
      samples,
      proto: b.proto ?? a.proto ?? medoid(samples),
      bar: Math.max(a.bar, b.bar),
    };
  }
  saveHand(out);
  return out;
}

export function scoreAgainstHand(strokes: InkStroke[], expected: string): number {
  let best = 0;
  for (const sample of samplesFor(expected)) {
    const sc = scoreInkToPaths(strokes, sample);
    if (sc.score > best) best = sc.score;
  }
  return best;
}

type SaveOpts = { height?: number; replace?: boolean };

export function saveHandSample(
  expected: string,
  strokes: InkStroke[],
  opts?: SaveOpts,
): { ok: boolean; n: number; note?: string } {
  const id = letterId(expected);
  const enrolled = enrollLetterInk(strokes, expected, { height: opts?.height });
  if (!enrolled.ok) return { ok: false, n: sampleCount(expected), note: enrolled.note };
  const packed = compactStrokes(primaryLetterInk(strokes, expected));
  if (!packed.length) return { ok: false, n: 0, note: "Draw the letter larger, between the two lines." };
  const bank = loadHand();
  const st = asState(bank[id]);
  const cur = [...st.samples];
  if (cur.length >= HAND_GOAL) {
    if (!opts?.replace) return { ok: true, n: cur.length };
    cur.shift();
  }
  cur.push({ strokes: packed, t: Date.now() });
  const proto = st.proto ? blend(st.proto, packed, 0.35) : medoid(cur);
  const bar = Math.min(0.8, 0.64 + 0.025 * cur.length);
  bank[id] = { samples: cur, proto, bar };
  saveHand(bank);
  return { ok: true, n: cur.length };
}

/** Keep a passing scribble if this letter is not yet full. Never overrides a reject. */
export function rememberPassingHand(expected: string, strokes: InkStroke[], height?: number) {
  if (sampleCount(expected) >= HAND_GOAL) return;
  saveHandSample(expected, strokes, { height, replace: false });
}
