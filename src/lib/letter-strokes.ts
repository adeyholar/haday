import { modelGlyph } from "@/lib/letter-models";

type InkPoint = { x: number; y: number };
type InkStroke = InkPoint[];

/** Handwritten stroke variants (unit 100×100). Chart print plus fair student hands. */
export type StrokeModel = {
  aspect: number;
  paths: InkPoint[][];
};

function P(...n: number[]): InkPoint[] {
  const out: InkPoint[] = [];
  for (let i = 0; i < n.length; i += 2) out.push({ x: n[i], y: n[i + 1] });
  return out;
}

const MODELS: Record<string, StrokeModel[]> = {
  א: [
    { aspect: 0.72, paths: [P(62, 8, 22, 92), P(28, 18, 58, 48), P(58, 52, 78, 90)] },
    { aspect: 0.7, paths: [P(50, 12, 22, 88), P(50, 12, 78, 88), P(32, 40, 68, 40)] },
  ],
  ב: [
    { aspect: 0.95, paths: [P(22, 18, 82, 18, 82, 82), P(18, 82, 82, 82)] },
    { aspect: 0.95, paths: [P(20, 16, 84, 16, 84, 50, 84, 84, 18, 84)] },
    { aspect: 0.92, paths: [P(18, 20, 78, 16, 82, 48), P(18, 22, 16, 82, 80, 84)] },
  ],
  ג: [
    { aspect: 0.62, paths: [P(58, 10, 70, 22, 62, 58, 78, 78), P(62, 58, 32, 88)] },
    { aspect: 0.55, paths: [P(72, 8, 72, 52, 28, 90)] },
    { aspect: 0.58, paths: [P(68, 8, 78, 28, 68, 70), P(68, 48, 30, 88)] },
  ],
  ד: [
    { aspect: 0.9, paths: [P(16, 16, 86, 16), P(78, 16, 78, 88)] },
    { aspect: 0.85, paths: [P(18, 18, 82, 18, 82, 88)] },
    { aspect: 0.88, paths: [P(14, 18, 88, 16), P(80, 16, 80, 88)] },
  ],
  ה: [
    { aspect: 0.88, paths: [P(18, 16, 84, 16, 84, 88), P(22, 40, 22, 88)] },
    { aspect: 0.88, paths: [P(16, 16, 84, 16), P(84, 16, 84, 88), P(20, 42, 20, 88)] },
    { aspect: 0.9, paths: [P(16, 14, 86, 14, 86, 88), P(22, 30, 22, 88)] },
  ],
  ו: [
    { aspect: 0.38, paths: [P(38, 16, 64, 16, 64, 86)] },
    { aspect: 0.32, paths: [P(48, 14, 48, 88)] },
    { aspect: 0.34, paths: [P(26, 14, 60, 16, 60, 88)] },
    { aspect: 0.3, paths: [P(44, 12, 58, 18, 56, 86)] },
  ],
  ז: [
    { aspect: 0.48, paths: [P(24, 16, 76, 16), P(50, 16, 50, 88)] },
    { aspect: 0.42, paths: [P(30, 14, 70, 14, 50, 14, 50, 88)] },
  ],
  ח: [
    { aspect: 0.88, paths: [P(20, 16, 82, 16), P(20, 16, 20, 88), P(82, 16, 82, 88)] },
    { aspect: 0.9, paths: [P(18, 16, 84, 16, 84, 88), P(18, 16, 18, 88)] },
  ],
  ט: [
    { aspect: 0.82, paths: [P(20, 14, 12, 52, 22, 88, 50, 92, 80, 80, 86, 42, 78, 12), P(76, 16, 50, 56)] },
    { aspect: 0.9, paths: [P(22, 22, 18, 78, 50, 90, 82, 72, 78, 22), P(70, 28, 52, 48)] },
    { aspect: 0.92, paths: [P(18, 18, 18, 84, 82, 84, 82, 18), P(82, 18, 42, 52)] },
    { aspect: 0.78, paths: [P(22, 16, 14, 55, 26, 88, 52, 90, 80, 76, 84, 16), P(72, 18, 48, 58)] },
  ],
  י: [
    { aspect: 0.55, paths: [P(38, 22, 62, 22, 62, 52)] },
    { aspect: 0.4, paths: [P(40, 20, 58, 18, 54, 48)] },
  ],
  כ: [
    { aspect: 0.85, paths: [P(24, 18, 78, 18, 86, 50, 78, 84, 24, 84)] },
    { aspect: 0.88, paths: [P(22, 16, 82, 16, 82, 84, 22, 84)] },
  ],
  ך: [
    { aspect: 0.42, paths: [P(18, 14, 72, 14, 72, 96)] },
    { aspect: 0.38, paths: [P(22, 12, 68, 12, 62, 96)] },
  ],
  ל: [
    { aspect: 0.58, paths: [P(28, 6, 28, 34, 78, 34, 78, 88)] },
    { aspect: 0.5, paths: [P(42, 6, 42, 88), P(42, 6, 82, 28)] },
    { aspect: 0.48, paths: [P(55, 6, 38, 88), P(55, 6, 84, 22)] },
  ],
  מ: [
    { aspect: 0.95, paths: [P(18, 82, 22, 28, 48, 16, 50, 52), P(50, 18, 82, 18, 82, 82, 48, 82)] },
    { aspect: 0.95, paths: [P(50, 10, 16, 88), P(50, 10, 84, 88), P(16, 88, 84, 88)] },
  ],
  ם: [
    { aspect: 0.95, paths: [P(22, 16, 80, 16, 80, 84, 22, 84, 22, 16)] },
    { aspect: 0.92, paths: [P(20, 18, 80, 18, 80, 82, 20, 82, 20, 18)] },
  ],
  נ: [
    { aspect: 0.7, paths: [P(28, 16, 72, 16, 72, 84, 24, 84)] },
    { aspect: 0.68, paths: [P(24, 16, 76, 16, 76, 84, 28, 80)] },
  ],
  ן: [
    { aspect: 0.28, paths: [P(40, 14, 62, 14, 62, 96)] },
    { aspect: 0.22, paths: [P(50, 10, 50, 96)] },
  ],
  ס: [
    { aspect: 0.9, paths: [P(10, 16, 84, 16), P(80, 16, 86, 48, 78, 82, 48, 90, 18, 80, 12, 46, 20, 22, 80, 16)] },
    { aspect: 0.88, paths: [P(12, 20, 8, 16, 84, 16, 88, 48, 78, 84, 48, 90, 16, 80, 10, 46, 16, 22)] },
    { aspect: 0.9, paths: [P(22, 16, 78, 16, 78, 84, 22, 84, 22, 16)] },
    { aspect: 0.92, paths: [P(50, 14, 78, 22, 86, 50, 78, 80, 50, 90, 22, 80, 14, 50, 22, 22, 50, 14)] },
  ],
  ע: [
    { aspect: 0.85, paths: [P(18, 20, 42, 78, 16, 88), P(78, 16, 42, 78)] },
    { aspect: 0.88, paths: [P(82, 12, 28, 88), P(18, 22, 28, 88, 70, 88)] },
    { aspect: 0.85, paths: [P(78, 10, 78, 70, 22, 88), P(22, 18, 50, 70)] },
    { aspect: 0.7, paths: [P(20, 16, 50, 92, 82, 12)] },
    { aspect: 0.65, paths: [P(22, 22, 50, 92), P(78, 8, 50, 92)] },
    { aspect: 0.88, paths: [P(16, 16, 18, 48, 30, 86, 50, 94, 72, 84, 84, 44, 80, 12)] },
  ],
  פ: [
    { aspect: 0.82, paths: [P(22, 18, 78, 18, 84, 50, 78, 84, 22, 84), P(58, 38, 58, 62)] },
    { aspect: 0.85, paths: [P(20, 16, 80, 16, 80, 84, 20, 84), P(52, 36, 52, 60)] },
  ],
  ף: [
    { aspect: 0.42, paths: [P(20, 14, 70, 14, 70, 96), P(48, 32, 48, 52)] },
    { aspect: 0.4, paths: [P(22, 12, 68, 12, 68, 96)] },
  ],
  צ: [
    { aspect: 0.85, paths: [P(20, 18, 48, 58, 16, 84), P(78, 14, 48, 58)] },
    { aspect: 0.88, paths: [P(22, 16, 50, 55, 18, 82), P(78, 12, 50, 55, 82, 82)] },
  ],
  ץ: [
    { aspect: 0.55, paths: [P(22, 12, 50, 48), P(78, 12, 50, 48, 50, 96)] },
    { aspect: 0.5, paths: [P(24, 10, 52, 50, 52, 96), P(80, 10, 52, 50)] },
  ],
  ק: [
    { aspect: 0.62, paths: [P(20, 12, 78, 12, 78, 96)] },
    { aspect: 0.62, paths: [P(18, 12, 80, 12, 80, 96), P(80, 12, 36, 58)] },
    { aspect: 0.7, paths: [P(78, 96, 78, 12, 22, 12, 14, 38, 22, 64, 78, 64)] },
    { aspect: 0.58, paths: [P(74, 10, 22, 12, 14, 42, 26, 64, 74, 64), P(74, 10, 74, 98)] },
  ],
  ר: [
    { aspect: 0.72, paths: [P(22, 16, 78, 16, 78, 86)] },
    { aspect: 0.65, paths: [P(24, 16, 72, 16, 72, 88)] },
    { aspect: 0.68, paths: [P(20, 18, 76, 16, 74, 88)] },
  ],
  ש: [
    { aspect: 1.05, paths: [P(14, 28, 18, 84), P(18, 84, 50, 28, 82, 84), P(82, 84, 86, 28)] },
    { aspect: 1.05, paths: [P(14, 18, 14, 84, 50, 84, 50, 18), P(50, 84, 86, 84, 86, 18)] },
    { aspect: 1.0, paths: [P(16, 22, 16, 86, 50, 86, 84, 86, 84, 22), P(50, 86, 50, 36)] },
    { aspect: 1.1, paths: [P(12, 20, 18, 88, 50, 22, 82, 88, 88, 18)] },
    { aspect: 1.0, paths: [P(16, 38, 20, 88), P(20, 88, 48, 42, 76, 88), P(76, 88, 86, 12)] },
  ],
  ת: [
    { aspect: 0.88, paths: [P(20, 16, 82, 16, 82, 88), P(20, 16, 20, 88, 42, 88)] },
    { aspect: 0.9, paths: [P(18, 16, 84, 16, 84, 88), P(18, 16, 18, 88), P(18, 88, 44, 88)] },
  ],
};

export function strokeModels(expected: string): StrokeModel[] {
  return MODELS[modelGlyph(expected)] ?? [];
}

export function strokeModelCount(expected: string): number {
  return strokeModels(expected).length;
}

export function strokeModel(expected: string, index = 0): StrokeModel | null {
  const all = strokeModels(expected);
  if (!all.length) return null;
  return all[((index % all.length) + all.length) % all.length];
}

function dist(a: InkPoint, b: InkPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function densify(path: InkPoint[], step = 6): InkPoint[] {
  const out: InkPoint[] = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const n = Math.max(1, Math.round(dist(a, b) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  if (path.length) out.push(path[path.length - 1]);
  return out;
}

function flatten(strokes: InkStroke[]): InkPoint[] {
  return strokes.flatMap((s) => (s.length === 1 ? s : densify(s)));
}

function thin(pts: InkPoint[], max = 72): InkPoint[] {
  if (pts.length <= max) return pts;
  const out: InkPoint[] = [];
  const step = (pts.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) out.push(pts[Math.round(i * step)]);
  return out;
}

function bbox(pts: InkPoint[]) {
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

/** Fit ink into 0–100, filling the box. Aspect is scored separately. */
function toUnit(pts: InkPoint[]): InkPoint[] {
  const b = bbox(pts);
  return pts.map((p) => ({
    x: ((p.x - b.minX) / b.w) * 100,
    y: ((p.y - b.minY) / b.h) * 100,
  }));
}

function nearest(p: InkPoint, cloud: InkPoint[]): number {
  let best = Infinity;
  for (const q of cloud) {
    const d = dist(p, q);
    if (d < best) best = d;
  }
  return best;
}

function coverage(from: InkPoint[], to: InkPoint[], limit: number): number {
  if (!from.length) return 0;
  let hit = 0;
  const lim2 = limit * limit;
  for (const p of from) {
    let best = Infinity;
    for (const q of to) {
      const d = (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y);
      if (d < best) best = d;
      if (best <= lim2) break;
    }
    if (best <= lim2) hit += 1;
  }
  return hit / from.length;
}

type Cloud = { id: string; aspect: number; pts: InkPoint[] };
let CLOUDS: Cloud[] | null = null;
function modelClouds(): Cloud[] {
  if (CLOUDS) return CLOUDS;
  CLOUDS = [];
  for (const id of Object.keys(MODELS)) {
    for (const model of MODELS[id]) {
      CLOUDS.push({
        id,
        aspect: model.aspect,
        pts: thin(toUnit(model.paths.flatMap((p) => densify(p)))),
      });
    }
  }
  return CLOUDS;
}

export function rankStrokeModels(strokes: InkStroke[]): { id: string; score: number; cover: number; extra: number }[] {
  const ink = flatten(strokes);
  if (ink.length < 6) return [];
  const b = bbox(ink);
  if (b.w < 8 && b.h < 8) return [];

  const inkU = thin(toUnit(ink));
  const aInk = b.w / b.h;
  const bestById = new Map<string, { score: number; cover: number; extra: number }>();
  for (const model of modelClouds()) {
    const cover = coverage(model.pts, inkU, 12);
    const extra = coverage(inkU, model.pts, 13);
    const rel = aInk > model.aspect ? aInk / model.aspect : model.aspect / aInk;
    const aspectMul = rel > 2.2 ? 0.6 : rel > 1.7 ? 0.75 : rel > 1.4 ? 0.9 : 1;
    const score = (cover * 0.5 + extra * 0.5) * aspectMul;
    const prev = bestById.get(model.id);
    if (!prev || score > prev.score) bestById.set(model.id, { score, cover, extra });
  }
  const ranked = [...bestById.entries()].map(([id, v]) => ({ id, ...v }));
  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

/** Chamfer a live scribble against stored unit-space paths (a user’s own sample). */
export function scoreInkToPaths(
  strokes: InkStroke[],
  paths: InkPoint[][],
): { score: number; cover: number; extra: number } {
  const ink = flatten(strokes);
  if (ink.length < 6 || !paths.length) return { score: 0, cover: 0, extra: 0 };
  const modelPts = thin(toUnit(paths.flatMap((p) => densify(p))));
  const inkU = thin(toUnit(ink));
  const cover = coverage(modelPts, inkU, 14);
  const extra = coverage(inkU, modelPts, 15);
  return { score: cover * 0.5 + extra * 0.5, cover, extra };
}

export function matchStrokeModel(strokes: InkStroke[], expected: string): { score: number; cover: number; extra: number } | null {
  const id = modelGlyph(expected);
  if (!MODELS[id]) return null;
  return rankStrokeModels(strokes).find((r) => r.id === id) ?? { score: 0, cover: 0, extra: 0 };
}

export function modelToPad(
  expected: string,
  width: number,
  height: number,
  region: { top: number; bottom: number },
  index = 0,
): InkPoint[][] {
  const model = strokeModel(expected, index);
  if (!model) return [];
  const padH = height * (region.bottom - region.top);
  const padW = Math.min(width * 0.62, padH * Math.max(model.aspect, 0.32) * 1.28);
  const ox = (width - padW) / 2;
  const oy = height * region.top;
  return model.paths.map((path) =>
    path.map((p) => ({
      x: ox + (p.x / 100) * padW,
      y: oy + (p.y / 100) * padH,
    })),
  );
}

/** Cut densified paths to a 0–1 follow progress (for the moving ghost). */
export function clipPaths(paths: InkPoint[][], t: number): InkPoint[][] {
  const flat = paths.map((p) => densify(p, 3.2));
  const lens = flat.map((p) => {
    let n = 0;
    for (let i = 1; i < p.length; i++) n += dist(p[i - 1], p[i]);
    return Math.max(n, 0.001);
  });
  const total = lens.reduce((s, n) => s + n, 0);
  let remain = Math.max(0, Math.min(1, t)) * total;
  const out: InkPoint[][] = [];
  for (let i = 0; i < flat.length; i++) {
    if (remain <= 0) break;
    const path = flat[i];
    if (remain >= lens[i]) {
      out.push(path);
      remain -= lens[i];
      continue;
    }
    const cut: InkPoint[] = [path[0]];
    let used = 0;
    for (let k = 1; k < path.length; k++) {
      const step = dist(path[k - 1], path[k]);
      if (used + step >= remain) {
        const f = step < 1e-6 ? 1 : (remain - used) / step;
        cut.push({
          x: path[k - 1].x + (path[k].x - path[k - 1].x) * f,
          y: path[k - 1].y + (path[k].y - path[k - 1].y) * f,
        });
        break;
      }
      cut.push(path[k]);
      used += step;
    }
    out.push(cut);
    remain = 0;
  }
  return out;
}
